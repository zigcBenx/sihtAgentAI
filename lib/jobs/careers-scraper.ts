import Anthropic from "@anthropic-ai/sdk";
import type { JobListing } from "./types";

const client = new Anthropic();

/**
 * Scrape a company's careers page using LLM extraction.
 * Two-pass approach:
 *   1. Try to extract job listings from the given URL.
 *   2. If no listings found, ask the LLM if there's a link to an actual
 *      job listings page (e.g. /careers/opportunities, /jobs/open-positions).
 *      If found, fetch that page and extract listings from it.
 */
export async function scrapeCareerPage(
  careersUrl: string,
  companyName: string,
  desiredRole?: string | null
): Promise<JobListing[]> {
  const { cleaned, baseUrl } = await fetchAndClean(careersUrl);
  if (!cleaned) return [];

  // Pass 1: try to extract listings directly
  const listings = await extractListings(cleaned, baseUrl, careersUrl, companyName, desiredRole);
  if (listings.length > 0) return listings;

  // Pass 2: no listings found — ask LLM if there's a deeper link to actual job listings
  const deeperUrl = await findJobListingsLink(cleaned, baseUrl, careersUrl);
  if (!deeperUrl || deeperUrl === careersUrl) return [];

  // Fetch the deeper page and extract from it
  const deeper = await fetchAndClean(deeperUrl);
  if (!deeper.cleaned) return [];

  return extractListings(deeper.cleaned, deeper.baseUrl, deeperUrl, companyName, desiredRole);
}

/**
 * Fetch a URL and return cleaned text content.
 */
async function fetchAndClean(
  url: string
): Promise<{ cleaned: string | null; baseUrl: string }> {
  const baseUrl = new URL(url).origin;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch ${url}: ${res.status}`);
    }

    const html = await res.text();
    const cleaned = stripHtml(html);

    if (cleaned.length < 50) return { cleaned: null, baseUrl };

    return { cleaned, baseUrl };
  } catch (err) {
    throw new Error(
      `Failed to fetch ${url}: ${err instanceof Error ? err.message : "Unknown"}`
    );
  }
}

/**
 * Use LLM to extract job listings from page content.
 */
async function extractListings(
  content: string,
  baseUrl: string,
  pageUrl: string,
  companyName: string,
  desiredRole?: string | null
): Promise<JobListing[]> {
  const truncated = content.slice(0, 20000);

  const relevanceInstruction = desiredRole
    ? `\n\nRELEVANCE FILTER: The user is interested in positions related to "${desiredRole}". For each job, add a "relevant" field (boolean). Be generous — mark as relevant anything that could be broadly related to this area (e.g. if the user wants "Frontend Developer", a "Full Stack Engineer" or "UI/UX Designer" would also be relevant, but "Accountant" would not). Include ALL positions in the output but mark each as relevant or not.`
    : "";

  const responseFormat = desiredRole
    ? `Return a JSON array of objects with "title" (job title), "url" (direct link to that specific job posting), and "relevant" (boolean — is this position broadly related to "${desiredRole}").`
    : `Return a JSON array of objects with "title" (job title) and "url" (direct link to that specific job posting).`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Extract all job/position openings from this careers page content. ${responseFormat}

IMPORTANT — the page content has links in this format: "link text [/path/to/page]"
The part inside [ ] is the URL for that link. Each job title should have its own unique URL extracted from the link next to it.

Rules:
- CRITICAL: Extract the specific URL for EACH job from the [bracketed link] next to it. Each job should have its own unique URL pointing to its detail page.
- If a URL is relative (starts with /), prepend "${baseUrl}" to make it absolute
- Only if a job truly has no link at all, use "${pageUrl}" as fallback — but this should be rare
- Only include actual job postings, not navigation links or general pages
- Do NOT include generic links like "See open positions" or "View all jobs" — only actual specific job titles
- If there are no specific job listings on this page, return an empty array []
- Return ONLY the JSON array, no other text${relevanceInstruction}

Example: if you see "Software Engineer [/careers/jobs/123]" → {"title": "Software Engineer", "url": "${baseUrl}/careers/jobs/123"${desiredRole ? ', "relevant": true' : ""}}

Page content:
${truncated}`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]) as {
      title: string;
      url: string;
      relevant?: boolean;
    }[];

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => item.title && typeof item.title === "string")
      // When desiredRole is set, only keep positions the LLM marked as relevant
      .filter((item) => !desiredRole || item.relevant !== false)
      .map((item) => {
        let url = item.url || pageUrl;
        // Resolve relative URLs that the LLM may have left relative
        if (url.startsWith("/")) {
          url = baseUrl + url;
        }
        return {
          title: item.title.trim(),
          company: companyName,
          location: null,
          url,
          source: "careers" as const,
          externalId: `careers-${hashString(item.title + companyName)}`,
        };
      });
  } catch {
    return [];
  }
}

/**
 * Ask LLM to find a link to the actual job listings page.
 * Many careers pages have a landing/overview page that links to
 * a separate page with the actual open positions.
 */
async function findJobListingsLink(
  content: string,
  baseUrl: string,
  currentUrl: string
): Promise<string | null> {
  const truncated = content.slice(0, 10000);

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `This is a company careers page but it doesn't contain specific job listings. Look at the links on this page and find the one that most likely leads to the actual list of open positions/jobs/opportunities.

Common patterns: links containing words like "opportunities", "open positions", "view jobs", "current openings", "vacancies", "job listings", or similar.

Rules:
- If a URL is relative (starts with /), prepend "${baseUrl}" to make it absolute
- Return ONLY the single best URL as plain text, nothing else
- If you can't find such a link, return "NONE"

Page content:
${truncated}`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text.trim() : "";

  if (!text || text === "NONE" || text.length > 500) return null;

  try {
    // Resolve relative URLs
    if (text.startsWith("/")) {
      return baseUrl + text;
    }
    // Validate it's a proper URL
    new URL(text);
    return text;
  } catch {
    return null;
  }
}

/**
 * Strip HTML tags, scripts, styles, and extra whitespace.
 * Preserves link hrefs inline so the LLM can see them.
 */
function stripHtml(html: string): string {
  return (
    html
      // Remove script and style blocks entirely
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
      // Remove SVG blocks (just noise for job extraction)
      .replace(/<svg[\s\S]*?<\/svg>/gi, "")
      // Convert links to "text [href]" format — handle both quoted and unquoted hrefs
      .replace(
        /<a\s[^>]*?href\s*=\s*["']?([^\s"'>]+)["']?[^>]*>([\s\S]*?)<\/a>/gi,
        (_, href, text) => {
          const cleanText = text.replace(/<[^>]+>/g, "").trim();
          return cleanText ? `${cleanText} [${href}]` : "";
        }
      )
      // Remove all remaining HTML tags
      .replace(/<[^>]+>/g, " ")
      // Decode common HTML entities
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      // Collapse whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
}

/** Simple string hash for generating deterministic external IDs */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
