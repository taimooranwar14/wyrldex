# ADR-0001: Modular monolith on Next.js

- Status: Accepted
- Date: 2026-11-11

## Context
Wyrldex v0.1 ships on 2026-11-19 with one developer working 4–5 h/day and a €0 budget. It needs a UI, a validated backend API, PostgreSQL, and a local-only LLM integration.

## Decision
One Next.js 16 (App Router) app, strict TypeScript, Tailwind v4, npm. Backend logic lives in Route Handlers inside the same app.

Dependencies flow one way:

```
UI → Route Handler (HTTP + Zod) → Service (rules) → Repository (only Prisma user) → PostgreSQL
                                        ↘ AI adapter → Ollama (dev only, server-side)
```

Code is grouped **by feature** (`src/features/<name>/`), with the layers as files inside each feature. Folders are created when they get their first file, not up front.

## Consequences
- One deploy, one repo, one language: fast to build and easy to explain.
- Layer boundaries are a convention, not enforced by the runtime. Code review has to keep handlers thin and Prisma out of components.
- If a part ever needs to scale independently (e.g. AI inference), the service/adapter seam is where it would split off.

## Alternatives rejected
- Separate frontend + Express/Nest backend: two deploys and duplicated types, with no benefit at this size.
- Microservices / queues / agent frameworks: complexity with no requirement driving it.
