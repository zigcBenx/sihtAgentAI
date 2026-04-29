import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sihtAgents, watchedCompanies } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth-utils";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; companyId: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: agentId, companyId } = await params;

  const agent = await db.query.sihtAgents.findFirst({
    where: and(
      eq(sihtAgents.id, agentId),
      eq(sihtAgents.userId, session.user.id)
    ),
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const [deleted] = await db
    .delete(watchedCompanies)
    .where(
      and(
        eq(watchedCompanies.id, companyId),
        eq(watchedCompanies.agentId, agentId)
      )
    )
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Company removed" });
}
