import { NextRequest, NextResponse } from "next/server";
import { BackendClient } from "@/lib/backend-client";
import { cookies } from "next/headers";
import { UnreadCountResponse } from "@/lib/types";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { notificationIds } = body;

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
       return NextResponse.json({ message: "Invalid notification IDs" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const response = await BackendClient.patch<UnreadCountResponse>("/notifications/read", { notificationIds }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
      console.error("Error in mark notifications read API route:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: error.status || 500 }
    );
  }
}

