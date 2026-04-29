import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sihtAgents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth-utils";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const agent = await db.query.sihtAgents.findFirst({
    where: and(eq(sihtAgents.id, id), eq(sihtAgents.userId, session.user.id)),
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const [updated] = await db
    .update(sihtAgents)
    .set({ isActive: !agent.isActive, updatedAt: new Date() })
    .where(eq(sihtAgents.id, id))
    .returning();

  return NextResponse.json(updated);
}
