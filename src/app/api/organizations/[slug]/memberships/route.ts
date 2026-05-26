import { BackendClient } from "@/lib/backend-client";
import { getValidAccessToken } from "@/lib/token-utils";
import { NextResponse } from "next/server";
import { PaginatedData } from "@/lib/types/api";
import { OrganizationMembership } from "@/lib/types/organization";

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

    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") || "1";
    const size = searchParams.get("size") || "10";

    const response = await BackendClient.get<PaginatedData<OrganizationMembership>>(
      `/organizations/${slug}/memberships?page=${page}&size=${size}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const memberships = response.data?.contents || [];
    const members = memberships.map(m => ({
      id: m.userId,
      username: m.user?.username || "Unknown",
      email: m.user?.email || "",
      firstName: m.user?.firstName || "",
      lastName: m.user?.lastName || ""
    }));

    return NextResponse.json({
      contents: members,
      meta: response.data?.meta || { page: Number(page), size: Number(size), totalPages: 1, totalElements: members.length }
    });
  } catch (error: any) {
    console.error("Fetch memberships error:", error);
    const status = error.status || 500;
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch memberships",
        code: error.code || "UNKNOWN_ERROR"
      },
      { status }
    );
  }
}
