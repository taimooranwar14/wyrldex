import { z } from "zod";
import { listLocations } from "@/features/locations/repository";
import { locationQuerySchema } from "@/features/locations/schema";

export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = locationQuerySchema.safeParse(params);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid query", issues: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }

  return Response.json({ locations: await listLocations(parsed.data) });
}
