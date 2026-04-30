import { z } from "zod/v4";

export const agentTypes = ["job_search", "company_watcher"] as const;

export const workModes = ["remote", "hybrid", "onsite"] as const;
export const geoScopes = ["anywhere", "slovenia", "region", "city"] as const;

export const SLOVENIAN_REGIONS = [
  "Gorenjska",
  "Goriška",
  "Jugovzhodna Slovenija",
  "Koroška",
  "Notranjsko-kraška",
  "Obalno-kraška",
  "Osrednjeslovenska",
  "Podravska",
  "Pomurska",
  "Posavska",
  "Savinjska",
  "Zasavska",
] as const;

export const frequencies = ["daily", "weekly"] as const;

export const createAgentSchema = z.object({
  name: z.string().min(1, "Agent name is required").max(100),
  agentType: z.enum(agentTypes),
  desiredRole: z.string().max(200).optional(),
  profileSummary: z.string().max(2000).optional(),
  searchTerms: z.string().max(2000).optional(),
  salaryMin: z.coerce.number().int().positive().optional(),
  salaryMax: z.coerce.number().int().positive().optional(),
  workMode: z.string().max(100).optional(),
  geoScope: z.enum(geoScopes).optional(),
  geoValue: z.string().max(500).optional(),
  frequency: z.enum(frequencies).default("daily"),
});

export const updateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  frequency: z.enum(frequencies).optional(),
  desiredRole: z.string().max(200).optional(),
  profileSummary: z.string().max(2000).optional(),
  searchTerms: z.string().max(2000).optional(),
  salaryMin: z.coerce.number().int().positive().optional(),
  salaryMax: z.coerce.number().int().positive().optional(),
  workMode: z.string().max(100).optional(),
  geoScope: z.enum(geoScopes).optional(),
  geoValue: z.string().max(500).optional(),
});

export const watchedCompanySchema = z.object({
  companyName: z.string().min(1, "Company name is required").max(200),
  careersUrl: z
    .string()
    .url("Please enter a valid URL (e.g. https://company.com/careers)")
    .min(1, "Careers page URL is required"),
});

export const generateProfileSchema = z.object({
  workType: z.string().min(1).max(200),
  experienceLevel: z.string().min(1).max(50),
  additionalContext: z.string().max(1000).optional(),
  agentType: z.enum(agentTypes),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
export type WatchedCompanyInput = z.infer<typeof watchedCompanySchema>;
export type GenerateProfileInput = z.infer<typeof generateProfileSchema>;
