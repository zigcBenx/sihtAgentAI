import { CreateWizard } from "@/components/agents/create-wizard";
import Link from "next/link";

export default function NewAgentPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-light text-muted hover:text-foreground transition-colors"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">New Agent</h1>
      </div>
      <CreateWizard />
    </div>
  );
}
