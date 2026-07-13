-- ============================================================
-- QUESTLY — Motor de Aprovação: maestria + estabilidade persistidas
-- Rodar DEPOIS de supabase_ciencia_aprendizagem.sql (precisa de
-- aluno_topico_progresso já existente). Aditiva e idempotente.
--
-- MUDANÇA DE DESIGN vs. supabase_ciencia_aprendizagem.sql:
--   Lá, maestria e estabilidade eram DERIVADAS em tempo real de
--   (taxa_acerto, num_questoes_respondidas, ultima_revisao) por
--   funções puras. O motor preditivo (motor-aprovacao.ts) exige que
--   ambas sejam ESTADO PERSISTIDO, porque:
--     - maestria é atualizada por Bayesian Knowledge Tracing, que é
--       SEQUENCIAL: cada posterior depende do prior da tentativa
--       anterior — não é reconstruível a partir de uma média.
--     - estabilidade cresce com o ESPAÇAMENTO entre revisões (efeito
--       de espaçamento): a mesma taxa_acerto com revisões bem
--       distribuídas gera memória mais forte que revisões amontoadas.
--       A média não carrega essa informação temporal.
--   taxa_acerto NÃO é removida: continua alimentando UI/telemetria e
--   serve de semente pro backfill abaixo.
--
-- O que muda no banco:
--   1. aluno_topico_progresso.maestria      numeric  [0,1]  (P de domínio, BKT)
--   2. aluno_topico_progresso.estabilidade  numeric  (meia-vida da memória, dias)
--   3. backfill único a partir do estado atual (ninguém perde progresso)
--   RLS: nenhuma mudança — as colunas herdam a policy owner-only
--        "usuario gerencia o proprio progresso" que já cobre a tabela.
-- ============================================================

-- 1. novas colunas ----------------------------------------------------
-- default NULL = "cold-start, sem estado do motor ainda". O motor trata
-- NULL como prior populacional; não confundir com maestria 0 (sabe nada,
-- mas já foi medido).
alter table aluno_topico_progresso add column if not exists maestria numeric;
alter table aluno_topico_progresso add column if not exists estabilidade numeric;

alter table aluno_topico_progresso drop constraint if exists atp_maestria_range;
alter table aluno_topico_progresso add constraint atp_maestria_range
  check (maestria is null or (maestria >= 0 and maestria <= 1));

alter table aluno_topico_progresso drop constraint if exists atp_estabilidade_pos;
alter table aluno_topico_progresso add constraint atp_estabilidade_pos
  check (estabilidade is null or estabilidade >= 0.5);

-- 2. backfill único (só linhas com histórico e ainda sem estado do motor)
--    Continuidade: quem já estudou não volta ao cold-start.
--
--    maestria semente = taxa_acerto encolhida rumo a um prior neutro
--      (0.3) quando há poucas questões — evita cravar 100% de domínio
--      em quem acertou 2/2. Fórmula de shrinkage: (acerto*n + 0.3*k)/(n+k),
--      k=5 (equivalente a 5 questões de "dúvida" a priori).
--
--    estabilidade semente = piso de 1.5 dia, crescido por volume*acurácia
--      (mesma intuição de "S cresce com volume × acurácia" já documentada).
update aluno_topico_progresso
set
  maestria = least(1.0, greatest(0.0,
    (coalesce(taxa_acerto, 0) * coalesce(num_questoes_respondidas, 0) + 0.3 * 5.0)
    / (coalesce(num_questoes_respondidas, 0) + 5.0)
  )),
  estabilidade = greatest(1.5,
    1.5 + coalesce(num_questoes_respondidas, 0) * coalesce(taxa_acerto, 0) * 0.30
  )
where maestria is null
  and coalesce(num_questoes_respondidas, 0) > 0;

-- 3. índice pra varredura do motor (busca o progresso do aluno por tópico)
create index if not exists idx_atp_user_topico
  on aluno_topico_progresso (user_id, topico_id);
