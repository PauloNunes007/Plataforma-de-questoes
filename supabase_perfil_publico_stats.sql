-- ============================================================
-- QUESTLY — Estatística pública de perfil (questões respondidas)
-- Rodar DEPOIS de supabase_conteudo_compartilhado.sql (precisa de
-- "question_attempts" já existente). Migração aditiva e idempotente.
--
-- profiles já guarda xp_total (vitalício) ao lado de xp_semana
-- (semanal, zera toda segunda). questoes_total é o mesmo padrão pra
-- contagem de questões: um contador vitalício em "profiles" — que já
-- é lido publicamente por qualquer usuário autenticado (RLS) — porque
-- question_attempts é owner-only e não dá pra somar a tentativa de
-- OUTRO aluno na tela de ranking (card público do usuário). O
-- backfill soma o histórico existente uma vez; dali em diante quem
-- incrementa é a Server Action que fecha a missão (mesmo lugar que já
-- atualiza xp_total), em vez de recontar question_attempts toda hora.
-- ============================================================

alter table profiles add column if not exists questoes_total int not null default 0;

update profiles p
set questoes_total = coalesce(
  (select count(*) from question_attempts qa where qa.user_id = p.id),
  0
);
