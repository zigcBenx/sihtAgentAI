import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { sihtAgents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { runAgent } from "@/lib/jobs/runner";
import { sendAgentResultsEmail } from "@/lib/email";
import { getUserPlan, PLANS } from "@/lib/plans";

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
      user: { columns: { email: true, plan: true, stripeCurrentPeriodEnd: true } },
    },
  });

  console.log(`[cron] Found ${activeAgents.length} active agents`);

  const results = [];

  for (const agent of activeAgents) {
    const userPlan = getUserPlan({
      plan: agent.user.plan ?? "free",
      stripeCurrentPeriodEnd: agent.user.stripeCurrentPeriodEnd ?? null,
    });
    const limits = PLANS[userPlan];

    // Frequency gating: free users only run weekly
    if (limits.frequency === "weekly" && agent.lastRunAt) {
      const daysSinceLastRun =
        (Date.now() - agent.lastRunAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastRun < 6.5) {
        console.log(`[cron] Skipping agent ${agent.id} (free plan, last run ${daysSinceLastRun.toFixed(1)}d ago)`);
        continue;
      }
    }

    console.log(`[cron] Running agent ${agent.id} (${agent.name}, type=${agent.agentType}, plan=${userPlan})`);
    try {
      const result = await runAgent(agent);
      console.log(`[cron] Agent ${agent.id} done: ${result.newJobMatches} new jobs, ${result.newCompanyAlerts} new alerts`);
      results.push(result);

      // Send email notification if new results were found
      if (result.newJobMatches > 0 || result.newCompanyAlerts > 0) {
        // Cap email results for free users
        const emailJobs =
          limits.visibleResults < Infinity
            ? result.newJobItems.slice(0, limits.visibleResults)
            : result.newJobItems;
        const emailAlerts =
          limits.visibleResults < Infinity
            ? result.newAlertItems.slice(0, limits.visibleResults)
            : result.newAlertItems;

        console.log(`[cron] Sending email to ${agent.user.email} for agent ${agent.id} (${emailJobs.length} jobs, ${emailAlerts.length} alerts)`);
        try {
          await sendAgentResultsEmail({
            to: agent.user.email,
            agentName: result.agentName,
            agentType: result.agentType,
            agentId: result.agentId,
            newJobs: emailJobs,
            newAlerts: emailAlerts,
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
