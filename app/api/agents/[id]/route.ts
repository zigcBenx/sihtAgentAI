import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sihtAgents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth-utils";
import { updateAgentSchema } from "@/lib/validations/agent";
import { z } from "zod/v4";

export async function GET(
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
    with: { watchedCompanies: true },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  return NextResponse.json(agent);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateAgentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: z.prettifyError(parsed.error) },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(sihtAgents)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(
        and(eq(sihtAgents.id, id), eq(sihtAgents.userId, session.user.id))
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [deleted] = await db
    .delete(sihtAgents)
    .where(and(eq(sihtAgents.id, id), eq(sihtAgents.userId, session.user.id)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Agent deleted" });
}
