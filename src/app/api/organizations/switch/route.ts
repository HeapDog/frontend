import { BackendClient } from "@/lib/backend-client";
import { getValidAccessToken } from "@/lib/token-utils";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const token = await getValidAccessToken();

        if (!token) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const response = await BackendClient.patch<any>("/users/me/default-organization", body, {
            headers: {
                Authorization: `Bearer ${token}`,
            }
        });

        return NextResponse.json(response);
    } catch (error: any) {
        console.error("Switch organization error:", error);

        const status = error.status || 500;
        return NextResponse.json(
            error,
            { status: status }
        );
    }
}

