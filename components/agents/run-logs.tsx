import { Card } from "@/components/ui/card";

interface LogItem {
  title: string;
  company: string;
  location?: string | null;
  url: string;
  status: "matched" | "rejected_role" | "rejected_location" | "duplicate" | "stored";
  reason?: string;
}

interface LogEntry {
  step: string;
  detail: string;
  count?: number;
  items?: LogItem[];
}

interface RunLog {
  id: string;
  status: string;
  durationMs: number | null;
  log: string;
  summary: string;
  createdAt: Date;
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const STEP_ICONS: Record<string, string> = {
  start: "▶",
  keywords: "🔑",
  keywords_match: "🔑",
  search: "🔍",
  source_mojedelo: "📡",
  source_optius: "📡",
  source_mojedelo_error: "⚠",
  source_optius_error: "⚠",
  fetched: "📦",
  filter: "🔬",
  filter_result: "📋",
  filter_role: "✕",
  filter_location: "✕",
  dedup: "💾",
  companies: "🏢",
  company_search: "🔍",
  company_results: "📋",
  company_stored: "💾",
  company_error: "⚠",
  skip: "⏭",
  done: "✓",
};

function StepIcon({ step }: { step: string }) {
  const icon = STEP_ICONS[step] ?? "·";
  const isError = step.includes("error");
  const isDone = step === "done";

  let color = "text-muted";
  if (isError) color = "text-danger";
  else if (isDone) color = "text-accent";

  return <span className={`${color} text-xs w-5 shrink-0 text-center`}>{icon}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    success: "bg-accent/10 text-accent",
    partial: "bg-warning-soft text-warning",
    error: "bg-danger-soft text-danger",
  };

  return (
    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${styles[status] ?? styles.error}`}>
      {status}
    </span>
  );
}

function ItemStatusDot({ status }: { status: LogItem["status"] }) {
  const colors: Record<string, string> = {
    matched: "bg-accent",
    stored: "bg-accent",
    rejected_role: "bg-danger",
    rejected_location: "bg-warning",
    duplicate: "bg-muted",
  };
  return <span className={`h-1.5 w-1.5 rounded-full shrink-0 mt-1.5 ${colors[status] ?? "bg-muted"}`} />;
}

function ItemList({ items }: { items: LogItem[] }) {
  const matched = items.filter((i) => i.status === "matched");
  const rejected = items.filter((i) => i.status !== "matched");

  return (
    <div className="ml-7 mt-1 space-y-0.5">
      {matched.map((item, i) => (
        <div key={`m-${i}`} className="flex items-start gap-2 py-0.5">
          <ItemStatusDot status={item.status} />
          <div className="min-w-0">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-accent hover:underline truncate block"
            >
              {item.title}
            </a>
            <span className="text-[10px] text-muted">
              {item.company}
              {item.location && ` · ${item.location}`}
            </span>
          </div>
        </div>
      ))}

      {rejected.length > 0 && (
        <details className="mt-1">
          <summary className="text-[10px] text-muted cursor-pointer hover:text-muted-light">
            {rejected.length} rejected — click to see why
          </summary>
          <div className="mt-1 space-y-0.5 pl-1 border-l border-surface-border">
            {rejected.map((item, i) => (
              <div key={`r-${i}`} className="flex items-start gap-2 py-0.5">
                <ItemStatusDot status={item.status} />
                <div className="min-w-0">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-muted-light line-through decoration-danger/30 hover:text-foreground truncate block"
                  >
                    {item.title}
                  </a>
                  <span className="text-[10px] text-muted block">
                    {item.company}
                    {item.location && ` · ${item.location}`}
                  </span>
                  {item.reason && (
                    <span className="text-[10px] text-danger/70 block">
                      {item.reason}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function RunLogItem({ runLog }: { runLog: RunLog }) {
  let entries: LogEntry[] = [];
  try {
    entries = JSON.parse(runLog.log);
  } catch {
    entries = [{ step: "error", detail: "Failed to parse log" }];
  }

  return (
    <details className="group rounded-xl bg-surface-light overflow-hidden">
      <summary className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer hover:bg-surface-border/30 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <StatusBadge status={runLog.status} />
          <span className="text-sm text-foreground truncate">
            {runLog.summary}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {runLog.durationMs != null && (
            <span className="text-[10px] text-muted">
              {(runLog.durationMs / 1000).toFixed(1)}s
            </span>
          )}
          <span className="text-[10px] text-muted">
            {timeAgo(runLog.createdAt)}
          </span>
          <svg
            className="h-4 w-4 text-muted transition-transform group-open:rotate-180"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </summary>

      <div className="px-4 pb-3 pt-1 space-y-1 border-t border-surface-border">
        {entries.map((entry, i) => (
          <div key={i}>
            <div className="flex items-start gap-2 py-0.5">
              <StepIcon step={entry.step} />
              <span className="text-xs text-muted-light leading-relaxed">
                {entry.detail}
                {entry.count != null && entry.count > 0 && (
                  <span className="ml-1.5 text-foreground font-medium">
                    ({entry.count})
                  </span>
                )}
              </span>
            </div>
            {entry.items && entry.items.length > 0 && (
              <ItemList items={entry.items} />
            )}
          </div>
        ))}
      </div>
    </details>
  );
}

export function RunLogs({ logs }: { logs: RunLog[] }) {
  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <svg
          className="h-5 w-5 text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-xl font-bold text-foreground">Run History</h3>
      </div>

      {logs.length === 0 ? (
        <p className="text-sm text-muted">
          No runs yet. Hit &quot;Run Now&quot; to scan for jobs.
        </p>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <RunLogItem key={log.id} runLog={log} />
          ))}
        </div>
      )}
    </Card>
  );
}
