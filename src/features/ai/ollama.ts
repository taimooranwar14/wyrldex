import "server-only";
import { z } from "zod";

// Server-side only: Ollama must never be reachable from the browser or the public internet.
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen3:8b";

// The model's reply is untrusted input like any other: check its shape before using it.
const messageSchema = z.object({
  role: z.literal("assistant"),
  content: z.string(),
  tool_calls: z.array(z.object({ function: z.object({ name: z.string(), arguments: z.unknown() }) })).optional(),
});

export type AssistantMessage = z.infer<typeof messageSchema>;
export type ChatMessage =
  | { role: "system" | "user"; content: string }
  | AssistantMessage
  | { role: "tool"; tool_name: string; content: string };

export async function chat(messages: ChatMessage[], tools?: object[]): Promise<AssistantMessage> {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // think: false skips Qwen3's long reasoning output; turn on if tool choice proves unreliable.
    body: JSON.stringify({ model: OLLAMA_MODEL, messages, tools, stream: false, think: false }),
    signal: AbortSignal.timeout(60_000), // first call loads the model into memory (~10 s on an M1 Pro)
  });
  if (!res.ok) throw new Error(`Ollama returned HTTP ${res.status}`);
  return messageSchema.parse((await res.json()).message);
}
