// Integration test: real route → Zod → Prisma → Postgres. Needs `npm run db:up` and `npx prisma db seed`.
// shortcut: reads the seeded dev database, so editing dev data breaks these; use a separate test DB once tests write data.
import { describe, expect, it } from "vitest";
import { GET } from "./route";

async function get(query: string) {
  const res = await GET(new Request(`http://localhost/api/locations${query}`));
  return { status: res.status, body: await res.json() };
}

const slugs = (body: { locations: { slug: string }[] }) => body.locations.map((loc) => loc.slug).sort();

describe("GET /api/locations", () => {
  it("returns every seeded location by default", async () => {
    const { status, body } = await get("");
    expect(status).toBe(200);
    expect(body.locations).toHaveLength(8);
  });

  it("filters by category", async () => {
    const { body } = await get("?category=Beach");
    expect(slugs(body)).toEqual(["coral-keys", "sunset-boardwalk"]);
  });

  it("searches name and summary, ignoring case", async () => {
    expect(slugs((await get("?q=LIGHTHOUSE")).body)).toEqual(["lighthouse-point"]);
    expect(slugs((await get("?q=lagoon")).body)).toEqual(["mangrove-overlook"]);
  });

  it("treats SQL wildcard characters as plain text", async () => {
    expect((await get("?q=%25")).body.locations).toEqual([]);
    expect((await get("?q=_")).body.locations).toEqual([]);
  });

  it("respects the limit", async () => {
    expect((await get("?limit=3")).body.locations).toHaveLength(3);
  });

  it("returns an empty list for an unknown world", async () => {
    expect((await get("?world=no-such-world")).body.locations).toEqual([]);
  });

  it("rejects invalid input with 400 and says which field is wrong", async () => {
    const { status, body } = await get("?limit=500");
    expect(status).toBe(400);
    expect(body.issues).toHaveProperty("limit");
  });
});
