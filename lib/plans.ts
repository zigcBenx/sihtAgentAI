export const PLANS = {
  free: {
    name: "Free",
    maxAgents: 1,
    maxCompanies: 3,
    frequency: "weekly" as const,
    visibleResults: 10,
    price: 0,
  },
  pro: {
    name: "Pro",
    maxAgents: 5,
    maxCompanies: 20,
    frequency: "daily" as const,
    visibleResults: Infinity,
    price: 499, // cents
  },
} as const;

export type PlanName = keyof typeof PLANS;

export function getUserPlan(user: {
  plan: string;
  stripeCurrentPeriodEnd: Date | null;
}): PlanName {
  if (
    user.plan === "pro" &&
    user.stripeCurrentPeriodEnd &&
    user.stripeCurrentPeriodEnd > new Date()
  ) {
    return "pro";
  }
  return "free";
}
