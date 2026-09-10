-- ============================================================
-- QUESTLY — Simulados: analítico (tempo por questão)
-- Rodar DEPOIS de supabase_simulados.sql. Migração aditiva e idempotente.
--
-- O resultado do simulado passou a responder "onde eu preciso melhorar?" e não
-- só "quanto eu tirei": desempenho por disciplina/tópico/dificuldade, ritmo da
-- prova e diagnóstico de pressa/lentidão. Quase tudo isso já sai das questões
-- sorteadas + respostas, MENOS o tempo gasto em cada questão — daí esta coluna.
--
-- `tempos` é um mapa question_id -> segundos gastos naquela questão, acumulado
-- pelo runner enquanto a prova roda (autossalvo junto das respostas, então
-- sobrevive a refresh) e fechado no finalizar. É best-effort e pode vir
-- parcial/vazio (simulados antigos, aba fechada na marra): TODA leitura trata
-- ausência como "sem dado" e simplesmente esconde as visões de tempo, nunca
-- assume zero.
--
-- Sem mudança de RLS: a coluna herda a policy dono-only já existente na tabela.
-- ============================================================

alter table simulados_aluno
  add column if not exists tempos jsonb not null default '{}'::jsonb;

comment on column simulados_aluno.tempos is
  'Mapa question_id -> segundos gastos na questão (best-effort, pode ser parcial). Alimenta o ritmo da prova e o diagnóstico de pressa no resultado.';
