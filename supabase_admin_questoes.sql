-- Roda depois de supabase_add_storage_imagens.sql (última migração a mexer
-- em policies de `questions`).
--
-- Nova tela /admin/questoes (Next.js) dá a UMA conta — identificada pelo
-- e-mail, já que não existe coluna de "role" ainda (ver nota em
-- supabase_conteudo_compartilhado.sql: "sem papel de admin ainda") — poder
-- de editar e EXCLUIR qualquer questão do banco. UPDATE/INSERT em
-- `questions` continuam abertos pra qualquer autenticado (mesmo nível de
-- confiança de sempre — não é o escopo desta migração mexer nisso, e
-- restringir agora quebraria o importador em /importar, hoje acessível a
-- qualquer conta autenticada). EXCLUSÃO é capacidade nova introduzida por
-- essa tela, então ganha uma trava no próprio banco (defesa em profundidade
-- além da checagem em lib/admin/actions.ts), não só a UI escondendo o link
-- de quem não é o admin.
create policy "admin pode excluir questoes" on questions
  for delete
  using (auth.jwt() ->> 'email' = 'paulocresponunes@gmail.com');
