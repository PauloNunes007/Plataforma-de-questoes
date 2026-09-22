-- ============================================================
-- EXPECTRUM — Escudo de ofensiva
--
-- Rodar DEPOIS de supabase_seguranca_hardening.sql (ele recria o trigger
-- que protege as colunas de `profiles`, e este arquivo ESTENDE esse
-- trigger). Aditiva e idempotente.
-- **É deploy blocker**: lib/questly/economia.ts lê e escreve as colunas
-- novas em toda virada de dia.
--
-- O QUE É
-- -------
-- Um dia perdido deixa de zerar a ofensiva quando o aluno tem escudo.
-- Ele ganha 1 escudo a cada ESCUDO_A_CADA dias consecutivos e acumula no
-- máximo ESCUDO_MAX (as duas constantes vivem no app,
-- lib/questly/economia.ts — aqui o banco só guarda o estado).
--
-- POR QUE ISTO NÃO É "OFENSIVA DE MENTIRA"
-- ----------------------------------------
-- Duas travas, e nenhuma delas é negociável sem refazer a conta:
--
--   1. ESCUDO NÃO SE COMPRA. Não com XP, não com Pro, não com convite.
--      Ofensiva comprada não mede mais estudo nenhum, e a ofensiva é
--      justamente o número que este repasse acabou de fazer medir estudo
--      de verdade (ver o repasse de 2026-09-22 no web/CLAUDE.md);
--   2. O CONSUMO É VISÍVEL. A home mostra "12 dias · 1 escudo usado".
--      Esconder transformaria 12 numa afirmação falsa — e este banco já
--      gastou uma migração inteira (supabase_ranking_fiel.sql) consertando
--      números que mentiam na tela.
--
-- O escudo cobre o dia em que a vida aconteceu, não o mês em que o aluno
-- desistiu: com teto de 2, duas semanas sumidas continuam zerando tudo.
--
-- NADA AQUI PAGA XP NEM ENTRA NO RANKING. Escudo é sobre continuidade,
-- não sobre pontuação — mesma linha de `daily_logs`.
-- ============================================================

alter table profiles add column if not exists escudos int not null default 0;
alter table profiles add column if not exists escudo_usado_em date;

comment on column profiles.escudos is
  'Escudos de ofensiva disponíveis. Ganhos por dias consecutivos de estudo, '
  'nunca comprados. Escrita só por service_role (ver o trigger abaixo).';
comment on column profiles.escudo_usado_em is
  'Dia que o último escudo cobriu (o dia FALTADO, não o dia em que foi '
  'gasto). NULL = nenhum escudo usado ainda. É o que permite a home dizer '
  '"1 escudo usado" em vez de fingir que a ofensiva nunca foi interrompida.';

-- ---------------------------------------------------------------------------
-- O trigger de proteção passa a cobrir as duas colunas novas
-- ---------------------------------------------------------------------------
-- Sem isto, qualquer aluno logado poderia se dar escudos infinitos do
-- console do browser com a chave anon pública — exatamente o buraco que
-- supabase_seguranca_hardening.sql fechou pra plano/XP/liga/streak. Um
-- escudo é continuidade de ofensiva, e ofensiva está protegida; o escudo
-- tem que estar junto.
--
-- A função é recriada INTEIRA (create or replace) porque o Postgres não
-- tem "adicionar uma condição": se editar o corpo aqui, confira que ele
-- continua igual ao de supabase_seguranca_hardening.sql fora as duas
-- linhas novas.
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
  eh_sql_direto boolean := current_setting('request.jwt.claims', true) is null;
begin
  if eh_service or eh_admin or eh_sql_direto then
    return new;
  end if;

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
     -- novas em supabase_escudo_ofensiva.sql
     or new.escudos           is distinct from old.escudos
     or new.escudo_usado_em   is distinct from old.escudo_usado_em
  then
    raise exception 'Alteração não autorizada de colunas protegidas do profile (plano/XP/liga/escudo).';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_questly_proteger_profile on profiles;
create trigger trg_questly_proteger_profile
  before update on profiles
  for each row execute function questly_proteger_colunas_profile();

-- ------------------------------------------------------------------
-- Conferência (esperado: as duas colunas, e o trigger no lugar):
-- ------------------------------------------------------------------
-- select column_name, data_type, column_default
--   from information_schema.columns
--  where table_name = 'profiles'
--    and column_name in ('escudos', 'escudo_usado_em');
--
-- select tgname from pg_trigger where tgname = 'trg_questly_proteger_profile';
