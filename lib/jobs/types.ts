/** A normalized job listing from any source */
export interface JobListing {
  title: string;
  company: string;
  location: string | null;
  url: string;
  source: "mojedelo" | "optius" | "careers" | "ess" | "inzaposlitev" | "careerjet";
  externalId: string;
}
