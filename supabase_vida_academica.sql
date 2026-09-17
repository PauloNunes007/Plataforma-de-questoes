-- ============================================================
-- QUESTLY / EXPECTRUM — Vida acadêmica (faltas, notas e relatório semanal)
--
-- Rodar DEPOIS de supabase_plano_pro.sql (o gate é do plano Pro) e de
-- supabase_conteudo_compartilhado.sql (precisa de `subjects`). Aditiva e
-- idempotente — dá pra rodar duas vezes sem estrago.
--
-- POR QUE ISTO EXISTE
--
-- O plano grátis entregava quase tudo que a plataforma sabe fazer, e o Pro
-- vendia só "mais do mesmo" (simulado sem limite, estatística a mais). Faltava
-- uma coisa que o aluno universitário QUER e que a plataforma ainda não fazia:
-- as duas contas que decidem o semestre dele e que hoje ele faz no caderno,
-- no WhatsApp da turma ou não faz —
--
--   1. "quantas faltas eu ainda posso levar nessa matéria?" (reprovação por
--      frequência é o jeito mais burro de perder um semestre inteiro);
--   2. "quanto eu preciso tirar na P3 pra passar?".
--
-- As duas são calculadas, não adivinhadas, e o dado de entrada é curto — o que
-- as torna boas features pagas: valor alto, atrito baixo.
--
-- MODELAGEM — o que é coluna e o que é linha
--
-- `subjects` ganha só os PARÂMETROS do semestre (quantas faltas cabem, qual a
-- média de aprovação, quantas horas tem a disciplina). O que ACONTECEU vira
-- linha: cada falta é uma linha em `faltas` (com data), cada prova/trabalho é
-- uma linha em `avaliacoes` (com peso e, quando sair, a nota).
--
-- A tentação era guardar `subjects.faltas_usadas` como contador. Não: seria um
-- segundo lugar pra mesma verdade (mesma regra da meta do calendário, ver
-- supabase_agenda_metas.sql) e o aluno perderia a única coisa que torna o
-- contador útil de verdade — saber QUANDO faltou, pra conferir com o diário do
-- professor quando a chamada não bate. A soma sai na leitura.
--
-- NADA AQUI PAGA XP, ACENDE OFENSIVA OU ENTRA NO RANKING. Registrar uma falta
-- não é estudo; se pagasse, seria a forma mais fácil de forjar ranking que já
-- existiu neste banco.
--
-- GATE DO PRO: é de APLICAÇÃO (server actions checam `ehPro` antes de
-- escrever), não de RLS. A RLS aqui é dono-only, como em `tarefas` — um aluno
-- nunca vê a vida acadêmica de outro, seja qual for o plano. Fazer a RLS
-- depender do plano significaria que, no dia em que o Pro vence, o banco
-- ESCONDERIA os dados que o aluno digitou (e a tela mostraria "nenhuma falta"
-- em vez de "renove pra ver"). Perder acesso a um recurso é uma coisa; o
-- produto mentir sobre o dado do aluno é outra.
-- ============================================================

-- ------------------------------------------------------------------
-- 1. Parâmetros do semestre, na própria disciplina do aluno
-- ------------------------------------------------------------------

-- Teto de faltas da disciplina, em AULAS (não em horas): é a unidade em que a
-- chamada acontece e a única que o aluno consegue conferir. Null = ele ainda
-- não configurou, e aí a tela pede o número em vez de inventar um.
alter table subjects add column if not exists faltas_max integer;

-- Carga horária total e duração da aula, usadas só pra SUGERIR `faltas_max`
-- pela regra dos 25% (LDB art. 47 §3º: 75% de frequência mínima). Ficam
-- guardadas porque a sugestão precisa ser refeita quando o aluno corrige um
-- dos dois — e porque em muita universidade o próprio aluno só sabe a carga
-- horária, não o número de aulas.
alter table subjects add column if not exists carga_horaria integer;
alter table subjects add column if not exists aulas_por_semana integer;

-- Média de aprovação da disciplina. 6.0 é o default mais comum no Brasil, mas
-- varia (UFF usa 6, algumas usam 5, 7 em pós) — por isso é por disciplina e
-- editável, não uma constante no código.
alter table subjects add column if not exists media_aprovacao numeric(4,2) not null default 6;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'subjects_faltas_max_check') then
    alter table subjects add constraint subjects_faltas_max_check
      check (faltas_max is null or (faltas_max >= 0 and faltas_max <= 400));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'subjects_carga_horaria_check') then
    alter table subjects add constraint subjects_carga_horaria_check
      check (carga_horaria is null or (carga_horaria > 0 and carga_horaria <= 2000));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'subjects_aulas_semana_check') then
    alter table subjects add constraint subjects_aulas_semana_check
      check (aulas_por_semana is null or (aulas_por_semana > 0 and aulas_por_semana <= 14));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'subjects_media_aprovacao_check') then
    alter table subjects add constraint subjects_media_aprovacao_check
      check (media_aprovacao >= 0 and media_aprovacao <= 100);
  end if;
end $$;

-- ------------------------------------------------------------------
-- 2. Faltas — uma linha por dia faltado
-- ------------------------------------------------------------------

create table if not exists faltas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  data date not null,
  -- Quantas AULAS daquele dia o aluno perdeu. Numa disciplina de 2 tempos
  -- seguidos, faltar de manhã custa 2 — e é assim que o diário do professor
  -- conta. Um contador de "dias" mentiria pro aluno na direção perigosa.
  quantidade smallint not null default 1 check (quantidade between 1 and 12),
  -- Falta abonada/justificada (atestado, luto, júri): continua registrada,
  -- mas não conta no total. O aluno precisa ver as duas coisas.
  justificada boolean not null default false,
  motivo text,
  criado_em timestamptz not null default now()
);

alter table faltas enable row level security;

drop policy if exists "aluno gerencia as proprias faltas" on faltas;
create policy "aluno gerencia as proprias faltas"
on faltas for all
using (user_id = auth.uid()) with check (user_id = auth.uid());

create index if not exists idx_faltas_user_subject on faltas (user_id, subject_id, data desc);

-- ------------------------------------------------------------------
-- 3. Avaliações — uma linha por prova/trabalho, com peso
-- ------------------------------------------------------------------
--
-- `nota` é NULLABLE de propósito: a avaliação nasce ANTES de existir nota. É
-- exatamente essa linha sem nota que deixa a calculadora responder "quanto
-- preciso tirar na P3" — sem ela, o app só saberia a média do que já passou,
-- que é a metade inútil da pergunta.
--
-- `peso` é livre (numeric) em vez de porcentagem fechada: o aluno digita "2"
-- pra P2 que vale o dobro, ou "40" pra 40% — quem normaliza é a leitura, e
-- qualquer regra fechada aqui brigaria com a criatividade dos planos de ensino.

create table if not exists avaliacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  nome text not null,
  peso numeric(6,2) not null default 1 check (peso > 0 and peso <= 1000),
  nota numeric(6,2) check (nota is null or (nota >= 0 and nota <= 100)),
  -- Escala da avaliação. 10 no Brasil, mas há disciplina em 100 e em 5.
  nota_maxima numeric(6,2) not null default 10 check (nota_maxima > 0 and nota_maxima <= 1000),
  data date,
  ordem smallint not null default 0,
  criado_em timestamptz not null default now()
);

alter table avaliacoes enable row level security;

drop policy if exists "aluno gerencia as proprias avaliacoes" on avaliacoes;
create policy "aluno gerencia as proprias avaliacoes"
on avaliacoes for all
using (user_id = auth.uid()) with check (user_id = auth.uid());

create index if not exists idx_avaliacoes_user_subject on avaliacoes (user_id, subject_id, ordem);

-- ------------------------------------------------------------------
-- 4. Relatório semanal por e-mail (Pro)
-- ------------------------------------------------------------------
--
-- Preferência de CONTATO, igual a `aceita_emails` (supabase_email_campanha.sql)
-- — por isso NÃO entra no trigger `questly_proteger_colunas_profile`: o UPDATE
-- dono-only que já existe em `profiles` alcança as duas.
alter table profiles add column if not exists relatorio_semanal boolean not null default true;

-- Uma linha por (aluno, segunda-feira da semana fechada). O ÍNDICE ÚNICO é o
-- que garante um e-mail por semana quando o cron dispara duas vezes (retry do
-- Vercel, execução manual do admin, duas instâncias) — não um filtro em JS.
-- Mesma decisão de `email_campanha_envios`, e pelo mesmo motivo: o pior erro
-- possível aqui é o aluno receber o mesmo relatório duas vezes e marcar spam,
-- o que queima o remetente que também entrega a confirmação de cadastro.
create table if not exists relatorio_envios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Segunda-feira da semana a que o relatório se refere (a semana FECHADA).
  semana date not null,
  status text not null default 'enviando' check (status in ('enviando', 'enviado', 'erro')),
  erro text,
  criado_em timestamptz not null default now()
);

create unique index if not exists ux_relatorio_envios_semana on relatorio_envios (user_id, semana);

alter table relatorio_envios enable row level security;

-- Sem policy de ESCRITA de propósito: quem grava é sempre o service_role (o
-- cron), na mesma trilha que manda o e-mail. O dono pode ler o próprio
-- histórico; o admin lê tudo.
drop policy if exists "aluno le os proprios envios de relatorio" on relatorio_envios;
create policy "aluno le os proprios envios de relatorio"
on relatorio_envios for select
using (
  user_id = auth.uid()
  or coalesce(auth.jwt() ->> 'email', '') = 'paulocresponunes@gmail.com'
);

-- ------------------------------------------------------------------
-- 5. Conferência
-- ------------------------------------------------------------------
-- Esperado: 3 linhas (faltas, avaliacoes, relatorio_envios).
select table_name from information_schema.tables
where table_schema = 'public' and table_name in ('faltas', 'avaliacoes', 'relatorio_envios')
order by table_name;

-- Esperado: 4 linhas (aulas_por_semana, carga_horaria, faltas_max, media_aprovacao).
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'subjects'
  and column_name in ('faltas_max', 'carga_horaria', 'aulas_por_semana', 'media_aprovacao')
order by column_name;
