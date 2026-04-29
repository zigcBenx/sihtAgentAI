"use client";

import { Suspense, useState } from "react";
import { AgentDetailHeader } from "./agent-detail-header";
import { SettingsModal } from "./settings-modal";
import { WelcomeBanner } from "./welcome-banner";

interface AgentDetailClientProps {
  agentId: string;
  agentName: string;
  agentType: string;
  isActive: boolean;
  lastRunAt: string | null;
  settingsData: {
    name: string;
    profileSummary?: string;
    desiredRole?: string;
    salaryMin?: string;
    salaryMax?: string;
    locationPreference?: string;
    specificCity?: string;
    frequency: string;
  };
  children: React.ReactNode;
}

export function AgentDetailClient({
  agentId,
  agentName,
  agentType,
  isActive,
  lastRunAt,
  settingsData,
  children,
}: AgentDetailClientProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <AgentDetailHeader
        agentId={agentId}
        agentName={agentName}
        agentType={agentType}
        isActive={isActive}
        frequency={settingsData.frequency}
        lastRunAt={lastRunAt}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <Suspense>
        <WelcomeBanner agentType={agentType} />
      </Suspense>

      {children}

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        agentId={agentId}
        agentType={agentType}
        initialData={settingsData}
      />
    </>
  );
}
