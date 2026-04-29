"use client";

interface JobCard {
  title: string;
  company: string;
  location: string;
  salary?: string;
  tag?: string;
}

const COLUMN_A: JobCard[] = [
  { title: "Senior Frontend Developer", company: "Outfit7", location: "Ljubljana", salary: "4.5k - 6k", tag: "React" },
  { title: "Marketing Manager", company: "Bitstamp", location: "Ljubljana", salary: "3.5k - 5k" },
  { title: "DevOps Engineer", company: "Celtra", location: "Remote", salary: "5k - 7k" },
  { title: "HR Business Partner", company: "Lek", location: "Ljubljana", salary: "3k - 4.5k" },
  { title: "iOS Developer", company: "Outfit7", location: "Ljubljana", tag: "Swift" },
  { title: "Financial Controller", company: "Krka", location: "Novo mesto", salary: "3.5k - 5k" },
  { title: "UX Researcher", company: "Celtra", location: "Remote" },
  { title: "Supply Chain Analyst", company: "Gorenje", location: "Velenje", salary: "2.8k - 4k" },
];

const COLUMN_B: JobCard[] = [
  { title: "Product Manager", company: "BetterCloud", location: "Remote", salary: "5k - 7k" },
  { title: "Cloud Architect", company: "NIL", location: "Ljubljana", salary: "6k - 8k", tag: "AWS" },
  { title: "Sales Executive", company: "Sportradar", location: "Ljubljana", salary: "3k - 5k" },
  { title: "React Native Dev", company: "Poligon", location: "Remote", salary: "3.5k - 5k", tag: "Mobile" },
  { title: "Legal Counsel", company: "NLB", location: "Ljubljana", salary: "4k - 6k" },
  { title: "Content Strategist", company: "Outfit7", location: "Remote", salary: "2.5k - 4k" },
  { title: "Tech Lead", company: "Zemanta", location: "Ljubljana", salary: "6k - 8k", tag: "Python" },
  { title: "Office Manager", company: "Celtra", location: "Ljubljana" },
];

const COLUMN_C: JobCard[] = [
  { title: "Data Scientist", company: "Zemanta", location: "Remote", salary: "4k - 6k", tag: "Python" },
  { title: "Graphic Designer", company: "Sportradar", location: "Ljubljana", salary: "2.5k - 4k", tag: "Design" },
  { title: "Account Executive", company: "Outbrain", location: "Remote", salary: "3.5k - 5.5k" },
  { title: "Platform Engineer", company: "Bitstamp", location: "Ljubljana", salary: "5k - 7k", tag: "Terraform" },
  { title: "Recruitment Specialist", company: "Lek", location: "Ljubljana", salary: "2.5k - 3.5k" },
  { title: "Project Manager", company: "Marand", location: "Ljubljana", salary: "3.5k - 5k" },
  { title: "Backend Engineer", company: "Qlector", location: "Ljubljana", salary: "4k - 5.5k", tag: "Go" },
  { title: "Customer Success Mgr", company: "NIL", location: "Remote", salary: "3k - 4.5k" },
];

function JobCardItem({ job }: { job: JobCard }) {
  return (
    <div className="rounded-xl border border-surface-border/50 bg-surface/90 backdrop-blur-sm p-3.5 w-full shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h4 className="text-[13px] font-semibold text-foreground/90 leading-tight">
          {job.title}
        </h4>
        {job.tag && (
          <span className="shrink-0 rounded-md bg-gradient-to-r from-accent/10 to-accent-light/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
            {job.tag}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted">
        <span>{job.company} · {job.location}</span>
        {job.salary && <span className="text-accent/60 font-medium">{job.salary}</span>}
      </div>
    </div>
  );
}

function TickerColumn({
  jobs,
  direction,
  duration,
}: {
  jobs: JobCard[];
  direction: "up" | "down";
  duration: string;
}) {
  const doubled = [...jobs, ...jobs];

  return (
    <div className="relative h-full overflow-hidden flex-1 min-w-0">
      <div
        className={direction === "up" ? "ticker-up" : "ticker-down"}
        style={{ "--duration": duration } as React.CSSProperties}
      >
        <div className="flex flex-col gap-3 py-1">
          {doubled.map((job, i) => (
            <JobCardItem key={`${job.title}-${i}`} job={job} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function JobTicker() {
  return (
    <div className="flex gap-3 h-full w-full">
      <TickerColumn jobs={COLUMN_A} direction="up" duration="35s" />
      <TickerColumn jobs={COLUMN_B} direction="down" duration="40s" />
      <div className="hidden sm:contents">
        <TickerColumn jobs={COLUMN_C} direction="up" duration="38s" />
      </div>
    </div>
  );
}
