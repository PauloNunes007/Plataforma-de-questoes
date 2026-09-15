-- ============================================================
-- QUESTLY — E-mail de campanha para a base (reengajamento pré-lançamento)
-- Rodar no SQL Editor DEPOIS de supabase_seguranca_hardening.sql
-- (reaproveita o mesmo e-mail de admin nas policies). Aditiva e idempotente.
--
-- POR QUE EXISTE
--
-- Até aqui todo e-mail que o app manda é TRANSACIONAL: sai porque o próprio
-- aluno acabou de fazer algo (cadastro, senha, troca de e-mail) e vai pra UMA
-- pessoa, via Send Email Hook (app/api/auth/email-hook/route.ts). Um disparo
-- em massa pra base inteira é outro bicho e traz três problemas que o caminho
-- transacional não tem:
--
-- 1) REENVIO. Um disparo pra centenas de contas não cabe numa requisição só
--    (a Brevo entrega ~300/dia no plano grátis e a função serverless tem
--    orçamento de segundos). Então ele roda em LOTES, e lote implica saber
--    quem já recebeu — senão um refresh da tela manda o mesmo e-mail de novo.
--    `email_campanha_envios` é esse registro, e o índice único
--    (campanha, user_id) é a garantia de verdade: mesmo com duas abas abertas,
--    a segunda tentativa viola a constraint em vez de enviar duplicado.
--
-- 2) DESCADASTRO. E-mail transacional não precisa de opt-out; e-mail de
--    campanha precisa — por decência e por sobrevivência: reclamação de spam
--    queima a reputação do remetente na Brevo, e o remetente é o MESMO que
--    entrega a confirmação de cadastro. Ou seja, mandar campanha sem link de
--    descadastro arrisca derrubar o cadastro de alunos novos.
--    `profiles.aceita_emails` é a preferência do aluno; o link do rodapé
--    (/descadastrar) escreve nela.
--
-- 3) AUDITORIA. Quando alguém disser "não recebi", a resposta precisa ser
--    verificável: a linha diz se foi enviado, quando, e com que erro falhou.
--
-- O QUE NÃO ENTRA AQUI: a lista de destinatários. Ela não é copiada pra tabela
-- nenhuma — sai de `auth.users` na hora do disparo (via service_role), então
-- não existe cópia de e-mail de aluno pra vazar nem pra ficar desatualizada.
-- ============================================================


-- ---------------------------------------------------------------------------
-- 1) Preferência de e-mail do aluno
-- ---------------------------------------------------------------------------
-- `true` por padrão pra base que já existe: quem se cadastrou aceitou receber
-- notícia do produto. Quem clicar em "não quero mais" vira `false` e SAI de
-- todo disparo de campanha — o e-mail transacional (confirmação de conta,
-- senha) ignora esta coluna de propósito: é resposta a um pedido do próprio
-- aluno, não comunicação de marketing.
alter table profiles add column if not exists aceita_emails boolean not null default true;

-- Não entra no trigger questly_proteger_colunas_profile
-- (supabase_seguranca_hardening.sql): é preferência de exibição/contato, não
-- plano/XP/liga/streak. Logo, a policy owner-only de UPDATE em `profiles` já
-- alcança — o aluno pode desligar isso da própria conta, como deve ser.


-- ---------------------------------------------------------------------------
-- 2) Registro de envios por campanha
-- ---------------------------------------------------------------------------
create table if not exists email_campanha_envios (
  id           uuid primary key default gen_random_uuid(),
  -- Slug da campanha ("reengajamento-2026-09"). Texto livre de propósito:
  -- campanha é conteúdo, não schema — a próxima não deve exigir migração.
  campanha     text not null,
  user_id      uuid not null references auth.users(id) on delete cascade,
  -- Snapshot do endereço no momento do envio. Se o aluno trocar de e-mail
  -- depois, o histórico continua dizendo pra onde a mensagem foi de fato.
  email        text not null,
  status       text not null default 'enviando',
  erro         text,
  criado_em    timestamptz not null default now(),
  atualizado_em timestamptz
);

-- 'enviando' = a vaga foi reservada e a chamada ao provedor está em curso.
-- Existe pra que uma função que morra no meio (timeout) deixe rastro e o aluno
-- NÃO receba de novo na próxima rodada: em e-mail, mandar de menos é erro
-- pequeno e mandar duas vezes é erro que custa reputação de remetente.
alter table email_campanha_envios drop constraint if exists email_campanha_envios_status_check;
alter table email_campanha_envios add constraint email_campanha_envios_status_check
  check (status in ('enviando', 'enviado', 'erro'));

-- A trava de duplicata. É ela — não o filtro em JS — que garante um e-mail por
-- aluno por campanha quando duas rodadas se cruzam.
create unique index if not exists ux_email_campanha_envios
  on email_campanha_envios (campanha, user_id);

-- A tela do admin conta por status a cada lote.
create index if not exists idx_email_campanha_envios_campanha
  on email_campanha_envios (campanha, status);

alter table email_campanha_envios enable row level security;

-- Leitura só do admin; escrita só via service_role (que bypassa RLS). Não há
-- policy de INSERT/UPDATE de propósito: nenhum aluno autenticado deve poder
-- inventar linha de envio, e o disparo roda sempre no servidor.
drop policy if exists "admin le os envios de campanha" on email_campanha_envios;
create policy "admin le os envios de campanha" on email_campanha_envios
  for select to authenticated
  using ((auth.jwt() ->> 'email') = 'paulocresponunes@gmail.com');
