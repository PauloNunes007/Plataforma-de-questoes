-- ============================================================
-- QUESTLY — Grade semanal por disciplina
-- Rodar DEPOIS de supabase_conteudo_compartilhado.sql (precisa de
-- "subjects" já existente). Migração aditiva e idempotente.
--
-- O aluno escolhe QUAIS disciplinas estuda em CADA dia da semana
-- (em vez de uma única disciplina/dia decidida só pelo boss mais
-- próximo). js/rotina-engine.js recomenda uma distribuição com base
-- matemática (prova próxima, desempenho, meta de nota) mas o aluno
-- pode editar livremente — esta tabela guarda o resultado final,
-- editável, não o cálculo em si.
--
-- Uma linha = "essa disciplina entra na grade nesse dia da semana".
-- dia_semana usa o mesmo formato 3-letras minúsculo de
-- QUESTLY_DIAS_SEMANA (js/supabase-client.js): dom/seg/ter/qua/qui/sex/sab.
-- js/mission-engine.js lê isso pra decidir pra quais disciplinas
-- gerar a missão do dia (uma por disciplina agendada hoje).
-- ============================================================

create table if not exists rotina_semanal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  subject_id uuid references subjects(id) on delete cascade,
  dia_semana text not null check (dia_semana in ('dom','seg','ter','qua','qui','sex','sab')),
  unique (user_id, subject_id, dia_semana)
);

alter table rotina_semanal enable row level security;

drop policy if exists "usuario gerencia a propria grade semanal" on rotina_semanal;
create policy "usuario gerencia a propria grade semanal"
on rotina_semanal for all
using (user_id = auth.uid()) with check (user_id = auth.uid());

-- índice pro lookup que o mission-engine faz toda vez que o dashboard
-- carrega (grade completa do usuário, filtrada por dia na aplicação)
create index if not exists idx_rotina_semanal_user on rotina_semanal (user_id);
