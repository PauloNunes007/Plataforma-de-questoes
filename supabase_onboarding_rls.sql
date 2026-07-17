-- ============================================================
-- QUESTLY — Fixes de onboarding (rodar à mão no SQL Editor do
-- Supabase, a qualquer momento depois de supabase_conteudo_compartilhado.sql).
-- Idempotente/aditivo. Duas partes:
--
-- 1) RLS de `campaigns`: reprodução com um usuário de teste comum mostrou
--    que o INSERT feito pelo onboarding (salvarCampanhaAction) e pelas
--    Configurações falhava com 42501 (new row violates row-level security
--    policy) — a tabela tem RLS ligado mas nenhuma policy de escrita pro
--    dono. O erro era engolido pelo código (agora é logado). Nada no app
--    LÊ campaigns hoje (é o vínculo legado subject↔aluno), então o dano
--    era silencioso — mas a escrita tem que funcionar.
--
-- 2) Disciplinas duplicadas: onboarding/Configurações nunca checaram se o
--    aluno já tinha a disciplina, então re-rodar o onboarding (ou adicionar
--    de novo) duplicava `subjects` — e a disciplina aparecia em dobro em
--    todas as listas. O app agora checa antes de inserir; aqui a gente
--    LIMPA as duplicatas existentes (re-apontando missões/provas/tarefas
--    pra linha mantida, preservando histórico) e cria o índice único que
--    impede a raça de recriar o problema.
-- ============================================================

-- ---------------------------------------------------------------------------
-- 1) campaigns: escrita do dono
-- ---------------------------------------------------------------------------
alter table campaigns enable row level security;

drop policy if exists "dono gerencia campaigns" on campaigns;
create policy "dono gerencia campaigns" on campaigns
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 2) subjects duplicados: limpeza + índice único
-- ---------------------------------------------------------------------------
-- Mantém, por (user_id, nome case-insensitive), uma linha "keeper" e funde as
-- demais nela: missões, provas e tarefas são re-apontadas (histórico e datas
-- não se perdem); rotina/campaigns das duplicatas são só apagadas (o keeper
-- tem as suas ou o aluno re-salva a grade em Configurações).
create temp table _dup_subjects as
select id, keeper from (
  select id,
         first_value(id) over (partition by user_id, lower(trim(nome)) order by id) as keeper
  from subjects
) t
where id <> keeper;

update missions m set subject_id = d.keeper from _dup_subjects d where m.subject_id = d.id;
update bosses   b set subject_id = d.keeper from _dup_subjects d where b.subject_id = d.id;
do $$
begin
  if to_regclass('public.tarefas') is not null then
    update tarefas t set subject_id = d.keeper from _dup_subjects d where t.subject_id = d.id;
  end if;
end $$;
delete from rotina_semanal r using _dup_subjects d where r.subject_id = d.id;
delete from campaigns c using _dup_subjects d where c.subject_id = d.id;
delete from subjects s using _dup_subjects d where s.id = d.id;
drop table _dup_subjects;

-- Backstop contra a raça (dois submits simultâneos) — o app já checa antes
-- de inserir e trata a colisão como "disciplina já existe".
create unique index if not exists subjects_user_nome_key
  on subjects (user_id, lower(trim(nome)));
