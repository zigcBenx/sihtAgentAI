"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const FREQUENCY_LABELS: Record<string, string> = {
  hourly: "every hour",
  daily: "daily",
  weekly: "weekly",
};

interface AgentDetailHeaderProps {
  agentId: string;
  agentName: string;
  agentType: string;
  isActive: boolean;
  frequency: string;
  lastRunAt: string | null;
  onOpenSettings: () => void;
}

export function AgentDetailHeader({
  agentId,
  agentName,
  agentType,
  isActive,
  frequency,
  lastRunAt,
  onOpenSettings,
}: AgentDetailHeaderProps) {
  const router = useRouter();
  const [toggling, setToggling] = useState(false);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<{
    newJobMatches: number;
    newCompanyAlerts: number;
  } | null>(null);
  const [runError, setRunError] = useState("");

  const isJobSearch = agentType === "job_search";
  const typeLabel = isJobSearch ? "Job Search" : "Company Watcher";
  const freqLabel = FREQUENCY_LABELS[frequency] ?? frequency;

  async function handleToggle() {
    setToggling(true);
    try {
      await fetch(`/api/agents/${agentId}/toggle`, { method: "POST" });
      router.refresh();
    } finally {
      setToggling(false);
    }
  }

  async function handleRun() {
    setRunning(true);
    setRunError("");
    setRunResult(null);
    try {
      const res = await fetch(`/api/agents/${agentId}/run`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        setRunError(data.error ?? "Run failed");
        return;
      }
      const data = await res.json();
      setRunResult(data);
      router.refresh();
    } catch {
      setRunError("Network error");
    } finally {
      setRunning(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this agent?")) return;
    await fetch(`/api/agents/${agentId}`, { method: "DELETE" });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Top bar: back + name + settings/delete */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-light text-muted hover:text-foreground transition-colors shrink-0"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground truncate">
              {agentName}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>{typeLabel}</span>
            {lastRunAt && (
              <>
                <span className="text-surface-border">·</span>
                <span>Last scan: {new Date(lastRunAt).toLocaleDateString()}</span>
              </>
            )}
          </div>
        </div>

        {/* Settings + Delete */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onOpenSettings}
            title="Settings"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-surface-light transition-colors cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            title="Delete agent"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:text-red-400 hover:bg-red-600/10 transition-colors cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Automatic scanning toggle — clear labeled section */}
      <div className="flex items-center justify-between rounded-2xl border border-surface-border bg-surface p-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              Automatic scanning
            </span>
            {isActive && (
              <Badge variant="live">On</Badge>
            )}
          </div>
          <p className="text-xs text-muted mt-0.5">
            {isActive
              ? `Scans automatically ${freqLabel}`
              : "Turned off — enable to scan on a schedule"}
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
            isActive ? "bg-accent" : "bg-surface-border"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${
              isActive ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Scan now — one-time action */}
      <Button
        onClick={handleRun}
        disabled={running}
        variant="secondary"
        size="default"
        className="w-full"
      >
        {running ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Scanning now...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            Scan once now
          </span>
        )}
      </Button>

      {/* Run result/error feedback */}
      {runResult && (
        <div className="rounded-xl bg-accent/10 border border-accent/20 px-4 py-3 text-sm text-accent">
          Found {runResult.newJobMatches} new job{runResult.newJobMatches !== 1 ? "s" : ""} and{" "}
          {runResult.newCompanyAlerts} company alert{runResult.newCompanyAlerts !== 1 ? "s" : ""}.
        </div>
      )}
      {runError && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {runError}
        </div>
      )}
    </div>
  );
}
