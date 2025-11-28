import { BackendClient } from "@/lib/backend-client";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; invitationId: string }> }
) {
  const { slug, invitationId } = await params;
  
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const response = await BackendClient.patch<any>(
      `/organizations/${slug}/invitations/${invitationId}/revoke`,
      {}, // empty body
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Revoke invitation error:", error);
    
    const status = error.status || 500;
    return NextResponse.json(
      error,
      { status: status }
    );
  }
}

