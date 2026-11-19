// Unit test: Ollama and the database are mocked, so this runs in CI without either.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listLocations } from "@/features/locations/repository";
import { askLocations } from "./ask";
import { chat, type AssistantMessage } from "./ollama";

vi.mock("./ollama", () => ({ chat: vi.fn(), OLLAMA_MODEL: "test-model" }));
vi.mock("@/features/locations/repository", () => ({ listLocations: vi.fn() }));

const pier = { slug: "pier", name: "Pier", category: "Landmark", x: 1, y: 2, summary: "A pier", verification: "SAMPLE" };
const toolCall = (name: string, args: unknown): AssistantMessage => ({
  role: "assistant",
  content: "",
  tool_calls: [{ function: { name, arguments: args } }],
});
const answer = (content: string): AssistantMessage => ({ role: "assistant", content });

beforeEach(() => {
  vi.mocked(chat).mockReset();
  vi.mocked(listLocations).mockReset().mockResolvedValue([pier] as never);
});

describe("askLocations", () => {
  it("runs a validated search and returns a grounded answer with a trace", async () => {
    vi.mocked(chat).mockResolvedValueOnce(toolCall("searchLocations", { q: " pier " })).mockResolvedValueOnce(answer("The Pier."));

    const result = await askLocations("Where is the pier?");

    expect(listLocations).toHaveBeenCalledWith({ world: "sample-world", limit: 10, q: "pier" });
    expect(result).toMatchObject({ mode: "live-local", model: "test-model", answer: "The Pier.", locations: [pier] });
    expect(result.trace.map((step) => step.kind)).toEqual(["model", "tool", "model"]);
    expect(result.trace[1]).toMatchObject({ name: "searchLocations", slugs: ["pier"] });
  });

  it.each([
    ["an unknown tool", toolCall("dropTables", {}), "Unknown tool"],
    ["invalid arguments", toolCall("searchLocations", { q: "" }), "Invalid arguments"],
  ])("refuses %s without touching the database", async (_, reply, error) => {
    vi.mocked(chat).mockResolvedValueOnce(reply).mockResolvedValueOnce(answer("Sorry."));

    const result = await askLocations("hi");

    expect(listLocations).not.toHaveBeenCalled();
    expect(result.trace[1]).toMatchObject({ kind: "tool", error });
    expect(result.locations).toEqual([]);
  });

  it("stops after three model calls and offers no tools on the last one", async () => {
    vi.mocked(chat).mockResolvedValue(toolCall("searchLocations", { q: "pier" }));

    const result = await askLocations("loop forever");

    expect(chat).toHaveBeenCalledTimes(3);
    expect(vi.mocked(chat).mock.calls[2][1]).toBeUndefined();
    expect(result.trace.filter((step) => step.kind === "model")).toHaveLength(3);
  });
});
