-- ============================================================
-- QUESTLY — coluna nova pra fixar o conjunto exato de questões de
-- cada missão (usada pro tempo previsto ser a soma real das
-- questões escolhidas, não uma média de amostra aleatória).
-- Rode isso no SQL Editor do Supabase. Idempotente, não mexe em
-- nenhuma linha existente — missões antigas ficam com question_ids
-- vazio e continuam funcionando pelo caminho antigo (por tópico).
-- ============================================================

alter table missions add column if not exists question_ids uuid[];
