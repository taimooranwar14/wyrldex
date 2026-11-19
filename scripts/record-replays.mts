// Records real traces from the live local model for the public replay mode.
// Usage: start `npm run dev` with AI_MODE=local and Ollama running, then `node scripts/record-replays.mts` (set APP_URL if the app is not on port 3000).
// Never hand-edit the output: public replays must be genuine recordings.
import { writeFileSync } from "node:fs";

const questions = ["Which hotels are in Vice City?", "Where can I go out at night?", "What is on the west coast?", "Is there a theme park?"];
const replays = [];

for (const question of questions) {
  const res = await fetch(`${process.env.APP_URL ?? "http://localhost:3000"}/api/ai/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error(`"${question}" failed with HTTP ${res.status}: ${await res.text()}`);
  replays.push({ question, recordedAt: new Date().toISOString(), result: await res.json() });
  console.log(`Recorded: ${question}`);
}

writeFileSync("src/features/ai/replays.json", JSON.stringify(replays, null, 2) + "\n");
