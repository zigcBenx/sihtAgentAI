import type { JobListing } from "./types";

const API_BASE =
  "https://apigateway-prod-www-prod.apps.ess.gov.si/iskalnik-po-pdm/v1";
const USER_KEY = "9b7dcbe8ec1855d14f0b2ec4f6335a91";

interface EssJob {
  idDelovnoMesto: number;
  nazivDelovnegaMesta: string;
  delodajalec: string;
  krajDM: string;
  trajanjeZaposlitve: string | null;
  delovniCas: string | null;
  ravenIzobrazbe: string | null;
  datumObjave: string | null;
  poklic: string | null;
}

interface EssResponse {
  steviloDelovnihMest: number;
  seznamDelovnihMest: EssJob[];
}

const PAGE_SIZE = 100;
const MAX_PAGES = 50; // safety cap: 100 × 50 = 5000 max

/**
 * Search the ESS/ZRSZ (Zavod RS za zaposlovanje) public API for job listings.
 * Uses the same API that powers poiscidelo.si.
 * Paginates through all results automatically.
 */
export async function searchEss(
  keyword: string
): Promise<JobListing[]> {
  const results: JobListing[] = [];
  const endpoint = `${API_BASE}/delovno-mesto/prosta-delovna-mesta-filtri?user_key=${USER_KEY}`;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const body = {
      nazivDelovnegaMesta: keyword,
      lokacija: "",
      drzave: [],
      poklicnaPodrocja: [],
      regije: [],
      stran: page,
      stZadetkov: PAGE_SIZE,
      vrniFiltre: false,
      urejevalniPojem: 0,
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.error(`ESS API error: ${res.status}`);
      break;
    }

    const data: EssResponse = await res.json();
    const jobs = data.seznamDelovnihMest ?? [];
    const total = data.steviloDelovnihMest ?? 0;

    results.push(
      ...jobs.map((job) => ({
        title: job.nazivDelovnegaMesta,
        company: job.delodajalec,
        location: job.krajDM || null,
        url: `https://www.ess.gov.si/iskalci-zaposlitve/prosta-delovna-mesta/${job.idDelovnoMesto}`,
        source: "ess" as const,
        externalId: `ess-${job.idDelovnoMesto}`,
      }))
    );

    if (results.length >= total || jobs.length < PAGE_SIZE) break;
  }

  return results;
}
