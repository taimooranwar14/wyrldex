// Where a fact comes from. Shown in the UI so sample data is never mistaken for game canon.
export type Verification = "official" | "community" | "sample";

// shortcut: hand-written type, replace with the Prisma/Zod-derived type when the DB lands (M3).
export type Location = {
  slug: string;
  name: string;
  category: string;
  x: number; // 0–1, position on our original stylized map, NOT real in-game coordinates
  y: number;
  summary: string;
  verification: Verification;
};

// Fictional placeholder records, invented for layout work. Not GTA VI facts.
export const sampleLocations: Location[] = [
  {
    slug: "harbor-lights-pier",
    name: "Harbor Lights Pier",
    category: "Landmark",
    x: 0.62,
    y: 0.58,
    summary: "A neon-lit boardwalk on the bay, used here as placeholder content.",
    verification: "sample",
  },
  {
    slug: "mangrove-overlook",
    name: "Mangrove Overlook",
    category: "Nature",
    x: 0.28,
    y: 0.72,
    summary: "A wetland viewpoint at the edge of the map, used here as placeholder content.",
    verification: "sample",
  },
  {
    slug: "skyline-strip",
    name: "Skyline Strip",
    category: "District",
    x: 0.48,
    y: 0.3,
    summary: "A dense nightlife district, used here as placeholder content.",
    verification: "sample",
  },
];
