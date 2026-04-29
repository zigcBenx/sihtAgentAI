import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { sihtAgents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { runAgent } from "@/lib/jobs/runner";

export const maxDuration = 60;

export async function GET() {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeAgents = await db.query.sihtAgents.findMany({
    where: eq(sihtAgents.isActive, true),
    with: { watchedCompanies: true },
  });

  const results = [];

  for (const agent of activeAgents) {
    try {
      const result = await runAgent(agent);
      results.push(result);
    } catch (err) {
      console.error(`Agent ${agent.id} (${agent.name}) failed:`, err);
      results.push({
        agentId: agent.id,
        agentName: agent.name,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({
    message: `Processed ${activeAgents.length} active agents`,
    results,
    executedAt: new Date().toISOString(),
  });
}
