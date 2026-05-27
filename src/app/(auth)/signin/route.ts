import { NextRequest, NextResponse } from "next/server";
import { generateCodeVerifier, generateCodeChallenge } from "@/lib/pkce";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  const nextPath = request.nextUrl.searchParams.get("next");
  const prompt = request.nextUrl.searchParams.get("prompt");

  // 2.1 Generate a code verifier (43-128 chars)
  // src/lib/pkce.ts generateCodeVerifier uses 32 bytes which results in 43 chars base64url
  const codeVerifier = generateCodeVerifier();

  // 2.2 Generate code challenge
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // 2.3 Generate a random state
  const state = crypto.randomBytes(16).toString("hex");

  // 2.4 Redirect user
  const authServiceUrl = process.env.AUTH_SERVICE_URL;
  const clientId = process.env.NEXTJS_FRONTEND_CLIENT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!authServiceUrl || !clientId || !baseUrl) {
    console.error("Missing environment variables for auth");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const redirectUri = `${baseUrl}/oauth2/callback`;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "openid profile",
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  if (prompt) {
    params.append("prompt", prompt);
  }

  const authorizeUrl = `${authServiceUrl}/realms/heapdog/protocol/openid-connect/auth?${params.toString()}`;

  const response = NextResponse.redirect(authorizeUrl);

  // Store code_verifier in cookie, keyed by state
  response.cookies.set(`oauth_verifier_${state}`, codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });

  if (nextPath) {
    response.cookies.set("post_auth_redirect", nextPath, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10, // 10 minutes
    });
  }

  return response;
}
