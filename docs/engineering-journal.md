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

## 2026-11-19 — M6: Local AI tool call

**Built:** `POST /api/ai/ask` → Ollama (`qwen3:8b`) → whitelisted `searchLocations` tool → Zod → existing repository → grounded answer + trace. Gated by `AI_MODE=local`. 9 new unit tests with Ollama mocked. See [ADR-0003](adr/0003-local-ai-tool-calling.md).

**Decisions:** launch slipped from Nov 19 to ~Nov 26 so the release keeps the AI demo story.

**Learned / gotchas:**
- Tool calling is a request, not an execution: the model returns `tool_calls`, and our server decides whether to run them.
- Ollama returns tool `arguments` as a parsed object, not a JSON string (unlike some cloud APIs).
- A loop cap alone still ends without an answer; sending the last call without tools forces one.
- The first call after idle took ~13 s, 10 s of which was loading the model; warm calls take ~1–2 s per model step.
- macOS clears `$TMPDIR`: the session handoff file there was gone. Keep handoffs in the repo or memory.

## 2026-11-19 — Real data + M7: Ask AI panel, Execution Inspector, recorded replay

**Built:** fictional sample world replaced by Leonida's six officially named regions (`verification: official`, new `sourceUrl` column). Ask AI panel with preset questions (plus free text in live mode), Execution Inspector showing each model/tool step with args, validation result and timing, map pins highlighted from the AI's results. Public mode replays traces recorded from the real model.

**Verified:** GTA VI released 2026-11-19 (PS5, Xbox Series X|S). Rockstar has named six regions: Vice City, Leonida Keys, Grassrivers, Port Gellhorn, Ambrosia, Mount Kalaga National Park. Rockstar publishes no fan-site content licence; we use facts and names only, our own words and our own map art, with source links and the non-affiliation disclaimer.

**Learned / gotchas:**
- Recording real traces is a test: it surfaced a search bug and a hallucination that unit tests with mocks could not.
- A small model embellishes even with "answer only from results"; naming what not to add ("history, atmosphere") fixed it.
- Next 16 allows one `next dev` per project folder; test the public mode with `next build && next start` on another port.
- Port 3000 is used by another local project; this app runs on 3123 (dev) / 3124 (prod check).

## 2026-11-19 — M8: UI polish (local MVP)

**Built:** map art (land gradient, glowing coastline, LEONIDA label, compass), pin names on hover/keyboard focus, pulsing pins for AI results (off under reduced motion), glass panels, About page, original SVG favicon (replaces the scaffold's), title template, nav without "Soon" items, README screenshots.

**Decisions:** no hosting provider yet, so the MVP ships as a local app; public deploy and OG image wait until there is a URL. Mobile keeps the stacked layout instead of a bottom sheet.

**Learned / gotchas:**
- Code passed to the DevTools Protocol's `Runtime.evaluate` runs in the page, not Node: build the string in Node first.
- `app/icon.svg` is a file convention: Next adds the `<link rel="icon">` itself.

## 2026-11-19 — Community data + map v2

**Built:** 22 community places (trailers and official screenshots, via third-party guides) with a `region` column; search covers region and simple plurals. Neon night map: glowing highways, city lights clipped to land, barrier-island beach strip, region labels, teardrop pins with category icons, callout cards, zoom/pan with level of detail (dots below 2×, icon pins above). Violet palette, facts grid in the detail panel, totals in the Execution Inspector. Replays re-recorded.

**Decisions:** the user's concept mockup was the reference for layout and mood only; Rockstar's logo, screenshots and character art stay out. Community items need a source page and a known region; fan-invented district names and leaks are excluded. Website text claiming "Rockstar confirmed" still counts as `community` until we can check it on Rockstar's own site.

**Learned / gotchas:**
- `Math.sin/cos` can differ slightly across JS engines; generated art rendered on server and client should use plain arithmetic to avoid hydration mismatches.
- The dev server's cached Prisma client (kept on `globalThis` across hot reloads) does not see new columns: restart `next dev` after `prisma generate`.
- The React Compiler lint (`react-hooks/refs`) flags handlers built inside array literals during render; write the buttons out instead.
- Several guide sites block automated fetches (403/405); record which sources were actually read.

## 2026-11-19 — World Graph, Collections, smarter map and questions

**Built:** `Character` and `Connection` tables (Jason, Lucia; 5 sourced links), World Graph (radial, keyboard-accessible), Collections in localStorage with "Save as collection" after an AI answer, a second AI tool `findConnections`, context-aware suggested questions (shared with the recorder so all 20 are recorded), map camera in fractions with wheel/double-click zoom, fit-to-results, centre-on-select and Esc. See [ADR-0004](adr/0004-world-graph-and-collections.md).

**Verified:** 47 tests; headless Chrome flows for the Lucia demo, saving a collection, focusing a character, zooming a region, at desktop and phone width (page width 390 = viewport, no horizontal scroll).

**Learned / gotchas:**
- The brief's headline demo, "Find locations connected to Lucia", now runs for real: model → `findConnections({name: "Lucia"})` → 2 sourced places.
- Recording again caught a wrong answer: told to use "one keyword", the model searched `hotel` and called a Port Gellhorn motel a Vice City hotel. Letting it pass `hotel vice city` (search already ANDs words) fixed it.
- Repeated React keys leave stale elements in the DOM; derived lists used as keys must be de-duplicated at the source.
- "Adjust state during render" (compare with a stored previous prop) moves the map camera when results change, without an effect and without the set-state-in-effect lint error.
- A CSS grid with no column template sizes to content; `grid-cols-1` (`minmax(0, 1fr)`) stops long content forcing horizontal scroll on phones.

## 2026-11-19 — Readable trace, full-space map

**Built:** the execution trace now reads as plain steps with checkmarks ("Understood the question → Checked and looked it up → Wrote the answer"); raw calls, arguments and IDs sit behind a "Technical details" toggle. The map fills all available space: the frame paints the sea and the 10:7 art is centred inside with CSS container units; the camera converts art positions to frame fractions (`artBox`/`toFrame`). The graph shows at most 6 links and says how many more exist.

**Decisions:** keep the trace for everyone, because showing *how* an answer was grounded is the product's point, but write it for non-developers first.

**Learned / gotchas:**
- Two Tailwind position classes on one element (`relative` built in, `absolute` passed from outside) do not follow class order; CSS source order decides. Components should fill their parent (`size-full`) and let the parent own position.
- Laying out the art with CSS (not measured JS) means the first paint is right; the JS measurement is only needed for camera maths.

## 2026-11-19 — Plain wording, real full screen, smoke test

**Built:** descriptions now describe the place, not the media it came from; labels are "Confirmed by Rockstar", "Spotted by fans" and "Demo data". The trace's technical view is developer-only (live mode). Map controls have clear icons and a real full-screen mode (fixed overlay, Esc exits). `scripts/smoke.mjs`: a dependency-free browser smoke test over the DevTools Protocol, 20 checks covering search, filters, the AI replay, collections, graph, regions, Esc, zoom, full screen, About, console errors and horizontal scroll.

**Decisions:** full screen as a CSS overlay, not the Fullscreen API, because iPhone Safari does not support the API for pages. Database enum values (`official`/`community`) stay; only the labels changed.

**Learned / gotchas:**
- The old ⤢ "reset view" icon looked like a full-screen button. Icons must match what they do.
- All four first smoke failures were bugs in the test: typing before React hydrated (wait for the `__reactFiber` key), `innerText` applying CSS `uppercase` (use `textContent`), an exact-zoom assumption, and deleting Chrome's profile before it exited.
