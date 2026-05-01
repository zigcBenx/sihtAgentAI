"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UpgradeModal } from "@/components/upgrade-modal";

interface Company {
  id: string;
  companyName: string;
  careersUrl: string | null;
}

export function WatchedCompanies({
  agentId,
  companies,
}: {
  agentId: string;
  companies: Company[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [careersUrl, setCareersUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !careersUrl.trim()) return;

    setAdding(true);
    setError("");

    try {
      const res = await fetch(`/api/agents/${agentId}/companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: name.trim(),
          careersUrl: careersUrl.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error === "upgrade_required") {
          setShowUpgrade(true);
          return;
        }
        setError(data.error ?? "Failed to add company");
        return;
      }

      setName("");
      setCareersUrl("");
      setShowForm(false);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(companyId: string) {
    await fetch(`/api/agents/${agentId}/companies/${companyId}`, {
      method: "DELETE",
    });
    router.refresh();
  }

  return (
    <>
    <UpgradeModal
      open={showUpgrade}
      onClose={() => setShowUpgrade(false)}
      reason="companies"
    />
    <div className="rounded-2xl border border-surface-border bg-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-foreground">
          Watched Companies
          {companies.length > 0 && (
            <span className="ml-2 text-xs font-normal text-muted">
              {companies.length}
            </span>
          )}
        </h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover transition-colors cursor-pointer"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Company
          </button>
        )}
      </div>

      {companies.length === 0 && !showForm ? (
        <div className="text-center py-6">
          <p className="text-sm text-muted mb-3">
            No companies being watched yet.
          </p>
          <Button
            variant="secondary"
            size="default"
            onClick={() => setShowForm(true)}
          >
            Add your first company
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {companies.map((company) => (
            <div
              key={company.id}
              className="flex items-center justify-between rounded-xl bg-surface-light px-4 py-3 group"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground">
                  {company.companyName}
                </div>
                {company.careersUrl && (
                  <a
                    href={company.careersUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted hover:text-accent transition-colors truncate block"
                  >
                    {company.careersUrl.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>
              <button
                onClick={() => handleRemove(company.id)}
                className="ml-3 text-muted opacity-0 group-hover:opacity-100 hover:text-danger transition-all cursor-pointer"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add company form — only visible when user clicks "Add" */}
      {showForm && (
        <div className="mt-4 rounded-xl border border-surface-border bg-surface-light p-4">
          {error && (
            <div className="mb-3 rounded-lg bg-danger-soft border border-danger-border px-3 py-2 text-xs text-danger">
              {error}
            </div>
          )}
          <form onSubmit={handleAdd} className="space-y-3">
            <Input
              placeholder="Company name (e.g. Google)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              placeholder="Careers page URL (e.g. https://careers.google.com)"
              value={careersUrl}
              onChange={(e) => setCareersUrl(e.target.value)}
            />
            <p className="text-[11px] text-muted">
              Paste the link to the company&apos;s careers or jobs page.
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="default"
                onClick={() => {
                  setShowForm(false);
                  setName("");
                  setCareersUrl("");
                  setError("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="default"
                disabled={adding || !name.trim() || !careersUrl.trim()}
              >
                {adding ? "Adding..." : "Add"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
    </>
  );
}
