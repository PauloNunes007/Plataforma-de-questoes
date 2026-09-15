-- ============================================================
-- QUESTLY — Preparo de escala pro lançamento (auditoria 2026-09-15)
-- Rodar no SQL Editor DEPOIS de supabase_questao_desafio.sql e
-- supabase_seguranca_hardening.sql. Aditiva e idempotente.
--
-- POR QUE ESTA MIGRAÇÃO EXISTE
--
-- 1) TETO DE 1000 LINHAS DO POSTGREST. O `max-rows` do Supabase corta TODA
--    resposta em 1000 linhas, e `.limit(20000)` NÃO levanta esse teto — só
--    consegue abaixá-lo. Vários lugares do app faziam "puxa a tabela
--    `questions` inteira e conta no JS", acreditando que o .limit alto
--    resolvia. Com 2.583 questões no banco isso já estava truncando de
--    verdade: a matéria "Fundamentos de Cálculo e Geometria" sumiu do Banco
--    de Questões, e a trilha de um aluno com 4 disciplinas já marcava 2
--    tópicos como "sem questões" tendo questões.
--
--    A correção certa não é paginar 2.583 linhas — é não trazer linha nenhuma:
--    as views abaixo devolvem a CONTAGEM já agregada (74 linhas em vez de
--    2.583, e ~180 em vez de 2.583 no caso por instituição). O app ainda
--    pagina a leitura das views (lib/supabase/paginado.ts) pra que o teto
--    nunca mais possa truncar em silêncio, por mais que o banco cresça.
--
--    As views expõem só CONTAGEM de conteúdo compartilhado — nada de aluno.
--    Qualquer autenticado já podia derivar esses números lendo `questions`
--    (policy de leitura pra authenticated), então não há exposição nova.
--    `anon` NÃO recebe grant: a landing pública segue lendo via service_role,
--    igual a hoje.
--
-- 2) CORRIDA NOS CONTADORES GLOBAIS DA QUESTÃO. `tentativas_total`/
--    `acertos_total` eram lidos e reescritos pelo app (read-modify-write).
--    Dois alunos respondendo a MESMA questão ao mesmo tempo = atualização
--    perdida, e os dados que alimentam a rede neural derivam pra baixo. Vira
--    um UPDATE atômico dentro do banco.
--
-- 3) CORRIDA NA GERAÇÃO DA MISSÃO DO DIA. `questlyGerarMissoesDoDia` lê "já
--    existe missão hoje?" e insere — duas abas abertas geram duas missões.
--    JÁ ACONTECEU em produção (uma conta com 9 missões pro mesmo dia/
--    disciplina). O índice único fecha a corrida no banco; o app passa a
--    tratar a violação como "outra aba ganhou" em vez de erro.
--
-- 4) ÍNDICES que faltavam pros filtros mais quentes (instituição no montador
--    de simulados e no onboarding; ordenação do ranking).
-- ============================================================


-- ---------------------------------------------------------------------------
-- 1) Views de contagem — substituem as varreduras de `questions`
-- ---------------------------------------------------------------------------

-- Quantas questões cada tópico tem. `total_regular` exclui aprofundamento
-- (questions.desafio), que é o recorte que todo sorteio automático usa —
-- missão do dia, trilha, GPS, montador. Nome/ordem/matéria vêm junto porque
-- uma view não carrega FK: sem isso o PostgREST não consegue fazer o embed
-- `topicos!inner(...)` e o app precisaria de uma segunda query.
drop view if exists vw_questoes_por_topico;
create view vw_questoes_por_topico as
select
  t.id                                          as topic_id,
  t.nome                                        as topico_nome,
  t.ordem                                       as topico_ordem,
  t.materia_id                                  as materia_id,
  m.nome                                        as materia_nome,
  count(q.id)                                   as total,
  count(q.id) filter (where q.desafio is not true) as total_regular,
  -- Soma e amostra do tempo médio (só das regulares e só de quem JÁ tem
  -- estimativa): o GPS da home precisa da média por tópico, e a média sai de
  -- soma/amostra sem trazer uma linha por questão. Somar aqui em vez de expor
  -- avg() direto deixa o chamador decidir o que fazer quando amostra = 0
  -- (hoje: tempo desconhecido, não zero).
  coalesce(sum(q.tempo_medio_seg) filter (where q.desafio is not true and q.tempo_medio_seg is not null), 0) as tempo_soma_seg,
  count(q.id) filter (where q.desafio is not true and q.tempo_medio_seg is not null) as tempo_amostra
from topicos t
join materias m on m.id = t.materia_id
join questions q on q.topic_id = t.id
group by t.id, t.nome, t.ordem, t.materia_id, m.nome;

-- Mesma contagem, quebrada por instituição/dificuldade/ano — é a grade que o
-- montador de simulados desenha e o agregado que o onboarding mostra no selo
-- de verificação da universidade.
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
where q.instituicao is not null
group by q.instituicao, t.id, t.nome, t.ordem, t.materia_id, m.nome, q.dificuldade, q.ano;

-- Valores distintos de `questions.instituicao` com a contagem. O onboarding
-- sugere universidades a partir daqui em vez de baixar uma coluna de 2.583
-- linhas só pra descobrir 8 valores distintos.
drop view if exists vw_instituicoes;
create view vw_instituicoes as
select
  q.instituicao   as instituicao,
  count(*)        as total
from questions q
where q.instituicao is not null
group by q.instituicao;

grant select on vw_questoes_por_topico      to authenticated;
grant select on vw_questoes_por_instituicao to authenticated;
grant select on vw_instituicoes             to authenticated;


-- ---------------------------------------------------------------------------
-- 2) Contadores globais da questão — incremento atômico
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER porque `questions` só é escrita pelo admin
-- (supabase_seguranca_hardening.sql) e quem chama é um aluno comum. A função
-- é deliberadamente estreita: só mexe nestas três colunas, de UMA questão, e
-- não aceita valor absoluto nenhum — não dá pra usar ela pra forjar nada.
-- Quem chama (lib/questao/actions.ts) já validou a sessão.
create or replace function questly_registrar_estatistica_questao(
  p_question_id uuid,
  p_correta boolean,
  p_tempo_seg integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update questions
     set tentativas_total = coalesce(tentativas_total, 0) + 1,
         acertos_total    = coalesce(acertos_total, 0) + (case when p_correta then 1 else 0 end),
         -- Média móvel exponencial, a mesma de sempre (anterior*0.7 + novo*0.3).
         -- Feita aqui dentro, some o read-modify-write que existia no app.
         tempo_medio_seg  = case
           when p_tempo_seg is null or p_tempo_seg <= 0 then tempo_medio_seg
           when tempo_medio_seg is null then p_tempo_seg
           else round(tempo_medio_seg * 0.7 + p_tempo_seg * 0.3)
         end
   where id = p_question_id;
end;
$$;

revoke all on function questly_registrar_estatistica_questao(uuid, boolean, integer) from public;
grant execute on function questly_registrar_estatistica_questao(uuid, boolean, integer) to service_role;


-- ---------------------------------------------------------------------------
-- 3) Uma missão do dia por aluno/disciplina — fecha a corrida
-- ---------------------------------------------------------------------------
-- DEDUPLICAÇÃO ANTES DO ÍNDICE: a corrida já rodou em produção, então existem
-- duplicatas e o create unique index falharia. Mantém a missão mais "válida"
-- de cada grupo — concluída na frente (ela pagou XP e tem histórico), e entre
-- iguais a mais antiga. As outras viram avulsas em vez de serem apagadas:
-- question_attempts referencia mission_id, e o placar/histórico do aluno não
-- pode sumir por causa de uma limpeza de schema.
with ranqueadas as (
  select
    id,
    row_number() over (
      partition by user_id, subject_id, data
      order by concluida desc, id asc
    ) as posicao
  from missions
  where avulsa is not true
)
update missions m
   set avulsa = true
  from ranqueadas r
 where m.id = r.id
   and r.posicao > 1;

create unique index if not exists ux_missions_dia
  on missions (user_id, subject_id, data)
  where avulsa is not true;


-- ---------------------------------------------------------------------------
-- 4) Índices dos filtros quentes
-- ---------------------------------------------------------------------------
-- Toda abertura do montador de simulados e toda validação de universidade no
-- onboarding filtram por instituição — sem índice, é seq scan na `questions`.
create index if not exists idx_questions_instituicao on questions (instituicao);

-- Ordenação do ranking (Geral por xp_total, Semana por xp_semana). Com 900
-- alunos o sort em memória ainda é barato, mas o Top 100 vira leitura de
-- índice em vez de ordenar a tabela inteira a cada abertura da tela.
create index if not exists idx_profiles_xp_total  on profiles (xp_total desc);
create index if not exists idx_profiles_xp_semana on profiles (xp_semana desc);

-- O upsert de daily_logs (onConflict "user_id,data") depende desta unicidade.
-- A tabela é do schema base, criada à mão no painel — se a constraint não
-- existir, o upsert falha em runtime. Idempotente: se já existe, não faz nada.
create unique index if not exists ux_daily_logs_user_data on daily_logs (user_id, data);
