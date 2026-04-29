import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sihtAgents, watchedCompanies } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth-utils";
import { watchedCompanySchema } from "@/lib/validations/agent";
import { z } from "zod/v4";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: agentId } = await params;

  const agent = await db.query.sihtAgents.findFirst({
    where: and(
      eq(sihtAgents.id, agentId),
      eq(sihtAgents.userId, session.user.id)
    ),
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  if (agent.agentType !== "company_watcher") {
    return NextResponse.json(
      { error: "Only company watcher agents can have watched companies" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const parsed = watchedCompanySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: z.prettifyError(parsed.error) },
        { status: 400 }
      );
    }

    const [company] = await db
      .insert(watchedCompanies)
      .values({
        companyName: parsed.data.companyName,
        careersUrl: parsed.data.careersUrl,
        agentId,
      })
      .returning();

    return NextResponse.json(company, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
