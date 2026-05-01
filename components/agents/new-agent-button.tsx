"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UpgradeModal } from "@/components/upgrade-modal";

export function NewAgentButton({
  agentCount,
  maxAgents,
  size = "default",
  children,
}: {
  agentCount: number;
  maxAgents: number;
  size?: "default" | "lg";
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [showUpgrade, setShowUpgrade] = useState(false);

  function handleClick() {
    if (agentCount >= maxAgents) {
      setShowUpgrade(true);
    } else {
      router.push("/dashboard/agents/new");
    }
  }

  return (
    <>
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        reason="agents"
      />
      <Button size={size} onClick={handleClick}>
        {children}
      </Button>
    </>
  );
}
