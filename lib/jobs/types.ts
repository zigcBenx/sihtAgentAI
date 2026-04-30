/** A normalized job listing from any source */
export interface JobListing {
  title: string;
  company: string;
  location: string | null;
  url: string;
  source: "mojedelo" | "optius" | "careers" | "ess" | "inzaposlitev" | "careerjet";
  externalId: string;
  relevance?: Relevance;
  /** True if this listing was returned by a keyword-searched API (MojeDelo, ESS, Careerjet).
   *  These APIs search job descriptions, so even if the title doesn't match,
   *  the listing is likely relevant. */
  searchMatched?: boolean;
}

export type Relevance = "perfect" | "good" | "partial" | "other";
