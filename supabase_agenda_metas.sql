-- ============================================================
-- QUESTLY — Metas de questões na agenda (calendário dedicado)
-- Rodar DEPOIS de supabase_sessoes_agenda.sql. Migração aditiva e
-- idempotente (ADD COLUMN IF NOT EXISTS + drop/create de CHECK).
--
-- POR QUE: a agenda sabia marcar duas coisas — um afazer sem horário
-- ("tarefa") e um bloco de estudo com hora e duração ("sessao"). Faltava a
-- terceira, que é a que o aluno realmente combina consigo mesmo na véspera da
-- prova: "quarta-feira eu faço 30 questões de Cálculo II". Isso não é um
-- afazer (tem número e disciplina) nem um bloco de tempo (o que importa não é
-- quanto tempo, é quantas questões).
--
-- MESMA tabela `tarefas`, pelo mesmo motivo de supabase_sessoes_agenda.sql: é
-- um item do aluno amarrado a UMA data, owner-only, e separar obrigaria o
-- calendário a fazer query a mais e unir arrays pra desenhar um dia. `tipo`
-- continua sendo quem diz qual é qual.
--
-- O PROGRESSO DA META NÃO É ARMAZENADO. Quantas questões o aluno já fez
-- naquele dia naquela disciplina é recontado na leitura, a partir de
-- `question_attempts` -> `missions` (subject_id, data). Guardar um contador
-- aqui criaria um segundo lugar pra mesma verdade e abriria o caminho óbvio de
-- forjar progresso escrevendo direto na linha.
--
-- Como sessão e tarefa, marcar meta NÃO gera missão, XP nem ofensiva:
-- planejar não é conquistar.
-- ============================================================

alter table tarefas add column if not exists meta_questoes integer;

-- `tipo`: 'tarefa' = item de lista; 'sessao' = bloco com horário;
-- 'meta' = alvo de N questões numa disciplina naquele dia.
-- (drop+create porque Postgres não tem ADD CONSTRAINT IF NOT EXISTS — assim a
-- migração continua idempotente.)
alter table tarefas drop constraint if exists tarefas_tipo_check;
alter table tarefas add constraint tarefas_tipo_check
  check (tipo in ('tarefa', 'sessao', 'meta'));

-- Teto de 500: acima disso não é meta de um dia, é erro de digitação.
alter table tarefas drop constraint if exists tarefas_meta_check;
alter table tarefas add constraint tarefas_meta_check
  check (meta_questoes is null or (meta_questoes > 0 and meta_questoes <= 500));

-- RLS: nada muda. A coluna herda a policy owner-only
-- "usuario gerencia as proprias tarefas" de supabase_tarefas_semanais.sql.
