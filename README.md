# Wyrldex

[![CI](https://github.com/taimooranwar14/wyrldex/actions/workflows/ci.yml/badge.svg)](https://github.com/taimooranwar14/wyrldex/actions/workflows/ci.yml)

**Intelligence for Virtual Worlds.** An AI-native virtual-world exploration platform. First experience: a GTA VI-inspired World Explorer.

> Independent, unofficial fan project. Not affiliated with, endorsed by, or sponsored by Rockstar Games or Take-Two Interactive. "Wyrldex" is a provisional name.

## Status
| Feature | Status |
|---|---|
| Project scaffold + branding | ✅ Done |
| Dashboard shell | ✅ Done |
| Interactive map + filters | ✅ Done |
| PostgreSQL + locations API (`GET /api/locations`) | ✅ Done |
| Search UI wired to API | ✅ Done |
| CI (lint, typecheck, tests with Postgres, build) | ✅ Done |
| Local AI, replay | 📋 Planned |

## Quickstart
Requires Node.js 24+ and Docker.

```bash
npm install
cp .env.example .env    # then set a password in both lines
npm run db:up           # start Postgres (localhost only)
npx prisma migrate dev  # create tables
npx prisma db seed      # load sample locations
npm run dev             # http://localhost:3000

npm run lint && npm run typecheck && npm test
```

## Where code runs
Next.js decides per file, not per folder. A file with `"use client"` (and everything it imports) also runs in the browser; everything else stays on the server. Files that must never reach the browser start with `import "server-only"`, which fails the build if a client file imports them.

| Runs | Files |
|---|---|
| Server only | `app/page.tsx`, `app/layout.tsx`, `app/api/**/route.ts`, `features/locations/repository.ts` 🔒, `lib/db.ts` 🔒, `components/sidebar.tsx`, `components/top-bar.tsx` |
| Browser too | `features/explorer/*` (`explorer.tsx` is the client boundary), `components/detail-panel.tsx`, `app/error.tsx` |
| Shared | `features/locations/schema.ts` (Zod rules), `lib/brand.ts` |

🔒 = guarded by `server-only`.

## Docs
- Architecture decisions: [`docs/adr/`](docs/adr/)
- Engineering journal: [`docs/engineering-journal.md`](docs/engineering-journal.md)
