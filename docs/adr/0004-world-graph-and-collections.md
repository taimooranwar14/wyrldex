# ADR-0004: World Graph data and browser-only Collections

- Status: Accepted
- Date: 2026-11-19

## Context
The World Graph and Collections are the next demo features. The graph needs relationships with provenance; collections need somewhere to store user lists, but the public demo has no accounts, and v0.1 keeps the AI read-only.

## Decision
- **Graph data:** two tables, `Character` and `Connection` (character ↔ location). Every connection has its own `note`, `verification` and `sourceUrl`, because a link can be less certain than either end (official names, community-reported link). No generic node/edge store until a second relationship type exists.
- **Graph building is a pure function** (`features/graph/build.ts`): character → its places; place → its characters and parent region; region → its places; default → characters and regions. The component only draws.
- **AI:** a second whitelisted, read-only tool, `findConnections({ name })`. Tools now live in one table; `Object.hasOwn` guards the lookup so names like `constructor` are refused.
- **Collections in localStorage**, via `useSyncExternalStore` (server snapshot empty, so hydration matches). Stored data is parsed defensively. The user creates and fills every list by clicking, including "Save as collection" after an AI answer, so a human approves every write.
- **Suggested questions follow the selection** and come from one pure module shared with the recorder, so every suggestion in public mode has a real recording.

## Consequences
- Collections do not sync across devices or browsers; moving them to the database needs accounts first.
- Graph links are sparse (5) until more sourced connections are found; the graph says "No sourced links yet" rather than inventing any.
- Adding data changes suggestions, so replays must be re-recorded (`node scripts/record-replays.mts`).
