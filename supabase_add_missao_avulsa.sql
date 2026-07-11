-- ============================================================
-- QUESTLY — marca missões criadas pela prática livre (tela de
-- Disciplinas), pra elas não serem confundidas com a missão do
-- dia gerada automaticamente pelo mission-engine.
-- Rode isso no SQL Editor do Supabase. Idempotente, não mexe em
-- nenhuma linha existente (fica false, ou seja, "missão do dia").
-- ============================================================

alter table missions add column if not exists avulsa boolean default false;
