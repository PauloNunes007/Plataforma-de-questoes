-- ============================================================
-- EXPECTRUM — Web Push (lembrete de ofensiva)
--
-- Rodar DEPOIS de supabase_conteudo_compartilhado.sql. Aditiva e
-- idempotente. **É deploy blocker** pro recurso: sem a tabela, o botão de
-- ativar lembrete grava em lugar nenhum (o app degrada e segue, mas o
-- recurso não existe).
--
-- Depende de duas variáveis de ambiente no servidor (ver web/PUBLICAR.md):
-- VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY. Sem elas o envio é pulado e
-- NENHUMA tela quebra — é o mesmo tratamento que o app dá pro relatório
-- semanal quando a chave de e-mail não está configurada.
--
-- POR QUE UMA TABELA E NÃO UMA COLUNA EM `profiles`
-- -------------------------------------------------
-- Uma inscrição de push é por DISPOSITIVO, não por pessoa: o mesmo aluno
-- tem o celular e o notebook, e cada um tem seu endpoint e suas chaves. Uma
-- coluna guardaria um só, e o aluno que ativasse no notebook perderia o
-- lembrete no celular — justamente o aparelho que importa.
--
-- O QUE ISTO **NÃO** É
-- --------------------
-- Não é canal de marketing. O único envio previsto é o lembrete de
-- ofensiva, no máximo UM por dia, e SILENCIADO pra quem já estudou hoje
-- (o `daily_logs` responde isso antes de qualquer envio). Um push que
-- chega pra quem já fez a lição é a forma mais rápida de perder a
-- permissão — e permissão negada no navegador não se pede de novo.
--
-- A inscrição é o próprio opt-in, e apagar a linha é o opt-out. Não existe
-- flag separada: duas fontes pra mesma decisão divergem na primeira vez
-- que o aluno revoga a permissão pelo navegador em vez de pelo app.
-- ============================================================

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- A URL que o navegador dá e pra onde o push é entregue. É ela que
  -- identifica o DISPOSITIVO — daí a unicidade ser por endpoint, e não por
  -- (user, device): o mesmo aparelho reinscrito devolve o mesmo endpoint, e
  -- o upsert atualiza em vez de duplicar.
  endpoint text not null,
  p256dh text not null,
  auth text not null,

  criado_em timestamptz not null default now(),
  -- Último envio bem-sucedido. Serve pra depuração e pra distinguir
  -- "inscrição nova" de "inscrição morta que nunca foi limpa".
  ultimo_envio_em timestamptz,

  unique (endpoint)
);

create index if not exists ix_push_subscriptions_user
  on push_subscriptions (user_id);

alter table push_subscriptions enable row level security;

-- Dono-only, mesmo padrão de question_favoritos / tarefas / caderno_erros.
-- O cron que ENVIA não passa por aqui: ele roda com service_role, que
-- ignora RLS — mesma trilha de quem escreve profiles.plano.
drop policy if exists "usuario gerencia suas inscricoes de push" on push_subscriptions;
create policy "usuario gerencia suas inscricoes de push"
on push_subscriptions for all
using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------------------
-- Conferência (esperado: 1 policy `for all` e 2 índices — a unique do
-- endpoint e a de user_id):
-- ------------------------------------------------------------------
-- select policyname, cmd from pg_policies
--  where tablename = 'push_subscriptions';
-- select indexname from pg_indexes
--  where tablename = 'push_subscriptions';
