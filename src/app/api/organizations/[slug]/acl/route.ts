import { BackendClient } from "@/lib/backend-client";
import { getValidAccessToken } from "@/lib/token-utils";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const token = await getValidAccessToken();

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Call dynamic Java backend to persist organization policy configurations
    const response = await BackendClient.post<any>(
      `/organizations/${slug}/acl`,
      body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Save ACL policy error:", error);
    const status = error.status || 500;
    return NextResponse.json(
      {
        error: error.message || "Failed to save organization policy",
        details: error.details || null,
        code: error.code || "UNKNOWN_ERROR"
      },
      { status }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const token = await getValidAccessToken();

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Call dynamic Java backend to persist organization policy configurations using PUT
    const response = await BackendClient.put<any>(
      `/organizations/${slug}/acl`,
      body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Update ACL policy error:", error);
    const status = error.status || 500;
    return NextResponse.json(
      {
        error: error.message || "Failed to update organization policy",
        details: error.details || null,
        code: error.code || "UNKNOWN_ERROR"
      },
      { status }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const token = await getValidAccessToken();

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await BackendClient.get<any>(
      `/organizations/${slug}/acl`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Fetch ACL policy error:", error);
    const status = error.status || 500;
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch organization policy",
      },
      { status }
    );
  }
}
