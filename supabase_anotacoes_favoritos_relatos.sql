-- ============================================================
-- QUESTLY — Anotações, favoritos e relatos de erro em questões
-- Rodar DEPOIS de supabase_conteudo_compartilhado.sql (precisa de
-- "questions" já existente) e supabase_admin_questoes.sql (mesmo e-mail
-- de admin usado pelas policies de relato). Migração aditiva e idempotente.
--
-- Três tabelas novas, cada uma um caso de RLS diferente:
--   question_notes      — anotação pessoal do aluno numa questão (pode
--                          reaproveitar o texto de "resolucao" como ponto
--                          de partida, editável). Só o dono lê/escreve
--                          (padrão "for all", igual tarefas/rotina_semanal).
--   question_favoritos  — toggle de favorito por questão. Mesma coisa.
--   question_reports    — "reportar problema" (enunciado/imagem faltando,
--                          questão errada, etc). Diferente das outras duas:
--                          qualquer autenticado insere o PRÓPRIO relato,
--                          mas quem precisa LER/RESOLVER todos os relatos
--                          é só a conta admin (ver web/CLAUDE.md, tela
--                          /admin/relatos) — por isso duas policies de
--                          select (dono vê o que reportou + admin vê tudo,
--                          RLS faz OR entre policies permissivas do mesmo
--                          comando) e update restrito ao admin.
-- ============================================================

create table if not exists question_notes (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  nota text not null,
  atualizado_em timestamptz not null default now(),
  primary key (user_id, question_id)
);

alter table question_notes enable row level security;

drop policy if exists "usuario gerencia suas anotacoes" on question_notes;
create policy "usuario gerencia suas anotacoes"
on question_notes for all
using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists question_favoritos (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (user_id, question_id)
);

alter table question_favoritos enable row level security;

drop policy if exists "usuario gerencia seus favoritos" on question_favoritos;
create policy "usuario gerencia seus favoritos"
on question_favoritos for all
using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists question_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  motivo text not null check (motivo in (
    'enunciado_faltando',
    'imagem_enunciado_faltando',
    'imagem_alternativa_faltando',
    'questao_errada',
    'latex_quebrado',
    'outro'
  )),
  detalhe text,
  status text not null default 'pendente' check (status in ('pendente', 'resolvido')),
  criado_em timestamptz not null default now(),
  resolvido_em timestamptz
);

alter table question_reports enable row level security;

drop policy if exists "usuario cria seus relatos" on question_reports;
create policy "usuario cria seus relatos"
on question_reports for insert
with check (user_id = auth.uid());

drop policy if exists "usuario ve seus relatos" on question_reports;
create policy "usuario ve seus relatos"
on question_reports for select
using (user_id = auth.uid());

drop policy if exists "admin ve todos os relatos" on question_reports;
create policy "admin ve todos os relatos"
on question_reports for select
using (auth.jwt() ->> 'email' = 'paulocresponunes@gmail.com');

drop policy if exists "admin resolve relatos" on question_reports;
create policy "admin resolve relatos"
on question_reports for update
using (auth.jwt() ->> 'email' = 'paulocresponunes@gmail.com')
with check (auth.jwt() ->> 'email' = 'paulocresponunes@gmail.com');

create index if not exists idx_reports_status on question_reports (status, criado_em desc);
