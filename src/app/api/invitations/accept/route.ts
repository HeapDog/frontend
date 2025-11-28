import { BackendClient } from "@/lib/backend-client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

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
      `/organizations/${slug}/invitations/accept`,
      { code }, // Send code in body as requested
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

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

