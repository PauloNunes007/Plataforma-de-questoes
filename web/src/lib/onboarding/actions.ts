"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { questlyNormalizarDia } from "@/lib/questly/shared";

// Portado de salvarCampanha() em questly_onboarding.html — grava
// profile (curso/universidade/semestre/nivel/dias/tempo) e, por
// disciplina escolhida: materia (busca ou cria a taxonomia
// compartilhada), subject, campaign, grade semanal padrão (todos os
// dias escolhidos) e bosses (só provas com data preenchida).

export type ProvaInput = { nome: string; data: string };
export type DisciplinaInput = { nome: string; nota: number; provas: ProvaInput[] };

export type SalvarCampanhaInput = {
  nome: string;
  curso: string;
  universidade: string | null;
  semestre: number | null;
  nivel: string | null;
  dias: string[];
  tempoDiarioMin: number | null;
  disciplinas: DisciplinaInput[];
  /** Null quando o aluno pulou a escolha — dá pra fazer depois em Configurações. */
  username: string | null;
};

// Mesmo formato/regra de supabase_username.sql — duplicado aqui em vez de
// importado de lib/configuracoes/actions.ts (convenção do repo: heurísticas
// pequenas ficam duplicadas por arquivo em vez de uma abstração compartilhada
// pra um único formato, ver COBERTURA_TOPICO_QUESTOES/iconePorNome).
const USERNAME_REGEX = /^[a-z0-9][a-z0-9_.]{2,19}$/;

// Checagem de disponibilidade em tempo real, chamada (debounced) pelo campo
// de username do wizard — não persiste nada, só confere formato + unicidade.
export async function verificarUsernameAction(usernameBruto: string): Promise<{ disponivel: boolean }> {
  const username = usernameBruto.trim().toLowerCase();
  if (!USERNAME_REGEX.test(username)) return { disponivel: false };

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", username)
    .limit(1)
    .maybeSingle();

  return { disponivel: !data };
}

export async function salvarCampanhaAction(
  input: SalvarCampanhaInput,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Faça login novamente." };

  const username = input.username?.trim().toLowerCase() || null;
  if (username) {
    if (!USERNAME_REGEX.test(username)) {
      return { error: "Username inválido: use 3 a 20 caracteres entre letras minúsculas, números, ponto e underline." };
    }
    // Revalidação autoritativa no submit final (a checagem em tempo real do
    // wizard pode ter ficado desatualizada por uma corrida rara).
    const { data: colisao } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", username)
      .neq("id", user.id)
      .limit(1)
      .maybeSingle();
    if (colisao) return { error: "Esse username já está em uso. Volte e escolha outro." };
  }

  const nome = input.nome.trim();
  if (!nome) return { error: "Diga como podemos te chamar." };

  // Upsert (não update): se a linha do profile ainda não existe — signup por
  // confirmação de email pode chegar aqui sem ela — um update casaria 0 linhas
  // em silêncio e o onboarding inteiro "salvaria" sem salvar nada.
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        nome,
        curso: input.curso,
        universidade: input.universidade || null,
        semestre: input.semestre,
        nivel_conhecimento: input.nivel,
        dias_disponiveis: input.dias,
        tempo_diario_min: input.tempoDiarioMin,
        ...(username ? { username, username_alterado_em: new Date().toISOString() } : {}),
      },
      { onConflict: "id" },
    );

  if (profileError) {
    // 23505 = unique_violation (corrida perdida pro índice único).
    if (profileError.code === "23505") return { error: "Esse username já está em uso. Volte e escolha outro." };
    console.error("Erro ao salvar profile:", profileError);
    return { error: "Não foi possível salvar seus dados. Tente novamente." };
  }

  const diasNormalizados = input.dias.map(questlyNormalizarDia);
  const disciplinasComFalha: string[] = [];

  // Idempotência: disciplina que o aluno já tem não é recriada — rodar o
  // onboarding de novo (ou um retry após erro parcial) não pode duplicar
  // subjects (aparecia em dobro nas listas/abas). Case-insensitive, mesmo
  // critério do índice único de supabase_onboarding_rls.sql.
  const { data: subjectsExistentes } = await supabase
    .from("subjects")
    .select("nome")
    .eq("user_id", user.id);
  const nomesExistentes = new Set((subjectsExistentes ?? []).map((s) => s.nome.trim().toLowerCase()));

  for (const disc of input.disciplinas) {
    if (nomesExistentes.has(disc.nome.trim().toLowerCase())) continue;
    let materiaId: string | null = null;
    const { data: materiaExistente } = await supabase
      .from("materias")
      .select("id")
      .eq("nome", disc.nome)
      .maybeSingle();

    if (materiaExistente) {
      materiaId = materiaExistente.id;
    } else {
      // Pós-hardening, INSERT em materias é admin-only (RLS) — mas o onboarding
      // precisa criar a taxonomia pra disciplinas fora do seed. Escrita
      // controlada (só o nome digitado) via service_role; sem a env, degrada
      // pra subject sem materia_id em vez de quebrar o cadastro.
      try {
        const { data: materiaNova, error: materiaError } = await createAdminClient()
          .from("materias")
          .insert({ nome: disc.nome })
          .select()
          .single();
        if (materiaError) {
          console.error("Erro ao criar matéria", disc.nome, materiaError);
        } else {
          materiaId = materiaNova.id;
        }
      } catch (e) {
        console.error("Sem service_role pra criar matéria", disc.nome, e);
      }
    }

    const { data: subject, error: subjectError } = await supabase
      .from("subjects")
      .insert({
        user_id: user.id,
        nome: disc.nome,
        nota_desejada: disc.nota,
        materia_id: materiaId,
      })
      .select()
      .single();

    if (subjectError || !subject) {
      console.error("Erro ao criar disciplina", disc.nome, subjectError);
      disciplinasComFalha.push(disc.nome);
      continue;
    }

    const { error: campanhaError } = await supabase
      .from("campaigns")
      .insert({ user_id: user.id, subject_id: subject.id });
    // Não-fatal: campaigns é só o vínculo legado, nada no app lê — mas o erro
    // precisa aparecer no log (era engolido; ver supabase_onboarding_rls.sql).
    if (campanhaError) console.error("Erro ao criar campaign", disc.nome, campanhaError);

    if (diasNormalizados.length > 0) {
      const { error: rotinaError } = await supabase.from("rotina_semanal").insert(
        diasNormalizados.map((dia) => ({ user_id: user.id, subject_id: subject.id, dia_semana: dia })),
      );
      if (rotinaError) console.error("Erro ao criar rotina", disc.nome, rotinaError);
    }

    const provasValidas = disc.provas.filter((p) => p.data);
    for (const p of provasValidas) {
      const { error: bossError } = await supabase
        .from("bosses")
        .insert({ subject_id: subject.id, nome: p.nome, data_prova: p.data });
      if (bossError) console.error("Erro ao criar prova", disc.nome, p.nome, bossError);
    }
  }

  if (disciplinasComFalha.length === input.disciplinas.length && input.disciplinas.length > 0) {
    return { error: "Não foi possível salvar suas disciplinas. Tente novamente." };
  }
  if (disciplinasComFalha.length > 0) {
    return {
      error: `Algumas disciplinas não foram salvas (${disciplinasComFalha.join(", ")}). Você pode adicioná-las depois em Configurações.`,
    };
  }

  return { error: null };
}
