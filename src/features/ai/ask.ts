import "server-only";
import { listLocations, type LocationSummary } from "@/features/locations/repository";
import { DEFAULT_WORLD_SLUG, locationQuerySchema } from "@/features/locations/schema";
import { chat, OLLAMA_MODEL, type ChatMessage } from "./ollama";

// Model calls per question. The last call gets no tools, so it must answer instead of looping.
const MAX_ROUNDS = 3;

const SYSTEM_PROMPT = `You help people explore a map of Leonida, the state where Grand Theft Auto VI is set.
Always call searchLocations before answering. Answer in one or two sentences using only the names and summaries in the results.
Do not add history, atmosphere or any detail the results do not state.
If a search finds nothing, you may try once more with a different keyword. If still nothing matches, say so.
Never invent locations.`;

// The whitelist: the only tool the model may request. It is read-only and goes through the same Zod schema as the public API.
const TOOLS = [
  {
    type: "function",
    function: {
      name: "searchLocations",
      description: "Search map locations by name or description.",
      parameters: {
        type: "object",
        properties: { q: { type: "string", description: "One short keyword, for example 'pier' or 'beach'." } },
        required: ["q"],
      },
    },
  },
];
const searchArgsSchema = locationQuerySchema.pick({ q: true }).required();

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
    const reply = await chat(messages, lastRound ? undefined : TOOLS);
    const toolCalls = reply.tool_calls?.map((call) => call.function) ?? [];
    trace.push({ kind: "model", ms: elapsed(start), content: reply.content, toolCalls });
    messages.push(reply);

    if (lastRound || toolCalls.length === 0) {
      return { mode: "live-local" as const, model: OLLAMA_MODEL, answer: reply.content, locations: [...found.values()], trace };
    }

    for (const call of toolCalls) {
      start = performance.now();
      let content: string;
      if (call.name !== "searchLocations") {
        content = `Error: unknown tool "${call.name}".`;
        trace.push({ kind: "tool", ms: elapsed(start), ...call, error: "Unknown tool" });
      } else {
        const args = searchArgsSchema.safeParse(call.arguments);
        if (!args.success) {
          content = "Error: invalid arguments. Pass { q: string } with 1-100 characters.";
          trace.push({ kind: "tool", ms: elapsed(start), ...call, error: "Invalid arguments" });
        } else {
          const rows = await listLocations({ world: DEFAULT_WORLD_SLUG, limit: 10, q: args.data.q });
          rows.forEach((row) => found.set(row.slug, row));
          content = JSON.stringify(
            rows.map(({ name, category, region, summary, verification }) => ({ name, category, region, summary, verification })),
          );
          trace.push({ kind: "tool", ms: elapsed(start), ...call, slugs: rows.map((row) => row.slug) });
        }
      }
      messages.push({ role: "tool", tool_name: call.name, content });
    }
  }
}

export type AskResult = Awaited<ReturnType<typeof askLocations>>;

const elapsed = (start: number) => Math.round(performance.now() - start);
