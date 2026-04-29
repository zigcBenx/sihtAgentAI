"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export function ToggleActive({
  agentId,
  isActive,
}: {
  agentId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [toggling, setToggling] = useState(false);

  async function handleToggle() {
    setToggling(true);
    try {
      await fetch(`/api/agents/${agentId}/toggle`, { method: "POST" });
      router.refresh();
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="flex items-center justify-between rounded-2xl border border-surface-border bg-surface p-5">
      <div className="flex items-center gap-3">
        <Badge variant={isActive ? "live" : "neutral"}>
          {isActive ? "Live" : "Inactive"}
        </Badge>
        <span className="text-sm text-muted">
          {isActive
            ? "Agent is actively scanning for jobs"
            : "Agent is paused"}
        </span>
      </div>
      <button
        onClick={handleToggle}
        disabled={toggling}
        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
          isActive ? "bg-accent" : "bg-surface-border"
        }`}
      >
        <span
          className={`inline-block h-6 w-6 rounded-full bg-white transition-transform ${
            isActive ? "translate-x-7" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
