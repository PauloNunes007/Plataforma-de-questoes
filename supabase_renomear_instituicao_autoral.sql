-- ============================================================
-- QUESTLY (app) / EXPECTRUM (marca) — renomeia o rótulo de autoria
-- própria em questions.instituicao de 'Questly' pra 'Expectrum'.
-- Rodar no SQL Editor do Supabase. Aditiva, idempotente, sem schema
-- novo — é um conserto de DADO, não de estrutura.
--
-- POR QUÊ
--
-- O app (marca, título, e-mails, `web/src/app/layout.tsx`) já foi
-- renomeado pra Expectrum. Mas um lote de questões autorais (escritas
-- pela equipe, sem universidade de origem) foi importado com
-- `instituicao = 'Questly'` como rótulo de autoria própria — valor
-- gravado no banco, não derivado. Isso ainda aparece literal pro
-- aluno: o chip de instituição na tela de questão
-- (`components/questao/questao-runner.tsx`) e o card de
-- favoritos/anotações/admin renderizam `pergunta.instituicao` cru.
-- Resultado: aluno respondendo questão autoral via o chip "QUESTLY
-- 2026" numa plataforma que se chama Expectrum em todo o resto.
--
-- `web/src/lib/simulados/fontes.ts` (ehRotuloAutoral) e
-- `web/src/lib/cursos/actions.ts` (ehInstituicaoSugerivel) já foram
-- ajustados pra reconhecer OS DOIS rótulos ("questly" e "expectrum")
-- como autoral/não-sugerível — então rodar isto não quebra o
-- agrupamento de fontes do montador de simulado nem as sugestões de
-- universidade do onboarding.
-- ============================================================

-- Conferir antes (deve listar só o rótulo de autoria, nunca uma
-- universidade real — nome de universidade não contém "questly"):
select instituicao, count(*)
from questions
where instituicao ilike '%questly%'
group by instituicao;

update questions
set instituicao = 'Expectrum'
where instituicao ilike '%questly%';

-- Verificação: deve devolver 0 linhas.
select count(*) as restantes_com_questly
from questions
where instituicao ilike '%questly%';
