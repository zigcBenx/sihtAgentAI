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

  console.log(`[cron] Found ${activeAgents.length} active agents`);

  const results = [];

  for (const agent of activeAgents) {
    console.log(`[cron] Running agent ${agent.id} (${agent.name}, type=${agent.agentType})`);
    try {
      const result = await runAgent(agent);
      console.log(`[cron] Agent ${agent.id} done: ${result.newJobMatches} new jobs, ${result.newCompanyAlerts} new alerts`);
      results.push(result);

      // Send email notification if new results were found
      if (result.newJobMatches > 0 || result.newCompanyAlerts > 0) {
        console.log(`[cron] Sending email to ${agent.user.email} for agent ${agent.id} (${result.newJobItems.length} jobs, ${result.newAlertItems.length} alerts)`);
        try {
          await sendAgentResultsEmail({
            to: agent.user.email,
            agentName: result.agentName,
            agentType: result.agentType,
            agentId: result.agentId,
            newJobs: result.newJobItems,
            newAlerts: result.newAlertItems,
          });
          console.log(`[cron] Email sent successfully for agent ${agent.id}`);
        } catch (emailErr) {
          console.error(`[cron] Email FAILED for agent ${agent.id}:`, emailErr);
        }
      } else {
        console.log(`[cron] No new results for agent ${agent.id}, skipping email`);
      }
    } catch (err) {
      console.error(`[cron] Agent ${agent.id} (${agent.name}) FAILED:`, err);
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
