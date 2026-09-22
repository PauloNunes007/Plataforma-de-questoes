-- ============================================================
-- EXPECTRUM — o XP que a home mostra passa a ser o XP que foi pago
--
-- Rodar DEPOIS de supabase_conteudo_compartilhado.sql (qualquer momento
-- depois; não depende de nenhuma das migrações de agenda/plano).
-- Aditiva e idempotente. **É deploy blocker na prática**: sem a coluna,
-- o resumo do dia e a tira semanal continuam mostrando o número ERRADO
-- (o app tem fallback, então nada quebra — só continua mentindo).
--
-- O PROBLEMA QUE ISTO CONSERTA
-- ----------------------------
-- `missions.xp_recompensa` é escrito na CRIAÇÃO da lista
-- (lib/questly/criar-lista.ts) como a soma pura de questlyXpDaQuestao:
-- 3/5/8 por dificuldade e nada mais. É uma ESTIMATIVA, e é usada como
-- tal na prévia do Banco de Questões ("~35 XP nesta lista").
--
-- O XP que o aluno REALMENTE ganha sai de recomputarPlacarMissao
-- (lib/questao/actions.ts) e passa por cinco regras que a estimativa não
-- conhece: multiplicador de combo (até 1,75×), ×1,5 em tópico Mestre,
-- metade em questão já acertada antes, ZERO em questão já tentada antes,
-- e 45% do valor no erro inédito (QUESTLY_XP_ERRO_FRACAO).
--
-- Só que `finalizarMissaoAction` nunca reescrevia a linha da missão.
-- Resultado: `profiles.xp_total` (que o ranking lê) recebia o valor real,
-- enquanto a home — que soma `xp_recompensa` das listas fechadas hoje —
-- mostrava o valor planejado. Dois números para o mesmo dia, para o mesmo
-- aluno, na mesma tela. É a mesma classe de deriva que
-- supabase_ranking_fiel.sql já tinha corrigido do lado dos contadores de
-- questão, e pelo mesmo motivo: feedback de progresso que mente corrói o
-- ciclo de recompensa inteiro.
--
-- POR QUE UMA COLUNA NOVA E NÃO SOBRESCREVER `xp_recompensa`
-- ----------------------------------------------------------
-- Porque as duas perguntas são diferentes e as duas têm leitor:
--   • "quanto esta lista vale?"  → xp_recompensa, mostrado ANTES de
--     começar, na prévia da montagem;
--   • "quanto esta lista pagou?" → xp_pago, mostrado DEPOIS de fechar.
-- Sobrescrever a primeira com a segunda faria a prévia de uma lista
-- refeita herdar o combo da vez anterior.
--
-- NULL = lista ainda em andamento, ou fechada antes desta migração. Quem
-- lê usa `coalesce(xp_pago, xp_recompensa)`, que é exatamente o que o app
-- faz em lib/questly/dashboard-data.ts.
--
-- Sem mudança de RLS: a coluna herda a política dono-only de `missions`.
-- Escrita só pelo servidor, no mesmo ponto que já grava `concluida`.
-- ============================================================

alter table missions add column if not exists xp_pago int;

comment on column missions.xp_pago is
  'XP realmente creditado ao fechar a lista (combo, maestria, anti-farm e '
  'consolação de erro aplicados). NULL = em andamento ou fechada antes da '
  'migração. xp_recompensa continua sendo a ESTIMATIVA da criação.';

-- ------------------------------------------------------------------
-- Conferência (esperado: a coluna existindo, e nenhuma linha em
-- andamento com xp_pago preenchido):
-- ------------------------------------------------------------------
-- select column_name, data_type, is_nullable
--   from information_schema.columns
--  where table_name = 'missions' and column_name = 'xp_pago';
--
-- select count(*) as em_andamento_com_xp_pago
--   from missions
--  where concluida is not true and xp_pago is not null;
