# Especificação — Ranking sem vergonha de errar + Caderno de Erros

**Para quem implementa.** Escrito contra o código real deste repositório em 2026-09-22
(app Next.js em `web/`). Todo caminho de arquivo aqui existe; toda linha citada foi
conferida. Onde a spec pede decisão de produto, ela diz qual é a recomendação e por quê.

Duas entregas independentes — a Parte 1 pode ir ao ar sem a Parte 2 e vice-versa.

---

## Parte 0 — O que já é verdade (não reimplemente)

Antes de qualquer código: metade do pedido 1(a) **já está feito**. Gastar sprint
"mudando o ranking de acerto para XP" é retrabalho.

| Afirmação | Situação real |
|---|---|
| O ranking ordena por taxa de acerto | **Falso.** `carregarRankingGlobal` ordena por `xp_total`/`xp_semana`, desempate por `questoes_total`/`questoes_semana` (`web/src/lib/ranking/ranking-data.ts:192-214`). A Divisão ordena por `xp_semana` (`:323-325`). Nenhuma das três listas exibe acerto. |
| Errar não paga nada | **Falso.** Erro paga `QUESTLY_XP_ERRO_FRACAO = 0.2` do valor da questão, na primeira vez que o aluno encara aquela questão (`web/src/lib/questly/shared.ts:79-81`, `:128-135`). A tela já diz isso no erro ("Você levou N XP por ter encarado a questão", `questao-runner.tsx:916-925`). |
| Os distintivos expõem acerto | **Falso.** Os 12 distintivos são de streak, volume, nível, número de disciplinas e liga (`web/src/lib/ranking/badges.ts:40-52`). Nenhum é de acertabilidade. |

**O que de fato expõe o aluno — os três buracos a fechar:**

1. **A carta pública.** `buscarCardUsuarioAction(userId)` aceita o id de *qualquer*
   aluno e devolve `pctAcerto` + `acertosTotal`
   (`web/src/lib/ranking/actions.ts:116-122`), renderizados como um KPI grande em
   `web/src/components/ranking/student-card-modal.tsx:245-263`. A carta abre com um
   clique em qualquer linha do ranking. **Este é o lugar da vergonha.**
2. **`xpMedioPorQuestao`** (`ranking/actions.ts:132-133`, exibido no card Pro). Acerto
   paga 3/5/8 XP, erro paga 0.2× disso: "XP médio por questão" é a taxa de acerto
   com outro nome, com uma casa decimal. Fechar o KPI de acerto e deixar este é
   trocar a fechadura e esquecer a janela.
3. **A coluna no banco.** `profiles` é world-readable sob RLS (é o que faz o ranking
   cross-user funcionar), então `acertos_total` volta para qualquer um que chame a
   API com a chave anon — inclusive depois de sumir da UI.

---

## Parte 1 — Ranking: o erro deixa de ter plateia

### 1.1 Fechar a carta pública (`web/src/lib/ranking/actions.ts`)

`CardUsuario` passa a ter um recorte **público** e um recorte **privado**. A
Server Action decide qual devolver comparando `userId` com o `auth.getUser()` dela
própria — nunca com uma flag vinda do cliente.

```ts
export type CardUsuario = {
  // …campos públicos atuais: nome, username, curso, liga, xpTotal, nivel,
  //   streakAtual, questoesTotal, disciplinas, distintivos, pro, melhorLigaNome
  acertosTotal: number;      // REMOVER do tipo
  pctAcerto: number | null;  // REMOVER do tipo
  xpMedioPorQuestao: number | null; // REMOVER do tipo (ver Parte 0, item 2)

  /** só vem preenchido quando a carta é a do PRÓPRIO aluno */
  privado: { pctAcerto: number | null; acertosTotal: number } | null;
};
```

Na action:

```ts
const { data: { user } } = await supabase.auth.getUser();
const ehDono = user?.id === userId;
// a leitura de acertos_total só acontece quando ehDono — não adianta ler e não
// mandar: o payload RSC de uma carta alheia não pode nem carregar o número.
```

O bloco `perfilAcertos` (`actions.ts:69-72`) vira condicional a `ehDono`. O KPI
`MIN_QUESTOES_ACERTABILIDADE = 10` continua valendo dentro de `privado`.

### 1.2 O KPI que sai e o que entra no lugar

Em `student-card-modal.tsx:245-263`, o slot de "acertabilidade" some. Deixar um
buraco na grade de KPIs é pior que preencher — a carta é 2×2. O substituto tem que
ser **público, honesto e de esforço**:

- **Escolhido: "Constância" — dias com estudo registrado nos últimos 30 dias.**
  Sai de `daily_logs` (já existe, já alimenta o heatmap), é volume puro, não
  correlaciona com acerto e é a métrica que a psicologia do produto quer premiar.
  Uma leitura a mais na action: `daily_logs` filtrado por `user_id` e
  `data >= hoje-30`, `count: "exact", head: true`. **Atenção de RLS:** confira se
  `daily_logs` tem policy de leitura pública como `profiles`; se for dono-only
  (provável), a contagem cross-user falha em silêncio devolvendo 0 — nesse caso
  use a alternativa abaixo em vez de afrouxar a RLS de `daily_logs`.
- **Alternativa sem migração nem RLS nova:** "Melhor liga" já está em
  `melhorLigaNome` e hoje só aparece no card Pro. Promovê-la a KPI de todos custa
  zero consulta.

Quando a carta é a do próprio aluno, um **quinto bloco** aparece abaixo da grade,
visualmente distinto (fundo `bg-muted/60`, sem cor de marca, ícone `Lock` 13px):

> 🔒 **Só você vê** · 68% de acertabilidade · 412 acertos em 605 questões
> *Ninguém mais tem acesso a esse número.*

Esse bloco é o coração psicológico da mudança: não basta a acertabilidade ser
privada, o aluno precisa **saber** que é, e o momento em que ele olha a própria
carta é onde ele acredita.

### 1.3 Fechar a coluna no banco — `supabase_ranking_privado.sql`

RLS filtra linha, não coluna. Quem filtra coluna é `GRANT`. Migração nova, roda
depois de `supabase_acertos_publicos.sql`:

```sql
-- ============================================================
-- EXPECTRUM — acertabilidade deixa de ser dado público
-- Rodar DEPOIS de supabase_acertos_publicos.sql.
-- Aditiva e idempotente. NÃO dropa a coluna: o dado continua
-- existindo e sendo escrito por service_role (economia.ts) —
-- o que muda é quem consegue LER.
--
-- PRÉ-REQUISITO DE CÓDIGO (senão a home quebra pra todo mundo):
-- lib/questly/dashboard-data.ts:175 e :425 fazem
-- `from("profiles").select("*")`. Com o revoke abaixo, `select *`
-- passa a estourar "permission denied for column acertos_total"
-- ATÉ pro dono da própria linha — grant é por papel, não por linha.
-- Troque os dois por lista explícita de colunas ANTES de rodar isto.
-- ============================================================

revoke select (acertos_total) on public.profiles from authenticated;
revoke select (acertos_total) on public.profiles from anon;
-- service_role mantém tudo (é quem escreve o contador em economia.ts e quem
-- recomputa em questly_registrar_progresso).
```

Consequências que **já foram conferidas** no código:

- `lib/questly/economia.ts:79-117` — o caminho legado (`atualizarXpELigaLegado`, só
  usado se a RPC `questly_registrar_progresso` não existir) lê e escreve
  `acertos_total` pelo cliente do aluno. Com o revoke, o `select` volta vazio e o
  `update` falha — **e o próprio código já tem o retry sem a coluna**
  (`:105-117`), então degrada em silêncio em vez de perder XP. Limpe o caminho
  legado nessa passagem: ele não tem mais como escrever essa coluna.
- `lib/questao/actions.ts` — usa `createAdminClient()` (service_role) para os
  contadores. **Não é afetado.**
- `lib/dashboard/desempenho-data.ts` — lê `question_attempts` direto (dono-only).
  **Não é afetado**, e é por isso que o aluno continua vendo a própria evolução.

### 1.4 A economia: fazer o esforço realmente vencer

Hoje um acerto vale ~5× um erro (0.2), e o combo multiplica só acertos seguidos.
Com isso, na prática, **acertar continua mandando no ranking**: o aluno de 90% com
100 questões (≈475 XP) só é alcançado por um de 50% depois de ~158 questões (58% a
mais de trabalho). Isso contradiz a promessa "quem estuda mais fica no topo".

**Recomendação: `QUESTLY_XP_ERRO_FRACAO` de `0.2` → `0.45`**
(`web/src/lib/questly/shared.ts:79`).

| fração do erro | questões que o aluno de 50% precisa pra empatar com o de 90% em 100 questões |
|---|---|
| 0.20 (hoje) | 158 (+58%) |
| 0.45 (proposto) | 132 (+32%) |
| 0.70 | 118 (+18%) |
| 1.00 | 105 (+5%) — acertar vira irrelevante, e aí o ranking premia clicar |

0.45 é o ponto em que **dedicação vence habilidade com uma margem de esforço
honesta**, sem transformar o ranking num contador de cliques.

**Esta mudança exige uma guarda anti-farm, no mesmo commit.** Com 0.45, responder
qualquer coisa em 3 segundos passa a pagar ~2,25 XP; em 10 minutos de cliques cegos
isso rende mais que uma hora de estudo real. Duas travas:

1. **Tempo mínimo de esforço.** Em `registrarRespostaAction`
   (`web/src/lib/questao/actions.ts:117-129`), consolação só é paga se a tentativa
   durou pelo menos `QUESTLY_SEG_MIN_ESFORCO = 12s`. Erro mais rápido que isso é
   registrado normalmente (a tentativa é verdade, e o BKT precisa dela) mas paga
   **0 XP**.
2. **O tempo não pode vir do cliente.** `input.tempoSeg` é do browser e é
   forjável. O servidor calcula `deltaServidor` = `now()` menos o `created_at` da
   tentativa anterior do mesmo `mission_id` e usa `min(input.tempoSeg, deltaServidor)`.
   Uma consulta a mais por resposta, no mesmo índice que já existe.

Como `questlyXpDaResposta` é a fonte única usada pelas duas pontas
(`shared.ts:123-135`), o cliente precisa receber o mesmo veredito: passe
`segundosGastos` na entrada e aplique a regra lá dentro, para o número que anima na
tela ser o que entra no ranking.

**O que NÃO muda, de propósito:** o combo (`questlyMultiplicadorCombo`) fica. Ele é
diversão de sessão, aparece só para o próprio aluno e some da tela em dois minutos —
não é uma etiqueta pública permanente. A maestria (BKT), a autópsia do erro e o
`motivo_erro` também ficam intocados: são privados por construção.

### 1.5 O selo: "aqui dentro errar não custa nada"

Não invente um "Modo Treino Livre" como modo separado. Dois motivos: a plataforma
acabou de **remover** um modo (ver "Fim do motor de missões" em `web/CLAUDE.md`), e
um modo opcional ensina o contrário do que queremos — se existe uma sala segura,
as outras são inseguras. **Toda a plataforma é a sala segura; o trabalho é dizer isso.**

Componente novo: `web/src/components/questao/selo-privado.tsx`

```tsx
export function SeloPrivado({ variante }: { variante: "chip" | "linha" }) { … }
```

- `chip`: pílula de 22px, `bg-muted/70`, texto `text-[11px] text-muted-foreground`,
  ícone `Lock` 11px. Sem cor de marca — é um rodapé de confiança, não uma promoção.
- `linha`: uma frase discreta, mesma família tipográfica dos "hints" do ranking.

Três pontos de exibição (e nenhum a mais — repetir demais vira ansiedade, que é o
que estamos tratando):

| Onde | Arquivo | Texto |
|---|---|---|
| Cabeçalho do runner, ao lado do nome da disciplina | `questao-runner.tsx` (barra do topo) | 🔒 Sessão privada |
| Tela de resultado da lista, sob os StatBoxes | `questao-runner.tsx:1240-1262` | 🔒 Acertos e erros desta lista são só seus. No ranking entra o **XP** — que você ganha encarando questão, não acertando todas. |
| Montagem da lista, no Banco de Questões | `app/(protected)/questoes/banco/page.tsx` | 🔒 Erre à vontade: ninguém vê sua taxa de acerto. |

E um ajuste de copy no banner de erro que já existe (`questao-runner.tsx:916-925`),
para ele carregar a nova economia: *"Você levou N XP por ter encarado a questão —
errar tentando também constrói repertório, e é XP igual ao de qualquer um no
ranking."*

### 1.6 Checklist da Parte 1

- [ ] `dashboard-data.ts:175` e `:425`: `select("*")` → colunas explícitas *(bloqueia a migração)*
- [ ] `ranking/actions.ts`: `pctAcerto`/`acertosTotal`/`xpMedioPorQuestao` saem do público, nascem em `privado` só para o dono
- [ ] `student-card-modal.tsx`: KPI trocado + bloco "Só você vê" na carta própria
- [ ] `supabase_ranking_privado.sql` criada, documentada no `CLAUDE.md` raiz e rodada
- [ ] `QUESTLY_XP_ERRO_FRACAO = 0.45` + `QUESTLY_SEG_MIN_ESFORCO = 12` + tempo medido no servidor
- [ ] `economia.ts`: caminho legado limpo
- [ ] `SeloPrivado` nos três pontos
- [ ] Teste manual: abrir a carta de OUTRO aluno pelo ranking e confirmar que o payload RSC não contém o número (aba Network, não só a tela)

---

## Parte 2 — Caderno de Erros

### 2.1 Princípio de modelagem (o que NÃO criar)

O repositório tem uma regra explícita e repetida: *nenhum segundo lar para a mesma
verdade* (ver `supabase_agenda_metas.sql`, `supabase_vida_academica.sql`,
`supabase_afiliados.sql` no `CLAUDE.md`). O Caderno respeita isso:

| Informação | Onde já mora | O Caderno faz |
|---|---|---|
| Que o aluno errou, o que ele marcou, quando, em quanto tempo | `question_attempts` (`resposta_marcada`, `correta`, `tempo_gasto_seg`, `motivo_erro`) | **lê** |
| O que o aluno escreveu sobre a questão | `question_notes` (`supabase_anotacoes_favoritos_relatos.sql`) | **reutiliza** — a anotação do Caderno é a mesma de `/questoes/anotacoes` |
| Enunciado, alternativas, gabarito, resolução | `questions` | **lê** |
| **Que o aluno ESCOLHEU guardar esta questão** | nada | **cria** |

Só a escolha é dado novo. Tudo o mais é junção.

Nota: existe uma tabela `erros` em `supabase_modo_aprovacao.sql` — **não reutilize**.
Ela é do Modo Aprovação, com RLS travada no e-mail do admin e um esquema de
transcrição manual (imagem, banca, fase). É outra coisa.

### 2.2 Migração — `supabase_caderno_erros.sql`

Roda depois de `supabase_anotacoes_favoritos_relatos.sql`. **É deploy blocker** para
o código da Parte 2.

```sql
-- ============================================================
-- EXPECTRUM — Caderno de Erros
-- Roda DEPOIS de supabase_anotacoes_favoritos_relatos.sql.
-- Aditiva e idempotente. RLS dono-only, mesmo padrão de
-- question_favoritos / tarefas / rotina_semanal.
--
-- Uma linha = "eu escolhi guardar esta questão". Só isso.
-- O que eu marquei, quando errei e por quê saem de
-- question_attempts na leitura; a anotação sai de question_notes.
-- Um contador de "quantas revisei" seria um segundo lar pra
-- mesma verdade e a forma óbvia de ele ficar errado.
-- ============================================================

create table if not exists caderno_erros (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  -- a tentativa que originou o salvamento. Nullable: o aluno pode salvar
  -- uma questão que ACERTOU (pediram isso explicitamente) ou salvar de
  -- dentro do próprio caderno. on delete set null — apagar a tentativa
  -- não pode apagar a decisão de estudar aquilo.
  attempt_id uuid references question_attempts(id) on delete set null,
  criado_em timestamptz not null default now(),
  -- "já resolvi essa pendência". NULL = ainda na fila. Data e não boolean:
  -- "resolvi há 2 meses" e "resolvi ontem" são coisas diferentes na revisão.
  resolvido_em timestamptz,
  unique (user_id, question_id)
);

alter table caderno_erros enable row level security;

drop policy if exists "caderno_erros_owner" on caderno_erros;
create policy "caderno_erros_owner" on caderno_erros
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- a consulta da tela: "meus itens em aberto, mais recentes primeiro"
create index if not exists ix_caderno_erros_user
  on caderno_erros (user_id, resolvido_em, criado_em desc);
```

O `unique (user_id, question_id)` é o backstop de verdade contra salvar duas vezes
a mesma questão — não um `if` em JS. Todo insert é `upsert` com
`onConflict: "user_id,question_id"` e `ignoreDuplicates: true`, para o botão "salvar
todos os erros da lista" ser idempotente e o aluno poder apertá-lo duas vezes sem
susto.

### 2.3 Camada de dados — `web/src/lib/caderno/`

Três arquivos, espelhando `lib/anotacoes/` (que é o padrão consolidado do repo):

**`types.ts`**

```ts
export type ItemCaderno = {
  questao: Pergunta & { materiaNome: string | null; topicoNome: string | null };
  /** o que o aluno marcou na tentativa que gerou o item ("você marcou C") */
  respostaMarcada: string | null;
  /** conceito | calculo | interpretacao | chute — só Pro classifica */
  motivoErro: string | null;
  erradoEm: string | null;      // criado_em da tentativa (ISO)
  notaTexto: string | null;     // de question_notes
  resolvidoEm: string | null;
  /** quantas vezes o aluno já errou ESTA questão (question_attempts) */
  vezesErrada: number;
};
```

**`dados.ts`** (loader sem `"use server"`, chamado do Server Component — mesmo
padrão de `lib/anotacoes/dados.ts`):

```ts
export async function carregarCaderno(
  supabase: SupabaseClient,
  user: { id: string },
  filtro: { status: "abertos" | "resolvidos" | "todos" },
): Promise<ItemCaderno[]>
```

Sequência: 1) lê `caderno_erros` do aluno (ordem `criado_em desc`); 2) `emLotes`
sobre `questions` com `topicos(nome, materias(nome))` — **use `emLotes`/`lerPaginado`
de `lib/supabase/paginado.ts`**, um `.in()` com centenas de uuids estoura a URL do
gateway e o PostgREST corta em 1000 linhas sem avisar; 3) uma leitura de
`question_attempts` filtrada por `user_id` e `correta = false` (sem `.in(ids)` — já é
dono-only, o filtro extra só repetia o recorte, mesma nota de `anotacoes/dados.ts:61`),
agregada em memória para `respostaMarcada`/`motivoErro`/`vezesErrada`; 4) uma leitura
de `question_notes` do aluno.

**`actions.ts`** (`"use server"`):

```ts
salvarNoCadernoAction(questionId: string, attemptId: string | null)
  : Promise<{ ok: true } | { error: string }>

salvarErrosDaListaAction(missaoId: string)
  : Promise<{ salvos: number } | { error: string }>
  // Os ids NÃO vêm do cliente: a action lê question_attempts da própria
  // missão com correta = false. Mesma regra de finalizarMissaoAction
  // (actions.ts:409) — "recap, avulsa e question_ids vêm daqui, NÃO do
  // cliente, pra ninguém apontar pra missão de outro".

removerDoCadernoAction(questionId: string)
alternarResolvidoAction(questionId: string)

refazerDoCadernoAction(questionIds: string[])
  : Promise<{ missaoId: string | null }>
  // Cria uma lista avulsa com question_ids EXPLÍCITOS. O helper existente
  // criarListaDeQuestoes (lib/questly/criar-lista.ts) sorteia por tópico e
  // não serve. Reaproveite a forma de aceitarDesafioAction
  // (lib/questao/actions.ts:824-847): insert em missions com avulsa: true,
  // tempo_previsto_min via minutosEstimados() e xp_recompensa somado com
  // questlyXpDaQuestao(). Teto de 20 questões por refazer.
```

A anotação **não ganha action nova**: reusa `salvarNotaAction` de
`lib/anotacoes/actions.ts`, incluindo o teto do plano grátis que já vive lá.

### 2.4 Captura — o gatilho tem que custar um toque

Três pontos, em ordem de importância.

**(a) Logo após errar — dentro de `FeedbackArea` (`questao-runner.tsx:831-1012`).**
Entre o banner vermelho (`:855-883`) e a fileira de botões (`:927-939`), um cartão de
largura inteira. É o único elemento nessa faixa com cor de marca, então o olho vai
nele sem esforço:

```
┌──────────────────────────────────────────────────────┐
│ ⟡  Guardar no Caderno de Erros                    →  │
│    Você revê essa questão depois, com a resolução.   │
└──────────────────────────────────────────────────────┘
```

- Estado inicial: `border-questly-blue/25`, `bg-questly-blue-light/40`, ícone
  `NotebookPen` em `bg-questly-blue` com texto branco, 40×40, `rounded-xl`.
- **Um clique resolve.** Sem modal, sem campo obrigatório. `salvarNoCadernoAction`
  otimista — pinta salvo na hora e desfaz se a action falhar (padrão de
  `toggleFavorito`, `questao-runner.tsx:358-377`).
- Estado salvo: o cartão **não some** — troca para `bg-questly-green-light`, ícone
  `Check`, texto "Guardado no Caderno" e um link secundário "escrever uma nota"
  que abre o painel de anotação que já existe em `QuestaoAcoes`. Sumir seria tirar
  do aluno a confirmação de que a coisa aconteceu.
- Animação: `framer-motion`, `initial={{opacity:0,y:8}}` → `animate`, 220ms, spring
  igual ao `painelMotion` de `questao-acoes.tsx:52-57`. Respeite
  `useReducedMotion()`.

**(b) Quando acertou, ou em qualquer questão** — uma quarta pílula em
`QuestaoAcoes` (`questao-acoes.tsx:129-151`), ao lado de Favoritar/Anotar/Reportar:
ícone `NotebookPen`, rótulo `Caderno` / `No caderno`, cor `blue` (a paleta `Pill` já
tem gold/blue/red; adicione a variante ou reuse `blue` com o ícone distinto).
Aqui é discreto de propósito — quem acertou não precisa de convite grande.

**(c) No fim da lista** — em `ResultView` (`questao-runner.tsx:1240-1321`), acima do
botão de voltar, quando `erros > 0`:

```
┌──────────────────────────────────────────────────────┐
│  📓  Você errou 4 questões nesta lista                │
│      Guardar as 4 no Caderno de Erros     [ Guardar ] │
└──────────────────────────────────────────────────────┘
```

Chama `salvarErrosDaListaAction(missao.id)`. Depois de salvo, o cartão vira
"4 questões guardadas · **Abrir o Caderno**" com link para `/questoes/caderno`.
Este é o ponto de maior conversão do fluxo inteiro: o aluno acabou de ver o placar,
e é o único momento em que ele pensa na lista como um todo.

### 2.5 Acesso — onde o Caderno aparece

1. **Trilho da home** (`web/src/components/dashboard/home-rail.tsx`). O trilho tem
   uma regra documentada no próprio arquivo (`:10-12`): *o que navega fica FORA do
   grupo de visões, senão o estado "ativo" mente*. O Caderno navega para
   `/questoes/caderno`, então entra como **botão irmão do "Carta"** (`:62-71`), com
   o mesmo molde `surface-interativa`, ícone `NotebookPen` em gradiente
   `from-questly-blue to-questly-purple`, rótulo "Caderno".
   **No celular, o "Carta" some** (`:23-26`) — mas o Caderno **não pode sumir**, ou
   o recurso vira exclusivo de desktop (erro já cometido e documentado com o
   "Matérias", `nav-items.ts:23-26`). Solução: no mobile ele vira uma linha de
   largura inteira, 40px, logo **abaixo** do controle segmentado — fora do
   `role="tablist"`, com um badge numérico quando há itens em aberto.
2. **Hub `/questoes`** (`app/(protected)/questoes/page.tsx:96-129`): terceiro cartão
   de "Minha coleção", ao lado de Favoritas e Minhas anotações. Ícone `NotebookPen`,
   `bg-questly-purple-light text-questly-purple-dark`, copy: *"Caderno de Erros —
   as questões que você errou e guardou pra virar acerto."*
3. **Aba Desempenho** (`components/dashboard/desempenho-view.tsx`): o bloco "tópicos
   que você mais erra" ganha um CTA para o Caderno filtrado pela disciplina. É a
   ponte entre diagnóstico e ação, e hoje ela não existe.

### 2.6 A tela — `/questoes/caderno`

Server Component (`page.tsx`) chama `carregarCaderno` e entrega para
`components/caderno/caderno-view.tsx` (client).

```
┌─────────────────────────────────────────────────────────────┐
│  Caderno de Erros                                            │
│  12 questões esperando virar acerto · 34 já resolvidas       │
│                                                              │
│  [ Em aberto (12) ] [ Resolvidas ] [ Todas ]   ⌄ Disciplina  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ CÁLCULO II · Integrais impróprias      errei 2× · 3d  │   │
│  │ Calcule ∫₁^∞ dx/x² e classifique quanto à convergên…  │   │
│  │                                                        │   │
│  │ você marcou (C)   gabarito (A)   ⟡ errei a conta      │   │
│  │ ── sua nota ────────────────────────────────────────  │   │
│  │ "esqueci de avaliar o limite no infinito"             │   │
│  │                                                        │   │
│  │ [ Ver resolução ]  [ Refazer ]         ✓ Resolvi   ⋯  │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ▸ selecionar várias                    [ Refazer as 12 ]    │
└─────────────────────────────────────────────────────────────┘
```

**Regras de comportamento:**

- **Cartão colapsado por padrão**, mostrando: disciplina + tópico (com a cor da
  disciplina de `lib/questao/disciplina-cor.ts` numa barra de 3px à esquerda),
  as ~2 primeiras linhas do enunciado (`line-clamp-2`), "você marcou X · gabarito Y",
  o chip do `motivo_erro` e o "errei 2×". Clicar expande **no lugar** — não abre
  modal, não navega. O aluno passa o polegar por 12 cartões e decide quais abrir.
- **Expandido:** enunciado completo (`MathText`, KaTeX), figura
  (`FiguraQuestao`) se houver, alternativas com a marcada em vermelho e o gabarito
  em verde, resolução em `<details>` fechado (ver a resolução é uma escolha, não
  um spoiler automático), e o campo de nota.
- **Nota:** um `textarea` de uma linha que cresce ao focar, placeholder
  *"Errei por quê? (opcional)"*, sem botão visível — salva no blur e em
  `debounce` de 800ms, com um "salvo" de 2s ao lado do rótulo (mesmo padrão de
  `questao-acoes.tsx:107-113`). **Nunca obrigatório.** O botão "Usar nossa
  resolução" de `QuestaoAcoes` (`:162-170`) também cabe aqui.
- **Refazer:** a ação que fecha o ciclo. Seleção múltipla (checkbox no cartão) ou
  o botão do rodapé. Chama `refazerDoCadernoAction` e navega para
  `hrefQuestao(missaoId, "/questoes/caderno")` — o `voltarHref` traz o aluno de
  volta ao Caderno ao fim (`lib/questao/navegacao.ts`).
- **Resolvi:** `alternarResolvidoAction`. O cartão não some da tela na hora — ele
  desliza para o estado "resolvido" (opacidade 0.6, selo verde) e só sai na próxima
  carga, com um "desfazer" de 5s. Item sumindo debaixo do dedo é a forma mais fácil
  de o aluno achar que apagou por engano.
  **Acertar a questão num refazer NÃO marca resolvido automaticamente** — um acerto
  pode ser sorte, e a decisão de considerar aprendido é do aluno. Mas o cartão passa
  a mostrar "você acertou no refazer de ontem", e aí o "Resolvi" fica óbvio.
- **Rolagem:** uma por tela, nunca dentro do cartão (regra em `web/CLAUDE.md`,
  "Rolagem: uma por tela").

**Estado vazio** (o mais importante da tela, porque é o primeiro que todo aluno vê):

> **Seu caderno está vazio — e isso é bom.**
> Quando errar uma questão, toque em *Guardar no Caderno de Erros*. Ela vem pra cá
> com a resolução, e você a refaz quando quiser.
> `[ Praticar agora ]`

Nada de ilustração de tristeza, nada de "você ainda não errou nada". O tom do
produto inteiro aqui é: erro é matéria-prima.

### 2.7 Teto do plano

Coerente com `lib/plano/limites.ts`, mas **mais generoso que favoritos/anotações**:
o Caderno é exatamente o comportamento que a Parte 1 está tentando destravar, e
bater numa parede na terceira questão errada ensina o contrário.

```ts
/** Questões guardadas no Caderno de Erros no grátis.
 *  Gate: lib/caderno/actions.ts (salvarNoCadernoAction e salvarErrosDaListaAction). */
export const CADERNO_FREE = 40;
```

Regras: **remover e marcar resolvido nunca são barrados** (só guardar consome vaga —
mesma lógica de `excedeuLimite` em `anotacoes/actions.ts:63-89`); item **resolvido não
ocupa vaga** (o teto conta `resolvido_em is null`), o que transforma o limite num
incentivo a fechar pendência em vez de uma punição; `salvarErrosDaListaAction` salva
até encher e devolve `{ salvos: 3, barrados: 2 }` para a UI dizer a verdade —
salvar 3 de 5 em silêncio é pior que recusar.

### 2.8 Checklist da Parte 2

- [ ] `supabase_caderno_erros.sql` + parágrafo no `CLAUDE.md` raiz (padrão das outras migrações)
- [ ] `lib/caderno/{types,dados,actions}.ts` — `emLotes` nas junções, ids do servidor nunca do cliente
- [ ] `CADERNO_FREE` em `lib/plano/limites.ts` com o gate citado
- [ ] Captura: cartão no `FeedbackArea`, pílula em `QuestaoAcoes`, cartão no `ResultView`
- [ ] Acesso: `HomeRail` (desktop **e** mobile), hub `/questoes`, CTA na aba Desempenho
- [ ] `/questoes/caderno` + `caderno-view.tsx`
- [ ] `refazerDoCadernoAction` devolvendo ao Caderno pelo `voltarHref`

---

## Parte 3 — Diretrizes visuais

Não há design system a inventar: o app tem um, maduro, e a regra é **usá-lo**.

**Cor.** Nenhum hex novo. Tokens semânticos `--questly-{green,blue,gold,red,orange,purple}`
(+ `-light`/`-dark`) para o que carrega informação; `PALETA_CARTOES`
(`lib/questly/paleta-cartoes.ts` → `--cartao-N-*`) para superfície de disciplina.
A rampa foi dessaturada em 0.62 de croma em OKLab no repasse de 2026-09-16 porque
"as cores estavam ardendo os olhos" — **não reintroduza croma cheio no Caderno.**
Papéis de cor nesta entrega: `blue` = guardar/anotar, `purple` = o Caderno como
lugar, `green` = resolvido, `red` = o que foi marcado errado (e só isso — o Caderno
não é uma tela vermelha; se fosse, ele seria a própria vergonha que estamos tirando).

**Superfície.** `.surface` para cartão, `.surface-interativa` para cartão clicável,
`.casca` para a largura da página. Raios: `rounded-2xl` em cartão, `rounded-xl` em
botão/campo, `rounded-full` em chip. Sombra só em elemento interativo (`shadow-xs`,
`shadow-sm` no hover).

**Tipografia.** `font-heading` só em título de seção. Corpo 13–14.5px, rótulo de
chip 11–12.5px, `tnum` em qualquer número que muda (contadores, "errei 2×").
Hierarquia de um cartão do Caderno: disciplina 11px uppercase `tracking-[0.08em]`
→ enunciado 14.5px → metadados 12.5px `text-muted-foreground`.

**Ícones.** Lucide, sempre, **nunca emoji** (`nav-items.ts:3-4`). `strokeWidth`
1.9–2.1. Os desta entrega: `NotebookPen` (Caderno), `Lock` (privado),
`RotateCcw` (refazer), `Check` (resolvido), `Undo2` (desfazer).

**Dark mode.** Não é um tema secundário — os tokens já resolvem os dois, e o
requisito "dark mode limpo" está atendido usando `bg-card`/`bg-muted`/`border-border`
em vez de cinzas literais. Regra prática: se você escreveu `#` ou `gray-800` no
Caderno, está errado. Teste nos dois temas antes de abrir PR.

**Movimento.** `framer-motion`, 200–260ms, spring `stiffness: 380-460, damping: 32-38`
(os valores já usados em `questao-acoes.tsx` e `home-rail.tsx`). Expandir cartão:
`height: 0 → auto` com `overflow-hidden`. Sempre atrás de `useReducedMotion()`.

**Alvos e acessibilidade.** Mínimo 40px de altura em qualquer coisa clicável
(`min-h-9`/`h-10` é o padrão do repo). `aria-pressed` em toggle, `aria-selected` em
tab, `aria-live="polite"` no "salvo"/"guardado". Contraste: os tokens são AA medidos
— não pinte texto de marca sobre fundo de marca fora dos pares `-light`/`-dark`.

**Mobile primeiro nesta entrega.** O Caderno será usado no celular, entre aulas.
Cartão em coluna única até `lg`; a fileira "você marcou / gabarito / motivo" quebra
em duas linhas antes de encolher a fonte; o rodapé de seleção múltipla é `sticky
bottom-0` com `safe-area-inset`.

---

## Parte 4 — Ordem de execução

| # | Entrega | Depende de | Risco |
|---|---|---|---|
| 1 | `select("*")` → colunas explícitas em `dashboard-data.ts` | — | baixo, mas **trava a migração 3** |
| 2 | Tirar acerto do card público + bloco "Só você vê" | 1 | baixo — só leitura |
| 3 | `supabase_ranking_privado.sql` | 1, 2 | **médio**: rodar antes do passo 1 derruba a home |
| 4 | Economia (0.45 + guarda de 12s medida no servidor) | — | médio: mexe em XP de todo mundo; anuncie a mudança |
| 5 | `SeloPrivado` nos três pontos | 2 | nenhum |
| 6 | `supabase_caderno_erros.sql` + `lib/caderno/` | — | baixo |
| 7 | Captura (runner + resultado) | 6 | baixo |
| 8 | `/questoes/caderno` + acessos | 6, 7 | baixo |

**Riscos que merecem atenção explícita:**

- **Ordem da migração 3.** `revoke select (coluna)` faz `select *` falhar *para
  todos, inclusive o dono da linha*. O passo 1 não é opcional nem cosmético.
- **Mudar XP retroativamente não acontece.** O `xp_total` de quem já estudou foi
  ganho com a fração antiga; a nova vale dali pra frente. Não tente recalcular —
  o XP é incremental de propósito (`supabase_ranking_fiel.sql`), porque depende de
  combo/maestria/anti-farm do instante da resposta e não é reconstruível.
- **A carta é pública por id, não por link.** Depois da Parte 1, confirme no
  Network que o payload da carta alheia não traz o número — remover da UI e deixar
  no payload não resolve nada.
- **Nada do Caderno paga XP, acende ofensiva ou entra no ranking.** Guardar,
  anotar e marcar resolvido são organização, não estudo. Refazer paga o XP normal
  das questões, pela via normal (`registrarRespostaAction`), inclusive a regra de
  meio XP para questão já acertada. Essa é a mesma linha que o repo já traça para
  agenda, metas e faltas — e é o que impede o Caderno de virar rota de forja de
  ranking.
