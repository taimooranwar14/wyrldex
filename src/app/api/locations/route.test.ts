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
    expect(body.locations).toHaveLength(29);
  });

  it("filters by category", async () => {
    const { body } = await get("?category=Hotel");
    expect(slugs(body)).toEqual(["dominion-hotel", "hotel-dixon", "ocean-view-hotel", "starlet-motel"]);
  });

  it("searches name, summary, category and region, ignoring case", async () => {
    expect(slugs((await get("?q=GELLHORN")).body)).toEqual(["pawn-and-gun", "port-gellhorn", "starlet-motel", "uncle-jacks-liquor"]);
    expect(slugs((await get("?q=wetland")).body)).toEqual(["grassrivers"]);
    expect(slugs((await get("?q=nightlife")).body)).toEqual(["effluvia", "nine1nine"]);
  });

  it("requires every word to match, in any field", async () => {
    expect(slugs((await get("?q=west%20coast")).body)).toEqual(["port-gellhorn"]);
    expect(slugs((await get("?q=keys%20marina")).body)).toEqual(["brians-marina"]);
  });

  it("matches singular names when searching a plural", async () => {
    expect(slugs((await get("?q=vice%20hotels")).body)).toEqual(["dominion-hotel", "hotel-dixon", "ocean-beach", "ocean-view-hotel", "vice-beach"]);
    expect(slugs((await get("?q=theme%20park")).body)).toEqual([]);
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
