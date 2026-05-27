interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

class ServiceTokenManager {
  private static instance: ServiceTokenManager;
  private accessToken: string | null = null;
  private tokenExpiration: number = 0; // Unix timestamp in seconds
  private refreshBuffer: number = 60; // Refresh 60 seconds before expiry

  private constructor() {}

  public static getInstance(): ServiceTokenManager {
    if (!ServiceTokenManager.instance) {
      ServiceTokenManager.instance = new ServiceTokenManager();
    }
    return ServiceTokenManager.instance;
  }

  public async getAccessToken(): Promise<string> {
    const currentTime = Math.floor(Date.now() / 1000);

    if (this.accessToken && this.tokenExpiration > currentTime + this.refreshBuffer) {
      return this.accessToken;
    }

    return this.refreshAccessToken();
  }

  public invalidateToken(): void {
    this.accessToken = null;
    this.tokenExpiration = 0;
  }

  private async refreshAccessToken(): Promise<string> {
    console.log("Refreshing service token...");
    
    const issuer = process.env.JWT_ISSUER_URI;
    const clientId = process.env.NEXTJS_BFF_CLIENT_ID;
    const clientSecret = process.env.NEXTJS_BFF_CLIENT_SECRET;
    const internalUrl = process.env.KEYCLOAK_INTERNAL_URL || issuer;

    if (!issuer || !clientId || !clientSecret) {
      throw new Error("Missing JWT issuer or client credentials in environment variables.");
    }

    const tokenEndpoint = `${internalUrl}/oauth2/token`;
    console.log("Token endpoint:", tokenEndpoint);
    console.log("Client ID:", clientId);
    console.log("Client secret:", clientSecret);
    console.log("Scope:", "openid user.batch-read");

    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("scope", "openid user.batch-read");

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    try {
      const response = await fetch(tokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${basicAuth}`,
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to obtain service token: ${response.status} ${errorText}`);
      }

      const data = await response.json() as TokenResponse;

      this.accessToken = data.access_token;
      // expires_in is in seconds
      this.tokenExpiration = Math.floor(Date.now() / 1000) + data.expires_in;

      console.log("Service token refreshed successfully.");
      return this.accessToken;
    } catch (error) {
      console.error("Error refreshing service token:", error);
      throw error;
    }
  }
}

export const serviceTokenManager = ServiceTokenManager.getInstance();

