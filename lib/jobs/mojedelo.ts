import type { JobListing } from "./types";

const API_BASE = "https://api.mojedelo.com";

const HEADERS = {
  tenantId: "5947a585-ad25-47dc-bff3-f08620d1ce17",
  channelId: "8805c1b8-a0a9-4f57-ad42-329af3c92a61",
  languageId: "db3c58e6-a083-4f72-b30b-39f2127bb18d", // Slovenian
};

interface MojeDeloItem {
  id: string; // UUID — used in the canonical URL
  jbqId: string;
  title: string;
  town?: { name?: string };
  company?: { name?: string };
  regions?: { translation?: string }[];
}

/** Build a URL-friendly slug from a job title (for the /oglas/{slug}/{uuid} URL format). */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics (ž→z, š→s, č→c)
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

const PAGE_SIZE = 50;
const MAX_PAGES = 4; // 50 × 4 = 200 max per keyword (API returns by relevance)

/**
 * Search MojeDelo for jobs matching a keyword.
 * Paginates through all results automatically.
 */
export async function searchMojeDelo(
  keyword: string
): Promise<JobListing[]> {
  const results: JobListing[] = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    const url = new URL(`${API_BASE}/job-ads-search`);
    url.searchParams.set("keyword", keyword);
    url.searchParams.set("pageSize", String(PAGE_SIZE));
    url.searchParams.set("startFrom", String(page * PAGE_SIZE));

    const res = await fetch(url.toString(), {
      headers: { ...HEADERS },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.error(`MojeDelo API error: ${res.status}`);
      break;
    }

    const json = await res.json();
    const items: MojeDeloItem[] = json?.data?.items ?? [];
    const total: number = json?.data?.total ?? 0;

    results.push(
      ...items.map((item) => ({
        title: item.title,
        company: item.company?.name ?? "Unknown",
        location: item.town?.name ?? item.regions?.[0]?.translation ?? null,
        url: `https://www.mojedelo.com/oglas/${slugify(item.title)}/${item.id}`,
        source: "mojedelo" as const,
        externalId: `md-${item.id}`,
      }))
    );

    if (results.length >= total || items.length < PAGE_SIZE) break;
  }

  return results;
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
  url.searchParams.set("keyword", companyName);
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
      url: `https://www.mojedelo.com/oglas/${slugify(item.title)}/${item.id}`,
      source: "mojedelo" as const,
      externalId: `md-${item.id}`,
    }));
}
