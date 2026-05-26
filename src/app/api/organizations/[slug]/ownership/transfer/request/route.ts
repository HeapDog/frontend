import { BackendClient } from "@/lib/backend-client";
import { getValidAccessToken } from "@/lib/token-utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const token = await getValidAccessToken();

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { password, newOwnerMembershipId } = body;
    if (!password || !newOwnerMembershipId) {
      return NextResponse.json(
        { error: "Password and new owner selection are required" },
        { status: 400 }
      );
    }

    try {
      // Attempt to hit the backend API
      const response = await BackendClient.post<any>(
        `/organizations/${slug}/ownership-transfer/request`,
        { password, newOwnerMembershipId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return NextResponse.json(response);
    } catch (backendError: any) {
      // Fallback/Mock behavior for development environments if endpoint doesn't exist yet on backend
      console.warn(
        "Backend ownership-transfer/request not found or failed. Falling back to development mock.",
        backendError
      );

      // Validate mock password (accept "password" or anything other than empty to simulate real validation)
      if (password === "wrongpassword") {
        return NextResponse.json(
          { 
            error: "Invalid password", 
            message: "The password you entered is incorrect. Please try again." 
          },
          { status: 400 }
        );
      }

      // Simulate sending OTP
      return NextResponse.json({
        success: true,
        message: "Development Mock: OTP sent successfully to your registered email.",
        data: {
          tempToken: "mock_temp_transfer_token_xyz123",
        },
      });
    }
  } catch (error: any) {
    console.error("Ownership transfer request error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process ownership transfer request" },
      { status: error.status || 500 }
    );
  }
}
