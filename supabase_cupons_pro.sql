-- Roda depois de supabase_plano_pro.sql e supabase_seguranca_hardening.sql
-- (reutiliza o mesmo e-mail de admin nas policies, e o resgate escreve em
-- `profiles` via service_role pra passar pelo trigger de proteção). Idempotente
-- (aditivo).
--
-- Cupons de Pro grátis: um admin cria um código com N dias de Pro e um limite
-- opcional de usos; o aluno resgata em /pro (`resgatarCupomAction`, em
-- web/src/lib/plano/actions.ts). NÃO passa pelo Mercado Pago — o resgate
-- concede o plano direto, mesma ativação idempotente usada pelo pagamento real
-- (ver web/CLAUDE.md, seção "Segurança & pagamento do Pro").

-- 1) Cupons ------------------------------------------------------------------
create table if not exists cupons (
  id uuid primary key default gen_random_uuid(),
  codigo text not null,
  descricao text,                    -- nota interna do admin (ex.: "Lançamento UFF")
  dias_pro int not null check (dias_pro > 0),
  limite_usos int,                   -- null = ilimitado
  usos int not null default 0,
  ativo boolean not null default true,
  expira_em timestamptz,             -- null = sem validade própria
  criado_em timestamptz not null default now(),
  criado_por text                    -- e-mail do admin que criou
);

alter table cupons enable row level security;

-- Case-insensitive: "LANCAMENTO2026" e "lancamento2026" são o mesmo código.
create unique index if not exists cupons_codigo_lower_key on cupons (lower(codigo));

drop policy if exists "admin gerencia cupons" on cupons;
create policy "admin gerencia cupons" on cupons
  for all
  using (auth.jwt() ->> 'email' = 'paulocresponunes@gmail.com')
  with check (auth.jwt() ->> 'email' = 'paulocresponunes@gmail.com');

-- Sem policy de select pra aluno de propósito: a validação do código (existe?
-- ativo? expirado? esgotado?) roda via service_role em resgatarCupomAction,
-- não direto do cliente — um aluno não precisa (nem deve) listar os cupons.

-- 2) Resgates (histórico + trava de "um resgate por aluno por cupom") -------
create table if not exists cupom_resgates (
  id uuid primary key default gen_random_uuid(),
  cupom_id uuid not null references cupons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  dias_concedidos int not null,
  resgatado_em timestamptz not null default now()
);

alter table cupom_resgates enable row level security;

create unique index if not exists cupom_resgates_unico_por_aluno
  on cupom_resgates (cupom_id, user_id);

drop policy if exists "dono le seus resgates" on cupom_resgates;
create policy "dono le seus resgates" on cupom_resgates
  for select using (auth.uid() = user_id);

drop policy if exists "admin le resgates" on cupom_resgates;
create policy "admin le resgates" on cupom_resgates
  for select using (auth.jwt() ->> 'email' = 'paulocresponunes@gmail.com');

-- Sem policy de insert pra aluno: o resgate é sempre escrito via service_role
-- (mesmo cliente que concede o Pro em `profiles`), nunca pelo cliente do aluno.
