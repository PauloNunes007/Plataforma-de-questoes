# CLAUDE.md (web/)

This is the **Next.js rewrite** of Questly — read this before exploring the folder structure by hand. The root `CLAUDE.md` documents the legacy static HTML/CSS/JS app (still at the repo root, untouched, kept as reference during migration). This file documents the new app in `web/`.

## Status: all 5 planned steps are done

The rewrite followed a user-approved 5-step plan, one commit (or a few) per step, oldest first:

1. **Setup** (`c4e3dd5`) — Next.js 16 (App Router, TS, Tailwind v4), shadcn/ui, Framer Motion, `@supabase/ssr`, design tokens.
2. **Auth & layout** (`72d84f1`) — `/login`, route guards in `src/proxy.ts`, global `Sidebar` + `(protected)` layout.
3. **Dashboard** (`8d4633a`) — `/dashboard`. Ported `mission-engine.js`/`rotina-engine.js`/`liga.js` → `src/lib/questly/*.ts`.
4. **Missions/questions** (`9cd3eb6`) — `/questao`, KaTeX via own `MathText` component, Server Actions for every DB write.
5. **Config & import** (`e42d8d7`, `e9e7e91`, `53dce7c`) — `/onboarding` (iOS-style wizard, added mid-session, not in the original 5-step list — see memory), `/configuracoes`, `/importar`.
   **Follow-up: TikZ figures in the importer (real backend compilation).** A question's `tikz_code` (enunciado) or `alternativas_tikz[letra]` (per-alternative) field in the imported JSON is TikZ source that gets compiled to a **vector SVG on the backend**, with the **full TeX Live** available — `circuitikz`, `pgfplots`, siunitx, and the usual tikzlibraries all work (an earlier attempt used a client-side WASM engine, `@rod2ik/tikzjax`, but it couldn't do circuitikz/pgfplots, so it was replaced — don't reintroduce it). Pipeline in `lib/importar/tikz-server.ts` → `compilarTikz`: wrap the fragment in a `standalone` doc with a generous preamble (`montarDocumento`; a code that already has its own `\documentclass` is used verbatim, giving full control) → POST multipart (`filecontents[]`/`filename[]`/`engine`/`return=pdf`) to **texlive.net** (`https://texlive.net/cgi-bin/latexcgi`, David Carlisle's free TeX Live compile server, the one TeX.SE's "run" button uses; `fetch` follows its 301→PDF, and a non-PDF response means a compile error whose log we parse via `extrairErroDoLog`) → convert the returned PDF's first page to SVG with **mupdf** (WASM, `import("mupdf")`, `DocumentWriter(buf, "svg")` — glyphs come out as `<path>` so there's no font dependency; `serverExternalPackages: ["mupdf"]` in `next.config.ts` keeps it out of the bundler) → inject a white background rect (`garantirFundoBranco`, so the black strokes read in dark mode) → upload to Supabase Storage `questoes/tikz/<sha256(engine+code)>.svg`. **Cache** is that deterministic hash path: `urlSeExistir` lists the object before compiling, so a repeated diagram (or a re-review) returns instantly without hitting texlive.net. Exposed as a **Route Handler** (not a Server Action) at `app/api/tikz/compilar/route.ts` (`runtime="nodejs"`, `maxDuration=60`, auth-gated) because it needs the Node runtime + a long timeout + binary handling. **`components/importar/tikz-picker.tsx`** sits next to each `ImgPicker` behind an Imagem/TikZ tab toggle (`AbaImagemTikz` in `importador.tsx`, defaulting to the TikZ tab when a `tikzCode`/`alternativasTikz[letra]` is present without a matching image yet — `avaliarElegibilidadeAuto` in `logic.ts` treats that combination as a review-queue trigger, same as an unset `imagem_enunciado`/`alternativas_com_imagem`); it POSTs to the route and auto-compiles the moment the review card loads, so by the time the reviewer sees the `PreviewCard` the figure already looks like any other `imagem_url`, with the LaTeX error log shown inline on failure. `tikz_code`/`alternativas_tikz` are never persisted to `questions` — only the resulting SVG URL is (same columns as image-flagged items), so there's no schema change. **Note:** this is the one place the app depends on an outside service (texlive.net); if it's down, compilation fails gracefully (error + log) and the reviewer can still use the Imagem tab to upload a figure manually. `uploadImagemQuestaoAction` also gained a `tipo: "svg"|"jpg"` form field for other vector uploads.
   **Follow-up: recorte de figuras direto do PDF (2026-07-13).** The bottleneck ingesting figure-heavy exams (UFF Física P1: ~half the questions carry a diagram) was that a reviewer had to crop each figure in an *external* editor and paste it into the `ImgPicker`, one by one, and AI-*redrawn* TikZ of real exam figures came out wrong. Fix: **crop the real figure straight from the source PDF inside `/importar`** — never redraw it. `components/importar/pdf-recortador.tsx` (`PdfRecortador`, a full-screen modal) renders a PDF page with **pdfjs-dist** (v6; dynamic `import("pdfjs-dist")` + worker via `new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url)` — local asset, no CDN, memoized in a module-level promise so it loads once), **auto-detects candidate figure boxes** (`detectarFiguras`: renders the page, subtracts `getTextContent()` text-boxes from the page's "ink" on a coarse cell grid, connected-components the remainder — works for both raster and vector figures because it's pixel-based on the rendered canvas), pre-selects the largest, and lets you rubber-band a box yourself; confirming crops the canvas region → JPEG blob. The importer (`importador.tsx`) loads source PDFs into memory as `ArquivoPdf[]` (`{nome, data: ArrayBuffer}`, **not** persisted — ArrayBuffers don't serialize and provas are big) via a multi-file picker in step-1 and in the review header; each `ImgPicker` gained an optional `onRecortarPdf` that arms it as the crop target (`AlvoRecorte`), and `usarRecorte` runs the blob through the **existing** `comprimirImagem` + `uploadImagemQuestaoAction` (same `questoes` bucket, same `enunciado/`·`alt-<letra>/` prefixes) and sets the URL — so after cropping, the item is just "image supplied" and flows through `avaliarElegibilidadeAuto`/auto-insert like any other. Two new **session-only** fields on `ItemImportado` (`fonteArquivo`/`fontePagina`, parsed from `fonte_arquivo`/`fonte_pagina` in `normalizarItemJson`, matched to a loaded PDF by a tolerant `normalizarNomeArquivo`) jump the modal to the right page. **No schema change, no new Server Action, no DB persistence of the fonte fields** (same stance as `tikzCode`). TikZ stays as a rare fallback only; authoring guidance (`PROXIMO_CHAT.md`) was updated to *never* emit `tikz_code` for real exam figures — flag `imagem_enunciado`/`alternativas_com_imagem` + record `fonte_arquivo`/`fonte_pagina` instead.
   **Follow-up: subtópico per question.** `questions.subtopico` (nullable text, `supabase_subtopico_questoes.sql`) tags a question with the specific ementa subtopic it tests (e.g. "Regra da cadeia" inside the "Cálculo das Derivadas" `topico`) — more granular than `topicos.descricao`, which is one subtopics blob for the whole topico. Read/write via a `subtopico` string key in the imported JSON (`ItemImportado`/`QuestionPayload` in `lib/importar/types.ts`, parsed in `logic.ts`'s `normalizarItemJson`/`montarPayload`), editable as a plain text input in the review card (`importador.tsx`), and shown as a chip on both `PreviewCard` and `/questao`'s `questao-runner.tsx` (next to the dificuldade/instituição chips). Not used by any scoring/eligibility logic — purely descriptive detail for students and future content curation.
6. **Ranking** (added post-plan, not in the original 5-step list — see memory) — `/ranking`, a from-scratch visual redesign (not a faithful legacy port, deliberately — the user asked for something "bonita, inovadora, com efeitos"). League header with a pulsing gradient badge per liga tier + 5-league ribbon, a top-3 podium (crown/sparkle animation on #1) for groups ≥3, then a plain zone-colored list for the rest — all via `lib/ranking/ranking-data.ts` (reuses `lib/questly/liga.ts` untouched for the actual promotion/demotion math). Clicking any row opens an animated public student-card modal (`components/ranking/student-card-modal.tsx`) fetched via `lib/ranking/actions.ts`'s `buscarCardUsuarioAction` — shows nome/curso/liga/XP/questões + a badge grid (`lib/ranking/badges.ts`, `calcularDistintivos`, purely derived from public `profiles` fields, no new table). Needed one schema addition: `profiles.questoes_total` (lifetime counter, mirrors the existing `xp_total`/`xp_semana` pattern) because `question_attempts`/`aluno_topico_progresso` are owner-only RLS and can't be summed for someone else's card — see `supabase_perfil_publico_stats.sql` and the increment added to `atualizarXpELiga` in `lib/questao/actions.ts`.
7. **Trilha** (added post-plan, not in the original 5-step list — see memory) — `/trilha`, ports `questly_trilha.html`/`js/trilha.js` (skip/recap per curricular topic) but reframed as a "campaign map": `components/trilha/mapa-mundi.tsx` shows every enrolled disciplina as its own gradient-themed "region" tile (boss name/countdown, % of the ementa walked, mestre count), so the student sees the path to *all* their provas at once, not just the nearest one. Clicking a region reveals `components/trilha/caminho-disciplina.tsx`: the ementa as a vertical quest-log (rounded-square waypoint markers, not circles — deliberately not the Duolingo alternating-bubble path, same "make it personal" lens as the Etapa 3/Ranking pivots), where already-covered/mastered/skipped topics collapse to a compact single-line row and only actionable topics (pendente, including the pulsing "você está aqui" fronteira) get the full card with description + Já sei/Fazer recap buttons — this is what keeps a 20+ topic ementa from feeling cluttered. Ends in a "Boss encounter" card (reuses the dashboard's orange gradient/HP-bar language) as the visual destination of the trail. Data/actions: `lib/trilha/trilha-data.ts` (`carregarMapaTrilha` for the region grid, `carregarCaminhoDisciplina` for one subject's detail, both share a `classificarEstado` matching legacy's pulado/mestre/dominado/vazio/coberto/pendente states) and `lib/trilha/actions.ts` (`mudarStatusTopicoAction`, `iniciarPraticaTopicoAction`, `buscarCaminhoDisciplinaAction`). No schema changes.
   **Follow-up refinement, same day**: each ementa item is user-facing-labeled "Missão N" (kicker pill above the name in full cards, inline before the name in compact rows) — the user didn't want the per-topic steps read as generic "trilha" jargon; the page title and "Caminho de X" detail-card header stayed as-is (only the individual steps got relabeled, confirmed explicitly, don't re-litigate). `iniciarRecapAction` was renamed to `iniciarPraticaTopicoAction` and is now reused for two purposes: proving mastery mid-semester (recap) AND grinding an already-`coberto`/`dominado` topic toward `mestre` — a "🏅 Treinar pra virar Mestre" link appears on those rows (mastery itself is still purely derived from `question_attempts` volume/accuracy via `questlyEhMestre`, no separate mastery table). `mestre` rows now get a full-row gold-tinted background with a slow pulsing border (`components/trilha/caminho-disciplina.tsx`'s `TopicoNode`), not just a small badge, to read as clearly different at a glance like the dashboard's gold "Missão de Mestre" banner. Boss date is now editable in-place: `BossEncontro` (exported from `caminho-disciplina.tsx`, rendered in a sticky right rail next to the topic list — `xl:grid-cols-[minmax(0,1fr)_340px]`, same pattern as the dashboard) has its own inline add/edit form (nome + date input) backed by `salvarProvaTrilhaAction` (insert when no future boss exists yet, update by `bosses.id` otherwise) — no more bouncing to `/configuracoes`. Page width went from `max-w-[760px]` to `max-w-[1120px]` and the region grid gained a 3rd column (`lg:grid-cols-3`) — the narrow single column was flagged as wasting screen space while feeling cramped internally at the same time; both are fixed by widening the shell and moving the Boss card into its own rail column instead of stacking everything in one narrow center strip.
   **Follow-up redesign (2026-07-12): jornada 2.5D gamificada.** The vertical quest-log was replaced by a *serpentine 2.5D journey* (user asked for something "3d, bonito, dinâmico" where the student "bate o olho e entende onde tá"). Decisions: **2.5D CSS/SVG + framer-motion, NOT WebGL** (three.js/R3F deliberately not added — the app's existing tilt/perspective/SVG-gauge toolkit is enough and stays light/mobile-friendly). New files under `components/trilha/`: `mundo-ilhas.tsx` (region grid rebuilt as isometric "islands" with the ranking card's 3D-tilt physics — `useMotionValue`+`useSpring` 220/18 — replacing `mapa-mundi.tsx`), `caminho-jornada.tsx` (the serpentine path: nodes placed on a boustrophedon sine `x=50+27·sin(i·0.8)`, connected by a smooth cubic SVG path whose walked portion animates via `pathLength`; a `ResizeObserver` measures container width so the px SVG coords align with the `%`-positioned nodes and stroke stays uniform — ends in a pulsing Castle marker; owns the selection state + the same action handlers as the old `CaminhoDisciplina`), `no-jornada.tsx` (`NoJornada` = the node/"casinha" with a coverage `AnelProgresso` ring + state color/glow + the mascot on the fronteira; `PainelTopico` = detail card for the *selected* node with all the old actions — Já sei/recap/voltar/treinar — plus the smart callouts), and `boss-encontro.tsx` (`BossEncontro` extracted verbatim from the deleted `caminho-disciplina.tsx`; `mapa-mundi.tsx` + `caminho-disciplina.tsx` were **deleted**). **The mascot is built in SVG, not a photo** — `mascote-capivara.tsx` draws a capybara (radial-gradient shading for a 2.5D look, brand-green tie, idle bob/sway + blink via framer-motion, `useReducedMotion`-gated, `useId()` for unique gradient ids). The repo-root `mascote.png` was tried first but the user rejected it ("horrível… fundo nada a ver") — it was only ever a *reference*; do not reintroduce it as an asset. **Smart layers surfaced (were computed but hidden):** `lib/trilha/trilha-data.ts`'s `TopicoTrilha`/`RegiaoMapa` were extended (selects now also read `maestria,estabilidade`) with derived, UI-ready fields — `cobertura`, `precisao`, `retencao`+`memoriaCaindo` (Ebbinghaus via `questlyRetencaoEfetiva`, orange "revisar" glow when `< QUESTLY_RETENCAO_LIMIAR`), `rumoMestre` (gap to `questlyEhMestre`), and `forcaNaProva`+`emRiscoProva` plus a per-discipline `projecao` (`questlyProjetarProva` from `motor-aprovacao.ts`) shown as a "No dia D: ~X%" chip and the island risk seal. **No schema change, no new Server Action** — the 4 existing `lib/trilha/actions.ts` and the `/questao?missao=` navigation are untouched, and `trilha-view.tsx`'s optimistic region re-derivation now also carries `notaProjetada`/`emRisco`.
   **Same-day v2 (user rejected v1 as "genérico/desconexo"):** the map is now a full *terrain scene*, not a card with glow blobs — `cenario-trilha.tsx` draws deterministic seeded SVG scenery (grass tufts, flowers, round trees, pines, bushes, rocks, lakes with lily pads) placed in the "pockets" mirrored across each road segment, over a meadow gradient; the road is a 3-layer dirt path (border + bed + dashed centerline) with green footstep dots animating over the walked stretch, plus drifting clouds. The whole scene palette lives in `--cen-*` CSS vars declared via Tailwind arbitrary properties with `dark:` variants (`VARS_CENARIO` in `caminho-jornada.tsx`) — day/night themes with zero globals.css changes; NOTE these class strings must stay *literal* in source (Tailwind scans text; never build them dynamically). `mundo-ilhas.tsx` tiles were restyled to **match `disciplina-navegar-grid.tsx` exactly** (user asked for "iguais os do questoes/listas"): aspect-square radial-gradient tiles, same `CORES`/`iconePorNome` heuristic (duplicated on purpose per repo convention), "Jornada de X" kicker, white progress bar + boss countdown + crown/risk seals, 3D tilt kept — note the React 19 compiler rule `react-hooks/static-components` forbids `const Icone = iconePorNome(...)` inside a component body; compute it in the parent's `.map()` callback and pass the rendered element as a prop. The mascot became **full-body** (head, brand-green vest + tie, arms, legs, ground shadow that stays put while the body bobs) and nodes got claymorphism-style depth (inset bottom shadow + top highlight + drop shadow), per the `ui-ux-pro-max` skill's recommendation for mascot-led gamified surfaces.

   **Follow-up (2026-09-06): passe funcional da jornada.** A jornada estava bonita mas passiva — tudo que o motor calculava (memória caindo, risco no dia D, rumo a Mestre) só aparecia se o aluno clicasse parada por parada, e numa ementa de 20+ tópicos o mapa passa de 2500px de altura, então achar UM tópico era rolagem no olho. Cinco adições, **todas sem mudança de schema**:
   - **`components/trilha/plano-ataque.tsx`** (`PlanoDeAtaque` + a pura `montarPlano`) no topo do rail: lê a jornada inteira e ordena o que fazer agora pela MESMA prioridade do mission-engine — revisar (Ebbinghaus, do mais esquecido pro menos) → reforçar (`emRiscoProva`, Pro) → avançar (fronteira) → consolidar (`rumoMestre`) —, mostra os 3 primeiros com o motivo em texto e um botão que já cria a missão. Só entra tópico com questão no banco. Estado vazio honesto ("nada urgente por aqui"), não um card inventando tarefa.
   - **`iniciarRevisaoRelampagoAction`** (`lib/trilha/actions.ts`): quando 2+ tópicos estão atrasados, um botão só monta **uma** missão avulsa multi-tópico, com as questões intercaladas em **rodízio** entre os tópicos (nenhum monopoliza). Deliberadamente **sem `recap_topico_id`** — esse campo marca `dominado` com ≥70% e seria errado numa revisão de vários tópicos. `preverTempoMin` foi extraída pra ser compartilhada com `iniciarPraticaTopicoAction`.
   - **`components/trilha/barra-jornada.tsx`**: barra sticky com busca (sem acento, via `normalize("NFD")`), filtros por estado com contagem real (`casaFiltro`/`contarPorFiltro` — chip com 0 some), botão **"Onde eu parei"** (rola até a fronteira) e alternância **Mapa ↔ Lista**. No mapa o filtro **não remove nós** (isso quebraria a ordem curricular e o traçado da estrada), ele **apaga** os que não batem (`atenuado`); na `ListaJornada` ele filtra de verdade. A lista é a mesma ementa em linhas densas (estado, % de acerto, questões, barra de cobertura) pra varrer 25 tópicos numa tela; clicar numa linha abre o mesmo `PainelTopico`. O scroll usa `data-no={topicoId}` nos dois modos.
   - **`iniciarPraticaTopicoAction` ganhou `qtd`** (default 5, clamp server-side 1–30): o `PainelTopico` oferece 5/10/15/20 **filtrados pelo que o banco realmente tem** naquele tópico. Pra isso `TopicoTrilha` ganhou `questoesDisponiveis` (o `Record<string, boolean>` de "tem questão" virou contagem) e `ultimaRevisao` — o painel agora mostra "N questões no banco · praticado há X dias" em vez de só o estado binário "vazio".
   - **Sinal novo no mapa e nas ilhas**: `RegiaoMapa.revisar` conta tópicos tocados com retenção abaixo do limiar (não é Pro-gated — retenção é memória, não a projeção preditiva) e vira um selo "N revisar" na ilha quando não há selo de completa/risco; `trilha-view.tsx` re-deriva esse número junto dos outros na atualização otimista. O `CabecalhoJornada` ganhou **Ritmo** (`naFila ÷ semanas até a prova` → "N paradas por semana", vermelho acima de 7/semana) — aritmética explícita, rotulada "pra fechar a ementa", não previsão de nota. Os nós ganharam etiqueta com o nome no hover (desktop) pra dar pra varrer o mapa sem clicar.

8. **Disciplinas** (added post-plan, asked for explicitly) — `/disciplinas`, the free-practice picker (`questly_disciplinas.html`/`js/disciplinas.js`), rebuilt with the same visual bar as Ranking/Trilha instead of the legacy's plain stacked chip cards. Layout: a main column with 3 cards (pick disciplina as gradient region tiles reusing the Trilha/Ranking rotation, pick tópicos, pick dificuldade+quantidade) plus a sticky right rail "Resumo da prática" (dashboard-style `xl:grid-cols-[minmax(0,1fr)_340px]`) that shows the running selection, a live preview (question count/XP/time estimate, recomputed via a Server Action on every filter change), and the "🚀 Começar prática" CTA — explicitly labeled "Missão avulsa" with a note that it's a background/secondary mission that doesn't touch the daily one. Gave the user more choice than the legacy version: dificuldade is now a multi-select (any combination of Fácil/Médio/Difícil, not just one), quantidade has a free-text "Outra" option beyond the fixed chips, and each topic chip shows its available question count plus a small color-coded dot for the student's own `taxa_acerto` on that topic (gray=no data, red=weak <60%, orange=mid, green=strong ≥85%) — with a "🎯 Focar nos pontos fracos" quick-select that auto-checks the weak ones. Data/actions: `lib/disciplinas/disciplinas-data.ts` (`carregarDisciplinasPratica`, `carregarTopicosPratica` — only topics with ≥1 question are shown, since a topic with none is not practicable) and `lib/disciplinas/actions.ts` (`buscarTopicosPraticaAction`, `calcularPreviaPraticaAction`, `iniciarPraticaLivreAction` — same avulsa-mission-creation logic as legacy `comecarPratica`). No schema changes.

9. **Nome editável nas Configurações** (added post-plan, asked for explicitly) — a "Nome" card at the top of `/configuracoes` (`NomeCard` in `components/configuracoes/configuracoes-panel.tsx`) lets the student rename themselves, since the name is public in the ranking. Two rules, both enforced in `salvarNomeAction` (`lib/configuracoes/actions.ts`): the name is **unique** across all students (case-insensitive `ilike` check, plus the `profiles_nome_lower_key` partial unique index as the race backstop → 23505 mapped to a friendly message) and can only be changed **once every 15 days** (gated by `profiles.nome_alterado_em`, a new nullable timestamp column; the card shows the days-remaining lockout and disables Edit). A no-op rename (same name) doesn't consume the cooldown; a case-only change is allowed without spending it. Schema: `supabase_nome_editavel.sql` (column + partial unique index — see root `CLAUDE.md`; the index errors if pre-existing duplicate names exist, dedup query in the file header). The page's profile fetch selects `nome_alterado_em`.
   **SUPERSEDED by the username feature + fintech redesign (2026-07-14).** `profiles.username` (`supabase_username.sql`, which also *drops* the nome unique index) is now the **public identity**: the ranking rows/podium/public TCG card all show `@username` (fallback to `nome` while NULL), and `nome` became a free display name (dashboard greeting + sidebar only) — `salvarNomeAction` lost the uniqueness/cooldown gates, which moved to the new `salvarUsernameAction` (format `^[a-z0-9][a-z0-9_.]{2,19}$`, unique, 15-day cooldown via `username_alterado_em`; picking the *first* username is free). `/configuracoes` was redesigned in the same pass ("fintech" look): `NomeCard`/`FotoCard` merged into one `ContaCard` (course-gradient cover via `resolverCurso`, overlapping avatar with camera-button upload, account-style rows with inline edit for Nome and Username), sections grouped under kickers (Plano de estudo / Disciplinas e provas), and the grade-semanal native checkboxes became green toggle cells (`role="checkbox"`+`aria-checked`). Same pass: `(protected)/layout.tsx` now selects `username`/`foto_url` and threads them to `Sidebar`/`MobileHeader` (footer shows the real photo — before, only the initial rendered because `foto_url` never reached it — plus @username and the resolved course name with icon, `line-clamp-2` instead of a hard truncate); the dashboard's `CursoIdentidadeBadge` was slimmed to a pill (no tagline, no "Seu curso" chip, returns null without a curso); `/questoes` hub cards got taller (`min-h-[480px]` desktop) and the CTA actually sits at the card's bottom (the content column used `h-full` against a min-height parent, which resolves to auto — now `flex-1`, plus `mb-8` on the description as guaranteed breathing room).
   **Follow-up (2026-07-17): onboarding obrigatório + fix do salvamento.** Three related fixes after a friend's signup saved nothing: (a) **routing** — `(protected)/layout.tsx` redirects to `/onboarding` whenever `profile.curso` is empty (profile row missing included), `/onboarding`'s page does the inverse guard (curso set → `/dashboard`) and passes `nomeInicial`, and `signInAction` picks its redirect target by the same criterion — before this, login always landed on `/dashboard` and the wizard was unreachable except right after a same-session signup; (b) **saving** — `salvarCampanhaAction` now **upserts** the profile (an `update` on a missing row matched 0 rows silently — the email-confirmation path can reach onboarding without a profile row), creates unseeded `materias` via `createAdminClient()` (post-hardening RLS blocks normal users), logs every per-row error it used to swallow and returns a real error when subjects fail; the `campaigns` INSERT was failing RLS all along (no owner policy — see `supabase_onboarding_rls.sql`, root) but is non-fatal since nothing reads it; (c) `signInAction` distinguishes `email_not_confirmed` from wrong credentials — an unconfirmed friend saw "Email ou senha incorretos", gave up, and their profile never got created (that's also why they never appeared in the ranking: `profiles` row only births on first successful login). Wizard step 2 now asks **nome (required) + @ (optional)** and left the `mostrarPular` list. Same day, two follow-ups: **(d) server-side email confirmation** — new Route Handler `app/auth/confirm/route.ts` (verifyOtp by `token_hash`+`type`, with a `?code=` PKCE fallback; creates the profile via the now-shared `lib/auth/perfil.ts` — `garantirProfile`/`destinoPosLogin`, the canonical "onboarding done = profile.curso set" criterion — and drops the student straight into `/onboarding`); `proxy.ts` exempts `/auth/*` (the link arrives sessionless); invalid/expired links land on `/login?confirmacao=invalida` (orange banner), `signInAction` auto-**resends** the confirmation email on `email_not_confirmed`, and the signup tab shows a proper "Confira seu email 📬" panel instead of a tiny green line. **Requires a manual dashboard change**: Supabase → Authentication → Email Templates → Confirm signup must link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup` (the old `{{ .ConfirmationURL }}` redirected with the token in the URL #hash, which nothing read — the student landed on the landing page logged out). **(e) duplicate subjects** — onboarding (`salvarCampanhaAction`) and Configurações (`criarDisciplinaAction`) now skip/refuse a disciplina the student already has (case-insensitive; 23505 mapped to "Você já tem essa disciplina"), `criarDisciplinaAction` also got the service_role materia-creation path; existing duplicates are merged (missions/bosses/tarefas re-pointed to the kept row) and a unique index `subjects (user_id, lower(trim(nome)))` added by `supabase_onboarding_rls.sql` (root).
   **Follow-up, same day: username step in the onboarding wizard.** `OnboardingWizard` grew from 9 to 10 steps — a new step 2 ("Escolha seu @ de usuário"), right after the curso step, pushed everything else down by one (`TOTAL_STEPS=10`, `EYEBROWS`/`ehValido`/`mostrarPular`/`StepContent` cases all renumbered). It's **skippable** (`mostrarPular` includes step 2; leaving the field empty leaves `usernameStatus` at `"idle"`, which `ehValido` treats as valid, so "Continuar" already advances — the "Pular" link is just the same messaging affordance the universidade/metas steps already use). `UsernameField` (defined at the bottom of `onboarding-wizard.tsx`) debounces (450ms, same `useEffect`+`setTimeout` pattern as `pratica-wizard.tsx`) a call to the new `verificarUsernameAction` (`lib/onboarding/actions.ts`) — format-checks then queries `profiles` by `ilike` — and renders a live check/✕ + status message; "Continuar" is gated on `usernameStatus === "disponivel"` once the student has typed something (empty stays skippable). `salvarCampanhaAction` gained a `username: string | null` field, re-validates authoritatively at submit (format + uniqueness, catching `23505` as a race backstop — same defensive pattern as `salvarUsernameAction` in Configurações) and only writes `username`/`username_alterado_em` to the profile update when non-null. `USERNAME_REGEX` is duplicated across `onboarding/actions.ts`/`configuracoes/actions.ts`/the wizard component rather than shared — matches the repo's existing convention for small per-file heuristics (see `COBERTURA_TOPICO_QUESTOES`/`iconePorNome`).

10. **Dashboard: abas Hoje/Semana/Jornada + metas/tarefas do dia** (added post-plan, asked for explicitly, inspired by screenshots of another platform) — `/dashboard` gained `components/dashboard/dashboard-tabs.tsx` (Hoje/Semana/Jornada pill bar; "Jornada" doesn't render in-page content, it just `router.push("/trilha")` — that's already the app's journey concept, no duplicate UI) and `components/dashboard/dashboard-view.tsx` (client wrapper holding the tab state, now the thing `page.tsx` renders instead of laying out `MissionBanner`/`BossSiegeMeter`/rail directly). The "Hoje" tab keeps everything that existed before (mission banner, boss meter, calendar rail, subjects rail — untouched, just pushed below a new hero row) and adds three cards above it: `xp-diario-card.tsx` (circular SVG gauge of today's XP vs. the sum of `xp_recompensa` across today's missions — not a configurable goal, just what today's missions already add up to), `metas-card.tsx` (reinterprets the reference's "Aulas concluídas" — Questly has no lesson/video concept — into missões concluídas/questões respondidas/XP, all three read straight off `dados.metasHoje`, zero new queries), and `tarefas-do-dia-card.tsx`. The "Semana" tab (`semana-view.tsx`) was later redesigned (user asked for a more vibrant look matching the reference, guided by the project-local `ui-ux-pro-max` design skill → "Vibrant & Block-based" style: saturated block cards, big numbers, stagger entrance, `prefers-reduced-motion` respected). It's a 7-day Dom–Sáb XP-bar strip on top plus **four** vibrant stat blocks: **XP da Semana** (circular SVG gauge vs. `metaSemanalXp` — a transparent heuristic: today's planned mission XP × study-days-per-week, floored so the bar always reads; *not* a configurable goal), **Streak** (flame + weekday-letter chips), **Comparativo**, and **Recorde**. The last two are **real, not invented**: Comparativo is a true percentile of the student's `xp_semana` among *all* profiles (`profiles` is world-readable under RLS, so `dashboard-data.ts` can rank cross-user honestly; shows an encouraging empty state when the student hasn't scored this week), and Recorde is the longest ever consecutive-day study streak recomputed from the full `daily_logs` history (there's no persisted `streak_maximo`). Both live on `dados.semana` (`ComparativoSemana`/`RecordeEstudo` types).
    **New feature underneath this: pontual tasks on the calendar.** Schema: `supabase_tarefas_semanais.sql` adds `tarefas` (owner-only RLS, mirrors `rotina_semanal`'s pattern) — `nome`/`descricao`/optional `subject_id`/`data` (a specific date, not a recurring weekday like `rotina_semanal`). Data/actions: `lib/tarefas/tarefas-data.ts`'s `carregarTarefasIntervalo` (any date range → `Record<data, TarefaRow[]>`, called once in `dashboard-data.ts` for the *displayed month* so the same fetch backs both the calendar's day dots and the current week) and `lib/tarefas/actions.ts` (`criarTarefaAction`/`alternarTarefaAction`/`excluirTarefaAction` — plain CRUD, no derived server logic, so callers update local state on success instead of refetching). Two entry points write to the same table: `tarefas-do-dia-card.tsx` (today only, full form with description) and `components/dashboard/right-rail.tsx`'s `CalendarRailCard` (extended: any day's detail panel now lists that day's tasks with a checkbox + a slim inline add-form, and days with a pending task get a small purple dot on the month grid) — **superseded pelo item 23**, que apagou `right-rail.tsx` e moveu essa edição pro `agenda-card.tsx` de largura inteira. `lib/questly/dashboard-data.ts`'s `DashboardData` grew `metasHoje`, `semana`, `tarefasHoje`, and `tarefasPorData` accordingly — see the type definitions there for exact shapes.

11. **Nav "Questões": Banco de Questões / Listas de Questões** (added post-plan, asked for explicitly) — the "Praticar" nav entry (`components/nav-items.ts`) was renamed "Questões" and moved from `/disciplinas` to `/questoes`, which is now a hub instead of a direct wizard: `app/(protected)/questoes/page.tsx` shows two `HubTiltCard`s (`components/questoes/hub-tilt-card.tsx`, a client component reusing the exact 3D-tilt physics from `components/ranking/student-card-modal.tsx`'s "Pokémon TCG" card — `useMotionValue`+`useSpring` tracking the mouse, same stiffness/damping — because the user explicitly asked for that same "dynamic on hover, cool on mobile" feel; on touch it falls back to a `whileTap` press + an always-on holographic shimmer sweep + a giant faded background icon so it doesn't depend on hover to feel alive) linking to `/questoes/banco` and `/questoes/listas`. **No new Server Action or query was needed for this feature** — `/questoes/banco/page.tsx` is a straight move of the old `disciplinas/page.tsx` (same `carregarDisciplinasPratica` + `<PraticaWizard>`, untouched), and "Listas de Questões" (`/questoes/listas/page.tsx` → `/questoes/listas/[subjectId]/page.tsx`) is pure navigation UI over data/actions that already existed: `carregarDisciplinasPratica`/`carregarTopicosPratica` (`lib/disciplinas/disciplinas-data.ts`) for the picker and per-topic metadata (question count, `numRespondidas` for the "Nenhuma tentativa"/"N tentativa(s)" pill), and `iniciarPraticaLivreAction` (`lib/disciplinas/actions.ts`) called with `topicIds:[umTópico]`/`quantidade:"todas"` — exactly "start this topic's full list" with zero new backend code. New components: `disciplina-navegar-grid.tsx` (vibrant solid-gradient square tiles, one per disciplina, with a heuristic `iconePorNome` mapping Portuguese subject-name keywords to a Lucide icon) and `lista-topico-card.tsx` (a horizontal-flowing grid of vertical topic cards — colored header strip, matéria label, título/descrição, meta pills, full-width "Começar"/"Retomar lista" CTA) — both explicitly modeled on reference screenshots the user provided from another platform, using the project-local `ui-ux-pro-max` design skill's "Vibrant & Block-based" guidance (bold saturated blocks, no emoji icons, `prefers-reduced-motion`-safe motion) rather than the app's previously more subdued/sober tile style (`DisciplinaPicker`/`MapaMundi`), by explicit user request — don't unify them retroactively without asking. `sidebar.tsx`/`mobile-bottom-nav.tsx`'s active-tab match went from exact (`pathname === item.href`) to prefix-aware (`|| pathname.startsWith(item.href + "/")`) so the nav still highlights on the new `/questoes/*` sub-routes — safe to keep, no other nav item has sub-routes today.

12. **Admin de questões** (added post-plan, asked for explicitly) — a full CRUD screen for the `questions` table, restricted to one account (`ADMIN_EMAIL` in `lib/admin/auth.ts`, currently hardcoded to `paulocresponunes@gmail.com` — there's no `role` column, see root `CLAUDE.md`). `/admin/questoes` (`components/admin/questoes-lista.tsx`) is a searchable/filterable list (enunciado text search + matéria/tópico/dificuldade filters, `topicos!inner` embedded-resource filtering for the matéria filter, 20/page) linking to `/admin/questoes/[id]` (`components/admin/questao-editor.tsx`), which **reuses the JSON importer's edit form and `PreviewCard` almost verbatim** (`ItemImportado`, `montarPayload`, `validarAntesDeAprovar`, `ImgPicker` all imported straight from `lib/importar`/`components/importar` — no TikZ tab here, just Imagem) — `carregarQuestaoAdminAction` maps a DB row into `ItemImportado` shape and `atualizarQuestaoAdminAction` calls the same `update` a saved edit would. Every action in `lib/admin/actions.ts` repeats a `requireAdmin()` email check (Server Actions are directly callable, so the UI-level redirect in the page isn't enough). Delete is new capability this feature introduces (the importer never had it), so it also got a DB-level `DELETE` policy gated on the same email (`supabase_admin_questoes.sql`) as defense-in-depth, not just the app-layer check; a `23503` FK-violation on delete (question already has attempts) is caught and shown as a friendly message rather than a raw Postgres error. Nav: a small `ShieldAlert`-icon link appears only for the admin account, below the main nav list in `Sidebar` (not one of the 5 `NAV_ITEMS` — that list is shared with `MobileBottomNav`'s fixed 5-tab layout, this is separate) and in `MobileHeader`'s account dropdown; `isAdmin` is computed once in `(protected)/layout.tsx` and passed down as a prop.
13. **Anotações, favoritos e relatos de erro por questão** (added post-plan, asked for explicitly) — three independent per-student/per-question features, all surfaced via one shared toolbar component (`components/questao/questao-acoes.tsx`, three icon buttons — star/note/flag — each expanding an inline panel) embedded directly in `QuestaoRunner`'s question card. **Notas**: a free-text note per `(user, question)` (`question_notes`, upsert via `salvarNotaAction` in `lib/anotacoes/actions.ts`, empty text deletes the row instead of storing blank) — the note panel has a "Usar nossa resolução" button that appends the question's `resolucao` text as a starting point, since the ask was explicitly "escrever fórmulas ou reaproveitar nossa solução"; renders through the same `MathText`/`$...$` convention as everywhere else. **Favoritos**: a plain toggle (`question_favoritos`, `alternarFavoritoAction`). Both are owner-only `for all` RLS (`supabase_anotacoes_favoritos_relatos.sql`, same shape as `tarefas`/`rotina_semanal`). Review surfaces: `/questoes/favoritos` and `/questoes/anotacoes` (linked from the `/questoes` hub, below the two `HubTiltCard`s) share one component, `components/questoes/minhas-questoes-lista.tsx` — an expandable list grouped by "matéria · tópico", each row reusing `PreviewCard` (via a small `questaoParaItemImportado` mapper in `lib/anotacoes/mapear.ts`, since `Pergunta` and `ItemImportado` have almost the same content fields) plus the same `QuestaoAcoes` toolbar so a note/favorite can be edited or cleared without re-entering a mission; the two pages differ only in which loader they call (`carregarFavoritos`/`carregarQuestoesComNotas` in `lib/anotacoes/dados.ts`) and a `criterioRemocao` prop (`"favorito"|"nota"`) telling the list which action should drop a row out of view. **Relatos**: a small fixed set of reasons (`MOTIVOS_REPORT` in `lib/anotacoes/types.ts` — missing enunciado, missing image on enunciado/alternativa, wrong question/gabarito, broken LaTeX, other) plus an optional free-text detail, inserted via `reportarQuestaoAction` into `question_reports`. RLS here is asymmetric on purpose: any authenticated user can insert/read their own reports, but reading *all* reports and marking one resolved is admin-only (`auth.jwt() ->> 'email'`, same email as the admin-questões policy) — two permissive `select` policies on the same table OR together (owner sees own, admin sees all). Admin side: `/admin/relatos` (`components/admin/relatos-lista.tsx`) lists pending reports with a link straight into `/admin/questoes/[id]` to fix the flagged question, and a "Marcar resolvido" button (`resolverRelatoAdminAction`, admin-gated same as the rest of `lib/admin/actions.ts`). A small `components/admin/admin-tabs.tsx` (Questões/Relatos pills) is shared between the two admin pages instead of duplicating the tab markup.

14. **Modo Aprovação** (2026-07-15, from a user-supplied spec prompt written for the legacy stack, adapted to the Next.js conventions) — a self-contained vestibular-prep hub (Unicamp 18/out + Fuvest 1º/nov 2026) at `/aprovacao` (dashboard "Hoje"), `/aprovacao/erros` (Caderno de Erros), `/aprovacao/simulados` and `/aprovacao/obras`, sharing an `AprovacaoTabs` pill bar (same pattern as `AdminTabs`) and linked as a standalone orange `GraduationCap` entry in `Sidebar`/`MobileHeader` (NOT in the 5 `NAV_ITEMS` — that list is locked to the mobile bottom bar). **Single-account feature** (explicit user request): gated in layers exactly like `/admin/questoes` — the nav links and the floating button render only for `isAdmin`, every page redirects non-admin to `/dashboard` (`ehAdmin(user.email)`), every Server Action re-checks via a `usuarioAprovacao()` helper, and the migration's RLS policies all require the admin email in the JWT (per-user tables check owner AND email; the content tables are admin-only for read and write; the `erros-imagens` bucket is public-read but admin-only upload/delete). **Deliberately does not touch** the dashboard/mission engine — the spec's "upgrade dashboard.html" became its own page since the product dashboard serves all students. Backed by `supabase_modo_aprovacao.sql` (run by hand after `supabase_seguranca_hardening.sql`; seeds cronograma S1–S14, escada de simulados, 14 obras; bucket `erros-imagens`). Module shape follows the repo convention: `lib/aprovacao/{constantes,tipos,dados,actions}.ts` + `components/aprovacao/*`. Key decisions: **`BotaoErroRapido`** (floating "+ Erro rápido") is mounted once in `(protected)/layout.tsx` so it exists on every logged-in page, but returns `null` inside `/questao` (don't distract a running mission); the erro form's image area takes clipboard paste (Ctrl+V on the focused dropzone — no document-level paste listener, to avoid double-handling when two forms are mounted), drag&drop or file pick, compressing via the importer's `comprimirImagem` before `uploadImagemErroAction`; pasting an image inside the Resolução textarea appends `![figura](url)` and the card renderer turns those lines into `<img>` (no real markdown engine). The evolution chart in Simulados is **pure SVG** (no Chart.js/CDN — Y axis is acertos-count per disciplina, because per-discipline totals aren't known so a % would be invented). Metas: `acertos_atual` = best simulado total of the month; `redacoes_atual` recounted from concluded `tipo='redacao'` schedule blocks (plus a manual ± on the card); `obras_atual` recounted on each obra-progress save — all idempotent recounts, never blind increments. The fichamento editor autosaves with a 1s debounce armed in the onChange handler via refs (not `useEffect` — dodges `react-hooks/set-state-in-effect`). Feature docs in `web/docs/{caderno-de-erros,dashboard-hoje,simulados,obras-literarias}.md`.

15. **Passe de usabilidade mobile + remoção do modo xadrez** (2026-07-16, asked for explicitly — "no celular, ao clicar numa disciplina as informações aparecem lá embaixo e o usuário nem vê"). **Arena de Xadrez foi REMOVIDA por decisão do usuário** ("não achei interessante") — apagados `app/(protected)/questoes/xadrez`, `app/dev-tabuleiro`, `components/xadrez/`, `lib/xadrez/`, `public/stockfish/`, `public/pecas/`, e as deps `chess.js`/`stockfish`; `proxy.ts` voltou ao matcher sem `js|wasm|txt` e sem `/dev-tabuleiro` público; `supabase_remover_xadrez.sql` (raiz) dropa `partidas_xadrez` (rodar à mão se a migração original tiver sido executada). **Não reintroduzir o modo xadrez.** `lib/questly/economia.ts` fica — continua sendo o lugar certo pros writes de XP/liga fora de "use server". Os fixes de mobile: (a) `TrilhaView` faz `scrollIntoView` até a jornada ao tocar numa ilha (só em toque explícito, não no auto-select de disciplina única; âncora com `scroll-mt-20` pro header sticky); (b) `CaminhoJornada` mostra o `PainelTopico` num **bottom sheet** (< xl) ao tocar num nó — o rail lateral com o painel é `hidden xl:block`; o sheet tem backdrop, botão fechar, `max-h-[82dvh]`, trava o scroll do body e respeita `safe-area-inset-bottom`; (c) `PraticaWizard` rola até o passo 2 ao escolher disciplina e ganhou uma **barra de ação fixa** no rodapé (< xl, `bottom-[calc(56px+env(safe-area-inset-bottom))] lg:bottom-0` por causa do gap lg→xl sem bottom nav) com a prévia (questões/XP/min) + botão Começar sempre visíveis; o grid ganhou `pb-24 xl:pb-0` de folga. Navegação: novo `components/page-header.tsx` (título + descrição + link "voltar" com chevron) aplicado a todas as subpáginas de `/questoes/*` — antes só `/questoes/listas/[subjectId]` tinha um "←" improvisado e o aluno ficava sem caminho de volta no celular; o header da `/trilha` trocou o parágrafo denso por duas frases de instrução direta.

16. **Banco/Listas de Questões: descoberta de todo o conteúdo do banco** (2026-07-17, asked for explicitly — a materia with real questions, "Fundamentos de Cálculo e Geometria", didn't show up because the student never added it as a subject during onboarding, while "Eletromagnetismo" — a subject they DID add — showed an empty shell because it has zero questions). `carregarDisciplinasPratica` (`lib/disciplinas/disciplinas-data.ts`) no longer sources from `subjects` alone: it now lists **every `materia` with ≥1 question in the bank** (via the same `topicos!inner(materia_id, materias(nome))` embedding pattern already used in `lib/cursos/actions.ts`/`lib/admin/actions.ts`), left-joined with the student's own `subjects` for boss/countdown info. `DisciplinaPratica.subjectId` became `string | null` (`materiaId` is now the non-null identity key) and `matriculada: boolean` flags whether it's one of the student's own subjects — tiles/chips for a non-matriculada materia get a small "Descobrir" badge (`disciplina-navegar-grid.tsx`, `disciplina-picker.tsx`). This forced a route rename: `/questoes/listas/[subjectId]` → `/questoes/listas/[materiaId]`. Practicing a non-enrolled materia creates the avulsa mission with `subject_id: null` (confirmed nullable in the DB — `missions.user_id` FK requires a `profiles` row but `subject_id` has no NOT NULL constraint; the questão runner already handled a null `subject_id` gracefully — `if (missao.subject_id) atualizarMetricasSubject(...)`, `subjects(nome)` embed resolves to `null` — this feature is the first caller to actually exercise that path). **Onboarding got the same content-awareness**: since the app doesn't know the student's semester yet, step 5's disciplina chips now merge in every materia with real content (`lib/disciplinas/disciplinas-data.ts`'s new `listarMateriasComQuestoes`, fetched server-side in `app/onboarding/page.tsx` and passed as a prop) alongside the curso-curated `disciplinasNucleo` suggestions, each tagged with a "✓ N questões" badge (`Chip`'s new optional `totalQuestoes` prop) — a green banner explains why ("ainda não sabemos seu semestre..."). Curated course suggestions stay (useful signal even before content exists for them), but real-content chips are unioned in first.

17. **Simulados — provas cronometradas da universidade do aluno** (2026-07-17, asked for explicitly — "montar simulado das questões da UFF... anos aleatórios dos conteúdos escolhidos, timer de 2h, resultado no fim; avisar no onboarding quem é da UFF; limitar no plano free"). A student-facing timed mock-exam builder at `/simulados` (list + history + evolução), `/simulados/montar` (montador wizard) and `/simulados/[id]` (dispatches: `SimuladoRunner` while `em_andamento`, `SimuladoResultado` when `concluido`). Backed by `supabase_simulados.sql` (`simulados_aluno`, owner-only RLS — run by hand, see root `CLAUDE.md`). Module shape follows the repo convention: `lib/simulados/{constantes,simulados-data,actions}.ts` + `components/simulados/*`. Key decisions:
    - **Question source = the student's own university.** The montador only offers content when the bank has questions whose `questions.instituicao` matches `profiles.universidade`. The text→instituição matching (`combina`/acronym/substring, e.g. "UFF" ⇄ "Universidade Federal Fluminense") was **extracted** from `lib/cursos/actions.ts` into a pure `lib/cursos/instituicao.ts` (`instituicoesQueCasam`) and reused by both — don't duplicate that heuristic. The montador filters `questions where instituicao in (matched) and topic_id in (chosen)`, shuffles, and takes N — **random years fall out of the shuffle for free** (no explicit per-year stratification). The institution is derived **server-side from the profile** in `montarSimuladoAction` (authoritative — the client never picks which university to draw from). Honest empty state when the uni has no past papers.
    - **Fully configurable** (per the user's pick): the student chooses duração (1h/2h/3h, `SIMULADO_DURACOES_MIN`, default 2h) AND quantidade (chips + free input, clamped to `[SIMULADO_QTD_MIN, min(SIMULADO_QTD_MAX, disponíveis)]`).
    - **Self-contained — does NOT touch XP/liga/streak or the mastery/BKT engine.** A simulado is a timed diagnostic, not a farmable mission; answers live only in `simulados_aluno.respostas` (JSONB, autosaved with a 1s debounce so a refresh/disconnect resumes and enables per-question review). No `question_attempts`/`missions` rows are written. This is a deliberate design line — don't wire simulados into the economy later without re-checking the ranking-forge implications.
    - **Timer resumes across refresh** because the countdown is derived from `simulados_aluno.iniciado_em` + `duracao_min`, not a client stopwatch; on expiry `SimuladoRunner` auto-finalizes with whatever's marked. A `respostasRef` mirrors the latest answers into the interval's first-render closure (otherwise auto-submit would entregar stale respostas — real bug fixed during build). Grading is **authoritative server-side** in `finalizarSimuladoAction` (recomputes acertos/nota from the gabaritos, never trusts the client count; idempotent if already concluído).
    - **Plan gating = free-with-limit, Pro unlimited** (`SIMULADO_FREE_LIMITE_SEMANA`, currently 1/week, window = league Monday via `questlySegundaDaSemana`). Enforced authoritatively in `montarSimuladoAction`; `carregarStatusPlano` mirrors it for the UI (a gate banner + "Seja Pro" CTA on the list, redirect from `/montar` when at the cap). Pro is unlimited via `ehPro(profile)`.
    - **Surfacing**: a "Simulados — Sua universidade" card on the `/questoes` hub, and an onboarding notice ("Você desbloqueou os Simulados…") added to `instituicao-callout.tsx` when the university is recognized. Not in the 5-tab `NAV_ITEMS` (locked to the mobile bar), reached via the hub — same stance as `/questoes/favoritos` etc.
    - Distinct from **Modo Aprovação**'s admin-only `simulados` table (different table `simulados_aluno`, different feature, student-facing — don't conflate).

**Not built** (never asked for): none remaining from the original legacy surface — `/disciplinas` was the last one. Still open for a future session: the Ranking page's own visual upgrade (numeric rank-change arrows, podium tweaks — note the percentile "Comparativo"/"Recorde" cards *were* built, but on the dashboard's Semana tab, not the Ranking page).

Full narrative/decisions history: check this session's memory (`questly_nextjs_rewrite` and related notes) if using Claude Code's memory system — it has the *why* behind each decision (e.g. the dashboard trail was deliberately redesigned away from a Duolingo-style path into "BossSiegeMeter").

18. **Passe de lançamento: landing de campanha (UFF/Física), chrome de erro e metadados** (2026-09-06, asked for explicitly — "prepara a plataforma para ser lançada, o foco é vender para o pessoal da UFF pois eles terão prova de física nesse mês"). Três frentes:
    - **Landing (`/`) virou Server Component** que busca contagens REAIS do banco (`lib/landing/stats.ts` → `carregarStatsBanco`, `export const revalidate = 3600`) e passa pra `LandingView` como prop. Usa `createAdminClient()` **de propósito**: a landing é pública e a policy de `questions` libera leitura só pra `authenticated`, então a chave anônima traria zero; é leitura agregada, sem dado de aluno, e num `try/catch` que cai num piso conservador (`FALLBACK`) se a env não existir — a página nunca quebra por causa disso. `arredondarPraBaixo` sempre arredonda pra BAIXO: o número exibido jamais infla o acervo. **O recorte editorial da campanha fica isolado em `lib/landing/campanha.ts`** (`CAMPANHA.ativa`, instituição, matérias em foco, texto da janela) — com `ativa: false` a fita do topo, a seção dedicada, o selo do hero, o painel do `/login` e a 1ª pergunta do FAQ somem juntos, sem tocar em JSX. Novos componentes: `landing/campanha-uff.tsx` (`FitaCampanha`/`SeloCampanhaHero`/`SecaoCampanha` — esta última lista a cobertura real da ementa de Física I/II, tópico a tópico com contagem), `landing/simulados-showcase.tsx` e `landing/faq.tsx`.
    - **Verdade no comparativo de planos.** `BENEFICIOS_PRO` anunciava "disciplinas ilimitadas", "grade semanal automática", "repetição espaçada (BKT)" e "prática livre ilimitada" como exclusivos do Pro — **nenhum dos quatro tem gate no código** (o plano grátis já os tem). Substituído por `RECURSOS_FREE`/`RECURSOS_PRO` em `lib/plano/plano.ts` (fonte única lida pela landing e pela `/pro`) listando só o que é de fato gated: simulados ilimitados, projeção pro dia D, autópsia do erro, estatísticas avançadas e selo Pro. O comentário no arquivo mapeia cada item ao arquivo que implementa o gate — **implemente o gate antes de voltar a anunciar qualquer coisa fora dessa lista**.
    - **Funil da campanha.** Bug real corrigido em `lib/cursos/instituicao.ts`: o casamento de acrônimo só funcionava num sentido (aluno digita "UFF", banco tem o nome por extenso). Como o banco guarda **siglas**, quem digitasse "Universidade Federal Fluminense" não casava nada — sem simulados, sem selo. `siglaDe` trata um valor de palavra única como a própria sigla, `nucleoInstituicao` descarta rótulo de edição (`"UFF (1º sem.)"` → `uff`) e a substring passou a exigir fronteira de palavra (sem falso positivo com UFRJ/USP). Novo `nomeExibicaoInstituicao` (rótulo mais curto do grupo) substitui o "mais longo" que exibia "UFF (1º sem.)" como nome da universidade, e `agruparInstituicoes` alimenta os **chips de sugestão** no passo de universidade do onboarding e o estado vazio de `/simulados` (`listarInstituicoesComQuestoes` filtra lixo do campo: "Questly" e códigos de disciplina tipo "MAT-111").
    - **Chrome que não existia**: `app/not-found.tsx`, `app/error.tsx`, `app/global-error.tsx`, `app/loading.tsx` e `app/(protected)/loading.tsx` (+ primitivas `ui/skeleton.tsx` e `ui/empty-state.tsx`). Antes, erro = overlay cru do Next e navegação lenta = tela congelada. **`proxy.ts` ganhou `ARQUIVOS_PUBLICOS`** (`/robots.txt`, `/sitemap.xml`, `/opengraph-image`, `/icon*`, `/apple-icon*`, `/manifest*`): esses arquivos são pedidos SEM sessão pelo crawler do Google e pelo bot do WhatsApp e estavam levando **307 pro `/login`** — o site ficaria fora do índice e o link colado no grupo da turma apareceria sem título nem imagem. Marca: `components/logo.tsx` agora desenha um `LogoMark` SVG (anel de progresso aberto) no lugar da letra "Q" em caixa, com `app/icon.svg` e `app/opengraph-image.tsx` (card 1200×630 gerado com `next/og`) na mesma linguagem; o `favicon.ico` padrão do Next foi apagado. `app/layout.tsx` ganhou `metadataBase`, template de título `"%s · Questly"` (todos os `page.tsx` perderam o prefixo `"Questly — "`; a landing usa `title.absolute` porque já carrega a marca), OpenGraph/Twitter, `themeColor` e `viewport`.

19. **Brasões da plataforma (fim dos emojis) + campanha atemporal** (2026-09-06, asked for explicitly — "não quero falar especificamente que a prova está chegando" + "substitua todos os emojis por brasões e coisas específicas da plataforma"). Duas frentes:
    - **`components/insignias/insignia.tsx`** é o sistema único de símbolos: medalha hexagonal (aro metálico + campo escuro + bisel + brilho de topo) com 18 motivos vetoriais (`NomeInsignia`) em 7 materiais (`TomInsignia` — bronze→diamante espelham `liga-visual.ts`, mais `esmeralda` da marca e `rubi` do calor/streak). Substituiu o emoji cru em conquistas (`lib/ranking/badges.ts` trocou `icone: string` por `insignia`+`tom`; `hero-data.ts` seguiu junto), nível do onboarding, tela de "confira seu email", comemoração do Foco (`Celebracao` ganhou `insignia`, o título perdeu o emoji e a escala virou de material: chama → raio → cometa → troféu) e estados vazios. Regras: **ids de gradiente são determinísticos por tom** (`qi-aro-ouro`) e NÃO usam `useId` — com `useId` cada raiz React reinicia o contador, os ids colidiam e todo brasão herdava o metal do primeiro desenhado na página (bug real, pego na conferência visual); sem hook o componente também roda em Server e Client Component. A moldura só lê acima de ~30px: abaixo disso passe `nua` (linha do ranking, chips do card público, toast do Foco). `apagada` é o estado "ainda não conquistado".
    - **`QUESTLY_LIGA_INFO` perdeu o campo `icone`** (era emoji de medalha e não era renderizado em lugar nenhum) junto com o encanamento morto `ligaIcone`/`ribbon[].icone`; o rosto de uma liga é o escudo alado `LigaEmblema`, que agora também substitui o ícone genérico `Medal` do lucide na fita "Explorar ligas" (`ranking-view.tsx`) e no tile de liga da `stat-strip`.
    - **Campanha sem prazo.** `lib/landing/campanha.ts` trocou `janela` ("prova de Física deste mês") por `selo` ("Acervo de Física da UFF") e a fita/headline/description/OG perderam "chegando"/"é esse mês". **Regra registrada no cabeçalho do arquivo: nada no recorte editorial pode citar prazo** — o dono não quer reescrever a landing quando o calendário virar, e o card de OG é reencaminhado meses depois. O foco em UFF/Física (e as contagens reais do banco) fica; só a urgência temporal saiu.

20. **Repasse de consolidação: home + Simulados** (2026-09-10, asked for explicitly — "na entrada do HOME tem muita informação e ele fica até com dificuldade de encontrar as informações principais… a aba simulados poderia ficar muito melhor, mais visual, onde o aluno pode escolher melhor as disciplinas e regras"). Três frentes, **sem mudança de schema**:

    - **Home: de onze blocos pra quatro andares.** A aba "Hoje" tinha `MissoesCard`, `QuestoesFeitasCard`, `ConquistasRecentesCard`, `MissionBanner`, `ContinuarCard`, `BossSiegeMeter`, `GpsAprovacaoCard` + quatro cartões de rail, e **três números apareciam duas vezes na mesma tela** (XP de hoje dentro do próprio `MissoesCard`, conquistas no hero *e* no cartão, ranking no hero *e* implicitamente no comparativo), com quatro CTAs verdes competindo na primeira dobra. Agora: (1) **`foco-hoje-card.tsx`** — o protagonista, funde continuar/missões/banner num cartão só com **uma** ação primária escolhida por urgência (missão começada → continuar; pendente → começar; tudo feito → estado de conclusão sem CTA falso), anel de progresso **do dia** (não de uma missão), três números do dia e a lista das demais missões quando há mais de uma; o accent vem de `corDaDisciplina()` da missão-alvo, como já fazia o `ContinuarCard`; (2) **`metricas-strip.tsx`** — quatro células (aproveitamento vitalício com a barra acerto/erro embutida, questões resolvidas, ranking geral clicável, percentil da semana) absorvendo `QuestoesFeitasCard` + `ComparativoCard` + o tile de ranking do hero; (3) **hero enxuto** — `hero-banner.tsx` perdeu os tiles de Ranking e Conquistas e a prop `hero`, virando a linha de IDENTIDADE + progressão (nível com barra de XP, streak); (4) Boss + GPS na coluna principal e o rail reduzido a Simulados/Tarefas/Calendário. **`ConquistasRecentesCard` mudou de aba** — vai no fim da `SemanaView` (que ganhou a prop `hero`), porque é retrospecto, não decisão do dia. **Deletados** (órfãos após o repasse): `mission-banner.tsx`, `missoes-card.tsx`, `questoes-feitas-card.tsx`, `comparativo-card.tsx`. `ContinuarCard` continua vivo — `/questoes/listas` ainda usa. `xp-diario-card.tsx`/`metas-card.tsx` já eram código morto antes deste repasse e foram deixados como estavam.

    - **Montador de simulado: regras de verdade.** `/simulados/montar` era três seções empilhadas (tópicos, duração, quantidade) e um sorteio único. Virou **decisão à esquerda / consequência à direita** (`lg:grid-cols-[minmax(0,1fr)_336px]`, painel "Sua prova" sticky). Novidades de produto: **presets** (Prova completa / Revisão rápida / Meus pontos fracos / Anos recentes) que ajustam ritmo e estratégia num clique; disciplinas como **cartões com checkbox tri-estado** (nenhum/parcial/todos) mostrando **o aproveitamento do aluno na matéria** e, ao abrir, por tópico (ponto colorido, verde ≥70%); e **regras novas**: dificuldade (multi), anos (multi), estratégia de sorteio e ordem de aplicação. O painel mostra ritmo em **min/questão** com faixa de conforto, composição do recorte por dificuldade (rampa de um tom só — escala ordenada, **não** semáforo) e os anos cobertos.
      - **A prévia é exata e local, não estimada**: `carregarOpcoesSimulado` passou a devolver, por tópico, uma `grade` (`dificuldade → ano → nº de questões`) mais o aproveitamento do aluno (`aluno_topico_progresso`, com `MIN_AMOSTRA_APROVEITAMENTO = 3`; sem amostra é `null`, nunca 0%). Com esse índice o montador conta o recorte no cliente sem uma ida ao servidor por clique. Os helpers puros (`ChaveDificuldade`, `GradeTopico`, `gradeVazia`, `normalizarChaveDificuldade`, `contarNaGrade`) moram em **`constantes.ts`, não em `simulados-data.ts`** — o montador é `"use client"` e importar do módulo de dados arrastaria o `SupabaseClient` pro bundle.
      - **`montarSimuladoAction` revalida tudo** (o cliente segue sem autoridade): filtra por dificuldade/ano no servidor e sorteia por `estrategia` — `fracos` reparte as vagas entre os tópicos proporcionalmente a (1 − aproveitamento) pelo **maior resto (Hamilton)**, o mesmo método do `rotina-engine`, com o peso multiplicado pela disponibilidade (um tópico com 2 questões não ganha 15 vagas por ser o mais fraco); `recentes` desce dos anos mais novos embaralhando dentro de cada ano; `aleatoria` é o embaralho original. `ordem: "crescente"` ordena a prova fácil→difícil. `SIMULADO_DURACOES_MIN` foi de `[60,120,180]` pra `[30,45,60,90,120,180,240]`.

    - **Hub `/simulados`: "como você está indo".** A página passou a carregar `carregarDesempenhoGeral` (a MESMA análise de `/simulados/desempenho` — uma leitura, duas profundidades) e ganhou o painel com as métricas que um aluno olha toda vez: **`graficos/anel-nota.tsx`** (medidor de arco 260°, escala fixa 0..10 sempre desenhada por inteiro, cor por status) com o delta da última prova contra a própria média, mais nota média, melhor nota, evolução 1º→último, aproveitamento, tempo por prova e **questões em branco**; abaixo, evolução, "por disciplina" e "onde o estudo rende mais". Os cortes finos (consistência, tendência, mapa de calor, ritmo) continuam em `/desempenho`. O atalho da home (`simulados-card.tsx`) ganhou média/melhor/aproveitamento e uma **tendência honesta** (última nota vs. média das anteriores — comparar só com a prova anterior transformaria um dia ruim em queda de tendência); `carregarAtalhoSimulados` calcula isso na consulta que já fazia.

    - **Gabarito do simulado: convite + leitor** (asked mid-session — "acho muito feio a maneira que o gabarito tá aparecendo solto no fim da tela"). `gabarito-simulado.tsx` despejava a folha de respostas, os filtros e uma sanfona com TODAS as questões no fim da página de resultado, sempre aberta e sem ninguém ter pedido. Agora são duas etapas: um **cartão-convite** que diz o que tem lá dentro (quantas erradas/em branco/certas) e entra direto no filtro mais útil ("Revisar as N que errei"), e um **leitor em tela cheia com UMA questão por vez** — folha de respostas virando navegador horizontal no topo, filtros que preservam a questão em foco, navegação por setas do teclado, Esc pra fechar, barra de progresso e "Concluir" no último. O componente mantém a mesma API (`perguntas`/`analise`), então `simulado-resultado.tsx` não mudou.


21. **Simulados simples: uma disciplina por prova + hub enxuto + figuras que aparecem na hora** (2026-09-10, mesmo dia do item 20, asked for explicitly — "modifiquei o sistema dos simulados mas ficou muito complicado para o usuário, o que pode gerar preguiça nele… o foco não é misturar disciplinas e sim disciplinas separadas onde ele escolhe os tópicos… tá com muita informação até no hub… demora para a imagem aparecer na questão"). **Reverte deliberadamente parte do item 20** — o montador com presets/estratégia/ordem/multi-disciplina era rico demais pro trabalho que o aluno quer fazer. Sem mudança de schema.
    - **Regra de produto nova: um simulado = UMA disciplina.** Prova de graduação é de uma disciplina; misturar matérias é coisa de vestibular. `montarSimuladoAction` **deriva a matéria dos próprios tópicos** (query em `topicos` → `materia_id`/`materias.nome`) e recusa com o erro novo `misturado` se os tópicos vierem de duas matérias — `MontarSimuladoInput` perdeu `materiaIds`/`materiaNomes` (o cliente não declara mais de que matéria a prova é, e o título sai do nome derivado). `materia_ids` gravado na linha vem dessa derivação.
    - **Montador em 2 passos** (`montador-simulado.tsx` reescrito, 1143 → ~560 linhas): passo 1 escolhe a disciplina (cards com contagem + aproveitamento), passo 2 é tópicos (checkbox, **todos já marcados** — o caminho curto é escolher a matéria e apertar Começar) + formato (chips de quantidade e de relógio). **Fora do caminho principal**, dentro de um `<details>`-like fechado ("Mais opções"): dificuldade, anos e um único switch "Focar no que eu erro mais" (que manda `estrategia: "fracos"`). **Sumiram da UI**: os 4 presets, o seletor de estratégia em 3 cards, a ordem de aplicação (fixa em `aleatoria`), o slider+input de quantidade e o painel "Sua prova" sticky com composição/anos/ritmo. `ESTRATEGIAS_SIMULADO`/`ORDENS_SIMULADO` e o sorteio por estratégia continuam **inteiros no servidor** — só a superfície encolheu. Constantes novas em `constantes.ts`: `SIMULADO_DURACOES_SUGERIDAS` (4 opções, contra as 7 que o servidor aceita) e `duracaoSugerida(qtd)` (~3min/questão, arredondado pra opção mais próxima) — o relógio se ajusta sozinho ao tamanho da prova até o aluno tocar nele, pra não serem duas decisões. `SIMULADO_DURACAO_PADRAO_MIN` saiu (órfã).
    - **Hub `/simulados` enxuto**: a página perdeu o hero grande, o painel "Como você está indo" com anel + 6 indicadores, e os três gráficos (evolução, por disciplina, onde rende mais) — tudo isso **já era a página `/simulados/desempenho` inteira**. Ficou: título + uma ação primária ("Novo simulado"), o card de prova em andamento, uma faixa com **três números** (última/média/melhor) + link pra análise completa, o histórico em linhas e o limite do plano como **uma linha de rodapé** em vez de cartão. `page.tsx` não chama mais `carregarDesempenhoGeral` (o resumo é calculado do próprio histórico) — uma consulta pesada a menos por visita. O `AnelNota`, que ficaria órfão, **mudou pra `/simulados/desempenho`** (ao lado dos indicadores).
    - **Figuras: `components/questao/figura-questao.tsx`** (`FiguraQuestao` + `usePrefetchFiguras` + `figurasDaPergunta`), usado por `questao-runner`, `simulado-runner` e o leitor do `gabarito-simulado`. A lentidão não era peso de arquivo (~20KB por figura): era **quando** o download começava. Duas causas, as duas corrigidas — (a) `loading="lazy"` numa imagem que é o conteúdo principal só atrasa: virou `eager` + `fetchPriority="high"` + `decoding="async"`; (b) a questão seguinte só monta quando o aluno chega nela, então a figura dela começava do zero — `usePrefetchFiguras` puxa as figuras das **próximas duas** questões (enunciado + alternativas) enquanto ele responde a atual. Enquanto carrega, shimmer na altura final (zero CLS, o contêiner já tinha altura fixa); `onError` esconde o bloco, como antes. A marcação "pronta" também acontece num **ref callback** (`el.complete && naturalWidth > 0`), não num `useEffect` — cobre a imagem que veio do cache antes da hidratação (o `load` nunca dispara nesse caso) sem esbarrar em `react-hooks/set-state-in-effect`.

22. **Home: faixa de perfil + trilho de visões (Global / Desempenho / Conquistas)** (2026-09-11, asked for explicitly, com prints de outra plataforma de referência — "o card de retomar para onde parou, em um tamanho ideal e não gigante e bem colorido… o vetor de questões feitas é mais grosso e de altíssima qualidade… um card acima disso tudo com as informações do usuário (ranking, nível, conquistas e dias seguidos, com um foguinho de qualidade)… ele consegue clicar e ver a carta dele aqui mesmo no home… uma espécie de menu ali na lateral esquerda onde tem desempenho"). **Substitui a estrutura do item 20** (abas Hoje/Semana + hero enxuto + `MetricasStrip`), sem mudança de schema. Guiado pela skill `ui-ux-pro-max` (domínio `chart` pro radar/donut, checklist §1–§5 pra a11y/toque/responsivo).

    - **`perfil-bar.tsx` (era `hero-banner.tsx`)** — a faixa de identidade volta a ter os QUATRO tiles do material de referência: **Nível** (com barra de XP), **Ranking** (liga + posição, clicável → `/ranking`), **Conquistas** (contador + fileira de brasões) e **Dias seguidos**. O bloco de perfil inteiro virou `<button>` que **abre a carta do aluno** (o mesmo `StudentCardModal` do ranking, via `buscarCardUsuarioAction(userId)`) sem sair da home — por isso `dashboard-view.tsx` passou a receber `userId`. O anti-padrão "número repetido entre andares" do item 20 continua valendo: ranking e conquistas aparecem AQUI e em lugar nenhum mais da aba Global.
    - **`chama-streak.tsx`** — a "chama de qualidade" pedida: SVG próprio de três camadas (fogo externo/interno/brasa) com gradientes e respiração em contratempo, `apagada` (contorno cinza) quando o streak é zero. Não é o `<Flame>` do lucide (contorno de 1,5px em 44px vira rabisco) nem emoji 🔥 (mesma regra do cabeçalho de `insignias/insignia.tsx`).
    - **`home-rail.tsx`** — trilho vertical à esquerda que troca a visão do miolo (`global` | `desempenho` | `conquistas`), com o botão **Carta** separado acima (é ação, não visão — juntá-los faria o estado "ativo" mentir). No mobile vira fita horizontal rolável acima do conteúdo. As visões "Metas" e "Mapa" do material de referência **não** foram copiadas (pedido explícito de só trazer essas).
    - **`acao-card.tsx` (era `foco-hoje-card.tsx`)** — o "continuar de onde parou" deixou de ser painel gigante e virou **faixa horizontal** de ~168px na régua de um cartão de curso: capa desenhada (gradiente da disciplina + inicial gravada) → texto → CTA à direita → barra "X% concluído" rente à base. As três prioridades (continuar / começar / tudo feito) e a cor por `corDaDisciplina()` continuam idênticas. Tudo que era estatística do dia saiu daqui.
    - **`missoes-card.tsx` e `questoes-feitas-card.tsx` (nomes reciclados, componentes novos)** — o que saiu do cartão de ação: metas do dia em linhas com alvo declarado (questões, XP, foco, missões) + anel pequeno de XP; e o anel de acertos/erros **de 26px de traço** (contra o fio de 6px de antes), com vão real entre os arcos, gradiente no traço, valor em texto no centro e a barra 100% empilhada como fallback acessível (o donut é nota C de a11y — a skill exige a alternativa).
    - **`desempenho-view.tsx` + `graficos/{radar-areas,evolucao-acerto}.tsx`** — a visão de análise, espelhando o segundo print: filtro Total/7/30/60/90 dias, quatro KPIs (taxa de acerto, volume, melhor área, ponto de atenção), **radar por matéria** (com alternância obrigatória pra barras — radar é nota B e a leitura exata mora na barra; o arco-íris do print foi recusado de propósito: hue por eixo sugere categoria onde só existe intensidade), **curva de evolução acumulada sobre barras de volume por dia** (acumulada, não a taxa do dia: com 4 questões a taxa diária oscila 25 pontos por acaso), e "tópicos que você mais errou". A `SemanaView` (do item 20) foi pra dentro desta visão e **perdeu a prop `hero`**.
    - **`conquistas-view.tsx`** — a estante inteira de brasões, acesos e apagados, cada card com o requisito escrito. `hero-data.ts` passou a devolver `distintivos` (a lista completa de `calcularDistintivos`), não só os conquistados.
    - **Dados: `lib/dashboard/desempenho-data.ts` + `desempenho-calc.ts`.** O servidor lê `question_attempts` do aluno uma vez e **agrega por (dia, tópico)** antes de serializar — mandar a lista crua viraria ~150KB no payload RSC de toda carga da home; agregado, um histórico de 1.600 questões cabe em algumas centenas de linhas. O recorte por período é aritmética pura no cliente (`recortar`), então trocar de filtro não refaz consulta. Teto de `LIMITE_TENTATIVAS` (8.000) com aviso de truncado na UI. Regra de honestidade herdada: matéria com menos de `MIN_AMOSTRA_AREA` (5) questões não entra no radar nem disputa melhor/pior área — volta `null` e a célula diz o que falta.
    - **Deletados** (órfãos): `hero-banner.tsx`, `foco-hoje-card.tsx`, `metricas-strip.tsx`, `dashboard-tabs.tsx`, `conquistas-recentes-card.tsx`, e os já-mortos `stat-strip.tsx`/`metas-card.tsx`/`xp-diario-card.tsx`.
    - **Conferência visual**: feita rasterizando a home real (rota de preview temporária + `next start` + Chrome headless) em claro, escuro e 390px antes do commit. Vale registrar duas armadilhas do ambiente: o Chrome headless aqui **força largura mínima de 500px** (um `--window-size=390` corta a página em vez de reflowá-la — use `--force-device-scale-factor=1.282` com `--window-size=500` pra obter 390 CSS px de verdade), e `--blink-settings=preferredColorScheme=1` é o que força o tema claro com `next-themes` em `defaultTheme="system"`.


23. **Home: Simulados na primeira dobra, anel enxuto, e a Agenda** (2026-09-11, pedido explícito: *"no home poderíamos diminuir o espaço ocupado pelo questões feitas, mantendo o tamanho do vetor porém diminuindo aquele container… quero que o container do simulado apareça ali também com um certo foco… a qualidade desse vetor está muito feio e com cores sem vida… coloque o calendário maior e mais colorido também com mais funções e possibilidades para os alunos agendarem sessões de estudo"*). Ajusta a visão **Global** do item 22; Desempenho e Conquistas ficam intactas. Uma migração nova: `supabase_sessoes_agenda.sql`.

    - **Nova ordem da visão Global**, em quatro faixas de prioridade decrescente: (1) `AcaoCard`; (2) **`MissoesCard` | `SimuladosCard` lado a lado e do mesmo tamanho** — as duas coisas que o aluno *pode fazer agora*: missão é o hábito, simulado é o teste. O simulado morava no rail estreito, abaixo da dobra, onde quem nunca tinha feito um sequer descobria que existia; (3) diagnóstico largo (`BossSiegeMeter` + `GpsAprovacaoCard`) com uma coluna estreita de 320px ao lado (`QuestoesFeitasCard` + `TarefasDoDiaCard`); (4) **`AgendaCard` em largura inteira**.
    - **`questoes-feitas-card.tsx` — o vetor.** O VETOR não encolheu (188px, traço de 26px, como pedido); encolheu o container: o cartão saiu da grade larga pra coluna de 320px, a legenda desceu pra baixo do anel em vez de disputar largura com ele, os dois blocos viraram uma linha de duas colunas e a frase explicativa saiu. A forma mudou de **pizza de 2 fatias** (dois arcos concorrendo) pra **medidor radial** — um arco de acerto sobre um leito de erro, com folga na cor da superfície entre os dois; é a forma que a skill de dataviz manda usar pra "uma razão contra um limite", e os números (total, %, acertos, erros) foram pra dentro do SVG e pra legenda, em texto.
    - **Paleta do anel — `.anel-paleta` em `globals.css`, não os tokens do tema.** Os `--questly-green/--questly-red` são calibrados pra TEXTO (o tema claro foi aprofundado até passar em AA) e num traço de 26px liam como cor lavada — que é a queixa de "cores sem vida". A paleta do anel é escolhida contra a superfície REAL do cartão e **validada com `scripts/validate_palette.js` da skill de dataviz** nos dois modos (banda de luminosidade, piso de croma, separação para daltonismo, contraste); os hexes e o laudo estão no comentário do bloco. A decisão que não deve ser revertida: o par é **verde × vinho**, não verde × vermelho — dois matizes de mesma luminosidade em lados opostos do eixo vermelho-verde colapsam na MESMA cor para deuteranopia (ΔE 5.0 no par vermelho-tijolo original, 14.6 no vinho).
    - **`agenda-card.tsx` (substitui o `CalendarRailCard` de `right-rail.tsx`, deletado).** Célula de dia alta o bastante pra mostrar as duas primeiras marcações **escritas** (hora + nome + ponto da disciplina) em vez de um ponto genérico; **navegação de mês** (setas + "Hoje") via `lib/agenda/actions.ts`; painel do dia com soma de minutos reservados, adiar-pra-amanhã, excluir e **arrastar-e-soltar entre dias** (`moverTarefaAction`); resumo do mês no pé (sessões / reservado / feitos, aritmética pura sobre o que já está em memória). **Duas legendas de propósito**: a CÉLULA é pintada pelo estado do dia (hoje/estudou/prova, quadrado) e o CHIP pela disciplina (ponto) — são dois sistemas de cor e juntá-los numa legenda só vira adivinhação. O chip usa fundo da SUPERFÍCIE, não tingido: a célula por baixo já pode estar verde ou laranja, e chip tingido sobre célula tingida vira lama.
    - **`lib/agenda/actions.ts`** carrega UM mês sob demanda e **não** reusa `carregarDadosDashboard`: aquilo gera missões do dia, projeta nota e calcula liga — nada disso muda por olhar setembro, e rodar o mission-engine a cada clique de seta seria caro e com efeito colateral (missão gerada). O mês corrente continua vindo pronto do servidor, então abrir a home não custa round-trip a mais.
    - **Schema: `supabase_sessoes_agenda.sql`** adiciona `tarefas.tipo` (`tarefa`|`sessao`), `.hora` e `.duracao_min` — a mesma tabela, porque as duas coisas são o mesmo registro (um item do aluno amarrado a UMA data, owner-only) e separá-las obrigaria a agenda a fazer duas queries pra desenhar um dia. Sem mudança de RLS. **Agendar não gera missão, XP nem ofensiva**: plano não é conquista, e pagar por bloco marcado abriria caminho pra forjar ranking.
    - **`tarefas-do-dia-card.tsx`** virou "Marcado para hoje": continua CRIANDO só tarefa rápida (sem horário), mas EXIBE também as sessões agendadas do dia — senão o aluno marcaria um bloco na Agenda e não o veria na lista de hoje.
    - **Deletado**: `right-rail.tsx` (o `SubjectsRailCard` que sobrava nele já era código morto).
    - **Conferência visual**: mesma receita do item 22 (rota temporária + `next start` + Chrome headless), em claro, escuro e 390px. Como `/dashboard` exige sessão e não dá pra autenticar no headless, a rota temporária renderizou os componentes alterados com dados de mentira.

24. **Card público: vagas fixas de distintivos + escolha do aluno; remoção de perfis seed** (2026-09-11, pedido explícito: "tira esses usuarios seed e diminua o tamanho dos cartoes no ranking pois quanto mais conquistas o usuario ta recebendo mais comprido fica o card dele… deixa um tamanho fixo pré-estabelecido e o usuário pode escolher quais conquistas ele quer mostrar"). Duas frentes, sem mudança de RLS:
    - **24 perfis `seed_N`** (inseridos direto em `profiles` em 2026-09-04, sem conta de auth real, só pra povoar o ranking) foram **apagados do banco** via `service_role` — não eram dados de nenhum aluno real, e não sobrava mais nenhum depois da limpeza.
    - **`profiles.distintivos_selecionados`** (`text[]`, `supabase_distintivos_selecionados.sql` — rodar por conta própria, não protegida pelo trigger de segurança) guarda os ids que o aluno escolheu mostrar no card TCG do ranking. `lib/ranking/badges.ts` ganhou `MAX_DISTINTIVOS_CARD` (5) e `distintivosParaCard` (seleção validada → resumo automático por categoria como fallback, igual ao `distintivosResumo` da linha de ranking, só com mais vagas). `student-card-modal.tsx` desenha **sempre exatamente `MAX_DISTINTIVOS_CARD` vagas** numa linha só (ícone puro, sem nome) — vaga vazia usa a moldura `apagada`, então o card nunca mais cresce com conquista nova; o contador do cabeçalho (`totalDistintivosConquistados`, novo campo em `CardUsuario`) mostra o total real, não o teto de 5. `buscarCardUsuarioAction` valida a seleção contra o que a pessoa REALMENTE conquistou (recomputado, nunca lido do array salvo sem checar) antes de montar o card de qualquer aluno.
    - **UI de escolha**: a visão "Conquistas" da home (`conquistas-view.tsx`) virou o lugar onde o aluno marca até 5 conquistados pra aparecer no card — cada card conquistado é um botão-toggle (☑ verde quando selecionado, desabilitado quando a cota de 5 está cheia e ele não é um dos escolhidos), salvando a cada toque via `salvarDistintivosCardAction` (novo em `lib/ranking/actions.ts`) num `useTransition` sem bloquear a UI. O servidor recomputa a conquista da própria pessoa (nunca confia no array que o cliente manda) e corta pra `MAX_DISTINTIVOS_CARD` antes de gravar.

25. **Calendário dedicado (`/calendario`) + Mapa de progresso no alto da home** (2026-09-15, pedido explícito: *"o card do Mapa de Progresso precisa ficar logo no início, no canto direito do hub principal, e não lá embaixo onde ninguém rola para ver… ter uma tela dedicada ao calendário mensal padrão (sem ciclos, flashcards ou redação), o usuário clica no dia para adicionar tarefas (como meta de questões puxando a disciplina) ou marcar dias de prova… design moderno e polido estilo fintech"*). **Substitui a `AgendaCard` do item 23**, que era um cartão de largura inteira no PÉ da visão Global. Migração: **`supabase_agenda_consolidado.sql`** (que substitui `supabase_agenda_metas.sql` e os outros dois scripts da agenda — ver o repasse de correção no fim deste item).
    - **A divisão que resolve as duas queixas**: a home ganhou `mapa-progresso-card.tsx` — compacto, **só leitura** (mini-mês pintado, três números, a próxima prova e um botão) no ALTO da coluna da direita; e o planejamento mudou-se pra `/calendario`, onde o mês tem a tela inteira. Cada quadradinho do card é um link pro mesmo dia lá (`/calendario?dia=YYYY-MM-DD`), então ver e marcar continuam a um clique.
    - **Nova grade da visão Global** (`dashboard-view.tsx`): `xl:grid-cols-[minmax(0,1fr)_340px]` com `col-start`/`row-start` explícitos — coluna principal (AcaoCard → MissoesCard|Simulados+anel → BossSiegeMeter+GPS) e uma `aside` grudada no topo (`xl:sticky` + `row-span-2`, que só funciona com `items-start` na grade) com o Mapa de progresso e o "Marcado para hoje". No celular não existe "canto direito": a ordem vira missão do dia → mapa → diagnóstico (via `order-*`), porque empurrar a ação do dia pra baixo do calendário seria trocar um problema por outro.
    - **`/calendario`** (`app/(protected)/calendario/page.tsx` + `components/agenda/{calendario-view,celula-dia,painel-dia}.tsx`) é um calendário mensal comum, **sem ciclos, flashcards ou redação** — quatro indicadores no topo, mês grande com células altas (as três primeiras marcações escritas, arrastar-e-soltar entre dias), e o painel do dia no rail lateral (xl) ou num **bottom sheet** (< xl, mesmo padrão do `PainelTopico` da trilha).
    - **Quatro coisas cabem num dia**, e não são variações do mesmo campo: `sessao` (hora + duração), `tarefa` (afazer solto), **`meta`** (N questões de uma disciplina — `supabase_agenda_metas.sql`) e **prova**. A prova escreve em `bosses`, a mesma tabela que a trilha, a contagem regressiva e a projeção de nota leem (`marcarProvaAction`/`desmarcarProvaAction` em `lib/agenda/actions.ts`, que conferem o dono via `subjects` porque `bosses` não tem `user_id`) — criar uma "prova de calendário" à parte deixaria duas verdades sobre a mesma prova.
    - **O progresso da meta não é armazenado**: `lib/agenda/agenda-data.ts` reconta, na leitura, quantas questões o aluno respondeu naquele dia naquela disciplina via `question_attempts.mission_id` → `missions (subject_id, data)` — `missions.data` é o que o app inteiro chama de "dia de estudo", enquanto `created_at` é timestamptz e jogaria a virada da noite pro dia seguinte em UTC. Só é calculado quando o mês tem alguma meta (quem não usa não paga as queries), e `.in()` passa por `emLotes` (teto de URL do gateway, ver `lib/supabase/paginado.ts`).
    - **`lib/agenda/agenda-data.ts` (novo)** é a leitura de um mês, compartilhada entre a página (mês corrente, renderizado no servidor, sem round-trip) e `carregarMesAgendaAction` (navegação entre meses). Continua **não** reusando `carregarDadosDashboard`: aquilo gera missão do dia, projeta nota e calcula liga — caro e com efeito colateral só pra olhar setembro.
    - **Cor da disciplina**: o calendário passou a usar `corDaDisciplina(nome)` (hash do nome), a mesma função do card de questão / retomar / missões, no lugar da paleta por POSIÇÃO que a `AgendaCard` usava — a disciplina tem uma cor só no app inteiro. O chip do dia continua neutro com um ponto colorido (chip tingido sobre célula tingida vira lama). O chip de prova usa `orange-dark`, não `orange`: no claro, branco sobre `#d97706` dá ~3,2:1 e reprova AA nos 10px da célula; sobre `#b45309` dá 5,0:1.
    - **Nada disso dá XP, gera missão ou acende a ofensiva** — regra herdada do item 23: planejar não é conquistar, e pagar por plano marcado abriria caminho pra forjar ranking.
    - **Conferência visual**: mesma receita dos itens 22/23 (rota temporária + `next start` + Chrome headless), em claro, escuro e 390px, mais um esqueleto da grade da home com as classes reais pra confirmar o Mapa no canto superior direito.

    - **Repasse de correção (2026-09-15, mesmo dia).** A tela subiu quebrada: criar sessão/tarefa/meta travava em "Salvando..." pra sempre e a seta de mês derrubava a página inteira no `app/error.tsx`. **A causa era uma linha só** — `export type { MesAgenda, ProvaDia };` no topo de `lib/agenda/actions.ts`. Num arquivo `"use server"` o Turbopack transforma **cada** export num binding de runtime, e um **re-export de tipo importado não é apagado** pelo strip de TS: o chunk compilado tenta ler uma variável que já não existe e a avaliação do MÓDULO morre com `ReferenceError: MesAgenda is not defined`. Como quem quebra é o módulo, **todas** as Server Actions daquele chunk passam a devolver 500 — inclusive `criarTarefaAction`, que mora em `lib/tarefas/actions.ts`. Nada disso aparece no `tsc --noEmit` nem no `next build`: só em runtime. **Regra**: em arquivo `"use server"`, nunca re-exporte tipos de outro módulo (`export type { X }` / `export type { X } from "..."`); tipo compartilhado mora no `<feature>-data.ts`, que os clientes já importam. Uma *declaração* local (`export type Y = {...}`) continua sendo apagada normalmente e é o que o resto do `lib/*/actions.ts` faz.
    - **Por que custou caro achar**: os dois sintomas apontavam pro lugar errado. Uma Server Action que rejeita dentro de `startTransition` sobe pro error boundary (daí a página inteira quebrar na seta), e no `salvar()` do painel o `setSalvando(false)` estava no fim de cada caminho feliz — uma rejeição pulava todos e deixava o botão fiado. Sem mensagem, o palpite natural virou "faltou migração", e o banco foi re-rodado várias vezes sem efeito (ele estava certo o tempo todo). **Blindagem aplicada pra isso não se repetir**: `salvar()` tem `try/catch/finally` (o reset do `salvando` não pode morar num caminho só); `carregarMes()` engole a falha e mostra um aviso na régua do calendário em vez de deixar subir pro boundary; e `alternar`/`remover`/`mover`/`desmarcarProva` desfazem o update otimista quando o servidor recusa, em vez de deixar a tela mentindo até o próximo F5.
    - **Migração: `supabase_agenda_consolidado.sql` (novo) substitui os três scripts da agenda.** Rodar `supabase_agenda_metas.sql` antes de `supabase_sessoes_agenda.sql` reverte o arquivo inteiro (o SQL Editor roda o script colado como UMA transação), `meta_questoes` nunca é criada e **todo** insert em `tarefas` falha — `criarTarefaAction` sempre manda essa coluna, mesmo pra tarefa comum. E "consertar a ordem" re-rodando `sessoes_agenda` depois era pior: ele recriava `tarefas_tipo_check` com só `('tarefa','sessao')` e proibia `'meta'` de novo. O consolidado declara o estado final (colunas, CHECKs, RLS, índices) sem depender de ordem, e termina com duas consultas de conferência com o resultado esperado escrito ao lado. `supabase_sessoes_agenda.sql` também passou a incluir `'meta'` no CHECK, pra ser inofensivo em qualquer ordem.
    - **Seletor de disciplina**: o `<select>` nativo virou `components/ui/select.tsx` (primitivo Select do **Base UI**, a mesma lib de Button/Input/Tabs). O campo fechado dava pra estilizar, mas a LISTA aberta é desenhada pelo sistema operacional — caixa branca quadrada, fonte do sistema, sem raio nem sombra, cega pro tema escuro — e lia como um pedaço de outro programa no meio do painel. O componente mantém teclado/leitor de tela do nativo e aceita `cor` por opção, usada pro ponto de `corDaDisciplina`, porque a lista de escolha é justamente onde o código de cor precisa aparecer. **Há outros `<select>` nativos no app** (`/importar`, `/admin/*`, `/aprovacao/*`, `tarefas-do-dia-card`); ficaram como estão — migre sob demanda, não em varredura.
    - **Formulário do painel repassado junto**: cabeçalho com o ícone do modo que foi aberto, um `Campo` (rótulo fixo em caps pequeno) por linha no lugar de controles soltos, chips de duração/quantidade e de nome-de-prova viraram trilho afundado (`SegmentedControl` — antes liam como quatro botões independentes, não como "escolha um destes"), nota de rodapé em bloco próprio e o erro num alerta com borda, não um parágrafo vermelho solto.

26. **Simulados sem cerca: fonte de questões escolhida pelo aluno + a aba no celular** (2026-09-16, pedido explícito: *"a aba de simulados nem sequer aparece na versão para celular… não deve ficar limitada apenas a alunos da UFF… o usuário poderá misturar questões da UFF com questões autorais, usar apenas autorais, ou treinar com questões da UFF mesmo sendo de outra instituição… a distribuição das questões precisa ser equilibrada e inteligente (evitando desproporções como dezenas de autorais e apenas uma da UFF)"*). Uma migração nova: **`supabase_simulados_fontes.sql`**.
    - **A aba no celular.** `NAV_ITEMS` (barra inferior, travada em 5 abas) não tinha Simulados: no celular a tela só era alcançável pelo hub `/questoes`, dois toques adiante, e o aluno não achava. **Simulados entrou no lugar de Ajustes**, que não perde nada — continua a um toque no avatar (`ContaMenu`, dentro de `TopNav`), visível em qualquer largura. Junto, o `TopNav` corrigiu o ponto de corte: a navegação horizontal aparecia a partir de `md` (768px) enquanto a `MobileBottomNav` só some em `lg` (1024px) — entre as duas, num iPad em pé, as **duas** barras apareciam e o header espremia logo + 6 links + cluster numa faixa estreita. Agora as duas trocam no mesmo `lg`.
    - **Regra de produto nova: a fonte é do aluno.** Até aqui a instituição saía do perfil (`profiles.universidade` → `questions.instituicao`) e era **autoritativa no servidor**; quem não estudasse numa universidade catalogada não montava simulado nenhum — via o estado vazio e ia embora. Agora `lib/simulados/fontes.ts` (puro) modela **fonte**: cada universidade do banco (agrupada pelo núcleo do nome, então "UFF", "UFF (1º sem.)" e "UFF (2º sem.)" são UMA) mais a fonte sintética **autoral** (`instituicao is null`, e também o rótulo de autoria própria "Questly" — o aluno não distingue "sem origem" de "origem: a gente"). O montador ganhou o cartão **"De onde saem as questões"**, multi-seleção, acima dos tópicos porque muda todas as contagens abaixo. O que **continua autoritativo** é a EXISTÊNCIA da fonte: `montarSimuladoAction` casa os ids pedidos contra `vw_instituicoes` e só então os converte em valores crus de `questions.instituicao` — o cliente manda um id de um conjunto fechado, nunca um filtro de banco.
    - **Misturar reparte em partes IGUAIS, não proporcionais** (`repartirEntreFontes`): parte igual pra cada fonte, limitada pelo estoque de cada uma, com a sobra voltando pra quem ainda tem questão. Proporcional seria exatamente a desproporção que o pedido manda evitar — o banco tem ~2.500 autorais contra algumas dezenas de questões de uma prova específica, então a proporção devolveria "29 autorais e 1 da UFF". Com parte igual: 20 questões de duas fontes fartas = 10 + 10; se a pequena só tem 4, = 4 + 16. O sorteio virou **duas camadas** — quantas por fonte (aqui) e quais dentro da fonte (o `sortear` de sempre, com a estratégia `aleatoria`/`fracos`/`recentes` intacta). Com uma fonte só, a cota é a prova inteira e o resultado é idêntico ao de antes. O montador mostra a **divisão prevista** ("10 UFF + 10 autorais") chamando a MESMA função do servidor: a prévia não pode ser uma estimativa paralela que depois não bate com a prova entregue.
    - **Padrão de fonte ao entrar numa disciplina** (`fontePadrao`): a da universidade do aluno quando ela sozinha dá uma prova de pé (>= `SIMULADO_QTD_MIN`) — prova real da própria faculdade é o conteúdo mais valioso e era o comportamento anterior; senão, **todas**, pra quem não tem provas catalogadas (a maioria) montar no primeiro toque sem precisar descobrir que existe um seletor.
    - **O que deixou de bloquear**: `/simulados/montar` não redireciona mais por universidade não reconhecida (só por limite do plano ou banco vazio); no hub, o estado vazio de página inteira virou uma **nota** discreta que explica o que tem no banco e oferece corrigir a universidade, sem esconder o "Novo simulado"; `MontarSimuladoResultado` perdeu o erro `sem_instituicao`. `reconhecida` sobrou só pra escolher texto e o padrão de fonte.
    - **Migração `supabase_simulados_fontes.sql`**: redefine `vw_questoes_por_instituicao` **sem** o `where q.instituicao is not null` com que ela nasceu (`supabase_escala_lancamento.sql`), pra que a linha autoral exista na grade — é a única view com a quebra por dificuldade/ano de que a prévia ao vivo depende. `vw_instituicoes` continua sem a linha nula de propósito (ela responde "que universidades existem", e autoral não é universidade). Quem filtra por universidade não sente: NULL nunca casa num `.in()`. **Sem a migração o deploy não quebra** — as provas de outras universidades (o desbloqueio principal) funcionam igual; só a fonte autoral não aparece até rodar o script. `lib/landing/stats.ts` ganhou a guarda de null que a mudança de tipo exigiu.
    - **Duas leituras no pool, não uma por fonte**: as instituições cabem num `in` só e o autoral é um `is null` à parte, porque NULL nunca casa num `in` e juntar os dois num `.or()` exigiria escapar vírgula e parêntese dos rótulos do banco.
    - **O hub ficou mais barato de abrir**: `/simulados` chamava `carregarOpcoesSimulado` (a árvore inteira de matérias) pra ler dois booleanos. Virou `carregarContextoInstituicao`, 8 linhas de `vw_instituicoes`. E `carregarOpcoesSimulado`, que agora varre o banco inteiro, parou de mandar centenas de uuids num `.in()` pro `aluno_topico_progresso` (URL de dezenas de KB, ver `lib/supabase/paginado.ts`): lê as linhas do próprio aluno — que são poucas — e recorta em memória.
27. **Provas antigas oficiais, quantidade livre, prioridade pro inédito e ranking por prova** (2026-09-16, mesmo dia do item 26, pedido explícito: *"disponibilizar as provas antigas reais da UFF que já temos cadastradas para que o aluno possa fazê-las exatamente no formato original… permitir que o usuário digite o número exato de questões (como avaliações de 4 ou 5)… priorizar automaticamente questões que o usuário ainda não resolveu… após a conclusão de simulados de provas antigas, gerar um ranking comparativo dos participantes, permitindo que o usuário escolha se deseja ou não exibir seu resultado publicamente"*). Uma migração nova: **`supabase_provas_oficiais.sql`** — **rodar antes de subir o código** (o app lê `simulados_aluno.prova_codigo` e as views novas). Os dois primeiros itens do mesmo pedido (a aba no celular e o fim da cerca por universidade) são o item 26.
    - **Prova oficial ≠ simulado sorteado**, e essa é a decisão que organiza o resto. O montador responde "quero uma prova com estas características"; a prova antiga responde "quero fazer a prova que caiu". Por isso `/simulados/provas` não tem recorte, dificuldade, quantidade nem estratégia: a única escolha é QUAL prova, e `iniciarProvaOficialAction` monta a prova inteira na ordem original. É também o único lugar do app que **não** filtra `questions.desafio` — aprofundamento fica fora de todo sorteio automático porque lá o app escolhe o que o aluno vê; aqui ele não escolhe nada, e esconder uma questão porque alguém a marcou depois entregaria uma prova mutilada com cara de completa.
    - **O que faltava no schema**: `questions` guardava `instituicao` ("UFF (1º sem.)") e `ano`, mas nada que dissesse de qual prova daquele semestre a questão saiu — P1, P2 e P3 de 2023.1 eram a mesma coisa pro banco. A migração adiciona `prova_codigo` (identidade, `fis2-uff-2023.1-p1`) e `prova_ordem` (posição na prova), e faz o backfill por lista explícita de ids, gerada casando os JSONs de origem (`listas_questoes/gerado/fisica[12]_uff_*`) com o banco pelo enunciado normalizado. **31 provas, 461 questões** (22 de Física II, 9 de Física I). `lerCodigoProva` (`lib/simulados/provas-oficiais.ts`, puro) é a validação de entrada do código, e a EXISTÊNCIA é casada contra `vw_provas_oficiais` antes de virar filtro — mesma disciplina do item 26 com as fontes.
    - **Só entram provas completas** (todas as questões do arquivo de origem no banco, e >= 10 questões). Transcrição parcial continua no sorteio normal como questão avulsa, mas não pode ser oferecida como "a prova original": quem faz uma P2 de 2018 esperando a prova inteira e recebe 3 questões foi enganado. É o mesmo padrão de honestidade de `chance-aprovacao` (devolver null em vez de um número inventado).
    - **O relógio é derivado e a tela diz isso**: o acervo tem as questões da prova, não quanto tempo o professor deu. `duracaoProvaOficial` usa 8 min/questão arredondado pras durações que o app já oferece — exatamente o ritmo de uma prova de 15 questões em 2h, que é o formato da UFF de onde vem a maior parte do acervo.
    - **Quantidade livre no montador**: `SIMULADO_QTD_MIN` caiu de 5 pra **1** e o campo "Questões" ganhou um input numérico ao lado dos atalhos (10/15/20/30). O piso antigo respondia "monte pelo menos 5" a quem estava justamente tentando reproduzir a prova de 4 questões dele. O texto digitado mora num estado separado do número (`qtdTexto`) porque digitar "15" passa por "1", e reagir a cada tecla encolheria a prova no meio da digitação; o clamp pro teto do recorte acontece no blur e em `qtdEfetiva`, nunca a cada tecla.
    - **Prioridade pro inédito** (`sortear` em `lib/simulados/actions.ts`): o `sortear` de antes virou `sortearPuro` e ganhou uma camada por cima que separa o pool em inéditas/já vistas, sorteia primeiro entre as inéditas e só completa com as vistas se faltar. É **prioridade, não filtro** — quem já resolveu o tópico inteiro continua montando a prova em vez de receber "sem questões" — e roda DENTRO de cada fonte, então a divisão em partes iguais do item 26 e a estratégia (`fracos`/`recentes`) continuam valendo. `questoesJaVistas` lê o histórico DO ALUNO (`question_attempts` paginado + os `question_ids` dos 100 últimos simulados, que não geram attempt), e não os attempts das questões do pool: o histórico de um aluno é pequeno e limitado pela própria atividade, enquanto o pool pode ter mil ids e viraria cinco idas ao banco pelo teto de tamanho de URL. Falhar ali é não-fatal: perde-se a preferência, não a prova.
    - **Ranking por prova, opt-in** (`components/simulados/ranking-prova.tsx`, na tela de resultado): prova oficial é a única comparação justa entre alunos — mesmas questões, mesma ordem, mesmo tempo —, então simulado sorteado **não tem** esta seção. `simulados_aluno` ganhou `publico` (default **false**: aparecer é opt-in) e `prova_codigo`. Empate na nota **divide a mesma colocação** (`posicoesDoRanking`, mesma regra de competition ranking da liga semanal); o tempo só ordena a lista. Uma pessoa entra uma vez, com a melhor nota — refazer três vezes não pode ocupar o pódio inteiro.
    - **A leitura do ranking NÃO abre `simulados_aluno`**: uma política RLS a mais deixaria qualquer autenticado ler a linha inteira das provas públicas, inclusive `respostas` (o que o colega marcou em cada questão). Em vez disso, `vw_ranking_provas_oficiais` é uma view **SECURITY DEFINER** (o padrão do Postgres) que devolve só as colunas do placar e só das linhas públicas e concluídas — RLS não sabe filtrar coluna, view sabe.
    - **Superfícies**: `/simulados/provas` (nova, `PageHeader` + filtro por disciplina, disciplina do aluno primeiro), um cartão "Provas antigas" no hub acima do resumo (conteúdo que o aluno não descobre sozinho, ao contrário do montador) e um selo "prova real" no histórico. Uma prova antiga **consome** o simulado grátis da semana do plano free, como qualquer outra — o gate virou o helper `dentroDoLimiteSemanal`, chamado pelos dois caminhos. `carregarHistorico` pede `prova_codigo` com fallback pro SELECT sem a coluna (mesmo padrão do `tempos`): sem a migração, some o selo, não o histórico.
    - **Nada mudou na natureza do simulado**: continua self-contained (não paga XP/liga/streak, não move o motor de maestria, não escreve `question_attempts`/`missions`), continua uma disciplina por prova, e o limite semanal do plano free segue autoritativo no servidor.

28. **Histórico do dia no painel do calendário** (2026-09-16, pedido explícito: *"ao clicar em uma data específica no calendário, o painel lateral exibe um resumo completo de tudo o que foi realizado naquele dia — simulados com resultado e botão de revisão, status das missões diárias, listas aleatórias — logo abaixo dos botões de ação rápida"*). **Sem migração** — tudo é recontado na leitura.
    - **As duas metades do painel são coisas diferentes e por isso não se misturam.** Em cima, o que o aluno PLANEJOU (sessão/tarefa/meta/prova, editável, com checkbox e excluir); embaixo, `HistoricoDoDia` — o que ACONTECEU, leitura pura. Um checkbox no histórico seria dizer que dá pra marcar "estudei" à mão, que é exatamente o caminho de forjar ranking que o item 25 fecha.
    - **`MesAgenda` ganhou `historico: Record<string, HistoricoDia>`** (missões, simulados, questões/acertos/XP do dia). `contarQuestoesDoMes` virou **`montarAtividade`**, que devolve o progresso das metas E o histórico da MESMA varredura de `question_attempts`: o "5/8 nessa missão" e o "12 de 30 questões da meta" são recortes da mesma leitura, e separá-los puxaria as tentativas do mês duas vezes.
    - **O dia de uma missão é `missions.data`** (o "dia de estudo" do app inteiro), como já era. **O simulado é a exceção**: ele é self-contained e não gera missão nem tentativa, então só resta o timestamp — `diaLocal` usa `concluido_em ?? iniciado_em ?? criado_em` com o fuso do processo (pinado em `America/Sao_Paulo` no `next.config.ts`). O FILTRO da query abre um dia pra cada lado da janela, porque a comparação acontece no fuso do banco (UTC) e quem termina uma prova às 22h de 30/09 já é 01/10 lá — quem decide o dia é o JS, não o `where`.
    - **A leitura deixou de ser condicional.** `questoesPorDia` só era calculado quando o mês tinha meta; agora o histórico precisa dela sempre, o que custa duas queries a mais por mês visto (missões + tentativas, na mesma onda do resto) e **apaga a gambiarra** que existia por causa disso: `calendario-view.tsx` relia o mês inteiro depois de criar uma meta, só pra barra não abrir em 0.
    - **Simulado é o único item que vira link** (`/simulados/[id]`, rótulo "Revisar"): é ali que mora o gabarito, e rever o erro é a razão de ele aparecer no histórico. Missão em andamento leva pro `/questao` com a origem marcada (`hrefQuestao(id, "/calendario")`; `rotuloOrigem` ganhou o caso "Voltar pro calendário"); missão fechada **não** é link — não existe tela de revisão de missão, e um link que reabre as questões respondidas leria como "refazer".
    - Missão em andamento mostra progresso (`4/10 questões`), não acerto — o acerto só entra quando ela fecha. Dia futuro não renderiza o bloco (não há histórico do que não aconteceu); dia passado sem atividade mostra o estado vazio honesto, em vez de sumir e deixar o buraco que motivou o pedido.
    - **Conferência visual**: mesma receita dos itens 22/23/25 (rota temporária + `next build`/`next start` + Chrome headless) em claro, escuro e 390px, com três cenas (dia cheio, dia vazio, dia futuro).

29. **Home no celular: faixa de perfil recolhível e trilho como controle segmentado** (2026-09-16, pedido explícito: *"o bloco superior no smartphone está excessivamente grande… empurra o conteúdo principal ('Seu dia' / 'Prática livre') para baixo… transformar o card do perfil/estatísticas em um formato mais compacto ou semi-recolhido… reorganizar e redimensionar os botões de navegação secundária (Carta, Global/Desempenho/Conquistas) para que fiquem limpos e esteticamente profissionais (padrão fintech)"*). Ajusta só a largura de celular do item 22; **o desktop não muda em pixel nenhum**, e não há migração nem mudança de dados.
    - **`perfil-bar.tsx` nasce RECOLHIDA no celular.** A grade 2×2 de tiles (~220px) virou uma **tira de quatro colunas de ~54px** com os mesmos quatro números (nível, ranking, conquistas, dias), separadas por fio, com um fio de XP rente à base — o único progresso que sumiria ao recolher. A tira INTEIRA é o botão de expandir (alvo de toque largo, sem chevron solto pra caçar), e expandida ela dá lugar aos tiles completos + um "Mostrar menos". O emblema da liga caiu de 78 pra 58px abaixo de `sm`, **renderizado como uma segunda instância `sm:hidden`** e não por `transform: scale` — `scale` não encolhe a caixa de layout, e era o emblema que espremia o nome em 375px. Medido no headless a 390px: a faixa foi de ~400px pra ~185px de altura, e "Seu dia" + o cartão de ação passaram a caber na primeira dobra.
    - **A preferência é uma loja externa lida por `useSyncExternalStore`**, não `useState` + `useEffect`: ler `localStorage` no render inicial faria servidor e cliente discordarem do HTML, e escrever estado dentro de um efeito bate na regra `react-hooks/set-state-in-effect` do compilador do React 19 (o lint recusa o commit). `useSyncExternalStore` hidrata com o retrato do servidor (recolhido) e re-renderiza sozinho com o valor real.
    - **`home-rail.tsx` no celular virou controle segmentado** de largura inteira e 40px — três segmentos iguais, ícone e rótulo na mesma linha, dentro de um trilho afundado. Antes era uma fita **rolável** de três caixas de 68px mais o botão Carta: ~70px de altura e, ainda assim, transbordando a largura em 375px (rolagem horizontal numa barra de três itens é o próprio sintoma de que ela não cabia). O **botão Carta sai do trilho no celular** — a faixa de perfil logo acima já é um botão com "Ver minha carta" escrito, e repetir a mesma ação a 40px de distância só gastava a largura que os três segmentos precisam. No desktop, coluna vertical com Carta, tudo igual.
    - **Bug real achado na conferência: `chama-streak.tsx` usava ids de gradiente FIXOS** (`chama-externa`/`-interna`/`-brasa`). Id de SVG é global no documento: com a tira compacta e o tile na mesma página, `url(#chama-externa)` passou a resolver na primeira chama do DOM — a da tira, escondida por `display:none` no desktop — e **a chama do tile sumiu**. O componente ganhou `idGradiente` (default `"chama"`, então nada mais muda) e a tira passa `"chama-tira"`. Determinístico por instância em vez de `useId` pela mesma razão do cabeçalho de `insignias/insignia.tsx`: `useId` reinicia o contador por raiz React e volta a colidir.
    - **Conferência visual**: mesma receita dos itens 22/23/25/28 (rota temporária + Chrome headless), em claro e escuro a 390px (recolhido e expandido) e no desktop a 1440px pra confirmar que a faixa completa e o trilho vertical não mudaram.


30. **O plano vira execução: "Estudo" absorve sessão+meta, e o bloco do dia começa com um clique** (2026-09-16, pedido explícito: *"há sobreposição de conceitos entre sessões, metas e tarefas diárias que precisa ser avaliada e limpa para evitar poluição visual e redundância… o card de retomada só aparece se o aluno já iniciou uma lista; se ele apenas planejou a sessão no calendário, o sistema não sabe qual tópico ele vai abrir… assim que ele clica para iniciar e faz a primeira questão, o card dinâmico de progresso assume o lugar, herdando o contexto/nome que o aluno definiu para aquela sessão"*). Uma migração nova: **`supabase_sessao_lista.sql`** — **rodar antes de subir o código** (`carregarTarefasIntervalo` passa a pedir `tarefas.mission_id`, e a coluna faltando esvazia o calendário e as marcações do dia na home).

    - **A redundância era real e tinha nome: sessão × meta.** Das quatro coisas que cabiam num dia (item 25), duas respondiam à MESMA pergunta — "vou estudar tal matéria hoje" — e só divergiam na unidade: minutos numa, questões na outra. O aluno escolhia entre dois botões antes de escrever a mesma frase, e um dia normal terminava com duas marcações ("Cálculo 19h" + "30 questões de Cálculo") que eram um compromisso só. Viraram **um item, "Estudo"**, com disciplina obrigatória e **três campos opcionais de tamanho** (duração, alvo de questões, horário) que convivem. `tarefa` (afazer solto, sem disciplina) e `prova` (que escreve em `bosses`) continuam separadas porque são de fato outra coisa. O painel do dia foi de quatro botões iguais pra **um primário de largura inteira + dois secundários**.
    - **Custo de schema da fusão: zero.** `tarefas_duracao_check` e `tarefas_meta_check` (`supabase_agenda_consolidado.sql`) sempre foram independentes de `tipo` — uma linha `tipo='sessao'` já podia carregar `meta_questoes`, era o app que zerava o campo. As linhas antigas gravadas como `tipo='meta'` **não são convertidas**: continuam válidas e são desenhadas igual. Quem pergunta "isto é estudo?" usa **`ehEstudo(t)`** (`lib/tarefas/tarefas-data.ts`), nunca `tipo === "sessao"`; quem pergunta "tem alvo?" lê `metaQuestoes`, nunca o `tipo`. Os dois lugares que ainda liam por tipo (o chip da célula e o resumo do mês) passaram a ler pelo campo.
    - **`tarefas.mission_id` é o elo que faltava entre planejar e estudar** — e é só isso: o bloco aponta pra lista de questões que nasceu dele (`on delete set null`, porque apagar a lista não pode apagar o compromisso). Antes, marcar "Estudar Cálculo II na quarta" e de fato estudar eram dois mundos sem ligação: na quarta o aluno tinha que ir ao Banco de Questões e remontar na mão a decisão que já tinha tomado. Com o elo, três coisas passam a ser possíveis e nenhuma delas precisa de contador gravado.
    - **O bloco diz O QUE estudar, não só qual matéria** (`tarefas.topico_ids`, mesma migração — repasse do mesmo dia, depois de ver a primeira lista sair). A v1 do "Começar" sorteava a disciplina INTEIRA e a lista era ruim de um jeito previsível: quem marcou o bloco porque a aula de ontem foi regra da cadeia recebia limite, continuidade e integral no meio. Uma lista que mistura tudo não é lista de estudo, é sorteio — e escolher o assunto **é** o ato de planejar, que é a premissa da plataforma desde o fim do motor. Então o formulário do bloco ganhou um seletor de assuntos (`SeletorAssuntos` em `painel-dia.tsx`: multi-seleção com a contagem de questões por tópico, "Todos"/"Limpar", carregado por `buscarTopicosPraticaAction` **no evento de trocar de disciplina, nunca num efeito** — a regra `react-hooks/set-state-in-effect` do React 19 recusaria, e o efeito ainda dispararia com o formulário fechado), e **salvar exige pelo menos um assunto**. "Todos" existe e não é o padrão: estudar a disciplina inteira é decisão legítima, só não pode ser o que acontece quando ninguém decidiu nada. Os tópicos são cacheados por matéria no cliente (trocar de disciplina e voltar é comum enquanto se planeja). Bloco **sem** assunto só existe nas linhas criadas antes da migração; pra elas o fallback é o comportamento antigo, porque recusar seria quebrar um compromisso marcado de boa-fé.
    - **(1) "Começar" no próprio plano.** `iniciarEstudoPlanejadoAction` (`lib/tarefas/actions.ts`) sorteia os assuntos do bloco — **intersectados** com os tópicos da matéria, porque o array vem do cliente e vira filtro de `.in()` (id de outra disciplina montaria uma lista que não tem nada a ver com o bloco) —, cria a lista e grava o elo. O tamanho sai, nesta ordem, do **alvo que o aluno digitou**, do que **cabe na duração marcada** (média de `tempo_medio_seg` ponderada por volume, teto de 30 pra conta automática) ou de um padrão curto de 10. A action é **idempotente por construção**: bloco que já tem `mission_id` devolve a MESMA lista em vez de sortear outra — sem isso, um duplo clique ou duas abas deixariam uma lista órfã levando o progresso junto. O botão aparece no cartão de ação da home e no item do painel do dia, **só em HOJE**: a lista nasce com `missions.data = hoje`, então "começar terça o bloco de sexta" gravaria o estudo no dia errado e furaria a contagem do próprio calendário.
    - **(2) O nome do aluno sobrevive à execução.** `carregarRetomar` lê `tarefas.nome` pelo elo (na mesma onda das tentativas, sem round-trip serial) e devolve `planoNome`. A faixa de ação continua titulada **"Revisar derivadas"** enquanto a lista corre, com a disciplina descendo pra legenda — o planejamento abstrato não é substituído pelo progresso, ele VIRA o progresso. É exatamente o que o pedido chamou de "herdar o contexto".
    - **(3) Fechar a lista risca o bloco.** `finalizarMissaoAction` → `riscarBlocoPlanejado` marca `concluida` no item ligado. **Repare na direção:** agendar continua sem pagar XP, sem acender a ofensiva e sem gerar missão sozinho (regra do item 23, intacta) — é o registro real que risca o plano, nunca o contrário. O caminho inverso seria a porta pra forjar ranking marcando compromissos que nunca aconteceram.
    - **`AcaoCard` tem quatro estados**: bloco de hoje ainda não começado → lista começada → resumo honesto do dia → caminho pro Banco. O estado do bloco **não desenha barra de progresso**: um plano não começado não tem "quanto falta", e um 0% ali seria cobrar algo que ninguém prometeu. `planoHoje` é calculado no cliente a partir de `dados.tarefasHoje` (já ordenado pelo relógio), sem query nova: é o primeiro `ehEstudo` não concluído.
    - **Quem ganha a faixa é decidido por TEMPERATURA, não por tipo** (repasse do mesmo dia, depois de ver a tela rodando). A primeira versão dava a dobra a qualquer lista aberta, e o resultado foi o oposto do pedido: uma lista de dias atrás parada em 6% ocupava a faixa inteira enquanto "Revisar derivadas, 20:30", marcado pra hoje, era uma linha de checkbox no trilho da direita. A regra: (a) lista aberta **hoje** ganha — é o que o aluno está fazendo agora; (b) **bloco de hoje ganha de lista fria** (de outro dia) — o plano é o assunto do dia, a lista de semana passada não é; (c) quando a lista É o bloco (elo `mission_id`), não há disputa. Daí `RetomarInfo.data` existir: é `missions.data`, a régua que separa quente de frio.
    - **Quem perde vira pílula, nos dois sentidos.** Rente à base da faixa, translúcida sobre a capa, claramente subordinada ao CTA branco: link ("Continuar Cálculo II · 6 de 17 · 6%") quando a lista perdeu, botão ("Começar Revisar derivadas") quando o plano perdeu. Perder a dobra é uma coisa; perder o caminho de volta pro trabalho já começado seria trocar um problema pelo outro — que é o que esta faixa existe pra evitar.
    - **Sem segundo CTA.** `tarefas-do-dia-card.tsx` (a coluna da direita) exibe os blocos do dia mas **não** ganhou "Começar": o bloco da vez já é o protagonista da faixa no topo da mesma tela, e dois botões idênticos a duas colunas de distância seriam a duplicata que este repasse foi desfazer.
    - **`lib/questly/criar-lista.ts` (novo)**: o insert de `missions` avulsa e a estimativa de tempo saíram de `lib/disciplinas/actions.ts` pra um módulo compartilhado (sem `"use server"` — é chamado POR actions, não é pra virar endpoint). Existem agora dois caminhos que criam a MESMA coisa (o Banco de Questões e o bloco do calendário) e a regra de sorteio, XP e tempo previsto não pode divergir entre eles — foi justamente o tempo previsto que já tinha divergido uma vez entre a prévia e a missão gravada.


31. **Largura: o fim da faixa central estreita no desktop** (2026-09-16, pedido explícito: *"toda a plataforma no desktop está excessivamente centralizada e comprimida horizontalmente, deixando grandes espaços vazios nas laterais e dando uma sensação de interface pequena… o layout deve ser expandido para respirar melhor e ocupar confortavelmente a largura horizontal total da tela do computador, mantendo a estrutura limpa e profissional (fintech)… o comportamento no celular pode permanecer como está"*). **Sem migração e sem mudança de dados** — é layout puro. **No celular nada muda**: a calha continua nos mesmos 16px.

    - **O problema tinha uma causa mecânica:** cada tela escolhia o próprio número mágico de `max-w-[…]` e centralizava (760, 820, 880, 900, 1000, 1040, 1080, 1128, 1280, 1340, 1400 — onze larguras diferentes espalhadas por ~40 arquivos). Num monitor 1080p ou maior sobravam faixas vazias enormes, e a tela parecia pequena e apertada **ao mesmo tempo**: pouco espaço por dentro, tela sobrando por fora.
    - **Três cascas em `globals.css`, escolhidas pelo TIPO de conteúdo, não por página:** `.casca` (telas densas — home, calendário, banco, trilha, listas, importador, admin, aprovação: ocupa a tela até `--casca-max`, hoje 1760px), `.casca-media` (listas e grades de cartões — ranking, simulados, anotações/favoritas, planos, configurações: 1400px) e `.casca-leitura` (texto corrido e formulário de coluna única — questão, prova em andamento, gabarito: 1180px). **Uma largura só não resolveria**: enunciado de questão a 1760px vira linha de 200 caracteres, que é pior do que a margem que o pedido mandou matar; e o teto existe pro ultrawide, onde uma linha de tabela de 2400px obriga o olho a atravessar a mesa pra ligar o nome ao número.
    - **A calha mora na casca, não na marcação.** `--casca-calha: clamp(1rem, 0.35rem + 2vw, 3.25rem)` cresce com a tela (16px no celular → ~35px num notebook → 52px num 1080p+). Quem usa uma casca **não** repete `px-4 sm:px-6 lg:px-8`; as classes antigas foram removidas desses contêineres justamente pra não disputar com ela. `TopNav` e `FocoBar` também viraram `.casca`, então o header alinha com o conteúdo nas telas densas.
    - **Alargar a casca não bastava: o conteúdo tinha que virar conteúdo, não margem.** Onde a tela era uma coluna só de linhas curtas, ela ganhou colunas — histórico de simulados e catálogo de provas antigas (2 colunas a partir de `lg`), anotações/favoritas (os grupos por disciplina em 2 colunas quando há mais de um), disciplinas em `/questoes/listas` (os cartões são `aspect-square`: sem `xl:grid-cols-6 2xl:grid-cols-7` cada um viraria um bloco de 300px de altura), tópicos de uma disciplina (`2xl:grid-cols-5`). **Configurações** virou duas colunas a partir de `xl` (conta + ritmo à esquerda, disciplinas à direita — a única lista que cresce sem fim). O **hub `/questoes`** ganhou um trilho de 360px com "Minha coleção", que antes ficava embaixo, fora da dobra, enquanto os dois pôsteres viravam painéis de quase 900px. Os trilhos que já existiam (home, calendário, trilha, prática, aprovação) crescem um degrau em `2xl` (340/330/352 → 400/420) pra não ficarem fiapos ao lado de uma coluna principal de 1300px.
    - **Na tela de questão, a figura subiu pro lado do enunciado** (`xl:grid-cols-[minmax(0,1fr)_minmax(0,440px)]`, só quando existe `imagem_url`). É o uso natural da largura que a casca abriu e resolve um incômodo real de física/cálculo: antes era rolar pra ver a imagem e rolar de volta pra reler o texto. Sem figura, coluna única como sempre. **O runner não virou duas colunas** (enunciado × alternativas): isso é redesenho do fluxo de prova, não ajuste de largura, e deixaria as alternativas mais estreitas do que já eram.
    - **A landing subiu de `max-w-6xl` pra `max-w-7xl`** (1152 → 1280). Bem menos agressivo que o app de propósito: página de marketing com coluna centralizada é padrão do gênero, e o hero é grade de duas colunas calibrada em cima dessa medida.
    - **Conferência visual:** rota de preview temporária (`/previewlargura`, apagada depois, com o prefixo liberado no `proxy.ts` também revertido) + `next start` + Chrome headless, em 1920, 1366 e 390px, claro e escuro. Vale repetir as duas armadilhas já registradas no item 22: pasta começando com `_` é *private folder* do App Router e **não vira rota** (404), e pra 390 CSS px de verdade use `--window-size=500 --force-device-scale-factor=1.282`.

## Motor de aprovação (`lib/questly/motor-aprovacao.ts`)

> **Estado desde 2026-09-16:** só a metade de ESCRITA/LEITURA continua em uso. `questlyEvoluirEstadoTopico` segue rodando a cada resposta (BKT + estabilidade), e `questlyRetencaoEfetiva` segue iluminando a trilha ("memória caindo"). A metade de **projeção** (`questlyForcaNaProva`, `questlyProjetarProva`) **não é mais chamada por nenhuma tela**: ela previa a nota no dia da prova, e a prova deixou de ser entrada de qualquer cálculo. As funções ficam no disco porque o resto do módulo depende delas por vizinhança — não porque alguma tela as leia.

A predictive/adaptive study engine layered on the existing mission machinery — a deliberate reversal of the "derive-on-read" approach in the legacy `js/supabase-client.js` (and its port in `shared.ts`, still used by trilha/chance-aprovacao display surfaces). Backed by `supabase_motor_maestria.sql` (two persisted columns on `aluno_topico_progresso`: `maestria`, `estabilidade`). All functions are pure (no Supabase) and `questly`-prefixed; the module has **three sides**:

- **Escrita (state evolution)** — `questlyEvoluirEstadoTopico` runs inside `registrarRespostaAction` ([lib/questao/actions.ts](src/lib/questao/actions.ts)) on every answer. `questlyAtualizarMaestria` is **Bayesian Knowledge Tracing** (`QUESTLY_BKT_SLIP`/`GUESS`/`TRANSICAO`): a slip doesn't tank a topic and a lucky guess doesn't inflate it — unlike raw `taxa_acerto`. `questlyAtualizarEstabilidade` grows memory half-life **additively, weighted by (1 − retention-at-the-moment)**: this is deliberate — the action fires once *per question*, and since the first question of a topic today stamps `ultima_revisao=now`, later questions in the same mission see R≈1 and add ~0. So the spacing bonus rewards *returning* to a topic on another day, not grinding one sitting. `ultima_revisao` is read **before** being overwritten in the upsert, or retention-at-the-moment would always be 1. A wrong answer cuts stability. `taxa_acerto`/`num_questoes_respondidas` are still maintained alongside (UI, `questlyEhMestre`, chance-aprovacao).
- **Leitura (mission scoring)** — `questlyEstadoEfetivo`/`questlyRetencaoEfetiva` return persisted state, or seed from `taxa_acerto` with the **same shrinkage formula as the SQL backfill** when the columns are null (cold-start ≡ migrated ≡ never-touched, no discontinuity). `mission-engine.ts` scores topic weakness by `1 − maestria` (was `1 − taxa_acerto`) and urgency by the persisted-stability retention (was `questlyRetencaoTopico`, which re-derived S from `taxa_acerto` every load and lost the temporal history).
- **Projeção (the predictive part)** — `questlyForcaNaProva` = `maestria × e^(−Δt_até_prova/S)`: it forecasts a topic's strength **on exam day**, not today. `questlyProjetarProva` aggregates that over a boss's `cai_na_prova` topics (excluding `pulado`, like the chance-aprovacao denominator) into a `notaProjetada` (0–100) + `emRisco` list (projected force < `QUESTLY_FORCA_RISCO`, 0.5). Surfaced on the dashboard boss card (`dashboard-data.ts` → `BossSiegeMeter`'s "🔮 Projeção pro dia da prova"). This is what flags "you'll arrive weak at a topic you already studied" — a signal neither coverage (`preparo_percentual`) nor the chance heuristic captures, because only the projection looks forward in time. `mission-engine.ts` also front-loads `riscoProva` topics' questions (a topic already touched whose projection to the nearest boss falls below the risk floor), distinct from `revisaoUrgente` (which looks only at today's retention).

**Calibration**: every tunable lives as an exported constant at the top of `motor-aprovacao.ts` (BKT `pS/pG/pT`, `QUESTLY_ESTABILIDADE_INICIAL`, `QUESTLY_GANHO_ESTAB_POR_REVISAO`, `QUESTLY_PENALIDADE_ESTAB_ERRO`, `QUESTLY_FORCA_RISCO`). Current values are reasoned defaults, **not** fit to data — they're placeholders to re-estimate once the question bank and attempt history are large enough (BKT params are classically fit per-skill via EM; here they're global). Documented as a transparent heuristic, same honesty stance as chance-aprovacao — don't present `notaProjetada` as a validated prediction.

## Rede neural de P(acerto) (`lib/ml/`)

> **Estado desde 2026-09-16:** órfã. O treino em `/admin/ml` continua funcionando (e `questions.tentativas_total`/`acertos_total` continuam sendo mantidos por `registrarRespostaAction`), mas a INFERÊNCIA não tem mais consumidor: `projetarProvaComRede` só era chamada pela projeção da nota, que saiu junto com o motor de missões. Mantido no disco como ativo de pesquisa — **não é código vivo**. Se for religar, religue por dentro de uma tela que exista.

A small MLP (12 features → 16 → 8 → 1, ~350 params, **pure TypeScript — no ML dependency**) that learns to predict P(the student answers a question correctly) from the real `question_attempts` history, layered ON TOP of the motor de aprovação, never replacing it blindly. Backed by `supabase_rede_neural.sql` (`ml_modelos` + per-question counters). Design rules that must not be silently relaxed:

- **Baseline-gated honesty**: the net competes against what the BKT motor already predicts for free (`probAcertoBaseline` in `features.ts` = `m·R` through the slip/guess channel). `treinarEAvaliar` uses a **temporal 80/20 split** (validate on the future, never shuffled) and only marks a round `venceu_baseline`/`ativo` if val log-loss beats the baseline by `MARGEM_LOG_LOSS` with ≥ `MIN_EXEMPLOS_PARA_ATIVAR` examples. No active model ⇒ `projetarProvaComRede` **is literally** `questlyProjetarProva` — zero behavior change.
- **No-leakage replay** (`dataset.ts`): training features are the student's state *at the moment of each attempt*, reconstructed by replaying all attempts chronologically with the SAME production functions (`questlyEvoluirEstadoTopico`, cold-start seeds included); per-question/per-student accuracy features only count strictly-earlier attempts.
- **Feature contract** (`features.ts`): `NOMES_FEATURES` order is frozen per `VERSAO_FEATURES`; a stored model with a different version is ignored by `carregarModeloAtivo`. Unavailable-at-inference fields use documented neutral defaults (the topic-level exam projection marginalizes over question difficulty).
- **Where it runs**: training is admin-only (`/admin/ml` → `treinarRedeAction` → `treinarESalvar` with the service_role client — attempts are owner-only RLS; page sets `maxDuration=60`). Inference runs wherever the projection was already computed (`dashboard-data.ts`, `trilha-data.ts`) via `carregarModeloAtivo` + `projetarProvaComRede`; the net's probability is mapped back to the motor's "força" scale by inverting slip/guess so `QUESTLY_FORCA_RISCO` and the UI stay valid either way.
- **Verification**: `scripts/rede-sintetica.ts` (`npx tsx scripts/rede-sintetica.ts`) checks the whole pipeline on synthetic worlds — (A) signal beyond BKT ⇒ net must win, (B) world generated by the BKT process itself ⇒ gate must NOT activate, (C) tiny data ⇒ volume gate refuses. A plain coin-flip world is deliberately NOT used for (B): there the baseline is badly calibrated and the net legitimately wins by predicting 0.5.
- `registrarRespostaAction` also increments `questions.tentativas_total`/`acertos_total` (service_role write, same call as the `tempo_medio_seg` recalibration, with a fallback so a missing migration never breaks answering).

## GPS da Aprovação — REMOVIDO (2026-09-16)

O "GPS da Aprovação" (a rota Δnota/min que dizia onde investir os próximos minutos pra nota projetada subir mais rápido) **não existe mais**, por pedido do dono. Foram apagados `lib/questly/rota-aprovacao.ts`, `lib/gps/actions.ts`, `components/dashboard/gps-aprovacao-card.tsx` e `scripts/rota-sintetica.ts`.

Isso é uma decisão de produto, não uma dívida técnica a pagar depois: a plataforma parou de dizer ao aluno o que estudar. Se alguém for tentado a ressuscitar a ideia, leia antes a seção "Fim do motor de missões" no fim deste arquivo — o motivo de ter saído não foi a matemática estar errada.

## Questão de desafio / aprofundamento (`questions.desafio`, `supabase_questao_desafio.sql`)

Um segundo eixo de classificação da questão, **ortogonal à dificuldade**: `facil|medio|dificil` diz *quanto custa*, `desafio` diz *se cai na prova ou se é conteúdo além dela*. Nasceu do banco de Química Geral, povoado com um lote de compêndio (estilo Brown — regras de Slater, de Broglie do nêutron, densidade de probabilidade radial, Born-Haber, tabela ICE, Nernst) que o dono, que cursou a disciplina, avaliou como "longe demais": a banca da UFF quer saber se o aluno entendeu o FENÔMENO. Apagar jogaria fora conteúdo correto, então a saída foi marcar e ser honesto com o aluno. Regras: (1) **nenhum sorteio automático** enxerga questão de desafio — `lib/trilha/actions.ts` (prática de um tópico pela trilha), `lib/questao/actions.ts` (desafio de recuperação) e `lib/simulados/actions.ts` + `simulados-data.ts` (sorteio e contagem do montador) filtram `desafio = false`; (2) o **único** caminho até elas é o opt-in "Incluir questões de desafio" no Banco de Questões (`components/disciplinas/filtros-pratica.tsx`), que viaja dentro do mesmo array de dificuldades como o valor sentinela `"desafio"` e é separado no servidor por `separarFiltroDificuldade` (`lib/disciplinas/filtros.ts`) — o chip "Todas" zera só os NÍVEIS e preserva o opt-in; (3) quando a questão aparece, ela vem **rotulada**: selo roxo "Desafio · aprofundamento" + uma linha explicando que errar ali não significa despreparo (`questao-runner.tsx`, e o mesmo selo no `preview-card.tsx`, que serve Favoritos/Anotações e a fila do importador). XP é o normal — aprofundamento não é punição nem bônus. Autoria: o JSON do importador aceita `"desafio": true` (`lib/importar/logic.ts` e `scripts/importar-supabase.mjs`), e `/admin/questoes` tem a checkbox pra marcar/desmarcar caso a caso. O backfill inicial são 128 questões de Química (as `dificil` dos lotes de compêndio); as 46 transcrições de prova da UFF e as 61 autorais conceituais ficam no fluxo normal.

## Architecture at a glance

```
src/
  app/
    page.tsx                 style-guide/demo page (public, "/")
    login/page.tsx            public
    onboarding/page.tsx        protected but NOT inside (protected) group — no sidebar chrome
    (protected)/layout.tsx    fetches user+profile, renders Sidebar, wraps:
      dashboard/page.tsx
      questao/page.tsx
      configuracoes/page.tsx
      importar/page.tsx
      ranking/page.tsx
      trilha/page.tsx
      disciplinas/page.tsx
      calendario/page.tsx
  components/
    <feature>/*.tsx           one folder per feature, mostly "use client"
    questao/math-text.tsx     KaTeX renderer, reused by importar's preview too
    ui/*.tsx                  shadcn primitives
  lib/
    supabase/{client,server,middleware}.ts   SSR client setup
    questly/*.ts              motores/helpers compartilhados (liga, motor-aprovacao,
                               chance-aprovacao, contagem-questoes, dashboard-data, shared) —
                               recebem o SupabaseClient por parâmetro, nunca um global de módulo.
                               mission-engine/rotina-engine/plano-do-dia/rota-aprovacao viviam
                               aqui e foram APAGADOS em 2026-09-16 (ver "Fim do motor de missões")
    <feature>/actions.ts       "use server" Server Actions, one file per feature, all DB writes live here
  proxy.ts                    Next 16 renamed middleware.ts → proxy.ts; exported fn must be named `proxy`
```

**Pattern**: every feature (auth, onboarding, configuracoes, questao, importar) has its own `lib/<feature>/actions.ts` with `"use server"` functions — client components never call Supabase directly, they call these actions. Server Components (`page.tsx` files) do the initial data fetch directly via `lib/supabase/server.ts`'s `createClient()`.

**Design tokens**: Tailwind v4 CSS-first config in `src/app/globals.css` — gamification palette as `--color-questly-*` (green/blue/orange/red/gold/purple, each with `-light`/`-dark` variants, dark-mode-aware). **Tema claro (repasse 2026-09, "fintech premium"): a tela nunca é branca, o cartão é** — `--background` é um cinza-azulado (`oklch(0.967 0.005 250)` ≈ `#F2F4F7`) e `--card` é branco puro, então o card se separa por luminância + hairline + sombra em vez de flutuar num fundo quase-branco (o que antes deixava a tela ofuscante e sem hierarquia). Duas consequências que **não devem ser desfeitas sem remedir contraste**: (a) a escala de elevação `--elev-xs…xl` (sombra tingida de `rgb(16 24 40)` no claro, preta no escuro) é exposta como `--shadow-*` no `@theme`, ou seja **todo `shadow-sm`/`md`/`lg`/`xl` do app já é a escala do design system e responde ao tema** — não redefinir sombras inline; (b) a marca no claro foi **aprofundada pra passar em WCAG AA sobre branco** (`--questly-green` `#0e9f6e` → `#0a855c`: os ~70 CTAs `bg-questly-green text-white` davam 3.39:1, agora 4.64:1; ouro e os pastéis `-light` foram remedidos junto). O tema escuro tem sua própria paleta e não mudou. Utilitários de superfície: `.surface` (hairline + `--elev-sm`) e `.surface-interativa` (sobe pra `--elev-md` no hover). Fonts: Fredoka (`font-heading`), Nunito (`font-sans`), JetBrains Mono (`font-mono`), loaded via `next/font` in `app/layout.tsx`.

## Running it

```bash
cd web
npm run dev       # Turbopack, usually :3000 (falls back to :3001 if occupied)
npx tsc --noEmit  # typecheck
npm run lint      # eslint — includes React 19 compiler rules (react-hooks/purity, react-hooks/refs, react-hooks/set-state-in-effect)
```

`.env.local` already has the real Supabase URL + publishable anon key (same project as the legacy app, no schema changes). Not committed; `.env.example` is the template.

**Environment quirk on this machine**: Node/npm/git were installed after the shell process started, so a fresh terminal may not find them on PATH. If `node`/`npm`/`git` aren't found, patch PATH before other commands:
```powershell
$env:Path += ";C:\Program Files\nodejs;C:\Program Files\Git\cmd;$env:APPDATA\npm"
```
Restarting VS Code usually fixes it permanently.

## Segurança & pagamento do Pro (Mercado Pago) — pré-publicação

A pass de revisão de segurança + a troca da cobrança manual (Pix) por gateway,
feita antes de publicar no Vercel. Ver `web/PUBLICAR.md` (guia de deploy) e a
migração `supabase_seguranca_hardening.sql` (documentada no root `CLAUDE.md`).

- **Furo fechado (crítico):** `profiles` tem UPDATE dono-only, e o estado do
  plano (e a economia de XP/liga) mora lá — então qualquer aluno logado podia,
  com a chave anon (pública), rodar `update profiles set plano='pro'` (ou inflar
  `xp_total`) direto do console. Fix: **trigger `questly_proteger_colunas_profile`**
  bloqueia mudança nas colunas de plano/XP/liga/streak a menos que seja
  `service_role` (servidor) ou o e-mail admin. Isso exige rotear as escritas
  legítimas dessas colunas por um **cliente service_role** (`lib/supabase/admin.ts`,
  `createAdminClient()` — server-only, bypassa RLS). Callers: `finalizarMissaoAction`
  (XP/streak via admin), `questlyGarantirSemanaLiga` (ganhou um 3º param
  `obterClienteEscrita?: () => SupabaseClient`, chamado **só** na virada de
  semana — leituras normais não constroem o admin client; os 3 callers
  server-side passam `() => createAdminClient()`), e a recalibração de
  `tempo_medio_seg` (agora via admin porque `questions` virou write-admin-only).
- **Conteúdo global write-admin-only:** INSERT/UPDATE de `questions`/`materias`/
  `topicos` restrito ao admin (nada no app cria materia/topico; o importador é
  ferramenta de admin). `/importar` virou **rota gateada por admin** (redirect).
- **assinaturas:** dono só cria `pendente` e só cancela; ativar é admin/webhook.
- **Pagamento = Mercado Pago Checkout Pro** (substitui o Pix manual — o CPF/chave
  Pix saíram do código, que iam no bundle do cliente). `lib/plano/mercadopago.ts`
  (API HTTP direta, sem SDK): `criarPreferenciaCheckout` (redireciona pro checkout
  hospedado; `external_reference` = id da assinatura) e `buscarPagamentoMP`.
  `criarAssinaturaAction` cria a preferência e devolve `checkoutUrl` quando
  `MP_ACCESS_TOKEN` está setado; **sem token, cai no fluxo manual** (registra
  pendente, admin confirma) — o app publica e funciona nos dois casos.
  **Webhook** `app/api/mercadopago/webhook/route.ts` (`runtime="nodejs"`): valida
  HMAC (`x-signature` + `MP_WEBHOOK_SECRET`) **e** re-consulta o pagamento na API
  do MP (âncora de confiança — notificação forjada não simula "approved"), depois
  chama `ativarAssinatura` (`lib/plano/ativar.ts`, lógica compartilhada com o
  admin, idempotente, via `service_role`). `proxy.ts` isenta `/api/*` do redirect
  de auth (senão o POST do MP levava 307 pro /login). Env novas em `.env.example`:
  `SUPABASE_SERVICE_ROLE_KEY`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`,
  `NEXT_PUBLIC_APP_URL`.
- **Liberação 100% automática (repasse 2026-09-15).** Antes, o único caminho até
  a ativação era o webhook — e quando ele falhava (URL não-https, segredo
  trocado, MP atrasado) o aluno ficava preso num "aguardando pagamento" e só
  saía se o admin ativasse à mão em `/admin/assinaturas`. Agora há **dois
  caminhos independentes** pra mesma `ativarAssinatura` idempotente:
  (1) o webhook, e (2) **`conferirPagamentoAction`** (`lib/plano/actions.ts`),
  que pergunta o status direto pra API do MP. Ela roda no servidor na volta do
  checkout (a `/pro` lê `?status=/payment_id=/collection_id=` e confere ANTES de
  renderizar, então o aluno já cai na tela de assinatura ativa) e depois em
  **polling** no cliente (3s nas 6 primeiras checagens, 6s depois, teto de ~4min
  — `planos-view.tsx`), com um botão "Verificar agora". Segurança: a assinatura é
  sempre lida pelo client do ALUNO com `.eq("user_id", user.id)`, então um
  `payment_id` alheio não ativa nada; e como o status vem da API autenticada do
  MP, não existe caminho pra virar Pro sem pagar.
  - **O webhook deixou de responder 401 em HMAC inválido** — loga e segue. A
    âncora de confiança é a consulta à API do MP (id inventado volta 404; id real
    e aprovado É um pagamento real), então falhar fechado ali só servia pra um
    `MP_WEBHOOK_SECRET` errado derrubar TODAS as vendas em silêncio.
  - `notification_url`/`auto_return` só são enviados com `NEXT_PUBLIC_APP_URL`
    https — em localhost o MP rejeitava a preferência inteira.
  - **`/admin/assinaturas` virou acompanhamento, não fila de aprovação**: tarja
    de diagnóstico do gateway (`diagnosticoPagamentoAction` — diz qual env falta
    e a URL do webhook a cadastrar, sem vazar segredo), botão **"Conferir no MP"**
    por pedido (`conferirAssinaturaAdminAction`, ativa só se o MP disser
    `approved`) e o "Ativar à mão" rebaixado a contingência, com confirm.
- **Identidade visual do Pro (mesmo repasse):** a coroa saiu. `components/plano/pro-ui.tsx`
  é a fonte única — `ProMark` (galão duplo ascendente em `currentColor`, lê como
  "subir de faixa", escala de 8 a 28px), `ProEmblema` (a marca em pastilha de
  metal, gradiente de id fixo `qpro-ouro` pela mesma regra das insígnias),
  `ProBadge` (small-caps espaçado sobre superfície tingida, ouro como ACENTO —
  `--questly-gold` é calibrado pra texto nos dois temas) e `ProCta` (a pílula de
  hairline dourado dos headers, no lugar do botão de gradiente saturado com anel
  branco que lia como microtransação de jogo). A `/pro` foi redesenhada na mesma
  linguagem: emblema + headline, cards com hierarquia de preço tabular, linha de
  confiança e um comparativo Grátis × Pro montado a partir de `RECURSOS_FREE`
  (fonte única compartilhada com a landing). O dourado CHEIO sobrevive só onde é
  carta comemorativa, não controle de UI: `ranking/pro-visual.tsx`.
- **"Seja Pro" pós-assinatura:** o gating já existia (`ehPro(profile)` threaded
  pra sidebar/mobile-header/semana-view etc.) — quem é Pro vê "Questly Pro" +
  selo, não o CTA de venda nem os cadeados. Se o "Seja Pro" reaparece pra um
  assinante, a causa é a migração do Pro não ter sido rodada (a query do layout
  falha e `ehPro` cai pra false).

## Link de convite — `/convite/[codigo]` (2026-09-15)

O cupom de Pro (`supabase_cupons_pro.sql`, `/admin/cupons`) já existia, mas o
único jeito de usá-lo era o aluno **digitar o código** no campo "Tenho um cupom"
da `/pro`. Pra mandar acesso pros primeiros testadores por WhatsApp isso perde
gente em cada passo. O link de convite é o cupom com uma porta na frente:

- **Rota pública** `app/convite/[codigo]` (prefixo liberado em `PREFIXOS_PUBLICOS`,
  `src/proxy.ts`) — quem clica ainda não tem conta, é o ponto todo. O código
  **não é segredo** (viaja na URL e é reencaminhável): quem limita o alcance é o
  `limite_usos` do cupom e o índice único `(cupom_id, user_id)`.
- `consultarConviteAction` (`lib/plano/actions.ts`) lê o cupom por código exato
  via `service_role` e devolve `EstadoConvite` (`valido` com dias + vagas
  restantes, ou `invalido`/`expirado`/`esgotado`/`ja_usado`). Nunca lista cupons
  — não há varredura, só busca pontual. Sem `SUPABASE_SERVICE_ROLE_KEY` degrada
  pra `invalido` em vez de estourar tela de erro (o visitante veio de um link de
  amigo; crash ali é pior que "não encontramos este convite").
- **Nada de número digitado à mão** (mesma regra da landing): dias e vagas saem
  do cupom, e os recursos vêm de `BENEFICIOS_PRO` — se um gate mudar, a tela
  muda junto. O card de OG (`convite/[codigo]/opengraph-image.tsx`) é o único
  lugar sem número **de propósito**: a imagem é gerada uma vez e reencaminhada
  meses depois; prometer "7 dias" nela seria mentir com atraso.
- **Resgate automático**: a página grava o código num cookie (`COOKIE_CONVITE`,
  30 dias, legível pelo cliente — não há segredo a proteger) assim que abre, e
  `components/plano/convite-auto-resgate.tsx`, montado no layout de `(protected)`,
  resgata na primeira tela logada. **É ali e não antes**: o resgate escreve em
  `profiles`, e antes do onboarding essa linha pode não existir — o update
  afetaria 0 linhas sem erro e o cupom seria consumido à toa (por isso
  `resgatarCupomAction` agora recusa quando não acha o profile). O cookie é
  apagado **antes** da chamada: uma tentativa por convite, e o caminho manual
  da `/pro` continua de pé como rede.
- **`/admin/cupons`**: cada cupom mostra o link pronto, "Copiar convite pronto"
  (mensagem já com os dias daquele cupom) e "Enviar no WhatsApp" (`wa.me`), mais
  o preset "Turma de teste". A base do link vem de `NEXT_PUBLIC_APP_URL` no
  servidor e de `location.origin` no browser (`useSyncExternalStore`) — sem isso,
  um deploy sem a env faria o admin copiar um endereço morto sem perceber.
- Bug corrigido de passagem: `criarCupomAdminAction` devolve a linha gravada.
  A lista inventava um `crypto.randomUUID()` pro cupom recém-criado, então
  "Desativar" batia num id inexistente — update em 0 linhas, sem erro, e a tela
  dizendo que desativou.

## Confirmação de email — Send Email Hook + Brevo (2026-09-10)

**O problema:** o serviço de email embutido do Supabase manda **2 emails/hora no
projeto inteiro** e **só entrega para endereços da equipe do projeto**. Ou seja,
com aluno de verdade se cadastrando, ninguém recebia confirmação. Isso bloqueava
a venda.

**A solução (não é trocar o SMTP):** o envio saiu do Supabase. Com o **Send Email
Hook** ligado (Dashboard → Authentication → Hooks, HTTPS), o Supabase **para de
mandar email** e chama `app/api/auth/email-hook/route.ts`, que entrega pela
**Brevo** (300 emails/dia no grátis). O teto passa a ser o do provedor e o
"Emails sent per hour" do Supabase vira configurável. Custo: R$ 0.

**Invariante que não pode ser quebrada:** o Supabase continua dono do token —
geração, expiração, uso único e `email_confirmed_at`. **Nenhum token é gerado,
guardado ou validado por código nosso**; não há tabela de códigos. Somos só o
carteiro. Se alguém for tentar "simplificar" isso escrevendo um OTP próprio numa
tabela, é regressão de segurança, não simplificação.

- `lib/email/enviar.ts` — adaptador do provedor. **Todo** o que é específico da
  Brevo mora aqui; trocar por Resend/SES = reescrever `entregarViaBrevo`. Timeout
  de 4s porque o hook tem orçamento de 5s (o Supabase repete até 3x em 429/503).
- `lib/email/casca.ts` — a **casca visual** de todo email que sai da Questly
  (documento, marca, cartão branco, botão, rodapé) + os blocos reutilizáveis
  (`blocoTitulo`, `blocoBotao`, `blocoDestaques`, `blocoLinkAlternativo`).
  Markup de 2005 **de propósito**: tabela + estilo inline + zero imagem + cores
  HEX fixas (os tokens CSS do app não existem em cliente de email, e imagem
  bloqueada num email de segurança destrói a confiança). Saiu de dentro de
  `templates-auth.ts` quando nasceu o segundo tipo de email (campanha): duas
  cópias do mesmo cabeçalho envelhecem em direções diferentes, e um email que
  não se parece com o que o aluno já recebeu da gente parece golpe.
- `lib/email/templates-auth.ts` — só o CONTEÚDO de cada tipo (`signup`,
  `recovery`, `magiclink`, `invite`, `email_change`). O switch é **total** — o
  hook intercepta TODOS os emails de auth, então um tipo sem template viraria
  email quebrado, não erro de compilação.
- `app/api/auth/email-hook/route.ts` — verifica a assinatura **Standard Webhooks**
  (`webhook-id`/`webhook-timestamp`/`webhook-signature`, HMAC sobre
  `{id}.{timestamp}.{corpo cru}`, chave = base64 **decodificado** depois do
  `whsec_`) à mão com `node:crypto`, sem a lib `standardwebhooks` — 30 linhas
  valem menos que uma dependência na porta de entrada de um endpoint público.
  Precisa do corpo **cru** (`req.text()`): reserializar quebra a assinatura.
  Falha **fechada** — se a Brevo cai, o signUp devolve erro em vez de dizer
  "confira seu email" sobre um email que nunca vai chegar.
- **O link do email aponta pra `/auth/confirm` (nossa rota), não pro
  `/auth/v1/verify` do Supabase** — `verifyOtp` server-side com `token_hash`
  funciona de qualquer navegador/aparelho, o que mata o clássico "cliquei no
  link no celular e caí deslogado".
- **UX:** `signUpAction` não mostra mais painel de "confira seu email"; ela
  **redireciona pra `/verificar-email?email=...`** (rota pública em `proxy.ts` —
  a conta existe mas ainda não tem sessão). Lá o aluno digita 6 dígitos
  (`components/auth/verificar-email-form.tsx`: colar distribui, backspace anda
  pra trás, auto-submit no 6º dígito, reenvio com espera de 60s = a janela do
  próprio Supabase). `signInAction` com `email_not_confirmed` reenvia e manda
  pra mesma tela em vez de devolver texto de erro.
- **Anti-chute:** não há throttle nosso — seria estado por instância serverless,
  ou seja, teatro. A defesa real é do Supabase (`/verify` = 30 req/5min por IP)
  + **Email OTP Expiration baixado pra 1h** no dashboard (ver `PUBLICAR.md` 4.3).
- `verificarCodigoAction` tenta `type: "signup"` e cai pra `"email"`: os dois
  consultam o mesmo token, e errar o tipo devolve "Token has expired or is
  invalid" — mensagem que faria o aluno jogar fora um código válido.

## E-mail de campanha para a base — `/admin/emails` (2026-09-15)

Disparo em massa pra quem já tem conta (o primeiro: reengajamento às vésperas do
lançamento). Usa **a mesma casca** do e-mail de código do cadastro — reconhecer o
remetente é metade da entrega. Migração: `supabase_email_campanha.sql` (raiz).

**O que é diferente de um e-mail transacional**, e por quê:

- **Lotes, não um disparo só.** A função serverless tem orçamento de segundos e a
  Brevo entrega ~300/dia no grátis. `enviarLoteCampanha` manda até `LOTE_MAX`
  (40) por chamada, 4 em paralelo; a tela repete a chamada e mostra a barra
  andar. `maxDuration = 60` na page — o padrão da Vercel cortaria no meio.
- **Duplicata custa mais que omissão.** A vaga é RESERVADA em
  `email_campanha_envios` (status `enviando`) **antes** do envio; o índice único
  `(campanha, user_id)` é o árbitro, não o filtro em JS. Função que morre no meio
  deixa a linha `enviando` e aquele aluno não entra na próxima rodada — recebeu
  de menos. O contrário (gravar depois de enviar) manda o mesmo e-mail duas vezes
  a cada timeout, e isso vira reclamação de spam.
- **Reserva do transacional.** `RESERVA_TRANSACIONAL` (60) é a fatia do saldo
  diário da Brevo que a campanha **não** pode gastar, lida via `creditosBrevo()`
  (`GET /v3/account`). Sem isso, um disparo grande consome os 300 e o aluno que
  se cadastrar à noite não recebe o código — o disparo derrubaria o cadastro em
  silêncio. O laço da tela para sozinho ao bater nessa parede.
- **Opt-out obrigatório.** `profiles.aceita_emails` + link assinado no rodapé
  (`lib/email/descadastro.ts`: HMAC-SHA256 truncado em 128 bits, chave derivada
  de `EMAIL_DESCADASTRO_SECRET` ou, na falta, da `SUPABASE_SERVICE_ROLE_KEY`).
  Chega sem sessão, então a assinatura É a autorização. Rota
  `/api/email/descadastrar` responde **GET** (clique no rodapé → descadastra →
  redirect pra `/descadastrar`, pública em `proxy.ts`) **e POST** (o one-click
  nativo do Gmail, via cabeçalhos `List-Unsubscribe`/`List-Unsubscribe-Post` —
  sem a metade POST o botão do Gmail dá erro, e um cancelamento que falha empurra
  a pessoa pro botão de spam). Isso não é só decência: spam queima a reputação do
  remetente na Brevo, **e o remetente é o mesmo que entrega a confirmação de
  cadastro** — campanha malfeita derruba o cadastro de aluno novo.
  O transacional ignora `aceita_emails` de propósito.
- **A lista não é copiada.** Destinatários saem de `auth.users` via
  `service_role` na hora do disparo. Não existe tabela de leads pra desatualizar
  nem pra vazar. Contas não confirmadas ficam **fora por padrão** (não conseguem
  entrar sem confirmar — o botão não resolve nada pra elas); há um checkbox.
- **A copy é editável na tela, não no código.** `CAMPANHA_PADRAO`
  (`lib/email/templates-campanha.ts`) é só rascunho; o que sai é o que está no
  formulário. A prévia é um `<iframe srcDoc>` com o **HTML real** que vai pra
  Brevo, e há "enviar teste" antes do disparo — erro de texto só aparece de
  verdade dentro do cliente de e-mail.
- **`auth.admin.listUsers` é a única chamada do app pra API Admin do GoTrue**
  (todo o resto de escrita privilegiada passa por PostgREST via service_role,
  caminho muito mais pisado). Falhou com uma mensagem imprestável —
  `Falha ao listar contas: {"url":"...auth/v1/admin/users?..."}` — porque o
  auth-js, quando a resposta não tem `.message`, cai no fallback
  `JSON.stringify(erro)`, e numa `Response` isso só enxerga `url`.
  `lib/supabase/resiliencia.ts` (`comRetentativa` + `descreverErro`) existe por
  causa disso: loga a forma REAL do erro em vez de só `.message` — hoje
  incluindo `status`/`code`, que o `AuthError` pendura no Error e que era
  exatamente o sinal que faltava.
- **A causa real daquela falha (achada em 2026-09-15) era DADO, não rede nem
  chave**, e vale registrar porque a leitura óbvia da mensagem manda pro lugar
  errado. Chamando o endpoint no braço: `per_page=6` → 200, `per_page=7` →
  **500 `Database error finding users`**; `filter=zzzz` → 200 com zero contas
  (query vazia não quebra), `filter=gmail` → 200 com 13, `filter=seed` → 500.
  Isto é, o GoTrue quebrava ao LER certas linhas — as 40 contas
  `seed_N@questly.test` que `supabase_seed_ranking_teste.sql` inseriu direto em
  `auth.users` sem preencher as colunas de token, que no Go são `string` e não
  aceitam NULL. Uma linha assim derruba QUALQUER listagem que passe por ela,
  enquanto login, `getUserById` e PostgREST seguem normais — por isso nada mais
  no app tinha notado. Conserto: `supabase_corrigir_auth_users_tokens.sql`
  (raiz). A mensagem de erro do `listarUsuarios` agora diz isso quando o status
  é 5xx, em vez de mandar conferir a `SUPABASE_SERVICE_ROLE_KEY` (que estava
  certa o tempo todo).
- **Endereço em TLD reservado (RFC 2606) é descartado da fila** (`NAO_ENTREGAVEL`
  em `lib/email/campanha.ts`: `.test`, `.example`, `.invalid`, `.localhost`).
  Conta de teste nunca entrega, e 40 hard bounces num disparo queimam a
  reputação do remetente que também manda a confirmação de cadastro. O lugar
  certo de não ter conta fantasma é o banco; isto é o cinto de segurança.

Arquivos: `lib/email/{campanha,templates-campanha,descadastro,actions}.ts`,
`lib/supabase/resiliencia.ts`,
`lib/admin/actions-campanha.ts` (requireAdmin próprio — módulo `"use server"` só
exporta função async, então não dá pra reusar o de `lib/admin/actions.ts`),
`components/admin/campanha-email.tsx`, `components/email/descadastro-painel.tsx`.

## Latência de navegação — a regra das "ondas" (repasse 2026-09-10)

Trocar de tela levava segundos (o caso mais visível: sair de uma questão e voltar
pra home). A causa não era render nem bundle: era **cascata de queries**. Cada
`await supabase...` num Server Component é um round-trip; enfileirados, somam.
`carregarDadosDashboard` sozinha tinha ~16 em série, e a home chegava a ~18.

**Regra ao mexer em qualquer `lib/**/​*-data.ts`:** dentro de uma função de
carga, só pode existir espera em série quando a query B *precisa do resultado*
de A. Tudo mais entra num `Promise.all`. A home hoje tem três ondas
(perfil+disciplinas → missões do dia → todo o resto), e o `page.tsx` roda as
quatro cargas (dashboard, retomar, hero, simulados) de fato em paralelo — pra
isso o perfil é lido **uma vez** na página e repassado via `profilePrefetch`,
porque o hero dependia só dele mas esperava o dashboard inteiro.

Três leituras foram **fundidas** em vez de paralelizadas, porque eram recortes
do mesmo conjunto — vale o mesmo reflexo antes de adicionar query nova:

- `missions` (ticker de dias + XP da semana) → uma query pela janela mais antiga;
- `daily_logs` (heatmap de 10 dias + calendário do mês + recorde de streak) → uma
  query só; a tabela tem uma linha por dia estudado, cabe inteira em memória;
- comparativo semanal: puxava `xp_semana` de **todos os perfis da base** pra
  contar quantos estavam na frente — virou dois `count` com `head: true`
  (O(índice)). Essa era a única que piorava conforme o app crescesse.

`questlyGerarMissoesDoDia` ganhou um 4º parâmetro `subjectsPrefetch` pelo mesmo
motivo, lê grade+missões-de-hoje em paralelo, e gera as missões das várias
disciplinas do dia concorrentemente (antes era um `for await`, pagando a cadeia
inteira por disciplina).

**Middleware:** `proxy.ts` roda em todo request — inclusive nos payloads RSC de
cada navegação interna e nos prefetch do `<Link>`. `lib/supabase/middleware.ts`
usa `auth.getClaims()`, não `getUser()`: o projeto assina o JWT com chave
assimétrica (ES256, JWKS público), então a assinatura é verificada localmente
via WebCrypto em vez de custar uma chamada ao `/auth/v1/user`. Ele continua
chamando `getSession()` por dentro, então a renovação de cookie segue igual, e
cai sozinho no `getUser()` se um dia a chave voltar a ser simétrica. **Não
trocar de volta por "getUser é o recomendado"** — o recomendado é não confiar no
cookie sem verificar, e `getClaims` verifica.

## Trocar de aba não pode parecer lento (2026-09-17)

A queixa foi "a plataforma está meio lerda ao mudar de abas". A seção acima já
tinha matado a cascata de queries — o que sobrava era **o cliente**, em duas
frentes que se somavam.

**1. O Next não guardava nada.** Toda rota protegida é dinâmica (lê a sessão), e
o padrão de `staleTimes.dynamic` é **0**: sair do Início pro Ranking e voltar
cinco segundos depois refazia o round-trip inteiro e mostrava o esqueleto de
novo. `next.config.ts` passou a declarar `experimental.staleTimes =
{ dynamic: 30, static: 180 }`. Trinta segundos é o vaivém que conta como a mesma
sessão de uso. **Isso não deixa dado velho na tela:** toda escrita do app passa
por `router.refresh()` ou `revalidatePath`, e os dois invalidam este cache — o
que ele segura é só ida-e-volta sem escrita no meio. Junto veio
`experimental.dynamicOnHover`, que faz o prefetch do hover trazer o conteúdo
dinâmico e não só o `loading.tsx`; no celular, sem hover, ele não gera pedido
nenhum a mais (lá quem já cobria era o prefetch no `touchstart` do `<Link>`).

**2. Nada acontecia entre o toque e a resposta.** A aba antiga continuava acesa,
o aluno concluía que o toque não pegou e tocava de novo — o que **cancela e
recomeça** a navegação. `components/nav-link.tsx` resolve: `NavLink` marca o
href tocado num contexto, `useAbaAtiva` devolve o ativo já considerando esse
palpite (a pílula do header desliza no clique, não na resposta) e `NavProgresso`
usa `useLinkStatus` pra desenhar um fio enquanto o payload não chega.

O palpite **nunca sobrevive à verdade**: ele é guardado junto com o caminho em
que foi feito e só vale enquanto `usePathname()` continuar sendo aquele — a
comparação falha sozinha no render quando a rota muda, sem `useEffect` (o
`react-hooks/set-state-in-effect` reprova a versão com efeito, e com razão: era
um render em cascata a cada navegação). O temporizador de 8s cobre o outro fim,
a navegação cancelada ou que falhou, em que o caminho **não** muda e a aba
ficaria acesa mentindo.

**3. O esqueleto era o da home em todas as telas.** `(protected)/loading.tsx`
desenhava a grade de duas colunas com trilho lateral — ir pro Ranking mostrava
por um instante um layout que aquela tela não tem, e a página "pulava" ao
chegar. Aquele arquivo virou `dashboard/loading.tsx` (a home merece silhueta
própria: é a rota mais cara e a mais visitada) e o do grupo passou a desenhar só
o que toda tela tem — título, linha de apoio, cartões empilhados.

## Rolagem: uma por tela, nunca dentro do cartão (2026-09-17)

Do mesmo repasse: *"no cartão está aparecendo uma opção de scroll; no celular
então tem várias, horizontal e vertical"*. Eram quatro causas distintas.

**A barra de toque estava sendo forçada a existir.** `globals.css` declarava
`scrollbar-width: thin` + `scrollbar-color` em `*`. No Chrome do Android isso
troca a barra **sobreposta** (aparece no gesto, some sozinha, não ocupa espaço)
por uma barra **clássica**, sempre desenhada e tirando largura do conteúdo — era
o filete cinza dentro dos cartões. As duas declarações agora vivem dentro de
`@media (pointer: fine)`: mouse continua com a barra fina do tema, toque volta ao
comportamento nativo. Pelo mesmo motivo, `scrollbar-gutter: stable` também ficou
só no ponteiro fino (no celular era calha morta).

**A página rolava de lado.** `body` ganhou `overflow-x: clip` (dentro de
`@media screen`, pra não cortar a folha de impressão). É `clip` e **não**
`hidden` de propósito: `hidden` transformaria o body num contêiner de rolagem e
quebraria o `position: sticky` do header e das barras de filtro. Agora o que é
largo rola dentro da própria caixa, que é onde o gesto faz sentido.

**Os trilhos internos pediam barra.** Duas utilidades novas: `.rolagem-x`
(fileira de chips, tabela larga, gráfico, fórmula em bloco — esconde a barra e
prende o gesto com `overscroll-behavior-x: contain`, pra ele parar no fim do
trilho em vez de arrastar a página atrás) e `.rolagem-limpa` (folhas, modais e
listas com teto de altura). Aplicadas em todo trilho horizontal do app e em toda
folha que rola por cima de outra coisa. **Regra:** rolagem dentro de cartão é
gesto, não controle — ninguém mira uma barra de 6px colada numa borda
arredondada.

**Dois casos eram bug, não estilo.** (a) Nos gráficos de linha/ritmo/evolução, o
balão de dica mora acima do ponto e estava **dentro** do contêiner que rola:
transbordava, e o cartão ganhava uma barra vertical fantasma. A dica saiu pra um
contêiner externo que não rola — a posição continua certa porque `useDica` mede
a partir dele. (b) A carta TCG do ranking tinha `overflow-y: auto`, e o que
transbordava não era conteúdo: são os dois borrões decorativos postos de
propósito fora da caixa (`-top-16`, `-bottom-14`) pra vazarem pelas quinas. Virou
`overflow-hidden`, que é o que sempre se quis ali; a rede de segurança pra tela
baixa passou a ser o fundo do modal, com `items-start` + `my-auto` no cartão (com
`items-center`, um cartão mais alto que a tela tem o topo cortado e
inalcançável).

## Um seletor só no app inteiro (`components/ui/select.tsx`)

Havia 20 `<select>` nativos espalhados por importador, admin, Modo Aprovação e o
card de tarefas da home. O nativo é o único controle que o CSS do app não
alcança: a **lista aberta** é desenhada pelo sistema operacional — caixa branca
quadrada, fonte do sistema, sem raio, sem sombra, sem noção do tema escuro. No
meio de uma tela da casa, lê como pedaço de outro programa.

Todos passaram a usar o `<Select>` que já existia no painel do calendário (Base
UI + pintura da casa; teclado, leitor de tela e foco visível vêm do primitivo).
O componente ganhou três coisas nesse repasse:

- `tamanho` (`sm` | `md`) — a **mesma** pintura em duas alturas. `md` (38px) é o
  campo de formulário; `sm` (34px) é a barra de filtros. Não existe "select de
  filtro" com outra borda ou outro raio. As alturas são mínimos em pixel, não
  padding: é o que faz um Select e um `<input>` na mesma linha terminarem no
  mesmo pixel, já que a altura por padding depende da entrelinha herdada (os
  `INPUT` vizinhos em admin/importar ganharam o mesmo mínimo);
- `detalhe` — segunda informação discreta no item ("Unicamp · máx. 72");
- o ponto colorido agora só aparece quando **alguma** opção tem `cor`. Antes,
  uma lista sem disciplina (dificuldade, banca, fase) ganhava uma coluna de
  círculos vazios só pra alinhar o texto.

Onde o Select substituiu um `<select>` que estava dentro de um `<label>`, o
`<label>` virou `<div>`: o Select é um `<button>`, `<button>` não é rotulável, e
um label sem controle rotulável não rotula nada — o nome acessível vem do
`aria-label` do próprio Select.

## Voltar pra onde veio (`lib/questao/navegacao.ts`)

`/questao` é alcançada por seis caminhos (home, trilha, listas de questões,
prática livre, revisão de simulado e o próprio desafio de recuperação), e o "X"
mandava todo mundo pro `/dashboard` — quem estava percorrendo uma lista perdia o
lugar a cada questão fechada.

O destino de volta viaja **na URL** (`/questao?missao=X&de=/questoes/listas/...`),
não em estado de cliente: assim sobrevive a refresh e continua deep-linkable.

- quem **abre** a missão usa `hrefQuestao(missaoId, usePathname())`;
- quem **recebe** usa `origemSegura(params.de)` — que rejeita `//host` e
  `https://…` (senão é open redirect, o parâmetro é público) e cai em
  `/dashboard`;
- o rótulo do botão vem de `rotuloOrigem(href)` ("Voltar pras listas"), porque
  confirmar o destino antes do clique é metade da correção.

Missão encadeada (o desafio de recuperação) **herda** a origem — encadear não
pode ir apagando o caminho de volta.

## Home: o painel de ação colorido

A consolidação anterior transformou o "continuar de onde parou" — que era um
painel inteiro na cor da disciplina — num card branco com um botão colorido, e a
home perdeu o ponto de fixação. A cor voltou no `AcaoCard`: o topo do cartão
é uma **superfície escura na cor da disciplina** (`corDaDisciplina().gradienteProfundo`),
com o anel do dia em vidro por cima, e o rodapé neutro segue o tema.

Duas coisas que não devem ser desfeitas sem remedir:

- o painel é escuro **nos dois temas** — é uma capa, não um card que segue o
  canvas; por isso usa hex literal, já que os tokens de marca invertem no escuro
  e quebrariam o texto branco;
- `gradienteProfundo`/`profundo` existem porque os tons claros da paleta (o
  laranja `#f0a23f`) davam ~2,1:1 com texto branco. Escurecidos por fator fixo,
  **os oito tons passam AA** (mínimo medido 5,35:1 no painel e 6,85:1 pro tom
  usado como texto sobre branco no CTA).

Os QUATRO estados da faixa (lista aberta → bloco de estudo marcado pra hoje →
resumo do dia → caminho pro Banco) estão no item 30. A cor vem da disciplina em
dois deles: a lista que se retoma e o bloco que se começa.

## Fim do motor de missões (2026-09-16) — a plataforma parou de planejar

**Mudança de rota pedida pelo dono, e a maior deste repositório até aqui.** O motor que montava a missão do dia foi removido *de vez*, junto com todo o ecossistema que dependia dele. O diagnóstico foi direto: o motor empilhava quatro disciplinas diferentes no mesmo dia (Física 1, Física 2, Cálculo 1 e Cálculo 2), o que não é um plano — é uma lista que ninguém executa. A correção anterior (1 disciplina/dia, missão editável, modo guiado × livre) tratou o sintoma; esta remove a premissa.

**A premissa nova:** quem sabe o que caiu na aula de ontem e o que a prova de sexta cobra é o aluno. A plataforma entrega ferramentas e um espelho — banco de questões, simulados, trilha e ranking — e nunca decide o dia de ninguém.

### O que foi apagado

| Arquivo | Era |
|---|---|
| `lib/questly/mission-engine.ts` | geração da missão do dia (fronteira curricular, dose de revisão, orçamento de minutos) |
| `lib/questly/rotina-engine.ts` | escalonador ponderado que distribuía disciplinas pelos dias da semana |
| `lib/questly/plano-do-dia.ts` | tradução dos sinais da missão em "por que é isso hoje" |
| `lib/questly/rota-aprovacao.ts` + `scripts/rota-sintetica.ts` | o GPS (rota Δnota/min) |
| `lib/questly/modo-estudo.ts` | `guiado` × `livre` — não há mais dois modos |
| `lib/missao/{actions,tipos}.ts` | ajustar / trocar disciplina / adiar a missão do dia |
| `components/dashboard/missoes-card.tsx` | o cartão "Seu plano de hoje" |
| `components/dashboard/missao-controles.tsx` | os controles manuais da missão |
| `components/dashboard/boss-siege-meter.tsx` | o cerco ao Boss + projeção de nota |
| `components/trilha/boss-encontro.tsx` | cadastro de prova e escopo ("o que cai?") dentro da trilha |
| `components/trilha/plano-ataque.tsx` | fila priorizada de "o que atacar primeiro" |

`components/dashboard/pratica-livre-card.tsx` virou `praticar-agora-card.tsx`: era o painel do modo livre, agora é o painel principal da home.

### `missions` continua — como LISTA, não como plano

A tabela é a unidade de trabalho de `/questao` e não foi tocada. O que mudou é que **toda missão agora é avulsa**: as listas do Banco de Questões, a prática de um tópico na trilha, o recap e o desafio de recuperação. O tipo `Mission` mudou de casa (`lib/questly/shared.ts`, onde ficava o `Boss` que saiu). Nada mais escreve em `missions` sem o aluno pedir — o efeito colateral que a home tinha (gerar uma linha por dia, por disciplina, em toda carga) acabou.

### A prova virou compromisso de agenda

`bosses` sobrevive **só como marcação de calendário**: o aluno marca "Prova de Cálculo II em 12/11" em `/calendario`, o dia pinta no mês e o Mapa de progresso mostra a contagem. Nada lê essa data pra recomendar assunto, projetar nota ou montar plano. Consequências: o onboarding parou de perguntar data de prova (e o cartão "Provas" saiu de Configurações — o calendário é a única porta), `bosses.topico_ids` (o escopo da prova, `supabase_prova_topicos.sql`) deixou de ter leitor, e `DashboardData.proximaProva` é uma leitura direta de `subjects → bosses`, sem motor no meio.

### A trilha virou panorama

`/trilha` **fica** — ela é o espelho, não o plano. O mapa 2.5D (vale, estrada, mascote, nós) continua inteiro; o que saiu foram as camadas de prova e de recomendação:

- fora: encontro com o Boss, contagem regressiva, nota projetada, selo "em risco na prova", filtro "Em risco", ritmo "paradas por semana até a prova", plano de ataque e a revisão relâmpago (que nascia dele);
- fica: cobertura, **precisão por tópico**, retenção/"memória caindo", selo Mestre, pular/recap e praticar um tópico;
- novo: `RegiaoMapa.precisaoMedia`/`questoesRespondidas` e `CaminhoDisciplina.precisaoMedia`/`questoesRespondidas` — o aproveitamento da disciplina, média **ponderada por volume** (`resumoPrecisao` em `trilha-data.ts`), exibido como chip no cabeçalho da jornada e no rodapé de cada ilha;
- o castelo do Boss no fim da estrada virou a bandeira "Fim da ementa" (a estrada ainda precisa de um ponto final);
- `ehFronteira` sobrevive com o sentido LITERAL de "você parou aqui" (1º tópico pendente da ementa). Não bloqueia nada e não alimenta motor nenhum.

**Bug corrigido junto (era o pedido nº 2 do repasse):** clicar num checkpoint no desktop travava a tela. O bottom sheet do detalhe é escondido por CSS (`xl:hidden`), mas o estado `sheetAberto` ligava em qualquer largura — e com ele o `document.body.style.overflow = "hidden"`. No desktop não aparecia sheet, não havia overlay nem botão de fechar, e a página perdia o scroll para sempre. A correção é `useTelaEstreita()` (`matchMedia("(max-width: 1279.98px)")`, o mesmo ponto do `xl`) em `caminho-jornada.tsx`: o sheet só liga onde existe, e a trava segue `sheetVisivel = sheetAberto && telaEstreita` — inclusive quando a janela é redimensionada com ele aberto. **Se mexer no breakpoint do sheet, mexa nos dois lugares.**

### A home

A coluna principal da visão Global tem uma ordem só, de cima pra baixo: (1) a faixa de ação — continuar a lista aberta, começar o bloco de estudo marcado pra hoje (item 30) ou o resumo honesto do dia; (2) as duas portas de entrada lado a lado, `PraticarAgoraCard` e `SimuladosCard`; (3) a faixa "Questões feitas". A coluna da direita (Mapa de progresso + Tarefas do dia) não mudou.

Duas correções de layout pedidas no mesmo repasse:

- **"Seu plano de hoje" estava com o CSS torto no canto** — resolvido por remoção: era o `MissoesCard`, que saiu com o motor.
- **"Questões feitas" era gigante no desktop, com um vazio enorme pra pouca informação** — o cartão virou uma **faixa de largura inteira**: anel de tamanho FIXO (132px, era 236px e crescia com a coluna) à esquerda, e o espaço que sobrou virou informação em vez de margem — três mostradores em linha (respondidas / acertos / erros), padrão fintech. O centro do anel passou a mostrar o **% de acerto**; o total já é um dos mostradores, e repetir o mesmo número duas vezes na mesma faixa era metade do "pouca informação". A paleta validada do anel (`.anel-paleta` em `globals.css`) e a barra 100% de fallback continuam iguais.

`MetasHoje` mudou de sentido: era meta (quanto FALTA hoje), virou registro (`listasConcluidas`, `questoesRespondidas`, `xpHoje` — o que JÁ foi feito). Não existe mais alvo diário; inventar um aqui seria trazer de volta, disfarçada, a cobrança que saiu.

### Configurações e onboarding

Configurações ficou com Conta, **Dias de estudo** e Disciplinas. Saíram o modo de estudo, a grade semanal por disciplina e as provas. `tempo_diario_min` sumiu da UI (era o orçamento que o motor repartia); a coluna fica no banco sem leitor. `dias_disponiveis` **fica** — é o divisor da meta semanal de XP na home, e só isso.

O wizard caiu de 11 passos pra 9, e voltou a ser uma fila reta (não há mais caminho condicional): curso → nome/@ → universidade → semestre → disciplinas → nota desejada → dias → nível → resumo.

### Plano Pro

"Projeção da sua nota pro dia da prova" **saiu das duas listas** de `lib/plano/plano.ts`. A regra do arquivo continua valendo: item anunciado como exclusivo do Pro precisa de gate real no código, e o gate dessa projeção morreu com ela. Restam simulados ilimitados, autópsia do erro, estatísticas avançadas e o selo Pro.

### Colunas do banco que ficaram sem leitor

Nenhuma migração nova foi escrita e nada foi dropado — trocar de ideia não pode custar dados. Estas colunas/tabelas continuam lá, ociosas: `profiles.modo_estudo`, `profiles.tempo_diario_min`, `missions.adiada_para`, `bosses.topico_ids`, `bosses.preparo_percentual`, `subjects.chance_aprovacao` (as duas últimas ainda são ESCRITAS por `atualizarMetricasSubject`, só não são lidas por nenhuma tela) e a tabela `rotina_semanal`.

**Divergência deliberada do app legado:** `js/mission-engine.js` e `js/rotina-engine.js` na raiz continuam existindo e continuam com o motor antigo. O app legado não foi tocado e **não é pra ser sincronizado** com isto.

## Repasse visual de 2026-09-16 — croma, largura e o convite de entrada

Três pedidos do dono no mesmo repasse, todos de leitura da tela, mais o conserto
de cobrança abaixo.

### 1. "As cores estão ardendo meus olhos, está muito colorido"

O app tinha **seis** cópias da mesma paleta de giz de cera (`#5b7cf0`,
`#f0555a`, `#f0a23f`…): hex cru, igual nos dois temas, e no croma cheio. Elas
pintam as superfícies mais largas que existem — os tiles de disciplina, a faixa
de ação da home, o cabeçalho do card de questão. Numa tela que é quase toda
cartão, isso soma uma parede de tinta.

O conserto tem duas partes:

- **uma rampa só.** `PALETA_CARTOES` (`lib/questly/paleta-cartoes.ts` →
  `--cartao-N-*` em `globals.css`) já era a paleta madura, derivada em OKLCH com
  luminosidade fixa e tema-ciente. Agora ela é a única: `mundo-ilhas.tsx`,
  `disciplina-picker.tsx` e `lib/questao/disciplina-cor.ts` passaram a lê-la em
  vez de carregar a própria. `disciplina-cor.ts` não pode mais fazer aritmética
  de hex (a cor só existe na hora de pintar), então `gradienteProfundo`/
  `profundo` viraram `color-mix(in oklab, <token> N%, black)`;
- **menos croma na rampa.** Todo par teve o croma multiplicado por **0.62 em
  OKLab com a luminosidade intacta**. Por isso nenhuma medida de contraste
  mudou de faixa — contraste WCAG é função da luminância, e ela não se mexeu:
  claro 5.81–6.27 com branco por cima, escuro 4.79–5.20, todas AA. O matiz
  ficou, então a grade continua legível como oito cores distintas, em tom
  terroso e não em giz de cera.

Retonalizados pelo mesmo critério, fora da rampa: `lib/cursos/registro.ts`
(brasão do curso — continua hex cru **de propósito**, há call sites que
concatenam alfa no valor, `${corA}40`, o que `var()` não permite), a paisagem da
trilha em `caminho-jornada.tsx` (grama, lago e flores eram desenho animado e são
a superfície mais luminosa do app), o CTA "Próxima" do runner (era um esmeralda
cru fora dos tokens da marca) e os halos neon do tour de onboarding.

**O que NÃO foi tocado, de propósito:** os tokens semânticos `--questly-*`
(verde/laranja/ouro/vermelho), que carregam texto e têm contraste medido; as
cores dos metais da liga; e tudo que carrega informação na trilha (pegadas
verdes, laranja da fronteira, traço de risco) — que ficou mais evidente agora
que o fundo parou de competir.

### 2. A trilha: largura do mapa e tamanho dos tiles

- o mapa da jornada (o vale com a capivara) ganhou teto de **1180px** em
  `trilha-view.tsx` — a grade de ilhas acima continua na casca inteira, porque
  são cartões e mais colunas é melhor, mas o mapa é um DESENHO: esticado até
  1300px a estrada vira um fio perdido num campo. Com o teto ele fica em ~720px
  no 2xl, que é onde a serpente ainda lê como caminho;
- o tile de disciplina era **quadrado** numa grade que parava em 4 colunas: seis
  disciplinas viravam seis pôsteres de ~380px e o mapa nascia abaixo da dobra.
  Virou `aspect-[5/4]` numa grade que vai até 6 colunas, com ícone, tipografia e
  respiro reduzidos na mesma proporção.

### 3. A primeira tela de quem acabou de chegar

No estado vazio, o `AcaoCard` dizia "Monte uma lista" e jogava direto no Banco de
Questões. É um começo pela ponta errada: quem entra pela primeira vez não sabe
QUAL lista montar, e sem plano a próxima visita cai no mesmo vazio. O convite
virou **"Monte a sua semana" → `/calendario`**, onde o aluno escreve o que vai
fazer em cada dia; daí em diante a própria faixa passa a oferecer "Começar" no
bloco do dia (o estado `plano` do item 30) e o ciclo se fecha sozinho. Montar uma
lista avulsa continua a um clique, na pílula secundária — perdeu a dobra, não o
caminho. O estado "já estudei hoje" segue apontando pro Banco: quem está em
movimento não precisa de plano pra continuar.

## Assinatura recorrente de verdade (2026-09-16) — `lib/plano/preapproval.ts`

**Buraco de receita, achado em produção.** O plano "Pro Semestral, R$ 10 por mês
com fidelidade de 6 meses" era vendido como recorrente e cobrado como avulso:
`criarPreferenciaCheckout` montava uma preferência de Checkout Pro com
`unit_price = opcao.precoCentavos / 100` — R$ 10, **uma vez** — e
`ativarAssinatura` liberava os 6 meses inteiros na primeira aprovação. O aluno
pagava um mês e levava o semestre; o compromisso existia só no texto do cartão.

O Mercado Pago tem dois produtos, e o app usava um só:

| | endpoint | cobrança | meios |
|---|---|---|---|
| `forma: "a_vista"` | `/checkout/preferences` | uma vez | cartão, **Pix**, boleto |
| `forma: "recorrente"` | `/preapproval` | mensal, automática | **só cartão de crédito** |

O que mudou:

- **`lib/plano/preapproval.ts` (novo)** — cria a assinatura no MP. `end_date` é
  o que transforma "cobra pra sempre" em "cobra 6 vezes" (calculado de
  `MESES_SEMESTRE`, não de um número solto); no mensal não há `end_date`.
  `start_date` fica 5 minutos à frente porque o MP recusa início no passado e a
  diferença de relógio entre os servidores já bastou pra derrubar a criação.
- **`ativar.ts` — uma cobrança compra o período que ela pagou.** À vista
  semestral = 6 meses; qualquer recorrente = **1 mês por cobrança**; ativação
  manual do admin = o ciclo inteiro (é contingência, e quem sabe o que foi pago
  é ele). Renovar nunca encurta: estende a partir de `max(hoje, expira_atual)`.
- **`creditarCobranca` é idempotente pelo ÍNDICE ÚNICO**
  `assinatura_pagamentos.gateway_payment_id` (migração
  `supabase_assinatura_recorrente.sql`), não por um filtro em JS — o webhook e o
  polling da tela chegam pelos dois lados e creditariam o mesmo mês duas vezes.
  A insert vem **antes** de mexer no profile: se duas chamadas correrem juntas, o
  pior caso é um crédito a menos (recuperável na conferência seguinte) em vez de
  um mês de graça.
- **webhook** passou a entender `subscription_authorized_payment` (a cobrança
  mensal — o id é o do `authorized_payment`, não o do pagamento) e
  `subscription_preapproval` (só loga: a preapproval em si não carrega dinheiro).
  Sem isso o aluno seria cobrado nos meses 2..6 e o Pro venceria no fim do mês 1.
- **`conferirPagamentoAction`** consulta a preapproval antes do polling de
  pagamento: numa assinatura o aluno autoriza primeiro e a 1ª cobrança demora
  alguns minutos. Sem isso a tela diria "não concluído" logo depois da
  autorização, e ele abriria uma segunda assinatura.
- **`cancelarRenovacaoAction`** (nova) — para de cobrar sem tirar o Pro já pago.
  A fidelidade do semestral é **informada, não imposta pelo código**: impor de
  verdade exigiria reter valor, que é decisão comercial, e esconder o botão seria
  pior.

### Repasse de 2026-09-17 — o "pagamento indisponível" que não era

Reportado logo depois: a tela mostrava *"O pagamento online está indisponível no
momento. Seu pedido ficou salvo e será confirmado manualmente"*. Esse é o
fallback manual de `criarAssinaturaAction`, e ele estava sendo usado pra duas
situações **muito** diferentes:

1. **não há gateway** (`MP_ACCESS_TOKEN` ausente — o caso do `.env.local`, que
   não tem a variável). Aí a mensagem é verdade: o pedido fica pendente e o
   admin confirma em `/admin/assinaturas`;
2. **há gateway e ele RECUSOU.** Aí a mensagem é uma promessa falsa — ninguém
   vai cobrar por fora —, o motivo real morria num `console.error` e o pedido
   ficava pendurado como `pendente`, o que ainda por cima trava a próxima
   tentativa (índice parcial "uma pendente por aluno").

O caso 2 ficou muito mais provável com a preapproval, que é bem mais exigente
que uma preferência. Três correções:

- **a falha do gateway vira erro de verdade**, com o motivo, e a pendente que
  acabou de nascer é cancelada pra não bloquear a retentativa. O fallback manual
  agora só acontece quando não há gateway nenhum;
- **`explicarRecusa`** traduz as três recusas que de fato derrubam um
  preapproval, todas de configuração: assinar da própria conta de vendedor
  ("cannot operate between same user" — o que acontece ao testar com o e-mail
  do dono), `back_url` inválida e token recusado;
- **`back_url` exige https público.** A preapproval é recusada inteira em
  `http://localhost`, então em desenvolvimento o plano à vista funciona e o
  recorrente não. Agora isso é dito na hora, em vez de virar um "não foi
  possível" genérico.

Dois defeitos meus corrigidos junto:

- **`createAdminClient()` sem guarda** depois da assinatura já criada no MP.
  Ele LANÇA sem `SUPABASE_SERVICE_ROLE_KEY` — o aluno ficaria com assinatura
  aberta no gateway e tela de erro aqui. Agora é try/catch: `gateway_id` é
  conveniência, a conferência acha por `external_reference`;
- **o furo de receita entrando pela porta manual.** `ativarAssinatura`
  (confirmação do admin) concedia `ciclo === "semestral" ? 6 : 1` meses, então
  confirmar à mão um pedido *semestral recorrente* — cujo `valor_centavos` é
  R$ 10, o de UMA parcela — dava seis meses por dez reais. Passou a usar a mesma
  `mesesPorCobranca` do caminho automático.

### A venda não pode depender do preapproval (2026-09-17, segunda rodada)

Relato do dono: *"até ontem tinha o gateway do Mercado Pago e tudo funcionava"*.
Estava certo — e o diagnóstico da rodada anterior estava incompleto. Trocar o
recorrente de `preferences` pra `preapproval` fechou o furo de receita, mas
**amarrou a venda a um endpoint muito mais exigente**, e com isso o mensal e o
semestral, que vendiam, pararam de vender.

O que o `/preapproval` exige e a preferência não (confirmado na referência do
MP): Assinaturas habilitado na conta, pagador **diferente** da conta vendedora
(testar com o e-mail do dono dá "cannot operate between same user") e `back_url`
https pública. O corpo que mandamos está de acordo com a doc — `status: "pending"`
sem `card_token_id` é o fluxo hospedado correto, e devolve `init_point` — então a
recusa é de conta/credencial, não de formato. **O motivo exato está no log do
Vercel**, que agora imprime o corpo cru da resposta do MP.

A correção estrutural é não deixar a venda pendurada nisso. `criarAssinaturaAction`
passou a ter dois degraus:

1. tenta a assinatura de verdade (cobra todo mês — é o que queremos);
2. se o MP recusar, cai pro **checkout avulso que sempre funcionou**, cobrando
   UM período (`precoCentavos` já é o preço de um mês nas duas opções
   recorrentes) e creditando UM mês.

O degrau 2 **não reabre o furo** — quem paga R$ 10 leva um mês, não seis — mas
entrega menos do que o cartão prometeu. Por isso ele volta marcado
(`semRenovacao: true`) e a tela **exige um segundo clique**, explicando que não
haverá renovação e apontando o semestral à vista como alternativa. Degradar
calado seria vender assinatura e entregar compra avulsa.

Dois ajustes que vêm junto:

- **fidelidade só com assinatura real.** `estenderPro` só carimba
  `plano_fidelidade_ate` quando a linha tem `gateway_id` — sem preapproval não
  há seis cobranças a honrar, e registrar o compromisso seria mentir numa tela
  que o aluno lê;
- **o teto de 6 cobranças é contado por nós.** O `end_date` mandado ao MP
  deveria parar na 6ª, mas é uma promessa do gateway sobre um campo que ele
  valida sozinho; o custo de falhar é cobrar um 7º mês não contratado. Ao
  creditar a 6ª cobrança, `creditarCobranca` conta `assinatura_pagamentos` e
  **cancela a assinatura no MP**.

**Como saber em qual caso você está:** `/admin/assinaturas` logado como admin
tem uma tarja laranja que diz exatamente qual variável falta (ver
`PUBLICAR.md`). Sem tarja, o gateway está de pé e a recusa é do MP — e agora a
tela diz qual.

⚠️ **Rode `supabase_assinatura_recorrente.sql` antes de publicar** — o app lê
`assinaturas.gateway_id` e grava em `assinatura_pagamentos`. E **teste com
credenciais reais do MP**: o caminho de preapproval nunca rodou contra o gateway.

### Parcelar é o recorrente honesto (2026-09-17, terceira rodada) — **supera as duas seções acima**

Relato do dono: o checkout parou de redirecionar e ficou **travado numa tarja
laranja** de "renovação automática indisponível" com um botão de R$ 15. Era o
degrau 2 da rodada anterior funcionando exatamente como escrito — e sendo, na
prática, um caixa que não vende. A honestidade daquele aviso estava certa; **a
hora dele estava errada**. Descobrir no clique que o produto é outro obriga a
interromper a compra; a correção é não deixar essa discrepância existir.

Duas mudanças, uma de produto e uma de código, e a de produto é a que resolve:

**1. A grade virou duas opções, e as duas são Checkout Pro.** Os três cartões
eram, na verdade, dois: *semestral recorrente* (6× R$ 10) e *semestral à vista*
(R$ 60) custavam **o mesmo total pelo mesmo período**. A diferença entre eles
não era o produto, era a forma de pagar — pergunta que o checkout do MP já faz
sozinho. Hoje são:

| | preço grande | cobrança | credita |
|---|---|---|---|
| **Pro Mensal** | R$ 15/mês | uma, Pix/cartão/boleto | 1 mês |
| **Pro Semestral** | R$ 10/mês (−33%) | uma de R$ 60, **em até 6× no cartão** ou Pix | 6 meses |

O semestral entrega o "R$ 10/mês" por **parcelamento**
(`payment_methods.installments`, `PARCELAS_SEMESTRAL`) em vez de assinatura. O
furo de receita fecha por construção — não existe pagar uma parcela e levar o
semestre, porque o valor cheio já foi autorizado no cartão — e Pix passa a valer
em todos os planos (o preapproval não aceita Pix). A "fidelidade" some como
conceito: pagar adiantado **é** o compromisso, e era a única versão dele que o
código conseguia impor.

⚠️ **Não escreva "sem juros" em lugar nenhum da UI.** `installments` só limita o
NÚMERO de parcelas; quem decide se é sem juros é a configuração da conta
vendedora no painel do MP. Por isso a tela diz "em até 6× no cartão", ponto, e
`default_installments` não é enviado (pré-selecionar 6× mostraria um total com
juros escolhido por nós).

**2. A recorrência vira flag, resolvida ANTES do clique.**
`recorrenteHabilitado()` (`lib/plano/preapproval.ts`) exige `MP_RECORRENTE=1` e
`NEXT_PUBLIC_APP_URL` https; **desligado por padrão**. A `/pro` chama
`opcoesVisiveis(recorrenteHabilitado())` no servidor e desenha o cartão certo
desde o primeiro render — então o clique é **sempre** um redirect limpo, e o
degrau de degradação (`semRenovacao`, a tarja laranja, o segundo clique) foi
**removido**: não há mais discrepância a avisar. `criarAssinaturaAction`
recusa um id recorrente com o flag desligado (o id vem do cliente). Quando a
conta do MP tiver Assinaturas aprovado, é uma variável de ambiente pra religar
— `MENSAL_RECORRENTE`, o preapproval, o webhook de
`subscription_authorized_payment` e `cancelarRenovacaoAction` continuam todos de
pé e inalterados, inclusive pra quem já assinou pelo caminho antigo.

Nada de migração: `assinaturas.ciclo`/`forma` já aceitam `('mensal','semestral')`
× `('recorrente','a_vista')`, e `mesesPorCobranca` já creditava 6 meses pro
semestral à vista. Os preços da landing passaram a ser **importados** de
`lib/plano/plano.ts` em vez de digitados — marketing e caixa não podem discordar
de preço.

### Os meios de pagamento param de ser promessa (2026-09-17, quarta rodada)

O dono foi pagar e **não havia Pix no checkout** — a tela prometia em três
lugares ("Pix, boleto ou cartão parcelado"). Não era bug de integração: Pix só
aparece no Checkout Pro quando a conta que recebe **tem chave Pix cadastrada**,
configuração do painel do MP que a preferência não alcança. Mesmo erro do "sem
juros": afirmar algo que não controlamos.

A diferença é que este dá pra **conferir**. `metodosPagamentoMP()`
(`lib/plano/mercadopago.ts`) lê `GET /v1/payment_methods` com o nosso token —
que devolve os meios ativos *daquela conta* — e a `/pro` monta a frase a partir
disso (`meiosAceitosTexto`, `lib/plano/plano.ts`). Três consequências:

- o cartão de preço, a linha de confiança e o aviso de recusa ("tente outro
  cartão **ou por Pix**") citam só o que existe;
- se a consulta falhar, a frase encolhe pra "cartão de crédito" — **errar pra
  menos é o lado certo de errar** quando se trata de prometer;
- cache de processo de 10 min, senão seria uma chamada de rede por render.

`/admin/assinaturas` ganhou a linha correspondente na tarja: *"Sua conta não
tem Pix ativo — cadastre uma chave Pix no painel"*. Antes, descobrir isso
exigia tentar uma compra real.

Junto: `motivoRecusa` (`lib/plano/actions.ts`) tinha 8 códigos e caía num "O
pagamento não foi concluído" genérico pro resto — o dono levou erro com cartão
de **débito** e a tela não soube dizer nada. Agora são 17, com os dois casos de
débito separados (`cc_rejected_other_reason` = recusa do emissor, tente outro
cartão; `cc_rejected_card_type_not_allowed` = a conta vendedora não aceita
débito), e **todo `status_detail` desconhecido vai pro log** — é o único jeito
de a lista crescer com base em recusa real, em vez de adivinhação.

⚠️ O código cru do MP nunca vai pra tela do aluno (não diz nada a ele); vai pro
log do Vercel.

## Vida acadêmica: faltas e notas (2026-09-17) — `/materias`, `lib/academico/`

**Pedido do dono, e a primeira coisa que o Pro vende e o grátis não faz de
jeito nenhum.** Até aqui o Pro era "o mesmo produto, sem limite" (simulado
extra, autópsia, estatística). Isso é um upgrade, não uma razão pra pagar. As
duas contas que de fato decidem o semestre de um universitário não tinham nada
a ver com banco de questões, e ele fazia as duas no caderno — ou não fazia:

1. **"quantas faltas eu ainda posso levar?"** — reprovar por frequência é o
   jeito mais burro de perder um semestre, e quase ninguém tem o número na
   cabeça;
2. **"quanto eu preciso tirar na P3 pra passar?"** — a média ponderada com peso
   diferente por avaliação é onde o aluno erra a conta.

Arquitetura, em três camadas separadas de propósito:

| Camada | Arquivo | Papel |
|---|---|---|
| Matemática | `lib/academico/academico.ts` | PURA, sem Supabase: `statusFrequencia`, `resumoNotas`, `sugerirFaltasMax` |
| Leitura | `lib/academico/academico-data.ts` | 3 queries por `user_id` + `alertasDaVidaAcademica` + `carregarResumoRiscoAcademico` (o resumo da home) |
| Escrita | `lib/academico/actions.ts` | Server Actions, **todas atrás de `exigirPro()`** |

A separação é a mesma de `chance-aprovacao.ts` e existe por um motivo concreto:
o veredito "você está reprovado por falta" é calculado em DOIS consumidores — a
tela e o e-mail de relatório, que roda num cron sem browser nenhum. Duas
implementações discordando sobre isso seria pior que não ter o recurso.

**Modelagem** (`supabase_vida_academica.sql`): `subjects` ganha só os
PARÂMETROS (`faltas_max`, `carga_horaria`, `aulas_por_semana`,
`media_aprovacao`); o que aconteceu vira linha (`faltas`, `avaliacoes`). Não
existe `subjects.faltas_usadas`: seria um segundo lugar pra mesma verdade
(mesma regra da meta do calendário) e tiraria do aluno a única coisa que torna o
contador realmente útil — saber QUANDO faltou, pra conferir com o diário do
professor quando a chamada não bate. A soma sai na leitura.

**O gate do Pro é de aplicação, não de RLS.** A RLS é dono-only e não conhece
plano. Se dependesse do plano, no dia em que o Pro vencesse o banco ESCONDERIA o
que o aluno digitou, e a tela diria "nenhuma falta" em vez de "renove pra
editar". Perder um recurso é uma coisa; o produto mentir sobre o dado do aluno é
outra. Na prática: leitura sempre liberada, escrita só com `exigirPro()`.

**Nada aqui paga XP, acende ofensiva ou entra no ranking** — registrar uma falta
não é estudo, e se pagasse seria a forma mais fácil de forjar ranking já
inventada neste banco.

Detalhes que parecem miudeza e não são: falta **justificada** fica registrada e
não conta no limite (o aluno precisa ver as duas coisas); `quantidade` conta
AULAS, não dias (faltar numa manhã de 2 tempos custa 2, que é como o diário do
professor conta); `nota` é nullable de propósito — é a avaliação SEM nota que
permite responder "quanto preciso tirar", que é a metade útil da pergunta; a
sugestão de 25% (LDB art. 47 §3º) é oferecida, nunca imposta.

### Redesenho da tela (2026-09-17, mesmo dia) — grade + painel

A primeira versão empilhava, **por disciplina**, uma seção com o cartão de
faltas e o de notas lado a lado, cada um com sua lista e seus formulários
abrindo *inline*. Com seis matérias a tela tinha seis alturas de rolagem, e
abrir "registrar falta" na terceira empurrava tudo o que estava abaixo. O dono
resumiu como "a pessoa tem que ficar indo pra baixo".

A estrutura agora é **faixa de resumo → grade de cartões → painel**:

| Arquivo | Papel |
|---|---|
| `materias-view.tsx` | orquestra: faixa de resumo, avisos, grade, painel |
| `materia-cartao.tsx` | o cartão compacto de 1 disciplina (+ `Pips`/`Barra`, reusados no painel) |
| `materia-painel.tsx` | `ModalPainel` com 3 abas (Faltas / Notas / Ajustes) |
| `faltas-card.tsx` | `FaltasPainel` — o conteúdo da aba Faltas |
| `notas-card.tsx` | `NotasPainel` + `AssistenteEstrutura` |
| `ajustes-painel.tsx` | parâmetros do semestre (saiu de dentro do cartão de faltas) |
| `tons.ts` | paleta semântica compartilhada + `fmt` |

Decisões que valem lembrar:

- **A disciplina aberta é derivada do array, nunca copiada pro estado**
  (`materias.find(m => m.subjectId === abertaId)`). É isso que faz o painel se
  atualizar sozinho no `router.refresh()` de cada gravação, em vez de exibir a
  cópia velha até ser fechado.
- **A aba escolhida é guardada junto com o id da disciplina**
  (`{id, aba}`), e a aba padrão (`abaInicial`) só vale enquanto o aluno não
  tocou nas abas *daquela* matéria — senão o refresh de cada gravação o jogaria
  de volta pra aba sugerida no meio do que estava fazendo. Sem `useEffect`:
  derivar no render evita a cascata de renders (a regra
  `react-hooks/set-state-in-effect` reprova a versão com efeito).
- **`divide-x`/`divide-y` não funciona em grid de mais de uma linha** — pinta a
  borda de todo item menos o primeiro, então o item que ABRE a segunda linha
  ganha uma borda esquerda solta. A faixa de resumo usa `gap-px` sobre
  `bg-border` (hairline imune ao layout). Foi um dos bugs de CSS relatados.
- Os pips de falta viraram **grid de colunas iguais** em vez de
  `flex-wrap` + `flex-1`: com quebra de linha o flex esticava os pips da última
  fileira e 7 faltas pareciam uma escala diferente de 10. `maxPips` é menor no
  cartão (12) que no painel (20), porque o cartão tem metade da largura.
- Faltas **além** do teto mostram o excedente como número grande ("3 além do
  limite"), não um `0` com "faltas restantes" — o texto antigo dizia a coisa
  errada justamente no caso mais grave.

### "Quantas provas e trabalhos?" — o assistente de estrutura

Também pedido do dono. Cadastrar avaliação a avaliação era onde a tela perdia o
aluno: ele abria um formulário com "peso" e "vale até", não sabia o que o
professor combinou em cada campo e desistia — ficando sem a única conta que veio
buscar. Disciplina **sem nenhuma avaliação** mostra, no lugar do formulário,
duas perguntas que ele já sabe responder de cabeça (é assim que o critério é
apresentado no primeiro dia de aula): quantas provas, quantos trabalhos, e o
peso de cada grupo. `criarEstruturaAvaliacoesAction` cria P1…Pn + Trabalho 1…m
de uma vez.

A prévia embaixo mostra os nomes E **quanto cada coisa vale em porcentagem** —
é ali que ele percebe que digitou o peso errado, antes de a média ficar torta
por um semestre inteiro. A action recusa se a disciplina já tem avaliações, e a
checagem é no servidor, não só na UI: chamá-la direto numa disciplina cadastrada
duplicaria a grade e envenenaria a média sem erro nenhum.

### O número grande virou a nota da PRÓXIMA (`projecaoProxima`)

`resumoNotas().precisaTirar` responde "que média preciso no CONJUNTO do que
falta" — certo pra saber se o semestre fecha, mas não é a pergunta de quem está
estudando hoje: essa é "quanto preciso **na P2**". `projecaoProxima`
(`lib/academico/academico.ts`, puro como o resto) devolve a primeira avaliação
sem nota com:

- `precisa` — a mesma média necessária, **reescalada pra escala da avaliação**:
  uma P2 que vale 100 pontos pede "84", não "8,4". Era um erro de leitura
  esperando pra acontecer.
- `seTirarMaximo` — a média que ainda seria exigida no resto se ele gabaritar
  esta. É o piso do que vem depois: mesmo com 10 na P2, se isso der 9,5 ele
  precisa saber ANTES de fazer a P2, não depois.
- `fracaoDoTotal`, `pendentesDepois` — pra tela poder dizer em que hipótese o
  número vale ("supondo a mesma nota nas outras 2 que faltam").

`carregarVidaAcademica` só chama a projeção quando ainda há corrida
(`no_caminho`/`dificil`/`sem_notas`); aprovado, impossível e reprovado já têm o
veredito, e uma nota-alvo ali seria ruído. A média no conjunto continua na tela,
menor, logo abaixo — as duas leituras juntas, porque uma sozinha engana.

A porta de entrada no celular **não** é a barra inferior (travada em 5 abas):
é o `MateriasRiscoCard` na coluna da direita da home + o item no menu da conta.
O cartão existe menos por navegação e mais porque um aviso de falta só vale se
chegar ANTES da aula — uma tela que o aluno precisa lembrar de abrir não avisa
nada.

## O plano grátis apertou (2026-09-17) — `lib/plano/limites.ts`

O grátis entregava o produto inteiro menos quatro detalhes; quem fazia 300
questões por semana e quem pagava R$ 15 recebiam a mesma plataforma. A régua
nova, com o ponto de checagem de cada limite (todos **no servidor**):

| Limite | Valor | Onde é imposto |
|---|---|---|
| Questões por dia | 30 | `registrarRespostaAction` — conta ANTES de inserir |
| Simulados por semana | 1 | `lib/simulados/actions.ts` (já existia) |
| Favoritos | 15 | `lib/anotacoes/actions.ts` |
| Anotações | 10 | `lib/anotacoes/actions.ts` |
| Faltas/notas, PDF, relatório | — | `lib/academico/actions.ts`, `/imprimir`, cron |

Três decisões do teto diário:

- a recusa **não grava nada**. Uma tentativa gravada "fora do limite" ainda
  mexeria em maestria/BKT, nos contadores globais da questão e no XP — o teto
  vazaria por todos os efeitos colaterais, menos pelo número na tela;
- o runner recebe `restanteHoje` do servidor e RECONCILIA depois de cada
  resposta (`resultado.questoesHoje`): duas abas da mesma conta gastam do mesmo
  teto, e o cliente não teria como saber disso sozinho;
- ao bater o teto, o aluno **sempre pode encerrar a lista e ficar com o XP do
  que fez** (`LimiteDiarioView`). Um limite que sequestra o progresso do dia não
  converte — irrita, e deixa a lista pendurada em "em andamento" pra sempre.

Favoritos/anotações: o gate só barra CRIAÇÃO. Desfavoritar, editar uma anotação
que já existe e apagar passam sempre — quem chegou ao teto não pode ficar
impedido de corrigir o que ele mesmo escreveu.

`SIMULADO_FREE_LIMITE_SEMANA` continua nascendo em `lib/simulados/constantes.ts`
e é só **re-exportado** por `limites.ts` — dois arquivos com o mesmo teto
divergem no primeiro ajuste de preço. As frases de `RECURSOS_FREE` interpolam as
constantes em vez de digitar os números: um "30" escrito na tela de venda vira
mentira no dia em que o teto mudar.

## Boas-vindas ao Pro (2026-09-17) — tela + e-mail

Pedido do dono: *"quando a pessoa concluir o pagamento, quero que ela receba uma
mensagem de boas-vindas e fale tudo que ela tem direito agora"*.

Antes existia só o `StatusPro`: "Assinatura ativa" + data de validade. Correto e
frio — e o problema é de produto, não de estética. O segundo seguinte ao
pagamento é o único momento em que o aluno está 100% disposto a aprender o que
acabou de comprar, e a tela gastava esse momento informando uma data. Quem não
sabe o que ganhou não usa; quem não usa não renova.

- **Tela** (`components/plano/bem-vindo-pro.tsx`): cada benefício é um LINK pra
  onde ele é usado, não um item de lista — "clique aqui e configure suas faltas"
  em vez de "você tem controle de faltas". Com ela ligada, o cabeçalho, o campo
  de cupom e a tabela comparativa saem da tela (quem acabou de comprar não
  precisa de comparativo, e o cupom vira a pergunta "será que eu podia ter pago
  menos?"). O extrato continua logo abaixo, no `StatusPro` compacto.
- **`recemAtivado` tem DUAS origens**, e faltava uma: o polling desta tela
  (`ativadoAgora`) e a conferência que o servidor já fez na volta do checkout
  (`conferenciaInicial.estado === "ativo"`). Sem a segunda, quem paga no cartão
  — aprovado na hora — cairia direto no cartão seco de "assinatura ativa"; só
  quem paga por Pix, que passa pelo polling, veria as boas-vindas.
- **E-mail** (`lib/email/templates-pro.ts` + `lib/plano/boas-vindas.ts`): existe
  porque metade fecha a aba no checkout e volta horas depois direto no
  `/dashboard` — esses nunca veem a tela. Disparado de `estenderPro` (caminho
  pago: webhook, polling da `/pro` e ativação manual do admin passam todos por
  lá) e de `resgatarCupomAction` (cupom). **Sem tabela de controle de envio**:
  o estado do plano lido ANTES da escrita já é essa verdade. Todo o disparo é
  engolido (`try/catch`, erros só no log) — provedor de e-mail fora do ar não
  pode transformar um pagamento aprovado em erro, e um `throw` faria o webhook
  do MP reprocessar uma ativação que deu certo.

  **Repasse do mesmo dia — duas correções, pedido do dono: "manda boas-vindas e
  agradece SEMPRE que alguém virar Pro, independente se for por cupom".**

  1. *Quando sai.* A régua era `profiles.plano_desde` nulo — uma vez na vida da
     conta. Isso calava justamente o segundo caso mais importante: o aluno que
     foi Pro, deixou vencer e VOLTOU (pagando ou por cupom), porque
     `plano_desde` nunca mais é nulo. Agora a régua é a **transição**: `ehPro`
     lido antes do update, e-mail sempre que uma conta que não estava Pro passa
     a estar. Renovar um plano **ainda ativo** continua calado — renovar não é
     virar Pro, e é o que impede a recorrente mensal de mandar boas-vindas todo
     mês. `plano_desde` não sumiu: virou o `retorno` do template, que separa
     "bem-vindo" de "seu Pro está de volta".
  2. *O que diz.* O texto era escrito só pro caminho pago — abria com
     "Pagamento confirmado" e assinava "porque assinou o Expectrum Pro",
     **inclusive pra quem entrou por cupom e não pagou nada**, e não agradecia
     em lugar nenhum. O template recebe `origem: "pago" | "cupom"` e agradece
     de acordo (assunto, abertura e rodapé mudam; a lista de benefícios é a
     mesma nos quatro casos, porque ela é o motivo do e-mail existir).

## Exportar em PDF com marca d'água (2026-09-17) — `/imprimir/*`

**O app monta o PDF, no navegador do aluno** (`lib/imprimir/gerar-pdf.ts`,
`jspdf` + `html2canvas-pro`, ambos carregados sob demanda no clique). Não foi
sempre assim, e a história importa — ver "Quarta rodada" no fim desta seção: por
três rodadas o "PDF" foi o *Imprimir → Salvar como PDF* do navegador, e o que
derrubou essa escolha não foi o CSS, foi o pipeline de pré-visualização do
Chrome. Gerar no SERVIDOR continua descartado (custaria um runtime de Chromium
por download, ou uma lib que não renderiza KaTeX).

**Marca d'água com o e-mail do aluno** (pedido do dono, e o que torna o recurso
viável): um PDF do banco de questões é um arquivo que circula — grupo da turma,
Drive do cursinho, Telegram. A marca não impede a cópia (nada impede), mas
amarra cada cópia a uma conta: quem republica publica o próprio e-mail junto. É
dissuasão por atribuição, como nos PDFs de editora acadêmica. **Duas camadas
independentes**, porque uma sozinha é fácil demais de perder: a diagonal
repetida (6 carimbos por página) e o rodapé. As duas são desenhadas em VETOR
numa passada final por todas as páginas do PDF (`carimbarPaginas`) — depois do
conteúdo, porque as fatias são JPEG opaco e cobririam a marca se ela viesse
antes. O e-mail vem da sessão, lido no servidor — nunca do cliente: o ponto
inteiro é o aluno não escolher o que sai carimbado.

A ordem das questões segue `question_ids`, não a ordem que o Postgres devolveu:
quem está com a lista aberta no app espera que a questão 7 do papel seja a 7 da
tela. O gabarito sai no fim, em página nova, e pode ser desligado antes de
imprimir — quem imprime pra simular a prova não quer a resposta na mão.

⚠️ Esconder o cromo do app na impressão **não dá** pra fazer com
`body > *:not(.folha)`: a folha nasce dentro do layout de `(protected)`, vários
níveis abaixo do `body`. Cada peça carrega `print:hidden` na própria classe
(`top-nav`, `foco-bar`, `mobile-bottom-nav`) e o que é da tela usa
`.nao-imprimir`. Se aparecer cromo novo no layout, ele precisa da classe.

### Repasse de 2026-09-17 (tarde): folha em molde de prova, preparo e híbrido

**Três portas, uma folha.** `/imprimir/[missaoId]` (a lista aberta),
`/imprimir/topico/[topicoId]` (a lista de um tópico, SEM precisar começá-la — é
o que deixa o Banco de Questões oferecer PDF pra quem ainda não respondeu nada)
e `/imprimir/simulado/[id]` (a prova do simulado híbrido). As três montam o
mesmo `FolhaImpressao` → `FolhaProva`, e o gate do Pro é o mesmo `PortaPro`
checado no SERVIDOR em cada `page.tsx`. Os segmentos estáticos `simulado`/
`topico` convivem com o irmão dinâmico `[missaoId]` porque o Next resolve
estático antes de dinâmico.

**A folha virou prova, não página impressa.** Corpo serifado, cabeçalho com
linhas de Nome/Matrícula/Turma/Data/Nota pra preencher à mão, bloco de
instruções, "QUESTÃO n" numerada, alternativas `(a) (b) (c)` lado a lado quando
são curtas (`alternativasEmLinha` — qualquer imagem ou LaTeX de bloco desliga o
modo em linha: economizar papel não vale uma alternativa ilegível), espaço
pautado pra desenvolver embaixo de cada questão, e cabeçalho + rodapé correndo
em TODA página (`position: fixed` dentro das margens do `@page`). O CSS mora em
`components/imprimir/estilos-impressao.ts`.

**O passo de preparo** (`PreparoImpressao`) existe por um defeito concreto: a
lista de um tópico passa fácil de 100 questões e a tela antiga mandava TODAS
pra impressora sem perguntar. **O padrão NÃO é a lista inteira**
(`PADRAO_QUESTOES_FOLHA`, 10 — corrigido em 2026-09-17 a pedido do dono): com o
espaço de resolução amplo, cada questão custa quase meia folha, e "todas" virava
um arquivo de dezenas de páginas que ninguém imprime e que o navegador às vezes
nem gera. O preparo aparece **exatamente quando há recorte** (`total >
quantidade padrão`) — a regra é essa, não um limiar solto, porque nenhuma
questão pode ficar de fora sem o aluno saber. Nele ele responde **quantas
questões**, **com ou sem gabarito**, **quanto espaço pra resolver** e se quer
**cartão-resposta em branco**, com estimativa de páginas (`paginasEstimadas`,
grosseira de propósito e assumida como "~N" na UI). Numa lista que cabe inteira
a folha abre direto; as opções ficam na barra do topo, então mudar de ideia não
custa recomeçar. O recorte pega as N PRIMEIRAS (a ordem é o que faz a questão 7
do papel ser a 7 da tela), nunca uma amostra nova.

**Numa prova o recorte não existe** (`permitirRecorte={false}`): uma prova é o
conjunto inteiro das suas questões — imprimir "as 20 primeiras de 30" faria a
nota do papel não bater com a do cartão-resposta. Lá o gabarito nasce
DESLIGADO e o cartão-resposta em branco nasce LIGADO, que é o oposto do padrão
de uma lista de treino.

### Simulado híbrido: papel + cartão-resposta digital

O aluno escolhe no montador (`Onde você vai resolver`) entre resolver **na
tela** ou **imprimir e resolver no papel**; a segunda opção manda pra
`/simulados/[id]?modo=cartao`. O `SimuladoRunner` passou a ter dois modos, com
seletor sempre visível no topo — trocar no meio é legítimo (começou no papel,
terminou na tela) e não perde marcação.

- **Não custou coluna no banco.** O modo é de EXIBIÇÃO: mesma linha em
  `simulados_aluno`, mesmo autosave, mesma correção no servidor, mesmo
  relatório com autópsia de erros. Guardar isso no banco seria gravar qual tela
  o aluno estava olhando.
- **O cartão digital não mostra enunciado nem alternativa**, de propósito: se o
  texto estivesse na tela, ele leria dali e a impressão teria sido teatro. As
  bolhas são as letras de CADA questão, não um A–E fixo.
- **Sem cronômetro por questão no modo cartão.** Não existe "questão visível"
  quando a prova está no papel; atribuir o tempo à linha do topo inventaria um
  dado que ninguém mediu. `tempos` fica vazio e `resumirTempo` já devolve
  `temDados: false` (é best-effort por contrato).
- **`reiniciarRelogioSimuladoAction`**: ir até a impressora não é tempo de
  prova. Enquanto NENHUMA resposta foi marcada, o aluno zera o relógio num
  clique; o servidor exige as três condições (dono, `em_andamento`, zero
  respostas) e depois da primeira marcação o botão some — aí a prova começou.
  Sem respostas, reiniciar equivale a abandonar e montar outro com as mesmas
  questões, então não abre nada que já não fosse possível.

**Visibilidade do botão** (era o pedido mais simples e o mais ignorado): o
ícone mudo escondido atrás de `sm:` na tela de questões virou botão com rótulo,
visível também no celular; cada card de lista do Banco de Questões ganhou um
`PDF` ao lado de "Começar"; e a tela do simulado tem "Imprimir prova" fixo no
topo.

### Conserto do PDF "todo bugado" (2026-09-17, mesmo dia)

Quatro causas independentes, todas silenciosas — o PDF saía errado sem nenhum
erro no console:

1. **Fragmentação dentro de flex.** O casco de `(protected)/layout.tsx` é
   `flex min-h-screen flex-col` e o Chrome pagina MAL dentro de flex: saía
   página cortada, conteúdo sumido, folha em branco no meio. O layout ganhou
   `print:block print:min-h-0` e a folha inteira volta a ser fluxo de bloco em
   `@media print` (`.folha-raiz, .folha, .folha-conteudo, .folha ol, li`).
   **Se aparecer wrapper flex novo entre o `body` e a folha, ele precisa do
   `print:block`** — é a regressão mais fácil de reintroduzir aqui.
2. **`break-inside: avoid` no bloco inteiro da questão.** Com espaço de
   resolução grande, o bloco não cabia na sobra da página e ia inteiro pra
   próxima, deixando meia folha vazia. Agora só o **miolo** (enunciado +
   alternativas) é indivisível; o espaço em branco pode partir, que é
   inofensivo.
3. **Fórmula de bloco cortada.** `MathText` embrulha display math num
   `overflow-x-auto` — certo na tela (a matriz rola no celular), fatal no
   papel: o que passa da largura some sem aviso. Na folha o overflow vira
   `visible` e o display math encolhe pra 0.95em.
4. **Marca d'água densa demais.** Eram 2 carimbos por ladrilho de 320×200;
   agora 1 por 470×310 (~4x menos). A atribuição continua de pé — basta UMA
   sobreviver a um recorte.

No mesmo repasse, por pedido do dono: **`amplo` virou o padrão** de espaço de
resolução (~68mm por questão, quase meia folha), inclusive em lista longa —
quem imprime vai resolver NA folha, e o caminho "descobrir que dá pra aumentar"
ninguém percorre; reduzir fica nas Opções. E **as pautas sumiram**: conta de
Física tem diagrama, vetor e eixo, não anda em linha reta. `ALTURA_RESOLUCAO_MM`
mora em `lib/imprimir/opcoes.ts` (lib não importa de components).

### Segunda rodada de conserto do PDF (2026-09-17)

Achados a partir de um PDF real exportado pelo dono:

- **Cabeçalho corrente REMOVIDO.** O Chrome ancora elemento `fixed` na caixa de
  CONTEÚDO da página, não na folha: `bottom` cai na sobra depois do texto e
  funciona, mas `top` cai **em cima da primeira linha** — o título da lista saía
  impresso por cima do cabeçalho corrente, letra sobre letra ("as letras começam
  a juntar"). Ficou só o rodapé, que se repete e já carrega a identificação.
  **Não reintroduza um `position: fixed` com `top` aqui.**
- **Marca d'água sem alfa.** Era `fill="#111827" fill-opacity="0.065"`. Uma
  camada semitransparente cobrindo a página inteira obriga o gerador de PDF a
  achatar tudo que está embaixo num **bitmap** — texto borrado e arquivo gordo
  ("a qualidade cai bastante"). Agora é um cinza-claro **sólido** (`#dfe3e8`):
  mesma aparência, texto continua vetorial.
- **`BotaoErroRapido` não tinha `print:hidden`** e saía carimbado no meio da
  folha. Toda peça de cromo flutuante precisa da classe — é a regressão mais
  fácil de reintroduzir no app inteiro.
- **Nome do arquivo.** O Chrome sugere o nome do PDF pelo `document.title`, e o
  título da rota ("Imprimir lista do tópico · Expectrum") não diz o que foi
  baixado. `imprimir()` troca o título por `nomeDoArquivo(disciplina, titulo)`
  só durante a impressão e devolve o original no `afterprint`.
- **Figuras em milímetros, não em pixels** (`.figura-enunciado` 55mm,
  `.figura-alternativa` 26mm) e **alternativas com figura em duas colunas**.
  Empilhadas em coluna única, cinco figuras somavam mais de uma folha: a
  questão não cabia na página, o `break-inside: avoid` do miolo a empurrava pra
  folha seguinte e sobrava meia página em branco atrás. No papel o que importa
  é quanto da FOLHA a figura ocupa, não quantos px ela tem.
- A dica da barra passou a pedir que o aluno **desmarque "Cabeçalhos e
  rodapés"** no diálogo do Chrome — é o que tira a data e a URL do site de cima
  da folha, e não há CSS que faça isso pelo app.

### Terceira rodada (2026-09-17): "Falha ao carregar documento PDF"

- **A troca de `document.title` saiu do clique de imprimir.** A tentativa
  anterior trocava o título dentro de `imprimir()`, logo antes de
  `window.print()`. Deu errado duas vezes: mexer no documento no instante em
  que o Chrome monta a pré-visualização é caminho conhecido pra "Falha ao
  carregar documento PDF", e quem imprime por **Ctrl+P** nunca passava pela
  função — o arquivo saía sem nome de qualquer jeito. Agora o título é trocado
  num efeito de **montagem** (e devolvido no unmount): o documento fica parado
  durante a impressão e os dois caminhos ganham o nome certo.
- **Marca d'água sem SVG.** Saiu o `<pattern>` com `patternTransform` dentro de
  um `position: fixed` repintado em todas as páginas — elegante e exatamente o
  tipo de coisa que faz o gerador de PDF desistir. São **6 `<span>` rotacionados
  por página**, posicionados em porcentagem: primitivo, continua vetorial (o
  Chrome escreve a matriz do texto) e custa seis desenhos por folha.
- **Figuras menores ainda**: `.figura-enunciado` 46mm, `.figura-alternativa`
  20mm, e as classes de tela (`max-h-[190px]`/`max-h-[78px]`) agora batem com o
  papel — antes a tela mostrava o dobro do que ia sair impresso.
- **Aviso de arquivo longo** (`PAGINAS_DEMAIS`, 40): com o espaço amplo como
  padrão, 25 questões já passam de 25 páginas, e a pré-visualização do Chrome
  falha em documentos muito longos com muitas figuras. É aviso, não bloqueio —
  mas sem ele o aluno conclui que o site quebrou.

### Quarta rodada (2026-09-17): o app passou a ESCREVER o PDF

As três rodadas acima foram tentativas de consertar o diálogo de impressão do
navegador. A quarta parou de tentar. O relato do dono foi: *"ta dando um erro ao
salvar o pdf, acho que ele ta entendendo como se fosse imprimir em vez de só
baixar. Ele nao vem com nome, a pessoa que precisa digitar, e ao abrir o pdf da
um erro"* — e, logo depois, *"inclusive no celular ao clicar em baixar o pdf
nada acontece"*.

São quatro sintomas com **uma causa**: `window.print()` não é um download. Ele
entrega o arquivo a um pipeline que não é nosso — que escolhe o nome (ou não
escolhe), que decide se a pré-visualização monta, e que **no celular pode
simplesmente não existir** (`window.print()` é opcional em navegador móvel; em
vários ele não faz nada, sem erro e sem aviso). Nenhuma quantidade de `@media
print` conserta isso, e as três rodadas anteriores são a prova.

Agora o arquivo é montado em `lib/imprimir/gerar-pdf.ts` e sai por
`pdf.save(nome)` — download comum, de um arquivo **já válido antes de o
navegador encostar nele**. Os quatro sintomas morrem juntos.

**Como o arquivo é montado.** Não é "fotografar a página num canvas gigante e
fatiar" — é isso que corta questão no meio da folha. Cada elemento marcado com
`data-pdf="bloco"` em `folha-prova.tsx` (o cabeçalho, o miolo de cada questão, o
cartão-resposta, o gabarito, cada resolução) vira uma imagem própria, e a
paginação é feita no gerador: bloco que não cabe no resto da página desce
inteiro; só bloco maior que a página inteira é fatiado, porque aí não há escolha.
**Duas regras ao mexer na folha:** um `data-pdf` nunca pode ficar dentro de
outro (o gerador varre em ordem de documento e desenharia duas vezes), e o que é
espaço em branco não vira bloco — `data-pdf-espaco="68"` diz quantos milímetros
reservar, e o gerador desenha isso em vetor (deixando quebrar entre páginas, que
o miolo não pode). O filete separador é desenhado **depois** de decidir a
página: a primeira versão desenhava antes e sobrava um traço pendurado no pé da
folha quando a questão não cabia.

**Números medidos** (folha de 10 questões com espaço amplo, figura em 1/3 delas,
cartão + gabarito + resoluções — 8 páginas A4): ~2 s pra montar, 2,2 MB. A
escala de render (2,25 → ~240 dpi na coluna A4) e a qualidade do JPEG (0,85)
saíram de uma varredura: 0.92 → 4,2 MB, 0.85 → 3,3, 0.80 → 3,0, 0.72 → 1,9. O
arquivo é baixado no 4G da faculdade, e acima de ~0,85 o ganho visível em texto
preto sobre branco é nenhum.

**Detalhes que parecem acessórios e não são:**

- **Largura de render fixa em 760px** (`fixarLarguraDeRender`). Sem isso o PDF
  sairia com a diagramação do CELULAR (fonte enorme, alternativas empilhadas) só
  porque o aluno apertou o botão no telefone. 760px sobre 182mm de coluna útil é
  também o que faz as alturas de figura da TELA (`max-h-[190px]`,
  `max-h-[78px]`) caírem nos ~46mm/~19mm que o papel comporta — a
  pré-visualização passou a ser honesta. A folha fica alguns segundos com essa
  largura, e é por isso que existe a cortina de progresso: sem ela o aluno vê a
  página "pular" e conclui que quebrou.
- **Figuras são embutidas como `data:` antes de fotografar** (`inlinarImagens`).
  Elas vêm do Storage do Supabase, outro domínio; desenhar imagem de outro
  domínio num canvas o CONTAMINA e `toDataURL` lança. Se o fetch falhar, a URL
  original fica e o `useCORS` ainda pode dar conta — degradação, não quebra.
- **KaTeX sobrevive** (verificado renderizando o PDF de volta com pdf.js):
  integral, fração e delimitadores saem nítidos, porque o clone do html2canvas é
  same-origin e as fontes do KaTeX vêm do próprio `/_next/static`.
- **`@media print` e a classe `.nao-imprimir` continuam valendo.** Imprimir
  direto virou botão SECUNDÁRIO (pra quem tem impressora ligada agora), e a
  troca de `document.title` na montagem continua, só que servindo apenas ao
  Ctrl+P — no botão principal o nome do arquivo é nosso.
- **`nomeDoArquivo` agora leva a data.** Quem imprime lista imprime várias, e
  dois downloads com o mesmo nome viram "(1)".
- **`PAGINAS_DEMAIS` (40) mudou de significado**: o aviso não é mais sobre o
  Chrome desistir, é sobre a memória do celular do aluno — montar o arquivo
  passou a ser trabalho do aparelho dele.

### Quinta rodada (2026-09-17): entrega no celular, marca no branco, dois moldes

Três relatos do dono, três coisas sem relação entre si.

**1. "No celular ele fica montando o pdf e depois nada acontece."** `pdf.save()`
é um `<a download>` clicado por script, e ele roda DEPOIS de segundos de
`await` — fora do gesto que o aluno fez. Navegador de celular engole esse
clique: sem exceção, sem aviso, sem arquivo. Não dá pra detectar a falha; dá pra
não depender dela. `baixarFolhaEmPdf` passou a **devolver o blob** em vez de
salvar, e quem entrega é a tela (`entregarPdf` + `ArquivoProntoCartao`): tenta o
download automático onde ele funciona (desktop, Android) e, **em qualquer
caso**, mostra um cartão com um `<a download>` de verdade pro aluno tocar — um
toque é gesto legítimo em todo navegador. No iOS o automático nem é tentado
(navegar pra uma `blob:` tira o aluno da página) e o cartão oferece também
`navigator.share`, que é por onde o PDF vai parar no app Arquivos. O cartão
traz o nome e o tamanho do arquivo, porque "pronto" sem prova de que existe é a
mesma angústia com outra roupa. Bônus da mesma rodada: `poucaMemoria()` derruba
a escala de render pra 1.8 quando `deviceMemory <= 4` — meio PDF não vale mais
nitidez que um PDF inteiro.

**2. "A marca d'água muitas vezes fica em cima do texto, isso tá feio."** Estava
mesmo: eram seis carimbos em posições fixas por PORCENTAGEM da página, e posição
fixa não tem como saber que ali embaixo tem uma equação. Mas o gerador **sabe** —
foi ele quem pôs cada imagem na folha. Agora ele guarda as faixas ocupadas de
cada página (`ocupado`) e `faixasLivres` devolve os vãos em branco; a marca vai
pro maior vão (numa lista com espaço pra resolver, exatamente o espaço da
conta), no máximo dois por página. Sem vão que sirva — folha de gabarito, prova
compacta —, ela vai deitada pra margem lateral, onde nunca houve texto. O cinza
também clareou (232,236,240): marca que mora no branco pode ser discreta sem
deixar de ser legível. A atribuição não afrouxou — o rodapé com o e-mail
continua em toda página, e basta UMA marca sobreviver a um recorte.

**3. "Tá feio, a letra tá fraquinha e meio pequena, deixa premium — e o simulado
podia copiar o estilo das provas de Física da UFF."** `FolhaProva` ganhou
`variante`:

- **`"prova"`** (usada por `/imprimir/simulado/[id]`) é o molde da prova
  impressa: cabeçalho CENTRADO, filete duplo, `QUESTÃO 01` com a linha correndo
  até a margem. Quem já fez uma P1 reconhece a forma antes de ler — e é isso que
  faz a simulação valer. **A identidade é Expectrum**: o nome da universidade
  aparece como FONTE das questões (que é o que ela é), nunca como quem assina a
  folha.
- **`"lista"`** (o padrão, usada pelas outras duas portas) é editorial:
  cabeçalho à esquerda com barra verde, título maior, número da questão num
  quadrado. Deliberadamente DIFERENTE — uma lista de exercícios não é uma prova,
  e vestir as duas iguais tira o peso das duas.

A tipografia subiu junto: corpo de **12,5px → 15px** (≈8,5pt → ≈10,2pt no A4 —
antes era corpo de nota de rodapé), preto de `#111827` → `#0b1016`, e os cinzas
de metadado saíram do quase-invisível. ⚠️ Isso muda quantas questões cabem por
página: `paginasEstimadas` em `lib/imprimir/opcoes.ts` foi recalibrado junto
(80 caracteres por linha, 6,4mm por linha) e precisa acompanhar qualquer mexida
futura na tipografia da folha.

Medido nas duas variantes (10 questões, espaço amplo, figura em 1/3, cartão +
gabarito + resoluções): 7 páginas, ~1,0 MB, ~3,5 s cada.

### Sexta rodada (2026-09-17): a marca que não sai

Pedido do dono: *"mais marca d'água nos PDFs, de forma que não atrapalhe a
leitura mas a pessoa não consiga remover ao compartilhar"*.

O problema com o que existia não era a quantidade — era a **natureza**. Toda a
marca era vetorial, e vetor num PDF é OBJETO: qualquer editor (ou um `qpdf` de
linha de comando) seleciona e apaga. Quem ia repassar a folha pro grupo da turma
nunca precisou de mais do que isso. Aumentar a densidade da mesma camada daria
mais objetos pra apagar de uma vez só, não mais dificuldade.

Agora são **três camadas com papéis diferentes**, e a do meio é a nova:

1. **Raster, dentro dos pixels** (`carimbarNoCanvas`, o que segura). O carimbo é
   desenhado no canvas de cada bloco ANTES de ele virar JPEG — grade em tijolo
   de ~62mm × 26mm a -26°, o e-mail repetido. Não há objeto pra selecionar nem
   camada pra esconder: o `-` do enunciado e o `-` da marca são a mesma coisa
   pro arquivo, e tirar um significa repintar a página à mão.
   **Por que não atrapalha ler**: o blend é `darken` — o pixel final é o mais
   escuro entre o conteúdo e o cinza da marca, então texto preto continua preto
   e só o branco em volta ganha ~9% de cinza. É o princípio do papel timbrado.
   Se o navegador não tiver `darken` nem `multiply`, a função **desiste** em vez
   de cair no `source-over` padrão, que pintaria tarjas opacas sobre o
   enunciado: marca a menos é aceitável, folha ilegível não é.
2. **Vetor no branco** (`carimbarPaginas`, a bonita). Continua procurando os
   vãos livres via `ocupado`/`faixasLivres`, agora até TRÊS por página, e um vão
   grande (≥ 95mm — o espaço pra resolver) leva duas marcas em vez de uma. É
   apagável, e tudo bem: ela é o acabamento, não a tranca.
3. **Margens laterais + rodapé, em toda página**. As duas margens agora levam o
   e-mail deitado SEMPRE (antes só quando não sobrava branco nenhum) — faixa que
   o texto nunca ocupa, custo zero de legibilidade, e é o que identifica a cópia
   numa página cheia de ponta a ponta. Mais os metadados do arquivo
   (`pdf.setProperties`), a camada mais fácil de apagar das quatro e por isso a
   última da lista — mas é de graça.

A `MarcaDiagonal` da TELA virou a mesma grade (um SVG repetido como
`background-image`, um nó só no DOM) pra a pré-visualização continuar honesta
sobre o que vai sair. Ela não entra na captura do html2canvas, que fotografa os
`[data-pdf]` e não esta camada — não há risco de marca dobrada.

### Hub dos Simulados reorganizado (2026-09-17)

Era uma pilha vertical única em que a prova em andamento, as duas portas de
entrada, a nota sobre a universidade, o aviso de plano, o resumo e TODAS as
provas antigas tinham o mesmo peso e se sucediam sem separação. Agora são
quatro blocos com título: **Retomar** (só se houver prova com relógio correndo,
e várias viram linhas de uma lista, não N cartões), **Começar uma prova** (as
duas portas — montador e provas antigas — lado a lado e com o MESMO peso, que é
o que revela serem caminhos alternativos pra mesma coisa), **Como você vem
indo** e **Suas provas**. O histórico mostra 6 e dobra o resto atrás de "ver as
outras N": prova de dois meses atrás é consulta, não navegação, e não pode
empurrar as ações pra fora da tela. A nota da universidade virou um `<details>`
fechado, e o gate do plano grátis mudou de lugar pra junto das portas — ele é
sobre PODER começar, não sobre o histórico.

## Só disciplina com questão (2026-09-17) — onboarding e Configurações

O passo 5 do onboarding oferecia a união de três listas: as matérias do banco,
uma lista curada por curso (`disciplinasNucleo` em `lib/cursos/registro.ts`) e
um campo de texto livre. As duas últimas ofereciam **becos sem saída no primeiro
minuto de uso**: o aluno de Engenharia Química marcava "Termodinâmica" porque a
plataforma sugeriu, chegava no dashboard e não havia uma questão pra estudar.

Agora o passo 5 mostra **só o que a view de contagem diz que existe**
(`listarMateriasComQuestoes`). A lista curada por curso não sumiu — ela mudou de
papel: passa por `filtrarComQuestoes` e o que sobra **reordena** os chips (as do
curso do aluno primeiro), nunca os acrescenta. Quem manda no conteúdo é o banco;
a grade curricular de referência só diz o que é relevante dentro dele. O
casamento é por nome normalizado e o nome DEVOLVIDO é sempre o do banco — a
lista curada escrever "Calculo I" não pode criar uma matéria nova e vazia ao
lado da que existe (`salvarCampanhaAction` procura `materias` por nome).

Em **Configurações** as sugestões passaram a vir da mesma fonte, com a contagem
no chip. Mas o **campo de texto livre continua ali**, e só ali: faltas e notas
de `/materias` (Pro) funcionam sem banco de questões, e tirá-lo impediria o
aluno de acompanhar a disciplina que ele de fato cursa. O placeholder diz o que
ele entrega — *"Outra disciplina (sem questões, só faltas e notas)"* — em vez de
prometer prática que não existe.

Nada foi apagado de conta nenhuma: quem já tinha uma disciplina sem questões
continua com ela (a trilha já a mostra honestamente como "sem ementa"), e quem
quiser tira pelo botão Remover.

## Relatório semanal por e-mail (2026-09-17) — `/api/cron/relatorio-semanal`

Único e-mail RECORRENTE da plataforma, e o único transacional com link de
descadastro no rodapé + `List-Unsubscribe` (recorrente sem saída vira spam, e a
reputação do remetente é a mesma que entrega o código de cadastro). O
descadastro daqui desliga só `profiles.relatorio_semanal`, não todo contato —
quem não quer o resumo de segunda não pediu pra parar de receber o código de
acesso da própria conta.

- **Agendamento**: `vercel.json`, segundas 11:00 UTC (8h BRT — o agendador do
  Vercel só fala UTC). Precisa de `CRON_SECRET`; **sem ele a rota responde 401
  em vez de liberar** — uma rota que dispara e-mail pra base inteira, aberta na
  internet, é um canhão apontado pra reputação do remetente. Falhar fechado é o
  lado certo de falhar.
- **Idempotência**: a linha em `relatorio_envios` é reivindicada como `enviando`
  ANTES do envio, e o índice único `(user_id, semana)` é o que garante um e-mail
  por aluno por semana (não um filtro em JS). Se a função morrer no meio, ela
  SUB-envia em vez de duplicar.
- **Semana fechada**, não "últimos 7 dias": a semana da liga já é a unidade de
  tempo do produto, e um e-mail de segunda falando de terça a segunda
  confundiria quem acabou de ver o ranking zerar.
- **Semana vazia não vira e-mail** (`valeEnviar`): "você fez 0 questões" toda
  segunda é a receita mais curta pra virar spam, e quem sumiu não volta por um
  e-mail que o repreende. A exceção é ter alerta acadêmico — aí há o que dizer.
- Ordem do conteúdo é a mensagem: (1) o que pode custar o semestre (faltas,
  média), (2) o que você fez, (3) onde errou mais. Os tópicos fracos são
  ordenados pela TAXA de erro, não pelo absoluto: 4 erros em 5 é um problema, 4
  em 40 é ruído de volume.
- Quando a base não couber em 60s, o passo seguinte é **paginar** por `offset`
  na querystring — nunca aumentar o paralelismo (a Brevo limita por minuto).

## Teto de exportação em PDF (2026-09-17) — `lib/imprimir/cota.ts`

**O buraco.** Exportar em PDF é o único recurso do Pro que tira conteúdo de
DENTRO do app: a folha impressa continua valendo depois que a assinatura vence.
Com o banco em ~2.600 questões, o plano mensal a R$ 15 e o direito de
arrependimento de 7 dias (que não é opcional — ver abaixo), o caminho ótimo pra
quem quer o banco não era assinar: era assinar, baixar tudo num fim de semana e
pedir o dinheiro de volta. A marca d'água com o e-mail do aluno dissuade a
REDISTRIBUIÇÃO; ela não faz nada contra a extração.

**O que passou a ser cobrado: documento diferente, não geração de arquivo.**
Uma linha em `pdf_exportacoes` = um documento (`missao:<id>`, `simulado:<id>`,
`topico:<id>`) numa semana (a segunda-feira local, mesma convenção de
`questlySegundaDaSemana`). O índice único `(user_id, documento, semana)` é o
teto de verdade — não um filtro em JS —, e a consequência escolhida é que
**reimprimir não custa nada**: o aluno mexe no espaçamento e no gabarito da
mesma lista quatro vezes antes de imprimir, enquanto extrair o banco exige
abrir um documento NOVO por tópico. Os dois usos se separam sozinhos, sem
precisar adivinhar intenção.

Três tetos, em `lib/plano/limites.ts`:

| constante | valor | o que segura |
|---|---|---|
| `PDF_SEMANA_PRO` | 12 | a semana de véspera de prova cabe; a rotina de extração não |
| `PDF_MES_PRO` | 20 | **o que importa** — o abuso cabe todo dentro de um ciclo de cobrança |
| `PDF_QUESTOES_MAX` | 60 | o servidor não ENVIA mais que isso; = `SIMULADO_QTD_MAX`, então nenhuma prova é cortada |

`PDF_MES_PRO` é menor que 4 × o semanal de propósito: a folga semanal existe
pra permitir a semana atípica, o teto mensal existe pra impedir que ela se
repita quatro vezes.

**Onde o gate roda, e por que não é no clique de baixar.** No RENDER da página
(`app/(protected)/imprimir/*/page.tsx`), logo depois do gate de Pro. Parece
tarde — o aluno pode fechar a aba sem gerar arquivo nenhum —, mas é o único
ponto que o servidor controla: o PDF é montado NO APARELHO dele
(`lib/imprimir/gerar-pdf.ts`) a partir das questões que a página já mandou. No
instante do render o conteúdo já saiu; cobrar no clique seria cobrar por algo
que o cliente pode simplesmente não fazer.

⚠️ **Erro de infra LIBERA** (`registrarExportacao` → fail-open). Sem
`SUPABASE_SERVICE_ROLE_KEY`, ou com o insert falhando, a exportação segue e o
motivo vai pro log. Um bug de contabilidade não pode derrubar um recurso que o
aluno pagou; errar pra esse lado custa uma exportação a mais, errar pro outro
custa um Pro sem produto.

⚠️ **`pdf_exportacoes` não tem policy de escrita** (`supabase_cota_pdf.sql`),
mesma trilha de `assinatura_pagamentos` e `relatorio_envios`. Uma policy
dono-only `for all` deixaria o aluno APAGAR as próprias linhas do console com a
chave anon — ou seja, zerar o contador, que é o contrário de um teto. Ele lê as
dele (a tela precisa dizer quantas restam) e nada mais.

**A tela não esconde o teto.** `RECURSOS_FREE`/`BENEFICIOS_PRO` dizem "até 12
por semana" em vez de ✓ — é o único item do comparativo cujo Pro não é
"ilimitado". A razão do teto (o banco de questões é o produto) é fácil de
aceitar antes da compra e impossível de aceitar depois dela. Durante a
exportação, `avisoDaCota` (`lib/imprimir/aviso-cota.ts`) só fala quando há algo
acionável: a lista foi cortada, a cota está acabando (`PDF_AVISO_RESTANTE`), ou
é reimpressão e portanto de graça. O silêncio é o padrão — um aviso de limite
permanente em cima da folha transformaria um teto que quase ninguém encosta num
carimbo de vigilância.

## Sair da assinatura (2026-09-17) — `/pro`, `components/plano/gerenciar-assinatura.tsx`

Vender assinatura obriga a ter porta de saída, e a lei desenha **duas**, com
consequências opostas. A tela mostra exatamente a que existe pro caso do aluno,
e diz quando não existe nenhuma:

1. **Arrependimento (CDC art. 49)** — 7 dias corridos do pagamento, para compra
   feita fora do estabelecimento comercial (a internet é o caso clássico). Não
   depende de motivo, de defeito nem da nossa concordância, e a devolução é do
   valor **integral**. `cancelarComReembolsoAction` estorna no Mercado Pago
   (`reembolsarPagamentoMP`, `POST /v1/payments/{id}/refunds`) E revoga o Pro na
   mesma ação — não fazer as duas juntas seria dar o produto de graça a quem
   pedir. `DIAS_ARREPENDIMENTO` mora em `lib/plano/plano.ts`, não em
   `actions.ts`: um arquivo `"use server"` só pode exportar funções async.
2. **Cancelar a renovação** — para a próxima cobrança, não devolve nada, o mês
   pago continua sendo do aluno. Só existe com preapproval de verdade no
   gateway (`MP_RECORRENTE=1`); com o caixa de hoje (tudo à vista), o cartão diz
   que **não há cobrança automática** em vez de oferecer um botão que não faz
   nada — a forma mais rápida de alguém achar que cancelou.

A revogação tira **exatamente os meses que aquela cobrança comprou**
(`adicionarMeses(expira, -meses_creditados)`), não zera a validade: quem tinha
30 dias de cupom antes de pagar continua com eles.

A ordem das operações do estorno é escolhida pelo pior desfecho de cada falha:
para a renovação → estorna → só então revoga. Se a revogação falhar depois do
estorno, sobra dinheiro devolvido e alguns dias de Pro — recuperável à mão. A
ordem inversa produz o desfecho ruim de verdade: acesso cortado e dinheiro
retido por uma falha de rede.

**Por que na `/pro` e não num "fale conosco".** CDC art. 6º (e o Decreto
11.034/2022, no que alcança): cancelar tem que ser pelo mesmo canal e com o
mesmo esforço de contratar. Se assinar são dois cliques, cancelar não pode ser
um chamado respondido em cinco dias úteis.

### O bug que apareceu quando a ação ganhou tela

`cancelarRenovacaoAction` já existia desde 2026-09-16 e **nenhuma tela a
chamava**. Ao ligá-la, o defeito: o `update` ia pelo client do próprio aluno, e
a policy de `supabase_seguranca_hardening.sql` só permite `'pendente' →
'cancelada'` (`using (... and status = 'pendente')`). Numa assinatura **ativa** a
RLS filtrava a linha — zero linhas afetadas, `error` null, nenhum sinal de nada.
Cancelávamos no Mercado Pago e deixávamos a assinatura marcada como ativa aqui.

Todo o caminho de saída passou a escrever via `service_role`. A policy continua
certa como está: sair de uma assinatura ativa envolve falar com o gateway e
mexer em `profiles.plano`, e isso nunca sai do browser.

## Acervo público de provas antigas (2026-09-17) — `/provas/fisica-uff`, `lib/provas/`

**Pedido do dono, e é canal de aquisição, não recurso.** O contexto: ele mandou
acesso pra amigos, eles não distribuíram, e postar propaganda em grupo de
estudante é constrangedor — *"estou com vergonha de ficar fazendo propaganda lá
no meio do grupo"*. A saída é inverter o sentido: em vez de a plataforma se
anunciar onde o aluno está, ela aparece quando ele **procura pela prova**. O
acervo de provas da UFF já existia inteiro no banco (`supabase_provas_oficiais.sql`,
31 provas / 461 questões) e só era alcançável depois do login — ou seja, o
melhor ativo de marketing estava trancado atrás do cadastro.

- **Duas rotas, e a segunda é onde mora o tráfego.** `/provas/fisica-uff` é o
  catálogo (uma página, uma busca genérica); `/provas/fisica-uff/[prova]` são 31
  páginas de cauda longa, cada uma respondendo a busca que um aluno de fato
  digita ("p2 de física 2 uff 2024"). Slug legível (`fisica-2-2023-1-p1`), não o
  `prova_codigo` cru — `slugDaProva`/`codigoDoSlug` em `lib/provas/catalogo.ts`
  fazem a ida e a volta, e o código reconstruído ainda passa por
  `lerCodigoProva` + casamento contra `vw_provas_oficiais` antes de virar filtro,
  mesma disciplina dos itens 26/27.
- **O corte entre grátis e pago é a RESPOSTA, não a prova.** A página pública
  mostra quantas questões a prova tem, quais tópicos da ementa ela cobra, os
  subtópicos e **uma questão por extenso** (enunciado com KaTeX, figura,
  alternativas). Não mostra gabarito nem resolução — e não por filtro de UI:
  `carregarProvaPublica` **não lê essas colunas do banco**, então não existe
  caminho (props, payload RSC, view-source) que as entregue. O enunciado já
  circula em PDF nos grupos da turma; o que a gente acrescenta é a resolução, o
  relógio e a catalogação — e é isso que fica do outro lado do cadastro.
  ⚠️ **Sem cupom em lugar nenhum** (decisão explícita: o objetivo é vender).
- **`service_role` pela mesma razão de `lib/landing/stats.ts`**: `questions` e as
  views liberam leitura só pra `authenticated`, e quem a página serve é o
  visitante anônimo. Leitura agregada, sem dado de aluno, em `try/catch` — o
  catálogo vazio degrada pra estado honesto em vez de derrubar a página.
- **`dynamicParams = false` na rota dinâmica, e isso não é detalhe.** Com o
  padrão (`true`), `notFound()` numa rota com `revalidate` devolve a página
  "Prova não encontrada" com **status 200** — soft 404, justo na rota que só
  existe pra ser indexada, e o Google passaria a listar uma página de erro por
  slug inventado. Verificado nos dois modos: em dev todo slug dava 200; no build
  de produção com o flag, slug inválido e prova fora do acervo dão 404 de
  verdade. O preço é que prova importada depois do build só aparece no deploy
  seguinte — aceitável porque importar prova já é manual e raro.
- **Encanamento de descoberta**: `PREFIXOS_PUBLICOS` em `proxy.ts` ganhou
  `/provas/` (sem isso o crawler leva 307 pro `/login` e o site fica fora do
  índice — mesma armadilha que criou `ARQUIVOS_PUBLICOS` no item 18); o
  `sitemap.ts` virou `async` e lista as 31 URLs (é o que faz o Google achá-las
  sem depender de link externo); e o rodapé da landing aponta pro catálogo, que
  é o link interno dizendo ao buscador que aquelas páginas são deste site.
  `robots.ts` não mudou — `/provas` nunca esteve na lista de `Disallow`.
- **Server Components, sem framer-motion**: quem chega vem do Google, e o que
  importa é HTML pronto e leve, não animação. A landing `/` continua sendo a
  página com movimento.
- **`compararProvas` foi afrouxada** pra `Pick<ProvaOficial, "ano"|"semestre"|"prova"|"materiaNome">`
  em vez de pedir a `ProvaOficial` inteira: o catálogo público monta um objeto
  mais magro e precisa da MESMA ordem cronológica — duplicar a regra ali seria a
  forma óbvia das duas listas discordarem.
- **Conferência visual**: `next build` + `next start` + Chrome headless, em
  claro, escuro e 390px, mais a verificação de que `gabarito`/`resolucao` não
  aparecem no HTML servido e de que os status 200/404 batem.

## Programa de parceiros (2026-09-17) — `/parceria`, `/p/[codigo]`, `/parceiro`, `/admin/afiliados`

A plataforma passou a **pagar comissão a quem a divulga** (um perfil do
Instagram, um centro acadêmico, um monitor). Schema em `supabase_afiliados.sql`;
as regras comerciais, num arquivo puro só (`lib/afiliados/afiliados.ts`), porque
as telas públicas SÃO a proposta — não há PDF assinado no meio, e um "30%"
digitado à mão numa tela vira, no dia em que a tabela mudar, uma promessa que a
plataforma não cumpre.

**O desenho, e as três decisões que o carregam:**

1. **Sem oferta especial pro público, por padrão** (`afiliados.dias_bonus`,
   default 0). O link não é cupom nem desconto: quem clica cria conta normal,
   no plano grátis que qualquer visitante tem — o que o link faz é carimbar de
   quem foi a indicação. Dar dias de Pro de graça pra todo clique custaria caro
   em escala e treinaria o público a nunca pagar preço cheio; `dias_bonus`
   continua existindo no schema pra um acordo pontual negociado com UM
   parceiro específico (o admin decide caso a caso em `/admin/afiliados`), nunca
   como regra do programa. Efeito colateral que importa mais que a economia: o
   checkout do Mercado Pago (`lib/plano/mercadopago.ts`) **não sabe que este
   programa existe** — nenhum preço muda, nenhuma preferência ganha caso
   especial, e o caminho do dinheiro segue com uma variável a menos.
2. **Faixa por volume, retroativa ao mês** (`FAIXAS`: 25% → 30% aos 10, 35% aos
   25, 40% aos 50). Pro parceiro transforma "divulgar" em meta, e o painel diz
   quantas vendas faltam pra faixa seguinte. Pra plataforma, 40% só é pago sobre
   um volume que, por definição, não existiria sem ele, e o piso de 25% protege
   a margem no caso comum. `afiliados.percentual_fixo` existe pra negociação
   individual caber sem virar exceção no código.
3. **Janela de 12 meses** (`afiliados.janela_meses`). O parceiro recebe pela
   primeira compra e por cada renovação daquele aluno no período; depois disso,
   a renovação é retenção (trabalho da plataforma), não aquisição. Comissão
   vitalícia seria transformar aquisição em renda sobre trabalho alheio.

**O caminho, ponta a ponta:**

- `/p/<CODIGO>` (rota pública, `PREFIXOS_PUBLICOS`) grava o cookie `questly_ref`
  com o código **e o instante do clique**, e conta o clique (via
  `registrarCliqueParceiroAction`, chamada do CLIENTE — é o que mantém fora da
  conta o prefetch do Next e os robôs de preview de link).
- `IndicacaoAuto` (no layout protegido, gêmeo de `ConviteAutoResgate`) carimba a
  indicação na primeira tela logada — o primeiro instante em que a linha de
  `profiles` existe e o bônus pode ser escrito nela. Quatro recusas, todas
  caladas pro aluno: **conta criada antes do clique** (cliente que a plataforma
  já tinha — é o vazamento clássico e mais caro de programa de afiliado),
  conta já indicada, auto-indicação, parceiro inativo.
- `creditarCobranca` (`lib/plano/ativar.ts`) chama `registrarComissaoIndicacao`
  DEPOIS de ativar o Pro, e essa função **engole os próprios erros** — mesma
  regra do e-mail de boas-vindas: nada pendurado no caminho do dinheiro pode
  transformar um pagamento aprovado numa tela de erro. A idempotência é do
  banco (índice único em `afiliado_comissoes.referencia` = a linha de
  `assinatura_pagamentos`), nunca de um filtro em JS — webhook e polling chegam
  na mesma venda pelos dois lados.
- `cancelarComReembolsoAction` cancela a comissão da cobrança estornada. O bônus
  de dias do aluno **fica**: ele não veio daquela compra, e confiscá-lo puniria
  quem exerceu um direito legal.
- A comissão nasce `pendente` e só vira `aprovada` depois do prazo de
  arrependimento (`DIAS_LIBERACAO` = `DIAS_ARREPENDIMENTO`): enquanto o aluno
  pode desfazer a compra, não há venda pra dividir. A promoção é **preguiçosa**
  (`aprovarComissoesVencidas`, na abertura do painel e no fechamento), no mesmo
  espírito do rollover da liga — não há cron, e não precisa haver.
- **`percentual` e `valor_centavos` ficam NULOS até o fechamento do mês**, porque
  a faixa depende do volume do mês inteiro. Até lá o painel mostra projeção
  (`projetarPorCompetencia`); depois, o valor gravado manda e nenhuma projeção
  passa por cima dele. Painel do parceiro, tela do admin e fechamento usam a
  MESMA função — se discordassem, o admin pagaria um valor que o parceiro nunca
  viu.
- `fecharRepasseAdminAction` agrupa o aprovado num `afiliado_pagamentos`
  (competência = o mês do repasse, então o índice único vira a regra "um repasse
  por mês por parceiro"), aplica a faixa **por competência** (um lote pode somar
  meses que não bateram o piso; a faixa de setembro não pode pagar julho) e
  **recusa abaixo de `MINIMO_REPASSE_CENTAVOS`** — o saldo acumula, que é o que
  a proposta promete, e o fechamento varre todas as competências não pagas
  justamente pra que acumular funcione sem ninguém lembrar.

**Privacidade, que aqui é decisão de arquitetura e não de tela:** o parceiro não
tem policy de leitura em `afiliado_indicacoes` nem nada de `profiles` de quem
indicou. Ele vê "38 contas vieram do seu link" e "uma venda de R$ 60 em 14/09" —
nunca quem. O painel lê agregado via `service_role` (`lib/afiliados/painel.ts`),
o que torna essa promessa verdadeira em vez de uma convenção de UI. Comissão não
compra o cadastro de ninguém.

**Escritas sempre por `service_role`**, mesmo onde a policy do admin bastaria:
nenhuma tabela do programa tem policy de INSERT/UPDATE pro parceiro, e a chave
Pix é salva por `salvarChavePixAction` depois de conferir a sessão — dar UPDATE
ao dono da linha abriria `percentual_fixo`, `dias_bonus` e `ativo` pro console do
navegador, e o parceiro se daria 90% em duas linhas de JS.

**Telas:** `/parceria` (pública, é a proposta — tabela de faixas, simulação de um
mês, as regras inteiras, CTA por e-mail), `/p/[codigo]` (a landing do link, com
OG próprio porque é o que aparece no story), `/parceiro` (painel: link com botão
de copiar primeiro, dinheiro liberado × liberando × recebido, faixa do mês e
quantas vendas faltam pra próxima, últimas vendas anônimas, chave Pix) e
`/admin/afiliados` (cadastro, quanto devo × quanto ele trouxe, fechar repasse,
marcar Pix como pago).

**`/convite/AFILIADO` — o passeio de 1 dia.** Recrutar parceiro é vender o
produto pra quem não vai usá-lo: a pergunta dele não é "isso me ajuda a
estudar?", é "eu indicaria isso sem passar vergonha?". O link dá **1 dia de Pro
completo** (cupom comum na tabela `cupons`, semeado pela migração) numa tela
escrita pra dono de perfil (`components/afiliados/convite-afiliado-view.tsx`),
com PRODUTO primeiro e DINHEIRO depois — uma proposta que abre em "ganhe 40%" é
indistinguível de um esquema de DM. Um dia, e não sete, porque ele vai circular
entre perfis e não entre alunos. O `page.tsx` de `/convite/[codigo]` desvia pra
essa tela (e pro metadata dela) quando o código é o de parceria; o motor de
resgate é exatamente o mesmo.

## Ranking fiel (2026-09-17) — `lib/ranking/ranking-data.ts`, `lib/questly/economia.ts`

Auditoria pedida pelo dono ("acredito que não está fiel o XP e tudo mais").
Eram seis problemas distintos, e nenhum era de exibição: cinco estavam na
**trilha que escreve** `profiles`, um na que lê. Migração:
`supabase_ranking_fiel.sql` (deploy blocker).

**1. O nível não existia.** `profiles.nivel` nunca foi escrito pelo app
Next.js — nem na home, nem ao fechar uma lista, em lugar nenhum. A coluna é
lida em três telas (hero da home, coluna "Nível" do ranking global, card
público) e pelos distintivos `nivel-5/10/20`, e valia 1 em TODA conta real
desde sempre. As únicas linhas com nível de verdade eram as 40 contas de
teste de `supabase_seed_ranking_teste.sql`, que semeia
`greatest(1, xp_total/1750)` — ou seja, o ranking mostrava aluno fictício no
nível 12 ao lado de aluno real com 9.000 XP no nível 1, e os três distintivos
de nível eram inalcançáveis.

Agora o nível é **uma leitura do XP**, não um contador paralelo:
`questlyNivelDoXp` (`lib/questly/shared.ts`) com curva quadrática — XP
acumulado pra chegar no nível n = `25 * n * (n-1)` (N2=50, N5=500, N10=2.250,
N20=9.500, N30=21.750). Quadrática de propósito: com nível linear (o que o
seed fazia) o número não diz nada que o XP já não dissesse. A função tem
**gêmeo exato no banco** (`questly_nivel_do_xp`), que mantém a coluna em dia
pra quem precisa dela sem recalcular; mexeu na constante de um lado, mexa no
outro. Toda tela deriva de `xp_total` em vez de ler a coluna, então o número
fica certo mesmo num banco que ainda não rodou a migração.

**2. XP se perdia em corrida.** `atualizarXpELiga` fazia
`SELECT xp_total` → somar em JS → `UPDATE`. Duas listas fechadas ao mesmo
tempo (duas abas, ou o cliente reenviando) liam o mesmo valor e a segunda
sobrescrevia a primeira: o aluno via o XP na tela de resultado e ele não
chegava no ranking. Mesmo bug que `questly_registrar_estatistica_questao`
resolveu do lado de `questions`, mesma solução — a soma acontece dentro do
UPDATE, na RPC `questly_registrar_progresso` (`security definer`, `grant` só
pra `service_role`).

**3. Os contadores de questão desandavam.**
`questoes_total`/`acertos_total`/`questoes_semana` só eram incrementados ao
FECHAR uma lista. Quem respondia 30 questões e saía sem finalizar tinha 30
linhas em `question_attempts` e 0 no contador — e a home, que conta as
tentativas direto, mostrava um número enquanto o card do ranking, que lia o
contador, mostrava outro, **pro mesmo aluno**. `supabase_acertos_publicos.sql`
já tinha percebido a deriva e corrigido com um backfill único; backfill
conserta a foto, não a causa. Hoje os contadores de QUESTÃO são
**recomputados de `question_attempts`** dentro da mesma RPC, então a deriva se
conserta sozinha a cada fechamento. O XP segue incremental de propósito: ele
depende de combo/maestria/anti-farm do instante da resposta e **não é
reconstruível** a partir da linha de tentativa.

**4. O ranking da semana mostrava XP da semana passada.** A virada de semana
é preguiçosa (não há cron): `xp_semana` só zera quando o aluno abre o app
depois da segunda. Quem não entrou ainda carrega o XP da semana ANTERIOR na
coluna — e a aba "Semana" ordenava por ela sem conferir `semana_inicio`,
colocando no pódio pontos que não são desta semana. Toda leitura semanal
agora filtra `semana_inicio = segunda atual` (`xpDaSemanaVigente`), e o mesmo
filtro entrou no comparativo semanal da home (`dashboard-data.ts`), que media
o aluno contra semanas já encerradas.

**5. A posição era calculada de dois jeitos diferentes.** A linha da lista era
numerada pelo **índice do array** e a linha fixada de "Você" por uma
**contagem no banco** (`quantos têm XP maior`) — duas réguas pro mesmo aluno,
que discordavam em todo empate. Além disso `order by xp desc` sozinho deixa a
ordem dos empatados a cargo do Postgres, e ela muda entre execuções: como a
tela se atualiza sozinha a cada 3 min, dois alunos com o mesmo XP ficavam
trocando de lugar sem nada ter acontecido. Agora todo `order` desempata por
questões e por `id`, e a posição sai pronta do servidor por
`numerarPorCompeticao` (empate divide a mesma posição: 1, 2, 2, 4) — a mesma
convenção que `questlyDestinoNaLiga` usa pra decidir promoção, porque display
e consequência têm que sair da mesma régua. Os índices de desempate estão na
migração.

**6. "N alunos" contava contas vazias.** As listas globais agora só
consideram quem PONTUOU (`> 0`): uma conta recém-criada não é "o último
colocado", ela ainda não entrou na disputa. Quem não pontuou vê "—" e
"Responda questões pra entrar nesta lista" em vez de uma posição inventada.

### Teto de 100 em TODAS as listas

Pedido explícito, e também conserto: a **Divisão** vinha inteira, sem
`.limit()` — e sem limite explícito o PostgREST corta em 1.000 linhas **sem
avisar** (ver `supabase_escala_lancamento.sql`), então uma liga maior que isso
ficava com um pedaço invisível. Hoje `LIMITE_TOP = 100` vale pras três abas.

O detalhe que isso exigiu: **as zonas verde/vermelha não podem ser calculadas
sobre as 100 linhas exibidas**. Com 1.500 alunos na liga, "30% sobem" são 450
pessoas, não 30. `questlyDestinoNaLiga` foi refatorada em cima de
`questlyDestinoPorAgregado` (`lib/questly/liga.ts`), que recebe `n`, `ativos`
e `estritamenteAcima` em vez do array inteiro — a tela busca o Top 100 pra
mostrar e dois `COUNT` pra decidir as zonas. `estritamenteAcima` sai de graça
da posição por competição (quem divide a posição 7 tem 6 pessoas acima), e
vale pro Top 100 inteiro porque ninguém com XP maior pode estar fora dele.
Quem cai fora dos 100 continua vendo **a própria linha**, com a posição real
na liga inteira, fixada no topo — é justamente quando ela mais importa.

O pódio ganhou `slot` separado de `posicao`: `slot` é a vaga do pedestal
(1 = centro dourado), `posicao` é o dado do servidor. Com empate no topo, os
três pedestais mostram "1" — e é assim que a virada de semana vai tratá-los.

**O que continua fora do ranking, de propósito:** simulado, agenda/calendário
e vida acadêmica não pagam XP (ver as seções próprias) — nada disso mudou
aqui. ⚠️ **A parte "nem acendem ofensiva" desta frase valeu até 2026-09-22**:
o simulado passou a acender, e só ele — ver "A ofensiva passa a medir estudo"
abaixo. Agenda e vida acadêmica continuam fora, porque não são estudo.

## Fim da vergonha de errar (2026-09-22) — ranking privado + Caderno de Erros

Dois repasses que são o **mesmo problema**: alunos travando, deixando de
responder questão com medo de "parecer burro". O diagnóstico não era o
ranking em si (ele **sempre** ordenou por XP, e nenhuma lista jamais mostrou
taxa de acerto), era a combinação de uma vitrine pública de acerto com a
ausência de qualquer lugar útil pra onde o erro pudesse ir.

### 1. O ranking premia esforço, e a acertabilidade some da vitrine

O que expunha o aluno era a **carta** (`student-card-modal.tsx`):
`buscarCardUsuarioAction` aceita o id de QUALQUER aluno, e o card trazia
"412 acertos em 605 questões · 68%" pra quem clicasse numa linha do ranking.

- `CardUsuario.pctAcerto`/`acertosTotal` saíram do recorte público e
  renasceram em **`privado`**, preenchido só quando `ehDono` — e `ehDono` é
  resolvido pela sessão DENTRO da action, nunca por uma flag do cliente.
  Quando não é o dono, a coluna **nem é lida**: o número não pode existir no
  payload RSC da carta alheia;
- **`xpMedioPorQuestao` saiu junto** (era o "auge" do selo Pro). Acerto paga
  3/5/8 XP e erro paga uma fração — publicar a média é publicar a taxa de
  acerto com outro nome e uma casa decimal;
- o 4º "ataque" da carta era "Mira precisa" e virou **"Poder acumulado"** (XP
  da carreira). Os quatro ataques passam a ser quatro medidas de esforço, e
  nenhuma piora quando o aluno erra. A vaga não some: altura padrão pra todo
  mundo continua valendo;
- abaixo da carta, só pro dono, o **`PainelPrivado`** ("🔒 Só você vê"):
  esconder o número não resolve sozinho — o aluno precisa SABER que é
  privado, e o momento em que ele abre a própria carta é onde ele acredita;
- `supabase_ranking_privado.sql` fecha a porta dos fundos com
  `revoke select (acertos_total)`. **Ver o aviso de ordem no CLAUDE.md raiz:
  o código vai primeiro**, porque `select *` passa a falhar até pro dono da
  linha;
- **nenhum distintivo é de acerto** (sempre foram streak/volume/nível/liga,
  ver `lib/ranking/badges.ts`) — não havia o que mudar ali.

**A economia teve que acompanhar**, senão a tela prometia uma coisa e o
número entregava outra: `QUESTLY_XP_ERRO_FRACAO` foi de 0.2 pra **0.45** (a
tabela da decisão está no comentário de `lib/questly/shared.ts`), com
`QUESTLY_SEG_MIN_ESFORCO` = 12s como trava inseparável — erro instantâneo é
clique, não tentativa, e paga zero. E como isso criou motivo pra mentir no
relógio, `registrarRespostaAction` passou a **medir o ritmo no servidor**:
vale o menor entre o `tempoSeg` do cliente e o intervalo real desde a
resposta anterior da mesma lista. Mentir pra mais deixou de funcionar; mentir
pra menos ninguém quer.

**O selo, e por que NÃO é um "modo treino livre"** (`SeloPrivado`,
`components/questao/selo-privado.tsx`): um modo seguro opcional ensina
exatamente o contrário do que queremos — se existe uma sala segura, as outras
são inseguras. A plataforma inteira é a sala segura; o trabalho é dizer isso,
nos três momentos em que o medo aparece: cabeçalho da questão, tela de
resultado da lista e montagem da lista no Banco. Três, e nenhum a mais —
repetir demais vira ansiedade, que é o que estamos tratando.

### 2. Caderno de Erros (`/questoes/caderno`, `lib/caderno/`)

O destino que faltava pro erro. Uma linha de `caderno_erros` guarda **só a
escolha de guardar** (ver `supabase_caderno_erros.sql` e o parágrafo no
CLAUDE.md raiz); o resto é junção com quem já é dono da verdade.

**Captura — o gatilho custa um toque.** Três pontos:

1. **no feedback do erro** (`FeedbackArea`): cartão de largura inteira, o
   único elemento com cor de marca naquela faixa. Um clique resolve — sem
   modal, sem campo obrigatório; escrever o porquê é convite secundário,
   nunca pedágio. Guardado, o cartão **não some**: vira o estado verde, porque
   sumir tiraria do aluno a única confirmação de que a coisa aconteceu;
2. **pílula "Caderno"** na `QuestaoAcoes` (pra quem acertou e quer guardar
   assim mesmo, ou pra desfazer);
3. **fim da lista** (`GuardarErrosCard` no `ResultView`): "guardar as N desta
   lista". É o ponto de maior conversão do fluxo — o único momento em que o
   aluno pensa na lista como um todo. Os ids **não vêm do cliente**: a action
   lê as tentativas erradas da própria missão.

**A tela.** Cartão colapsado responde "o que eu errei mesmo?" (disciplina ·
tópico, enunciado em 2 linhas, `você marcou C` / `gabarito A`, o chip do
`motivo_erro`, "errei 2×"); expandir acontece **no lugar**, sem modal e sem
navegar. Filtros locais (em aberto / resolvidas / todas + disciplina): o
caderno é curto por natureza e trocar de aba não pode parecer lento.

Três decisões que valem manter:

- **"Refazer" é o que fecha o ciclo** — monta uma lista avulsa com as questões
  escolhidas (`refazerDoCadernoAction`, teto de 20) e volta pro Caderno pelo
  `voltarHref` quando ela termina. Não dá pra reaproveitar
  `criarListaDeQuestoes`: aquele helper sorteia por tópico, e aqui as questões
  são exatamente estas;
- **acertar no refazer não marca resolvido sozinho.** Um acerto pode ser
  sorte, e considerar aprendido é decisão do aluno — a tela só avisa "você
  acertou essa depois de guardar" e deixa o botão do lado;
- **"Resolvi" não faz o item sumir debaixo do dedo**: ele esmaece e tem 6s de
  desfazer.

**Acessos:** trilho da home (FORA do grupo de visões, porque navega — mesma
regra do botão "Carta"; e ao contrário do Carta ele **não some no celular**,
onde vira linha de largura inteira, pra não repetir o erro da aba "Matérias"
que só existia no desktop), com badge do que está esperando; terceiro cartão
de "Minha coleção" no hub de Questões; e o link a partir de "Tópicos que você
mais errou" na aba Desempenho — a ponte que faltava entre diagnóstico e ação.

**Nada do Caderno paga XP, acende ofensiva ou entra no ranking** — guardar,
anotar e marcar resolvido são organização, não estudo. Quem paga é refazer,
pela via normal. Mesma linha que agenda, metas e vida acadêmica já respeitam.

## Hábito e tempo de sessão (2026-09-22) — os dois vazamentos

Repasse pedido pelo dono: *"o aluno entra, faz uma ou duas questões e vai
embora"*. O diagnóstico depois de ler o código **não** foi "falta
gamificação" — já existem streak, combo de 4 degraus, marcos diários, ligas,
12 distintivos, timer de foco, Caderno de Erros, comentários por questão e um
motor bayesiano de memória. O problema era de encaixe, e dois defeitos
concretos explicavam a maior parte do sintoma.

**Nada aqui ressuscitou o motor de missões.** A régua usada o tempo todo:
*prescrever* ("estude isto hoje") continua proibido; *informar* ("faltam 5
questões pro marco de hoje") não é prescrição. Seguem intactas as regras de
que nada além de estudo real paga XP ou entra no ranking, e de que
acertabilidade é privada.

### 1. A ofensiva passa a medir estudo, não o ato de fechar lista

`atualizarStreakEDailyLog` (`lib/questly/economia.ts`) tinha **um único
chamador**: `finalizarMissaoAction`. Quem fazia um simulado inteiro, ou
respondia 25 questões e saía sem finalizar, registrava **zero** em
`daily_logs` — com as 25 tentativas gravadas em `question_attempts`. O número
mais formador de hábito do produto era o mais fácil de perder estudando de
verdade.

Dois gatilhos novos, nenhum deles pagando XP:

- **primeira questão do dia**, em `registrarRespostaAction`: a condição é
  `jaHoje === 0`, o valor que já era contado ali pro teto do grátis, então não
  custa consulta nova. Acende no máximo uma vez por dia, e é por isso que o
  `revalidatePath("/dashboard")` ao lado é barato — sem ele, o caso que este
  conserto existe pra cobrir (responder e sair sem fechar a lista) deixaria a
  home mostrando a ofensiva de ontem até o cache de rota vencer sozinho;
- **simulado concluído**, em `finalizarSimuladoAction` — e só no caminho de
  conclusão, nunca em `abandonarSimuladoAction`, senão "começar e sair"
  viraria atalho.

**Isto reverte uma regra documentada**, e a reversão é parcial de propósito.
A frase antiga juntava três coisas ("simulado, agenda/calendário e vida
acadêmica não acendem ofensiva") que não são a mesma: marcar uma falta ou
agendar um bloco **não é estudar** — e se acendesse, seria a rota de forja
mais barata já inventada neste banco. Um simulado **é** estudo, o mais difícil
que a plataforma oferece. Acender a ofensiva é registro de presença, não
economia: o simulado continua sem pagar XP, fora do ranking e fora do motor de
maestria. `atualizarStreakEDailyLog` já era idempotente no dia, então os dois
caminhos convivem sem contar duas vezes.

### 2. O fim da lista vira um começo (`lib/questao/continuar.ts`)

`ResultView` tinha **um CTA primário só: voltar**. O aluno terminava 10
questões no melhor estado possível — placar na tela, combo fresco, assunto
recém-mexido — e a única porta era a saída. O `GuardarErrosCard` já convertia
bem, mas ele *arquiva pra depois*; faltava o caminho de *fazer agora*.

Três continuações, calculadas no servidor **junto do placar** e devolvidas em
`FinalizarMissaoResultado.continuacoes` — a tela de resultado é o fim de uma
onda, não o começo de outra (regra das "ondas" acima):

1. **"Mais N de {disciplina}"** (`continuarPraticandoAction`) — mesmos
   assuntos, um toque, no lugar dos quatro cliques do wizard. As dificuldades
   são **derivadas** das questões da lista que acabou (um ou dois níveis
   distintos = o aluno filtrou e a continuação acompanha; três = não havia
   filtro), porque `missions` não guarda com que filtros nasceu;
2. **"Refazer os N erros"** (`refazerErrosDaListaAction`) — os ids saem das
   tentativas erradas da própria missão, lidas no servidor, mesma regra de
   `guardarErrosDaListaAction`: o cliente só diz QUAL lista. Refazer paga XP
   pela via normal, inclusive o ZERO de questão já tentada antes — o que torna
   isto estudo, e não rota de farm;
3. **"Seguir: {próximo assunto}"** (`praticarProximoTopicoAction`) — o
   primeiro tópico `pendente` da ementa que não estava na lista que acabou.
   Usa `classificarEstado` de `lib/trilha/trilha-data.ts` (exportada neste
   repasse) em vez de reimplementar a regra: duas versões e o botão começaria
   a discordar do mapa que o aluno vê em `/trilha`. **Não** reusa
   `iniciarPraticaTopicoAction`, que grava `recap_topico_id` — um recap tem
   consequência própria (passar de 70% marca `dominado`), e virar o capítulo é
   prática comum, não prova de que já se sabia o assunto.

Duas decisões de tela que valem manter:

- **o caminho de volta nunca some**, só deixa de ser o único destaque quando
  há continuação oferecida. Dois botões cheios da mesma cor na mesma dobra
  disputariam o olho, e o que o aluno mais quer neste segundo é seguir, não
  sair;
- **a continuação herda a origem** (`?de=`), como `aceitarDesafioAction` já
  fazia: encadear listas não pode ir apagando o caminho de volta.

`criarListaDeQuestoes` ganhou `despriorizarIds` — as questões recém-vistas vão
pro **fim** da fila do sorteio, não pra fora dela. Num tópico com 12 questões,
excluir as 10 que acabaram de sair devolveria uma lista de 2 (ou nenhuma):
repetir é chato, mas "não há mais nada aqui" logo depois de um clique em "mais
10" é pior.

### 3. O empurrão do marco, e o teto que o escondia

`questlyProximoMarco` (`lib/questly/marcos.ts`) só alimentava um overlay no
MEIO da lista. Na tela de resultado ele virou o motivo de não fechar a aba:
*"faltam 5 questões pro marco de hoje"* — um alvo de cinco minutos no instante
exato em que a sessão ia terminar. Marco continua sem pagar XP e fora de
ranking algum: é reconhecimento, não economia.

Isso expôs uma contradição que já existia: os marcos vão até **100
questões/dia** e `QUESTOES_DIA_FREE` é **30**, então o aluno grátis recebia um
alvo de 40 que o próprio teto torna inalcançável. `questlyProximoMarco` passou
a aceitar `tetoDoDia` (null = Pro) e devolve `null` pro marco fora de alcance;
`questlyMarcoBloqueadoPeloPlano` devolve o primeiro marco ACIMA do teto, e
**só depois que o aluno passou do último que cabe nele** — antes disso seria
propaganda no meio do caminho de quem mal começou. Os dois nunca aparecem
juntos. A mesma frase entrou na `LimiteDiarioView`, que já é a tela do teto
batido.

### 4. O XP da home parou de mentir (`missions.xp_pago`)

Ver `supabase_xp_pago.sql` e o parágrafo no `CLAUDE.md` raiz. Em resumo:
`xp_recompensa` é a estimativa gravada na criação e era o que a home somava; o
valor real vem de `recomputarPlacarMissao` e ia só pra `profiles.xp_total`.
Agora `finalizarMissaoAction` grava o valor pago de volta na linha da missão e
`dashboard-data.ts` lê `xp_pago ?? xp_recompensa`, refazendo a consulta sem a
coluna (42703) quando o banco ainda não rodou a migração.

### O que ficou de fora desta rodada (FEITO na rodada seguinte — ver a seção abaixo)

- **"Revisar hoje"**: `questlyRetencaoEfetiva` já sabe, todo dia, quais
  tópicos do aluno estão escorregando, e isso só aparece num badge dentro de
  `/trilha`. Um card na home + um botão que monta a lista dos tópicos em risco
  é o único gatilho diário que não é meta inventada — o conteúdo muda sozinho
  porque é um fato sobre o aluno, não uma cobrança;
- **domínio visível**: `aluno_topico_progresso.maestria` é uma probabilidade
  bayesiana real, atualizada a cada resposta, e **o aluno nunca a vê** — ele só
  vê cobertura, que mede quanto fez, não quanto sabe. Mostrar o delta no fim da
  lista ("Regra da cadeia: 34% → 61%") é a recompensa mais satisfatória que o
  produto pode dar. Atenção: é da mesma família da acertabilidade, que virou
  privada — pode aparecer pro dono, em nenhuma superfície pública;
- **"Minha turma"**: ranking recortado por `profiles.universidade` + mesma
  disciplina, derivável sem tabela nova, só com massa crítica (≥5 alunos);
- **escudo de ofensiva** e **PWA + Web Push** (hoje não há manifest, service
  worker nem push em lugar nenhum do repositório, e o único cron é o relatório
  semanal do Pro). O push só faz sentido DEPOIS do item 1 desta seção, porque é
  ele que permite silenciar a notificação de quem já estudou hoje.

## O backlog de hábito virou código (2026-09-22, segunda rodada)

As quatro ideias que a rodada anterior tinha deixado registradas como backlog.
Nenhuma delas ressuscita o motor de missões: a régua continua sendo
*informar* (um fato sobre o aluno) e nunca *prescrever* (um plano que ele não
pediu).

### 1. "Revisar hoje" na home (`lib/revisar/`)

O motor de aprovação já calculava, a cada resposta, a meia-vida da memória de
cada tópico (`aluno_topico_progresso.estabilidade` + `ultima_revisao` → R =
e^(-Δt/S)). Esse sinal — o mais acionável que a plataforma produz — só
aparecia num selo dentro de `/trilha`, tela que o aluno abre de vez em quando.

`carregarRevisarHoje` devolve os tópicos DELE (não o banco inteiro) que caíram
abaixo de `QUESTLY_RETENCAO_LIMIAR`, com questão disponível e já tocados;
`pulado` fica de fora, porque o aluno já disse que sabe. O cartão mostra até 3,
do pior pro menos pior, e um botão monta a lista cruzando os três
(`revisarAgoraAction` → `criarListaDeQuestoes`, `subject_id: null`, como o
Caderno já fazia).

Três decisões que valem manter:

- **os tópicos não vêm do cliente.** A action recarrega o diagnóstico do zero;
  o payload da tela viraria, senão, um jeito de montar lista com tópico
  arbitrário por fora dos filtros do Banco — e um cartão aberto desde ontem
  montaria uma revisão que já não faz sentido;
- **sem nada caindo, o cartão não existe.** Um cartão que se preenche à força
  todo dia vira ruído, e ruído diário é como o aluno aprende a ignorar a
  coluna inteira;
- **o número exibido é o da MEMÓRIA, não o de acerto.** Acertabilidade virou
  dado privado em 2026-09-22 e não volta pra tela por uma porta lateral.

Fica ACIMA do Mapa de progresso na coluna da direita: pendência vem antes de
retrospectiva.

### 2. Domínio visível (`medirEvolucaoDominio`, `TopicoTrilha.dominio`)

`aluno_topico_progresso.maestria` é uma probabilidade bayesiana de domínio
(BKT), atualizada a cada resposta desde `supabase_motor_maestria.sql` — e
**nenhuma tela jamais a mostrou**. O que o aluno via era COBERTURA ("5 de 5
questões"): quanto ele fez, não quanto ele sabe. Barra de presença, não de
habilidade — e só a segunda dá vontade de fechar mais um bloco.

Dois lugares, os dois só pro dono:

- **fim da lista**: "Regra da cadeia: 34% → 61%", com a barra animando de um
  valor ao outro (o movimento É a informação). O "depois" é lido do banco
  sempre; o "antes" é um snapshot tirado em `questao/page.tsx` quando a lista
  abriu, com o mesmo nível de confiança que `topicosMestreInicioIds` já tinha
  — é número de EXIBIÇÃO, não entra em XP, ranking nem em decisão de motor,
  então um cliente que mentisse ali só enganaria a si mesmo;
- **painel do tópico na trilha**: barra de Domínio ao lado da de Cobertura.

**A queda também aparece.** Uma lista ruim derruba a maestria, e o cartão diz
isso em vez de esconder: um número que só sobe não é medida, é troféu. Domínio
é da mesma família da acertabilidade — pode aparecer pro dono aqui e na
trilha, em NENHUMA superfície pública (carta, ranking, card de aluno).

Variação menor que 1 ponto percentual não é mostrada: "61% → 61%" só ensina
que o número não se mexe.

### 3. "Minha turma" (`lib/ranking/turma-data.ts`, aba nova em `/ranking`)

O ranking global põe o aluno de Cálculo II da UFF pra competir com gente de
outra universidade e outra ementa. Quem move um universitário de exatas é a
comparação com os 60 que vão sentar na MESMA P1.

Sem tabela nova: `profiles.universidade` + `subjects.materia_id` já existem e
são legíveis por qualquer autenticado sob RLS (é o que já faz o ranking
cross-user e a carta funcionarem). Uma turma por disciplina, com seletor —
é a matéria que define quem faz a mesma prova.

Regras herdadas, sem exceção: ordena por **XP** (esforço), nunca por
acertabilidade; posição por competição (empate divide a colocação); desempate
determinístico por questões e por id, senão a ordem dos empatados muda a cada
recarga; e `xpSemana` só conta com `semana_inicio` = segunda atual, porque a
virada de semana é preguiçosa e quem não abriu o app desde segunda ainda
carrega o XP da semana passada na coluna.

**Massa crítica (`TURMA_MINIMA` = 5):** abaixo disso a tela diz que a turma
está pequena em vez de desenhar um pódio de duas pessoas. Um ranking de dois
não é competição, é constrangimento.

**Limite de escala assumido:** a turma é montada em duas etapas (quem cursa a
matéria → quem desses é da minha universidade) porque não há índice cruzando
as duas tabelas. Barato na escala atual; quando uma matéria passar de alguns
milhares de matrículas, o caminho é uma view agregada, como
`vw_questoes_por_topico` fez com a contagem de questões.

### 4. Escudo de ofensiva (`supabase_escudo_ofensiva.sql`)

Um dia perdido deixa de zerar a ofensiva quando o aluno tem escudo: ele ganha
1 a cada `ESCUDO_A_CADA` (5) dias consecutivos e acumula no máximo
`ESCUDO_MAX` (2). A lógica inteira mora em `atualizarStreakEDailyLog`
(`lib/questly/economia.ts`), que já era o único lugar que mexe no streak.

Duas travas que impedem isto de virar "ofensiva de mentira", e nenhuma é
negociável sem refazer a conta:

- **escudo NUNCA se compra** — nem com XP, nem com Pro, nem com convite.
  Ofensiva comprada não mede mais estudo nenhum, e a ofensiva é justamente o
  número que a rodada anterior acabou de fazer medir estudo de verdade;
- **o consumo é VISÍVEL**: a home mostra "1 escudo usado" por até 2 dias
  depois. Esconder faria o número da ofensiva virar afirmação falsa — e este
  banco já gastou uma migração inteira (`supabase_ranking_fiel.sql`)
  consertando número que mentia na tela.

O escudo cobre o dia em que a vida aconteceu, não o mês em que o aluno
desistiu: dois dias seguidos perdidos continuam zerando tudo (a regra exige
ter estudado ANTEONTEM). As colunas entraram no trigger
`questly_proteger_colunas_profile` junto com plano/XP/liga/streak — sem isso,
qualquer aluno logado se daria escudos infinitos do console do browser com a
chave anon.

A frescura do aviso é decidida no SERVIDOR (`DashboardData.escudoUsadoRecente`):
"que dia é hoje" não é pergunta pra se fazer durante o render, e a regra
`react-hooks/set-state-in-effect`/pureza do React 19 recusa `Date.now()` ali.

### 5. PWA + Web Push — o canal que não existia

Até aqui, se o aluno não abrisse o site sozinho, o produto não tinha como
falar com ele: nem manifest, nem service worker, nem push, e o único cron era
o relatório semanal (só Pro). A retenção D1 dependia inteiramente de memória
humana.

- **`app/manifest.ts`** torna a Expectrum instalável. Ganhar ícone na tela
  inicial é um gatilho diário passivo que não gasta notificação nenhuma — e no
  **iOS 16.4+ Web Push só funciona em PWA instalado**, então sem o manifest
  metade da base ficaria fora do lembrete por limitação de plataforma.
  `start_url` é `/dashboard` e não `/`, porque a raiz é a landing de
  marketing: quem instalou já é aluno.
- **`public/sw.js` NÃO faz cache de nada, de propósito.** Um SW que serve
  resposta guardada é a forma mais fácil de o aluno ver XP, ofensiva ou
  questão desatualizados — o mesmo problema que este repositório já consertou
  uma vez, agora por uma porta que o servidor nem consegue invalidar. Ele só
  existe, recebe push e leva o aluno pra tela certa.
- **`/sw.js` precisou entrar em `ARQUIVOS_PUBLICOS` do `proxy.ts`**: sem
  isso levava 307 pro `/login`, e o navegador recusa registrar um SW cuja
  resposta não seja o script. Falha silenciosa — `register()` reclama no
  console e mais nada. Os ícones já passavam pelo prefixo `/icon`.
- **Os ícones PNG do manifest** (`/icone-192.png`, `/icone-512.png`) são
  gerados por `ImageResponse` a partir da MESMA `MarcaOg` do favicon e do
  ícone do iOS — mexer na marca atualiza os quatro de uma vez.
- **A permissão nunca é pedida na carga da página.** Quem pede é o
  `ConviteLembrete`, no fim de uma lista, e só pra quem já tem ofensiva de 2+
  dias: "não perca sua sequência" só é argumento pra quem tem uma sequência.
  Permissão negada no navegador NÃO se pede de novo, então ela só é gasta
  quando existe motivo pra dizer sim. Dispensado uma vez, não volta
  (`localStorage`, lido por `useSyncExternalStore` — o mesmo padrão e o mesmo
  motivo da preferência de recolhimento em `perfil-bar.tsx`).
- **O cron (`/api/cron/lembrete-ofensiva`, diário às 21h UTC)** manda no
  máximo um por dia, **silenciado pra quem já estudou hoje** (`daily_logs`
  responde isso antes de qualquer envio) e só pra quem tem sequência viva
  (estudou ontem, streak ≥ 2). Repare que ele **só é possível depois** do
  conserto da rodada anterior: enquanto `daily_logs` só registrava quem
  FECHAVA lista, o aluno que respondeu 25 questões e saiu receberia um "você
  não estudou hoje" — a mensagem mais fácil de fazer alguém desinstalar um
  app. Endpoint morto (404/410) é apagado na hora, senão a tabela vira
  cemitério e o número de "alunos com lembrete" mente.
- **Não é canal de marketing.** O dia em que este cron mandar propaganda é o
  dia em que ele para de funcionar pra todo mundo.
- **Degrada inteiro sem as chaves VAPID**: sem elas o cartão não aparece, o
  convite não aparece e o cron responde 503. O PWA continua funcionando (não
  depende delas). Dependência nova: `web-push`.

## Gêmeo da Banca (2026-09-22) — `lib/banca/perfil.ts`

**Primeira fatia de uma feature nova, e só a matemática: não há tela ainda.**
A tese é que uma prova real é uma AMOSTRA da distribuição geradora de um
professor — e o acervo de `supabase_provas_oficiais.sql` já tem amostra
suficiente pra descrever essa distribuição com número em vez de impressão.
Medido no corpus de `listas_questoes/gerado/` (43 provas, 621 questões):

- **fis2-uff-P1**, 7 edições: `A Lei de Gauss` e `O Campo Elétrico` em **7 de
  7**, `A Lei de Coulomb` em 7 de 7 com 2–3 questões, `Potencial Elétrico` em
  3 de 7. A P1 **é** ~6 + ~5 + ~3.
- **fis2-uff-P3**, 7 edições: `O Campo Magnético` 7/7 (média 7,1), `Indução`
  7/7, `Oscilações e CA` 7/7. Sete tópicos da matéria **nunca** caíram nessa
  prova — e "o que nunca cai" é metade do valor do perfil.
- **fis1-uff-P2**, 21 edições (2014.1 → 2026.1): o caso que obriga o
  decaimento de recência. `Rotação de Corpo Rígido` caiu em 9 das 21 edições
  (média simples 1,8) e a média **ponderada** é 0,2 — o professor parou de
  cobrar, e uma média simples continuaria prevendo rotação por anos.

Decisões do módulo que não devem ser afrouxadas:

- **É puro e devolve `null`.** Sem Supabase, constantes calibráveis exportadas
  no topo, na convenção de `motor-aprovacao.ts`. Abaixo de `BANCA_MIN_EDICOES`
  (3) não existe perfil — a mesma disciplina de `questlyCalcularMetricas`, que
  se recusa a inventar porcentagem. Slot sem amostra some da lista; ausência é
  resposta honesta, perfil vazio não é.
- **Recência com meia-vida de 3 semestres** (`BANCA_MEIA_VIDA_SEMESTRES`).
  Uma banca muda, e a média simples é a forma óbvia de o perfil envelhecer sem
  ninguém perceber.
- **A previsão FECHA.** As questões previstas por tópico somam exatamente o
  tamanho previsto da prova, por alocação de maior resto
  (`distribuirPorMaiorResto`, Hamilton — a mesma família que o `rotina-engine`
  legado usava pra repartir minutos), com desempate explícito (maior resto →
  maior peso → menor índice). Arredondar cada tópico por conta daria uma prova
  de 16 questões com cara de 15, e ordem instável a cada recarga é a classe de
  bug que `supabase_ranking_fiel.sql` gastou uma migração consertando.
- **Confiança cai por amostra pequena E por prova de tamanho instável**
  (`BANCA_CV_TAMANHO_INSTAVEL`). A P2 de Física 1 varia de 7 a 20 questões:
  prever "14" ali é média de coisas diferentes, e o perfil sai como `media`,
  nunca `alta`.
- **Descreve a BANCA, nunca o aluno.** Não é recomendação de estudo e não
  reabre a porta que "Fim do motor de missões" fechou.

`scripts/perfil-banca.ts` (`cd web && npx tsx scripts/perfil-banca.ts`) roda o
módulo sobre o corpus real e confere três coisas com resposta conhecida: o
retrato da P1 de Física 2, o fechamento da soma em todos os slots e a
honestidade da confiança. Mesmo papel de `scripts/rede-sintetica.ts` — provar
que a máquina funciona antes de existir tela. Ele lê os JSONs de origem (e não
o banco) porque o corpus em disco tem mais edições do que a migração
conseguiu casar; em produção a fonte é `questions.prova_codigo`.

**Próximas fatias, não feitas:** tela pública "Como cai a P1" (é conteúdo de
aquisição — a rota `/provas/` já existe e é indexada), estratégia `preditiva`
no montador de simulados (sorteio do banco respeitando a distribuição
prevista, sem gerar nada), arquétipos derivados de `subtopico` (texto livre,
quase único por questão — precisa ser clusterizado offline e revisado) e, só
no fim, geração sintética com dupla verificação e revisão humana. Questão
gerada não entra no banco sem passar pela fila de `/importar`.

### Fatia 2 — a prova prevista e a folha no molde da banca (2026-09-22)

O perfil virou produto, em duas partes que não dependem de IA nenhuma.

**A prova prevista** (`/simulados/prevista`, `lib/banca/banca-data.ts` +
`lib/banca/actions.ts`). O montador comum pergunta ao aluno quais tópicos ele
quer; aqui ninguém pergunta nada — a composição vem do perfil medido daquele
slot. `montarSimuladoPrevistoAction` reparte as vagas por tópico
(`cotasPorTopico`), ajusta ao que o banco tem (`ajustarCotasAoBanco`: um tópico
com cota 6 e 4 questões devolve 2 vagas pros mais cobrados, senão a prova sai
com 13 questões em vez de 15) e escolhe **guloso por déficit de dificuldade**,
pra o conjunto bater o mix que a banca aplica em vez de virar um bloco de
difíceis porque o banco tem mais dessas. Inédita na frente de já vista, como o
montador comum — prioridade, não filtro.

- **Nada é gerado**: as questões são reais, do banco. A previsão decide a
  COMPOSIÇÃO. Risco de alucinação: zero.
- **`prova_codigo` fica NULL** e o slot vai em `simulados_aluno.prova_prevista`
  (`supabase_prova_prevista.sql`, aditiva, RLS herdada). Preencher
  `prova_codigo` colocaria exames sintéticos — e mutuamente diferentes — dentro
  de `vw_ranking_provas_oficiais`, que só faz sentido entre quem fez exatamente
  as mesmas questões. O insert **degrada sozinho** num banco sem a migração
  (42703 → repete sem a coluna): a prova é montada, só perde o molde.
- A tela mostra o ESPELHO antes do botão (composição medida, "caiu em 7 de 7",
  "nunca caiu nesta prova") — o valor é entender a prova; o simulado é a
  consequência. `ROTULO_CONFIANCA`/`comoLer` impedem a leitura de adivinhação:
  amostra pequena sai como "leia como indício".
- A porta no hub aparece quando há acervo (`provasOficiais > 0`), **sem
  consulta nova** — se as disciplinas daquele aluno não tiverem amostra, quem
  diz isso é a própria tela.
- `dentroDoLimiteSemanal` e `questoesJaVistas` saíram de `simulados/actions.ts`
  pra `simulados/limite.ts` e `simulados/vistas.ts`: num arquivo `"use server"`
  toda função exportada vira endpoint, e a alternativa era duplicar uma trava
  de plano — que é a forma garantida de as duas divergirem.

**A folha no molde da banca** (`variante="uff"`,
`components/imprimir/folha-uff.tsx`). Pedido do dono: o PDF do simulado tem que
sair **idêntico à prova impressa da UFF**, trocando só a identidade. Réplica
conferida contra `provas_uff/` (P1 de 2023.1 e P3 de 2024.1): cabeçalho em
caixa de três células (selo · título · "NOTA DA PROVA"), instruções numeradas
à esquerda, cartão-resposta óptico à direita (Nome/Matrícula/Prof/Turma, 20
linhas A–E, marcas fiduciais nos cantos), tracejado de corte, **formulário** e
miolo **em duas colunas** serifadas com "1ª questão -" dentro do parágrafo.

- **A identidade é Expectrum.** A geometria é a mesma; brasão, instituto e
  assinatura são nossos. Reproduzir a marca da universidade numa folha que não
  é dela seria se passar por ela — regra que já valia no molde `prova`.
- **O formulário é transcrito, nunca inventado** (`lib/imprimir/formulario.ts`).
  Slot sem transcrição conferida entra com `fisicas: []` e a folha **omite a
  seção**: um formulário plausível mas diferente quebra exatamente a promessa
  de ser igual à prova. Hoje há Física 2 P1 completo, e constantes + integrais
  (idênticas nas duas provas conferidas) pros demais slots.
- **Duas colunas em DOIS lugares, e os dois são obrigatórios.** No gerador
  (`lib/imprimir/gerar-pdf.ts`), bloco com `data-pdf-coluna="1"` sai com metade
  da largura útil e FLUI — enche a esquerda, passa pra direita, vira a página;
  bloco sem o atributo se comporta exatamente como antes. **E no DOM**, via
  `column-count: 2` no `<ol>` do miolo. O segundo não é estética: o gerador
  fotografa o bloco e ESCALA a imagem pra largura de destino, então um bloco
  que ocupa a folha inteira no DOM, desenhado em meia coluna, sai com a letra
  pela METADE do tamanho — foi exatamente o defeito do primeiro PDF gerado, e
  o visualizador não mostrava porque ali o bloco tinha a largura certa. Com
  `column-count`, o `<li>` já nasce com a largura de uma coluna e a escala
  fecha: (664px − gola)/2 sobre 87,5mm dá os mesmos ~3,65 px/mm de um bloco
  inteiro sobre 182mm. A gola do DOM vai em **porcentagem** (7/182 = 3,85%)
  pra acompanhar `GOLA_COLUNA_MM` em qualquer largura de render — **mexeu num,
  mexa no outro**. De quebra a tela passou a mostrar o que o PDF vai ser, com
  a mesma ordem de leitura (desce a esquerda, depois a direita).
- **As questões começam em página nova** (`data-pdf-pagina="nova"` no primeiro
  bloco do miolo): a capa é a folha que o professor recolhe — é pra isso que
  serve o tracejado de corte.
- **As instruções do molde `uff` são as da prova, não as do chamador.** A
  página de impressão passa instruções escritas pro molde `prova` ("a prova tem
  13 questões e duração de 1h30") e, somadas às que a capa gera a partir desta
  prova, saíam duplicadas na folha. `topoColunas` guarda onde a região de colunas começa
  na página (a coluna da direita recomeça ali, não na margem, senão subiria por
  cima da capa), e `avancar()` é o único ponto em que "próxima coluna" e
  "próxima página" se confundem. **Um bloco de largura inteira depois de blocos
  em coluna força página nova** — é o que faz o gabarito cair certo no fim.
- O molde entra sozinho quando a linha sabe QUAL prova do semestre ela é: por
  `prova_codigo` (prova real reaplicada) ou por `prova_prevista`. Sem isso,
  segue o molde `prova` de antes.
- `Gabarito` virou componente próprio em `folha-prova.tsx` — os três moldes
  usam o mesmo, porque conferir resposta é conferir resposta em qualquer folha.

### Fatia 3 — questões autorais no estilo da banca (2026-09-22)

"Escrever uma questão parecida com a da UFF" é pedido vago até alguém dizer
**parecida em quê**. `scripts/briefing-banca.ts` responde com dado medido:
dado um curso e um slot, ele lê as provas reais e escreve um dossiê em
`listas_questoes/gerado/briefings/<curso>-<slot>.md` com a composição, o mix de
dificuldade, o **inventário de arquétipos** (os `subtopico` das provas — é ali
que o estilo mora: não é "questão de Gauss", é "indução em casca esférica
condutora com carga puntiforme no centro") e **exemplares íntegros** dos mais
recentes, que respondem o que instrução nenhuma responde (comprimento do
enunciado, números redondos ou feios, I/II/III ou valor direto).

Gerados hoje: `fis2-p1` (7 edições), `fis2-p2` (8), `fis2-p3` (7) e `fis1-p2`
(21 edições, confiança média — a prova varia de 7 a 20 questões).

**Nenhuma questão é gerada por máquina dentro do app, e isso é decisão, não
limitação.** A autoria segue o fluxo que este repositório já tem — briefing +
agente + `/importar` (ver `AGENTE_QUESTOES_AUTORAIS.md`, par do
`AGENTE_PROVA_UFF_FIS2.md`) — porque ali já existem a detecção de duplicata, o
LaTeX renderizado e o olho humano. Uma questão com gabarito errado destrói a
confiança no banco inteiro, e o aluno não tem como saber que o erro é nosso.

Regras do manual que valem como contrato de dados:

- **`instituicao: "Expectrum"`** e **`prova_codigo` ausente**. Questão nossa
  catalogada como prova da universidade é mentira no banco — e vazaria pro
  acervo público de provas antigas;
- questão que o autor não consegue resolver é descartada, e cada distrator tem
  que ser um **erro plausível e nomeável**, nunca número aleatório;
- seguir a composição e o mix do briefing: um lote só de difíceis desequilibra
  o sorteio da prova prevista, que tenta bater o mix real.

Aprovadas, entram no sorteio normal e na prova prevista daquele slot — a
previsão sorteia por tópico e dificuldade, **não por origem**.

## Conventions carried over from the legacy app

Same as root `CLAUDE.md`: Portuguese identifiers/UI strings, `questly`-prefixed shared function names in `lib/questly/*`, same XP/mastery/spaced-repetition/league constants and formulas (ported faithfully, not reinvented). Don't re-derive the algorithms from scratch — read the corresponding `js/*.js` file in the repo root first, the Next.js version is meant to be a faithful port unless a change was explicitly requested (the dashboard trail redesign and the 2026-09-16 mission/modular overhaul above are the deliberate exceptions).
