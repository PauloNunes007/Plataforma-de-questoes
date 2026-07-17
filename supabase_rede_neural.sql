-- ============================================================
-- QUESTLY — Rede neural de P(acerto) (ml_modelos + estatísticas por questão)
--
-- ORDEM: rodar DEPOIS de supabase_motor_maestria.sql (a rede treina em
-- cima do replay do BKT) e de supabase_seguranca_hardening.sql (mesmo
-- modelo de confiança: escrita só via service_role).
--
-- O que este arquivo faz:
--  1. Tabela `ml_modelos`: cada rodada de treino da rede (pesos JSON,
--     métricas de validação, se venceu o baseline BKT, se está ativa).
--     Leitura: qualquer autenticado (os pesos não são segredo e a
--     inferência roda com o cliente do próprio usuário no servidor).
--     Escrita: NENHUMA policy — só service_role (o treino é ação de
--     admin em web/src/lib/ml/treinar.ts).
--  2. `questions.tentativas_total`/`acertos_total`: contadores globais
--     por questão (feature "taxa da questão" da rede + futura exibição
--     "X% acertam esta"). Backfill recomputado de question_attempts
--     (idempotente: recalcula do zero a cada execução). Mantidos daí em
--     diante por registrarRespostaAction via service_role (questions é
--     write-admin-only desde o hardening).
-- ============================================================

-- 1) Tabela de modelos treinados -------------------------------------
create table if not exists public.ml_modelos (
  id uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  versao_features integer not null,
  pesos jsonb,
  metricas jsonb,
  motivo text,
  num_exemplos integer not null default 0,
  venceu_baseline boolean not null default false,
  ativo boolean not null default false
);

alter table public.ml_modelos enable row level security;

drop policy if exists "ml_modelos: leitura autenticada" on public.ml_modelos;
create policy "ml_modelos: leitura autenticada"
  on public.ml_modelos for select
  to authenticated
  using (true);

-- Sem policies de insert/update/delete: escrita exclusiva do service_role.

-- No máximo um modelo ativo por vez (backstop do update em treinarESalvar).
create unique index if not exists ml_modelos_um_ativo
  on public.ml_modelos ((true))
  where ativo;

-- 2) Contadores globais por questão ----------------------------------
alter table public.questions add column if not exists tentativas_total integer not null default 0;
alter table public.questions add column if not exists acertos_total integer not null default 0;

-- Backfill/recalculo a partir da fonte de verdade (question_attempts).
-- Roda como owner no SQL Editor, então enxerga as tentativas de todos.
update public.questions q
set tentativas_total = coalesce(s.t, 0),
    acertos_total    = coalesce(s.a, 0)
from (
  select question_id,
         count(*)                              as t,
         count(*) filter (where correta)       as a
  from public.question_attempts
  group by question_id
) s
where s.question_id = q.id;
