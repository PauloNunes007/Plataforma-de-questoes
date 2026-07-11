-- ============================================================
-- QUESTLY — ranking semanal + ligas (estilo Duolingo) + foto de
-- perfil opcional. Rode isso no SQL Editor do Supabase.
-- ============================================================

alter table profiles add column if not exists foto_url text;
alter table profiles add column if not exists liga text not null default 'bronze';
alter table profiles add column if not exists xp_semana int not null default 0;
alter table profiles add column if not exists questoes_semana int not null default 0;
alter table profiles add column if not exists semana_inicio date;

-- histórico de cada semana já fechada por usuário. Necessário porque a
-- virada de semana é decidida no cliente de cada aluno (sem cron no
-- servidor): assim que o primeiro aluno de uma liga loga na semana nova,
-- profiles.semana_inicio dele já muda — sem esse histórico, quem loga
-- depois não veria mais o resultado dele pra calcular promoção/rebaixamento
-- (ver questlyGarantirSemanaLiga em js/liga.js).
create table if not exists historico_semanal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  semana_inicio date not null,
  liga text not null,
  xp_semana int not null default 0,
  questoes_semana int not null default 0,
  unique (user_id, semana_inicio)
);

alter table profiles enable row level security;
alter table subjects enable row level security;
alter table historico_semanal enable row level security;

-- ranking e o card público de aluno precisam ler nome/liga/xp/foto e as
-- disciplinas de QUALQUER aluno, não só do dono da linha — mesmo nível de
-- confiança que materias/topicos/questions já têm hoje (sem papel de admin
-- ainda, ver supabase_conteudo_compartilhado.sql). Só adiciona leitura;
-- não mexe nas policies de insert/update que já existiam.
drop policy if exists "autenticados podem ler profiles" on profiles;
create policy "autenticados podem ler profiles" on profiles for select using (auth.role() = 'authenticated');

drop policy if exists "autenticados podem ler subjects" on subjects;
create policy "autenticados podem ler subjects" on subjects for select using (auth.role() = 'authenticated');

drop policy if exists "autenticados podem ler historico" on historico_semanal;
create policy "autenticados podem ler historico" on historico_semanal for select using (auth.role() = 'authenticated');
drop policy if exists "usuario grava o proprio historico" on historico_semanal;
create policy "usuario grava o proprio historico" on historico_semanal for insert with check (user_id = auth.uid());
