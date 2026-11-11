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
    slug: "skyline-strip",
    name: "Skyline Strip",
    category: "District",
    x: 0.56,
    y: 0.43,
    summary: "A dense nightlife district by the bay. Placeholder content.",
    verification: "sample",
  },
  {
    slug: "harbor-lights-pier",
    name: "Harbor Lights Pier",
    category: "Landmark",
    x: 0.55,
    y: 0.586,
    summary: "A neon-lit boardwalk on the inner bay. Placeholder content.",
    verification: "sample",
  },
  {
    slug: "old-port-warehouses",
    name: "Old Port Warehouses",
    category: "District",
    x: 0.43,
    y: 0.257,
    summary: "A converted dockside quarter in the north. Placeholder content.",
    verification: "sample",
  },
  {
    slug: "lighthouse-point",
    name: "Lighthouse Point",
    category: "Landmark",
    x: 0.83,
    y: 0.364,
    summary: "A lone beacon on the eastern island. Placeholder content.",
    verification: "sample",
  },
  {
    slug: "mangrove-overlook",
    name: "Mangrove Overlook",
    category: "Nature",
    x: 0.32,
    y: 0.63,
    summary: "A wetland viewpoint beside the inland lagoon. Placeholder content.",
    verification: "sample",
  },
  {
    slug: "cypress-trail",
    name: "Cypress Trail",
    category: "Nature",
    x: 0.15,
    y: 0.43,
    summary: "A raised boardwalk through western swampland. Placeholder content.",
    verification: "sample",
  },
  {
    slug: "sunset-boardwalk",
    name: "Sunset Boardwalk",
    category: "Beach",
    x: 0.5,
    y: 0.83,
    summary: "A long beach promenade on the southern coast. Placeholder content.",
    verification: "sample",
  },
  {
    slug: "coral-keys",
    name: "Coral Keys",
    category: "Beach",
    x: 0.27,
    y: 0.936,
    summary: "A chain of tiny islands trailing off the southern tip. Placeholder content.",
    verification: "sample",
  },
];
