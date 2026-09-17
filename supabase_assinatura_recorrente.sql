-- Roda depois de supabase_plano_pro.sql e supabase_seguranca_hardening.sql
-- (reutiliza o mesmo e-mail de admin nas policies). Aditivo e idempotente.
--
-- ASSINATURA DE VERDADE (cobrança recorrente no Mercado Pago).
--
-- O buraco que esta migração fecha, achado em 2026-09-16: o plano "Pro
-- Semestral, R$ 10/mês com fidelidade de 6 meses" era vendido como recorrente
-- mas cobrado como um pagamento AVULSO. `criarPreferenciaCheckout` montava uma
-- preferência de Checkout Pro com `unit_price = opcao.precoCentavos / 100` —
-- ou seja, R$ 10 UMA vez — e `ativarAssinatura` concedia os 6 meses inteiros
-- na primeira aprovação. O aluno pagava R$ 10 e levava o semestre; o
-- compromisso de 6 meses existia só no texto do cartão.
--
-- O conserto tem duas metades, e esta é a do banco:
--
--   • o app passa a criar uma PREAPPROVAL (assinatura) no Mercado Pago pras
--     opções `forma = 'recorrente'` — o MP cobra o cartão todo mês, 6 vezes no
--     semestral (limitado por `end_date`) e indefinidamente no mensal;
--   • cada cobrança aprovada estende o Pro em UM mês. Isso exige saber quais
--     cobranças já foram aplicadas, senão o webhook (que o MP reenvia) somaria
--     o mesmo mês duas vezes. É o que a tabela abaixo guarda.
--
-- O índice único em `gateway_payment_id` — não um filtro em JS — é o que
-- garante que uma cobrança conte uma vez só, inclusive quando o webhook e o
-- polling da tela /pro chegam juntos.

-- 1) Referência da assinatura no gateway -----------------------------------
-- O id da preapproval do MP. Guardado pra consulta direta (`GET /preapproval/
-- {id}`) e pra dar ao admin um caminho de auditoria em /admin/assinaturas.
-- Nullable de propósito: assinatura à vista e ativação manual não têm uma.
alter table assinaturas add column if not exists gateway_id text;

create index if not exists assinaturas_gateway_id_idx
  on assinaturas (gateway_id) where gateway_id is not null;

-- 2) Cobranças aplicadas ----------------------------------------------------
-- Uma linha por cobrança do gateway que JÁ virou tempo de Pro no profile.
-- Deliberadamente burra: não é um espelho da contabilidade do Mercado Pago (a
-- verdade do dinheiro mora lá), é só o livro do que este app já creditou.
create table if not exists assinatura_pagamentos (
  id uuid primary key default gen_random_uuid(),
  assinatura_id uuid not null references assinaturas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  -- id do pagamento no MP. Text porque o MP mistura numérico e alfanumérico
  -- entre pagamento avulso e cobrança de assinatura.
  gateway_payment_id text not null,
  valor_centavos int,
  -- quantos meses de Pro esta cobrança pagou (1 no recorrente, 6 no à vista)
  meses_creditados int not null default 1,
  criada_em timestamptz not null default now()
);

-- O BACKSTOP. Sem ele, dois caminhos independentes chegam à mesma ativação
-- (webhook + conferência da tela) e o aluno ganharia dois meses por um.
create unique index if not exists ux_assinatura_pagamentos_gateway
  on assinatura_pagamentos (gateway_payment_id);

create index if not exists assinatura_pagamentos_assinatura_idx
  on assinatura_pagamentos (assinatura_id, criada_em desc);

alter table assinatura_pagamentos enable row level security;

-- Leitura: o dono vê as próprias cobranças (o extrato na tela /pro) e o admin
-- vê todas. ESCRITA não tem policy nenhuma de propósito — quem grava aqui é
-- sempre o servidor com service_role, na mesma trilha que escreve
-- `profiles.plano` (protegida pelo trigger de supabase_seguranca_hardening).
drop policy if exists "dono le pagamentos da assinatura" on assinatura_pagamentos;
create policy "dono le pagamentos da assinatura" on assinatura_pagamentos
  for select using (auth.uid() = user_id);

drop policy if exists "admin le pagamentos da assinatura" on assinatura_pagamentos;
create policy "admin le pagamentos da assinatura" on assinatura_pagamentos
  for select using (auth.jwt() ->> 'email' = 'paulocresponunes@gmail.com');

-- 3) Status 'inadimplente' --------------------------------------------------
-- Uma assinatura recorrente pode existir com o cartão recusado: não está
-- cancelada (o MP vai tentar de novo) nem ativa (não há mês pago à frente).
-- Sem este estado, a única saída seria mentir num dos dois.
do $$
begin
  if exists (select 1 from pg_constraint where conname = 'assinaturas_status_check') then
    alter table assinaturas drop constraint assinaturas_status_check;
  end if;
  alter table assinaturas add constraint assinaturas_status_check
    check (status in ('pendente', 'ativa', 'cancelada', 'expirada', 'inadimplente'));
end $$;

-- 4) Verificação ------------------------------------------------------------
-- Esperado: uma linha, com gateway_id presente na lista de colunas.
-- select column_name from information_schema.columns
--   where table_name = 'assinaturas' and column_name = 'gateway_id';
--
-- Esperado: 'ux_assinatura_pagamentos_gateway'.
-- select indexname from pg_indexes where tablename = 'assinatura_pagamentos';
