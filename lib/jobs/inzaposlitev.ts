import type { JobListing } from "./types";

const AJAX_URL = "https://inzaposlitev.net/jm-ajax/get_listings/";

interface InzaposlitevResponse {
  found_jobs: boolean;
  max_num_pages: number;
  html: string;
}

const MAX_PAGES = 20; // safety cap

/**
 * Fetch job listings from Inzaposlitev.net (WordPress WP Job Manager).
 * Paginates through all available pages.
 */
export async function fetchInzaposlitev(
  keyword?: string
): Promise<JobListing[]> {
  const results: JobListing[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = new URL(AJAX_URL);
    url.searchParams.set("per_page", "50");
    url.searchParams.set("page", String(page));
    if (keyword) {
      url.searchParams.set("search_keywords", keyword);
    }

    const res = await fetch(url.toString(), {
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.error(`Inzaposlitev error: ${res.status}`);
      break;
    }

    const data: InzaposlitevResponse = await res.json();
    if (!data.found_jobs || !data.html) break;

    const parsed = parseListingsHtml(data.html);
    results.push(...parsed);

    if (page >= data.max_num_pages) break;
  }

  return results;
}

/**
 * Parse job listing HTML returned by WP Job Manager AJAX endpoint.
 */
function parseListingsHtml(html: string): JobListing[] {
  const listings: JobListing[] = [];

  // Each listing is an <li> with class job_listing
  const liRegex =
    /<li[^>]*class="[^"]*job_listing[^"]*"[^>]*data-href="([^"]*)"[^>]*>/g;
  let liMatch;

  while ((liMatch = liRegex.exec(html)) !== null) {
    const href = liMatch[1];
    const startIdx = liMatch.index;

    // Find the end of this <li>
    const endIdx = html.indexOf("</li>", startIdx);
    if (endIdx === -1) continue;
    const block = html.substring(startIdx, endIdx);

    // Extract title
    const titleMatch = block.match(
      /class="[^"]*job_listing-title[^"]*"[^>]*>([^<]+)</
    );
    const title = titleMatch ? decodeEntities(titleMatch[1].trim()) : null;

    // Extract company
    const companyMatch = block.match(
      /class="[^"]*job_listing-company[^"]*"[^>]*>([^<]+)</
    );
    const company = companyMatch
      ? decodeEntities(companyMatch[1].trim())
      : "Unknown";

    // Extract location from google_map_link or location class
    const locationMatch =
      block.match(/class="[^"]*google_map_link[^"]*"[^>]*>([^<]+)</) ??
      block.match(/class="[^"]*job_listing-location[^"]*"[^>]*>([^<]+)</);
    const location = locationMatch
      ? decodeEntities(locationMatch[1].trim())
      : null;

    // Extract ID from li class
    const idMatch = block.match(/job_listing-(\d+)/);
    const externalId = idMatch ? `inz-${idMatch[1]}` : `inz-${encodeURIComponent(href)}`;

    if (!title || !href) continue;

    listings.push({
      title,
      company,
      location,
      url: href.startsWith("http") ? href : `https://inzaposlitev.net${href}`,
      source: "inzaposlitev" as const,
      externalId,
    });
  }

  return listings;
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ");
}
