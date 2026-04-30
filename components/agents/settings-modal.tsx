"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SLOVENIAN_REGIONS } from "@/lib/validations/agent";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  agentId: string;
  agentType: string;
  initialData: {
    name: string;
    profileSummary?: string;
    desiredRole?: string;
    salaryMin?: string;
    salaryMax?: string;
    workMode?: string;
    geoScope?: string;
    geoValue?: string;
    frequency: string;
  };
}

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

const frequencyOptions = [
  { value: "daily", label: "Once a day" },
  { value: "weekly", label: "Once a week" },
];

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

export function SettingsModal({
  open,
  onClose,
  agentId,
  agentType,
  initialData,
}: SettingsModalProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(initialData.name);
  const [profileSummary, setProfileSummary] = useState(
    initialData.profileSummary ?? initialData.desiredRole ?? ""
  );
  const [salaryMin, setSalaryMin] = useState(initialData.salaryMin ?? "");
  const [salaryMax, setSalaryMax] = useState(initialData.salaryMax ?? "");
  const [workMode, setWorkMode] = useState(initialData.workMode ?? "");
  const [geoScope, setGeoScope] = useState(initialData.geoScope ?? "");
  const [geoValue, setGeoValue] = useState(initialData.geoValue ?? "");
  const [frequency, setFrequency] = useState(initialData.frequency);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setName(initialData.name);
      setProfileSummary(initialData.profileSummary ?? initialData.desiredRole ?? "");
      setSalaryMin(initialData.salaryMin ?? "");
      setSalaryMax(initialData.salaryMax ?? "");
      setWorkMode(initialData.workMode ?? "");
      setGeoScope(initialData.geoScope ?? "");
      setGeoValue(initialData.geoValue ?? "");
      setFrequency(initialData.frequency);
      setError("");
    }
  }, [open, initialData]);

  if (!open) return null;

  const isJobSearch = agentType === "job_search";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const payload: Record<string, unknown> = { name, frequency };

    if (profileSummary) {
      payload.profileSummary = profileSummary;
      // Clear cached searchTerms so runner re-expands from new summary
      payload.searchTerms = "";
    }

    if (isJobSearch) {
      if (salaryMin) payload.salaryMin = Number(salaryMin);
      if (salaryMax) payload.salaryMax = Number(salaryMax);
      payload.workMode = workMode || undefined;
      payload.geoScope = geoScope || undefined;
      payload.geoValue = geoValue || undefined;
    }

    try {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
        return;
      }

      router.refresh();
      onClose();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-surface-border bg-surface p-6 shadow-[0_4px_24px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">
            {isJobSearch ? "Search Settings" : "Agent Settings"}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-surface-light transition-colors cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-danger-soft border border-danger-border px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="name"
            label="Agent Name"
            placeholder="e.g. My Job Hunter"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div>
            <label
              htmlFor="profileSummary"
              className="block text-sm font-medium text-muted-light mb-1.5"
            >
              {isJobSearch ? "Your profile" : "Position filter"}
            </label>
            <textarea
              id="profileSummary"
              rows={3}
              className="w-full rounded-xl border border-surface-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
              placeholder={
                isJobSearch
                  ? "e.g. Senior frontend developer with 5+ years React experience, prefers startups..."
                  : "e.g. Frontend Developer, Marketing, Data Analyst"
              }
              value={profileSummary}
              onChange={(e) => setProfileSummary(e.target.value)}
            />
            <p className="text-xs text-muted mt-1">
              {isJobSearch
                ? "Edit to refine what positions match"
                : "Optional — helps filter out unrelated positions from career pages"}
            </p>
          </div>

          {isJobSearch && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="salaryMin"
                  label="Min Salary (EUR)"
                  type="number"
                  placeholder="e.g. 3000"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                />
                <Input
                  id="salaryMax"
                  label="Max Salary (EUR)"
                  type="number"
                  placeholder="e.g. 5000"
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
                    className={`rounded-full px-3.5 py-1.5 text-sm transition-all cursor-pointer ${
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
                      className={`rounded-full px-3.5 py-1.5 text-sm transition-all cursor-pointer ${
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
                      className={`rounded-full px-3.5 py-1.5 text-sm transition-all cursor-pointer ${
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
                        className={`rounded-full px-3 py-1.5 text-sm transition-all cursor-pointer ${
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

          <Select
            id="frequency"
            label="How often to scan"
            options={frequencyOptions}
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
