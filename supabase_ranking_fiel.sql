-- ============================================================
-- QUESTLY — Ranking fiel (nível de verdade, XP atômico, contadores que
-- não desandam)
--
-- Rodar DEPOIS de supabase_acertos_publicos.sql e de
-- supabase_escala_lancamento.sql. Aditiva e idempotente.
-- É DEPLOY BLOCKER: lib/questly/economia.ts passa a chamar a função
-- criada aqui (tem fallback pro caminho antigo, mas o fallback é
-- justamente o que carrega os bugs descritos abaixo).
--
-- Origem: auditoria do ranking (2026-09-17). Três coisas mentiam na
-- tela, todas na mesma trilha (profiles <- economia):
--
-- 1) `profiles.nivel` NUNCA era escrito pelo app Next.js. A coluna é
--    lida na home (hero), no ranking global (coluna "Nível") e nos
--    distintivos nivel-5/10/20 — e ficava em 1 pra sempre em TODA conta
--    real. As únicas linhas com nível de verdade eram as 40 contas de
--    teste de supabase_seed_ranking_teste.sql, que semeia
--    `greatest(1, xp_total/1750)`: o ranking mostrava aluno fictício no
--    nível 12 ao lado de aluno real com 9.000 XP no nível 1.
--    Aqui o nível vira FUNÇÃO do XP (questly_nivel_do_xp) em vez de um
--    contador à parte — XP é a verdade, nível é uma leitura dela, então
--    não existe estado pra dessincronizar. A coluna continua existindo e
--    é mantida em dia pela mesma função, pro card público e pros
--    distintivos não precisarem recalcular.
--
-- 2) O incremento de XP era read-modify-write no app (SELECT xp_total ->
--    UPDATE xp_total = lido + ganho). Duas listas fechadas ao mesmo
--    tempo (duas abas, ou o cliente reenviando) liam o mesmo valor e a
--    segunda sobrescrevia a primeira: XP ganho pelo aluno, perdido no
--    ranking. Mesmo bug que questly_registrar_estatistica_questao
--    (supabase_escala_lancamento.sql) resolveu do lado de `questions`, e
--    mesma solução: a soma acontece DENTRO do UPDATE, no banco.
--
-- 3) `questoes_total`/`acertos_total`/`questoes_semana` só eram
--    incrementados ao FECHAR uma lista. Quem respondia 30 questões e
--    saía sem finalizar tinha 30 linhas em question_attempts e 0 no
--    contador — e a home (que conta question_attempts direto) mostrava
--    um número enquanto o card do ranking mostrava outro, pro MESMO
--    aluno. supabase_acertos_publicos.sql já tinha notado a deriva e
--    corrigido com um backfill único; backfill não conserta a causa, só
--    a foto. Aqui os contadores de QUESTÃO passam a ser RECOMPUTADOS a
--    partir de question_attempts (a verdade) a cada fechamento, então a
--    deriva se conserta sozinha. XP segue incremental de propósito: ele
--    depende de combo/maestria/anti-farm do instante da resposta e não é
--    reconstruível a partir da tentativa.
-- ============================================================

-- ---------------------------------------------------------------------------
-- 1) A curva de nível — fonte única, espelhada em lib/questly/shared.ts
-- ---------------------------------------------------------------------------
-- XP acumulado pra CHEGAR no nível n = 25 * n * (n-1):
--   N2=50  N3=150  N5=500  N10=2.250  N20=9.500  N30=21.750
-- Com ~5 XP por questão, o nível 2 sai na primeira lista e o 20 pede
-- alguns milhares de questões — subir tem que ficar mais caro, senão o
-- número vira só o XP dividido por uma constante (era o que o seed fazia).
create or replace function questly_nivel_do_xp(p_xp integer)
returns integer
language sql
immutable
as $fn$
  select greatest(
    1,
    floor((1 + sqrt(1 + (4 * greatest(coalesce(p_xp, 0), 0)::numeric / 25))) / 2)::int
  );
$fn$;

-- ---------------------------------------------------------------------------
-- 2) Economia atômica: XP somado no banco, contadores recompostos da verdade
-- ---------------------------------------------------------------------------
-- Chamada por lib/questly/economia.ts com o cliente service_role (as
-- colunas são protegidas por questly_proteger_colunas_profile —
-- supabase_seguranca_hardening.sql). O `security definer` é o que deixa a
-- função enxergar question_attempts do aluno; o grant lá embaixo é o que
-- impede qualquer outro papel de chamá-la.
--
-- p_semana_inicio é a segunda-feira da semana corrente JÁ normalizada
-- pela virada de liga (questlyGarantirSemanaLiga). Recalcular a semana
-- aqui dentro usaria o fuso do servidor do Postgres (UTC), e a semana do
-- aluno é a de America/Sao_Paulo — a diferença de 3h joga o domingo à
-- noite pra semana seguinte.
create or replace function questly_registrar_progresso(
  p_user_id uuid,
  p_xp integer,
  p_semana_inicio date
)
returns table (
  xp_total integer,
  xp_semana integer,
  nivel integer,
  questoes_total integer,
  acertos_total integer
)
language plpgsql
security definer
set search_path = public
as $fn$
begin
  return query
  update profiles p
     set xp_total  = greatest(0, coalesce(p.xp_total, 0) + coalesce(p_xp, 0)),
         xp_semana = greatest(0, coalesce(p.xp_semana, 0) + coalesce(p_xp, 0)),
         nivel     = questly_nivel_do_xp(greatest(0, coalesce(p.xp_total, 0) + coalesce(p_xp, 0))),
         -- Recomputados, não incrementados: question_attempts é a única
         -- fonte de "quantas o aluno respondeu". Pega também as questões
         -- de listas abandonadas, que o incremento no fechamento perdia.
         questoes_total = coalesce(
           (select count(*) from question_attempts qa where qa.user_id = p_user_id), 0),
         acertos_total = coalesce(
           (select count(*) from question_attempts qa where qa.user_id = p_user_id and qa.correta), 0),
         questoes_semana = coalesce(
           (select count(*) from question_attempts qa
             where qa.user_id = p_user_id
               and p_semana_inicio is not null
               and qa.created_at >= p_semana_inicio::timestamptz), 0)
   where p.id = p_user_id
   returning p.xp_total, p.xp_semana, p.nivel, p.questoes_total, p.acertos_total;
end;
$fn$;

revoke all on function questly_registrar_progresso(uuid, integer, date) from public;
grant execute on function questly_registrar_progresso(uuid, integer, date) to service_role;

-- ---------------------------------------------------------------------------
-- 3) Backfill: alinha TODO mundo de uma vez
-- ---------------------------------------------------------------------------
-- (roda sem JWT no SQL Editor, então passa pelo bypass eh_sql_direto do
--  trigger de proteção — ver supabase_acertos_publicos.sql)
update profiles p
   set nivel          = questly_nivel_do_xp(coalesce(p.xp_total, 0)),
       questoes_total = coalesce((select count(*) from question_attempts qa where qa.user_id = p.id), 0),
       acertos_total  = coalesce((select count(*) from question_attempts qa where qa.user_id = p.id and qa.correta), 0)
 where p.nivel is distinct from questly_nivel_do_xp(coalesce(p.xp_total, 0))
    or p.questoes_total is distinct from coalesce((select count(*) from question_attempts qa where qa.user_id = p.id), 0)
    or p.acertos_total is distinct from coalesce((select count(*) from question_attempts qa where qa.user_id = p.id and qa.correta), 0);

-- ---------------------------------------------------------------------------
-- 4) Índices do Top 100 — a ordenação do ranking agora tem desempate
-- ---------------------------------------------------------------------------
-- Sem desempate, dois alunos com o MESMO XP trocavam de lugar entre um
-- refetch e outro (a tela se atualiza sozinha a cada 3 min), e a posição
-- fixada de "Você" — contada por "quantos têm XP estritamente maior" — não
-- batia com a linha dele na lista, contada por índice. Os índices abaixo
-- estendem os de supabase_escala_lancamento.sql com as colunas de
-- desempate, pra ordenação continuar servida por índice.
create index if not exists ix_profiles_ranking_geral
  on profiles (xp_total desc, questoes_total desc, id);
create index if not exists ix_profiles_ranking_semana
  on profiles (semana_inicio, xp_semana desc, questoes_semana desc, id);

-- ---------------------------------------------------------------------------
-- VERIFICAÇÃO (esperado: nenhuma linha)
-- ---------------------------------------------------------------------------
-- select id, nome, xp_total, nivel, questoes_total, acertos_total
--   from profiles p
--  where nivel is distinct from questly_nivel_do_xp(coalesce(xp_total, 0))
--     or questoes_total is distinct from (select count(*) from question_attempts qa where qa.user_id = p.id)
--     or acertos_total  is distinct from (select count(*) from question_attempts qa where qa.user_id = p.id and qa.correta);
