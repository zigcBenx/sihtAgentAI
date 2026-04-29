"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface Agent {
  id: string;
  name: string;
  agentType: string;
  desiredRole: string | null;
  isActive: boolean;
  lastRunAt: string | null;
  watchedCompanies: { id: string }[];
  matchCount: number;
  alertCount: number;
  newMatchCount: number;
  newAlertCount: number;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Robot icon with magnifying glass for job search agents */
function JobSearchRobotIcon({ active }: { active: boolean }) {
  const color = active ? "text-accent" : "text-muted";
  return (
    <svg className={`h-6 w-6 ${color}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {/* Robot head */}
      <rect x="5" y="7" width="14" height="10" rx="2" />
      {/* Antenna */}
      <line x1="12" y1="7" x2="12" y2="4" />
      <circle cx="12" cy="3" r="1" />
      {/* Eyes */}
      <circle cx="9" cy="12" r="1.5" />
      {/* Magnifying glass eye */}
      <circle cx="15" cy="11.5" r="2" />
      <line x1="16.5" y1="13" x2="18" y2="14.5" />
      {/* Mouth */}
      <line x1="9" y1="15" x2="13" y2="15" />
    </svg>
  );
}

/** Robot icon with eye/radar for company watcher agents */
function CompanyWatcherRobotIcon({ active }: { active: boolean }) {
  const color = active ? "text-accent" : "text-muted";
  return (
    <svg className={`h-6 w-6 ${color}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {/* Robot head */}
      <rect x="5" y="7" width="14" height="10" rx="2" />
      {/* Antenna with radar waves */}
      <line x1="12" y1="7" x2="12" y2="4" />
      <path d="M9.5 3.5a3.5 3.5 0 015 0" />
      {/* Big eye (watching) */}
      <circle cx="12" cy="11.5" r="3" />
      <circle cx="12" cy="11.5" r="1" />
      {/* Mouth */}
      <line x1="9.5" y1="15.5" x2="14.5" y2="15.5" />
    </svg>
  );
}

export function AgentCard({ agent }: { agent: Agent }) {
  const router = useRouter();
  const [toggling, setToggling] = useState(false);

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setToggling(true);
    try {
      await fetch(`/api/agents/${agent.id}/toggle`, { method: "POST" });
      router.refresh();
    } finally {
      setToggling(false);
    }
  }

  const isJobSearch = agent.agentType === "job_search";
  const totalNew = agent.newMatchCount + agent.newAlertCount;
  const stat = isJobSearch
    ? `${agent.matchCount} matches`
    : `${agent.watchedCompanies.length} companies`;

  // Stronger visual distinction for active vs inactive
  const borderClass = agent.isActive
    ? "border-accent/40"
    : "border-surface-border opacity-60";
  const iconBgClass = agent.isActive ? "bg-accent/10" : "bg-surface-light";

  return (
    <Link href={`/dashboard/agents/${agent.id}`} className="block group">
      <div
        className={`rounded-2xl border ${borderClass} bg-surface p-5 transition-all hover:opacity-100 hover:bg-surface-light`}
      >
        <div className="flex items-start gap-4">
          {/* Robot icon */}
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBgClass}`}
          >
            {isJobSearch ? (
              <JobSearchRobotIcon active={agent.isActive} />
            ) : (
              <CompanyWatcherRobotIcon active={agent.isActive} />
            )}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            {/* Name row — no wrap */}
            <div className="flex items-center gap-2 mb-1 min-w-0">
              <h3 className="text-base font-bold text-foreground truncate min-w-0">
                {agent.name}
              </h3>
              <div className="flex items-center gap-1.5 shrink-0">
                {totalNew > 0 && (
                  <Badge variant="success">{totalNew} new</Badge>
                )}
                <Badge variant={agent.isActive ? "live" : "neutral"}>
                  {agent.isActive ? "Live" : "Off"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted">
              <span>{stat}</span>
              <span className="text-surface-border">·</span>
              {agent.lastRunAt ? (
                <span>{formatTimeAgo(agent.lastRunAt)}</span>
              ) : (
                <span>Not scanned</span>
              )}
            </div>

            {isJobSearch && agent.desiredRole && (
              <p className="text-xs text-muted mt-1.5 truncate">
                {agent.desiredRole}
              </p>
            )}
          </div>

          {/* Toggle */}
          <div className="shrink-0 pt-1">
            <button
              onClick={handleToggle}
              disabled={toggling}
              className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors cursor-pointer ${
                agent.isActive ? "bg-accent" : "bg-surface-border"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  agent.isActive ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
