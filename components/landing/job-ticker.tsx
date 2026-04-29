"use client";

import { useState, useEffect } from "react";

interface JobCard {
  title: string;
  company: string;
  location: string;
  salary?: string;
  tag?: string;
  matched?: boolean;
}

const COLUMN_A: JobCard[] = [
  { title: "Senior Frontend Developer", company: "Outfit7", location: "Ljubljana", salary: "4.5k - 6k", tag: "React", matched: true },
  { title: "Marketing Manager", company: "Bitstamp", location: "Ljubljana", salary: "3.5k - 5k" },
  { title: "DevOps Engineer", company: "Celtra", location: "Remote", salary: "5k - 7k" },
  { title: "HR Business Partner", company: "Lek", location: "Ljubljana", salary: "3k - 4.5k" },
  { title: "iOS Developer", company: "Outfit7", location: "Ljubljana", tag: "Swift" },
  { title: "Financial Controller", company: "Krka", location: "Novo mesto", salary: "3.5k - 5k" },
  { title: "UX Researcher", company: "Celtra", location: "Remote", matched: true },
  { title: "Supply Chain Analyst", company: "Gorenje", location: "Velenje", salary: "2.8k - 4k" },
];

const COLUMN_B: JobCard[] = [
  { title: "Product Manager", company: "BetterCloud", location: "Remote", salary: "5k - 7k" },
  { title: "Cloud Architect", company: "NIL", location: "Ljubljana", salary: "6k - 8k", tag: "AWS" },
  { title: "Sales Executive", company: "Sportradar", location: "Ljubljana", salary: "3k - 5k" },
  { title: "React Native Dev", company: "Poligon", location: "Remote", salary: "3.5k - 5k", tag: "Mobile", matched: true },
  { title: "Legal Counsel", company: "NLB", location: "Ljubljana", salary: "4k - 6k" },
  { title: "Content Strategist", company: "Outfit7", location: "Remote", salary: "2.5k - 4k" },
  { title: "Tech Lead", company: "Zemanta", location: "Ljubljana", salary: "6k - 8k", tag: "Python" },
  { title: "Office Manager", company: "Celtra", location: "Ljubljana" },
];

const COLUMN_C: JobCard[] = [
  { title: "Data Scientist", company: "Zemanta", location: "Remote", salary: "4k - 6k", tag: "Python", matched: true },
  { title: "Graphic Designer", company: "Sportradar", location: "Ljubljana", salary: "2.5k - 4k", tag: "Design" },
  { title: "Account Executive", company: "Outbrain", location: "Remote", salary: "3.5k - 5.5k" },
  { title: "Platform Engineer", company: "Bitstamp", location: "Ljubljana", salary: "5k - 7k", tag: "Terraform" },
  { title: "Recruitment Specialist", company: "Lek", location: "Ljubljana", salary: "2.5k - 3.5k" },
  { title: "Project Manager", company: "Marand", location: "Ljubljana", salary: "3.5k - 5k" },
  { title: "Backend Engineer", company: "Qlector", location: "Ljubljana", salary: "4k - 5.5k", tag: "Go" },
  { title: "Customer Success Mgr", company: "NIL", location: "Remote", salary: "3k - 4.5k" },
];

const COLUMN_D: JobCard[] = [
  { title: "QA Engineer", company: "Sportradar", location: "Ljubljana", salary: "3k - 4.5k" },
  { title: "Copywriter", company: "Outfit7", location: "Remote", salary: "2k - 3.5k" },
  { title: "System Admin", company: "NIL", location: "Ljubljana", salary: "3.5k - 5k", tag: "Linux" },
  { title: "Business Analyst", company: "NLB", location: "Ljubljana", salary: "3.5k - 5k", matched: true },
  { title: "Warehouse Manager", company: "Gorenje", location: "Velenje", salary: "2.5k - 3.5k" },
  { title: "Scrum Master", company: "Celtra", location: "Remote", salary: "4k - 5.5k" },
  { title: "Android Developer", company: "Poligon", location: "Ljubljana", tag: "Kotlin" },
  { title: "Payroll Specialist", company: "Lek", location: "Ljubljana", salary: "2.5k - 3.5k" },
];

const COLUMN_E: JobCard[] = [
  { title: "Machine Learning Eng", company: "Zemanta", location: "Remote", salary: "5k - 7k", tag: "ML", matched: true },
  { title: "Compliance Officer", company: "Bitstamp", location: "Ljubljana", salary: "4k - 6k" },
  { title: "UI Designer", company: "Celtra", location: "Remote", salary: "3k - 4.5k", tag: "Figma" },
  { title: "Sales Manager", company: "Krka", location: "Novo mesto", salary: "3.5k - 5k" },
  { title: "Security Engineer", company: "NIL", location: "Ljubljana", salary: "5k - 7k" },
  { title: "Operations Lead", company: "Outfit7", location: "Ljubljana", salary: "4k - 5.5k" },
  { title: "Full Stack Dev", company: "Marand", location: "Ljubljana", salary: "4k - 6k", tag: "Node" },
  { title: "Technical Writer", company: "Outbrain", location: "Remote", salary: "2.5k - 4k" },
];

// Collect all non-matched card keys across columns for sequential "taken" animation
const ALL_COLUMNS = [COLUMN_A, COLUMN_B, COLUMN_C, COLUMN_D, COLUMN_E];
const TAKEABLE_KEYS: string[] = [];
ALL_COLUMNS.forEach((col, colIdx) => {
  col.forEach((job, jobIdx) => {
    if (!job.matched) {
      TAKEABLE_KEYS.push(`${colIdx}-${jobIdx}`);
    }
  });
});

function JobCardItem({ job, taken }: { job: JobCard; taken: boolean }) {
  const isTaken = taken && !job.matched;

  return (
    <div
      className={`rounded-xl p-3 w-full transition-all duration-700 ${
        job.matched
          ? "border-l-[3px] border-l-accent border border-accent/20 bg-surface shadow-[0_1px_6px_rgba(79,70,229,0.08)]"
          : isTaken
          ? "border border-surface-border/20 bg-surface/50 opacity-50"
          : "border border-surface-border/40 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          {job.matched && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          )}
          <h4 className={`text-[12px] font-semibold leading-tight truncate transition-all duration-700 ${
            job.matched
              ? "text-foreground"
              : isTaken
              ? "text-muted line-through font-medium"
              : "text-foreground/80"
          }`}>
            {job.title}
          </h4>
        </div>
        {job.tag && (
          <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-semibold transition-all duration-700 ${
            job.matched
              ? "bg-accent/15 text-accent"
              : isTaken
              ? "bg-surface-light/50 text-muted/50 line-through font-medium"
              : "bg-accent/8 text-accent/60"
          }`}>
            {job.tag}
          </span>
        )}
      </div>
      <div className={`flex items-center justify-between text-[10px] transition-all duration-700 ${
        job.matched
          ? "text-muted-light"
          : isTaken
          ? "text-muted/60"
          : "text-muted"
      }`}>
        <span>{job.company} · {job.location}</span>
        {job.salary && (
          <span className={`font-medium transition-all duration-700 ${
            isTaken ? "text-muted/40 line-through" : "text-accent/50"
          }`}>
            {job.salary}
          </span>
        )}
      </div>
    </div>
  );
}

function TickerColumn({
  jobs,
  direction,
  duration,
  colIdx,
  takenKeys,
}: {
  jobs: JobCard[];
  direction: "up" | "down";
  duration: string;
  colIdx: number;
  takenKeys: Set<string>;
}) {
  const doubled = [...jobs, ...jobs];

  return (
    <div className="relative h-full overflow-hidden flex-1 min-w-0">
      <div
        className={direction === "up" ? "ticker-up" : "ticker-down"}
        style={{ "--duration": duration } as React.CSSProperties}
      >
        <div className="flex flex-col gap-2.5 py-1">
          {doubled.map((job, i) => {
            const origIdx = i % jobs.length;
            const key = `${colIdx}-${origIdx}`;
            return (
              <JobCardItem
                key={`${job.title}-${i}`}
                job={job}
                taken={takenKeys.has(key)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function JobTicker() {
  const [takenKeys, setTakenKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    let idx = 0;

    const interval = setInterval(() => {
      if (idx < TAKEABLE_KEYS.length) {
        setTakenKeys((prev) => {
          const next = new Set(prev);
          next.add(TAKEABLE_KEYS[idx]);
          return next;
        });
        idx++;
      } else {
        // Reset: clear all taken, start over
        setTakenKeys(new Set());
        idx = 0;
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex gap-2.5 h-full w-full">
      <TickerColumn jobs={COLUMN_A} direction="up" duration="35s" colIdx={0} takenKeys={takenKeys} />
      <TickerColumn jobs={COLUMN_B} direction="down" duration="40s" colIdx={1} takenKeys={takenKeys} />
      <TickerColumn jobs={COLUMN_C} direction="up" duration="38s" colIdx={2} takenKeys={takenKeys} />
      <div className="hidden lg:contents">
        <TickerColumn jobs={COLUMN_D} direction="down" duration="36s" colIdx={3} takenKeys={takenKeys} />
        <TickerColumn jobs={COLUMN_E} direction="up" duration="42s" colIdx={4} takenKeys={takenKeys} />
      </div>
    </div>
  );
}
