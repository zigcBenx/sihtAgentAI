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
import { scrapeCareerPage } from "./careers-scraper";
import { expandKeywords } from "./keywords";
import type { JobListing } from "./types";

interface AgentWithCompanies {
  id: string;
  name: string;
  agentType: string;
  desiredRole: string | null;
  locationPreference: string | null;
  specificCity: string | null;
  watchedCompanies: {
    id: string;
    companyName: string;
    careersUrl: string | null;
  }[];
}

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
  newJobMatches: number;
  newCompanyAlerts: number;
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
  let hasError = false;

  log.push({ step: "start", detail: `Running job search "${agent.name}"` });

  if (agent.desiredRole) {
    const { searchTerms, matchKeywords } = expandKeywords(agent.desiredRole);

    log.push({
      step: "keywords",
      detail: `Expanded "${agent.desiredRole}" → searching: ${searchTerms.join(", ")}`,
      count: searchTerms.length,
    });
    log.push({
      step: "keywords_match",
      detail: `Match keywords: ${matchKeywords.join(", ")}`,
      count: matchKeywords.length,
    });

    const { listings, fetchLog } = await fetchJobListings(
      searchTerms,
      agent.locationPreference,
      agent.specificCity
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

    const { matched, itemLog } = filterByPreferences(
      uniqueListings,
      agent,
      matchKeywords
    );

    const roleRejected = itemLog.filter((i) => i.status === "rejected_role").length;
    const locationRejected = itemLog.filter((i) => i.status === "rejected_location").length;

    log.push({
      step: "filter_result",
      detail: `${matched.length} passed, ${roleRejected} rejected by role, ${locationRejected} rejected by location`,
      count: matched.length,
      items: itemLog,
    });

    const stored = await deduplicateAndStore(matched, agent.id);
    newJobMatches = stored.newCount;

    log.push({
      step: "dedup",
      detail: `${stored.newCount} new matches stored, ${stored.dupCount} already known`,
      count: stored.newCount,
    });
  } else {
    log.push({ step: "skip", detail: "No desiredRole set — skipping job search" });
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
    newJobMatches,
    newCompanyAlerts: 0,
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
  let hasError = false;

  log.push({ step: "start", detail: `Running company watcher "${agent.name}"` });

  if (agent.desiredRole) {
    log.push({
      step: "filter",
      detail: `Smart filtering enabled for: "${agent.desiredRole}"`,
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
          agent.desiredRole
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
    newJobMatches: 0,
    newCompanyAlerts,
    log,
  };
}

/**
 * Fetch from both sources using multiple search terms and merge.
 */
async function fetchJobListings(
  searchTerms: string[],
  locationPref: string | null,
  specificCity: string | null
): Promise<{ listings: JobListing[]; fetchLog: LogEntry[] }> {
  const fetchLog: LogEntry[] = [];
  const regionHint =
    locationPref === "specific_city" ? specificCity : undefined;

  const results: JobListing[] = [];

  const mojeDeloTerms = searchTerms.slice(0, 3);
  for (const term of mojeDeloTerms) {
    try {
      const jobs = await searchMojeDelo(term);
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

  return { listings: results, fetchLog };
}

/**
 * Filter listings against agent preferences using expanded keywords.
 */
function filterByPreferences(
  listings: JobListing[],
  agent: AgentWithCompanies,
  matchKeywords: string[]
): { matched: JobListing[]; itemLog: LogItem[] } {
  const matched: JobListing[] = [];
  const itemLog: LogItem[] = [];

  for (const job of listings) {
    const titleLower = job.title.toLowerCase();
    const item: LogItem = {
      title: job.title,
      company: job.company,
      location: job.location,
      url: job.url,
      status: "matched",
    };

    if (matchKeywords.length > 0) {
      const matchedKw = matchKeywords.find((kw) => titleLower.includes(kw));
      if (!matchedKw) {
        item.status = "rejected_role";
        item.reason = `Title "${job.title}" doesn't contain any of: ${matchKeywords.join(", ")}`;
        itemLog.push(item);
        continue;
      }
    }

    if (
      agent.locationPreference === "specific_city" &&
      agent.specificCity &&
      job.location
    ) {
      const cityLower = agent.specificCity.toLowerCase();
      const locLower = job.location.toLowerCase();
      if (!locLower.includes(cityLower)) {
        item.status = "rejected_location";
        item.reason = `Location "${job.location}" doesn't match "${agent.specificCity}"`;
        itemLog.push(item);
        continue;
      }
    }

    item.status = "matched";
    matched.push(job);
    itemLog.push(item);
  }

  return { matched, itemLog };
}

/**
 * Deduplicate by externalId and store new job matches.
 */
async function deduplicateAndStore(
  listings: JobListing[],
  agentId: string
): Promise<{ newCount: number; dupCount: number }> {
  if (listings.length === 0) return { newCount: 0, dupCount: 0 };

  const existing = await db.query.jobMatches.findMany({
    where: eq(jobMatches.agentId, agentId),
    columns: { externalId: true },
  });
  const existingIds = new Set(existing.map((e) => e.externalId));

  const newListings = listings.filter(
    (l) => !existingIds.has(l.externalId)
  );
  const dupCount = listings.length - newListings.length;

  if (newListings.length === 0) return { newCount: 0, dupCount };

  await db.insert(jobMatches).values(
    newListings.map((l) => ({
      agentId,
      title: l.title,
      company: l.company,
      location: l.location,
      url: l.url,
      source: l.source,
      externalId: l.externalId,
    }))
  );

  return { newCount: newListings.length, dupCount };
}

/**
 * Deduplicate and store company alerts.
 */
async function deduplicateAndStoreCompanyAlerts(
  listings: JobListing[],
  agentId: string,
  watchedCompanyId: string
): Promise<{ newCount: number; dupCount: number }> {
  if (listings.length === 0) return { newCount: 0, dupCount: 0 };

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

  if (newListings.length === 0) return { newCount: 0, dupCount };

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

  return { newCount: newListings.length, dupCount };
}
