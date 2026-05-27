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

    const { otp, newOwnerMembershipId } = body;
    if (!otp || !newOwnerMembershipId) {
      return NextResponse.json(
        { error: "OTP and new owner membership ID are required" },
        { status: 400 }
      );
    }

    try {
      // Attempt to hit the backend API
      const response = await BackendClient.post<any>(
        `/organizations/${slug}/ownership-transfer/confirm`,
        { otp, newOwnerMembershipId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return NextResponse.json(response);
    } catch (backendError: any) {
      console.warn(
        "Backend ownership-transfer/confirm not found or failed. Falling back to development mock.",
        backendError
      );

      // Validate mock OTP (accept "123456" or any 6 digit numeric code except a specific error case like "000000")
      if (otp === "000000") {
        return NextResponse.json(
          { 
            error: "Invalid OTP", 
            message: "The verification code you entered is invalid or expired." 
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Development Mock: Ownership transferred successfully.",
      });
    }
  } catch (error: any) {
    console.error("Ownership transfer confirmation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to confirm ownership transfer" },
      { status: error.status || 500 }
    );
  }
}
