import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { sihtAgents, jobMatches, companyAlerts, users } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { AgentCard } from "@/components/agents/agent-card";
import { RecentFeed } from "@/components/agents/recent-feed";
import { NewAgentButton } from "@/components/agents/new-agent-button";
import { getUserPlan, PLANS } from "@/lib/plans";

export default async function DashboardPage() {
  const session = await requireAuth();

  const agents = await db.query.sihtAgents.findMany({
    where: eq(sihtAgents.userId, session.user.id),
    with: {
      watchedCompanies: true,
      jobMatches: { columns: { id: true, seen: true } },
      companyAlerts: { columns: { id: true, seen: true } },
    },
    orderBy: (agents, { desc }) => [desc(agents.createdAt)],
  });

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });
  const plan = getUserPlan({
    plan: user?.plan ?? "free",
    stripeCurrentPeriodEnd: user?.stripeCurrentPeriodEnd ?? null,
  });
  const maxAgents = PLANS[plan].maxAgents;

  // Fetch recent findings across all agents for the unified feed
  const agentIds = agents.map((a) => a.id);

  let recentJobs: {
    id: string;
    title: string;
    company: string;
    url: string;
    source: string;
    seen: boolean;
    favorited: boolean;
    discarded: boolean;
    foundAt: Date;
    agentId: string;
  }[] = [];

  let recentAlerts: {
    id: string;
    title: string;
    url: string;
    source: string;
    seen: boolean;
    foundAt: Date;
    agentId: string;
    watchedCompany: { companyName: string } | null;
  }[] = [];

  if (agentIds.length > 0) {
    recentJobs = await db.query.jobMatches.findMany({
      where: inArray(jobMatches.agentId, agentIds),
      orderBy: [desc(jobMatches.foundAt)],
      limit: 15,
      columns: {
        id: true,
        title: true,
        company: true,
        url: true,
        source: true,
        seen: true,
        favorited: true,
        discarded: true,
        foundAt: true,
        agentId: true,
      },
    });

    recentAlerts = await db.query.companyAlerts.findMany({
      where: inArray(companyAlerts.agentId, agentIds),
      orderBy: [desc(companyAlerts.foundAt)],
      limit: 15,
      columns: {
        id: true,
        title: true,
        url: true,
        source: true,
        seen: true,
        foundAt: true,
        agentId: true,
      },
      with: {
        watchedCompany: {
          columns: { companyName: true },
        },
      },
    });
  }

  // Build agent name lookup
  const agentNames = Object.fromEntries(agents.map((a) => [a.id, a.name]));

  // Merge into unified feed sorted by date
  const feed = [
    ...recentJobs
      .filter((j) => !j.discarded)
      .map((j) => ({
        id: j.id,
        type: "job" as const,
        title: j.title,
        subtitle: j.company,
        url: j.url,
        seen: j.seen,
        favorited: j.favorited,
        foundAt: j.foundAt.toISOString(),
        agentId: j.agentId,
        agentName: agentNames[j.agentId] ?? "Agent",
      })),
    ...recentAlerts.map((a) => ({
      id: a.id,
      type: "alert" as const,
      title: a.title,
      subtitle: a.watchedCompany?.companyName ?? "Company",
      url: a.url,
      seen: a.seen,
      favorited: false,
      foundAt: a.foundAt.toISOString(),
      agentId: a.agentId,
      agentName: agentNames[a.agentId] ?? "Agent",
    })),
  ]
    .sort((a, b) => {
      // Favorited items first
      if (a.favorited !== b.favorited) return a.favorited ? -1 : 1;
      return new Date(b.foundAt).getTime() - new Date(a.foundAt).getTime();
    })
    .slice(0, 20);

  return (
    <div>
      {/* ─── Agents Section ─────────────────────────────── */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold text-foreground">Your Agents</h1>
          <NewAgentButton agentCount={agents.length} maxAgents={maxAgents}>
            + New Agent
          </NewAgentButton>
        </div>

        {agents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-surface-border bg-surface p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/10 to-accent-light/10">
              <svg
                className="h-7 w-7 text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No agents yet
            </h3>
            <p className="text-muted mb-6 max-w-sm mx-auto text-sm">
              Create your first agent to start scanning for jobs or watching
              companies.
            </p>
            <NewAgentButton agentCount={agents.length} maxAgents={maxAgents} size="lg">
              Create Your First Agent
            </NewAgentButton>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={{
                  ...agent,
                  lastRunAt: agent.lastRunAt?.toISOString() ?? null,
                  matchCount: agent.jobMatches.length,
                  alertCount: agent.companyAlerts.length,
                  newMatchCount: agent.jobMatches.filter((m) => !m.seen)
                    .length,
                  newAlertCount: agent.companyAlerts.filter((a) => !a.seen)
                    .length,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── Recent Findings Feed ────────────────────────── */}
      {feed.length > 0 && <RecentFeed items={feed} />}
    </div>
  );
}
