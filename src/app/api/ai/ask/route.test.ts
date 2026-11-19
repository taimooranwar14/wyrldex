import { afterEach, describe, expect, it, vi } from "vitest";
import { askLocations } from "@/features/ai/ask";
import { POST } from "./route";

vi.mock("@/features/ai/ask", () => ({ askLocations: vi.fn() }));

const post = (body: unknown) =>
  POST(new Request("http://localhost/api/ai/ask", { method: "POST", body: JSON.stringify(body) }));

afterEach(() => vi.unstubAllEnvs());

describe("POST /api/ai/ask", () => {
  it("does not exist unless AI_MODE=local", async () => {
    vi.stubEnv("AI_MODE", "");
    expect((await post({ question: "hi" })).status).toBe(404);
    expect(askLocations).not.toHaveBeenCalled();
  });

  it.each([{}, { question: "  " }, { question: "x".repeat(301) }])("rejects body %o", async (body) => {
    vi.stubEnv("AI_MODE", "local");
    expect((await post(body)).status).toBe(400);
  });

  it("returns 503 when the model is unreachable", async () => {
    vi.stubEnv("AI_MODE", "local");
    vi.mocked(askLocations).mockRejectedValueOnce(new TypeError("fetch failed"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await post({ question: "hi" })).status).toBe(503);
  });
});
