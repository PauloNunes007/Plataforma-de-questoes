-- ============================================================
-- QUESTLY — Comentários / discussão por questão
-- Rodar DEPOIS de supabase_anotacoes_favoritos_relatos.sql (reusa o mesmo
-- e-mail de admin nas policies de moderação). Migração aditiva e idempotente.
--
-- Diferente de question_notes (anotação privada do dono): aqui a discussão
-- é PÚBLICA entre alunos — qualquer autenticado LÊ todos os comentários de
-- qualquer questão e insere o PRÓPRIO comentário; cada um edita/apaga só o
-- seu, e o admin pode apagar qualquer um (moderação), mesma linha das
-- policies de relato.
--
-- Autoria: guardamos só user_id (FK -> auth.users). O nome/username/foto
-- do autor vêm de "profiles" (world-readable sob RLS) numa 2ª query no
-- servidor — não há FK direto pra profiles pra embedding.
-- ============================================================

create table if not exists question_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  parent_id uuid references question_comments(id) on delete cascade,
  texto text not null check (char_length(texto) between 1 and 2000),
  criado_em timestamptz not null default now(),
  editado_em timestamptz
);

-- parent_id: NULL = comentário raiz; preenchido = resposta a outro comentário
-- (uma camada de thread — respostas de respostas aparecem no mesmo nível).
alter table question_comments add column if not exists parent_id uuid references question_comments(id) on delete cascade;

alter table question_comments enable row level security;

-- Qualquer autenticado lê a discussão inteira de qualquer questão.
drop policy if exists "autenticado le comentarios" on question_comments;
create policy "autenticado le comentarios"
on question_comments for select
using (auth.role() = 'authenticated');

-- Cada um insere só o próprio comentário.
drop policy if exists "usuario cria seu comentario" on question_comments;
create policy "usuario cria seu comentario"
on question_comments for insert
with check (user_id = auth.uid());

-- Cada um edita só o próprio comentário.
drop policy if exists "usuario edita seu comentario" on question_comments;
create policy "usuario edita seu comentario"
on question_comments for update
using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Apaga: o dono OU o admin (moderação). Duas policies permissivas -> OR.
drop policy if exists "usuario apaga seu comentario" on question_comments;
create policy "usuario apaga seu comentario"
on question_comments for delete
using (user_id = auth.uid());

drop policy if exists "admin apaga qualquer comentario" on question_comments;
create policy "admin apaga qualquer comentario"
on question_comments for delete
using (auth.jwt() ->> 'email' = 'paulocresponunes@gmail.com');

create index if not exists idx_comments_question on question_comments (question_id, criado_em desc);
create index if not exists idx_comments_parent on question_comments (parent_id);

-- ------------------------------------------------------------
-- Curtidas em comentários. Uma linha por (user, comentário); a
-- contagem é derivada. Qualquer autenticado LÊ (pra contar/saber se
-- curtiu), mas insere/apaga só a própria curtida.
-- ------------------------------------------------------------
create table if not exists question_comment_likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  comment_id uuid not null references question_comments(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (user_id, comment_id)
);

alter table question_comment_likes enable row level security;

drop policy if exists "autenticado le curtidas" on question_comment_likes;
create policy "autenticado le curtidas"
on question_comment_likes for select
using (auth.role() = 'authenticated');

drop policy if exists "usuario gerencia sua curtida" on question_comment_likes;
create policy "usuario gerencia sua curtida"
on question_comment_likes for all
using (user_id = auth.uid()) with check (user_id = auth.uid());

create index if not exists idx_comment_likes_comment on question_comment_likes (comment_id);
