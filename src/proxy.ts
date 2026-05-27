import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getStoredAccessToken, refreshTokensForSession } from "@/lib/token-utils";

export async function proxy(request: NextRequest) {
  // Existing logic from proxy.ts: Store current path in x-url header
  const requestHeaders = new Headers(request.headers);
  const currentPath = request.nextUrl.pathname + request.nextUrl.search;
  requestHeaders.set("x-url", currentPath);

  // Helper to return response with headers (combining proxy logic with any other response)
  const nextWithHeaders = () => NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Exclude auth routes and static assets
  if (
    request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return nextWithHeaders();
  }

  const sessionId = request.cookies.get("session_id")?.value;
  if (!sessionId) {
    return nextWithHeaders();
  }

  const accessToken = await getStoredAccessToken(sessionId);
  if (accessToken) {
    return nextWithHeaders();
  }

  const refreshed = await refreshTokensForSession(sessionId);
  if (refreshed?.access_token) {
    return nextWithHeaders();
  }

  return nextWithHeaders();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
