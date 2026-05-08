import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { sihtAgents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { runAgent } from "@/lib/jobs/runner";
import { sendAgentResultsEmail } from "@/lib/email";
import { getUserPlan, PLANS } from "@/lib/plans";

export const maxDuration = 300;

const CONCURRENCY = 4;
const PER_AGENT_TIMEOUT_MS = 60_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms
    );
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

async function fetchActiveAgents() {
  return db.query.sihtAgents.findMany({
    where: eq(sihtAgents.isActive, true),
    with: {
      watchedCompanies: true,
      user: { columns: { email: true, plan: true, stripeCurrentPeriodEnd: true } },
    },
  });
}

type AgentRecord = Awaited<ReturnType<typeof fetchActiveAgents>>[number];

export async function GET() {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeAgents = await fetchActiveAgents();

  console.log(`[cron] Found ${activeAgents.length} active agents`);

  // Frequency gating: skip free-plan agents that ran less than 6.5 days ago
  const eligible = activeAgents.filter((agent) => {
    const userPlan = getUserPlan({
      plan: agent.user.plan ?? "free",
      stripeCurrentPeriodEnd: agent.user.stripeCurrentPeriodEnd ?? null,
    });
    const limits = PLANS[userPlan];
    if (limits.frequency === "weekly" && agent.lastRunAt) {
      const daysSinceLastRun =
        (Date.now() - agent.lastRunAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastRun < 6.5) {
        console.log(`[cron] Skipping agent ${agent.id} (free plan, last run ${daysSinceLastRun.toFixed(1)}d ago)`);
        return false;
      }
    }
    return true;
  });

  console.log(`[cron] ${eligible.length} agents eligible to run (concurrency=${CONCURRENCY})`);

  const results: unknown[] = [];

  // Process agents in batches of CONCURRENCY using a worker-pool pattern.
  // Each worker pulls the next agent off the queue when it finishes its current one,
  // so faster agents don't have to wait for slower ones in the same "batch".
  let cursor = 0;
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (true) {
      const idx = cursor++;
      if (idx >= eligible.length) return;
      const agent = eligible[idx];
      const result = await processAgent(agent);
      results.push(result);
    }
  });

  await Promise.all(workers);

  return NextResponse.json({
    message: `Processed ${eligible.length} of ${activeAgents.length} active agents`,
    results,
    executedAt: new Date().toISOString(),
  });
}

async function processAgent(agent: AgentRecord) {
  const userPlan = getUserPlan({
    plan: agent.user.plan ?? "free",
    stripeCurrentPeriodEnd: agent.user.stripeCurrentPeriodEnd ?? null,
  });
  const limits = PLANS[userPlan];

  console.log(`[cron] Running agent ${agent.id} (${agent.name}, type=${agent.agentType}, plan=${userPlan})`);

  try {
    const result = await withTimeout(
      runAgent(agent),
      PER_AGENT_TIMEOUT_MS,
      `Agent ${agent.id}`
    );
    console.log(`[cron] Agent ${agent.id} done: ${result.newJobMatches} new jobs, ${result.newCompanyAlerts} new alerts`);

    if (result.newJobMatches > 0 || result.newCompanyAlerts > 0) {
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

    return result;
  } catch (err) {
    console.error(`[cron] Agent ${agent.id} (${agent.name}) FAILED:`, err);
    return {
      agentId: agent.id,
      agentName: agent.name,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
