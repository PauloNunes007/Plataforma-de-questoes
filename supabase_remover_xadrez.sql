-- QUESTLY — REMOÇÃO DA ARENA DE XADREZ (2026-07-16)
-- O modo xadrez foi removido do app (rotas /questoes/xadrez, componentes,
-- lib e assets do Stockfish deletados). Este arquivo desfaz o que
-- supabase_arena_xadrez.sql criou. Rodar no SQL Editor do Supabase SOMENTE
-- se aquela migração chegou a ser executada; se a tabela nunca existiu,
-- rodar mesmo assim é inofensivo (if exists).
--
-- Nota: dropar a tabela apaga o histórico de partidas — o XP ganho nas
-- partidas já está consolidado em profiles.xp_total e não é afetado.

drop table if exists public.partidas_xadrez cascade;
