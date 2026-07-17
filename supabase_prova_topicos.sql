-- ============================================================
-- QUESTLY — ESCOPO DE TÓPICOS POR PROVA (bosses.topico_ids)
-- Rode no SQL Editor do Supabase, DEPOIS de
-- supabase_conteudo_compartilhado.sql. Idempotente.
--
-- O dado obrigatório que faltava pro preditivo ser honesto: o
-- sistema projetava a nota (e montava a rota do GPS) sobre TODOS
-- os tópicos `cai_na_prova` da matéria — uma flag global da
-- ementa, não a prova real do aluno. Uma P1 que cobre 4 de 12
-- tópicos saía com a nota esmagada por 8 tópicos que nem caem, e
-- o GPS recomendava estudar conteúdo irrelevante pra prova.
--
-- `topico_ids` guarda quais tópicos o professor disse que caem
-- NESSA prova (uuid[] referenciando topicos.id, mesmo formato do
-- missions.topic_ids). NULL ou vazio = escopo não definido →
-- fallback pro comportamento antigo (todos os cai_na_prova), então
-- nenhuma conta existente muda até o aluno marcar o escopo.
--
-- Editado no card do Boss em /trilha ("O que cai nessa prova?").
-- Consumido por: dashboard-data.ts (nota projetada + tópicos em
-- risco + rota do GPS) e trilha-data.ts (projeção da disciplina +
-- selos de risco por tópico). Sem mudança de RLS: bosses já é
-- escrita-dono via subject.
-- ============================================================

alter table bosses add column if not exists topico_ids uuid[];

comment on column bosses.topico_ids is
  'Tópicos (topicos.id) que caem NESTA prova, marcados pelo aluno. NULL/vazio = escopo não definido (projeção usa todos os cai_na_prova da matéria).';
