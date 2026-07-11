-- ============================================================
-- QUESTLY — Ciência da Aprendizagem (maestria + metacognição)
-- Rodar DEPOIS de supabase_conteudo_compartilhado.sql (precisa de
-- question_attempts e aluno_topico_progresso já existentes).
-- Migração aditiva e idempotente, como as demais.
--
-- O que muda no banco:
--   1. question_attempts.motivo_erro — "autópsia do erro": quando o
--      aluno erra, ele pode classificar POR QUE errou. Slugs fixos:
--        'conceito'      -> não sabia a teoria (erro mais grave)
--        'calculo'       -> sabia o caminho, errou a conta
--        'interpretacao' -> leu/entendeu errado o enunciado
--        'chute'         -> chutou sem base
--      js/chance-aprovacao.js usa isso pra penalizar menos quem errou
--      por conta do que quem errou por conceito.
--   2. Policy de UPDATE em question_attempts (dono só) — o app insere
--      a tentativa na hora da resposta e só depois grava o motivo,
--      então precisa poder atualizar a própria linha. Sem essa policy
--      o update é filtrado pelo RLS em silêncio (0 linhas, sem erro),
--      igual ao caso do tempo_medio_seg documentado no CLAUDE.md.
--
-- Maestria e revisão espaçada NÃO precisam de coluna nova: são
-- derivadas de aluno_topico_progresso (taxa_acerto,
-- num_questoes_respondidas, ultima_revisao) por funções puras em
-- js/supabase-client.js — nenhuma mudança de RLS envolvida.
-- ============================================================

-- 1. autópsia do erro -------------------------------------------------
alter table question_attempts add column if not exists motivo_erro text;

alter table question_attempts drop constraint if exists question_attempts_motivo_erro_check;
alter table question_attempts add constraint question_attempts_motivo_erro_check
  check (motivo_erro is null or motivo_erro in ('conceito', 'calculo', 'interpretacao', 'chute'));

-- 2. o aluno pode atualizar a PRÓPRIA tentativa (pra gravar o motivo
--    depois do insert). Escrita continua owner-only.
drop policy if exists "usuario atualiza a propria tentativa" on question_attempts;
create policy "usuario atualiza a propria tentativa"
on question_attempts for update
using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 3. índice pro recálculo da chance de aprovação (busca os erros
--    classificados do aluno; barato agora, útil com volume)
create index if not exists idx_attempts_user_motivo
  on question_attempts (user_id, correta, motivo_erro);
