import type { JobListing } from "./types";

const RSS_BASE = "https://www.optius.com/rss/";

// Region IDs for Optius RSS
const REGION_MAP: Record<string, string> = {
  gorenjska: "1",
  goriska: "2",
  "jugovzhodna slovenija": "3",
  koroska: "4",
  "notranjsko-kraska": "5",
  "obalno-kraska": "6",
  osrednjeslovenska: "7",
  ljubljana: "7",
  podravska: "8",
  maribor: "8",
  pomurska: "9",
  savinjska: "10",
  celje: "10",
  spodnjeposavska: "11",
  zasavska: "12",
};

/**
 * Fetch jobs from Optius RSS feed.
 * Optionally filter by region (mapped from city/region name).
 */
export async function fetchOptius(
  regionHint?: string
): Promise<JobListing[]> {
  const url = new URL(RSS_BASE);

  // Try to map location to a region ID
  if (regionHint) {
    const lower = regionHint.toLowerCase();
    const regionId = REGION_MAP[lower];
    if (regionId) {
      url.searchParams.set("regija", regionId);
    }
  }

  // Fetch IT jobs (podrocje=7)
  url.searchParams.set("podrocje", "7");

  const res = await fetch(url.toString(), {
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    console.error(`Optius RSS error: ${res.status}`);
    return [];
  }

  const xml = await res.text();
  return parseRss(xml);
}

/** Simple RSS XML parser — no dependencies */
function parseRss(xml: string): JobListing[] {
  const items: JobListing[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    const employer = extractTag(block, "employer");
    const guid = extractTag(block, "guid");

    if (!title || !link) continue;

    items.push({
      title,
      company: employer ?? "Unknown",
      location: null, // Optius RSS doesn't include location per-item
      url: link,
      source: "optius",
      externalId: `opt-${guid ?? link}`,
    });
  }

  return items;
}

function extractTag(xml: string, tag: string): string | null {
  // Handle CDATA: <tag><![CDATA[content]]></tag>
  const cdataRegex = new RegExp(
    `<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`
  );
  const cdataMatch = cdataRegex.exec(xml);
  if (cdataMatch) return cdataMatch[1].trim();

  // Regular tag
  const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`);
  const m = regex.exec(xml);
  return m ? m[1].trim() : null;
}
