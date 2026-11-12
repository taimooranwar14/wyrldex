# Engineering Journal

## 2026-11-11 — M0: Project foundation

**Built:** Next.js 16.4.6 + React 19.3 + Tailwind 4.3 scaffold, branded landing page, private GitHub repo.

**Decisions:** modular monolith ([ADR-0001](adr/0001-modular-monolith.md)); npm; feature-first folders; repo-local git identity using the GitHub noreply email (repo will go public at launch).

**Learned / gotchas:**
- npm package names must be lowercase, so `create-next-app .` failed inside the `Wyrldex/` folder. Scaffolded into a lowercase temp folder and moved the files in.
- Next 16 removed `next lint`; `npm run lint` now calls the ESLint CLI directly.
- Next 16 generates `AGENTS.md` and ships version-matched docs in `node_modules/next/dist/docs/`.
- Tailwind v4 has no `tailwind.config.js`: design tokens live in `globals.css` under `@theme`, and each `--color-x` becomes `bg-x` / `text-x` / `border-x`.
- The default `.gitignore` pattern `.env*` also hides `.env.example`; added `!.env.example`.

## 2026-11-11 — M1: Dashboard shell

**Built:** responsive shell (top bar, primary nav, map preview, detail panel, disclaimer footer), skip link, global focus ring, sample data with a `verification` field.

**Decisions:** mobile layout stacks with CSS only; real drawers wait for the interactive map. Sidebar stays a server component and receives `activeHref` as a prop (zero client JS); switch to `usePathname()` once it moves into a shared layout.

**Learned / gotchas:**
- Next.js components are server components by default; `"use client"` is opt-in and ships JS to the browser.
- The server-rendered HTML also contains an RSC payload, so text can appear twice in `curl` output.

## 2026-11-11 — M2: Interactive map

**Built:** original hand-drawn SVG coastline, pin buttons, category filter chips, selection → detail panel, empty state.

**Decisions:** one small client component (`Explorer`) owns state; map and panel receive props. Derived values (`visible`, `selected`, `categories`) are computed each render, never stored. Pins are HTML `<button>`s over the SVG, positioned in %, so they get keyboard support for free. Map fits its box via a size container query (`cqw`/`cqh`).

**Learned / gotchas:**
- React has no `emit`: children call a callback prop (`onSelect`) that the parent passes in.
- Headless Chrome enforces a minimum window width (~500px); test phone widths with a 390px iframe or DevTools device mode.

## 2026-11-12 — M3: Real backend

**Built:** Postgres in Docker, Prisma schema + first migration, idempotent seed, `GET /api/locations` with Zod validation, page reading from the DB, loading/error/empty states, 17 Vitest tests (unit + integration). See [ADR-0002](adr/0002-data-layer.md).

**Learned / gotchas:**
- npm's `latest` tag is just a label: `prisma@latest` was an 8.0 RC. Pin exact versions.
- `@types/node@^20` (scaffold default) conflicted with Vitest 5; types should match the Node you run (24).
- Prisma 7: no auto `.env` loading, `migrate dev` no longer runs `generate` or the seed, driver adapter required.
- Next 16 `error.tsx` receives `retry` (not `reset`). Always check the bundled docs.
- Prisma `contains` → SQL `LIKE`: `%` and `_` are wildcards and must be escaped. Found by trying odd inputs with curl, now covered by a test.
- Built with the DB stopped to prove CI won't need one.

## 2026-11-12 — M4: Search wired to the API

**Built:** search box → `useLocationSearch` hook → `GET /api/locations?q=` → Zod → SQL → pins. Debounced (250 ms), stale requests aborted, loading/no-match/error states announced via `role="status"`. `server-only` guards on `db.ts` and `repository.ts`; README "Where code runs" table.

**Learned / gotchas:**
- `useEffect` cleanup runs before the next effect and on unmount: the right place to cancel timers and in-flight requests.
- Prefer deriving over `setState` inside an effect: the empty-query case returns `null` results without touching state.
- `server-only` needs no package in Next; Vitest needs an alias to Next's no-op build of it.
- Verified in headless Chrome via the DevTools Protocol: typing "pier" sends exactly one request.

## 2026-11-12 — M5: Continuous integration

**Built:** GitHub Actions workflow: `npm ci` → lint → typecheck → `prisma migrate deploy` on a throwaway Postgres service container → seed → tests → build. Read-only token, 15-minute timeout.

**Learned / gotchas:**
- `migrate deploy` (CI/production) only applies existing migrations; `migrate dev` (local) also creates new ones and may reset data.
- Dry-ran the whole pipeline locally from a fresh `git clone` against an empty database before pushing: cheaper than debugging in CI.
