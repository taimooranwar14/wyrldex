import { z } from "zod";
import { askLocations } from "@/features/ai/ask";

const bodySchema = z.object({ question: z.string().trim().min(1).max(300) });

// Developer-only: live inference runs only when AI_MODE=local, so a public deploy can never reach a model.
export async function POST(request: Request) {
  if (process.env.AI_MODE !== "local") return Response.json({ error: "Not found" }, { status: 404 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid body", issues: z.flattenError(parsed.error).fieldErrors }, { status: 400 });
  }

  try {
    return Response.json(await askLocations(parsed.data.question));
  } catch (error) {
    console.error("AI request failed:", error);
    return Response.json({ error: "Local AI request failed. Check the server log." }, { status: 503 });
  }
}
