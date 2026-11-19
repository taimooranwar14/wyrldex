import "server-only";
import { db } from "@/lib/db";
import { escapeLike, locationSelect } from "@/features/locations/repository";

// Characters with the places they are connected to, for the World Graph.
export function listCharacters(world: string) {
  return db.character.findMany({
    where: { world: { slug: world } },
    select: {
      slug: true,
      name: true,
      summary: true,
      verification: true,
      sourceUrl: true,
      connections: { select: { note: true, verification: true, sourceUrl: true, location: { select: { slug: true } } } },
    },
    orderBy: { name: "asc" },
  });
}

export type CharacterSummary = Awaited<ReturnType<typeof listCharacters>>[number];

// For the AI's findConnections tool: links whose character or place name contains `name`. Read-only.
export function findConnections(world: string, name: string) {
  const term = escapeLike(name);
  return db.connection.findMany({
    where: {
      character: { world: { slug: world } },
      OR: [
        { character: { name: { contains: term, mode: "insensitive" } } },
        { location: { name: { contains: term, mode: "insensitive" } } },
      ],
    },
    select: { note: true, verification: true, character: { select: { name: true } }, location: { select: locationSelect } },
    take: 20,
  });
}
