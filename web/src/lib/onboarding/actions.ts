"use server";

import { createClient } from "@/lib/supabase/server";
import { questlyNormalizarDia } from "@/lib/questly/shared";

// Portado de salvarCampanha() em questly_onboarding.html — grava
// profile (curso/universidade/semestre/nivel/dias/tempo) e, por
// disciplina escolhida: materia (busca ou cria a taxonomia
// compartilhada), subject, campaign, grade semanal padrão (todos os
// dias escolhidos) e bosses (só provas com data preenchida).

export type ProvaInput = { nome: string; data: string };
export type DisciplinaInput = { nome: string; nota: number; provas: ProvaInput[] };

export type SalvarCampanhaInput = {
  curso: string;
  universidade: string | null;
  semestre: number | null;
  nivel: string | null;
  dias: string[];
  tempoDiarioMin: number | null;
  disciplinas: DisciplinaInput[];
};

export async function salvarCampanhaAction(
  input: SalvarCampanhaInput,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Faça login novamente." };

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      curso: input.curso,
      universidade: input.universidade || null,
      semestre: input.semestre,
      nivel_conhecimento: input.nivel,
      dias_disponiveis: input.dias,
      tempo_diario_min: input.tempoDiarioMin,
    })
    .eq("id", user.id);

  if (profileError) {
    console.error("Erro ao salvar profile:", profileError);
    return { error: "Não foi possível salvar seus dados. Tente novamente." };
  }

  const diasNormalizados = input.dias.map(questlyNormalizarDia);

  for (const disc of input.disciplinas) {
    let materiaId: string | null = null;
    const { data: materiaExistente } = await supabase
      .from("materias")
      .select("id")
      .eq("nome", disc.nome)
      .maybeSingle();

    if (materiaExistente) {
      materiaId = materiaExistente.id;
    } else {
      const { data: materiaNova, error: materiaError } = await supabase
        .from("materias")
        .insert({ nome: disc.nome })
        .select()
        .single();
      if (materiaError) {
        console.error("Erro ao criar matéria", disc.nome, materiaError);
      } else {
        materiaId = materiaNova.id;
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
      continue;
    }

    await supabase.from("campaigns").insert({ user_id: user.id, subject_id: subject.id });

    if (diasNormalizados.length > 0) {
      await supabase.from("rotina_semanal").insert(
        diasNormalizados.map((dia) => ({ user_id: user.id, subject_id: subject.id, dia_semana: dia })),
      );
    }

    const provasValidas = disc.provas.filter((p) => p.data);
    for (const p of provasValidas) {
      await supabase.from("bosses").insert({ subject_id: subject.id, nome: p.nome, data_prova: p.data });
    }
  }

  return { error: null };
}
