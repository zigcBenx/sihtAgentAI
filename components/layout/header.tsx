"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  userName?: string | null;
  plan?: "free" | "pro";
}

export function Header({ userName, plan = "free" }: HeaderProps) {
  const [loading, setLoading] = useState(false);

  async function handleManageBilling() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  }

  return (
    <header className="border-b border-surface-border/60 bg-surface/70 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="text-lg font-bold text-foreground">
          Šiht<span className="bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">Agent</span> AI
        </Link>
        <div className="flex items-center gap-3">
          {plan === "pro" ? (
            <button
              onClick={handleManageBilling}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent to-accent-light px-3 py-1 text-xs font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
              </svg>
              Pro
            </button>
          ) : (
            <Link
              href="/#pricing"
              className="inline-flex items-center rounded-full border border-surface-border bg-surface px-3 py-1 text-xs font-medium text-muted hover:text-foreground hover:border-accent/40 transition-colors"
            >
              Free plan
            </Link>
          )}
          {userName && (
            <span className="text-sm text-muted hidden sm:inline">{userName}</span>
          )}
          {plan === "pro" && (
            <Button
              variant="ghost"
              onClick={handleManageBilling}
              disabled={loading}
            >
              {loading ? "Loading..." : "Billing"}
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => signOut({ redirectTo: "/" })}
          >
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
