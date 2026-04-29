import type { JobListing } from "./types";

const API_BASE = "https://api.mojedelo.com";

const HEADERS = {
  tenantId: "5947a585-ad25-47dc-bff3-f08620d1ce17",
  channelId: "8805c1b8-a0a9-4f57-ad42-329af3c92a61",
  languageId: "db3c58e6-a083-4f72-b30b-39f2127bb18d", // Slovenian
};

interface MojeDeloItem {
  id: string;
  jbqId: string;
  title: string;
  town?: { name?: string };
  company?: { name?: string };
  regions?: { translation?: string }[];
}

/**
 * Search MojeDelo for jobs matching a keyword.
 * Returns up to `limit` normalized results.
 */
export async function searchMojeDelo(
  keyword: string,
  limit = 30
): Promise<JobListing[]> {
  const url = new URL(`${API_BASE}/job-ads-search`);
  url.searchParams.set("searchTerm", keyword);
  url.searchParams.set("pageSize", String(limit));
  url.searchParams.set("startFrom", "0");

  const res = await fetch(url.toString(), {
    headers: { ...HEADERS },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    console.error(`MojeDelo API error: ${res.status}`);
    return [];
  }

  const json = await res.json();
  const items: MojeDeloItem[] = json?.data?.items ?? [];

  return items.map((item) => ({
    title: item.title,
    company: item.company?.name ?? "Unknown",
    location: item.town?.name ?? item.regions?.[0]?.translation ?? null,
    url: `https://www.mojedelo.com/prosto-delovno-mesto/${item.jbqId}`,
    source: "mojedelo" as const,
    externalId: `md-${item.jbqId}`,
  }));
}

/**
 * Search MojeDelo for jobs at a specific company name.
 * Uses the company search endpoint to find company UUID, then filters.
 */
export async function searchMojeDeloByCompany(
  companyName: string,
  limit = 20
): Promise<JobListing[]> {
  // Search for company name in the general job search
  // MojeDelo's search includes company names in results
  const url = new URL(`${API_BASE}/job-ads-search`);
  url.searchParams.set("searchTerm", companyName);
  url.searchParams.set("pageSize", String(limit));
  url.searchParams.set("startFrom", "0");

  const res = await fetch(url.toString(), {
    headers: { ...HEADERS },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) return [];

  const json = await res.json();
  const items: MojeDeloItem[] = json?.data?.items ?? [];

  // Filter to only include jobs where company name matches (case-insensitive)
  const lowerName = companyName.toLowerCase();
  return items
    .filter((item) =>
      item.company?.name?.toLowerCase().includes(lowerName)
    )
    .map((item) => ({
      title: item.title,
      company: item.company?.name ?? companyName,
      location: item.town?.name ?? item.regions?.[0]?.translation ?? null,
      url: `https://www.mojedelo.com/prosto-delovno-mesto/${item.jbqId}`,
      source: "mojedelo" as const,
      externalId: `md-${item.jbqId}`,
    }));
}
