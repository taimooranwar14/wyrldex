import { describe, expect, it } from "vitest";
import { DEFAULT_WORLD_SLUG, locationQuerySchema } from "./schema";

describe("locationQuerySchema", () => {
  it("fills in defaults for an empty query", () => {
    expect(locationQuerySchema.parse({})).toEqual({ world: DEFAULT_WORLD_SLUG, limit: 50 });
  });

  it("turns the limit string from the URL into a number and trims text", () => {
    expect(locationQuerySchema.parse({ limit: "10", q: "  pier " })).toMatchObject({ limit: 10, q: "pier" });
  });

  it.each([
    { limit: "500" },
    { limit: "0" },
    { limit: "abc" },
    { limit: "2.5" },
    { q: "x".repeat(101) },
    { q: "   " },
    { world: "../etc" },
    { world: "Sample World" },
  ])("rejects %o", (input) => {
    expect(locationQuerySchema.safeParse(input).success).toBe(false);
  });
});
