-- ============================================================
-- QUESTLY — imagens (foto de perfil com upload + imagem de
-- enunciado) e ajustes de escala. Rode no SQL Editor do Supabase.
-- Idempotente; assume que o schema base já existe.
-- ============================================================

-- imagem do enunciado (gráfico, figura, circuito...) — URL pública,
-- normalmente do bucket "questoes" abaixo
alter table questions add column if not exists imagem_url text;

-- FALTAVA policy de UPDATE em questions: sem ela a recalibração de
-- tempo_medio_seg feita em js/questao.js era um no-op silencioso
-- (RLS filtra as linhas e o update "funciona" afetando 0 linhas,
-- sem devolver erro nenhum)
drop policy if exists "autenticados podem atualizar questoes" on questions;
create policy "autenticados podem atualizar questoes" on questions
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- índices pros filtros que o app faz o tempo todo (barato agora,
-- essencial quando houver muitos alunos/questões no free tier)
create index if not exists idx_questions_topic on questions (topic_id, dificuldade);
create index if not exists idx_missions_user_data on missions (user_id, data);
create index if not exists idx_attempts_user_question on question_attempts (user_id, question_id);
create index if not exists idx_profiles_liga_semana on profiles (liga, semana_inicio);
create index if not exists idx_historico_liga_semana on historico_semanal (liga, semana_inicio);

-- ============================================================
-- STORAGE (grátis até 1 GB)
-- Bucket "avatars": foto de perfil. O app redimensiona pra 256x256
--   JPEG antes de subir (~30 KB por aluno → 1 GB comporta dezenas de
--   milhares de alunos com foto). Cada aluno só escreve na própria
--   pasta ({user_id}/avatar.jpg).
-- Bucket "questoes": imagens de enunciado. Suba a imagem pelo painel
--   (Storage → questoes), copie a URL pública e use na coluna
--   imagem_url do CSV de importação.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('questoes', 'questoes', true, 4194304, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "leitura publica de imagens questly" on storage.objects;
create policy "leitura publica de imagens questly" on storage.objects
  for select using (bucket_id in ('avatars', 'questoes'));

drop policy if exists "usuario envia o proprio avatar" on storage.objects;
create policy "usuario envia o proprio avatar" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "usuario troca o proprio avatar" on storage.objects;
create policy "usuario troca o proprio avatar" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "usuario remove o proprio avatar" on storage.objects;
create policy "usuario remove o proprio avatar" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "autenticados enviam imagens de questoes" on storage.objects;
create policy "autenticados enviam imagens de questoes" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'questoes');
