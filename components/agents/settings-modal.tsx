"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  agentId: string;
  agentType: string;
  initialData: {
    name: string;
    desiredRole?: string;
    salaryMin?: string;
    salaryMax?: string;
    locationPreference?: string;
    specificCity?: string;
    frequency: string;
  };
}

const locationOptions = [
  { value: "", label: "Not specified" },
  { value: "remote", label: "Remote" },
  { value: "slovenia", label: "Anywhere in Slovenia" },
  { value: "specific_city", label: "Specific city in Slovenia" },
];

const frequencyOptions = [
  { value: "hourly", label: "Every hour" },
  { value: "daily", label: "Once a day" },
  { value: "weekly", label: "Once a week" },
];

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
  const [desiredRole, setDesiredRole] = useState(initialData.desiredRole ?? "");
  const [salaryMin, setSalaryMin] = useState(initialData.salaryMin ?? "");
  const [salaryMax, setSalaryMax] = useState(initialData.salaryMax ?? "");
  const [locationPreference, setLocationPreference] = useState(
    initialData.locationPreference ?? ""
  );
  const [specificCity, setSpecificCity] = useState(
    initialData.specificCity ?? ""
  );
  const [frequency, setFrequency] = useState(initialData.frequency);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setName(initialData.name);
      setDesiredRole(initialData.desiredRole ?? "");
      setSalaryMin(initialData.salaryMin ?? "");
      setSalaryMax(initialData.salaryMax ?? "");
      setLocationPreference(initialData.locationPreference ?? "");
      setSpecificCity(initialData.specificCity ?? "");
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

    if (desiredRole) payload.desiredRole = desiredRole;

    if (isJobSearch) {
      if (salaryMin) payload.salaryMin = Number(salaryMin);
      if (salaryMax) payload.salaryMax = Number(salaryMax);
      if (locationPreference) payload.locationPreference = locationPreference;
      if (specificCity) payload.specificCity = specificCity;
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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-surface-border bg-surface p-6 shadow-xl max-h-[90vh] overflow-y-auto">
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
          <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
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

          <Input
            id="desiredRole"
            label={isJobSearch ? "Desired Role / Title" : "What kind of position are you looking for?"}
            placeholder={isJobSearch ? "e.g. Senior Frontend Developer" : "e.g. Frontend Developer, Marketing, Data Analyst"}
            value={desiredRole}
            onChange={(e) => setDesiredRole(e.target.value)}
          />
          {!isJobSearch && (
            <p className="text-xs text-muted -mt-2">
              Optional — helps filter out unrelated positions from career pages.
            </p>
          )}

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

              <Select
                id="locationPreference"
                label="Location Preference"
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
