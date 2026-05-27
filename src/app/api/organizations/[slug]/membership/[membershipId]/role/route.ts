import { BackendClient } from "@/lib/backend-client";
import { getValidAccessToken } from "@/lib/token-utils";
import { NextRequest, NextResponse } from "next/server";

async function handleRoleUpdate(
  req: NextRequest,
  params: Promise<{ slug: string; membershipId: string }>
) {
  const { slug, membershipId } = await params;
  
  try {
    const token = await getValidAccessToken();

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const roleValue = body.role || body.newRole;

    if (!roleValue) {
      return NextResponse.json(
        { error: "Bad Request: role or newRole is required" },
        { status: 400 }
      );
    }

    // The backend expects PUT /organizations/{slug}/memberships/{membershipId}
    // with body { "role": "ROLE" }
    const response = await BackendClient.put<any>(
      `/organizations/${slug}/memberships/${membershipId}`,
      { role: roleValue },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Update member role error:", error);
    
    const status = error.status || 500;
    return NextResponse.json(
      error,
      { status: status }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; membershipId: string }> }
) {
  return handleRoleUpdate(req, params);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; membershipId: string }> }
) {
  return handleRoleUpdate(req, params);
}
