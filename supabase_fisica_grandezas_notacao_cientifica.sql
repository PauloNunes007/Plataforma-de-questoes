-- ============================================================
-- QUESTLY — separa "Grandezas e Notação Científica" de
-- "Conceitos de Movimento" em Física I.
--
-- Contexto: o tópico 1 de Física I ("Conceitos de Movimento") já
-- cobria "unidades e algarismos significativos" na sua descrição.
-- Um lote de questões novas sobre grandezas físicas/notação
-- científica foi importado e caiu nesse tópico por ser o mais
-- próximo existente. Este script cria o tópico dedicado e move só
-- as questões desse assunto (por palavra-chave no enunciado) pra lá.
--
-- Rodar à mão no SQL Editor do Supabase, depois de conferir a query
-- de PREVIEW abaixo. Idempotente: pode rodar de novo sem duplicar o
-- tópico (upsert por nome) nem re-mover questões já movidas (o WHERE
-- já exige topico_id = 'Conceitos de Movimento', que deixa de bater
-- assim que a questão é movida).
-- ============================================================

-- 1) cria o tópico novo, antes de "Conceitos de Movimento" na ordem da ementa
insert into topicos (materia_id, nome, ordem, cai_na_prova, descricao)
select m.id,
       'Grandezas e Notação Científica',
       0,
       true,
       'Grandezas físicas fundamentais e derivadas, notação científica, algarismos significativos, ordem de grandeza, conversão e sistema internacional de unidades'
from materias m
where m.nome = 'Física I'
on conflict (materia_id, lower(nome)) do nothing;

-- 2) tira a menção a "unidades e algarismos significativos" da descrição
--    antiga de "Conceitos de Movimento", já que esse conteúdo mudou de tópico
update topicos t
set descricao = 'Posição, velocidade e aceleração linear, movimento em uma dimensão'
from materias m
where t.materia_id = m.id
  and m.nome = 'Física I'
  and t.nome = 'Conceitos de Movimento';

-- 3) PREVIEW — rode isto primeiro e confira a lista antes do UPDATE abaixo
select q.id, q.enunciado
from questions q
join topicos t on t.id = q.topic_id
join materias m on m.id = t.materia_id
where m.nome = 'Física I'
  and t.nome = 'Conceitos de Movimento'
  and (
    q.enunciado ilike '%notação científica%' or
    q.enunciado ilike '%notacao cientifica%' or
    q.enunciado ilike '%algarismo%significativo%' or
    q.enunciado ilike '%ordem de grandeza%' or
    q.enunciado ilike '%análise dimensional%' or
    q.enunciado ilike '%analise dimensional%' or
    q.enunciado ilike '%conversão de unidade%' or
    q.enunciado ilike '%conversao de unidade%' or
    q.enunciado ilike '%unidades de medida%' or
    q.enunciado ilike '%sistema internacional%' or
    q.enunciado ilike '%potência de 10%' or
    q.enunciado ilike '%potencia de 10%' or
    q.enunciado ilike '%grandeza física%' or
    q.enunciado ilike '%grandeza fisica%' or
    q.enunciado ilike '%grandezas fundamentais%' or
    q.enunciado ilike '%grandezas derivadas%'
  );

-- 4) move de fato — só roda depois de conferir o PREVIEW acima
update questions q
set topic_id = novo.id
from topicos novo
join materias m on m.id = novo.materia_id
where novo.nome = 'Grandezas e Notação Científica'
  and m.nome = 'Física I'
  and q.topic_id in (
    select t.id from topicos t
    join materias mm on mm.id = t.materia_id
    where mm.nome = 'Física I' and t.nome = 'Conceitos de Movimento'
  )
  and (
    q.enunciado ilike '%notação científica%' or
    q.enunciado ilike '%notacao cientifica%' or
    q.enunciado ilike '%algarismo%significativo%' or
    q.enunciado ilike '%ordem de grandeza%' or
    q.enunciado ilike '%análise dimensional%' or
    q.enunciado ilike '%analise dimensional%' or
    q.enunciado ilike '%conversão de unidade%' or
    q.enunciado ilike '%conversao de unidade%' or
    q.enunciado ilike '%unidades de medida%' or
    q.enunciado ilike '%sistema internacional%' or
    q.enunciado ilike '%potência de 10%' or
    q.enunciado ilike '%potencia de 10%' or
    q.enunciado ilike '%grandeza física%' or
    q.enunciado ilike '%grandeza fisica%' or
    q.enunciado ilike '%grandezas fundamentais%' or
    q.enunciado ilike '%grandezas derivadas%'
  );

-- 5) conferência final
select t.nome, count(*) as qtd_questoes
from questions q
join topicos t on t.id = q.topic_id
join materias m on m.id = t.materia_id
where m.nome = 'Física I' and t.nome in ('Conceitos de Movimento', 'Grandezas e Notação Científica')
group by t.nome;
