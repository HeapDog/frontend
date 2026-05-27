import { NextRequest, NextResponse } from "next/server";
import { storeTokens } from "@/lib/token-utils";
import { randomUUID } from "crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { id } from "zod/v4/locales";
import { Ingrid_Darling } from "next/font/google";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json(
      { error: "Missing code or state" },
      { status: 400 },
    );
  }

  // Retrieve code verifier from cookie
  const cookieName = `oauth_verifier_${state}`;
  const codeVerifier = request.cookies.get(cookieName)?.value;

  if (!codeVerifier) {
    return NextResponse.json(
      { error: "Invalid state or state expired" },
      { status: 400 },
    );
  }

  const authServiceUrl = process.env.AUTH_SERVICE_URL;
  const authServiceInternalUrl = process.env.AUTH_SERVICE_INTERNAL_URL || authServiceUrl;
  const clientId = process.env.NEXTJS_FRONTEND_CLIENT_ID;
  const clientSecret = process.env.NEXTJS_FRONTEND_CLIENT_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const jwtIssuer = process.env.JWT_ISSUER_URI;
  const jwkSetUri = process.env.JWK_SET_URI;

  if (!authServiceUrl || !clientId || !clientSecret || !baseUrl || !jwkSetUri) {
    console.error("Missing environment variables for auth callback");
    return NextResponse.json(
      { error: "Server misconfiguration" },
      { status: 500 },
    );
  }

  const tokenUrl = `${authServiceInternalUrl}/realms/heapdog/protocol/openid-connect/token`;
  const redirectUri = `${baseUrl}/oauth2/callback`;

  // Basic Auth Header
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code: code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: params,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Token exchange failed:", errorText);
      const errorResponse = NextResponse.json(
        { error: "Failed to exchange token", details: errorText },
        { status: response.status },
      );
      errorResponse.cookies.delete(cookieName);
      return errorResponse;
    }

    const tokens = await response.json();
    const idToken = tokens?.id_token;
    if (!idToken) {
      const errorResponse = NextResponse.json(
        { error: "Missing id_token in token response" },
        { status: 500 },
      );
      errorResponse.cookies.delete(cookieName);
      return errorResponse;
    }

    // We still validate here to ensure we don't start a session with invalid token,
    // even though storeTokens will validate again.
    try {
      const jwks = createRemoteJWKSet(new URL(jwkSetUri));
      await jwtVerify(idToken, jwks, {
        issuer: jwtIssuer,
        audience: clientId,
      });
    } catch (error) {
      console.error("ID token validation failed:", error);
      const errorResponse = NextResponse.json(
        { error: "Invalid id_token" },
        { status: 401 },
      );
      errorResponse.cookies.delete(cookieName);
      return errorResponse;
    }

    const sessionId = randomUUID();

    await storeTokens(sessionId, tokens);

    const nextCookie = request.cookies.get("post_auth_redirect")?.value;
    const redirectPath =
      nextCookie && nextCookie.startsWith("/") ? nextCookie : "/";
    const redirectUrl = new URL(redirectPath, baseUrl);
    const successResponse = NextResponse.redirect(redirectUrl);

    successResponse.cookies.set("session_id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    successResponse.cookies.delete(cookieName);
    successResponse.cookies.delete("post_auth_redirect");
    return successResponse;
  } catch (error) {
    console.error("Auth callback error:", error);
    const errorResponse = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
    errorResponse.cookies.delete(cookieName);
    return errorResponse;
  }
}
