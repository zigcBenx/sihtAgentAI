"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SLOVENIAN_REGIONS } from "@/lib/validations/agent";

type AgentType = "job_search" | "company_watcher";
type Step =
  | "pick_type"
  | "work_type"
  | "experience"
  | "additional"
  | "configure"
  | "generating";

const WORK_CATEGORIES = [
  {
    label: "IT & razvoj",
    suggestions: [
      "Programer / Developer",
      "Sistemski administrator",
      "Data & analitika",
      "UX / UI dizajn",
      "Product management",
    ],
  },
  {
    label: "Pisarna & administracija",
    suggestions: [
      "Marketing",
      "Finance / računovodstvo",
      "Kadrovnik / HR",
      "Prodaja / Sales",
      "Administracija",
      "Pravo / Legal",
    ],
  },
  {
    label: "Obrt & fizično delo",
    suggestions: [
      "Elektrikar",
      "Strojnik / mehanik",
      "Voznik / šofer",
      "Proizvodnja / delavec",
      "Skladiščnik",
      "Gradbenik",
      "Vzdrževalec",
      "Varnostnik",
    ],
  },
  {
    label: "Storitve & drugo",
    suggestions: [
      "Kuhar / gostinstvo",
      "Trgovec / prodajalec",
      "Zdravstvo / nega",
      "Izobraževanje",
      "Logistika & transport",
      "Turizem",
    ],
  },
];

const EXPERIENCE_LEVELS = [
  { value: "Entry level", description: "Just starting out or career switch" },
  { value: "Mid (2-5 years)", description: "Some experience under your belt" },
  { value: "Senior (5+ years)", description: "Deep expertise in your field" },
  { value: "Lead / Management", description: "Leading teams or departments" },
];

const frequencyOptions = [
  { value: "daily", label: "Once a day" },
  { value: "weekly", label: "Once a week" },
];

const WORK_MODE_CHIPS = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
] as const;

const GEO_SCOPE_OPTIONS = [
  { value: "", label: "Anywhere" },
  { value: "slovenia", label: "Slovenia" },
  { value: "region", label: "Region" },
  { value: "city", label: "Specific city" },
] as const;

/** Toggle a value in a comma-separated string */
function toggleCsv(csv: string, val: string): string {
  const items = csv.split(",").map((s) => s.trim()).filter(Boolean);
  if (items.includes(val)) {
    return items.filter((s) => s !== val).join(",");
  }
  return [...items, val].join(",");
}

function csvHas(csv: string, val: string): boolean {
  return csv.split(",").map((s) => s.trim()).includes(val);
}

export function CreateWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("pick_type");
  const [agentType, setAgentType] = useState<AgentType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Guided questions
  const [workType, setWorkType] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");

  // Job search fields
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [workMode, setWorkMode] = useState("");
  const [geoScope, setGeoScope] = useState("");
  const [geoValue, setGeoValue] = useState("");
  const [frequency, setFrequency] = useState("daily");

  // Company watcher fields
  const [firstCompanyName, setFirstCompanyName] = useState("");
  const [firstCareersUrl, setFirstCareersUrl] = useState("");

  // CV upload
  const [cvUploading, setCvUploading] = useState(false);
  const [cvFileName, setCvFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Agent name (auto-generated, editable)
  const [name, setName] = useState("");

  function selectType(type: AgentType) {
    setAgentType(type);
    setStep("work_type");
  }

  function selectWorkType() {
    if (!workType.trim()) return;
    setStep("experience");
  }

  function selectExperience(level: string) {
    setExperienceLevel(level);
    setStep("additional");
  }

  function goToConfig() {
    if (!name) {
      const suffix =
        agentType === "job_search" ? "Job Search" : "Company Watcher";
      setName(`${workType.trim()} ${suffix}`);
    }
    setStep("configure");
  }

  async function handleCvUpload(file: File) {
    setCvUploading(true);
    setCvFileName(file.name);
    try {
      const formData = new FormData();
      formData.append("cv", file);
      const res = await fetch("/api/agents/parse-cv", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to parse CV");
        setCvFileName("");
        return;
      }
      const data = await res.json();
      setAdditionalContext((prev) =>
        prev ? `${prev}\n\n${data.extracted}` : data.extracted
      );
    } catch {
      setError("Failed to upload CV");
      setCvFileName("");
    } finally {
      setCvUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agentType) return;
    setSubmitting(true);
    setError("");
    setStep("generating");

    try {
      // Step 1: Generate profile via Claude
      const profileRes = await fetch("/api/agents/generate-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workType: workType.trim(),
          experienceLevel,
          additionalContext: additionalContext.trim() || undefined,
          agentType,
        }),
      });

      let profileSummary = "";
      let searchTerms = "";

      if (profileRes.ok) {
        const profile = await profileRes.json();
        profileSummary = profile.profileSummary || "";
        searchTerms = JSON.stringify(profile.searchTerms || []);
      }

      // Step 2: Create the agent
      const payload: Record<string, unknown> = {
        name: name.trim(),
        agentType,
        frequency,
      };

      if (profileSummary) payload.profileSummary = profileSummary;
      if (searchTerms) payload.searchTerms = searchTerms;
      payload.desiredRole = workType.trim();

      if (agentType === "job_search") {
        if (salaryMin) payload.salaryMin = Number(salaryMin);
        if (salaryMax) payload.salaryMax = Number(salaryMax);
        if (workMode) payload.workMode = workMode;
        if (geoScope) payload.geoScope = geoScope;
        if (geoValue) payload.geoValue = geoValue;
      }

      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
        setStep("configure");
        setSubmitting(false);
        return;
      }

      const agent = await res.json();

      // Step 3: Add first company for company watcher
      if (
        agentType === "company_watcher" &&
        firstCompanyName.trim() &&
        firstCareersUrl.trim()
      ) {
        await fetch(`/api/agents/${agent.id}/companies`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName: firstCompanyName.trim(),
            careersUrl: firstCareersUrl.trim(),
          }),
        });
      }

      router.push(`/dashboard/agents/${agent.id}?new=1`);
    } catch {
      setError("Network error");
      setStep("configure");
      setSubmitting(false);
    }
  }

  // ─── Step: Pick Type ─────────────────────────────────────────────
  if (step === "pick_type") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            What kind of agent do you need?
          </h2>
          <p className="text-sm text-muted">
            Choose the type of agent you want to create. You can always create
            more later.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => selectType("job_search")}
            className="group rounded-2xl border-2 border-surface-border bg-surface p-6 text-left transition-all hover:border-accent/50 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent/10 to-accent-light/10 mb-4">
              <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Job Search</h3>
            <p className="text-sm text-muted">
              Automatically search job boards for positions matching your role,
              location, and salary preferences.
            </p>
          </button>

          <button
            onClick={() => selectType("company_watcher")}
            className="group rounded-2xl border-2 border-surface-border bg-surface p-6 text-left transition-all hover:border-accent/50 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent/10 to-accent-light/10 mb-4">
              <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Company Watcher</h3>
            <p className="text-sm text-muted">
              Monitor specific companies and get notified when they post new
              job openings on their careers page.
            </p>
          </button>
        </div>
      </div>
    );
  }

  // ─── Step: Work Type ─────────────────────────────────────────────
  if (step === "work_type") {
    const selectedChips = workType
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    function toggleChip(suggestion: string) {
      const current = workType
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (current.includes(suggestion)) {
        setWorkType(current.filter((s) => s !== suggestion).join(", "));
      } else {
        setWorkType([...current, suggestion].join(", "));
      }
    }

    return (
      <Card>
        <div className="space-y-5">
          <BackButton onClick={() => { setStep("pick_type"); setAgentType(null); }} />

          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Kakšno delo iščete?
            </h2>
            <p className="text-sm text-muted">
              Izberite kategorije ali vpišite svoje — ločite z vejico.
            </p>
          </div>

          {/* Input — prominent with pencil icon */}
          <div className="relative">
            <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
              <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </div>
            <input
              id="workType"
              placeholder="Vpišite poklic, npr. Elektrikar, Frontend developer..."
              value={workType}
              onChange={(e) => setWorkType(e.target.value)}
              autoFocus
              className="block w-full rounded-xl border-2 border-accent/30 bg-surface pl-10 pr-4 py-3.5 text-base text-foreground placeholder-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            {workType && (
              <button
                type="button"
                onClick={() => setWorkType("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Selected pills */}
          {selectedChips.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedChips.map((chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-accent to-accent-hover text-white px-3 py-1 text-sm font-medium shadow-sm"
                >
                  {chip}
                  <button
                    type="button"
                    onClick={() => toggleChip(chip)}
                    className="ml-0.5 hover:bg-white/20 rounded-full p-0.5 transition-colors cursor-pointer"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Grouped suggestion chips */}
          <div className="space-y-4">
            <p className="text-xs text-muted uppercase tracking-wider font-medium">Ali izberite iz seznama:</p>
            {WORK_CATEGORIES.map((cat) => (
              <div key={cat.label}>
                <p className="text-xs font-semibold text-muted-light mb-2">{cat.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {cat.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => toggleChip(suggestion)}
                      className={`rounded-full px-3 py-1.5 text-sm transition-all cursor-pointer ${
                        selectedChips.includes(suggestion)
                          ? "bg-accent/15 text-accent font-medium border border-accent/30 ring-1 ring-accent/20"
                          : "bg-surface text-muted-light border border-surface-border hover:border-accent/40 hover:text-foreground"
                      }`}
                    >
                      {selectedChips.includes(suggestion) && (
                        <svg className="inline h-3 w-3 mr-1 -ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Button
            size="lg"
            onClick={selectWorkType}
            disabled={!workType.trim()}
            className="w-full"
          >
            Naprej
          </Button>
        </div>
      </Card>
    );
  }

  // ─── Step: Experience Level ──────────────────────────────────────
  if (step === "experience") {
    return (
      <Card>
        <div className="space-y-6">
          <BackButton onClick={() => setStep("work_type")} />

          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              How much experience do you have?
            </h2>
            <p className="text-sm text-muted">
              This helps us find the right level of positions for you.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {EXPERIENCE_LEVELS.map((level) => (
              <button
                key={level.value}
                onClick={() => selectExperience(level.value)}
                className={`rounded-xl border-2 p-4 text-left transition-all cursor-pointer ${
                  experienceLevel === level.value
                    ? "border-accent bg-accent/5"
                    : "border-surface-border bg-surface-light hover:border-accent/50"
                }`}
              >
                <div className="text-sm font-semibold text-foreground">
                  {level.value}
                </div>
                <div className="text-xs text-muted mt-1">
                  {level.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // ─── Step: Additional Context ────────────────────────────────────
  if (step === "additional") {
    return (
      <Card>
        <div className="space-y-6">
          <BackButton onClick={() => setStep("experience")} />

          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Anything else we should know?
            </h2>
            <p className="text-sm text-muted">
              Optional — upload your CV to auto-extract skills and experience,
              or type it manually below.
            </p>
          </div>

          {/* CV Upload */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleCvUpload(file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={cvUploading}
              className="w-full rounded-xl border-2 border-dashed border-surface-border bg-surface-light p-5 text-center transition-all hover:border-accent/50 hover:bg-accent/5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cvUploading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-surface-border border-t-accent" />
                  <span className="text-sm text-muted">
                    Extracting details from {cvFileName}...
                  </span>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex justify-center">
                    <svg className="h-8 w-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    Upload your CV
                  </p>
                  <p className="text-xs text-muted">
                    PDF, DOC, DOCX, or TXT — max 5MB
                  </p>
                  {cvFileName && (
                    <p className="text-xs text-accent mt-1">
                      Extracted from {cvFileName}
                    </p>
                  )}
                </div>
              )}
            </button>
          </div>

          {error && (
            <div className="rounded-xl bg-danger-soft border border-danger-border px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <textarea
            id="additionalContext"
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            placeholder="e.g. I know Python and React, I prefer startups, I want remote work, I'm switching from accounting to UX..."
            rows={4}
            className="block w-full rounded-xl border border-surface-border bg-surface px-4 py-3.5 text-base text-foreground placeholder-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
          />

          <div className="flex gap-3">
            <Button size="lg" onClick={goToConfig} className="flex-1">
              Continue
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => {
                setAdditionalContext("");
                goToConfig();
              }}
            >
              Skip
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // ─── Step: Generating ────────────────────────────────────────────
  if (step === "generating") {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-surface-border border-t-accent" />
          <p className="text-base font-medium text-foreground">
            Setting up your agent...
          </p>
          <p className="text-sm text-muted">
            Generating your search profile with AI
          </p>
        </div>
      </Card>
    );
  }

  // ─── Step: Configure (type-specific) ─────────────────────────────
  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        <BackButton onClick={() => setStep("additional")} />

        <div>
          <h2 className="text-xl font-bold text-foreground">
            {agentType === "job_search" ? "Final details" : "Almost done"}
          </h2>
          <p className="text-sm text-muted mt-1">
            {agentType === "job_search"
              ? "Set your salary and location preferences."
              : "Add the first company you want to monitor."}
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-danger-soft border border-danger-border px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <Input
          id="name"
          label="Agent Name"
          placeholder="e.g. Frontend Jobs"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* Summary of what was selected */}
        <div className="rounded-xl bg-surface-light border-l-[3px] border-l-accent/40 border border-surface-border p-4 space-y-1">
          <div className="text-xs text-muted uppercase tracking-wider font-medium">
            Your profile
          </div>
          <div className="text-sm text-foreground">
            {workType} &middot; {experienceLevel}
          </div>
          {additionalContext && (
            <div className="text-sm text-muted">{additionalContext}</div>
          )}
        </div>

        {agentType === "job_search" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="salaryMin"
                label="Min Salary (EUR)"
                type="number"
                placeholder="e.g. 2000"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
              />
              <Input
                id="salaryMax"
                label="Max Salary (EUR)"
                type="number"
                placeholder="e.g. 4000"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
              />
            </div>

            {/* Work mode — multi-select */}
            <div>
              <label className="block text-sm font-medium text-muted-light mb-2">
                Work mode
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setWorkMode("")}
                  className={`rounded-full px-4 py-2 text-sm transition-all cursor-pointer ${
                    !workMode
                      ? "bg-gradient-to-r from-accent to-accent-hover text-white font-medium shadow-sm"
                      : "bg-surface text-muted-light border border-surface-border hover:border-accent/40 hover:text-foreground"
                  }`}
                >
                  Doesn&apos;t matter
                </button>
                {WORK_MODE_CHIPS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setWorkMode(toggleCsv(workMode, opt.value))}
                    className={`rounded-full px-4 py-2 text-sm transition-all cursor-pointer ${
                      csvHas(workMode, opt.value)
                        ? "bg-gradient-to-r from-accent to-accent-hover text-white font-medium shadow-sm"
                        : "bg-surface text-muted-light border border-surface-border hover:border-accent/40 hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Geographic area */}
            <div>
              <label className="block text-sm font-medium text-muted-light mb-2">
                Where?
              </label>
              <div className="flex flex-wrap gap-2">
                {GEO_SCOPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setGeoScope(opt.value);
                      if (opt.value !== "region" && opt.value !== "city") {
                        setGeoValue("");
                      }
                    }}
                    className={`rounded-full px-4 py-2 text-sm transition-all cursor-pointer ${
                      geoScope === opt.value
                        ? "bg-gradient-to-r from-accent to-accent-hover text-white font-medium shadow-sm"
                        : "bg-surface text-muted-light border border-surface-border hover:border-accent/40 hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {geoScope === "region" && (
              <div>
                <label className="block text-sm font-medium text-muted-light mb-2">
                  Select regions
                </label>
                <div className="flex flex-wrap gap-2">
                  {SLOVENIAN_REGIONS.map((region) => (
                    <button
                      key={region}
                      type="button"
                      onClick={() => setGeoValue(toggleCsv(geoValue, region))}
                      className={`rounded-full px-3.5 py-1.5 text-sm transition-all cursor-pointer ${
                        csvHas(geoValue, region)
                          ? "bg-gradient-to-r from-accent to-accent-hover text-white font-medium shadow-sm"
                          : "bg-surface text-muted-light border border-surface-border hover:border-accent/40 hover:text-foreground"
                      }`}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {geoScope === "city" && (
              <Input
                id="geoValue"
                label="Cities"
                placeholder="e.g. Ljubljana, Maribor, Celje"
                value={geoValue}
                onChange={(e) => setGeoValue(e.target.value)}
              />
            )}
          </>
        )}

        {agentType === "company_watcher" && (
          <div className="rounded-xl border border-surface-border bg-surface-light p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                Add your first company
              </h3>
              <p className="text-xs text-muted">
                You can add more companies after creating the agent.
              </p>
            </div>

            <Input
              id="companyName"
              label="Company Name"
              placeholder="e.g. Google, Outfit7, Celtra"
              value={firstCompanyName}
              onChange={(e) => setFirstCompanyName(e.target.value)}
            />

            <Input
              id="careersUrl"
              label="Careers Page URL"
              placeholder="e.g. https://company.com/careers"
              value={firstCareersUrl}
              onChange={(e) => setFirstCareersUrl(e.target.value)}
            />

            <p className="text-xs text-muted">
              Paste the link to the company&apos;s careers or jobs page.
              We&apos;ll check it regularly for new positions.
            </p>
          </div>
        )}

        <Select
          id="frequency"
          label="How often should we check?"
          options={frequencyOptions}
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
        />

        <div className="flex gap-3 pt-2">
          <Button type="submit" size="lg" disabled={submitting || !name.trim()}>
            {submitting ? "Creating..." : "Create Agent"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={() => router.push("/dashboard")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Back
    </button>
  );
}
