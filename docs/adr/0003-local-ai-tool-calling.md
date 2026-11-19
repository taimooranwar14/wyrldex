# ADR-0003: Local AI — direct Ollama API, one whitelisted read-only tool

- Status: Accepted
- Date: 2026-11-19

## Context
The brief requires one real LLM integration at €0, developer-run only, with schema-validated tool calls and no path for the model to run arbitrary queries.

## Decision
- **Direct `fetch` to Ollama `/api/chat`** (`stream: false`, `think: false`), no AI SDK. One provider does not justify an abstraction; the `AIProvider` interface waits until a second provider exists.
- **Model `qwen3:8b`**, configurable via `OLLAMA_MODEL` / `OLLAMA_URL`. Ollama is reached server-side only, on `127.0.0.1`.
- **Whitelist of one tool, `searchLocations({ q })`.** Arguments go through the same Zod schema as `GET /api/locations`, then the existing repository. World and limit are fixed by the server, not the model. Unknown tools and invalid arguments are refused and reported back to the model as tool errors.
- **The model's reply is validated with Zod** before use; it is untrusted input.
- **Max 3 model calls per question**; the last call is sent without tools, so it must answer.
- **`AI_MODE=local` gate:** without it `POST /api/ai/ask` returns 404, so a public deploy cannot reach any model.
- **Response carries a trace** (model steps, tool args, result slugs, timings) labelled `mode: "live-local"`, for the M7 replay inspector.

## Consequences
- No streaming: the user waits ~2–4 s (warm), ~13 s on the first call while the model loads.
- `q` is a substring search, so the tool description asks for one short keyword; multi-word phrases match poorly.
- Tests mock Ollama and the repository, so CI needs neither.

## Addendum (2026-11-19, M7): public replay
- The page passes `liveAI = AI_MODE === "local"` to the client. Without it, the Ask AI panel only offers preset questions and replays `src/features/ai/replays.json`.
- Replays are produced by `scripts/record-replays.mts`, which calls the live endpoint. They are never hand-written or edited, and are labelled "Recorded demo · no live inference" with the recording date and model.
- Replays play at the recorded step timings (each step capped at 2.5 s), so the demo shows real latency.
- Recording exposed two real problems, both fixed at the source before the final recording: multi-word queries missed ("west coast" vs "western coast", now every word is matched separately), and the model embellished answers (the prompt now forbids details not in the results).
