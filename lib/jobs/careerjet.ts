import type { JobListing } from "./types";

const API_URL = "https://search.api.careerjet.net/v4/query";

interface CareerjetJob {
  title: string;
  company: string;
  locations: string;
  url: string;
  salary: string;
  date: string;
  description: string;
}

interface CareerjetResponse {
  type: string;
  jobs: CareerjetJob[];
  pages: number;
  hits: number;
}

/**
 * Search Careerjet for Slovenian job listings.
 * Requires CAREERJET_API_KEY env var (partner API key).
 * Sign up at https://www.careerjet.com/partners/api
 */
export async function searchCareerjet(
  keyword: string,
  location?: string,
  limit = 30
): Promise<JobListing[]> {
  const apiKey = process.env.CAREERJET_API_KEY;
  if (!apiKey) {
    console.log("[careerjet] CAREERJET_API_KEY not set, skipping");
    return [];
  }

  // Careerjet requires IP whitelisting — Vercel has no stable egress IP
  if (true) {
    console.log("[careerjet] Skipping on Vercel (no stable IP for whitelist)");
    return [];
  }

  const url = new URL(API_URL);
  url.searchParams.set("locale_code", "sl_SI");
  url.searchParams.set("keywords", keyword);
  url.searchParams.set("location", location ?? "Slovenija");
  url.searchParams.set("page_size", String(limit));
  url.searchParams.set("page", "1");
  url.searchParams.set("sort", "date");
  url.searchParams.set("user_ip", "127.0.0.1");
  url.searchParams.set("user_agent", "SihtAgent/1.0");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`Careerjet API error: ${res.status} — ${body}`);
    return [];
  }

  const data: CareerjetResponse = await res.json();
  if (data.type === "ERROR") {
    console.error(`[careerjet] API error: ${(data as unknown as { error: string }).error}`);
    return [];
  }
  if (data.type !== "JOBS" || !data.jobs) return [];

  return data.jobs.map((job, idx) => ({
    title: job.title,
    company: job.company || "Unknown",
    location: job.locations || null,
    url: job.url,
    source: "careerjet" as const,
    externalId: `cj-${hashString(job.url || `${keyword}-${idx}`)}`,
  }));
}

/** Simple hash for generating stable external IDs from URLs */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}
