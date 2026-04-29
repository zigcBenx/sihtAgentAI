"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export function WelcomeBanner({ agentType }: { agentType: string }) {
  const searchParams = useSearchParams();
  const isNew = searchParams.get("new") === "1";
  const [dismissed, setDismissed] = useState(false);

  if (!isNew || dismissed) return null;

  const isJobSearch = agentType === "job_search";

  return (
    <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5 relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-muted hover:text-foreground transition-colors cursor-pointer"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <h3 className="text-base font-bold text-foreground mb-2">
        Your agent is ready!
      </h3>

      <div className="space-y-3 text-sm text-muted">
        <div className="flex items-start gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-bold">
            1
          </span>
          <p>
            <span className="text-foreground font-medium">Scan once now</span>
            {" — "}
            {isJobSearch
              ? "hit the button above to immediately search job boards and see your first results."
              : "hit the button above to check career pages right away and see what positions are open."}
          </p>
        </div>

        <div className="flex items-start gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-bold">
            2
          </span>
          <p>
            <span className="text-foreground font-medium">Automatic scanning is on</span>
            {" — "}
            your agent will scan on a schedule so you never miss new openings. You can turn it off above.
          </p>
        </div>

        {!isJobSearch && (
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-bold">
              3
            </span>
            <p>
              <span className="text-foreground font-medium">Add more companies</span>
              {" — "}
              scroll down to add more companies you want to keep an eye on.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
