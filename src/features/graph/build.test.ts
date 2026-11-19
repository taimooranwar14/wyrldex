import { describe, expect, it } from "vitest";
import type { LocationSummary } from "@/features/locations/repository";
import { buildGraph } from "./build";
import type { CharacterSummary } from "./repository";

const loc = (slug: string, name: string, category: string, region: string | null = null) =>
  ({ slug, name, category, region, x: 0, y: 0, summary: `${name} summary`, verification: "official", sourceUrl: null }) as LocationSummary;

const locations = [
  loc("vice-city", "Vice City", "Region"),
  loc("hotel-dixon", "Hotel Dixon", "Hotel", "Vice City"),
  loc("prison", "Leonida Penitentiary", "Landmark"),
];
const lucia = {
  slug: "lucia",
  name: "Lucia Caminos",
  summary: "Protagonist.",
  verification: "official",
  sourceUrl: null,
  connections: [{ note: "Her story opens here.", verification: "community", sourceUrl: null, location: { slug: "prison" } }],
} as CharacterSummary;

const ids = (nodes: { id: string }[]) => nodes.map((n) => n.id);

describe("buildGraph", () => {
  it("shows the state's characters and regions by default", () => {
    const graph = buildGraph(locations, [lucia], { character: null, location: null });
    expect(graph.center.id).toBe("world");
    expect(graph.hidden).toBe(0);
    expect(ids(graph.neighbors)).toEqual(["character:lucia", "location:vice-city"]);
  });

  it("centres a character on the places they are linked to, with the reason", () => {
    const graph = buildGraph(locations, [lucia], { character: lucia, location: null });
    expect(graph.neighbors).toEqual([expect.objectContaining({ id: "location:prison", note: "Her story opens here." })]);
  });

  it("links a place to its characters and parent region, and a region to its places", () => {
    expect(ids(buildGraph(locations, [lucia], { character: null, location: locations[2] }).neighbors)).toEqual(["character:lucia"]);
    expect(ids(buildGraph(locations, [lucia], { character: null, location: locations[1] }).neighbors)).toEqual(["location:vice-city"]);
    expect(ids(buildGraph(locations, [lucia], { character: null, location: locations[0] }).neighbors)).toEqual(["location:hotel-dixon"]);
  });
});
