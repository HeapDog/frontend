import { cookies } from "next/headers";
import redis from "@/lib/redis";
import { createRemoteJWKSet, jwtVerify, JWTPayload } from "jose";

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in: number;
  refresh_expires_in?: number;
}

interface StoredAccessToken {
  access_token: string;
}

interface StoredIdentity {
  id_token?: string;
  id_token_decoded?: JWTPayload;
}

const SESSION_COOKIE_NAME = "session_id";
const ACCESS_TOKEN_TTL_BUFFER = 15;
const SESSION_DATA_TTL = 30 * 24 * 60 * 60 - 15; // Match refresh token TTL

const accessTokenKey = (sessionId: string) =>
  `next:session:${sessionId}:access_token`;
const identityKey = (sessionId: string) =>
  `next:session:${sessionId}:identity`;
const refreshTokenKey = (sessionId: string) =>
  `next:session:${sessionId}:refresh_token`;

async function getSessionId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}

export async function getStoredAccessToken(
  sessionId: string,
): Promise<string | null> {
  try {
    const data = await redis.get(accessTokenKey(sessionId));
    if (!data) return null;
    const parsed = JSON.parse(data) as StoredAccessToken;
    return parsed.access_token;
  } catch (error) {
    console.error("Error retrieving access token:", error);
    return null;
  }
}

export async function getStoredIdentity(
  sessionId: string,
): Promise<StoredIdentity | null> {
  try {
    const data = await redis.get(identityKey(sessionId));
    return data ? (JSON.parse(data) as StoredIdentity) : null;
  } catch (error) {
    console.error("Error retrieving identity data:", error);
    return null;
  }
}

async function getStoredRefreshToken(
  sessionId: string,
): Promise<string | null> {
  try {
    const data = await redis.get(refreshTokenKey(sessionId));
    if (!data) return null;
    const parsed = JSON.parse(data) as { refresh_token?: string };
    return parsed.refresh_token || null;
  } catch (error) {
    console.error("Error retrieving refresh token:", error);
    return null;
  }
}

async function storeAccessToken(
  sessionId: string,
  accessToken: string,
  expiresIn: number,
) {
  const ttl = expiresIn - ACCESS_TOKEN_TTL_BUFFER;
  await redis.set(
    accessTokenKey(sessionId),
    JSON.stringify({
      access_token: accessToken,
    }),
    "EX",
    ttl,
  );
}

async function storeIdentity(
  sessionId: string,
  idToken: string | undefined,
  idTokenDecoded: JWTPayload | undefined,
) {
  await redis.set(
    identityKey(sessionId),
    JSON.stringify({
      id_token: idToken,
      id_token_decoded: idTokenDecoded,
    }),
    "EX",
    SESSION_DATA_TTL,
  );
}

async function storeRefreshToken(sessionId: string, refreshToken: string) {
  await redis.set(
    refreshTokenKey(sessionId),
    JSON.stringify({ refresh_token: refreshToken }),
    "EX",
    SESSION_DATA_TTL,
  );
}

async function validateIdToken(idToken: string): Promise<JWTPayload> {
  const issuer = process.env.JWT_ISSUER_URI;
  const jwkSetUri = process.env.JWK_SET_URI;
  const clientId = process.env.NEXTJS_FRONTEND_CLIENT_ID;

  if (!issuer || !jwkSetUri || !clientId) {
    throw new Error("Missing JWT environment variables");
  }

  const jwks = createRemoteJWKSet(new URL(jwkSetUri));
  const { payload } = await jwtVerify(idToken, jwks, {
    issuer,
    audience: clientId,
  });

  return payload;
}

async function fetchTokensWithRefreshToken(
  refreshToken: string,
): Promise<TokenResponse | null> {
  const authServiceUrl = process.env.AUTH_SERVICE_URL;
  const clientId = process.env.NEXTJS_FRONTEND_CLIENT_ID;
  const clientSecret = process.env.NEXTJS_FRONTEND_CLIENT_SECRET;

  if (!authServiceUrl || !clientId || !clientSecret) {
    console.error("Missing environment variables for token refresh");
    return null;
  }

  const tokenUrl = `${authServiceUrl}/realms/heapdog/protocol/openid-connect/token`;
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: params,
  });

  if (!response.ok) {
    console.error("Token refresh failed:", await response.text());
    return null;
  }

  return (await response.json()) as TokenResponse;
}

export async function refreshTokensForSession(
  sessionId: string,
): Promise<TokenResponse | null> {
  const currentRefreshToken = await getStoredRefreshToken(sessionId);
  if (!currentRefreshToken) {
    return null;
  }

  const newTokens = await fetchTokensWithRefreshToken(currentRefreshToken);
  if (!newTokens || !newTokens.access_token || !newTokens.expires_in) {
    return null;
  }

  if (newTokens.id_token) {
    try {
      const idTokenDecoded = await validateIdToken(newTokens.id_token);
      await storeIdentity(sessionId, newTokens.id_token, idTokenDecoded);
    } catch (error) {
      console.error("ID token validation failed during refresh:", error);
      return null;
    }
  }

  await storeAccessToken(
    sessionId,
    newTokens.access_token,
    Number(newTokens.expires_in),
  );

  const refreshTokenToStore = newTokens.refresh_token || currentRefreshToken;
  if (refreshTokenToStore) {
    await storeRefreshToken(sessionId, refreshTokenToStore);
  }

  return newTokens;
}

export async function refreshTokens(): Promise<TokenResponse | null> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    console.warn("No session ID found during token refresh");
    return null;
  }

  return refreshTokensForSession(sessionId);
}

export async function storeTokens(sessionId: string, tokens: TokenResponse) {
  if (tokens.id_token) {
    try {
      const idTokenDecoded = await validateIdToken(tokens.id_token);
      await storeIdentity(sessionId, tokens.id_token, idTokenDecoded);
    } catch (error) {
      console.error("ID token validation failed:", error);
      return;
    }
  }

  if (tokens.access_token && tokens.expires_in) {
    await storeAccessToken(
      sessionId,
      tokens.access_token,
      Number(tokens.expires_in),
    );
  }

  if (tokens.refresh_token) {
    await storeRefreshToken(sessionId, tokens.refresh_token);
  }
}

export async function setAuthCookies(tokens: TokenResponse) {
  const sessionId = await getSessionId();
  if (!sessionId) {
    console.warn("Cannot save tokens: No session ID found.");
    return;
  }
  await storeTokens(sessionId, tokens);
}

export async function getValidAccessToken(): Promise<string | undefined> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return undefined;
  }

  const storedAccess = await getStoredAccessToken(sessionId);
  if (storedAccess) {
    return storedAccess;
  }

  const refreshed = await refreshTokensForSession(sessionId);
  return refreshed?.access_token;
}

export async function clearSession(sessionId: string) {
  try {
    await Promise.all([
      redis.del(accessTokenKey(sessionId)),
      redis.del(identityKey(sessionId)),
      redis.del(refreshTokenKey(sessionId)),
    ]);
  } catch (error) {
    console.error("Error clearing session from Redis:", error);
  }
}
