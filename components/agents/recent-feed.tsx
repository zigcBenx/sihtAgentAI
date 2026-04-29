interface FeedItem {
  id: string;
  type: "job" | "alert";
  title: string;
  subtitle: string;
  url: string;
  seen: boolean;
  foundAt: string;
  agentName: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function RecentFeed({ items }: { items: FeedItem[] }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-4">
        Recent Findings
      </h2>

      <div className="space-y-1.5">
        {items.map((item) => (
          <a
            key={`${item.type}-${item.id}`}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3 hover:bg-surface-light transition-colors group"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {!item.seen && (
                <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
              )}
              <div className="min-w-0">
                <span className="text-sm text-foreground group-hover:text-accent transition-colors truncate block">
                  {item.title}
                </span>
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span>{item.subtitle}</span>
                  <span className="text-surface-border">·</span>
                  <span>{item.agentName}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  item.type === "alert"
                    ? "bg-accent/10 text-accent"
                    : "bg-surface-light text-muted"
                }`}
              >
                {item.type === "alert" ? "Watch" : "Search"}
              </span>
              <span className="text-[10px] text-muted">
                {timeAgo(item.foundAt)}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
