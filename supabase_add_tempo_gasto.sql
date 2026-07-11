-- ============================================================
-- QUESTLY — coluna nova pra registrar o tempo real gasto na missão
-- Rode isso no SQL Editor do Supabase (é só essa linha, idempotente).
-- Não mexe em nenhuma linha existente.
-- ============================================================

alter table missions add column if not exists tempo_gasto_min integer;
