import { NextRequest, NextResponse } from "next/server";
import { createInvitation } from "@/lib/invitations";
import { getValidAccessToken } from "@/lib/token-utils";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const body = await req.json();
        const { email, message } = body;

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        const token = await getValidAccessToken();

        if (!token) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const invitation = await createInvitation(slug, email, message || null, token);

        return NextResponse.json(invitation);

    } catch (error: any) {
        console.error("Error creating invitation:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create invitation" },
            { status: error.status || 500 }
        );
    }
}

