-- ============================================================
-- QUESTLY — libera SVG no bucket "questoes". Rode no SQL Editor
-- do Supabase, depois de supabase_add_storage_imagens.sql.
-- Idempotente.
-- ============================================================

-- As figuras compiladas a partir de tikz_code/alternativas_tikz (importador
-- Next.js, ver web/CLAUDE.md) são SVGs vetoriais — o bucket "questoes" só
-- aceitava jpeg/png/webp/gif até aqui, então o upload vinha 415 (mime type
-- not supported).
update storage.buckets
set allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','image/svg+xml']
where id = 'questoes';
