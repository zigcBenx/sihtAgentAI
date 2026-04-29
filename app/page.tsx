import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JobTicker } from "@/components/landing/job-ticker";

export default function Home() {
  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      {/* ─── Nav ─────────────────────────────────────────── */}
      <nav className="relative z-30 shrink-0 flex items-center justify-between px-4 py-3 sm:px-8 sm:py-4 lg:px-12">
        <span className="text-lg font-bold text-foreground">
          Šiht<span className="bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">Agent</span>
        </span>
        <div className="flex gap-2 sm:gap-3">
          <Link href="/login">
            <Button variant="ghost" size="default">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button size="default">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* ─── Hero — ticker as full-width backdrop ────────── */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        {/* Ticker fills the entire background */}
        <div className="absolute inset-0 z-0 opacity-[0.35]">
          <div className="h-full px-3 sm:px-8 lg:px-12">
            <JobTicker />
          </div>
        </div>

        {/* Radial fade: clear center, faded edges — wider on mobile for readability */}
        <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_90%_60%_at_50%_45%,_var(--background)_35%,_transparent_75%)] sm:bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,_var(--background)_30%,_transparent_80%)]" />

        {/* Top/bottom fades for the ticker */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-16 sm:h-20 bg-gradient-to-b from-background to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-16 sm:h-20 bg-gradient-to-t from-background to-transparent" />

        {/* Hero content — centered on top of everything */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 sm:px-8 text-center">
          {/* Glows */}
          <div className="pointer-events-none absolute top-1/4 left-1/3 h-[350px] w-[350px] rounded-full bg-accent/6 blur-[120px]" />
          <div className="pointer-events-none absolute bottom-1/3 right-1/3 h-[250px] w-[250px] rounded-full bg-accent-light/5 blur-[100px]" />

          <div className="relative max-w-2xl w-full">
            <div className="mb-4 sm:mb-6 inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface/90 backdrop-blur-sm px-3 py-1 sm:px-4 sm:py-1.5 text-[11px] sm:text-xs text-muted-light shadow-[0_1px_4px_rgba(0,0,0,0.06)] fade-in-up">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Scanning Slovenian job market
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl fade-in-up leading-[1.08]">
              Your jobs found
              <br />
              <span className="bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">while you sleep</span>
            </h1>

            <p className="mx-auto mt-4 sm:mt-6 max-w-sm sm:max-w-lg text-sm sm:text-base lg:text-lg leading-relaxed text-muted-light fade-in-up-delay-1">
              Create an AI agent that hunts job positions for you.
              Set your dream role, salary, and location — it scans
              continuously and alerts you when something matches.
            </p>

            <div className="mt-6 sm:mt-8 flex items-center justify-center gap-3 fade-in-up-delay-2">
              <Link href="/register">
                <Button size="lg" className="px-6 sm:px-8">
                  Start Free
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" size="lg">
                  Sign In
                </Button>
              </Link>
            </div>

            {/* ─── Mini steps — stacked on mobile, inline on sm+ ─── */}
            <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-0 fade-in-up-delay-3">
              <div className="hidden sm:inline-flex items-center gap-6 rounded-2xl border border-surface-border/60 bg-surface/80 backdrop-blur-sm px-5 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                {[
                  { num: "1", text: "Tell us your dream role" },
                  { num: "2", text: "AI scans daily" },
                  { num: "3", text: "Get matched positions" },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {i > 0 && (
                      <svg className="h-3 w-3 text-surface-border -ml-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">
                      {step.num}
                    </span>
                    <span className="text-xs text-muted-light whitespace-nowrap">
                      {step.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Mobile: compact horizontal pills */}
              <div className="flex sm:hidden items-center gap-2 rounded-xl border border-surface-border/60 bg-surface/80 backdrop-blur-sm px-3 py-2 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                {[
                  { num: "1", text: "Set role" },
                  { num: "2", text: "AI scans" },
                  { num: "3", text: "Get matched" },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    {i > 0 && (
                      <svg className="h-2.5 w-2.5 text-surface-border shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[8px] font-bold text-accent">
                      {step.num}
                    </span>
                    <span className="text-[10px] text-muted-light whitespace-nowrap">
                      {step.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
