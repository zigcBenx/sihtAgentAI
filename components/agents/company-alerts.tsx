import { Badge } from "@/components/ui/badge";

interface CompanyAlert {
  id: string;
  title: string;
  url: string;
  source: string;
  seen: boolean;
  foundAt: Date;
}

interface WatchedCompanyWithAlerts {
  id: string;
  companyName: string;
  careersUrl: string | null;
  alerts: CompanyAlert[];
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

export function CompanyAlerts({
  companies,
}: {
  companies: WatchedCompanyWithAlerts[];
}) {
  const totalAlerts = companies.reduce(
    (sum, c) => sum + c.alerts.length,
    0
  );
  const newAlerts = companies.reduce(
    (sum, c) => sum + c.alerts.filter((a) => !a.seen).length,
    0
  );

  if (totalAlerts === 0) {
    return (
      <div className="rounded-2xl border border-surface-border bg-surface p-5">
        <h3 className="text-base font-bold text-foreground mb-2">
          Found Openings
        </h3>
        <p className="text-sm text-muted">
          No openings found yet. Run the agent to scan career pages.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-surface-border bg-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-foreground">
          Found Openings
          <span className="ml-2 text-xs font-normal text-muted">
            {totalAlerts}
          </span>
        </h3>
        {newAlerts > 0 && (
          <Badge variant="success">
            {newAlerts} new
          </Badge>
        )}
      </div>

      <div className="space-y-4">
        {companies
          .filter((c) => c.alerts.length > 0)
          .map((company) => (
            <div key={company.id}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-foreground">
                  {company.companyName}
                </span>
                <span className="text-[10px] text-muted">
                  {company.alerts.length} position{company.alerts.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-1 pl-3 border-l-2 border-accent/20">
                {company.alerts.map((alert) => (
                  <a
                    key={alert.id}
                    href={alert.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 hover:bg-surface-light transition-colors group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {!alert.seen && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      )}
                      <span className="text-sm text-foreground group-hover:text-accent transition-colors truncate">
                        {alert.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted shrink-0">
                      {timeAgo(alert.foundAt)}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
