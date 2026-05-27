import { NextRequest, NextResponse } from "next/server";
import { fetchInvitationsWithCreators } from "@/lib/invitations";
import { getValidAccessToken } from "@/lib/token-utils";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const searchParams = req.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const size = parseInt(searchParams.get("size") || "10");

        const token = await getValidAccessToken();

        if (!token) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const data = await fetchInvitationsWithCreators(slug, page, size, token);

        return NextResponse.json({ data });

    } catch (error: any) {
        console.error("Error fetching invitations:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch invitations" },
            { status: error.status || 500 }
        );
    }
}

