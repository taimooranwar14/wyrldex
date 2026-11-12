import "server-only";
import { db } from "@/lib/db";
import type { LocationQuery } from "./schema";

// The only place that knows how locations are stored. Callers pass already-validated input.
export function listLocations({ world, category, q, limit }: LocationQuery) {
  // Prisma's `contains` becomes SQL LIKE, where % and _ are wildcards. Escape them so they match literally.
  if (q) q = q.replace(/[\\%_]/g, "\\$&");

  return db.location.findMany({
    where: {
      world: { slug: world },
      category,
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { summary: { contains: q, mode: "insensitive" } },
        ],
      }),
    },
    select: { slug: true, name: true, category: true, x: true, y: true, summary: true, verification: true },
    orderBy: { name: "asc" },
    take: limit,
  });
}

export type LocationSummary = Awaited<ReturnType<typeof listLocations>>[number];
