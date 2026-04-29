const features = [
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
    title: "Personal AI Agent",
    description:
      "Tell your agent what you want — role, salary, location. It learns your preferences and hunts 24/7.",
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Watch Companies",
    description:
      "Target specific companies you love. Get notified the moment they post a new opening.",
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: "Runs Automatically",
    description:
      "Set your frequency — hourly, daily, or weekly. Your agent runs on autopilot while you sleep.",
  },
];

export function Features() {
  return (
    <div className="grid gap-6 sm:grid-cols-3">
      {features.map((feature, i) => (
        <div
          key={feature.title}
          className={`fade-in-up-delay-${i + 1} rounded-2xl border border-surface-border bg-surface p-7`}
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
            {feature.icon}
          </div>
          <h3 className="mb-2 text-lg font-bold text-foreground">
            {feature.title}
          </h3>
          <p className="text-sm leading-relaxed text-muted-light">
            {feature.description}
          </p>
        </div>
      ))}
    </div>
  );
}
