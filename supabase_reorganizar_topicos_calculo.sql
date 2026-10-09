-- ============================================================
-- QUESTLY — Reorganização dos tópicos de Cálculo I e de Fundamentos
-- de Cálculo e Geometria no banco de questões.
-- Rodar no SQL Editor do Supabase. Roda DEPOIS da seção "FUNDAMENTOS
-- DE CÁLCULO E GEOMETRIA" atualizada de supabase_ementas_ciclo_basico.sql
-- (ela cria o tópico "Funções Exponenciais e Logarítmicas" que a
-- PARTE 3 abaixo referencia pelo nome). Aditiva/idempotente: cada
-- bloco confere o que já foi feito antes de agir, então rodar de novo
-- não duplica nem quebra nada.
--
-- CONTEXTO (auditoria de 2026-09-15, a partir da observação de que
-- "Aplicações da Derivada" e "Problemas de Otimização" traziam
-- praticamente as mesmas questões):
--
-- Cálculo I tinha, além dos 11 tópicos oficiais da ementa (com
-- `ordem` 1-11 — ver supabase_ementas_ciclo_basico.sql), 5 tópicos
-- órfãos sem `ordem`: sobras de antes da ementa existir, cada um com
-- só 5-9 questões, cujo conteúdo duplica um dos 11 oficiais:
--   "Análise de Gráficos"            -> "Aplicações da Derivada"
--   "Derivadas"                      -> "Cálculo das Derivadas"
--   "Problemas de otimização"        -> "Aplicações da Derivada"
--   "Teorema Fundamental do Cálculo" -> "Integral Definida"
--   "Funções Contínuas"              -> "Continuidade"
-- Por terem `ordem` nulo esses tópicos já caíam pro fim da trilha
-- curricular (mission-engine.js os trata como "revisão", nunca como
-- fronteira), então eram só ruído no Banco de Questões e na tela de
-- importação, sem nunca aparecer de verdade nas missões diárias.
--
-- A auditoria também achou, espalhadas pelos 11 tópicos oficiais,
-- 12 questões com o enunciado idêntico a menos de espaçamento/LaTeX
-- cosmético (`\left(\right)` vs parêntese solto, `\displaystyle` a
-- mais ou a menos) — sinal de reimportação em duplicidade. Cada uma
-- só foi marcada pra apagar depois de conferir, via API Admin com a
-- service_role key, que não tinha question_attempts/notes/favoritos/
-- relatos/comentários apontando pra ela (senão perderíamos histórico
-- de verdade); as duas únicas referências que restaram eram
-- `missions.question_ids` de 2 missões avulsas antigas (>4 dias,
-- 0% respondidas) — o array delas é corrigido na PARTE 1.
--
-- Em "Fundamentos de Cálculo e Geometria", "Funções em R" misturava
-- domínio/inequações/polinômios/trigonometria/composição/exponencial/
-- logarítmica num tópico só de 32 questões. A PARTE 3 move as 8
-- questões que são especificamente sobre função exponencial/
-- logarítmica pro tópico novo; o resto (domínio, módulo, polinômios,
-- trigonometria, composição) continua em "Funções em R" — picar mais
-- que isso, com só 24-32 questões no total, criaria pastas poluídas.
-- ============================================================

-- ---------------------------------------------------------------
-- PARTE 1 — Cálculo I: apaga as 12 questões duplicadas, sempre
-- mantendo a cópia que já está no tópico certo (a "Integral
-- Indefinida" que era na verdade uma integral DEFINIDA já reimportada
-- corretamente em "Integral Definida" conta como "tópico errado" pra
-- essa escolha) ou, quando as duas cópias já estão no tópico certo, a
-- que não está presa a nenhuma missão (evita ter que mexer em
-- `missions.question_ids`).
-- ---------------------------------------------------------------
delete from questions where id in (
  '92dbf0a3-1c63-4988-b854-b289164183f6', -- "Problemas de otimização": duplicata exata de 0813540a ("Aplicações da Derivada")
  '4bef87ac-8ca8-471a-b46d-80876c07a0b9', -- "Derivadas" (órfã): duplicata exata de ffea43a3 ("A Derivada")
  'c2e4bba4-de66-4289-bbbf-cb603507873e', -- "Cálculo das Derivadas": duplicata exata de e2a850cd
  '149b9e22-ad25-4525-89a7-35c46a1fb328', -- "Cálculo das Derivadas": duplicata exata de 3dede338
  '7a28bc8c-e3d0-4d18-9455-8c7d7ad78187', -- "Integral Definida": duplicata exata de df1b0870
  'cb4a6142-5230-4609-9696-db2bafe2ab2c', -- "Integral Definida": duplicata exata de 6190b56f
  'dfd9af4d-456c-454e-83e6-8e180b70af15', -- estava em "Integral Indefinida" mas é integral DEFINIDA — duplicata de 3ba80305 (já em "Integral Definida", tópico certo)
  '28a0ba2f-18a7-485a-9991-f2f3cda27953', -- "Aplicações da Integral Definida": duplicata exata de 0762947c
  '298fcd7b-d356-4990-9d60-a8f9189d462c', -- "Técnicas de Integração": duplicata exata de df1782ee
  'fa614e5b-4fa9-4619-827a-87e4f1689d6c', -- "Técnicas de Integração": duplicata exata de f88cf289
  '7cee89c2-1983-4d0d-a2fc-97419d888c85', -- "Técnicas de Integração": duplicata exata de ed781aa3
  '02c58830-b178-4f22-9dfd-e51ef588aaaf'  -- "Integral Imprópria": duplicata exata de 0a4cb1c3
);

-- tira as duplicatas apagadas acima de dentro de 2 missões avulsas
-- antigas que ainda guardavam o id delas em `question_ids` (é array,
-- não FK — não seria limpo sozinho pela exclusão acima)
update missions set question_ids = array_remove(question_ids, '92dbf0a3-1c63-4988-b854-b289164183f6'::uuid)
  where id = '48646ff0-80b1-41d5-99fe-4e04c8cd1757';
update missions set question_ids = array_remove(
    array_remove(question_ids, 'c2e4bba4-de66-4289-bbbf-cb603507873e'::uuid),
    '149b9e22-ad25-4525-89a7-35c46a1fb328'::uuid
  )
  where id = '2ba3eec8-8bfd-4f1d-a39d-5c25e16528a3';

-- ---------------------------------------------------------------
-- PARTE 2 — Cálculo I: funde os 5 tópicos órfãos nos tópicos oficiais
-- que já cobrem o mesmo conteúdo, sem perder o progresso
-- (aluno_topico_progresso) de quem já estudou por eles — quem tinha
-- registro nos dois lados tem as métricas combinadas (soma de
-- questões respondidas, taxa de acerto/maestria ponderadas pelo
-- volume de cada lado); quem só tinha registro no órfão simplesmente
-- muda de tópico.
--
-- Função temporária só pra não repetir esse merge 5 vezes; é
-- derrubada no fim do bloco.
-- ---------------------------------------------------------------
create or replace function pg_temp.questly_fundir_topico(p_orfa uuid, p_alvo uuid) returns void as $$
begin
  if p_orfa is null or p_alvo is null then
    return; -- já rodou antes e o tópico órfão já não existe mais
  end if;

  update aluno_topico_progresso as dst set
    num_questoes_respondidas = dst.num_questoes_respondidas + src.num_questoes_respondidas,
    taxa_acerto = case when (dst.num_questoes_respondidas + src.num_questoes_respondidas) = 0 then 0
      else (dst.taxa_acerto * dst.num_questoes_respondidas + src.taxa_acerto * src.num_questoes_respondidas)
           / (dst.num_questoes_respondidas + src.num_questoes_respondidas) end,
    maestria = case when (dst.num_questoes_respondidas + src.num_questoes_respondidas) = 0 then dst.maestria
      else (dst.maestria * dst.num_questoes_respondidas + src.maestria * src.num_questoes_respondidas)
           / (dst.num_questoes_respondidas + src.num_questoes_respondidas) end,
    estabilidade = greatest(dst.estabilidade, src.estabilidade),
    ultima_revisao = greatest(dst.ultima_revisao, src.ultima_revisao),
    status = case
      when 'dominado' in (dst.status, src.status) then 'dominado'
      when 'pendente' in (dst.status, src.status) then 'pendente'
      else dst.status
    end
  from aluno_topico_progresso as src
  where src.topico_id = p_orfa and dst.topico_id = p_alvo and dst.user_id = src.user_id;

  delete from aluno_topico_progresso
  where topico_id = p_orfa
    and user_id in (select user_id from aluno_topico_progresso where topico_id = p_alvo);

  update aluno_topico_progresso set topico_id = p_alvo where topico_id = p_orfa;
  update questions set topic_id = p_alvo where topic_id = p_orfa;
  update missions set recap_topico_id = p_alvo where recap_topico_id = p_orfa;

  delete from topicos where id = p_orfa;
end;
$$ language plpgsql;

do $$
declare v_calc1 uuid;
begin
  select id into v_calc1 from materias where nome = 'Cálculo I';

  perform pg_temp.questly_fundir_topico(
    (select id from topicos where materia_id = v_calc1 and lower(nome) = 'análise de gráficos'),
    (select id from topicos where materia_id = v_calc1 and lower(nome) = 'aplicações da derivada'));

  perform pg_temp.questly_fundir_topico(
    (select id from topicos where materia_id = v_calc1 and lower(nome) = 'derivadas'),
    (select id from topicos where materia_id = v_calc1 and lower(nome) = 'cálculo das derivadas'));

  perform pg_temp.questly_fundir_topico(
    (select id from topicos where materia_id = v_calc1 and lower(nome) = 'problemas de otimização'),
    (select id from topicos where materia_id = v_calc1 and lower(nome) = 'aplicações da derivada'));

  perform pg_temp.questly_fundir_topico(
    (select id from topicos where materia_id = v_calc1 and lower(nome) = 'teorema fundamental do cálculo'),
    (select id from topicos where materia_id = v_calc1 and lower(nome) = 'integral definida'));

  perform pg_temp.questly_fundir_topico(
    (select id from topicos where materia_id = v_calc1 and lower(nome) = 'funções contínuas'),
    (select id from topicos where materia_id = v_calc1 and lower(nome) = 'continuidade'));
end $$;

drop function pg_temp.questly_fundir_topico(uuid, uuid);

-- ---------------------------------------------------------------
-- PARTE 3 — Fundamentos de Cálculo e Geometria: move pro tópico novo
-- "Funções Exponenciais e Logarítmicas" as questões de "Funções em R"
-- que são especificamente sobre isso (equações/inequações
-- exponenciais e logarítmicas, domínio de exponencial/log, meia-vida
-- e decaimento). O resto (domínio genérico, módulo, polinômios,
-- trigonometria, composição) fica em "Funções em R".
-- ---------------------------------------------------------------
do $$
declare
  v_fund uuid;
  v_origem uuid;
  v_destino uuid;
begin
  select id into v_fund from materias where nome = 'Fundamentos de Cálculo e Geometria';
  select id into v_origem from topicos where materia_id = v_fund and lower(nome) = 'funções em r';
  select id into v_destino from topicos where materia_id = v_fund and lower(nome) = 'funções exponenciais e logarítmicas';

  if v_destino is null then
    raise exception 'Tópico "Funções Exponenciais e Logarítmicas" não existe ainda — rode antes a seção FUNDAMENTOS DE CÁLCULO E GEOMETRIA atualizada de supabase_ementas_ciclo_basico.sql.';
  end if;

  update questions set topic_id = v_destino
  where topic_id = v_origem
    and id in (
      'cab1da46-6f64-4b6b-bdfa-002d491ea9d7', -- "Se f(x)=ln(x²-1), o domínio de f é"
      'e90c8322-3198-46b1-ab16-dca50560f9ef', -- "Função exponencial — modelo de resfriamento"
      '5bb933ed-3c5e-4cd5-86dd-5344ec788b2c', -- "Equação exponencial 3^(2x-1)=27^(x+1)"
      '4de5b91e-251e-4db3-8e96-c992ad68b50f', -- "Domínio máximo com radical e logaritmo"
      '664a93de-9015-4b2d-9106-58419111d3e6', -- "Equação exponencial por mudança de variável"
      'f58961cf-6869-4eaa-a7b5-19a0642388be', -- "Inequação exponencial com mudança de variável"
      '726ad181-06cd-4e70-a7d4-bafada95e126', -- "Equação logarítmica com bases diferentes"
      '17045abe-246b-4455-946f-065ae51e5670'  -- "Decaimento exponencial e meia-vida"
    );
end $$;

-- ---------------------------------------------------------------
-- VERIFICAÇÃO — confira a contagem final por tópico
-- ---------------------------------------------------------------
select m.nome as materia, t.nome as topico, t.ordem, count(q.id) as questoes
from topicos t
join materias m on m.id = t.materia_id
left join questions q on q.topic_id = t.id
where m.nome in ('Cálculo I', 'Fundamentos de Cálculo e Geometria')
group by m.nome, t.nome, t.ordem
order by m.nome, t.ordem nulls last;
