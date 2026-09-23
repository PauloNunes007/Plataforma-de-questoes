-- ============================================================
-- QUESTLY / EXPECTRUM — Estatísticas da questão (2026-09-23)
-- Rodar no SQL Editor DEPOIS de supabase_escala_lancamento.sql.
-- Aditiva e idempotente. NÃO é deploy blocker: o painel de
-- Estatísticas de /questao degrada sozinho pra "ainda sem dados"
-- se a view não existir (ver lib/questao/estatisticas.ts).
--
-- POR QUE ESTA MIGRAÇÃO EXISTE
--
-- A tela de resolução passou a ter uma seção de Estatísticas: quanto da
-- plataforma acerta aquela questão e como as respostas se espalham pelas
-- alternativas (qual distrator "pega" mais gente). Nenhuma das duas coisas
-- era possível pelo app:
--
--   * `question_attempts` tem RLS DONO-ONLY. Um aluno só vê as tentativas
--     dele, então contar no cliente devolveria a estatística de UMA pessoa
--     disfarçada de estatística da plataforma — exatamente a classe de número
--     que mente na tela que supabase_ranking_fiel.sql gastou uma migração
--     inteira consertando;
--   * `questions.tentativas_total`/`acertos_total` (supabase_rede_neural.sql)
--     dariam o percentual, mas não a distribuição — e usar os dois de fontes
--     diferentes faria a soma das barras discordar do percentual do anel na
--     MESMA seção. A view abaixo é a única fonte das duas coisas.
--
-- A view é AGREGADA: devolve `question_id`, letra e contagem. Nenhum
-- `user_id`, nenhuma data, nenhuma linha de aluno — não há como reconstruir
-- quem respondeu o quê. É o mesmo desenho das views de contagem de
-- supabase_escala_lancamento.sql, e o mesmo motivo pelo qual o painel do
-- parceiro (supabase_afiliados.sql) lê agregado e nunca a linha.
--
-- Ela é `security invoker = false` (o padrão do Postgres para views): é o que
-- faz a agregação enxergar as tentativas de TODO MUNDO, apesar da RLS
-- dono-only da tabela. Isso é deliberado e é o mesmo mecanismo de
-- `vw_ranking_provas_oficiais` (supabase_provas_oficiais.sql) — uma policy
-- não serviria aqui, porque RLS filtra LINHA e o que precisa sair daqui é o
-- agregado de linhas que o aluno não pode ver.
--
-- `anon` NÃO recebe grant (mesma regra das outras views): a landing lê via
-- service_role.
--
-- AMOSTRA MÍNIMA: com 1 ou 2 tentativas a distribuição vira quase um
-- histórico individual ("alguém marcou C"), além de não informar nada. O piso
-- (EST_MIN_AMOSTRA em web/src/lib/questao/estatisticas.ts) é aplicado no APP,
-- que mostra um estado vazio honesto em vez de um gráfico de duas barras.
-- Fica no app de propósito: é uma régua de produto, e mexer nela não pode
-- custar migração.
-- ============================================================


-- ---------------------------------------------------------------------------
-- 1) Índice — a leitura é sempre "uma questão", nunca a tabela toda
-- ---------------------------------------------------------------------------

-- O único índice existente era `(user_id, question_id)`
-- (supabase_add_storage_imagens.sql), que não serve pra filtrar por questão
-- sem usuário: o agregado varreria a tabela inteira a cada abertura do painel.
create index if not exists idx_attempts_question
  on question_attempts (question_id);


-- ---------------------------------------------------------------------------
-- 2) A view
-- ---------------------------------------------------------------------------

-- Uma linha por (questão, letra marcada). `question_id` faz parte do GROUP BY
-- de propósito: é o que permite ao Postgres empurrar o `where question_id = $1`
-- do PostgREST pra dentro da agregação, de modo que o painel lê ~5 linhas e
-- nunca a tabela.
--
-- `lower(trim(...))` porque a letra vem do cliente (`respostaMarcada` em
-- registrarRespostaAction) e `questions.gabarito` é minúsculo — sem
-- normalizar, um 'C' antigo não bateria com o gabarito 'c' e apareceria como
-- uma sexta alternativa fantasma no gráfico.
drop view if exists vw_distribuicao_respostas;
create view vw_distribuicao_respostas as
select
  a.question_id                              as question_id,
  lower(trim(a.resposta_marcada))            as letra,
  count(*)                                   as total
from question_attempts a
where a.resposta_marcada is not null
  and trim(a.resposta_marcada) <> ''
group by a.question_id, lower(trim(a.resposta_marcada));

grant select on vw_distribuicao_respostas to authenticated;


-- ---------------------------------------------------------------------------
-- Conferência (o esperado está escrito ao lado)
-- ---------------------------------------------------------------------------

-- 1) A view tem que somar EXATAMENTE o total de tentativas com letra marcada.
--    O esperado é as duas colunas iguais.
select
  (select coalesce(sum(total), 0) from vw_distribuicao_respostas)               as na_view,
  (select count(*) from question_attempts
    where resposta_marcada is not null and trim(resposta_marcada) <> '')        as nas_tentativas;

-- 2) Nenhuma letra fora do conjunto de alternativas da própria questão.
--    O esperado é NENHUMA linha (se aparecer alguma, há resposta gravada com
--    letra que a questão não oferece — dado sujo, não bug da view).
select d.question_id, d.letra, d.total
  from vw_distribuicao_respostas d
  join questions q on q.id = d.question_id
 where q.alternativas is not null
   and not (q.alternativas ? d.letra);

-- 3) Amostra: as 10 questões mais respondidas e a taxa de acerto de cada uma
--    pela view (é o número que o painel mostra no anel).
select
  q.id,
  left(q.enunciado, 48)                                                as enunciado,
  sum(d.total)                                                         as tentativas,
  sum(d.total) filter (where d.letra = q.gabarito)                     as acertos,
  round(100.0 * sum(d.total) filter (where d.letra = q.gabarito) / sum(d.total), 1) as pct_acerto
  from vw_distribuicao_respostas d
  join questions q on q.id = d.question_id
 group by q.id, q.enunciado, q.gabarito
 order by tentativas desc
 limit 10;
