-- ============================================================
-- QUESTLY — Acertos vitalícios públicos (acertabilidade no card do ranking)
-- Rodar DEPOIS de supabase_perfil_publico_stats.sql e de
-- supabase_seguranca_hardening.sql (esta migração RECRIA o trigger de
-- proteção de colunas daquela, incluindo a coluna nova). Aditiva e
-- idempotente.
--
-- Motivação: o card público do aluno no ranking passou a mostrar a
-- acertabilidade (acertos ÷ questões respondidas). questoes_total já
-- vivia em "profiles" exatamente por isso — question_attempts é
-- owner-only, então ninguém consegue somar as tentativas de OUTRO aluno
-- pra desenhar o card dele. acertos_total é o par que faltava: mesmo
-- padrão (contador vitalício em profiles, backfill uma vez, incremento
-- na Server Action que fecha a missão — lib/questly/economia.ts).
--
-- ATENÇÃO: por ser coluna de ranking, ela entra na lista protegida do
-- trigger — senão qualquer aluno logado escreveria a própria
-- acertabilidade com a chave anon, como era possível com xp_total antes
-- do hardening.
-- ============================================================

alter table profiles add column if not exists acertos_total int not null default 0;

-- Backfill único a partir do histórico real de tentativas.
update profiles p
set acertos_total = coalesce(
  (select count(*) from question_attempts qa where qa.user_id = p.id and qa.correta),
  0
);

-- Enquanto estamos aqui: questoes_total pode ter ficado defasado em contas
-- antigas (só é incrementado ao FECHAR missão). Realinha com o histórico.
update profiles p
set questoes_total = coalesce(
  (select count(*) from question_attempts qa where qa.user_id = p.id),
  0
);

-- ---------------------------------------------------------------------------
-- Trigger de proteção — mesma função de supabase_seguranca_hardening.sql,
-- agora cobrindo acertos_total. (create or replace: não precisa dropar.)
-- ---------------------------------------------------------------------------
create or replace function questly_proteger_colunas_profile()
returns trigger
language plpgsql
as $$
declare
  eh_service boolean := current_user = 'service_role'
    or coalesce(auth.jwt() ->> 'role', '') = 'service_role';
  eh_admin boolean := coalesce(auth.jwt() ->> 'email', '') = 'paulocresponunes@gmail.com';
begin
  if eh_service or eh_admin then
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
     or new.acertos_total     is distinct from old.acertos_total
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
