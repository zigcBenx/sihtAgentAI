import { z } from "zod/v4";

export const agentTypes = ["job_search", "company_watcher"] as const;

export const locationPreferences = [
  "remote",
  "slovenia",
  "specific_city",
] as const;

export const frequencies = ["hourly", "daily", "weekly"] as const;

export const createAgentSchema = z.object({
  name: z.string().min(1, "Agent name is required").max(100),
  agentType: z.enum(agentTypes),
  desiredRole: z.string().max(200).optional(),
  salaryMin: z.coerce.number().int().positive().optional(),
  salaryMax: z.coerce.number().int().positive().optional(),
  locationPreference: z.enum(locationPreferences).optional(),
  specificCity: z.string().max(100).optional(),
  frequency: z.enum(frequencies).default("daily"),
});

export const updateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  frequency: z.enum(frequencies).optional(),
  desiredRole: z.string().max(200).optional(),
  salaryMin: z.coerce.number().int().positive().optional(),
  salaryMax: z.coerce.number().int().positive().optional(),
  locationPreference: z.enum(locationPreferences).optional(),
  specificCity: z.string().max(100).optional(),
});

export const watchedCompanySchema = z.object({
  companyName: z.string().min(1, "Company name is required").max(200),
  careersUrl: z
    .string()
    .url("Please enter a valid URL (e.g. https://company.com/careers)")
    .min(1, "Careers page URL is required"),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
export type WatchedCompanyInput = z.infer<typeof watchedCompanySchema>;
