import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getStoredIdentity, getStoredAccessToken, clearSession } from "@/lib/token-utils";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  let idToken: string | undefined;
  if (sessionId) {
    const identityData = await getStoredIdentity(sessionId);
    idToken = identityData?.id_token;

    // Fallback for sessions created before the refactor
    if (!idToken) {
      const accessTokenData = await getStoredAccessToken(sessionId);
      // If we still had the old format, it might be in the accessTokenData object
      // (Even though we changed the type, it might still exist in Redis)
      if (accessTokenData && typeof accessTokenData === "object") {
        idToken = (accessTokenData as any).id_token;
      }
    }

    // Clear session data from Redis
    await clearSession(sessionId);
  }

  const authServiceUrl = process.env.AUTH_SERVICE_URL || process.env.KEYCLOAK_ISSUER?.replace(/\/realms\/.*$/, "");
  const clientId = process.env.NEXTJS_FRONTEND_CLIENT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  let response: NextResponse;

  if (idToken && authServiceUrl && clientId && baseUrl) {
    const params = new URLSearchParams({
      client_id: clientId,
      id_token_hint: idToken,
      post_logout_redirect_uri: baseUrl,
    });

    const logoutUrl = `${authServiceUrl}/realms/heapdog/protocol/openid-connect/logout?${params.toString()}`;
    response = NextResponse.redirect(logoutUrl);
  } else {
    console.warn("Skipping Keycloak logout due to missing parameters");
    response = NextResponse.redirect(new URL("/", request.url));
  }

  // Clear session cookie
  response.cookies.set("session_id", "", { maxAge: 0, path: "/" });

  // Clear legacy cookies if they exist
  response.cookies.set("access_token", "", { maxAge: 0, path: "/" });
  response.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
  response.cookies.set("id_token", "", { maxAge: 0, path: "/" });

  return response;
}
