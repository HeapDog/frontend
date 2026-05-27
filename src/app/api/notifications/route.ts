import { NextRequest, NextResponse } from "next/server";
import { BackendClient } from "@/lib/backend-client";
import { getValidAccessToken } from "@/lib/token-utils";

export async function GET(req: NextRequest) {

  const searchParams = req.nextUrl.searchParams;
  const page = searchParams.get("page") || "1";
  const size = searchParams.get("size") || "10";

  try {
    const token = await getValidAccessToken();

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const response = await BackendClient.get(`/notifications?page=${page}&size=${size}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
      console.error("Error in notifications API route:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: error.status || 500 }
    );
  }
}

