import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JobTicker } from "@/components/landing/job-ticker";

export default function Home() {
  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      {/* ─── Nav ─────────────────────────────────────────── */}
      <nav className="relative z-30 shrink-0 flex items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
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

      {/* ─── Hero — fills remaining height ────────────────── */}
      <div className="relative z-10 flex flex-1 min-h-0 flex-col lg:flex-row items-stretch">
        {/* Left — copy, vertically centered */}
        <div className="relative z-20 flex flex-col justify-center shrink-0 px-5 py-8 sm:px-8 lg:w-1/2 lg:py-0 lg:px-12 xl:px-20">
          {/* Glow */}
          <div className="pointer-events-none absolute -top-32 -left-32 h-[400px] w-[400px] rounded-full bg-accent/8 blur-[120px]" />
          <div className="pointer-events-none absolute -bottom-20 right-0 h-[250px] w-[250px] rounded-full bg-accent-light/6 blur-[100px]" />

          <div className="relative max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface px-4 py-1.5 text-xs text-muted-light shadow-[0_1px_4px_rgba(0,0,0,0.04)] fade-in-up">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Scanning Slovenian job market
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem] xl:text-6xl fade-in-up leading-[1.1]">
              Your jobs found
              <br />
              <span className="bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">while you sleep</span>
            </h1>

            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-light sm:text-lg fade-in-up-delay-1">
              Create an AI agent that hunts job positions for you.
              Set your dream role, salary, and location — it scans
              continuously and alerts you when something matches.
            </p>

            <div className="mt-8 flex gap-3 fade-in-up-delay-2">
              <Link href="/register">
                <Button size="lg" className="px-8">
                  Start Free
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" size="lg">
                  Sign In
                </Button>
              </Link>
            </div>

            <p className="mt-4 text-xs text-muted fade-in-up-delay-3">
              No credit card required
            </p>
          </div>
        </div>

        {/* Right — ticker, fills remaining height */}
        <div className="relative flex-1 min-h-0 lg:w-1/2">
          {/* Fades */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 sm:h-24 bg-gradient-to-b from-background to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 sm:h-24 bg-gradient-to-t from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-background to-transparent hidden lg:block" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background to-transparent hidden lg:block" />

          <div className="h-full px-4 sm:px-6 lg:pl-0 lg:pr-10">
            <JobTicker />
          </div>
        </div>
      </div>
    </div>
  );
}
