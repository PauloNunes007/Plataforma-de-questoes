-- ============================================================
-- QUESTLY — Simulados (provas cronometradas por instituição)
-- Rodar DEPOIS de supabase_conteudo_compartilhado.sql (precisa de
-- "profiles"/"questions" já existentes) e de supabase_plano_pro.sql (o
-- limite do plano free é checado no servidor, mas nada aqui depende do
-- schema do Pro — a ordem é só recomendação). Migração aditiva e idempotente.
--
-- O aluno monta um "simulado" no estilo da própria universidade (ex.: UFF):
-- escolhe disciplinas/tópicos, duração e quantidade; o app sorteia questões
-- reais daquela instituição (questions.instituicao) de anos aleatórios
-- (questions.ano) e roda uma prova cronometrada — SEM feedback por questão,
-- resultado só no fim. Cada linha aqui é UM simulado do aluno.
--
-- Deliberadamente self-contained: NÃO alimenta XP/liga/streak nem o motor de
-- maestria (um simulado é um diagnóstico cronometrado, não uma missão diária;
-- misturar abriria porta pra farmar ranking e duplicar contagem). As respostas
-- ficam no próprio registro (respostas JSONB) pra permitir retomar uma prova
-- em andamento e revisar questão a questão depois. Sem relação com missions.
-- ============================================================

create table if not exists simulados_aluno (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null,
  -- snapshot da instituição casada no momento da criação (ex.: "UFF") — o
  -- texto exato de questions.instituicao usado no sorteio.
  instituicao text,
  -- escopo escolhido pelo aluno (informativo/pra remontar) + as questões de
  -- fato sorteadas e fixadas na ordem de aplicação.
  materia_ids uuid[] not null default '{}',
  topico_ids uuid[] not null default '{}',
  question_ids uuid[] not null default '{}',
  duracao_min integer not null,
  qtd_questoes integer not null,
  -- em_andamento -> concluido (finalizou/estourou o tempo) ou abandonado.
  status text not null default 'em_andamento'
    check (status in ('em_andamento', 'concluido', 'abandonado')),
  -- mapa question_id -> letra marcada; autossalvo enquanto a prova roda, pra
  -- sobreviver a refresh/queda de conexão e pra revisão pós-prova.
  respostas jsonb not null default '{}'::jsonb,
  iniciado_em timestamptz not null default now(),
  concluido_em timestamptz,
  tempo_gasto_seg integer,
  acertos integer,
  total integer,
  -- nota 0..10 (numeric pra casa decimal); null enquanto não concluído.
  nota numeric(4, 2),
  criado_em timestamptz not null default now()
);

alter table simulados_aluno enable row level security;

drop policy if exists "usuario gerencia os proprios simulados" on simulados_aluno;
create policy "usuario gerencia os proprios simulados"
on simulados_aluno for all
using (user_id = auth.uid()) with check (user_id = auth.uid());

-- histórico do aluno (lista/gráfico de evolução) e checagem do limite semanal
-- do plano free filtram por user_id, mais recentes primeiro.
create index if not exists idx_simulados_user_criado
  on simulados_aluno (user_id, criado_em desc);
