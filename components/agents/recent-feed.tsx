"use client";

import { useState } from "react";

interface FeedItem {
  id: string;
  type: "job" | "alert";
  title: string;
  subtitle: string;
  url: string;
  seen: boolean;
  favorited: boolean;
  foundAt: string;
  agentId: string;
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

export function RecentFeed({ items: initialItems }: { items: FeedItem[] }) {
  const [items, setItems] = useState(initialItems);

  async function patchMatch(
    agentId: string,
    matchId: string,
    body: { favorited?: boolean; discarded?: boolean }
  ) {
    const res = await fetch(`/api/agents/${agentId}/matches/${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  }

  function handleFavorite(e: React.MouseEvent, item: FeedItem) {
    e.preventDefault();
    e.stopPropagation();
    const newVal = !item.favorited;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, favorited: newVal } : i))
    );
    patchMatch(item.agentId, item.id, { favorited: newVal });
  }

  function handleDiscard(e: React.MouseEvent, item: FeedItem) {
    e.preventDefault();
    e.stopPropagation();
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    patchMatch(item.agentId, item.id, { discarded: true });
  }

  return (
    <div>
      <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4">
        Recent Findings
      </h2>

      <div className="space-y-1.5">
        {items.map((item) => (
          <a
            key={`${item.type}-${item.id}`}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-between gap-2 sm:gap-3 rounded-xl border border-transparent px-3 sm:px-4 py-2.5 sm:py-3 transition-all group ${
              item.favorited
                ? "bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/20"
                : "bg-surface hover:bg-surface-light hover:border-surface-border/50"
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {!item.seen && (
                <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
              )}
              <div className="min-w-0">
                <span className="text-xs sm:text-sm text-foreground group-hover:text-accent transition-colors truncate block">
                  {item.title}
                </span>
                <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted">
                  <span className="truncate">{item.subtitle}</span>
                  <span className="text-surface-border shrink-0">·</span>
                  <span className="shrink-0">{item.agentName}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded hidden sm:inline ${
                  item.type === "alert"
                    ? "bg-accent/10 text-accent"
                    : "bg-surface-light text-muted"
                }`}
              >
                {item.type === "alert" ? "Watch" : "Search"}
              </span>
              <span className="text-[10px] text-muted hidden sm:inline">
                {timeAgo(item.foundAt)}
              </span>

              {/* Only show action buttons for job type items */}
              {item.type === "job" && (
                <>
                  <button
                    onClick={(e) => handleFavorite(e, item)}
                    className={`p-1 sm:p-1.5 rounded-lg transition-colors ${
                      item.favorited
                        ? "text-red-500 hover:text-red-600"
                        : "text-muted/40 hover:text-red-400"
                    }`}
                    title={item.favorited ? "Remove from favorites" : "Add to favorites"}
                  >
                    <svg
                      className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                      viewBox="0 0 24 24"
                      fill={item.favorited ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => handleDiscard(e, item)}
                    className="p-1 sm:p-1.5 rounded-lg text-muted/40 hover:text-red-400 transition-colors"
                    title="Discard"
                  >
                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
