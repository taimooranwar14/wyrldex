// Run with `npx prisma db seed`. Idempotent: upserts by slug, so it is safe to run again.
import { existsSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { DEFAULT_WORLD_SLUG } from "../src/features/locations/schema.ts";

if (existsSync(".env")) process.loadEnvFile();
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const world = {
  slug: DEFAULT_WORLD_SLUG,
  name: "Sample World",
  description: "Fictional demo world for a GTA VI-inspired explorer. Not game data.",
};

// Fictional placeholder records, invented for layout work. Not GTA VI facts.
const locations = [
  { slug: "skyline-strip", name: "Skyline Strip", category: "District", x: 0.56, y: 0.43, summary: "A dense nightlife district by the bay." },
  { slug: "harbor-lights-pier", name: "Harbor Lights Pier", category: "Landmark", x: 0.55, y: 0.586, summary: "A neon-lit boardwalk on the inner bay." },
  { slug: "old-port-warehouses", name: "Old Port Warehouses", category: "District", x: 0.43, y: 0.257, summary: "A converted dockside quarter in the north." },
  { slug: "lighthouse-point", name: "Lighthouse Point", category: "Landmark", x: 0.83, y: 0.364, summary: "A lone beacon on the eastern island." },
  { slug: "mangrove-overlook", name: "Mangrove Overlook", category: "Nature", x: 0.32, y: 0.63, summary: "A wetland viewpoint beside the inland lagoon." },
  { slug: "cypress-trail", name: "Cypress Trail", category: "Nature", x: 0.15, y: 0.43, summary: "A raised boardwalk through western swampland." },
  { slug: "sunset-boardwalk", name: "Sunset Boardwalk", category: "Beach", x: 0.5, y: 0.83, summary: "A long beach promenade on the southern coast." },
  { slug: "coral-keys", name: "Coral Keys", category: "Beach", x: 0.27, y: 0.936, summary: "A chain of tiny islands trailing off the southern tip." },
].map((loc) => ({ ...loc, summary: `${loc.summary} Placeholder content.`, verification: "sample" as const }));

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
