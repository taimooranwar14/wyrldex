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
