import { BackendClient } from "@/lib/backend-client";
import { getValidAccessToken } from "@/lib/token-utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const slug = searchParams.get("slug");

        if (!slug) {
            return NextResponse.json(
                { error: "Slug is required" },
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

        // HEAD /api/v1/problems/slug/{slug}
        // Returns 200 if exists (not available)
        // Returns 404 if not exists (available)
        await BackendClient.fetch(`/api/v1/problems/slug/${encodeURIComponent(slug)}`, {
            method: "HEAD",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        // If we get here, it means 200 OK (found), so it's NOT available
        return NextResponse.json({ available: false });

    } catch (error: any) {
        // If 404, it means not found, so it IS available
        if (error.status === 404) {
             return NextResponse.json({ available: true });
        }

        console.error("Check problem slug error:", error);
        const status = error.status || 500;
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status }
        );
    }
}
