-- ============================================================
-- EXPECTRUM — SEMANA PRO DE LANÇAMENTO
--
-- Roda depois de supabase_plano_pro.sql e supabase_seguranca_hardening.sql.
-- Rodar no SQL Editor do Supabase. É um conserto/concessão de DADO, não
-- schema novo: nenhuma coluna, nenhuma policy, nenhum índice.
--
-- O QUE FAZ
--
-- Libera 7 dias de Pro pra toda conta que HOJE não é Pro. A validade é a
-- própria revogação: `ehPro()` (web/src/lib/plano/plano.ts) já trata
-- `plano_expira_em` no passado como plano grátis, então no oitavo dia a
-- plataforma volta sozinha ao grátis — sem cron, sem segundo script, sem
-- ninguém lembrar de rodar nada.
--
-- `plano_ciclo = 'lancamento'` é o que faz a concessão se IDENTIFICAR pelo
-- resto do app: é por esse valor que a tela de planos escreve "Semana Pro de
-- lançamento" em vez de "Pro Mensal", que o e-mail de boas-vindas muda o
-- agradecimento e que o aviso pós-lista aparece. Sem ele o aluno acharia que
-- a plataforma virou grátis — que é exatamente o contrário do que a semana
-- existe pra provar.
--
-- QUEM ESTE SCRIPT NÃO TOCA, e por quê
--
--   • quem está Pro AGORA (pagante, cupom ativo) — a concessão ENCURTARIA o
--     plano de quem pagou por seis meses e apagaria o `plano_ciclo` real da
--     linha. Quem já é Pro não é público desta semana: ele já tem tudo, e o
--     que ele tem vale mais que 7 dias;
--   • a conta admin (`plano_expira_em is null` = vitalício) — cai na mesma
--     regra acima, mas vale dizer separado porque é o erro que só se descobre
--     depois: um `update` cego trocaria "sem validade" por "vence em 7 dias"
--     e o dono do projeto perderia o próprio acesso vitalício.
--
-- Conta já vencida (`plano='pro'` com data no passado) ENTRA: ela não é Pro
-- por `ehPro`, e nada aqui a encurta.
--
-- O trigger `questly_proteger_colunas_profile` (supabase_seguranca_hardening)
-- deixa passar: sessão sem JWT do PostgREST — que é o caso do SQL Editor — é
-- tratada como `eh_sql_direto`.
--
-- Contas NOVAS não são cobertas por este arquivo: elas ainda não existem.
-- Quem as atende é `concederProLancamento` (web/src/lib/plano/lancamento-servidor.ts),
-- chamada no nascimento do profile enquanto a janela estiver aberta. A data
-- que fecha a janela é PROMO_LANCAMENTO_FIM_PADRAO (web/src/lib/plano/lancamento.ts)
-- ou a env QUESTLY_PROMO_LANCAMENTO_FIM — se mexer aqui, mexa lá.
-- ============================================================

-- 1) Antes: quantas contas a concessão vai atingir, e quantas ficam de fora.
select
  count(*) filter (
    where not (plano = 'pro' and (plano_expira_em is null or plano_expira_em > now()))
  ) as vao_ganhar_a_semana,
  count(*) filter (
    where plano = 'pro' and plano_expira_em is null
  ) as pro_vitalicio_intocado,
  count(*) filter (
    where plano = 'pro' and plano_expira_em > now()
  ) as pro_ativo_intocado,
  count(*) as contas_no_total
from profiles;

-- 2) A concessão.
update profiles
set plano = 'pro',
    plano_ciclo = 'lancamento',
    plano_desde = coalesce(plano_desde, now()),
    plano_expira_em = now() + interval '7 days',
    -- Fidelidade é compromisso de quem assinou 6 cobranças. Um brinde de 7
    -- dias não compromete ninguém a nada, e deixar lixo aqui faria a tela do
    -- aluno anunciar uma fidelidade que ele nunca aceitou.
    plano_fidelidade_ate = null
where not (plano = 'pro' and (plano_expira_em is null or plano_expira_em > now()));

-- 3) Verificação: a primeira linha é a semana concedida (todas com a mesma
--    validade, ~7 dias à frente); as outras são o que ficou intocado.
select plano,
       plano_ciclo,
       count(*) as contas,
       min(plano_expira_em) as expira_mais_cedo,
       max(plano_expira_em) as expira_mais_tarde
from profiles
group by plano, plano_ciclo
order by contas desc;

-- ============================================================
-- DESFAZER (só se a concessão precisar ser cancelada antes da hora).
-- Devolve ao grátis EXCLUSIVAMENTE quem entrou por esta semana — o
-- `plano_ciclo = 'lancamento'` é o que separa esses do resto, e é por isso
-- que ele existe. Nunca mexa nisto sem o filtro de ciclo.
-- ============================================================
-- update profiles
-- set plano = 'free', plano_ciclo = null, plano_expira_em = null
-- where plano_ciclo = 'lancamento';
