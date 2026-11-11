# ADR-0002: Data layer — PostgreSQL + Prisma 7, no service layer yet

- Status: Accepted
- Date: 2026-11-12

## Context
v0.1 needs real persistence and a validated API, on €0, runnable locally and in CI.

## Decision
- **PostgreSQL 18 in Docker Compose**, bound to `127.0.0.1` only. Password lives in a gitignored `.env`.
- **Prisma 7.10.1, pinned.** npm's `latest` tag for `prisma` pointed at an 8.0 release candidate; pinning keeps CLI and client on the same stable version.
- **Driver adapter** `@prisma/adapter-pg` (required by Prisma 7), with a 5 s connection timeout so a down DB fails fast.
- **No dotenv / tsx**: Node 24's `process.loadEnvFile()` and native TypeScript run the config and seed. Generated client uses `importFileExtension = "ts"`; `tsconfig` enables `allowImportingTsExtensions` (safe because `noEmit`).
- **Layers:** route handler (HTTP + Zod) → repository (Prisma). A service layer is added when real business rules appear (e.g. AI tool permissions), not before.
- **Page reads the repository directly**; the HTTP API exists for browser search and, later, AI tools.
- **Request-time data:** `await connection()` inside `<Suspense>`, so builds/CI never need a DB. The route is Partial Prerender: static shell + streamed explorer.

## Consequences
- Dev needs Docker running. Tests in `route.test.ts` need a seeded DB (CI will run a Postgres service container).
- Unknown world slugs return an empty list, not 404.
- Generated client is gitignored and rebuilt by `postinstall`.
