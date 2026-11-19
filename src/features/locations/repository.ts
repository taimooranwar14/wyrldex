import "server-only";
import { db } from "@/lib/db";
import type { LocationQuery } from "./schema";

// Prisma's `contains` becomes SQL LIKE, where % and _ are wildcards. Escape them so they match literally.
export const escapeLike = (text: string) => text.replace(/[\\%_]/g, "\\$&");

export const locationSelect = {
  slug: true, name: true, category: true, region: true, x: true, y: true, summary: true, verification: true, sourceUrl: true,
} as const;

// The only place that knows how locations are stored. Callers pass already-validated input.
export function listLocations({ world, category, q, limit }: LocationQuery) {
  // Every word must match somewhere, so "west coast" finds "the western coast".
  // A trailing "s" is dropped so "hotels" finds "Hotel" (shortcut: English plurals only; use Postgres full-text search if this grows).
  const words =
    q?.split(/\s+/).map((word) => escapeLike(word.length > 3 ? word.replace(/s$/i, "") : word)) ?? [];

  return db.location.findMany({
    where: {
      world: { slug: world },
      category,
      AND: words.map((word) => ({
        OR: [
          { name: { contains: word, mode: "insensitive" as const } },
          { summary: { contains: word, mode: "insensitive" as const } },
          { category: { contains: word, mode: "insensitive" as const } },
          { region: { contains: word, mode: "insensitive" as const } },
        ],
      })),
    },
    select: locationSelect,
    orderBy: { name: "asc" },
    take: limit,
  });
}

export type LocationSummary = Awaited<ReturnType<typeof listLocations>>[number];
