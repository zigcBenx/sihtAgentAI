"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function DeleteAgent({ agentId }: { agentId: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this agent?")) return;

    await fetch(`/api/agents/${agentId}`, { method: "DELETE" });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Button variant="danger" onClick={handleDelete}>
      Delete
    </Button>
  );
}
