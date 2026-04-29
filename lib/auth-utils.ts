import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";

export async function requireAuth() {
  let session: Session | null = null;
  let authError = false;

  try {
    session = await auth();
  } catch {
    authError = true;
  }

  if (authError || !session?.user?.id) {
    redirect("/login");
  }

  return session;
}

/** Safe auth() wrapper for API routes — returns null instead of throwing */
export async function getSession(): Promise<Session | null> {
  try {
    return await auth();
  } catch {
    return null;
  }
}
