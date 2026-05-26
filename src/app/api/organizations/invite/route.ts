import { BackendClient } from "@/lib/backend-client";
import { NextRequest, NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/token-utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = await getValidAccessToken();

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const response = await BackendClient.post<any>(
      "/organizations/invite",
      body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Send invitation error:", error);
    
    const status = error.status || 500;
    return NextResponse.json(
      error,
      { status: status }
    );
  }
}

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

    // Proxy the search to the backend
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
       // Return empty list on error to avoid breaking UI, or error object?
       // Let's return error object for debugging
       { error: error.message || "Search failed", data: [] }, 
       { status }
    );
  }
}
