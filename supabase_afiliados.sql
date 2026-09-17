-- Roda depois de supabase_plano_pro.sql, supabase_cupons_pro.sql e
-- supabase_seguranca_hardening.sql (reutiliza o mesmo e-mail de admin nas
-- policies). Aditivo e idempotente.
--
-- PROGRAMA DE PARCEIROS — a plataforma paga uma porcentagem das vendas que
-- vierem do link de um parceiro (um perfil do Instagram, um centro academico,
-- um monitor). E o mesmo desenho do convite (supabase_cupons_pro.sql), com
-- duas diferencas que mudam tudo:
--
--   1. o convite da Pro de graca e acaba ali; o link de parceiro da Pro de
--      graca E continua valendo dinheiro pro parceiro quando aquele aluno
--      paga, por uma janela de meses (`afiliados.janela_meses`);
--   2. o cupom e anonimo (qualquer um resgata o codigo); a indicacao e
--      NOMINAL — uma conta pertence a no maximo um parceiro, pra sempre
--      (indice unico em `afiliado_indicacoes.user_id`).
--
-- O que este arquivo NAO faz, de proposito:
--
--   • nao mexe em preco. O que o publico do parceiro ganha sao DIAS de Pro
--     (`afiliados.dias_bonus`), nao desconto. Dia de Pro custa ~zero de
--     margem e vale R$ 15 aos olhos de quem recebe; R$ 12 de desconto custam
--     R$ 12 de caixa. O checkout do Mercado Pago (lib/plano/mercadopago.ts)
--     continua sem saber que este programa existe;
--   • nao cria contador denormalizado de "quanto o parceiro ja ganhou". O
--     saldo e a soma das comissoes, lida na hora — mesma regra da meta do
--     calendario (supabase_agenda_metas.sql) e das faltas
--     (supabase_vida_academica.sql): um segundo lugar pra mesma verdade e a
--     forma mais facil de pagar errado;
--   • nao da ao parceiro NENHUMA policy de leitura sobre `afiliado_indicacoes`
--     nem sobre `profiles` de quem ele indicou. Ele ve quantas contas vieram
--     do link e quanto isso rendeu — nunca QUEM sao. O painel (/parceiro) le
--     agregado via service_role. Comissao nao compra o cadastro de ninguem.
--
-- Toda escrita de dinheiro (comissao, fechamento, pagamento) passa por
-- service_role, na mesma trilha que escreve `profiles.plano` e
-- `assinatura_pagamentos` — nenhuma tabela daqui tem policy de INSERT/UPDATE
-- pro parceiro, e isso e a trava, nao um filtro em JS.

-- 1) Parceiros ---------------------------------------------------------------
create table if not exists afiliados (
  id uuid primary key default gen_random_uuid(),
  codigo text not null,                  -- vai na URL: /p/<codigo>
  nome text not null,                    -- quem e ("Fisica UFF Resumos")
  instagram text,                        -- @ do perfil, sem o @
  email text,                            -- contato E o que liga a conta ao painel
  user_id uuid references auth.users(id) on delete set null,
  -- Quantos dias de Pro o PUBLICO dele ganha ao criar conta pelo link. E a
  -- oferta que faz o seguidor tocar no link — e o que o parceiro tem pra
  -- anunciar sem prometer desconto que a gente nao da.
  dias_bonus int not null default 15 check (dias_bonus >= 0 and dias_bonus <= 180),
  -- Percentual fechado com ESTE parceiro. null = vale a tabela por faixa de
  -- volume (web/src/lib/afiliados/afiliados.ts). Existe pra negociacao
  -- individual caber sem virar excecao no codigo.
  percentual_fixo int check (percentual_fixo between 0 and 100),
  -- Por quantos meses depois do cadastro as compras daquele aluno ainda pagam
  -- comissao. A janela e o que separa "trouxe o aluno" de "recebe pra sempre":
  -- o parceiro e pago pela aquisicao, a retencao e trabalho da plataforma.
  janela_meses int not null default 12 check (janela_meses > 0),
  chave_pix text,                        -- onde o repasse cai
  ativo boolean not null default true,
  observacao text,
  criado_em timestamptz not null default now(),
  criado_por text
);

alter table afiliados enable row level security;

create unique index if not exists afiliados_codigo_lower_key on afiliados (lower(codigo));
create unique index if not exists afiliados_user_key on afiliados (user_id) where user_id is not null;

drop policy if exists "admin gerencia afiliados" on afiliados;
create policy "admin gerencia afiliados" on afiliados
  for all
  using (auth.jwt() ->> 'email' = 'paulocresponunes@gmail.com')
  with check (auth.jwt() ->> 'email' = 'paulocresponunes@gmail.com');

-- O parceiro le a PROPRIA linha (o painel mostra codigo, faixa, chave Pix).
-- Nao ha policy de update: trocar a chave Pix passa por service_role depois de
-- conferir a sessao (lib/afiliados/actions.ts). Deixar o dono escrever aqui
-- abriria `percentual_fixo` e `dias_bonus` pro console do navegador.
drop policy if exists "parceiro le seu cadastro" on afiliados;
create policy "parceiro le seu cadastro" on afiliados
  for select using (auth.uid() = user_id);

-- 2) Cliques no link ---------------------------------------------------------
-- So pra taxa de conversao do painel ("450 cliques, 38 contas"). Uma linha por
-- abertura da pagina; nao identifica ninguem (sem IP, sem user agent) porque
-- pra responder "quantos" isso nao e necessario — e o que nao se guarda nao
-- vaza.
create table if not exists afiliado_cliques (
  id uuid primary key default gen_random_uuid(),
  afiliado_id uuid not null references afiliados(id) on delete cascade,
  criado_em timestamptz not null default now()
);

alter table afiliado_cliques enable row level security;

create index if not exists afiliado_cliques_afiliado_idx
  on afiliado_cliques (afiliado_id, criado_em desc);

drop policy if exists "admin le cliques" on afiliado_cliques;
create policy "admin le cliques" on afiliado_cliques
  for select using (auth.jwt() ->> 'email' = 'paulocresponunes@gmail.com');

-- 3) Indicacoes (a quem cada conta pertence) ---------------------------------
create table if not exists afiliado_indicacoes (
  id uuid primary key default gen_random_uuid(),
  afiliado_id uuid not null references afiliados(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  codigo text not null,                  -- snapshot: o codigo clicado naquele dia
  bonus_dias int not null default 0,     -- quantos dias de Pro a conta ganhou
  janela_ate timestamptz not null,       -- ate quando as compras dela pagam comissao
  criada_em timestamptz not null default now()
);

alter table afiliado_indicacoes enable row level security;

-- A trava de atribuicao unica do programa. Sem ela, dois parceiros (ou o mesmo
-- duas vezes) reivindicam o mesmo aluno e a mesma venda paga comissao dobrada.
create unique index if not exists afiliado_indicacoes_user_key
  on afiliado_indicacoes (user_id);
create index if not exists afiliado_indicacoes_afiliado_idx
  on afiliado_indicacoes (afiliado_id, criada_em desc);

drop policy if exists "admin le indicacoes" on afiliado_indicacoes;
create policy "admin le indicacoes" on afiliado_indicacoes
  for select using (auth.jwt() ->> 'email' = 'paulocresponunes@gmail.com');

-- O ALUNO le a propria linha (e dado dele: de onde veio, quantos dias ganhou).
-- O PARCEIRO nao le nenhuma — ver o cabecalho.
drop policy if exists "dono le sua indicacao" on afiliado_indicacoes;
create policy "dono le sua indicacao" on afiliado_indicacoes
  for select using (auth.uid() = user_id);

-- 4) Repasses (o lote que vira Pix) ------------------------------------------
-- Vem ANTES das comissoes porque `afiliado_comissoes.pagamento_id` aponta pra ca.
create table if not exists afiliado_pagamentos (
  id uuid primary key default gen_random_uuid(),
  afiliado_id uuid not null references afiliados(id) on delete cascade,
  competencia date not null,             -- mes fechado (dia 1)
  valor_centavos int not null check (valor_centavos >= 0),
  qtd_comissoes int not null default 0,
  status text not null default 'a_pagar' check (status in ('a_pagar', 'pago')),
  pago_em timestamptz,
  comprovante text,                      -- id da transacao Pix, anotacao
  criado_em timestamptz not null default now()
);

alter table afiliado_pagamentos enable row level security;

create unique index if not exists afiliado_pagamentos_competencia_key
  on afiliado_pagamentos (afiliado_id, competencia);

drop policy if exists "admin gerencia pagamentos afiliado" on afiliado_pagamentos;
create policy "admin gerencia pagamentos afiliado" on afiliado_pagamentos
  for all
  using (auth.jwt() ->> 'email' = 'paulocresponunes@gmail.com')
  with check (auth.jwt() ->> 'email' = 'paulocresponunes@gmail.com');

drop policy if exists "parceiro le seus repasses" on afiliado_pagamentos;
create policy "parceiro le seus repasses" on afiliado_pagamentos
  for select using (
    afiliado_id in (select id from afiliados where user_id = auth.uid())
  );

-- 5) Comissoes (uma por cobranca creditada) ----------------------------------
create table if not exists afiliado_comissoes (
  id uuid primary key default gen_random_uuid(),
  afiliado_id uuid not null references afiliados(id) on delete cascade,
  -- on delete set null: conta apagada nao pode apagar dinheiro ja devido.
  user_id uuid references auth.users(id) on delete set null,
  -- Chave de idempotencia: 'pagamento:<id de assinatura_pagamentos>' ou
  -- 'manual:<id da assinatura>'. O indice unico abaixo e o que impede o
  -- webhook do MP e o polling da tela de pagarem a mesma venda duas vezes —
  -- exatamente o papel que `assinatura_pagamentos.gateway_payment_id` faz do
  -- lado do aluno.
  referencia text not null,
  competencia date not null,             -- mes da venda (dia 1) — define a faixa
  valor_bruto_centavos int not null,     -- o que o aluno pagou
  valor_base_centavos int not null,      -- liquido (sem a taxa do gateway) = base da conta
  -- percentual/valor ficam NULOS ate o fechamento do mes: a faixa de comissao
  -- depende de quantas vendas o mes inteiro teve, e ela so e conhecida quando
  -- o mes acaba. Gravar um percentual na criacao obrigaria a reescrever a
  -- linha depois — e ai existiriam duas versoes do quanto foi prometido.
  percentual int check (percentual between 0 and 100),
  valor_centavos int check (valor_centavos >= 0),
  status text not null default 'pendente'
    check (status in ('pendente', 'aprovada', 'cancelada', 'paga')),
  -- Fim do prazo de arrependimento (CDC art. 49) daquela cobranca. Comissao
  -- so vira 'aprovada' depois disso: enquanto o aluno pode desfazer a compra e
  -- levar o dinheiro de volta, nao ha venda pra dividir.
  liberada_em timestamptz not null,
  motivo_cancelamento text,
  pagamento_id uuid references afiliado_pagamentos(id) on delete set null,
  criada_em timestamptz not null default now()
);

alter table afiliado_comissoes enable row level security;

create unique index if not exists afiliado_comissoes_referencia_key
  on afiliado_comissoes (referencia);
create index if not exists afiliado_comissoes_afiliado_idx
  on afiliado_comissoes (afiliado_id, competencia, status);

drop policy if exists "admin gerencia comissoes" on afiliado_comissoes;
create policy "admin gerencia comissoes" on afiliado_comissoes
  for all
  using (auth.jwt() ->> 'email' = 'paulocresponunes@gmail.com')
  with check (auth.jwt() ->> 'email' = 'paulocresponunes@gmail.com');

-- O parceiro le as proprias comissoes (data, valor, status) — nunca o aluno:
-- `user_id` esta aqui pra auditoria do admin e pra reverter a comissao certa
-- quando ha estorno, e o painel nao seleciona essa coluna.
drop policy if exists "parceiro le suas comissoes" on afiliado_comissoes;
create policy "parceiro le suas comissoes" on afiliado_comissoes
  for select using (
    afiliado_id in (select id from afiliados where user_id = auth.uid())
  );

-- 6) Cupom de avaliacao do parceiro ------------------------------------------
-- O link /convite/AFILIADO: um dia de Pro pra quem esta DECIDINDO se vira
-- parceiro conhecer a plataforma por dentro. E um cupom comum (tabela
-- `cupons`, de supabase_cupons_pro.sql) — o que muda e so a tela que o recebe
-- (web/src/components/afiliados/convite-afiliado-view.tsx), escrita pra um
-- dono de perfil e nao pra um aluno.
--
-- Um dia, e nao sete: quem abre esse link nao quer estudar, quer decidir se
-- poe o link na bio. E como ele vai circular entre perfis (nao entre alunos),
-- o dia curto mantem o custo do recrutamento em zero mesmo se vazar. Sem
-- limite de usos de proposito — recrutar parceiro nao tem por que ter vaga.
insert into cupons (codigo, descricao, dias_pro, limite_usos, ativo)
select 'AFILIADO', 'Avaliacao de parceiro — 1 dia de Pro (/convite/AFILIADO)', 1, null, true
where not exists (select 1 from cupons where lower(codigo) = 'afiliado');

-- 7) Conferencia -------------------------------------------------------------
-- Esperado: 5 linhas (afiliado_cliques, afiliado_comissoes,
-- afiliado_indicacoes, afiliado_pagamentos, afiliados).
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'afiliados', 'afiliado_cliques', 'afiliado_indicacoes',
    'afiliado_comissoes', 'afiliado_pagamentos'
  )
order by table_name;
