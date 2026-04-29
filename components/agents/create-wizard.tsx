"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type AgentType = "job_search" | "company_watcher";
type Step = "pick_type" | "configure";

const frequencyOptions = [
  { value: "hourly", label: "Every hour" },
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

  // Job search fields
  const [name, setName] = useState("");
  const [desiredRole, setDesiredRole] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [locationPreference, setLocationPreference] = useState("");
  const [specificCity, setSpecificCity] = useState("");
  const [frequency, setFrequency] = useState("daily");

  // Company watcher fields
  const [firstCompanyName, setFirstCompanyName] = useState("");
  const [firstCareersUrl, setFirstCareersUrl] = useState("");

  function selectType(type: AgentType) {
    setAgentType(type);
    setStep("configure");
    setName(
      type === "job_search" ? "My Job Search" : "Company Watcher"
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agentType) return;
    setSubmitting(true);
    setError("");

    const payload: Record<string, unknown> = {
      name,
      agentType,
      frequency,
    };

    if (desiredRole) payload.desiredRole = desiredRole;

    if (agentType === "job_search") {
      if (salaryMin) payload.salaryMin = Number(salaryMin);
      if (salaryMax) payload.salaryMax = Number(salaryMax);
      if (locationPreference) payload.locationPreference = locationPreference;
      if (specificCity) payload.specificCity = specificCity;
    }

    try {
      // Create the agent
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
        setSubmitting(false);
        return;
      }

      const agent = await res.json();

      // If company watcher, add first company
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
      setSubmitting(false);
    }
  }

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
          {/* Job Search card */}
          <button
            onClick={() => selectType("job_search")}
            className="group rounded-2xl border-2 border-surface-border bg-surface p-6 text-left transition-all hover:border-accent hover:bg-surface-light cursor-pointer"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 mb-4">
              <svg
                className="h-6 w-6 text-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              Job Search
            </h3>
            <p className="text-sm text-muted">
              Automatically search job boards for positions matching your role,
              location, and salary preferences.
            </p>
          </button>

          {/* Company Watcher card */}
          <button
            onClick={() => selectType("company_watcher")}
            className="group rounded-2xl border-2 border-surface-border bg-surface p-6 text-left transition-all hover:border-accent hover:bg-surface-light cursor-pointer"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 mb-4">
              <svg
                className="h-6 w-6 text-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              Company Watcher
            </h3>
            <p className="text-sm text-muted">
              Monitor specific companies and get notified when they post new
              job openings on their careers page.
            </p>
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Configure
  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Back to type selection */}
        <button
          type="button"
          onClick={() => {
            setStep("pick_type");
            setAgentType(null);
          }}
          className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Change agent type
        </button>

        <div>
          <h2 className="text-xl font-bold text-foreground">
            {agentType === "job_search"
              ? "Set up your Job Search agent"
              : "Set up your Company Watcher"}
          </h2>
          <p className="text-sm text-muted mt-1">
            {agentType === "job_search"
              ? "Tell us what kind of job you're looking for and we'll scan job boards for you."
              : "Add companies you're interested in and we'll check their careers pages for new openings."}
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <Input
          id="name"
          label="Agent Name"
          placeholder={
            agentType === "job_search"
              ? "e.g. Frontend Jobs"
              : "e.g. Dream Companies"
          }
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {agentType === "job_search" && (
          <>
            <Input
              id="desiredRole"
              label="What role are you looking for?"
              placeholder="e.g. Frontend Developer, WordPress Engineer, Data Analyst"
              value={desiredRole}
              onChange={(e) => setDesiredRole(e.target.value)}
            />

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
          <>
            <Input
              id="desiredRole"
              label="What kind of position are you looking for?"
              placeholder="e.g. Frontend Developer, Marketing, Data Analyst"
              value={desiredRole}
              onChange={(e) => setDesiredRole(e.target.value)}
            />
            <p className="text-xs text-muted -mt-4">
              Optional — helps filter out unrelated positions from career pages.
            </p>

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
          </>
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
