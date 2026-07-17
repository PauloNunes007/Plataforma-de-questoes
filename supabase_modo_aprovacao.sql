-- ============================================================
-- QUESTLY — MODO APROVAÇÃO (vestibular Unicamp/Fuvest 2026)
-- Rode no SQL Editor do Supabase, DEPOIS de
-- supabase_seguranca_hardening.sql (reusa o mesmo e-mail admin).
-- Idempotente.
--
-- FEATURE DE CONTA ÚNICA: o Modo Aprovação é uso pessoal do dono
-- (paulocresponunes@gmail.com). TODA policy aqui exige esse
-- e-mail no JWT — outros alunos não leem nem escrevem nada
-- dessas tabelas, mesmo chamando a API direto com a chave anon.
-- O app também esconde o link/botão e redireciona as rotas
-- /aprovacao* pra quem não for essa conta (gate em camadas,
-- mesmo padrão do /admin/questoes).
--
-- Backing das rotas Next.js /aprovacao (dashboard "Hoje"),
-- /aprovacao/erros (caderno de erros + botão flutuante),
-- /aprovacao/simulados e /aprovacao/obras — ver web/CLAUDE.md.
--
-- Tabelas por conta (dono + e-mail): erros, sessoes_estudo,
-- metas_mensais, simulados, obras_progresso.
-- Tabelas de conteúdo (cronograma_semanal, escada_simulados,
-- obras): leitura e escrita só do e-mail admin.
-- ============================================================

-- ------------------------------------------------------------
-- 1) CADERNO DE ERROS
-- ------------------------------------------------------------
create table if not exists erros (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  imagem_url text,
  disciplina text not null,
  tema text,
  banca text, -- 'Unicamp', 'Fuvest', 'ITA', 'Outro'
  prova_ano int,
  prova_fase text, -- '1ª', '2ª', 'Simulado'
  questao_num text,
  o_que_marquei text,
  gabarito text,
  tipo_erro text not null check (tipo_erro in ('conteudo', 'interpretacao', 'atencao', 'tempo')),
  resolucao text,
  conceito_chave text,
  criado_em timestamptz default now(),
  refazer_em_1d date,
  refazer_em_7d date,
  refazer_em_30d date,
  feito_1d boolean default false,
  feito_7d boolean default false,
  feito_30d boolean default false,
  arquivado boolean default false
);

alter table erros enable row level security;
drop policy if exists "erros_owner" on erros;
create policy "erros_owner" on erros
  for all using (auth.uid() = user_id and (auth.jwt() ->> 'email') = 'paulocresponunes@gmail.com')
  with check (auth.uid() = user_id and (auth.jwt() ->> 'email') = 'paulocresponunes@gmail.com');

create index if not exists idx_erros_user_arquivado on erros(user_id, arquivado);
create index if not exists idx_erros_refazer_1d on erros(user_id, refazer_em_1d) where not feito_1d and not arquivado;
create index if not exists idx_erros_refazer_7d on erros(user_id, refazer_em_7d) where not feito_7d and not arquivado;
create index if not exists idx_erros_refazer_30d on erros(user_id, refazer_em_30d) where not feito_30d and not arquivado;

-- ------------------------------------------------------------
-- 2) SESSÕES DE ESTUDO (checkboxes da grade horária do dia)
-- unique(user, data, bloco) porque o app faz upsert do checkbox
-- ------------------------------------------------------------
create table if not exists sessoes_estudo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  data date default current_date,
  disciplina text not null,
  bloco text, -- '8h', '10h15', '14h', '16h', '19h', '20h', '9h' (domingo)
  minutos int,
  tipo text, -- 'aula', 'questoes', 'revisao', 'obra', 'redacao', 'simulado'
  concluido boolean default false,
  criado_em timestamptz default now(),
  unique (user_id, data, bloco)
);
alter table sessoes_estudo enable row level security;
drop policy if exists "sessoes_owner" on sessoes_estudo;
create policy "sessoes_owner" on sessoes_estudo
  for all using (auth.uid() = user_id and (auth.jwt() ->> 'email') = 'paulocresponunes@gmail.com')
  with check (auth.uid() = user_id and (auth.jwt() ->> 'email') = 'paulocresponunes@gmail.com');

-- ------------------------------------------------------------
-- 3) CRONOGRAMA SEMANAL (conteúdo global — tópico da semana por
-- disciplina, S1..S14 a partir de 14/jul/2026)
-- ------------------------------------------------------------
create table if not exists cronograma_semanal (
  id serial primary key,
  semana int not null,
  data_inicio date not null,
  disciplina text not null,
  topico text not null,
  unique (semana, disciplina)
);
alter table cronograma_semanal enable row level security;
drop policy if exists "cronograma_leitura" on cronograma_semanal;
create policy "cronograma_leitura" on cronograma_semanal
  for select using ((auth.jwt() ->> 'email') = 'paulocresponunes@gmail.com');
drop policy if exists "cronograma_escrita_admin" on cronograma_semanal;
create policy "cronograma_escrita_admin" on cronograma_semanal
  for all using ((auth.jwt() ->> 'email') = 'paulocresponunes@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'paulocresponunes@gmail.com');

-- ------------------------------------------------------------
-- 4) ESCADA DE SIMULADOS (conteúdo global — um domingo, uma prova)
-- ------------------------------------------------------------
create table if not exists escada_simulados (
  id serial primary key,
  data date not null unique,
  prova text not null,
  funcao text
);
alter table escada_simulados enable row level security;
drop policy if exists "escada_leitura" on escada_simulados;
create policy "escada_leitura" on escada_simulados
  for select using ((auth.jwt() ->> 'email') = 'paulocresponunes@gmail.com');
drop policy if exists "escada_escrita_admin" on escada_simulados;
create policy "escada_escrita_admin" on escada_simulados
  for all using ((auth.jwt() ->> 'email') = 'paulocresponunes@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'paulocresponunes@gmail.com');

-- ------------------------------------------------------------
-- 5) METAS MENSAIS
-- ------------------------------------------------------------
create table if not exists metas_mensais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  mes int not null,
  ano int not null,
  meta_acertos_simulado int,
  meta_redacoes int,
  meta_obras int,
  acertos_atual int default 0,
  redacoes_atual int default 0,
  obras_atual int default 0,
  unique (user_id, mes, ano)
);
alter table metas_mensais enable row level security;
drop policy if exists "metas_owner" on metas_mensais;
create policy "metas_owner" on metas_mensais
  for all using (auth.uid() = user_id and (auth.jwt() ->> 'email') = 'paulocresponunes@gmail.com')
  with check (auth.uid() = user_id and (auth.jwt() ->> 'email') = 'paulocresponunes@gmail.com');

-- ------------------------------------------------------------
-- 6) SIMULADOS
-- ------------------------------------------------------------
create table if not exists simulados (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  data date not null default current_date,
  banca text not null, -- 'Unicamp' ou 'Fuvest'
  prova_ref text,
  acertos jsonb not null, -- { "Matemática": 8, "Física": 6, ... }
  total_questoes int not null,
  tempo_min int,
  tempo_por_disciplina jsonb,
  erros_por_tipo jsonb, -- { "conteudo": 5, "interpretacao": 3, ... }
  observacoes text,
  criado_em timestamptz default now()
);
alter table simulados enable row level security;
drop policy if exists "simulados_owner" on simulados;
create policy "simulados_owner" on simulados
  for all using (auth.uid() = user_id and (auth.jwt() ->> 'email') = 'paulocresponunes@gmail.com')
  with check (auth.uid() = user_id and (auth.jwt() ->> 'email') = 'paulocresponunes@gmail.com');
create index if not exists idx_simulados_user_data on simulados(user_id, data);

-- ------------------------------------------------------------
-- 7) OBRAS LITERÁRIAS (catálogo global) + PROGRESSO por aluno
-- ------------------------------------------------------------
create table if not exists obras (
  id serial primary key,
  titulo text not null unique,
  autor text not null,
  banca text not null, -- 'Unicamp' ou 'Fuvest'
  ordem_leitura int,
  data_alvo_conclusao date
);
alter table obras enable row level security;
drop policy if exists "obras_leitura" on obras;
create policy "obras_leitura" on obras
  for select using ((auth.jwt() ->> 'email') = 'paulocresponunes@gmail.com');
drop policy if exists "obras_escrita_admin" on obras;
create policy "obras_escrita_admin" on obras
  for all using ((auth.jwt() ->> 'email') = 'paulocresponunes@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'paulocresponunes@gmail.com');

create table if not exists obras_progresso (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  obra_id int references obras(id) not null,
  pagina_atual int default 0,
  total_paginas int,
  percentual int default 0,
  fichamento_enredo text,
  fichamento_narrador text,
  fichamento_temas text,
  fichamento_contexto text,
  fichamento_trechos text,
  concluida boolean default false,
  concluida_em timestamptz,
  atualizado_em timestamptz default now(),
  unique (user_id, obra_id)
);
alter table obras_progresso enable row level security;
drop policy if exists "obras_progresso_owner" on obras_progresso;
create policy "obras_progresso_owner" on obras_progresso
  for all using (auth.uid() = user_id and (auth.jwt() ->> 'email') = 'paulocresponunes@gmail.com')
  with check (auth.uid() = user_id and (auth.jwt() ->> 'email') = 'paulocresponunes@gmail.com');

-- ------------------------------------------------------------
-- 8) STORAGE — bucket público pros prints do caderno de erros.
-- Leitura pública (URLs nos cards), mas upload/remoção só a
-- conta admin, e sempre dentro da própria pasta ({user_id}/...).
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('erros-imagens', 'erros-imagens', true, 4194304, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "leitura publica erros-imagens" on storage.objects;
create policy "leitura publica erros-imagens" on storage.objects
  for select using (bucket_id = 'erros-imagens');

drop policy if exists "usuario envia print de erro" on storage.objects;
create policy "usuario envia print de erro" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'erros-imagens'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (auth.jwt() ->> 'email') = 'paulocresponunes@gmail.com'
  );

drop policy if exists "usuario remove print de erro" on storage.objects;
create policy "usuario remove print de erro" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'erros-imagens'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (auth.jwt() ->> 'email') = 'paulocresponunes@gmail.com'
  );

-- ============================================================
-- SEEDS
-- ============================================================

-- Escada de simulados (domingos, 19/jul → 25/out)
insert into escada_simulados (data, prova, funcao) values
('2026-07-19', 'Unicamp 2019', 'Diagnóstico inicial'),
('2026-07-26', 'Fuvest 2019', 'Diagnóstico Fuvest'),
('2026-08-02', 'Unicamp 2021', 'Ritmo e cobertura'),
('2026-08-09', 'Fuvest 2021', 'Ritmo e cobertura'),
('2026-08-16', 'Unicamp 2022', 'Ritmo e cobertura'),
('2026-08-23', 'Fuvest 2022', 'Ritmo e cobertura'),
('2026-08-30', 'Unicamp 2023', 'Transição fase 2'),
('2026-09-06', 'Fuvest 2023', 'Transição fase 2'),
('2026-09-13', 'Unicamp 2024', 'Estilo recente'),
('2026-09-20', 'Fuvest 2024', 'Estilo recente'),
('2026-09-27', 'Unicamp 2025', 'Joia 1 — primeiro ensaio banca nova'),
('2026-10-04', 'Simulado Comvest jun/2026', 'Joia 2 — ensaio geral 1'),
('2026-10-11', 'Unicamp 2026', 'Joia 3 — ensaio geral 2 (Q e X)'),
('2026-10-25', 'Fuvest 2025', 'Ensaio geral Fuvest')
on conflict (data) do update set prova = excluded.prova, funcao = excluded.funcao;

-- Obras literárias (9 Unicamp + 5 Fuvest)
insert into obras (titulo, autor, banca, ordem_leitura, data_alvo_conclusao) values
('Memórias Póstumas de Brás Cubas', 'Machado de Assis', 'Unicamp', 1, '2026-07-26'),
('Os funerais da Mamãe Grande', 'Gabriel García Márquez', 'Unicamp', 2, '2026-08-02'),
('Canções escolhidas (15 canções)', 'Paulo César Pinheiro', 'Unicamp', 3, '2026-08-09'),
('Vida e morte de M. J. Gonzaga de Sá', 'Lima Barreto', 'Unicamp', 4, '2026-08-16'),
('A vida não é útil', 'Ailton Krenak', 'Unicamp', 5, '2026-08-23'),
('Obra de Conceição Evaristo (lista Comvest)', 'Conceição Evaristo', 'Unicamp', 6, '2026-08-30'),
('Contos de Caio Fernando Abreu', 'Caio Fernando Abreu', 'Unicamp', 7, '2026-09-06'),
('Obra de Chimamanda Ngozi Adichie', 'Chimamanda Ngozi Adichie', 'Unicamp', 8, '2026-09-13'),
('Poemas de José Paulo Paes', 'José Paulo Paes', 'Unicamp', 9, '2026-09-20'),
('A paixão segundo G. H.', 'Clarice Lispector', 'Fuvest', 10, '2026-10-04'),
('Canção para ninar menino grande', 'Conceição Evaristo', 'Fuvest', 11, '2026-10-11'),
('Geografia', 'Sophia de Mello Breyner Andresen', 'Fuvest', 12, '2026-10-21'),
('Balada de amor ao vento', 'Paulina Chiziane', 'Fuvest', 13, '2026-10-26'),
('A visão das plantas', 'Djaimilia Pereira de Almeida', 'Fuvest', 14, '2026-10-31')
on conflict (titulo) do update
  set autor = excluded.autor, banca = excluded.banca,
      ordem_leitura = excluded.ordem_leitura,
      data_alvo_conclusao = excluded.data_alvo_conclusao;

-- Cronograma semanal S1..S14 (6 disciplinas por semana)
insert into cronograma_semanal (semana, data_inicio, disciplina, topico) values
(1, '2026-07-14', 'Matemática', 'Funções afim e quadrática'),
(1, '2026-07-14', 'Física', 'Cinemática'),
(1, '2026-07-14', 'Química', 'Atomística, tabela, ligações'),
(1, '2026-07-14', 'Biologia', 'Citologia'),
(1, '2026-07-14', 'História', 'Brasil colônia I'),
(1, '2026-07-14', 'Geografia', 'Cartografia'),
(2, '2026-07-20', 'Matemática', 'Exponencial, log, módulo'),
(2, '2026-07-20', 'Física', 'Dinâmica'),
(2, '2026-07-20', 'Química', 'Estequiometria'),
(2, '2026-07-20', 'Biologia', 'Metabolismo'),
(2, '2026-07-20', 'História', 'Brasil colônia II'),
(2, '2026-07-20', 'Geografia', 'Urbanização'),
(3, '2026-07-27', 'Matemática', 'Geometria plana I'),
(3, '2026-07-27', 'Física', 'Trabalho e energia'),
(3, '2026-07-27', 'Química', 'Soluções e concentração'),
(3, '2026-07-27', 'Biologia', 'Genética I'),
(3, '2026-07-27', 'História', 'Escravidão e resistência'),
(3, '2026-07-27', 'Geografia', 'Globalização'),
(4, '2026-08-03', 'Matemática', 'Geometria plana II'),
(4, '2026-08-03', 'Física', 'Impulso e qtd. de movimento'),
(4, '2026-08-03', 'Química', 'Termoquímica'),
(4, '2026-08-03', 'Biologia', 'Genética II'),
(4, '2026-08-03', 'História', 'Brasil império'),
(4, '2026-08-03', 'Geografia', 'Geografia agrária'),
(5, '2026-08-10', 'Matemática', 'Trigonometria'),
(5, '2026-08-10', 'Física', 'Gravitação, MCU, estática'),
(5, '2026-08-10', 'Química', 'Cinética e equilíbrio'),
(5, '2026-08-10', 'Biologia', 'Evolução'),
(5, '2026-08-10', 'História', 'República Velha'),
(5, '2026-08-10', 'Geografia', 'Indústria e energia'),
(6, '2026-08-17', 'Matemática', 'Geometria espacial'),
(6, '2026-08-17', 'Física', 'Hidrostática, termologia'),
(6, '2026-08-17', 'Química', 'Eletroquímica'),
(6, '2026-08-17', 'Biologia', 'Ecologia I'),
(6, '2026-08-17', 'História', 'Era Vargas'),
(6, '2026-08-17', 'Geografia', 'Geopolítica atual'),
(7, '2026-08-24', 'Matemática', 'Combinatória e probabilidade'),
(7, '2026-08-24', 'Física', 'Termodinâmica'),
(7, '2026-08-24', 'Química', 'Orgânica I (funções, isomeria)'),
(7, '2026-08-24', 'Biologia', 'Ecologia II'),
(7, '2026-08-24', 'História', 'Ditadura civil-militar'),
(7, '2026-08-24', 'Geografia', 'População e migrações'),
(8, '2026-08-31', 'Matemática', 'Geometria analítica'),
(8, '2026-08-31', 'Física', 'Eletrostática'),
(8, '2026-08-31', 'Química', 'Orgânica II (reações)'),
(8, '2026-08-31', 'Biologia', 'Fisiologia humana'),
(8, '2026-08-31', 'História', 'Revoluções burguesas'),
(8, '2026-08-31', 'Geografia', 'Questão ambiental'),
(9, '2026-09-07', 'Matemática', 'PA, PG, matrizes'),
(9, '2026-09-07', 'Física', 'Eletrodinâmica'),
(9, '2026-09-07', 'Química', 'Gases, revisão físico-química'),
(9, '2026-09-07', 'Biologia', 'Biotecnologia'),
(9, '2026-09-07', 'História', 'Guerras mundiais'),
(9, '2026-09-07', 'Geografia', 'Hidrografia e relevo'),
(10, '2026-09-14', 'Matemática', 'Complexos e polinômios'),
(10, '2026-09-14', 'Física', 'Óptica geométrica'),
(10, '2026-09-14', 'Química', 'Revisão estequiometria e soluções'),
(10, '2026-09-14', 'Biologia', 'Microbiologia e saúde'),
(10, '2026-09-14', 'História', 'América Latina'),
(10, '2026-09-14', 'Geografia', 'Filo/Socio (resumão)'),
(11, '2026-09-21', 'Matemática', 'Revisão pelos erros'),
(11, '2026-09-21', 'Física', 'Ondas e som'),
(11, '2026-09-21', 'Química', 'Revisão orgânica e equilíbrio'),
(11, '2026-09-21', 'Biologia', 'Revisão flashcards'),
(11, '2026-09-21', 'História', 'Revisão flashcards'),
(11, '2026-09-21', 'Geografia', 'Revisão flashcards'),
(12, '2026-09-28', 'Matemática', 'Só questões (mix 2 bancas)'),
(12, '2026-09-28', 'Física', 'Só questões'),
(12, '2026-09-28', 'Química', 'Só questões'),
(12, '2026-09-28', 'Biologia', 'Flashcards e atualidades'),
(12, '2026-09-28', 'História', 'Flashcards'),
(12, '2026-09-28', 'Geografia', 'Flashcards'),
(13, '2026-10-05', 'Matemática', 'Reta final Unicamp'),
(13, '2026-10-05', 'Física', 'Reta final'),
(13, '2026-10-05', 'Química', 'Reta final'),
(13, '2026-10-05', 'Biologia', 'Reta final'),
(13, '2026-10-05', 'História', 'Reta final'),
(13, '2026-10-05', 'Geografia', 'Reta final'),
(14, '2026-10-12', 'Matemática', 'Revisão leve, resumos'),
(14, '2026-10-12', 'Física', 'Revisão leve'),
(14, '2026-10-12', 'Química', 'Revisão leve'),
(14, '2026-10-12', 'Biologia', 'Revisão leve'),
(14, '2026-10-12', 'História', 'Revisão leve'),
(14, '2026-10-12', 'Geografia', 'Revisão leve')
on conflict (semana, disciplina) do update
  set data_inicio = excluded.data_inicio, topico = excluded.topico;
