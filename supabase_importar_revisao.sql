-- ============================================================
-- QUESTLY — suporte a imagem por alternativa, usada pelo novo
-- fluxo de revisão/importação (questly_importar.html + js/importar.js).
-- Rode no SQL Editor DEPOIS de supabase_add_storage_imagens.sql.
-- Idempotente.
--
-- questions.imagem_url (já existe) segue sendo a imagem do
-- enunciado. alternativas_imagens é o par por letra: jsonb
-- { "a": "https://.../alt-a.jpg", ... } — só as letras que têm
-- imagem aparecem na chave; texto da alternativa continua em
-- questions.alternativas (inalterado, pra não quebrar quem já lê
-- esse campo como string).
-- ============================================================

alter table questions add column if not exists alternativas_imagens jsonb;
