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
        
        // Backend expects just slug query param
        const response = await BackendClient.fetch<any>(`/organizations/check-slug?slug=${slug}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        // Response is { data: { isAvailable: boolean }, ... }
        return NextResponse.json(response);
    } catch (error: any) {
        console.error("Check slug error:", error);
        const status = error.status || 500;
        return NextResponse.json(error, { status });
    }
}

