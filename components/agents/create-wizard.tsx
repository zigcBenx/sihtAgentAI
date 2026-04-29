"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type AgentType = "job_search" | "company_watcher";
type Step =
  | "pick_type"
  | "work_type"
  | "experience"
  | "additional"
  | "configure"
  | "generating";

const WORK_SUGGESTIONS = [
  "Software Development",
  "Marketing",
  "Finance",
  "Design",
  "Management",
  "Sales",
  "HR",
  "Legal",
  "Operations",
  "Data & Analytics",
  "Customer Support",
  "Product Management",
  "Engineering",
  "Content & Writing",
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

const locationOptions = [
  { value: "", label: "Not specified" },
  { value: "remote", label: "Remote" },
  { value: "slovenia", label: "Anywhere in Slovenia" },
  { value: "specific_city", label: "Specific city in Slovenia" },
];

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
  const [locationPreference, setLocationPreference] = useState("");
  const [specificCity, setSpecificCity] = useState("");
  const [frequency, setFrequency] = useState("daily");

  // Company watcher fields
  const [firstCompanyName, setFirstCompanyName] = useState("");
  const [firstCareersUrl, setFirstCareersUrl] = useState("");

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
        if (locationPreference) payload.locationPreference = locationPreference;
        if (specificCity) payload.specificCity = specificCity;
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
        <div className="space-y-6">
          <BackButton onClick={() => { setStep("pick_type"); setAgentType(null); }} />

          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              What kind of work are you looking for?
            </h2>
            <p className="text-sm text-muted">
              Pick one or more categories, or type your own.
            </p>
          </div>

          <Input
            id="workType"
            placeholder="e.g. Frontend Developer, Marketing Manager, Data Analyst..."
            value={workType}
            onChange={(e) => setWorkType(e.target.value)}
            autoFocus
          />

          <div className="flex flex-wrap gap-2">
            {WORK_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => toggleChip(suggestion)}
                className={`rounded-full px-4 py-2 text-sm transition-all cursor-pointer ${
                  selectedChips.includes(suggestion)
                    ? "bg-gradient-to-r from-accent to-accent-hover text-white font-medium shadow-sm"
                    : "bg-surface text-muted-light border border-surface-border hover:border-accent/40 hover:text-foreground"
                }`}
              >
                {suggestion}
              </button>
            ))}
          </div>

          <Button
            size="lg"
            onClick={selectWorkType}
            disabled={!workType.trim()}
            className="w-full"
          >
            Continue
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
              Optional — tell us about specific skills, industries, or
              preferences you have. This helps us find better matches.
            </p>
          </div>

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

            <Select
              id="locationPreference"
              label="Preferred Location"
              options={locationOptions}
              value={locationPreference}
              onChange={(e) => setLocationPreference(e.target.value)}
            />

            {locationPreference === "specific_city" && (
              <Input
                id="specificCity"
                label="City"
                placeholder="e.g. Ljubljana"
                value={specificCity}
                onChange={(e) => setSpecificCity(e.target.value)}
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
