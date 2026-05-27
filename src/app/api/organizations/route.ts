import { BackendClient } from "@/lib/backend-client";
import { CreateOrganizationRequest } from "@/lib/types";
import { removeEmptyFields } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { refreshTokens, setAuthCookies, getValidAccessToken } from "@/lib/token-utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = await getValidAccessToken();

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const cleanedBody = removeEmptyFields(body);

    const response = await BackendClient.post<any>(
      "/organizations",
      cleanedBody as CreateOrganizationRequest,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const newTokens = await refreshTokens();
    if (newTokens) {
      await setAuthCookies(newTokens);
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Create organization error:", error);
    
    const status = error.status || 500;
    return NextResponse.json(
      error,
      { status: status }
    );
  }
}
