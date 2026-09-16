// Modo de estudo — a plataforma é MODULAR (repasse de 2026-09-16).
//
// Nem todo aluno quer que o app decida o dia dele. Quem está numa disciplina
// sem data de prova marcada, quem só quer treinar questão, quem entrou pelo
// ranking — pra essa pessoa, "sua missão de hoje", "cerco ao Boss" e a
// projeção da nota não são ajuda, são ruído de uma promessa que ela não fez.
//
//   guiado  → o motor planeja: missão do dia, grade semanal, Boss, projeção
//             pra data da prova.
//   livre   → só o que o aluno pede: Banco de Questões (listas na hora),
//             Simulados, Ranking, Trilha (como mapa de progresso) e o
//             calendário de tarefas. Nada de missão, nada de Boss.
//
// É uma decisão de EXIBIÇÃO, não de dados: mudar pra 'livre' não apaga
// missões, provas nem progresso — volta tudo intacto se o aluno voltar pro
// guiado. Ver supabase_modo_estudo.sql.
export type ModoEstudo = "guiado" | "livre";

export const MODO_ESTUDO_PADRAO: ModoEstudo = "guiado";

/** Lê o modo de um perfil, tolerando null/valor desconhecido (conta criada
 *  antes da migração, ou linha ainda sem o default aplicado). */
export function questlyModoEstudo(profile: { modo_estudo?: string | null } | null | undefined): ModoEstudo {
  return profile?.modo_estudo === "livre" ? "livre" : MODO_ESTUDO_PADRAO;
}

export function ehGuiado(profile: { modo_estudo?: string | null } | null | undefined): boolean {
  return questlyModoEstudo(profile) === "guiado";
}
