"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  reason?: "agents" | "companies" | "results";
}

const BENEFITS = [
  { text: "5 agents", free: "1 agent" },
  { text: "Daily scans", free: "Weekly scans" },
  { text: "20 watched companies", free: "3 companies" },
  { text: "Unlimited results", free: "10 visible" },
];

export function UpgradeModal({ open, onClose, reason }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const headline =
    reason === "agents"
      ? "You've reached your agent limit"
      : reason === "companies"
        ? "You've reached your company limit"
        : reason === "results"
          ? "Unlock all your results"
          : "Upgrade to Pro";

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-2xl border border-surface-border bg-surface p-6 shadow-[0_4px_24px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)]">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-surface-light transition-colors cursor-pointer"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Icon */}
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent/10 to-accent-light/10 mb-4">
          <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
          </svg>
        </div>

        <h2 className="text-lg font-bold text-foreground mb-1">
          {headline}
        </h2>
        <p className="text-sm text-muted mb-5">
          Go Pro for 6.99€/mo and unlock the full power of your agents.
        </p>

        {/* Benefits */}
        <ul className="space-y-2.5 mb-6">
          {BENEFITS.map((b) => (
            <li key={b.text} className="flex items-center gap-2.5">
              <svg className="h-4 w-4 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              <span className="text-sm text-foreground">{b.text}</span>
              <span className="text-xs text-muted ml-auto">{b.free}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Button
          size="lg"
          className="w-full"
          onClick={handleUpgrade}
          disabled={loading}
        >
          {loading ? "Redirecting..." : "Upgrade to Pro"}
        </Button>

        <button
          onClick={onClose}
          className="w-full mt-2 py-2 text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
