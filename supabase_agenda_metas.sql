-- ============================================================
-- QUESTLY — Metas de questões na agenda (calendário dedicado)
--
-- SUPERSEDIDO por supabase_agenda_consolidado.sql. Rode AQUELE: ele declara o
-- estado final da tabela `tarefas` de uma vez e nao depende de ordem nenhuma.
-- Este arquivo fica como registro do que foi rodado na epoca.
--
-- Rodar DEPOIS de supabase_sessoes_agenda.sql — SEM ELE, ESTE SCRIPT FALHA
-- E É REVERTIDO POR INTEIRO. A constraint tarefas_tipo_check abaixo
-- referencia a coluna `tipo`, que só existe depois de supabase_sessoes_agenda.sql
-- rodar. O SQL Editor do Supabase executa um script colado como uma única
-- transação implícita (comportamento padrão do Postgres pra múltiplos
-- comandos separados por ";" numa mesma mensagem): se UM statement falhar,
-- TODOS os anteriores desse mesmo "Run" são desfeitos — inclusive o
-- `add column meta_questoes` que vem antes na ordem do arquivo. Isso já
-- aconteceu em produção (2026-09-15): rodado fora de ordem, o script inteiro
-- reverteu, `meta_questoes` nunca foi criada, e como `criarTarefaAction`
-- sempre inclui essa coluna no INSERT (mesmo pra sessão/tarefa comuns, com
-- valor null), TODO insert em `tarefas` passou a falhar — não só o de meta.
-- Migração aditiva e idempotente (ADD COLUMN IF NOT EXISTS + drop/create de
-- CHECK) — pode ser rodada de novo com segurança assim que a ordem estiver
-- certa.
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
