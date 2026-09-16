-- ============================================================
-- QUESTLY — Sessões de estudo agendadas na agenda do dashboard
-- Rodar DEPOIS de supabase_tarefas_semanais.sql. Migração aditiva e
-- idempotente (só ALTER TABLE ... ADD COLUMN IF NOT EXISTS).
--
-- POR QUE: o calendário da home só sabia marcar "tem tarefa neste dia".
-- Uma tarefa é um item de lista ("revisar lista 3"); uma SESSÃO DE ESTUDO é
-- um compromisso com hora e duração ("Cálculo II, 19h, 90min"). Sem hora nem
-- duração o aluno não conseguia montar a semana de verdade — só empilhar
-- afazeres sem horário, e a agenda não conseguia ordenar nada nem somar
-- quanto tempo o dia já tem reservado.
--
-- O que entra na MESMA tabela `tarefas` (nada de tabela nova): as duas coisas
-- são o mesmo registro — um item do aluno amarrado a UMA data, owner-only —
-- e separá-las obrigaria a agenda a fazer duas queries e a unir dois arrays
-- só pra desenhar um dia. `tipo` diz qual é qual.
--
-- Nada aqui tem relação com `rotina_semanal` (grade recorrente por dia da
-- semana, que alimenta o mission-engine), nem com `missions`, nem com
-- `daily_logs`/streak: agendar um bloco NÃO gera missão nem conta ofensiva —
-- é o plano do aluno, não uma conquista.
-- ============================================================

alter table tarefas add column if not exists tipo text not null default 'tarefa';
alter table tarefas add column if not exists hora time;
alter table tarefas add column if not exists duracao_min integer;

-- `tipo`: 'tarefa' = item de lista; 'sessao' = bloco de estudo com horário.
-- (drop+create em vez de "add constraint if not exists" — Postgres não tem a
-- forma IF NOT EXISTS pra constraint, e assim a migração continua idempotente.)
-- SUPERSEDIDO por supabase_agenda_consolidado.sql — use aquele.
-- Este bloco continua aqui como registro do que foi rodado na epoca, mas
-- 'meta' entrou na lista: a versao antiga recriava o CHECK com apenas
-- ('tarefa','sessao') e, rodada DEPOIS de supabase_agenda_metas.sql (que e
-- exatamente o que se faz ao tentar "consertar a ordem"), proibia 'meta' de
-- novo. Consertar a ordem passava a quebrar o que a ordem certa tinha
-- arrumado. Incluir 'meta' aqui torna o arquivo inofensivo em qualquer ordem:
-- se meta_questoes ainda nao existir, o CHECK so fica permissivo, e nada
-- insere 'meta' antes da coluna existir.
alter table tarefas drop constraint if exists tarefas_tipo_check;
alter table tarefas add constraint tarefas_tipo_check
  check (tipo in ('tarefa', 'sessao', 'meta'));

alter table tarefas drop constraint if exists tarefas_duracao_check;
alter table tarefas add constraint tarefas_duracao_check
  check (duracao_min is null or (duracao_min > 0 and duracao_min <= 600));

-- A agenda lista o dia em ordem cronológica (sessões com hora primeiro, na
-- ordem do relógio; o resto na ordem em que foi escrito). O índice antigo
-- (user_id, data) resolve o recorte do mês; este resolve a ordenação dentro
-- do dia sem sort em memória quando o mês tem muita coisa marcada.
create index if not exists idx_tarefas_user_data_hora on tarefas (user_id, data, hora);

-- RLS: nada muda. As colunas herdam a policy owner-only
-- "usuario gerencia as proprias tarefas" criada em supabase_tarefas_semanais.sql.
