-- ============================================================
-- QUESTLY — UPLOAD DO BUCKET `questoes` RESTRITO AO ADMIN
-- Rode no SQL Editor do Supabase, DEPOIS de
-- supabase_add_storage_imagens.sql e supabase_seguranca_hardening.sql.
-- Idempotente.
--
-- Furo fechado: supabase_seguranca_hardening.sql restringiu a ESCRITA
-- da tabela `questions` ao admin (o importador virou ferramenta de
-- admin), mas a policy de INSERT no Storage do bucket `questoes`
-- (supabase_add_storage_imagens.sql) continuou como
--   with check (bucket_id = 'questoes')
-- — ou seja, QUALQUER aluno logado, com a chave anon pública direto do
-- console do navegador, podia subir arquivos arbitrários num bucket
-- público (hospedagem grátis à custa da sua cota de Storage). As
-- figuras de questão só são enviadas pelo /importar e pelo editor de
-- /admin/questoes, os dois já gateados por admin — então o upload
-- também deve ser só do admin, igual ao bucket `erros-imagens`.
--
-- Leitura pública continua (as URLs das figuras aparecem pra todo
-- aluno em /questao). O bucket `avatars` NÃO é afetado — cada aluno
-- segue enviando o próprio avatar (policy separada, por pasta).
-- ============================================================

drop policy if exists "autenticados enviam imagens de questoes" on storage.objects;

drop policy if exists "admin envia imagens de questoes" on storage.objects;
create policy "admin envia imagens de questoes" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'questoes'
    and (auth.jwt() ->> 'email') = 'paulocresponunes@gmail.com'
  );

-- Sobrescrever/remover uma figura também só o admin (o editor de
-- /admin/questoes é a única superfície que troca imagem de questão).
drop policy if exists "admin atualiza imagens de questoes" on storage.objects;
create policy "admin atualiza imagens de questoes" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'questoes'
    and (auth.jwt() ->> 'email') = 'paulocresponunes@gmail.com'
  )
  with check (
    bucket_id = 'questoes'
    and (auth.jwt() ->> 'email') = 'paulocresponunes@gmail.com'
  );

drop policy if exists "admin remove imagens de questoes" on storage.objects;
create policy "admin remove imagens de questoes" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'questoes'
    and (auth.jwt() ->> 'email') = 'paulocresponunes@gmail.com'
  );
