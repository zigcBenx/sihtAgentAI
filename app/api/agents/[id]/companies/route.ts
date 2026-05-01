import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sihtAgents, watchedCompanies, users } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth-utils";
import { watchedCompanySchema } from "@/lib/validations/agent";
import { z } from "zod/v4";
import { getUserPlan, PLANS } from "@/lib/plans";

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
    // Check company count limit across all user's agents
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });
    const plan = getUserPlan({
      plan: user?.plan ?? "free",
      stripeCurrentPeriodEnd: user?.stripeCurrentPeriodEnd ?? null,
    });
    const limits = PLANS[plan];

    const userAgents = await db.query.sihtAgents.findMany({
      where: eq(sihtAgents.userId, session.user.id),
      columns: { id: true },
    });
    const agentIds = userAgents.map((a) => a.id);

    if (agentIds.length > 0) {
      const allCompanies = await db.query.watchedCompanies.findMany({
        where: inArray(watchedCompanies.agentId, agentIds),
        columns: { id: true },
      });
      if (allCompanies.length >= limits.maxCompanies) {
        return NextResponse.json(
          { error: "upgrade_required", limit: "companies", max: limits.maxCompanies, plan },
          { status: 403 }
        );
      }
    }

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
