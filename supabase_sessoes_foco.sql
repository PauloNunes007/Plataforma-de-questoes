-- supabase_sessoes_foco.sql
-- Rodar depois de supabase_conteudo_compartilhado.sql (padrão owner-only,
-- mesmo formato de tarefas/rotina_semanal). Independente do resto.
--
-- Backing do TIMER DE FOCO (inspirado nos prints da plataforma de referência):
-- cada linha é uma sessão de estudo cronometrada que o aluno concluiu. A home
-- soma os `segundos` do dia pra mostrar "tempo estudado hoje". Deliberadamente
-- self-contained: NÃO alimenta XP/liga/streak nem o motor de maestria (é tempo
-- de relógio, não questão respondida — mesma linha de projeto dos simulados).

create table if not exists public.sessoes_foco (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  data date not null default (now() at time zone 'utc')::date,
  objetivo text,
  segundos integer not null default 0 check (segundos >= 0),
  modo text not null default 'cronometro' check (modo in ('cronometro', 'timer')),
  criado_em timestamptz not null default now()
);

create index if not exists sessoes_foco_user_data_idx
  on public.sessoes_foco (user_id, data);

alter table public.sessoes_foco enable row level security;

-- Owner-only pra tudo (mesmo shape de tarefas/rotina_semanal).
drop policy if exists "sessoes_foco dono" on public.sessoes_foco;
create policy "sessoes_foco dono" on public.sessoes_foco
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
