-- ============================================================
-- QUESTLY — banco de conteúdo compartilhado (materias/topicos) +
-- progresso por aluno separado do conteúdo.
-- Rode isso no SQL Editor do Supabase, uma vez.
-- ============================================================

-- TABELAS NOVAS -------------------------------------------------
create table if not exists materias (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique
);

create table if not exists topicos (
  id uuid primary key default gen_random_uuid(),
  materia_id uuid references materias(id) on delete cascade,
  nome text not null,
  subtopico text,
  cai_na_prova boolean default true
);

create table if not exists aluno_topico_progresso (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  topico_id uuid references topicos(id) on delete cascade,
  taxa_acerto numeric default 0,
  num_questoes_respondidas int default 0,
  ultima_revisao timestamptz,
  unique (user_id, topico_id)
);

-- SUBJECTS: liga cada disciplina do aluno à matéria compartilhada
alter table subjects add column if not exists materia_id uuid references materias(id);

-- MIGRA DISCIPLINAS JÁ EXISTENTES -------------------------------
-- cria uma materia pra cada nome de disciplina já cadastrado, e liga
insert into materias (nome)
select distinct nome from subjects
where nome not in (select nome from materias)
on conflict (nome) do nothing;

update subjects s set materia_id = m.id
from materias m
where s.nome = m.nome and s.materia_id is null;

-- REMOVE A TABELA ANTIGA DE TÓPICOS (só tinha dado de teste/seed) ---
drop table if exists topics cascade;

-- as questões de teste existentes apontavam pra topic_id da tabela antiga,
-- que acabou de sumir — limpa antes de trocar a FK (são só as 4 do seed,
-- question_attempts ligados a elas somem em cascata sozinhos)
delete from questions;

-- QUESTIONS: agora referencia o tópico compartilhado
alter table questions drop constraint if exists questions_topic_id_fkey;
alter table questions add constraint questions_topic_id_fkey
  foreign key (topic_id) references topicos(id) on delete cascade;

-- RLS -------------------------------------------------------------
alter table materias enable row level security;
alter table topicos enable row level security;
alter table aluno_topico_progresso enable row level security;

-- conteúdo compartilhado: leitura livre pra autenticados; escrita também
-- liberada por enquanto (sem papel de admin ainda — mesmo nível de
-- confiança que "questions" já tem hoje; endurecer quando houver
-- usuários de verdade além do dono da plataforma)
drop policy if exists "autenticados podem ler materias" on materias;
create policy "autenticados podem ler materias" on materias for select using (auth.role() = 'authenticated');
drop policy if exists "autenticados podem escrever materias" on materias;
create policy "autenticados podem escrever materias" on materias for insert with check (auth.role() = 'authenticated');

drop policy if exists "autenticados podem ler topicos" on topicos;
create policy "autenticados podem ler topicos" on topicos for select using (auth.role() = 'authenticated');
drop policy if exists "autenticados podem escrever topicos" on topicos;
create policy "autenticados podem escrever topicos" on topicos for insert with check (auth.role() = 'authenticated');

drop policy if exists "usuario gerencia o proprio progresso" on aluno_topico_progresso;
create policy "usuario gerencia o proprio progresso"
on aluno_topico_progresso for all
using (user_id = auth.uid()) with check (user_id = auth.uid());

-- QUESTIONS já tinha policy de leitura (ver supabase_seed_questoes.sql);
-- faltava escrita, necessária pro importador em massa.
drop policy if exists "autenticados podem escrever questoes" on questions;
create policy "autenticados podem escrever questoes" on questions for insert with check (auth.role() = 'authenticated');
