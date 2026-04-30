import { db } from "@/lib/db";
import {
  sihtAgents,
  jobMatches,
  companyAlerts,
  runLogs,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { searchMojeDelo } from "./mojedelo";
import { fetchOptius } from "./optius";
import { searchEss } from "./ess";
import { fetchInzaposlitev } from "./inzaposlitev";
import { searchCareerjet } from "./careerjet";
import { scrapeCareerPage } from "./careers-scraper";
import { expandKeywords, TECH_KEYWORDS } from "./keywords";
import type { JobListing } from "./types";

interface AgentWithCompanies {
  id: string;
  name: string;
  agentType: string;
  desiredRole: string | null;
  profileSummary: string | null;
  searchTerms: string | null;
  workMode: string | null;
  geoScope: string | null;
  geoValue: string | null;
  watchedCompanies: {
    id: string;
    companyName: string;
    careersUrl: string | null;
  }[];
}

/** Major cities/towns mapped to their statistical region (lowercase) */
const REGION_CITIES: Record<string, string[]> = {
  gorenjska: ["kranj", "bled", "jesenice", "radovljica", "škofja loka", "tržič", "žirovnica"],
  goriška: ["nova gorica", "ajdovščina", "idrija", "tolmin", "bovec", "kanal", "kobarid"],
  "jugovzhodna slovenija": ["novo mesto", "črnomelj", "metlika", "trebnje", "kočevje", "ribnica", "žužemberk"],
  koroška: ["slovenj gradec", "ravne na koroškem", "dravograd", "prevalje", "mežica", "črna na koroškem"],
  "notranjsko-kraška": ["postojna", "ilirska bistrica", "cerknica", "pivka", "loška dolina"],
  "obalno-kraška": ["koper", "izola", "piran", "sežana", "hrpelje-kozina", "komen", "divača"],
  osrednjeslovenska: ["ljubljana", "domžale", "kamnik", "grosuplje", "vrhnika", "logatec", "litija", "medvode", "škofljica", "brezovica"],
  podravska: ["maribor", "ptuj", "slovenska bistrica", "lenart", "ruše", "ormož", "kidričevo", "pesnica"],
  pomurska: ["murska sobota", "ljutomer", "gornja radgona", "lendava", "beltinci", "črenšovci"],
  posavska: ["krško", "brežice", "sevnica", "kostanjevica na krki"],
  savinjska: ["celje", "velenje", "žalec", "šentjur", "laško", "šoštanj", "mozirje", "nazarje", "rogaška slatina"],
  zasavska: ["trbovlje", "zagorje ob savi", "hrastnik"],
};

export interface LogEntry {
  step: string;
  detail: string;
  count?: number;
  items?: LogItem[];
}

export interface LogItem {
  title: string;
  company: string;
  location?: string | null;
  url: string;
  status: "matched" | "rejected_role" | "rejected_location" | "duplicate" | "stored";
  reason?: string;
}

export interface RunResult {
  agentId: string;
  agentName: string;
  agentType: string;
  newJobMatches: number;
  newCompanyAlerts: number;
  newJobItems: { title: string; company: string; location: string | null; url: string }[];
  newAlertItems: { title: string; url: string; companyName: string }[];
  log: LogEntry[];
}

/**
 * Run a single agent: dispatch to type-specific logic.
 */
export async function runAgent(agent: AgentWithCompanies): Promise<RunResult> {
  if (agent.agentType === "company_watcher") {
    return runCompanyWatcher(agent);
  }
  return runJobSearch(agent);
}

/**
 * Job Search agent: fetch jobs from boards, match by keywords, dedup, store.
 */
async function runJobSearch(agent: AgentWithCompanies): Promise<RunResult> {
  const startTime = Date.now();
  const log: LogEntry[] = [];
  let newJobMatches = 0;
  let newJobItems: JobListing[] = [];
  let hasError = false;

  log.push({ step: "start", detail: `Running job search "${agent.name}"` });

  // Determine search terms: prefer pre-generated searchTerms, fall back to expandKeywords
  let resolvedSearchTerms: string[] = [];
  let resolvedMatchKeywords: string[] = [];

  if (agent.searchTerms) {
    try {
      const generated = JSON.parse(agent.searchTerms) as string[];
      // Use search terms as match keywords too (lowercased)
      resolvedMatchKeywords = generated.map((t) => t.toLowerCase());

      // Extract standalone tech keywords from the pre-generated terms.
      // APIs like MojeDelo search descriptions, so searching "laravel" alone
      // finds jobs titled "Junior Programer" that mention Laravel in the body.
      const standaloneTerms: string[] = [];
      const seen = new Set(generated.map((s) => s.toLowerCase()));
      for (const term of generated) {
        for (const word of term.toLowerCase().split(/\s+/)) {
          if (TECH_KEYWORDS.has(word) && !seen.has(word)) {
            standaloneTerms.push(word);
            seen.add(word);
          }
        }
      }

      // Interleave: first few combo terms, then standalone tech, then remaining combos.
      // This ensures standalone tech terms get searched even if we cap total queries.
      const first = generated.slice(0, 5);
      const rest = generated.slice(5);
      resolvedSearchTerms = [...first, ...standaloneTerms, ...rest];

      log.push({
        step: "keywords",
        detail: `Using generated search terms: ${resolvedSearchTerms.join(", ")}`,
        count: resolvedSearchTerms.length,
      });
    } catch {
      // Invalid JSON — fall through to desiredRole expansion
    }
  }

  if (resolvedSearchTerms.length === 0 && agent.desiredRole) {
    const { searchTerms, matchKeywords } = expandKeywords(agent.desiredRole);
    resolvedSearchTerms = searchTerms;
    resolvedMatchKeywords = matchKeywords;
    log.push({
      step: "keywords",
      detail: `Expanded "${agent.desiredRole}" → searching: ${searchTerms.join(", ")}`,
      count: searchTerms.length,
    });
  }

  if (resolvedSearchTerms.length === 0 && agent.profileSummary) {
    // Last resort: extract first meaningful phrase from profile summary
    const firstSentence = agent.profileSummary.split(/[.,;]/)[0].trim();
    resolvedSearchTerms = [firstSentence];
    resolvedMatchKeywords = [firstSentence.toLowerCase()];
    log.push({
      step: "keywords",
      detail: `Using profile summary excerpt: "${firstSentence}"`,
      count: 1,
    });
  }

  if (resolvedSearchTerms.length > 0) {
    log.push({
      step: "keywords_match",
      detail: `Match keywords: ${resolvedMatchKeywords.join(", ")}`,
      count: resolvedMatchKeywords.length,
    });

    const { listings, fetchLog } = await fetchJobListings(
      resolvedSearchTerms,
      agent.geoScope,
      agent.geoValue
    );
    log.push(...fetchLog);

    // Deduplicate fetched listings by externalId
    const seen = new Set<string>();
    const uniqueListings = listings.filter((l) => {
      if (seen.has(l.externalId)) return false;
      seen.add(l.externalId);
      return true;
    });

    log.push({
      step: "fetched",
      detail: `Fetched ${listings.length} total listings (${uniqueListings.length} unique after dedup)`,
      count: uniqueListings.length,
    });

    const { matched, roleRejected, locationRejected } = filterByPreferences(
      uniqueListings,
      agent,
      resolvedMatchKeywords
    );

    const perfect = matched.filter((m) => m.relevance === "perfect").length;
    const good = matched.filter((m) => m.relevance === "good").length;
    const partial = matched.filter((m) => m.relevance === "partial").length;

    log.push({
      step: "filter_result",
      detail: `${matched.length} matched (${perfect} perfect, ${good} good, ${partial} partial), ${roleRejected} rejected by role, ${locationRejected} rejected by location`,
      count: matched.length,
    });

    const stored = await deduplicateAndStore(matched, agent.id);
    newJobMatches = stored.newCount;
    newJobItems = stored.newItems;

    log.push({
      step: "dedup",
      detail: `${stored.newCount} new matches stored, ${stored.dupCount} already known`,
      count: stored.newCount,
    });
  } else {
    log.push({ step: "skip", detail: "No search terms or profile set — skipping job search" });
  }

  const durationMs = Date.now() - startTime;
  const status = hasError ? "partial" : "success";
  const summary = `Found ${newJobMatches} new jobs in ${(durationMs / 1000).toFixed(1)}s`;

  log.push({ step: "done", detail: summary });

  await db
    .update(sihtAgents)
    .set({ lastRunAt: new Date() })
    .where(eq(sihtAgents.id, agent.id));

  await db.insert(runLogs).values({
    agentId: agent.id,
    status,
    durationMs,
    log: JSON.stringify(log),
    summary,
  });

  return {
    agentId: agent.id,
    agentName: agent.name,
    agentType: agent.agentType,
    newJobMatches,
    newCompanyAlerts: 0,
    newJobItems: newJobItems.map((l) => ({
      title: l.title,
      company: l.company,
      location: l.location,
      url: l.url,
    })),
    newAlertItems: [],
    log,
  };
}

/**
 * Company Watcher agent: scrape each company's careers page, dedup, store.
 */
async function runCompanyWatcher(agent: AgentWithCompanies): Promise<RunResult> {
  const startTime = Date.now();
  const log: LogEntry[] = [];
  let newCompanyAlerts = 0;
  const newAlertItems: { title: string; url: string; companyName: string }[] = [];
  let hasError = false;

  log.push({ step: "start", detail: `Running company watcher "${agent.name}"` });

  const profileContext = agent.profileSummary ?? agent.desiredRole;
  if (profileContext) {
    log.push({
      step: "filter",
      detail: `Smart filtering enabled for: "${profileContext}"`,
    });
  }

  if (agent.watchedCompanies.length === 0) {
    log.push({ step: "skip", detail: "No companies being watched" });
  } else {
    log.push({
      step: "companies",
      detail: `Checking ${agent.watchedCompanies.length} companies`,
      count: agent.watchedCompanies.length,
    });

    for (const company of agent.watchedCompanies) {
      if (!company.careersUrl) {
        log.push({
          step: "company_error",
          detail: `${company.companyName}: no careers URL configured`,
        });
        continue;
      }

      log.push({
        step: "company_search",
        detail: `Scraping careers page for "${company.companyName}"`,
      });

      try {
        const listings = await scrapeCareerPage(
          company.careersUrl,
          company.companyName,
          profileContext
        );

        const companyItems: LogItem[] = listings.map((l) => ({
          title: l.title,
          company: l.company,
          location: l.location,
          url: l.url,
          status: "matched" as const,
        }));

        log.push({
          step: "company_results",
          detail: `Found ${listings.length} listings at ${company.companyName}`,
          count: listings.length,
          items: companyItems,
        });

        const stored = await deduplicateAndStoreCompanyAlerts(
          listings,
          agent.id,
          company.id
        );
        newCompanyAlerts += stored.newCount;
        newAlertItems.push(
          ...stored.newItems.map((l) => ({
            title: l.title,
            url: l.url,
            companyName: company.companyName,
          }))
        );

        log.push({
          step: "company_stored",
          detail: `${company.companyName}: ${stored.newCount} new, ${stored.dupCount} already known`,
          count: stored.newCount,
        });
      } catch (err) {
        hasError = true;
        log.push({
          step: "company_error",
          detail: `${company.companyName}: ${err instanceof Error ? err.message : "Unknown error"}`,
        });
      }
    }
  }

  const durationMs = Date.now() - startTime;
  const status = hasError ? "partial" : "success";
  const summary = `Found ${newCompanyAlerts} new company alerts in ${(durationMs / 1000).toFixed(1)}s`;

  log.push({ step: "done", detail: summary });

  await db
    .update(sihtAgents)
    .set({ lastRunAt: new Date() })
    .where(eq(sihtAgents.id, agent.id));

  await db.insert(runLogs).values({
    agentId: agent.id,
    status,
    durationMs,
    log: JSON.stringify(log),
    summary,
  });

  return {
    agentId: agent.id,
    agentName: agent.name,
    agentType: agent.agentType,
    newJobMatches: 0,
    newCompanyAlerts,
    newJobItems: [],
    newAlertItems,
    log,
  };
}

/**
 * Fetch from both sources using multiple search terms and merge.
 */
async function fetchJobListings(
  searchTerms: string[],
  geoScope: string | null,
  geoValue: string | null
): Promise<{ listings: JobListing[]; fetchLog: LogEntry[] }> {
  const fetchLog: LogEntry[] = [];
  // For Optius RSS, pass region or city as hint
  const regionHint =
    geoScope === "region" || geoScope === "city" ? (geoValue ?? undefined) : undefined;

  const results: JobListing[] = [];

  // Search MojeDelo with all terms (combo phrases + standalone tech keywords).
  // Standalone tech terms (appended at end) are crucial for finding description-level
  // matches like "Junior Programer" listing that mentions Laravel in body.
  // Cap at 10 to avoid excessive API calls (each term paginates up to 4 pages).
  const mojeDeloTerms = searchTerms.slice(0, 10);
  for (const term of mojeDeloTerms) {
    try {
      const jobs = await searchMojeDelo(term);
      // MojeDelo API searches descriptions — tag as search-matched
      for (const j of jobs) j.searchMatched = true;
      results.push(...jobs);
      fetchLog.push({
        step: "source_mojedelo",
        detail: `MojeDelo "${term}" → ${jobs.length} results`,
        count: jobs.length,
      });
    } catch (err) {
      fetchLog.push({
        step: "source_mojedelo_error",
        detail: `MojeDelo "${term}" failed: ${err instanceof Error ? err.message : "Unknown"}`,
      });
    }
  }

  try {
    const jobs = await fetchOptius(regionHint ?? undefined);
    results.push(...jobs);
    fetchLog.push({
      step: "source_optius",
      detail: `Optius RSS → ${jobs.length} results`,
      count: jobs.length,
    });
  } catch (err) {
    fetchLog.push({
      step: "source_optius_error",
      detail: `Optius failed: ${err instanceof Error ? err.message : "Unknown"}`,
    });
  }

  // ESS/ZRSZ — search with same terms (up to 3)
  const essTerms = searchTerms.slice(0, 3);
  for (const term of essTerms) {
    try {
      const jobs = await searchEss(term);
      // ESS API searches descriptions — tag as search-matched
      for (const j of jobs) j.searchMatched = true;
      results.push(...jobs);
      fetchLog.push({
        step: "source_ess",
        detail: `ESS "${term}" → ${jobs.length} results`,
        count: jobs.length,
      });
    } catch (err) {
      fetchLog.push({
        step: "source_ess_error",
        detail: `ESS "${term}" failed: ${err instanceof Error ? err.message : "Unknown"}`,
      });
    }
  }

  // Inzaposlitev.net — fetch all listings (no keyword search, filtering happens later)
  try {
    const jobs = await fetchInzaposlitev();
    results.push(...jobs);
    fetchLog.push({
      step: "source_inzaposlitev",
      detail: `Inzaposlitev → ${jobs.length} results`,
      count: jobs.length,
    });
  } catch (err) {
    fetchLog.push({
      step: "source_inzaposlitev_error",
      detail: `Inzaposlitev failed: ${err instanceof Error ? err.message : "Unknown"}`,
    });
  }

  // Careerjet — search with first term (requires API key)
  if (process.env.CAREERJET_API_KEY) {
    const cjTerm = searchTerms[0];
    if (cjTerm) {
      try {
        const jobs = await searchCareerjet(
          cjTerm,
          geoValue ?? undefined
        );
        // Careerjet searches descriptions — tag as search-matched
        for (const j of jobs) j.searchMatched = true;
        results.push(...jobs);
        fetchLog.push({
          step: "source_careerjet",
          detail: `Careerjet "${cjTerm}" → ${jobs.length} results`,
          count: jobs.length,
        });
      } catch (err) {
        fetchLog.push({
          step: "source_careerjet_error",
          detail: `Careerjet "${cjTerm}" failed: ${err instanceof Error ? err.message : "Unknown"}`,
        });
      }
    }
  }

  return { listings: results, fetchLog };
}

// Words too generic to count as a meaningful match on their own
const STOP_WORDS = new Set([
  "senior", "junior", "lead", "head", "chief", "manager", "assistant",
  "intern", "trainee", "specialist", "expert", "consultant", "associate",
  "full", "stack", "part", "time", "m/ž", "m/f", "ii", "iii", "i",
  "za", "in", "na", "pri", "ali", "ter", "po", "iz", "do", "se",
  "der", "die", "und", "für", "von", "mit",
]);

/**
 * Filter and categorize listings by relevance.
 * - perfect: full search phrase found in title
 * - good: 2+ meaningful keyword words match
 * - partial: 1 meaningful keyword word matches
 * - rejected: no meaningful words match
 */
function filterByPreferences(
  listings: JobListing[],
  agent: AgentWithCompanies,
  matchKeywords: string[]
): { matched: JobListing[]; locationRejected: number; roleRejected: number } {
  const matched: JobListing[] = [];
  let roleRejected = 0;
  let locationRejected = 0;

  // Extract unique meaningful words from all keywords
  const meaningfulWords = new Set<string>();
  for (const kw of matchKeywords) {
    for (const word of kw.split(/[\s\/,\-]+/)) {
      const w = word.toLowerCase().trim();
      if (w.length >= 3 && !STOP_WORDS.has(w)) {
        meaningfulWords.add(w);
      }
    }
  }
  const wordList = [...meaningfulWords];

  for (const job of listings) {
    const titleLower = job.title.toLowerCase();

    // Geographic filter (hard reject) — supports comma-separated values
    if (agent.geoScope === "city" && agent.geoValue && job.location) {
      const cities = agent.geoValue.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
      const locLower = job.location.toLowerCase();
      const cityMatch = cities.some((city) => locLower.includes(city));
      if (!cityMatch) {
        locationRejected++;
        continue;
      }
    } else if (agent.geoScope === "region" && agent.geoValue && job.location) {
      const regions = agent.geoValue.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
      const locLower = job.location.toLowerCase();
      // Match if location contains any selected region name or any city in those regions
      const regionMatch = regions.some((regionKey) => {
        const cities = REGION_CITIES[regionKey] ?? [];
        return locLower.includes(regionKey) || cities.some((city) => locLower.includes(city));
      });
      if (!regionMatch) {
        locationRejected++;
        continue;
      }
    }

    // Relevance scoring
    if (matchKeywords.length > 0) {
      // Check full phrase match first
      const fullMatch = matchKeywords.some((kw) => titleLower.includes(kw));
      if (fullMatch) {
        job.relevance = "perfect";
        matched.push(job);
        continue;
      }

      // Count individual word matches
      const matchedWords = wordList.filter((w) => titleLower.includes(w));

      if (matchedWords.length >= 2) {
        job.relevance = "good";
        matched.push(job);
      } else if (matchedWords.length === 1) {
        job.relevance = "partial";
        matched.push(job);
      } else if (job.searchMatched) {
        // No title match, but the API found this via description search
        // (e.g. "Junior Programer" listing that mentions Laravel in the body)
        job.relevance = "partial";
        matched.push(job);
      } else {
        roleRejected++;
      }
    } else {
      job.relevance = "other";
      matched.push(job);
    }
  }

  return { matched, roleRejected, locationRejected };
}

/**
 * Deduplicate by externalId and store new job matches.
 */
async function deduplicateAndStore(
  listings: JobListing[],
  agentId: string
): Promise<{ newCount: number; dupCount: number; newItems: JobListing[] }> {
  if (listings.length === 0) return { newCount: 0, dupCount: 0, newItems: [] };

  const existing = await db.query.jobMatches.findMany({
    where: eq(jobMatches.agentId, agentId),
    columns: { externalId: true },
  });
  const existingIds = new Set(existing.map((e) => e.externalId));

  const newListings = listings.filter(
    (l) => !existingIds.has(l.externalId)
  );
  const dupCount = listings.length - newListings.length;

  if (newListings.length === 0) return { newCount: 0, dupCount, newItems: [] };

  await db.insert(jobMatches).values(
    newListings.map((l) => ({
      agentId,
      title: l.title,
      company: l.company,
      location: l.location,
      url: l.url,
      source: l.source,
      externalId: l.externalId,
      relevance: l.relevance ?? "other",
    }))
  );

  return { newCount: newListings.length, dupCount, newItems: newListings };
}

/**
 * Deduplicate and store company alerts.
 */
async function deduplicateAndStoreCompanyAlerts(
  listings: JobListing[],
  agentId: string,
  watchedCompanyId: string
): Promise<{ newCount: number; dupCount: number; newItems: JobListing[] }> {
  if (listings.length === 0) return { newCount: 0, dupCount: 0, newItems: [] };

  const existing = await db.query.companyAlerts.findMany({
    where: and(
      eq(companyAlerts.agentId, agentId),
      eq(companyAlerts.watchedCompanyId, watchedCompanyId)
    ),
    columns: { externalId: true },
  });
  const existingIds = new Set(existing.map((e) => e.externalId));

  const newListings = listings.filter(
    (l) => !existingIds.has(l.externalId)
  );
  const dupCount = listings.length - newListings.length;

  if (newListings.length === 0) return { newCount: 0, dupCount, newItems: [] };

  await db.insert(companyAlerts).values(
    newListings.map((l) => ({
      agentId,
      watchedCompanyId,
      title: l.title,
      url: l.url,
      source: l.source,
      externalId: l.externalId,
    }))
  );

  return { newCount: newListings.length, dupCount, newItems: newListings };
}
