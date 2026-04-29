import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sihtAgents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth-utils";
import { createAgentSchema } from "@/lib/validations/agent";
import { z } from "zod/v4";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agents = await db.query.sihtAgents.findMany({
    where: eq(sihtAgents.userId, session.user.id),
    with: { watchedCompanies: true },
    orderBy: (agents, { desc }) => [desc(agents.createdAt)],
  });

  return NextResponse.json(agents);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createAgentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: z.prettifyError(parsed.error) },
        { status: 400 }
      );
    }

    const [agent] = await db
      .insert(sihtAgents)
      .values({
        ...parsed.data,
        userId: session.user.id,
      })
      .returning();

    return NextResponse.json(agent, { status: 201 });
  } catch (err) {
    console.error("POST /api/agents error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
