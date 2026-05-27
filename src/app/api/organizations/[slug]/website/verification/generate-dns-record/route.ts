import { BackendClient } from "@/lib/backend-client";
import { getValidAccessToken } from "@/lib/token-utils";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const token = await getValidAccessToken();

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await BackendClient.post<any>(
      `/organizations/${slug}/website/verification/generate-dns-record`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Start website verification error:", error);
    const status = error.status || 500;
    return NextResponse.json(error, { status });
  }
}
