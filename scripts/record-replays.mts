// Records real traces from the live local model for the public replay mode.
// Usage: start the app with AI_MODE=local and Ollama running, then `node scripts/record-replays.mts`
// (set APP_URL if the app is not on port 3000). Never hand-edit the output: public replays must be genuine recordings.
import { existsSync, writeFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { allQuestions } from "../src/features/ai/suggestions.ts";

if (existsSync(".env")) process.loadEnvFile();
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

// The same inputs the UI uses to suggest questions, so every suggestion has a recording.
const [places, people, links] = await Promise.all([
  db.location.findMany({ select: { slug: true, name: true, category: true, region: true } }),
  db.character.findMany({ select: { name: true } }),
  db.connection.findMany({ select: { location: { select: { slug: true } } } }),
]);
await db.$disconnect();
const questions = allQuestions(places, new Set(links.map((l) => l.location.slug)), people);
console.log(`Recording ${questions.length} questions…`);

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
