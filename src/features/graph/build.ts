// Builds the World Graph around whatever is in focus: a character, a place, or (by default) the whole state.
// Pure, so it is easy to test; the component only draws it.
import type { LocationSummary } from "@/features/locations/repository";
import type { CharacterSummary } from "./repository";

export type GraphNode = {
  id: string; // "character:lucia" or "location:vice-city"
  kind: "world" | "region" | "place" | "character";
  label: string;
  category?: string;
  note?: string; // why this node is linked to the centre
};

export type Graph = { center: GraphNode; neighbors: GraphNode[] };

const MAX_NEIGHBORS = 8;

const placeNode = (loc: LocationSummary, note?: string): GraphNode => ({
  id: `location:${loc.slug}`,
  kind: loc.category === "Region" ? "region" : "place",
  label: loc.name,
  category: loc.category,
  note,
});

const characterNode = (c: CharacterSummary, note?: string): GraphNode => ({
  id: `character:${c.slug}`,
  kind: "character",
  label: c.name,
  note,
});

export function buildGraph(
  locations: LocationSummary[],
  characters: CharacterSummary[],
  focus: { character: CharacterSummary | null; location: LocationSummary | null },
): Graph {
  const bySlug = new Map(locations.map((loc) => [loc.slug, loc]));

  if (focus.character) {
    const neighbors = focus.character.connections.flatMap((link) => {
      const loc = bySlug.get(link.location.slug);
      return loc ? [placeNode(loc, link.note)] : [];
    });
    return { center: characterNode(focus.character), neighbors };
  }

  const loc = focus.location;
  if (loc) {
    const people = characters.flatMap((c) => {
      const link = c.connections.find((l) => l.location.slug === loc.slug);
      return link ? [characterNode(c, link.note)] : [];
    });
    const parent = loc.region ? locations.find((r) => r.category === "Region" && r.name === loc.region) : undefined;
    const children =
      loc.category === "Region" ? locations.filter((p) => p.region === loc.name).map((p) => placeNode(p, `${p.category} in ${loc.name}`)) : [];
    const neighbors = [...people, ...(parent ? [placeNode(parent, `${loc.name} is in ${parent.name}`)] : []), ...children];
    return { center: placeNode(loc), neighbors: neighbors.slice(0, MAX_NEIGHBORS) };
  }

  return {
    center: { id: "world", kind: "world", label: "Leonida" },
    neighbors: [
      ...characters.map((c) => characterNode(c, c.summary)),
      ...locations.filter((r) => r.category === "Region").map((r) => placeNode(r, r.summary)),
    ].slice(0, MAX_NEIGHBORS),
  };
}
