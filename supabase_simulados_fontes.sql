-- ============================================================
-- QUESTLY — Fontes de questão no montador de Simulados
-- Rodar no SQL Editor DEPOIS de supabase_escala_lancamento.sql.
-- Aditiva e idempotente: NÃO cria tabela, NÃO mexe em RLS, só redefine
-- uma view de contagem.
--
-- POR QUE ESTA MIGRAÇÃO EXISTE
--
-- O montador de simulados deixou de ser exclusivo de quem estuda numa
-- universidade com provas catalogadas (pedido do dono, 2026-09-16): agora
-- qualquer aluno monta uma prova, escolhendo de ONDE saem as questões —
-- as provas da própria universidade, as de outra, as AUTORAIS (feitas pela
-- equipe, `questions.instituicao is null`) ou uma mistura equilibrada.
--
-- `vw_questoes_por_instituicao` nasceu (supabase_escala_lancamento.sql) com
-- `where q.instituicao is not null`, porque na época só existia um recorte:
-- "as provas da universidade do aluno". Com o autoral virando fonte de
-- primeira classe, esse filtro esconde do montador a MAIOR parte do banco —
-- as ~2.500 questões autorais — e não há outra view com a quebra por
-- dificuldade/ano de que a prévia ao vivo depende.
--
-- A linha autoral sai da view com `instituicao = null`. Quem consome por
-- universidade (`.in("instituicao", [...])` no onboarding e no recorte da
-- própria instituição) não é afetado: null nunca casa num `in`.
-- `vw_instituicoes` continua SEM a linha nula de propósito — ela responde
-- "que universidades existem no banco", e autoral não é universidade.
-- ============================================================

drop view if exists vw_questoes_por_instituicao;
create view vw_questoes_por_instituicao as
select
  q.instituicao                                 as instituicao,
  t.id                                          as topic_id,
  t.nome                                        as topico_nome,
  t.ordem                                       as topico_ordem,
  t.materia_id                                  as materia_id,
  m.nome                                        as materia_nome,
  q.dificuldade                                 as dificuldade,
  q.ano                                         as ano,
  count(q.id)                                   as total,
  count(q.id) filter (where q.desafio is not true) as total_regular
from questions q
join topicos t on t.id = q.topic_id
join materias m on m.id = t.materia_id
group by q.instituicao, t.id, t.nome, t.ordem, t.materia_id, m.nome, q.dificuldade, q.ano;

grant select on vw_questoes_por_instituicao to authenticated;


-- ---------------------------------------------------------------------------
-- Conferência (o esperado está escrito ao lado)
-- ---------------------------------------------------------------------------

-- 1) Deve aparecer UMA linha com instituicao = null e o total das autorais.
--    Se vier vazia, o banco não tem questão autoral (improvável hoje).
select coalesce(instituicao, '(autorais)') as fonte, sum(total_regular) as questoes
  from vw_questoes_por_instituicao
 group by 1
 order by questoes desc;

-- 2) A soma da view tem que bater com a tabela (nenhuma questão de fora).
select
  (select count(*) from questions)                           as questoes_tabela,
  (select coalesce(sum(total), 0) from vw_questoes_por_instituicao) as questoes_view;
