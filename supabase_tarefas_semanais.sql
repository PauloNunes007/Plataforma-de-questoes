-- ============================================================
-- QUESTLY — Tarefas pontuais no calendário (metas da semana)
-- Rodar DEPOIS de supabase_conteudo_compartilhado.sql (precisa de
-- "subjects" já existente). Migração aditiva e idempotente.
--
-- Diferente de rotina_semanal (recorrente, um dia-da-semana fixo), aqui
-- cada linha é uma tarefa avulsa amarrada a uma DATA específica — o aluno
-- vai adicionando itens no calendário do dashboard ("Tarefas do dia" /
-- painel de dia do CalendarRailCard), com nome + disciplina opcional +
-- descrição opcional. subject_id é nullable (a tarefa pode não estar
-- ligada a nenhuma disciplina). Sem relação com daily_logs (streak) nem
-- com missions — é só uma lista de afazeres que o aluno mesmo escreve.
-- ============================================================

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

alter table tarefas enable row level security;

drop policy if exists "usuario gerencia as proprias tarefas" on tarefas;
create policy "usuario gerencia as proprias tarefas"
on tarefas for all
using (user_id = auth.uid()) with check (user_id = auth.uid());

-- índice pro lookup que o dashboard faz toda vez que carrega (tarefas da
-- semana corrente, filtradas por user_id + intervalo de datas)
create index if not exists idx_tarefas_user_data on tarefas (user_id, data);
