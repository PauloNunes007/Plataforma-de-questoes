# CLAUDE.md (web/)

This is the **Next.js rewrite** of Questly — read this before exploring the folder structure by hand. The root `CLAUDE.md` documents the legacy static HTML/CSS/JS app (still at the repo root, untouched, kept as reference during migration). This file documents the new app in `web/`.

## Status: all 5 planned steps are done

The rewrite followed a user-approved 5-step plan, one commit (or a few) per step, oldest first:

1. **Setup** (`c4e3dd5`) — Next.js 16 (App Router, TS, Tailwind v4), shadcn/ui, Framer Motion, `@supabase/ssr`, design tokens.
2. **Auth & layout** (`72d84f1`) — `/login`, route guards in `src/proxy.ts`, global `Sidebar` + `(protected)` layout.
3. **Dashboard** (`8d4633a`) — `/dashboard`. Ported `mission-engine.js`/`rotina-engine.js`/`liga.js` → `src/lib/questly/*.ts`.
4. **Missions/questions** (`9cd3eb6`) — `/questao`, KaTeX via own `MathText` component, Server Actions for every DB write.
5. **Config & import** (`e42d8d7`, `e9e7e91`, `53dce7c`) — `/onboarding` (iOS-style wizard, added mid-session, not in the original 5-step list — see memory), `/configuracoes`, `/importar`.

**Not built** (never asked for): `/ranking`, `/disciplinas` (free-practice picker). Sidebar/dashboard links to them currently 404 — that's expected, not a bug.

Full narrative/decisions history: check this session's memory (`questly_nextjs_rewrite` and related notes) if using Claude Code's memory system — it has the *why* behind each decision (e.g. the dashboard trail was deliberately redesigned away from a Duolingo-style path into "BossSiegeMeter").

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
  components/
    <feature>/*.tsx           one folder per feature, mostly "use client"
    questao/math-text.tsx     KaTeX renderer, reused by importar's preview too
    ui/*.tsx                  shadcn primitives
  lib/
    supabase/{client,server,middleware}.ts   SSR client setup
    questly/*.ts              pure-ish ports of the legacy js/*.js engines (mission-engine,
                               rotina-engine, liga, chance-aprovacao, shared helpers) — take a
                               SupabaseClient as a parameter instead of a module-level global
    <feature>/actions.ts       "use server" Server Actions, one file per feature, all DB writes live here
  proxy.ts                    Next 16 renamed middleware.ts → proxy.ts; exported fn must be named `proxy`
```

**Pattern**: every feature (auth, onboarding, configuracoes, questao, importar) has its own `lib/<feature>/actions.ts` with `"use server"` functions — client components never call Supabase directly, they call these actions. Server Components (`page.tsx` files) do the initial data fetch directly via `lib/supabase/server.ts`'s `createClient()`.

**Design tokens**: Tailwind v4 CSS-first config in `src/app/globals.css` — gamification palette as `--color-questly-*` (green/blue/orange/red/gold/purple, each with `-light`/`-dark` variants, dark-mode-aware). Fonts: Fredoka (`font-heading`), Nunito (`font-sans`), JetBrains Mono (`font-mono`), loaded via `next/font` in `app/layout.tsx`.

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

## Conventions carried over from the legacy app

Same as root `CLAUDE.md`: Portuguese identifiers/UI strings, `questly`-prefixed shared function names in `lib/questly/*`, same XP/mastery/spaced-repetition/league constants and formulas (ported faithfully, not reinvented). Don't re-derive the algorithms from scratch — read the corresponding `js/*.js` file in the repo root first, the Next.js version is meant to be a faithful port unless a change was explicitly requested (the dashboard trail redesign is the one deliberate exception).
