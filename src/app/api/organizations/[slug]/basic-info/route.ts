import { BackendClient } from "@/lib/backend-client";
import { removeEmptyFields } from "@/lib/utils";
import { getValidAccessToken } from "@/lib/token-utils";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const body = await req.json();
        const token = await getValidAccessToken();

        if (!token) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Remove empty fields while keeping mandatory name/slug
        const { name, slug: bodySlug, ...rest } = body;
        const cleanedBody = removeEmptyFields(rest);
        const payload = {
            name,
            slug: bodySlug,
            ...cleanedBody,
        };

        const response = await BackendClient.put<any>(`/organizations/${slug}/basic-info`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
            }
        });

        return NextResponse.json(response);
    } catch (error: any) {
        console.error("Update organization basic info error:", error);
        const status = error.status || 500;
        return NextResponse.json(error, { status });
    }
}
