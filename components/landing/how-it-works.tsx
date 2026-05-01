"use client";

import { useEffect, useRef, useState } from "react";

/* ─── Fake UI mockup: CV Upload ────────────────────────────────── */
function StepUploadCV() {
  const [uploaded, setUploaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setUploaded(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="rounded-2xl border border-surface-border bg-surface p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-accent/10 to-accent-light/10 flex items-center justify-center">
          <svg className="h-3.5 w-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <span className="text-xs font-semibold text-foreground">Upload your CV</span>
      </div>

      {/* Upload zone */}
      <div className={`rounded-xl border-2 border-dashed p-4 text-center transition-all duration-500 ${
        uploaded
          ? "border-accent/40 bg-accent/5"
          : "border-surface-border bg-surface-light"
      }`}>
        {uploaded ? (
          <div className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium text-accent">my_resume.pdf uploaded</span>
          </div>
        ) : (
          <div className="space-y-1">
            <svg className="h-6 w-6 text-muted mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-[10px] text-muted">PDF, DOC, DOCX</p>
          </div>
        )}
      </div>

      {/* Extracted skills preview */}
      <div className={`mt-3 overflow-hidden transition-all duration-500 ${
        uploaded ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
      }`}>
        <p className="text-[10px] text-muted mb-1.5">Extracted skills:</p>
        <div className="flex flex-wrap gap-1">
          {["React", "TypeScript", "Node.js", "SQL"].map((skill) => (
            <span key={skill} className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Fake UI mockup: Pick job titles ──────────────────────────── */
function StepPickRoles() {
  const [selected, setSelected] = useState<string[]>([]);
  const roles = ["Software Development", "Marketing", "Design", "Data & Analytics", "Product Management", "Engineering"];

  useEffect(() => {
    const timers = [
      setTimeout(() => setSelected(["Software Development"]), 1200),
      setTimeout(() => setSelected(["Software Development", "Engineering"]), 2200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="rounded-2xl border border-surface-border bg-surface p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-accent/10 to-accent-light/10 flex items-center justify-center">
          <svg className="h-3.5 w-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <span className="text-xs font-semibold text-foreground">What kind of work?</span>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-1.5">
        {roles.map((role) => {
          const isSelected = selected.includes(role);
          return (
            <span
              key={role}
              className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-all duration-300 ${
                isSelected
                  ? "bg-gradient-to-r from-accent to-accent-hover text-white shadow-sm"
                  : "bg-surface-light text-muted-light border border-surface-border"
              }`}
            >
              {role}
            </span>
          );
        })}
      </div>

      {/* Experience level */}
      <div className={`mt-3 overflow-hidden transition-all duration-500 ${
        selected.length > 0 ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
      }`}>
        <p className="text-[10px] text-muted mb-1.5">Experience level:</p>
        <div className="grid grid-cols-2 gap-1">
          {["Entry level", "Mid (2-5 yrs)"].map((lvl, i) => (
            <span
              key={lvl}
              className={`rounded-lg px-2 py-1 text-[10px] font-medium text-center transition-all duration-300 ${
                i === 1
                  ? "bg-accent/10 text-accent border border-accent/20"
                  : "bg-surface-light text-muted border border-surface-border"
              }`}
            >
              {lvl}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Fake UI mockup: Agent running ────────────────────────────── */
function StepRunAgent() {
  const [phase, setPhase] = useState<"scanning" | "found">("scanning");

  useEffect(() => {
    const timer = setTimeout(() => setPhase("found"), 2500);
    return () => clearTimeout(timer);
  }, []);

  const matches = [
    { title: "Frontend Developer", company: "Celtra", tag: "Perfect Fit" },
    { title: "React Engineer", company: "Outfit7", tag: "Good Fit" },
    { title: "Full Stack Dev", company: "Bitstamp", tag: "Good Fit" },
  ];

  return (
    <div className="rounded-2xl border border-surface-border bg-surface p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-accent/10 to-accent-light/10 flex items-center justify-center">
            <svg className="h-3.5 w-3.5 text-accent" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5.14v14l11-7-11-7z" />
            </svg>
          </div>
          <span className="text-xs font-semibold text-foreground">Your Agent</span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          LIVE
        </span>
      </div>

      {/* Scanning / Results */}
      {phase === "scanning" ? (
        <div className="flex flex-col items-center py-4 gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-surface-border border-t-accent" />
          <span className="text-[10px] text-muted">Scanning job boards...</span>
          <div className="w-full bg-surface-light rounded-full h-1 mt-1 overflow-hidden">
            <div className="bg-accent h-1 rounded-full animate-pulse" style={{ width: "65%" }} />
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 mb-2">
            <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[10px] font-medium text-accent">Found 3 matches!</span>
          </div>
          {matches.map((m) => (
            <div key={m.title} className="flex items-center justify-between rounded-lg bg-surface-light px-2.5 py-2">
              <div>
                <span className="text-[10px] font-medium text-foreground block">{m.title}</span>
                <span className="text-[9px] text-muted">{m.company}</span>
              </div>
              <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${
                m.tag === "Perfect Fit"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-accent/10 text-accent"
              }`}>
                {m.tag}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Section wrapper with scroll-triggered animations ─────────── */
function StepCard({
  number,
  title,
  description,
  children,
  delay,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {/* Step number + label */}
      <div className="flex items-center gap-3 mb-4">
        <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-hover text-white text-sm font-bold shadow-[0_2px_8px_rgba(79,70,229,0.3)]">
          {number}
        </span>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-foreground">{title}</h3>
          <p className="text-xs sm:text-sm text-muted">{description}</p>
        </div>
      </div>

      {/* Mock UI */}
      {children}
    </div>
  );
}

/* ─── Connector line between steps ─────────────────────────────── */
function Connector() {
  return (
    <div className="flex justify-start pl-[15px] sm:pl-[17px]">
      <div className="w-px h-6 sm:h-8 bg-gradient-to-b from-accent/30 to-accent/10" />
    </div>
  );
}

/* ─── Main export ──────────────────────────────────────────────── */
export function HowItWorks() {
  return (
    <section className="relative z-10 py-16 sm:py-24 px-4 sm:px-8 bg-background">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-accent/4 blur-[120px]" />

      <div className="mx-auto max-w-xl relative">
        {/* Section header */}
        <div className="text-center mb-12 sm:mb-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface px-3 py-1 text-[11px] sm:text-xs text-muted-light shadow-sm mb-4 sm:mb-5">
            <svg className="h-3 w-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            Takes under 2 minutes
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold text-foreground mb-3">
            How it works
          </h2>
          <p className="text-sm sm:text-base text-muted max-w-md mx-auto">
            Three simple steps to never miss a job opportunity again.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-0">
          <StepCard
            number="1"
            title="Upload your CV"
            description="Drop your resume and we extract your skills automatically."
            delay={0}
          >
            <StepUploadCV />
          </StepCard>

          <Connector />

          <StepCard
            number="2"
            title="Pick your job titles"
            description="Select the roles you want and set your preferences."
            delay={150}
          >
            <StepPickRoles />
          </StepCard>

          <Connector />

          <StepCard
            number="3"
            title="Run your agent"
            description="Hit play and let it scan daily. You get notified when it finds matches."
            delay={300}
          >
            <StepRunAgent />
          </StepCard>
        </div>
      </div>
    </section>
  );
}
