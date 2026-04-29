"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RunAgent({ agentId }: { agentId: string }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{
    newJobMatches: number;
    newCompanyAlerts: number;
  } | null>(null);
  const [error, setError] = useState("");

  async function handleRun() {
    setRunning(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`/api/agents/${agentId}/run`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Run failed");
        return;
      }

      const data = await res.json();
      setResult(data);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handleRun}
        disabled={running}
        variant="secondary"
        size="lg"
        className="w-full"
      >
        {running ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Scanning...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
            </svg>
            Run Now
          </span>
        )}
      </Button>

      {result && (
        <div className="rounded-xl bg-accent/10 border border-accent/20 px-4 py-3 text-sm text-accent">
          Found {result.newJobMatches} new job{result.newJobMatches !== 1 ? "s" : ""} and{" "}
          {result.newCompanyAlerts} company alert{result.newCompanyAlerts !== 1 ? "s" : ""}.
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-danger-soft border border-danger-border px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}
    </div>
  );
}
