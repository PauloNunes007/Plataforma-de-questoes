-- ============================================================
-- QUESTLY — Hardening de segurança (rodar à mão no SQL Editor do
-- Supabase, DEPOIS de supabase_plano_pro.sql). Idempotente/aditivo.
--
-- Motivação (revisão de segurança antes de publicar):
--
-- 1) FURO CRÍTICO — auto-concessão de Pro. A tabela `profiles` tem UPDATE
--    liberado pro próprio dono (necessário pra editar nome/foto/rotina), e o
--    estado do plano (`plano`, `plano_expira_em`, …) mora nessa MESMA tabela.
--    Com a chave anon (pública) qualquer aluno logado conseguia rodar, do
--    console do navegador, um `update profiles set plano='pro'` na própria
--    linha e virar Pro de graça. O MESMO valia pra `xp_total`/`liga` (inflar
--    o ranking). RLS no Postgres não faz permissão por-coluna, então a trava
--    é um TRIGGER: colunas sensíveis só mudam via service_role (Server
--    Actions/webhook no servidor) ou pela conta admin.
--
-- 2) Conteúdo global (`questions`, `materias`, `topicos`) tinha escrita
--    liberada a qualquer autenticado — um "amigo" podia sobrescrever o banco
--    de questões inteiro. Restrito ao admin (o importador é ferramenta de
--    admin; a recalibração de `tempo_medio_seg` passou a rodar via
--    service_role no servidor — ver lib/questao/actions.ts).
--
-- 3) `assinaturas`: o dono podia inserir/atualizar a própria linha com
--    status 'ativa'. Estreitado — dono só cria 'pendente' e só cancela.
--
-- OBS: precisa da env SUPABASE_SERVICE_ROLE_KEY no servidor (Vercel + .env.local).
-- Sem ela, o ganho de XP/streak/liga e a ativação do Pro falham.
-- ============================================================

-- ---------------------------------------------------------------------------
-- 1) Trigger que protege colunas sensíveis do profile
-- ---------------------------------------------------------------------------
create or replace function questly_proteger_colunas_profile()
returns trigger
language plpgsql
-- SECURITY INVOKER (padrão): precisamos que current_user seja o papel de quem
-- chamou (service_role vs authenticated), não o dono da função.
as $$
declare
  eh_service boolean := current_user = 'service_role'
    or coalesce(auth.jwt() ->> 'role', '') = 'service_role';
  eh_admin boolean := coalesce(auth.jwt() ->> 'email', '') = 'paulocresponunes@gmail.com';
begin
  -- service_role (servidor) e admin podem tudo.
  if eh_service or eh_admin then
    return new;
  end if;

  -- Aluno comum não pode tocar em plano nem na economia de gamificação.
  if new.plano                is distinct from old.plano
     or new.plano_ciclo       is distinct from old.plano_ciclo
     or new.plano_desde        is distinct from old.plano_desde
     or new.plano_expira_em    is distinct from old.plano_expira_em
     or new.plano_fidelidade_ate is distinct from old.plano_fidelidade_ate
     or new.xp_total          is distinct from old.xp_total
     or new.xp_semana         is distinct from old.xp_semana
     or new.questoes_total    is distinct from old.questoes_total
     or new.questoes_semana   is distinct from old.questoes_semana
     or new.nivel             is distinct from old.nivel
     or new.liga              is distinct from old.liga
     or new.semana_inicio     is distinct from old.semana_inicio
     or new.streak_atual      is distinct from old.streak_atual
  then
    raise exception 'Alteração não autorizada de colunas protegidas do profile (plano/XP/liga).';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_questly_proteger_profile on profiles;
create trigger trg_questly_proteger_profile
  before update on profiles
  for each row execute function questly_proteger_colunas_profile();

-- ---------------------------------------------------------------------------
-- 2) Conteúdo global só é escrito pelo admin
-- ---------------------------------------------------------------------------
-- questions
drop policy if exists "autenticados podem escrever questoes" on questions;
drop policy if exists "autenticados podem atualizar questoes" on questions;

drop policy if exists "admin insere questoes" on questions;
create policy "admin insere questoes" on questions for insert
  with check (auth.jwt() ->> 'email' = 'paulocresponunes@gmail.com');

drop policy if exists "admin atualiza questoes" on questions;
create policy "admin atualiza questoes" on questions for update
  using (auth.jwt() ->> 'email' = 'paulocresponunes@gmail.com')
  with check (auth.jwt() ->> 'email' = 'paulocresponunes@gmail.com');
-- (a policy de DELETE só-admin de supabase_admin_questoes.sql continua valendo;
--  a recalibração de tempo_medio_seg agora roda via service_role no servidor.)

-- materias / topicos — nada no app cria esses (só as migrations/seed e o admin);
-- fechar a escrita evita poluição do conteúdo compartilhado.
drop policy if exists "autenticados podem escrever materias" on materias;
create policy "admin escreve materias" on materias for insert
  with check (auth.jwt() ->> 'email' = 'paulocresponunes@gmail.com');
drop policy if exists "admin atualiza materias" on materias;
create policy "admin atualiza materias" on materias for update
  using (auth.jwt() ->> 'email' = 'paulocresponunes@gmail.com')
  with check (auth.jwt() ->> 'email' = 'paulocresponunes@gmail.com');

drop policy if exists "autenticados podem escrever topicos" on topicos;
create policy "admin escreve topicos" on topicos for insert
  with check (auth.jwt() ->> 'email' = 'paulocresponunes@gmail.com');
drop policy if exists "admin atualiza topicos" on topicos;
create policy "admin atualiza topicos" on topicos for update
  using (auth.jwt() ->> 'email' = 'paulocresponunes@gmail.com')
  with check (auth.jwt() ->> 'email' = 'paulocresponunes@gmail.com');

-- ---------------------------------------------------------------------------
-- 3) assinaturas — dono só cria 'pendente' e só cancela; ativação é admin/webhook
-- ---------------------------------------------------------------------------
drop policy if exists "dono insere assinatura" on assinaturas;
create policy "dono insere assinatura pendente" on assinaturas for insert
  with check (auth.uid() = user_id and status = 'pendente');

drop policy if exists "dono atualiza assinatura" on assinaturas;
create policy "dono cancela assinatura pendente" on assinaturas for update
  using (auth.uid() = user_id and status = 'pendente')
  with check (auth.uid() = user_id and status = 'cancelada');
-- (as policies admin de SELECT/UPDATE em assinaturas de supabase_plano_pro.sql
--  continuam valendo — o webhook/gateway roda via service_role.)
