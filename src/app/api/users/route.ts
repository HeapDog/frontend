import { BackendClient } from "@/lib/backend-client";
import { NextRequest, NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/token-utils";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json({ data: [] });
    }

    const token = await getValidAccessToken();

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Proxy the search to the backend /users endpoint
    const response = await BackendClient.get<any>(
      `/users?query=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("User search error:", error);
    const status = error.status || 500;
    return NextResponse.json(
      { error: error.message || "Search failed", data: [] },
      { status }
    );
  }
}
