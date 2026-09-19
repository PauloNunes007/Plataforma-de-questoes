-- ============================================================
-- TESTAR a semana Pro de lançamento NA PRÓPRIA CONTA ADMIN
--
-- Por que este arquivo existe: `supabase_pro_lancamento.sql` NÃO toca em quem
-- já é Pro, e a conta admin é Pro vitalício (`plano_expira_em is null`, ciclo
-- 'semestral' — ver supabase_plano_pro.sql). Isso é o comportamento certo: um
-- update cego trocaria "sem validade" por "vence em 7 dias" e o dono do
-- projeto perderia o próprio acesso. O efeito colateral é que o dono não
-- consegue VER a semana de lançamento na conta dele — o pop-up pós-lista, o
-- cabeçalho da /pro e o e-mail só acendem com `plano_ciclo = 'lancamento'`.
--
-- Este script coloca a conta admin na semana por alguns minutos e devolve o
-- vitalício depois. Rode o bloco 1, confira na tela, rode o bloco 2.
--
-- ⚠️ NÃO SAIA DAQUI SEM RODAR O BLOCO 2. Enquanto o bloco 1 estiver valendo, a
-- sua conta tem Pro com validade de 7 dias em vez de vitalício — e no oitavo
-- dia ela viraria grátis junto com todo mundo.
-- ============================================================

-- ---------------------------------------------------------------
-- BLOCO 1 — entra na semana (simula uma conta comum da promoção)
-- ---------------------------------------------------------------
update profiles p
set plano = 'pro',
    plano_ciclo = 'lancamento',
    plano_expira_em = now() + interval '7 days',
    plano_fidelidade_ate = null
from auth.users u
where u.id = p.id and u.email = 'paulocresponunes@gmail.com';

-- Confere: tem que voltar plano_ciclo = 'lancamento' e uma data ~7 dias à frente.
select u.email, p.plano, p.plano_ciclo, p.plano_expira_em
from profiles p join auth.users u on u.id = p.id
where u.email = 'paulocresponunes@gmail.com';

-- AGORA, no app:
--   1. abra uma lista em /questoes e RESPONDA até o fim (o aviso nasce em
--      finalizarMissaoAction — encerrar a lista é o gatilho, não abrir);
--   2. o cartão aparece ~0,6s depois do placar;
--   3. a /pro deve dizer "Semana Pro de lançamento" com a data.
--
-- Não apareceu? O pop-up se marca como visto no localStorage do navegador.
-- No console do app (F12):
--     localStorage.removeItem("expectrum_aviso_pro_lancamento_v1")
-- e feche outra lista. Se continuar sem aparecer, confira se o deploy da
-- Vercel já subiu o commit 2f52493 — o código foi pro main hoje.

-- ---------------------------------------------------------------
-- BLOCO 2 — devolve o Pro VITALÍCIO da conta admin (obrigatório)
-- É exatamente o update do fim de supabase_plano_pro.sql.
-- ---------------------------------------------------------------
update profiles p
set plano = 'pro',
    plano_ciclo = 'semestral',
    plano_desde = coalesce(p.plano_desde, now()),
    plano_expira_em = null,
    plano_fidelidade_ate = null
from auth.users u
where u.id = p.id and u.email = 'paulocresponunes@gmail.com';

-- Confere: plano_expira_em tem que estar NULL de novo (= sem validade).
select u.email, p.plano, p.plano_ciclo, p.plano_expira_em
from profiles p join auth.users u on u.id = p.id
where u.email = 'paulocresponunes@gmail.com';
