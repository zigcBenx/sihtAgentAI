import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface JobMatch {
  id: string;
  title: string;
  company: string;
  location: string | null;
  url: string;
  source: string;
  relevance: string;
  seen: boolean;
  foundAt: Date;
}

const RELEVANCE_CONFIG = {
  perfect: { label: "Perfect Fit", color: "text-emerald-600", dotColor: "bg-emerald-500" },
  good: { label: "Good Fit", color: "text-accent", dotColor: "bg-accent" },
  partial: { label: "Worth a Look", color: "text-amber-600", dotColor: "bg-amber-500" },
  other: { label: "Other", color: "text-muted", dotColor: "bg-muted" },
} as const;

const TIER_ORDER = ["perfect", "good", "partial", "other"] as const;

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function JobMatches({ matches }: { matches: JobMatch[] }) {
  if (matches.length === 0) {
    return (
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <svg className="h-6 w-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <h3 className="text-xl font-bold text-foreground">Job Matches</h3>
        </div>
        <p className="text-sm text-muted">
          No matches yet. Run your agent to start scanning job boards.
        </p>
      </Card>
    );
  }

  const unseenCount = matches.filter((m) => !m.seen).length;

  // Group by relevance tier
  const grouped = new Map<string, JobMatch[]>();
  for (const tier of TIER_ORDER) {
    const items = matches.filter((m) => m.relevance === tier);
    if (items.length > 0) grouped.set(tier, items);
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <h3 className="text-xl font-bold text-foreground">Job Matches</h3>
          <Badge variant="success">{matches.length}</Badge>
        </div>
        {unseenCount > 0 && (
          <span className="text-xs text-accent font-medium">
            {unseenCount} new
          </span>
        )}
      </div>

      <div className="space-y-6">
        {[...grouped.entries()].map(([tier, items]) => {
          const config = RELEVANCE_CONFIG[tier as keyof typeof RELEVANCE_CONFIG];
          return (
            <div key={tier}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`h-2 w-2 rounded-full ${config.dotColor}`} />
                <span className={`text-xs font-semibold uppercase tracking-wider ${config.color}`}>
                  {config.label}
                </span>
                <span className="text-xs text-muted">({items.length})</span>
              </div>
              <div className="space-y-2">
                {items.map((match) => (
                  <a
                    key={match.id}
                    href={match.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start justify-between gap-3 rounded-xl bg-surface-light px-4 py-3 hover:bg-surface-border/50 transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        {!match.seen && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
                        )}
                        <span className="text-sm font-medium text-foreground group-hover:text-accent transition-colors truncate">
                          {match.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <span>{match.company}</span>
                        {match.location && (
                          <>
                            <span className="text-surface-border">·</span>
                            <span>{match.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span className="text-[10px] text-muted">{timeAgo(match.foundAt)}</span>
                      <span className="text-[10px] text-muted/50">{match.source}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
