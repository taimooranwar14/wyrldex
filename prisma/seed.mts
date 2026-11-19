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
const officialSource = "https://www.rockstargames.com/VI";
const regions = [
  { slug: "vice-city", name: "Vice City", x: 0.565, y: 0.575, summary: "Leonida's signature city, on the east coast." },
  { slug: "leonida-keys", name: "Leonida Keys", x: 0.27, y: 0.94, summary: "A chain of islands at the state's southern tip." },
  { slug: "grassrivers", name: "Grassrivers", x: 0.4, y: 0.8, summary: "Sprawling wetland wilderness in the south." },
  { slug: "port-gellhorn", name: "Port Gellhorn", x: 0.1, y: 0.3, summary: "A faded port town on the western coast." },
  { slug: "ambrosia", name: "Ambrosia", x: 0.31, y: 0.52, summary: "A region at the centre of the state." },
  { slug: "mount-kalaga-national-park", name: "Mount Kalaga National Park", x: 0.42, y: 0.15, summary: "Forested parkland in the north of the state." },
].map((loc) => ({ ...loc, category: "Region", region: null, verification: "official" as const, sourceUrl: officialSource }));

// Places fans spotted in Rockstar's trailers and promotional material, as described by third-party guides.
// Summaries describe the place; where the fact comes from lives in `verification` and `sourceUrl`.
// Not confirmed by Rockstar on its own site, so marked `community`. Fan-invented labels and leaks are left out.
const screenRant = "https://screenrant.com/gta-6-leonida-vice-city-every-location-revealed/";
const trailerMap = "https://gta-6-map.com/guides/trailer-locations";
const viceGuide = "https://www.technerdiness.com/gta/gta-6-vice-city-location-guide/";
const community = [
  { slug: "vice-beach", name: "Vice Beach", category: "Beach", region: "Vice City", x: 0.645, y: 0.665, summary: "Busy beachfront with high-rise hotels and a boardwalk.", sourceUrl: screenRant },
  { slug: "ocean-beach", name: "Ocean Beach", category: "District", region: "Vice City", x: 0.628, y: 0.71, summary: "Vice City's signature beach district of pastel hotels.", sourceUrl: viceGuide },
  { slug: "ocean-drive", name: "Ocean Drive", category: "Landmark", region: "Vice City", x: 0.64, y: 0.625, summary: "Beachfront street running along Vice Beach.", sourceUrl: trailerMap },
  { slug: "ocean-view-hotel", name: "Ocean View Hotel", category: "Hotel", region: "Vice City", x: 0.655, y: 0.595, summary: "Beachfront hotel on Vice Beach.", sourceUrl: trailerMap },
  { slug: "dominion-hotel", name: "Dominion Hotel", category: "Hotel", region: "Vice City", x: 0.668, y: 0.64, summary: "Beachfront hotel on Vice Beach.", sourceUrl: trailerMap },
  { slug: "hotel-dixon", name: "Hotel Dixon", category: "Hotel", region: "Vice City", x: 0.655, y: 0.69, summary: "Hotel with neon lettering on the beach skyline.", sourceUrl: screenRant },
  { slug: "downtown", name: "Downtown", category: "District", region: "Vice City", x: 0.565, y: 0.655, summary: "The city's downtown district.", sourceUrl: screenRant },
  { slug: "stockyard", name: "Stockyard", category: "District", region: "Vice City", x: 0.53, y: 0.615, summary: "A district of Vice City, signposted from the highway.", sourceUrl: screenRant },
  { slug: "little-cuba", name: "Little Cuba", category: "District", region: "Vice City", x: 0.535, y: 0.7, summary: "Neighbourhood known for its Cuban bakeries.", sourceUrl: viceGuide },
  { slug: "bayside", name: "Bayside", category: "District", region: "Vice City", x: 0.595, y: 0.625, summary: "Waterfront area for boating and time off.", sourceUrl: viceGuide },
  { slug: "port-vc", name: "Port VC", category: "Transport", region: "Vice City", x: 0.6, y: 0.745, summary: "Vice City's seaport, busy with boats.", sourceUrl: screenRant },
  { slug: "vice-city-international-airport", name: "Vice City International Airport", category: "Transport", region: "Vice City", x: 0.495, y: 0.67, summary: "Vice City's international airport.", sourceUrl: screenRant },
  { slug: "sahara-arena", name: "Sahara Arena", category: "Landmark", region: "Vice City", x: 0.58, y: 0.68, summary: "Downtown arena beside the highway.", sourceUrl: trailerMap },
  { slug: "nine1nine", name: "NINE1NINE", category: "Nightlife", region: "Vice City", x: 0.555, y: 0.635, summary: "Downtown nightclub.", sourceUrl: trailerMap },
  { slug: "effluvia", name: "Effluvia", category: "Nightlife", region: "Vice City", x: 0.6, y: 0.7, summary: "Rooftop bar.", sourceUrl: viceGuide },
  { slug: "tisha-wocka", name: "Tisha-Wocka", category: "Shop", region: "Vice City", x: 0.515, y: 0.65, summary: "Flea market known for bootleg brands.", sourceUrl: viceGuide },
  { slug: "key-lento", name: "Key Lento", category: "District", region: "Leonida Keys", x: 0.215, y: 0.95, summary: "Island town in the Keys.", sourceUrl: trailerMap },
  { slug: "brians-marina", name: "Brian's Marina", category: "Transport", region: "Leonida Keys", x: 0.235, y: 0.915, summary: "Marina with a hangar.", sourceUrl: trailerMap },
  { slug: "starlet-motel", name: "Starlet Motel", category: "Hotel", region: "Port Gellhorn", x: 0.125, y: 0.265, summary: "Motel in Port Gellhorn.", sourceUrl: trailerMap },
  { slug: "uncle-jacks-liquor", name: "Uncle Jack's Liquor", category: "Shop", region: "Port Gellhorn", x: 0.095, y: 0.345, summary: "Liquor store in Port Gellhorn.", sourceUrl: screenRant },
  { slug: "pawn-and-gun", name: "Pawn & Gun", category: "Shop", region: "Port Gellhorn", x: 0.08, y: 0.33, summary: "Gun shop next to Uncle Jack's Liquor.", sourceUrl: trailerMap },
  { slug: "sugar-refinery", name: "Sugar refinery", category: "Landmark", region: "Ambrosia", x: 0.345, y: 0.495, summary: "Sugar refinery where a biker gang gathers.", sourceUrl: trailerMap },
  { slug: "leonida-penitentiary", name: "Leonida Penitentiary", category: "Landmark", region: null, x: 0.46, y: 0.745, summary: "Prison south of Vice City.", sourceUrl: trailerMap },
].map((loc) => ({ ...loc, verification: "community" as const }));

const locations = [...regions, ...community];

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

// Names are official (Rockstar's GTA VI site). Connections are community-reported, each with its own source.
const characters = [
  { slug: "lucia", name: "Lucia Caminos", summary: "One of the game's two protagonists, alongside Jason." },
  { slug: "jason", name: "Jason Duval", summary: "One of the game's two protagonists, alongside Lucia." },
].map((c) => ({ ...c, verification: "official" as const, sourceUrl: officialSource }));

const connections = [
  { character: "lucia", location: "leonida-penitentiary", note: "Her story begins in a cell here.", sourceUrl: trailerMap },
  { character: "lucia", location: "uncle-jacks-liquor", note: "Robs this store with her partner.", sourceUrl: screenRant },
  { character: "jason", location: "leonida-keys", note: "Lives in the Keys.", sourceUrl: trailerMap },
  { character: "jason", location: "key-lento", note: "Has a safe house here.", sourceUrl: trailerMap },
  { character: "jason", location: "brians-marina", note: "Spends time at the marina and its hangar.", sourceUrl: trailerMap },
].map((c) => ({ ...c, verification: "community" as const }));

for (const { slug, ...data } of characters) {
  await db.character.upsert({
    where: { worldId_slug: { worldId, slug } },
    update: data,
    create: { ...data, slug, worldId },
  });
}

for (const { character, location, ...data } of connections) {
  const [{ id: characterId }, { id: locationId }] = await Promise.all([
    db.character.findUniqueOrThrow({ where: { worldId_slug: { worldId, slug: character } } }),
    db.location.findUniqueOrThrow({ where: { worldId_slug: { worldId, slug: location } } }),
  ]);
  await db.connection.upsert({
    where: { characterId_locationId: { characterId, locationId } },
    update: data,
    create: { ...data, characterId, locationId },
  });
}

console.log(`Seeded ${locations.length} locations, ${characters.length} characters, ${connections.length} connections into "${world.slug}".`);
await db.$disconnect();
