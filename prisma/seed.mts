// Run with `npx prisma db seed`. Idempotent: upserts by slug, so it is safe to run again.
import { existsSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { DEFAULT_WORLD_SLUG } from "../src/features/locations/schema.ts";

if (existsSync(".env")) process.loadEnvFile();
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const world = {
  slug: DEFAULT_WORLD_SLUG,
  name: "Leonida",
  description: "The state where Grand Theft Auto VI is set. Region names from Rockstar's official site; map positions are illustrative.",
};

// Region names are official (Rockstar's GTA VI site). Summaries are our own words, kept to what Rockstar has shown.
// x/y are positions on Wyrldex's original stylized map, not in-game coordinates.
const sourceUrl = "https://www.rockstargames.com/VI";
const locations = [
  { slug: "vice-city", name: "Vice City", category: "City", x: 0.58, y: 0.7, summary: "Leonida's signature city, on the east coast." },
  { slug: "leonida-keys", name: "Leonida Keys", category: "Islands", x: 0.27, y: 0.94, summary: "A chain of islands at the state's southern tip." },
  { slug: "grassrivers", name: "Grassrivers", category: "Nature", x: 0.4, y: 0.8, summary: "Sprawling wetland wilderness in the south." },
  { slug: "port-gellhorn", name: "Port Gellhorn", category: "City", x: 0.1, y: 0.3, summary: "A faded port town on the western coast." },
  { slug: "ambrosia", name: "Ambrosia", category: "Inland", x: 0.31, y: 0.52, summary: "A region at the centre of the state." },
  { slug: "mount-kalaga-national-park", name: "Mount Kalaga National Park", category: "Nature", x: 0.42, y: 0.15, summary: "Forested parkland in the north of the state." },
].map((loc) => ({ ...loc, verification: "official" as const, sourceUrl }));

// The fictional placeholder world from M1–M6 is retired; its rows cascade-delete with it.
await db.world.deleteMany({ where: { slug: "sample-world" } });

const { id: worldId } = await db.world.upsert({ where: { slug: world.slug }, update: world, create: world });

for (const loc of locations) {
  await db.location.upsert({
    where: { worldId_slug: { worldId, slug: loc.slug } },
    update: loc,
    create: { ...loc, worldId },
  });
}

console.log(`Seeded ${locations.length} locations into "${world.slug}".`);
await db.$disconnect();
