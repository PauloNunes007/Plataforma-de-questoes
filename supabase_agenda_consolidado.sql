-- ============================================================
-- QUESTLY — AGENDA / CALENDÁRIO: estado final, em um script só
--
-- RODE ESTE ARQUIVO E SÓ ELE. Não precisa rodar (nem re-rodar)
-- supabase_tarefas_semanais.sql, supabase_sessoes_agenda.sql ou
-- supabase_agenda_metas.sql — este aqui leva a tabela `tarefas` ao estado
-- final independentemente do que já rodou, em que ordem, e de quantas vezes.
-- Pode rodar de novo quando quiser.
--
-- POR QUE ELE EXISTE
-- -----------------------------------------------------------
-- Os três scripts acima eram uma corrente: cada um assumia que o anterior já
-- tinha rodado. Duas coisas davam errado com isso, e as duas aconteceram em
-- produção:
--
--   1. RODAR FORA DE ORDEM DESFAZ TUDO. O SQL Editor do Supabase executa o
--      script colado como UMA transação: se o último statement falha, os
--      anteriores são revertidos junto. Rodar `agenda_metas` antes de
--      `sessoes_agenda` faz o CHECK de `tipo` estourar (a coluna `tipo` ainda
--      não existe) e leva embora o `add column meta_questoes` que vinha antes
--      no mesmo arquivo. Como `criarTarefaAction` sempre manda `meta_questoes`
--      no INSERT — inclusive pra tarefa e sessão comuns, com valor null —,
--      TODO insert em `tarefas` passa a falhar, não só o de meta.
--
--   2. RE-RODAR NA ORDEM CERTA PODE PIORAR. `supabase_sessoes_agenda.sql`
--      recria `tarefas_tipo_check` com apenas ('tarefa','sessao'). Rodá-lo
--      DEPOIS de `agenda_metas` (que é exatamente o que se faz ao tentar
--      "consertar a ordem") REMOVE 'meta' do CHECK: definir meta volta a
--      falhar, agora com 23514 em vez de 42703. É uma armadilha que sobrevive
--      a quantas tentativas você fizer, porque cada tentativa desfaz metade da
--      anterior.
--
-- A saída pra isso não é acertar a ordem: é não ter ordem. Tudo aqui é
-- ADD COLUMN IF NOT EXISTS / drop+create de constraint / create index if not
-- exists, declarando o estado FINAL de uma vez.
--
-- Não há nada a migrar de dado: as colunas nascem nulas (ou com o default
-- 'tarefa' em `tipo`), que é exatamente o que uma tarefa antiga significa.
-- ============================================================

-- ------------------------------------------------------------
-- 1. A tabela
-- ------------------------------------------------------------
-- Um item da agenda é sempre do aluno e sempre amarrado a UMA data. É o que
-- separa `tarefas` de `rotina_semanal` (recorrente, por dia da semana, e que
-- alimenta o mission-engine — esta aqui não alimenta nada).
create table if not exists tarefas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references subjects(id) on delete set null,
  nome text not null,
  descricao text,
  data date not null,
  concluida boolean not null default false,
  criado_em timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. As três coisas que cabem num dia
-- ------------------------------------------------------------
-- MESMA tabela pros três de propósito: cada um é uma linha do aluno presa a
-- uma data, com a mesma RLS. Separar em três tabelas obrigaria o calendário a
-- fazer três queries e unir três arrays pra desenhar UM dia. `tipo` diz qual é
-- qual:
--   'tarefa' — afazer solto, sem horário;
--   'sessao' — bloco de estudo com `hora` e `duracao_min`;
--   'meta'   — alvo de `meta_questoes` questões numa disciplina naquele dia.
alter table tarefas add column if not exists tipo text not null default 'tarefa';
alter table tarefas add column if not exists hora time;
alter table tarefas add column if not exists duracao_min integer;
alter table tarefas add column if not exists meta_questoes integer;

-- O PROGRESSO DA META NÃO MORA AQUI, de propósito. Quantas questões o aluno
-- fez naquele dia naquela disciplina é recontado na leitura, de
-- question_attempts -> missions (subject_id, data) — ver
-- web/src/lib/agenda/agenda-data.ts. Um contador nesta linha seria um segundo
-- lugar pra mesma verdade, e o jeito óbvio de forjá-la.

-- ------------------------------------------------------------
-- 3. Regras de valor
-- ------------------------------------------------------------
-- drop+create porque o Postgres não tem ADD CONSTRAINT IF NOT EXISTS. É esse
-- par que torna o arquivo repetível — e é aqui que a lista de `tipo` fica
-- COMPLETA, em vez de ser encurtada por um script antigo.
alter table tarefas drop constraint if exists tarefas_tipo_check;
alter table tarefas add constraint tarefas_tipo_check
  check (tipo in ('tarefa', 'sessao', 'meta'));

-- 600min = 10h. Acima disso não é um bloco de estudo, é erro de digitação.
alter table tarefas drop constraint if exists tarefas_duracao_check;
alter table tarefas add constraint tarefas_duracao_check
  check (duracao_min is null or (duracao_min > 0 and duracao_min <= 600));

-- 500 questões num dia, idem.
alter table tarefas drop constraint if exists tarefas_meta_check;
alter table tarefas add constraint tarefas_meta_check
  check (meta_questoes is null or (meta_questoes > 0 and meta_questoes <= 500));

-- ------------------------------------------------------------
-- 4. RLS
-- ------------------------------------------------------------
-- Owner-only, o mesmo padrão de rotina_semanal. Vale pras colunas todas —
-- coluna nova herda a policy da tabela, não existe policy por coluna aqui.
alter table tarefas enable row level security;

drop policy if exists "usuario gerencia as proprias tarefas" on tarefas;
create policy "usuario gerencia as proprias tarefas"
on tarefas for all
using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------------
-- 5. Índices
-- ------------------------------------------------------------
-- O lookup que o calendário e a home fazem: itens de um aluno num intervalo.
create index if not exists idx_tarefas_user_data on tarefas (user_id, data);
-- E a ordem do relógio dentro do dia.
create index if not exists idx_tarefas_user_data_hora on tarefas (user_id, data, hora);

-- ------------------------------------------------------------
-- 6. Conferência — leia a saída
-- ------------------------------------------------------------
-- Rodar sem erro não prova que ficou certo (rodar fora de ordem também "não
-- dava erro": revertia calado). Estas duas consultas mostram o estado final.
-- O esperado está escrito ao lado; se bater, a agenda está boa.

-- Esperado: 11 linhas, entre elas tipo / hora / duracao_min / meta_questoes.
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'tarefas'
order by ordinal_position;

-- Esperado: tarefas_tipo_check citando 'tarefa', 'sessao' E 'meta';
-- tarefas_duracao_check com 600; tarefas_meta_check com 500.
select con.conname, pg_get_constraintdef(con.oid) as definicao
from pg_constraint con
join pg_class rel on rel.oid = con.conrelid
join pg_namespace ns on ns.oid = rel.relnamespace
where ns.nspname = 'public' and rel.relname = 'tarefas' and con.contype = 'c'
order by con.conname;
