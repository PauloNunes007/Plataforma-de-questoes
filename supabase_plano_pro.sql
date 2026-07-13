-- Roda depois de supabase_admin_questoes.sql (reutiliza o mesmo e-mail de
-- admin nas policies — não existe coluna de "role" ainda, ver nota em
-- supabase_conteudo_compartilhado.sql). Idempotente (aditivo).
--
-- Plano Pro da Questly. Até aqui a separação grátis/Pro do landing era só
-- copy de marketing (ver web/CLAUDE.md / memory landing_page): esta migração
-- dá base de dados pro gating de verdade.
--
-- Modelo de cobrança nesta primeira versão é MANUAL: o aluno registra a
-- intenção numa linha de `assinaturas` (status 'pendente') e o admin confirma
-- o pagamento (Pix) ativando o Pro. Dá pra plugar um gateway (Mercado
-- Pago/Stripe) depois sem mudar o schema — o webhook faria o mesmo que o
-- admin faz hoje na tela /admin/assinaturas.

-- 1) Estado EFETIVO do plano, denormalizado no profile ---------------------
-- Fica no `profiles` (não só em `assinaturas`) porque `profiles` é legível por
-- qualquer autenticado sob RLS, e o card público do ranking precisa mostrar o
-- selo "PRO" de OUTRO aluno — o que não daria pra fazer lendo `assinaturas`
-- (owner-only). O gating do próprio aluno também lê daqui, uma coluna só.
alter table profiles add column if not exists plano text not null default 'free';
alter table profiles add column if not exists plano_ciclo text;            -- 'mensal' | 'semestral' | null
alter table profiles add column if not exists plano_desde timestamptz;
alter table profiles add column if not exists plano_expira_em timestamptz;  -- null = sem validade (grátis) / vitalício
alter table profiles add column if not exists plano_fidelidade_ate timestamptz; -- fim da fidelidade do semestral recorrente

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_plano_check'
  ) then
    alter table profiles add constraint profiles_plano_check
      check (plano in ('free', 'pro'));
  end if;
end $$;

-- Admin pode atualizar qualquer profile (ativar/revogar o Pro de um aluno) —
-- mesmo modelo de confiança de uma conta só das outras policies de admin. A
-- policy de UPDATE dono-only já existente continua valendo (policies
-- permissivas se somam com OR).
drop policy if exists "admin atualiza qualquer profile" on profiles;
create policy "admin atualiza qualquer profile" on profiles
  for update
  using (auth.jwt() ->> 'email' = 'paulocresponunes@gmail.com')
  with check (auth.jwt() ->> 'email' = 'paulocresponunes@gmail.com');

-- 2) Assinaturas (log de intenção + histórico) -----------------------------
create table if not exists assinaturas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ciclo text not null check (ciclo in ('mensal', 'semestral')),
  forma text not null check (forma in ('recorrente', 'a_vista')),
  valor_centavos int not null,
  status text not null default 'pendente'
    check (status in ('pendente', 'ativa', 'cancelada', 'expirada')),
  observacao text,                 -- nota do admin (ex.: "pago via Pix 13/07")
  criada_em timestamptz not null default now(),
  ativada_em timestamptz,
  expira_em timestamptz,
  fidelidade_ate timestamptz
);

alter table assinaturas enable row level security;

-- Só uma assinatura pendente por aluno por vez (evita duplicar ao clicar
-- "Assinar" de novo enquanto aguarda confirmação).
create unique index if not exists assinaturas_uma_pendente_por_user
  on assinaturas (user_id) where status = 'pendente';

-- Dono insere/lê/atualiza as próprias (cancelar a pendente); admin vê e
-- atualiza todas (confirmar pagamento). Mesmo padrão assimétrico de
-- question_reports.
drop policy if exists "dono insere assinatura" on assinaturas;
create policy "dono insere assinatura" on assinaturas
  for insert with check (auth.uid() = user_id);

drop policy if exists "dono le assinatura" on assinaturas;
create policy "dono le assinatura" on assinaturas
  for select using (auth.uid() = user_id);

drop policy if exists "dono atualiza assinatura" on assinaturas;
create policy "dono atualiza assinatura" on assinaturas
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "admin le assinaturas" on assinaturas;
create policy "admin le assinaturas" on assinaturas
  for select using (auth.jwt() ->> 'email' = 'paulocresponunes@gmail.com');

drop policy if exists "admin atualiza assinaturas" on assinaturas;
create policy "admin atualiza assinaturas" on assinaturas
  for update using (auth.jwt() ->> 'email' = 'paulocresponunes@gmail.com')
  with check (auth.jwt() ->> 'email' = 'paulocresponunes@gmail.com');

-- 3) Concede Pro (vitalício) à conta dona/admin do projeto ------------------
-- plano_expira_em = null => sem validade (ehPro() em plano.ts trata null como
-- "não expira"). Roda pelo id do profile a partir do e-mail em auth.users.
update profiles p
  set plano = 'pro',
      plano_ciclo = 'semestral',
      plano_desde = coalesce(p.plano_desde, now()),
      plano_expira_em = null,
      plano_fidelidade_ate = null
  from auth.users u
  where u.id = p.id and u.email = 'paulocresponunes@gmail.com';
