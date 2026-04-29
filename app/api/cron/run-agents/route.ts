import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { sihtAgents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { runAgent } from "@/lib/jobs/runner";
import { sendAgentResultsEmail } from "@/lib/email";

export const maxDuration = 60;

export async function GET() {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeAgents = await db.query.sihtAgents.findMany({
    where: eq(sihtAgents.isActive, true),
    with: {
      watchedCompanies: true,
      user: { columns: { email: true } },
    },
  });

  const results = [];

  for (const agent of activeAgents) {
    try {
      const result = await runAgent(agent);
      results.push(result);

      // Send email notification if new results were found
      if (result.newJobMatches > 0 || result.newCompanyAlerts > 0) {
        try {
          await sendAgentResultsEmail({
            to: agent.user.email,
            agentName: result.agentName,
            agentType: result.agentType,
            agentId: result.agentId,
            newJobs: result.newJobItems,
            newAlerts: result.newAlertItems,
          });
        } catch (emailErr) {
          console.error(`[email] Failed for agent ${agent.id}:`, emailErr);
        }
      }
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
