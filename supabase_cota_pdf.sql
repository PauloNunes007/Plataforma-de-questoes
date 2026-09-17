-- ============================================================
-- TETO DE EXPORTAÇÃO DE PDF  (rodar depois de supabase_plano_pro.sql e
-- supabase_seguranca_hardening.sql)
--
-- É DEPLOY BLOCKER: as três rotas /imprimir/* passam a registrar a exportação
-- antes de mandar as questões pro browser. Sem a tabela, o registro falha e o
-- app deixa passar (fail-open deliberado — ver lib/imprimir/cota.ts), então
-- nada quebra; o que não existe é o teto.
--
-- POR QUE EXISTE
--
-- O "exportar em PDF" é o único recurso do Pro que tira conteúdo de dentro do
-- app: uma lista impressa continua valendo depois que a assinatura vence. Sem
-- teto, o caminho ótimo pra quem quer o banco de questões inteiro é assinar UM
-- mês (R$ 15), baixar tudo num fim de semana e não renovar — ou pedir o
-- reembolso de arrependimento (7 dias, CDC art. 49) depois de já ter o
-- material no disco. A marca d'água com o e-mail do aluno
-- (app/(protected)/imprimir/*) dissuade a REDISTRIBUIÇÃO; ela não faz nada
-- contra a extração.
--
-- O QUE É COBRADO, E POR QUE ASSIM
--
-- Uma linha = um DOCUMENTO exportado numa semana. `documento` é a chave
-- estável do que foi impresso ('missao:<uuid>', 'simulado:<uuid>',
-- 'topico:<uuid>') e `semana` é a segunda-feira local (mesma convenção da liga,
-- questlySegundaDaSemana). O índice único nos três é o teto de verdade:
--
--   • REIMPRESSÃO NÃO CUSTA. Recarregar a página, ajustar o espaçamento e
--     gerar de novo cai na mesma linha. Cobrar por render puniria justamente o
--     uso honesto (o aluno mexe nas opções 3, 4 vezes antes de imprimir);
--   • QUEM PAGA É A VARIEDADE, que é exatamente o formato da extração: baixar
--     o banco exige abrir documentos DIFERENTES, um por tópico.
--
-- `questoes` é telemetria (quantas questões saíram naquele arquivo), não um
-- limite: o app corta o que manda em PDF_QUESTOES_MAX (lib/plano/limites.ts),
-- e um teto anunciado que não é imposto no servidor é proibido por aqui.
--
-- SEM POLICY DE ESCRITA, DE PROPÓSITO
--
-- Mesma trilha de `assinatura_pagamentos` e `relatorio_envios`: quem grava é
-- sempre o service_role. Uma policy dono-only `for all` deixaria o aluno
-- APAGAR as próprias linhas do console do browser com a chave anon pública —
-- ou seja, zerar o próprio contador, que é o contrário de um teto. Ele lê as
-- dele (a tela precisa dizer quantas restam) e nada mais.
-- ============================================================

create table if not exists pdf_exportacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- 'missao:<uuid>' | 'simulado:<uuid>' | 'topico:<uuid>'
  documento text not null,
  -- segunda-feira local da semana da exportação (YYYY-MM-DD)
  semana date not null,
  -- quantas questões o servidor mandou naquele arquivo (telemetria)
  questoes int not null default 0,
  criada_em timestamptz not null default now()
);

-- O teto. Não é um filtro em JS: com duas abas abertas, é este índice que
-- garante que o segundo render do mesmo documento não vire uma segunda cota.
create unique index if not exists ux_pdf_exportacoes_doc
  on pdf_exportacoes (user_id, documento, semana);

-- A contagem do mês (e a da semana) sai daqui.
create index if not exists ix_pdf_exportacoes_user_data
  on pdf_exportacoes (user_id, criada_em desc);

alter table pdf_exportacoes enable row level security;

drop policy if exists "dono le exportacoes" on pdf_exportacoes;
create policy "dono le exportacoes" on pdf_exportacoes
  for select using (auth.uid() = user_id);

drop policy if exists "admin le exportacoes" on pdf_exportacoes;
create policy "admin le exportacoes" on pdf_exportacoes
  for select using (auth.jwt() ->> 'email' = 'paulocresponunes@gmail.com');

-- Conferência: deve devolver 0 linhas (nenhuma policy de insert/update/delete).
--   select polname, polcmd from pg_policy
--   where polrelid = 'pdf_exportacoes'::regclass and polcmd <> 'r';
