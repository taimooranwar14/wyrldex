import { z } from "zod";

export const DEFAULT_WORLD_SLUG = "leonida";

// Query string for GET /api/locations. Everything from a URL is an untrusted string until it passes here.
export const locationQuerySchema = z.object({
  world: z.string().regex(/^[a-z0-9-]{1,64}$/).default(DEFAULT_WORLD_SLUG),
  category: z.string().trim().min(1).max(40).optional(),
  q: z.string().trim().min(1).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type LocationQuery = z.infer<typeof locationQuerySchema>;
