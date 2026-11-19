import "server-only";
import { z } from "zod";
import { findConnections } from "@/features/graph/repository";
import { listLocations, type LocationSummary } from "@/features/locations/repository";
import { DEFAULT_WORLD_SLUG, locationQuerySchema } from "@/features/locations/schema";
import { chat, OLLAMA_MODEL, type ChatMessage } from "./ollama";

// Model calls per question. The last call gets no tools, so it must answer instead of looping.
const MAX_ROUNDS = 3;

const SYSTEM_PROMPT = `You help people explore a map of Leonida, the state where Grand Theft Auto VI is set.
Always call a tool before answering:
- searchLocations finds places by keyword.
- findConnections finds which characters are linked to a place, or which places are linked to a character (pass a name such as "Lucia").
Answer in one or two sentences using only the names, summaries and notes in the results.
Do not add history, atmosphere or any detail the results do not state.
If a search finds nothing, you may try once more with a different keyword. If still nothing matches, say so.
Never invent locations or characters.`;

type ToolResult = { locations: LocationSummary[]; result: unknown } | { error: "Unknown tool" | "Invalid arguments"; message: string };

// The whitelist. Every tool is read-only and validates the model's arguments before touching the database.
const tools: Record<string, { description: string; parameters: object; run: (args: unknown) => Promise<ToolResult> }> = {
  searchLocations: {
    description: "Search map locations by name, category, region or description.",
    parameters: {
      type: "object",
      properties: {
        q: { type: "string", description: "One to three keywords; every word must match. For example 'hotel' or 'hotel vice city'." },
      },
      required: ["q"],
    },
    async run(raw) {
      const args = locationQuerySchema.pick({ q: true }).required().safeParse(raw);
      if (!args.success) return { error: "Invalid arguments", message: "Pass { q: string } with 1-100 characters." };
      const rows = await listLocations({ world: DEFAULT_WORLD_SLUG, limit: 10, q: args.data.q });
      const result = rows.map(({ name, category, region, summary, verification }) => ({ name, category, region, summary, verification }));
      return { locations: rows, result };
    },
  },
  findConnections: {
    description: "Find sourced links between characters and places, by character or place name.",
    parameters: {
      type: "object",
      properties: { name: { type: "string", description: "A character or place name, for example 'Lucia' or 'Key Lento'." } },
      required: ["name"],
    },
    async run(raw) {
      const args = z.object({ name: z.string().trim().min(1).max(100) }).safeParse(raw);
      if (!args.success) return { error: "Invalid arguments", message: "Pass { name: string } with 1-100 characters." };
      const links = await findConnections(DEFAULT_WORLD_SLUG, args.data.name);
      const result = links.map((link) => ({
        character: link.character.name,
        place: link.location.name,
        region: link.location.region,
        note: link.note,
        verification: link.verification,
      }));
      return { locations: links.map((link) => link.location), result };
    },
  },
};

const TOOL_DEFINITIONS = Object.entries(tools).map(([name, { description, parameters }]) => ({
  type: "function",
  function: { name, description, parameters },
}));

export type TraceStep =
  | { kind: "model"; ms: number; content: string; toolCalls: { name: string; arguments: unknown }[] }
  | { kind: "tool"; ms: number; name: string; arguments: unknown; slugs?: string[]; error?: string };

export async function askLocations(question: string) {
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: question },
  ];
  const trace: TraceStep[] = [];
  const found = new Map<string, LocationSummary>();

  for (let round = 1; ; round++) {
    const lastRound = round === MAX_ROUNDS;
    let start = performance.now();
    const reply = await chat(messages, lastRound ? undefined : TOOL_DEFINITIONS);
    const toolCalls = reply.tool_calls?.map((call) => call.function) ?? [];
    trace.push({ kind: "model", ms: elapsed(start), content: reply.content, toolCalls });
    messages.push(reply);

    if (lastRound || toolCalls.length === 0) {
      return { mode: "live-local" as const, model: OLLAMA_MODEL, answer: reply.content, locations: [...found.values()], trace };
    }

    for (const call of toolCalls) {
      start = performance.now();
      // Object.hasOwn, not `in`: a model asking for "constructor" must not reach Object.prototype.
      const outcome: ToolResult = Object.hasOwn(tools, call.name)
        ? await tools[call.name].run(call.arguments)
        : { error: "Unknown tool", message: `There is no tool called "${call.name}".` };

      let content: string;
      if ("error" in outcome) {
        content = `Error: ${outcome.error}. ${outcome.message}`;
        trace.push({ kind: "tool", ms: elapsed(start), ...call, error: outcome.error });
      } else {
        outcome.locations.forEach((row) => found.set(row.slug, row));
        content = JSON.stringify(outcome.result);
        trace.push({ kind: "tool", ms: elapsed(start), ...call, slugs: outcome.locations.map((row) => row.slug) });
      }
      messages.push({ role: "tool", tool_name: call.name, content });
    }
  }
}

export type AskResult = Awaited<ReturnType<typeof askLocations>>;

const elapsed = (start: number) => Math.round(performance.now() - start);
