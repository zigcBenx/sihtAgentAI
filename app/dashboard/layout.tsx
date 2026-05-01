import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Header } from "@/components/layout/header";
import { getUserPlan } from "@/lib/plans";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });
  const plan = getUserPlan({
    plan: user?.plan ?? "free",
    stripeCurrentPeriodEnd: user?.stripeCurrentPeriodEnd ?? null,
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header userName={session.user.name} plan={plan} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        {children}
      </main>
    </div>
  );
}
