import { NextRequest, NextResponse } from "next/server";
import { fetchInvitationStatuses } from "@/lib/invitations";
import { getValidAccessToken } from "@/lib/token-utils";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const searchParams = req.nextUrl.searchParams;
        const emailsParam = searchParams.get("emails");

        if (!emailsParam) {
             return NextResponse.json({ data: [] });
        }

        const emails = emailsParam.split(",").map(e => e.trim()).filter(Boolean);
        
        const token = await getValidAccessToken();

        if (!token) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const data = await fetchInvitationStatuses(slug, emails, token);

        return NextResponse.json({ data });

    } catch (error: any) {
        console.error("Error fetching invitation statuses:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch invitation statuses" },
            { status: error.status || 500 }
        );
    }
}

