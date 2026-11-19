import { describe, expect, it } from "vitest";
import { describeStep } from "./trace-text";

describe("describeStep", () => {
  it("explains a tool request in plain words", () => {
    const text = describeStep({ kind: "model", ms: 900, content: "", toolCalls: [{ name: "findConnections", arguments: { name: "Lucia" } }] });
    expect(text.detail).toBe("Decided to look up who and what is linked to “Lucia”.");
  });

  it("reports results and refusals", () => {
    expect(describeStep({ kind: "tool", ms: 9, name: "searchLocations", arguments: { q: "hotel" }, slugs: ["a", "b"] }).detail).toContain("2 places");
    expect(describeStep({ kind: "tool", ms: 1, name: "searchLocations", arguments: { q: "x" }, slugs: [] }).detail).toContain("no matches");
    expect(describeStep({ kind: "tool", ms: 1, name: "dropTables", arguments: {}, error: "Unknown tool" })).toMatchObject({ title: "Blocked a request", ok: false });
  });

  it("copes with arguments that are not what the model was asked for", () => {
    const text = describeStep({ kind: "model", ms: 1, content: "", toolCalls: [{ name: "searchLocations", arguments: { q: 42 } }] });
    expect(text.detail).toBe("Decided to search the map for something unclear.");
  });
});
