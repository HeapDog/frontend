import { BackendClient } from "@/lib/backend-client";
import { NextResponse } from "next/server";
import { refreshTokens, setAuthCookies, getValidAccessToken } from "@/lib/token-utils";

export async function POST(request: Request) {
  try {
    const token = await getValidAccessToken();

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { code, slug } = body;

    if (!code || !slug) {
      return NextResponse.json(
        { error: "Missing required fields: code and slug" },
        { status: 400 }
      );
    }

    const response = await BackendClient.post(
      `/organizations/${slug}/invitations/accept?code=${code}`,
      {}, 
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Refresh tokens to update the user's session with new organization access
    const newTokens = await refreshTokens();
    if (newTokens) {
      await setAuthCookies(newTokens);
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { 
        message: error.message || "Failed to accept invitation",
        error: error.error || "Internal Server Error"
      },
      { status: error.status || 500 }
    );
  }
}
