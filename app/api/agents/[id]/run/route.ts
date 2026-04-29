import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sihtAgents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth-utils";
import { runAgent } from "@/lib/jobs/runner";

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
    with: { watchedCompanies: true },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  try {
    const result = await runAgent(agent);
    return NextResponse.json(result);
  } catch (err) {
    console.error(`Manual run failed for agent ${id}:`, err);
    return NextResponse.json(
      { error: "Agent run failed" },
      { status: 500 }
    );
  }
}
