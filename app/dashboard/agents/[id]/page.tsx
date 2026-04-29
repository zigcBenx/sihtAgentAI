import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { sihtAgents, jobMatches, runLogs } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { AgentDetailClient } from "@/components/agents/agent-detail-client";
import { WatchedCompanies } from "@/components/agents/watched-companies";
import { JobMatches } from "@/components/agents/job-matches";
import { CompanyAlerts } from "@/components/agents/company-alerts";
import { RunLogs } from "@/components/agents/run-logs";

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const { id } = await params;

  const agent = await db.query.sihtAgents.findFirst({
    where: and(eq(sihtAgents.id, id), eq(sihtAgents.userId, session.user.id)),
    with: {
      watchedCompanies: {
        with: { alerts: true },
      },
    },
  });

  if (!agent) {
    notFound();
  }

  // Fetch job matches separately (newest first, limit 50)
  const matches = await db.query.jobMatches.findMany({
    where: eq(jobMatches.agentId, id),
    orderBy: [desc(jobMatches.foundAt)],
    limit: 50,
  });

  // Fetch run logs (newest first, limit 10)
  const logs = await db.query.runLogs.findMany({
    where: eq(runLogs.agentId, id),
    orderBy: [desc(runLogs.createdAt)],
    limit: 10,
  });

  const isJobSearch = agent.agentType === "job_search";

  const settingsData = {
    name: agent.name,
    profileSummary: agent.profileSummary ?? "",
    desiredRole: agent.desiredRole ?? "",
    salaryMin: agent.salaryMin?.toString() ?? "",
    salaryMax: agent.salaryMax?.toString() ?? "",
    locationPreference: agent.locationPreference ?? "",
    specificCity: agent.specificCity ?? "",
    frequency: agent.frequency,
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <AgentDetailClient
        agentId={agent.id}
        agentName={agent.name}
        agentType={agent.agentType}
        isActive={agent.isActive}
        lastRunAt={agent.lastRunAt ? agent.lastRunAt.toISOString() : null}
        settingsData={settingsData}
      >
        {/* Type-specific content rendered as children */}
        {isJobSearch ? (
          <>
            <JobMatches matches={matches} />
            <RunLogs logs={logs} />
          </>
        ) : (
          <>
            <CompanyAlerts companies={agent.watchedCompanies} />
            <WatchedCompanies
              agentId={agent.id}
              companies={agent.watchedCompanies}
            />
            <RunLogs logs={logs} />
          </>
        )}
      </AgentDetailClient>
    </div>
  );
}
