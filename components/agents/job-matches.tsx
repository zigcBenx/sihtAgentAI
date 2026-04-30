"use client";

import { useState } from "react";
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
  favorited: boolean;
  discarded: boolean;
  foundAt: Date;
}

type FilterTab = "all" | "favorites" | "discarded";

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

export function JobMatches({
  matches: initialMatches,
  agentId,
}: {
  matches: JobMatch[];
  agentId: string;
}) {
  const [matches, setMatches] = useState(initialMatches);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  async function patchMatch(matchId: string, body: { favorited?: boolean; discarded?: boolean }) {
    const res = await fetch(`/api/agents/${agentId}/matches/${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return;

    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, ...body } : m))
    );
  }

  function toggleFavorite(e: React.MouseEvent, match: JobMatch) {
    e.preventDefault();
    e.stopPropagation();
    patchMatch(match.id, { favorited: !match.favorited });
  }

  function toggleDiscard(e: React.MouseEvent, match: JobMatch) {
    e.preventDefault();
    e.stopPropagation();
    patchMatch(match.id, { discarded: !match.discarded });
  }

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

  // Filter matches based on active tab
  let filtered: JobMatch[];
  if (activeTab === "favorites") {
    filtered = matches.filter((m) => m.favorited);
  } else if (activeTab === "discarded") {
    filtered = matches.filter((m) => m.discarded);
  } else {
    filtered = matches.filter((m) => !m.discarded);
  }

  // Sort: favorited items first within each tier
  const sorted = [...filtered].sort((a, b) => {
    if (a.favorited !== b.favorited) return a.favorited ? -1 : 1;
    return 0;
  });

  const unseenCount = matches.filter((m) => !m.seen && !m.discarded).length;
  const favCount = matches.filter((m) => m.favorited).length;
  const discardedCount = matches.filter((m) => m.discarded).length;

  // Group by relevance tier
  const grouped = new Map<string, JobMatch[]>();
  for (const tier of TIER_ORDER) {
    const items = sorted.filter((m) => m.relevance === tier);
    if (items.length > 0) grouped.set(tier, items);
  }

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: "all", label: "All" },
    { key: "favorites", label: "Favorites", count: favCount },
    { key: "discarded", label: "Discarded", count: discardedCount },
  ];

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <h3 className="text-xl font-bold text-foreground">Job Matches</h3>
          <Badge variant="success">{matches.filter((m) => !m.discarded).length}</Badge>
        </div>
        {unseenCount > 0 && (
          <span className="text-xs text-accent font-medium">
            {unseenCount} new
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-accent text-white"
                : "bg-surface-light text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted py-4 text-center">
          {activeTab === "favorites"
            ? "No favorites yet. Click the heart icon on a job to save it."
            : activeTab === "discarded"
              ? "No discarded jobs."
              : "No matches to show."}
        </p>
      ) : (
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
                      className={`flex items-start justify-between gap-3 rounded-xl px-4 py-3 transition-colors group ${
                        match.favorited
                          ? "bg-red-500/5 hover:bg-red-500/10"
                          : "bg-surface-light hover:bg-surface-border/50"
                      }`}
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
                      <div className="shrink-0 flex items-center gap-2">
                        <div className="flex flex-col items-end gap-1 mr-1">
                          <span className="text-[10px] text-muted">{timeAgo(match.foundAt)}</span>
                          <span className="text-[10px] text-muted/50">{match.source}</span>
                        </div>

                        {/* Favorite button */}
                        <button
                          onClick={(e) => toggleFavorite(e, match)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            match.favorited
                              ? "text-red-500 hover:text-red-600"
                              : "text-muted/40 hover:text-red-400"
                          }`}
                          title={match.favorited ? "Remove from favorites" : "Add to favorites"}
                        >
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill={match.favorited ? "currentColor" : "none"}
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

                        {/* Discard / Restore button */}
                        {activeTab === "discarded" ? (
                          <button
                            onClick={(e) => toggleDiscard(e, match)}
                            className="p-1.5 rounded-lg text-muted/40 hover:text-emerald-500 transition-colors"
                            title="Restore"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            onClick={(e) => toggleDiscard(e, match)}
                            className="p-1.5 rounded-lg text-muted/40 hover:text-red-400 transition-colors"
                            title="Discard"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
