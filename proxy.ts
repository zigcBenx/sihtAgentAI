import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = ["/dashboard"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie =
    request.cookies.get("authjs.session-token")?.value ??
    request.cookies.get("__Secure-authjs.session-token")?.value;

  // Redirect unauthenticated users away from protected routes
  const isProtectedRoute = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );
  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Note: We do NOT redirect authenticated users away from /login or /register
  // here because the proxy cannot validate the JWT — the cookie might be stale.
  // Server components handle that redirect after validating the session.

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
