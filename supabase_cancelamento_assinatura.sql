-- ============================================================
-- CANCELAMENTO E REEMBOLSO DE ARREPENDIMENTO  (rodar depois de
-- supabase_assinatura_recorrente.sql)
--
-- É DEPLOY BLOCKER: `lib/plano/actions.ts` passa a gravar status
-- 'reembolsada' e as colunas novas. Sem a migração, o CHECK derruba o
-- cancelamento com reembolso (o do MP já teria acontecido) — o pior desfecho
-- possível: dinheiro devolvido e assinatura marcada como ativa.
--
-- POR QUE EXISTE
--
-- Vender assinatura no Brasil obriga a ter saída, e por dois caminhos
-- diferentes que a tela precisa saber distinguir:
--
--   1. ARREPENDIMENTO (CDC art. 49) — 7 dias corridos da contratação, para
--      compra fora do estabelecimento (o que inclui a internet). Não depende
--      de motivo, de defeito ou da nossa concordância, e a devolução é do
--      valor INTEGRAL, "de imediato" e monetariamente atualizado. Como é
--      integral, o acesso volta a ser o de quem não pagou: o Pro é revogado
--      junto, na mesma ação;
--   2. CANCELAMENTO DA RENOVAÇÃO — parar a próxima cobrança. Vale só pra
--      assinatura recorrente de verdade (preapproval no MP), e NÃO tira o mês
--      já pago: quem pagou o mês usa o mês.
--
-- O CDC art. 6º, e o Decreto 11.034/2022 no que alcança, pedem que o
-- cancelamento seja pelo MESMO canal da contratação e sem degrau maior que o
-- da compra: se assinar são dois cliques, cancelar não pode ser um e-mail
-- respondido em 5 dias úteis. Daí o menu em /pro, e não um "fale conosco".
--
-- O que estas colunas guardam é o RASTRO da saída — quando, por qual porta e
-- quanto voltou. Sem isso, uma linha 'cancelada' não diz se o aluno desistiu
-- da renovação ou se teve o dinheiro de volta, e essas duas coisas têm
-- consequências opostas no acesso.
--
-- Nenhuma mudança de RLS: quem escreve aqui é sempre o service_role
-- (lib/plano/actions.ts → createAdminClient). A policy de dono continua sendo
-- só 'pendente' → 'cancelada', de supabase_seguranca_hardening.sql — e
-- continua sendo a certa: cancelar uma assinatura ATIVA envolve falar com o
-- Mercado Pago e mexer em `profiles.plano`, duas coisas que o cliente do aluno
-- não pode fazer sozinho.
-- ============================================================

alter table assinaturas add column if not exists cancelada_em timestamptz;
alter table assinaturas add column if not exists motivo_cancelamento text;
alter table assinaturas add column if not exists reembolsada_em timestamptz;
alter table assinaturas add column if not exists reembolso_centavos int;

-- 'reembolsada' é status próprio, não um 'cancelada' com coluna extra: uma
-- assinatura cancelada foi USADA até o fim do período pago; uma reembolsada
-- não foi paga. Só a segunda revoga o Pro, e misturar as duas num status só
-- obrigaria todo leitor a conferir uma coluna pra saber qual é qual.
do $$
begin
  if exists (select 1 from pg_constraint where conname = 'assinaturas_status_check') then
    alter table assinaturas drop constraint assinaturas_status_check;
  end if;
  alter table assinaturas add constraint assinaturas_status_check
    check (status in ('pendente', 'ativa', 'cancelada', 'expirada', 'inadimplente', 'reembolsada'));
end $$;

-- Conferência: deve listar 'reembolsada' entre os valores aceitos.
--   select pg_get_constraintdef(oid) from pg_constraint
--   where conname = 'assinaturas_status_check';
