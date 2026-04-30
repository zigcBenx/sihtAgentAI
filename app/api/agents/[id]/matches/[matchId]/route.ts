import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobMatches, sihtAgents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth-utils";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, matchId } = await params;

  // Verify agent belongs to user
  const agent = await db.query.sihtAgents.findFirst({
    where: and(eq(sihtAgents.id, id), eq(sihtAgents.userId, session.user.id)),
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const body = await request.json();
  const update: Record<string, boolean> = {};

  if (typeof body.favorited === "boolean") update.favorited = body.favorited;
  if (typeof body.discarded === "boolean") update.discarded = body.discarded;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const [updated] = await db
    .update(jobMatches)
    .set(update)
    .where(and(eq(jobMatches.id, matchId), eq(jobMatches.agentId, id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
