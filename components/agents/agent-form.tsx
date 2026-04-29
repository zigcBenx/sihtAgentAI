"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface AgentFormData {
  name: string;
  desiredRole: string;
  salaryMin: string;
  salaryMax: string;
  locationPreference: string;
  specificCity: string;
  frequency: string;
}

interface AgentFormProps {
  agentId: string;
  agentType: string;
  initialData: Partial<AgentFormData>;
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

export function AgentForm({ agentId, agentType, initialData }: AgentFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState<AgentFormData>({
    name: initialData?.name ?? "",
    desiredRole: initialData?.desiredRole ?? "",
    salaryMin: initialData?.salaryMin ?? "",
    salaryMax: initialData?.salaryMax ?? "",
    locationPreference: initialData?.locationPreference ?? "",
    specificCity: initialData?.specificCity ?? "",
    frequency: initialData?.frequency ?? "daily",
  });

  function update(field: keyof AgentFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSaved(false);

    const payload: Record<string, unknown> = {
      name: form.name,
      frequency: form.frequency,
    };

    if (agentType === "job_search") {
      if (form.desiredRole) payload.desiredRole = form.desiredRole;
      if (form.salaryMin) payload.salaryMin = Number(form.salaryMin);
      if (form.salaryMax) payload.salaryMax = Number(form.salaryMax);
      if (form.locationPreference)
        payload.locationPreference = form.locationPreference;
      if (form.specificCity) payload.specificCity = form.specificCity;
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

      setSaved(true);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  const isJobSearch = agentType === "job_search";

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-xl font-bold text-foreground">
          {isJobSearch ? "Search Settings" : "Watcher Settings"}
        </h2>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {saved && (
          <div className="rounded-xl bg-accent/10 border border-accent/20 px-4 py-3 text-sm text-accent">
            Changes saved successfully
          </div>
        )}

        <Input
          id="name"
          label="Agent Name"
          placeholder="e.g. My Job Hunter"
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
        />

        {isJobSearch && (
          <>
            <Input
              id="desiredRole"
              label="Desired Role / Title"
              placeholder="e.g. Senior Frontend Developer"
              value={form.desiredRole}
              onChange={(e) => update("desiredRole", e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                id="salaryMin"
                label="Min Salary (EUR)"
                type="number"
                placeholder="e.g. 3000"
                value={form.salaryMin}
                onChange={(e) => update("salaryMin", e.target.value)}
              />
              <Input
                id="salaryMax"
                label="Max Salary (EUR)"
                type="number"
                placeholder="e.g. 5000"
                value={form.salaryMax}
                onChange={(e) => update("salaryMax", e.target.value)}
              />
            </div>

            <Select
              id="locationPreference"
              label="Location Preference"
              options={locationOptions}
              value={form.locationPreference}
              onChange={(e) => update("locationPreference", e.target.value)}
            />

            {form.locationPreference === "specific_city" && (
              <Input
                id="specificCity"
                label="City"
                placeholder="e.g. Ljubljana"
                value={form.specificCity}
                onChange={(e) => update("specificCity", e.target.value)}
              />
            )}
          </>
        )}

        <Select
          id="frequency"
          label="Run Frequency"
          options={frequencyOptions}
          value={form.frequency}
          onChange={(e) => update("frequency", e.target.value)}
        />

        <div className="pt-2">
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
