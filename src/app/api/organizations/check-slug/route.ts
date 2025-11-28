import { BackendClient } from "@/lib/backend-client";
import { cookies } from "next/headers";
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

        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;

        if (!token) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
        const response = await BackendClient.fetch<any>(`/organizations/check-slug?slug=${slug}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return NextResponse.json(response);
    } catch (error: any) {
        console.error("Check slug error:", error);
        const status = error.status || 500;
        return NextResponse.json(error, { status });
    }
}

