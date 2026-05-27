import { BackendClient } from "@/lib/backend-client";
import { getValidAccessToken } from "@/lib/token-utils";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const token = await getValidAccessToken();

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await BackendClient.get<any>(`/organizations/${slug}/acl/my-permissions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Fetch organization my-permissions error:", error);
    const status = error.status || 500;
    return NextResponse.json(error, { status });
  }
}
