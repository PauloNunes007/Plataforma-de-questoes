"use server";

import { createClient } from "@/lib/supabase/server";
import { questlySalvarRotina } from "@/lib/questly/rotina-engine";

export type Boss = { id: string; nome: string; data_prova: string };
export type SubjectComBosses = { id: string; nome: string; nota_desejada: number; bosses: Boss[] };

async function buscarSubjectsComBosses(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<SubjectComBosses[]> {
  const { data } = await supabase
    .from("subjects")
    .select("id, nome, nota_desejada, bosses(id, nome, data_prova)")
    .eq("user_id", userId)
    .order("nome");
  return (data as SubjectComBosses[]) || [];
}

const USERNAME_CARENCIA_DIAS = 15;
const USERNAME_CARENCIA_MS = USERNAME_CARENCIA_DIAS * 24 * 60 * 60 * 1000;
const USERNAME_REGEX = /^[a-z0-9][a-z0-9_.]{2,19}$/;
const NOME_MIN = 2;
const NOME_MAX = 40;

// Nome de exibição (dashboard/sidebar). Desde o username
// (supabase_username.sql) ele deixou de ser a identidade pública do
// ranking, então perdeu a unicidade e a carência — troca livre.
export async function salvarNomeAction(
  novoNomeBruto: string,
): Promise<{ error: null; nome: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const novoNome = novoNomeBruto.trim().replace(/\s+/g, " ");
  if (novoNome.length < NOME_MIN) return { error: `O nome precisa ter pelo menos ${NOME_MIN} caracteres.` };
  if (novoNome.length > NOME_MAX) return { error: `O nome pode ter no máximo ${NOME_MAX} caracteres.` };

  const { error } = await supabase.from("profiles").update({ nome: novoNome }).eq("id", user.id);
  if (error) {
    console.error("Erro ao salvar nome:", error);
    return { error: "Não foi possível salvar seu nome." };
  }

  return { error: null, nome: novoNome };
}

// Username público (@handle) — é o que aparece no ranking. Três travas:
// formato restrito, único entre todos os alunos (case-insensitive) e no
// máximo uma troca a cada 15 dias. Retorna o novo "username_alterado_em"
// pra UI recalcular a próxima data liberada.
export async function salvarUsernameAction(
  brutoDigitado: string,
): Promise<{ error: null; username: string; usernameAlteradoEm: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const novo = brutoDigitado.trim().replace(/^@+/, "").toLowerCase();
  if (!USERNAME_REGEX.test(novo)) {
    return {
      error:
        "Username inválido: use 3 a 20 caracteres entre letras minúsculas, números, ponto e underline, começando com letra ou número.",
    };
  }

  const { data: perfilAtual } = await supabase
    .from("profiles")
    .select("username, username_alterado_em")
    .eq("id", user.id)
    .single();

  // Igual ao atual → nada a fazer, não consome a carência.
  if (perfilAtual?.username === novo) {
    return { error: null, username: novo, usernameAlteradoEm: perfilAtual.username_alterado_em ?? "" };
  }

  if (perfilAtual?.username && perfilAtual?.username_alterado_em) {
    const decorrido = Date.now() - new Date(perfilAtual.username_alterado_em).getTime();
    if (decorrido < USERNAME_CARENCIA_MS) {
      const diasRestantes = Math.ceil((USERNAME_CARENCIA_MS - decorrido) / (24 * 60 * 60 * 1000));
      return {
        error: `Você só pode trocar o username a cada ${USERNAME_CARENCIA_DIAS} dias. Faltam ${diasRestantes} dia(s).`,
      };
    }
  }

  // Unicidade (o índice único é a rede de segurança contra corrida;
  // aqui a checagem dá uma mensagem amigável).
  const { data: colisao } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", novo)
    .neq("id", user.id)
    .limit(1)
    .maybeSingle();
  if (colisao) return { error: "Esse username já está em uso. Tente outro." };

  const agora = new Date().toISOString();
  const { error } = await supabase
    .from("profiles")
    .update({ username: novo, username_alterado_em: agora })
    .eq("id", user.id);

  if (error) {
    // 23505 = unique_violation (corrida perdida pro índice único).
    if (error.code === "23505") return { error: "Esse username já está em uso. Tente outro." };
    console.error("Erro ao salvar username:", error);
    return { error: "Não foi possível salvar seu username." };
  }

  return { error: null, username: novo, usernameAlteradoEm: agora };
}

export async function salvarRotinaAction(dias: string[], tempoDiarioMin: number | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const { error } = await supabase
    .from("profiles")
    .update({ dias_disponiveis: dias, tempo_diario_min: tempoDiarioMin })
    .eq("id", user.id);

  if (error) {
    console.error("Erro ao salvar rotina:", error);
    return { error: "Não foi possível salvar sua rotina." };
  }
  return { error: null };
}

export async function criarDisciplinaAction(nome: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  let materiaId: string | null = null;
  const { data: materiaExistente } = await supabase.from("materias").select("id").eq("nome", nome).maybeSingle();
  if (materiaExistente) {
    materiaId = materiaExistente.id;
  } else {
    const { data: materiaNova, error: materiaError } = await supabase
      .from("materias")
      .insert({ nome })
      .select()
      .single();
    if (!materiaError) materiaId = materiaNova.id;
  }

  const { data: subject, error: subjectError } = await supabase
    .from("subjects")
    .insert({ user_id: user.id, nome, nota_desejada: 8, materia_id: materiaId })
    .select()
    .single();

  if (subjectError || !subject) {
    console.error("Erro ao criar disciplina:", subjectError);
    return { error: "Não foi possível adicionar essa disciplina." };
  }

  await supabase.from("campaigns").insert({ user_id: user.id, subject_id: subject.id });

  return { subjects: await buscarSubjectsComBosses(supabase, user.id), error: null };
}

export async function removerDisciplinaAction(subjectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  await supabase.from("bosses").delete().eq("subject_id", subjectId);
  await supabase.from("campaigns").delete().eq("subject_id", subjectId);
  await supabase.from("rotina_semanal").delete().eq("subject_id", subjectId);

  const { error } = await supabase.from("subjects").delete().eq("id", subjectId);
  if (error) {
    console.error("Erro ao remover disciplina:", error);
    return {
      error: "Não foi possível remover essa disciplina — ela ainda tem missões ou questões vinculadas a ela.",
    };
  }

  return { subjects: await buscarSubjectsComBosses(supabase, user.id), error: null };
}

export async function salvarNotaAction(subjectId: string, nota: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("subjects").update({ nota_desejada: nota }).eq("id", subjectId);
  if (error) {
    console.error("Erro ao salvar nota:", error);
    return { error: "Não foi possível salvar a nota desejada." };
  }
  return { error: null };
}

export async function adicionarProvaAction(subjectId: string, proximoNumero: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const hoje = new Date().toISOString().slice(0, 10);
  const { error } = await supabase
    .from("bosses")
    .insert({ subject_id: subjectId, nome: `P${proximoNumero}`, data_prova: hoje });

  if (error) {
    console.error("Erro ao adicionar prova:", error);
    return { error: "Não foi possível adicionar a prova." };
  }

  return { subjects: await buscarSubjectsComBosses(supabase, user.id), error: null };
}

export async function atualizarProvaAction(bossId: string, campos: { nome?: string; data_prova?: string }) {
  const supabase = await createClient();
  const { error } = await supabase.from("bosses").update(campos).eq("id", bossId);
  if (error) {
    console.error("Erro ao atualizar prova:", error);
    return { error: "Não foi possível salvar essa prova." };
  }
  return { error: null };
}

export async function removerProvaAction(bossId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const { error } = await supabase.from("bosses").delete().eq("id", bossId);
  if (error) {
    console.error("Erro ao remover prova:", error);
    return { error: "Não foi possível remover essa prova." };
  }

  return { subjects: await buscarSubjectsComBosses(supabase, user.id), error: null };
}

export async function salvarGradeAction(rotinaPorDia: Record<string, string[]>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const { error } = await questlySalvarRotina(supabase, user.id, rotinaPorDia);
  if (error) return { error: "Não foi possível salvar sua grade semanal." };
  return { error: null };
}

export async function uploadFotoAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const file = formData.get("file") as File | null;
  if (!file) return { error: "Nenhum arquivo enviado." };

  const path = `${user.id}/avatar.jpg`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: "image/jpeg" });

  if (uploadError) {
    console.error("Erro no upload do avatar:", uploadError);
    return { error: "Não foi possível enviar sua foto." };
  }

  const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = `${pub.publicUrl}?v=${Date.now()}`;

  const { error: profileError } = await supabase.from("profiles").update({ foto_url: url }).eq("id", user.id);
  if (profileError) {
    console.error("Erro ao salvar foto no profile:", profileError);
    return { error: "A foto subiu, mas não foi possível salvá-la no seu perfil." };
  }

  return { url, error: null };
}

export async function removerFotoAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  await supabase.storage.from("avatars").remove([`${user.id}/avatar.jpg`]);
  const { error } = await supabase.from("profiles").update({ foto_url: null }).eq("id", user.id);
  if (error) {
    console.error("Erro ao remover foto:", error);
    return { error: "Não foi possível remover a foto." };
  }
  return { error: null };
}
