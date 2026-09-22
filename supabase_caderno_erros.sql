-- ============================================================
-- EXPECTRUM — Caderno de Erros
--
-- Rodar DEPOIS de supabase_anotacoes_favoritos_relatos.sql (reusa
-- `question_notes` pra anotação). Aditiva e idempotente.
-- **É deploy blocker**: as telas novas leem esta tabela.
--
-- O QUE ESTA TABELA GUARDA — E O QUE ELA DELIBERADAMENTE NÃO GUARDA
-- -----------------------------------------------------------------
-- Uma linha = "eu escolhi guardar esta questão". Só isso. Tudo o mais que
-- o Caderno mostra já existe em outro lugar e é LIDO de lá:
--
--   • o que o aluno marcou, quando errou, em quanto tempo e por que
--     (motivo_erro)          → question_attempts
--   • o que ele escreveu sobre a questão → question_notes (a MESMA
--     anotação de /questoes/anotacoes: o aluno escreve uma vez e ela
--     aparece nos dois lugares)
--   • enunciado, alternativas, gabarito, resolução → questions
--
-- Não existe contador de "quantas vezes revisei" nem cópia do enunciado
-- aqui. Um segundo lar pra mesma verdade é a forma mais fácil de os dois
-- divergirem — mesma regra da meta do calendário
-- (supabase_agenda_metas.sql) e das faltas (supabase_vida_academica.sql).
--
-- NÃO CONFUNDIR com a tabela `erros` de supabase_modo_aprovacao.sql:
-- aquela é do Modo Aprovação (conta única, RLS travada no e-mail do
-- admin, transcrição manual de prova com imagem/banca/fase). Esta aqui é
-- de TODO aluno e nasce de uma tentativa real dentro da plataforma.
--
-- NADA AQUI PAGA XP, ACENDE OFENSIVA OU ENTRA NO RANKING. Guardar,
-- anotar e marcar como resolvido são organização, não estudo — se
-- pagassem, seriam a rota de forja de ranking mais barata já inventada
-- neste banco. Quem paga XP é REFAZER, pela via normal de sempre
-- (registrarRespostaAction), inclusive a regra de meio XP em questão já
-- acertada.
-- ============================================================

create table if not exists caderno_erros (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,

  -- A tentativa que originou o salvamento, pra tela poder dizer "você
  -- marcou C, o gabarito era A" mesmo depois de o aluno refazer a questão
  -- várias vezes. Nullable de propósito: dá pra guardar uma questão que
  -- ele ACERTOU (pedido explícito) ou guardar de dentro do próprio
  -- Caderno, onde não há tentativa nova. `on delete set null` porque
  -- apagar a tentativa não pode apagar a decisão de estudar aquilo.
  attempt_id uuid references question_attempts(id) on delete set null,

  criado_em timestamptz not null default now(),

  -- "já resolvi essa pendência". NULL = ainda na fila.
  -- Data e não boolean: "resolvi há 2 meses" e "resolvi ontem" são coisas
  -- diferentes na hora de revisar, e um boolean joga isso fora.
  resolvido_em timestamptz,

  -- O backstop de verdade contra guardar a mesma questão duas vezes — não
  -- um `if` em JS. É ele que deixa "guardar todos os erros desta lista"
  -- ser idempotente: o aluno pode apertar o botão de novo sem susto, e
  -- dois cliques simultâneos não criam duas linhas.
  unique (user_id, question_id)
);

alter table caderno_erros enable row level security;

-- Dono-only, mesmo padrão de question_favoritos / tarefas / rotina_semanal.
drop policy if exists "usuario gerencia seu caderno de erros" on caderno_erros;
create policy "usuario gerencia seu caderno de erros"
on caderno_erros for all
using (user_id = auth.uid()) with check (user_id = auth.uid());

-- A consulta da tela: "meus itens em aberto, mais recentes primeiro".
create index if not exists ix_caderno_erros_user
  on caderno_erros (user_id, resolvido_em, criado_em desc);

-- ------------------------------------------------------------------
-- Conferência (esperado: a tabela com 1 policy `for all` e 2 índices —
-- a unique e a de leitura):
-- ------------------------------------------------------------------
-- select policyname, cmd from pg_policies
--  where tablename = 'caderno_erros';
-- select indexname from pg_indexes
--  where tablename = 'caderno_erros';
