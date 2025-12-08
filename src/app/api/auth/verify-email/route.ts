import { NextRequest, NextResponse } from "next/server";
import { ApiErrorResponse } from "@/lib/types/api";
import { VerifyEmailRequest, VerifyEmailResponse } from "@/lib/types/auth";
import { BackendClient } from "@/lib/backend-client";

export async function POST(request: NextRequest) {
  try {
    const body: VerifyEmailRequest = await request.json();
    
    // Proxies to Spring Boot POST /users/verify-email
    const response = await BackendClient.post<VerifyEmailResponse>("/users/verify-email", body);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Verify email error:", error);
    
    const errorResponse = error as ApiErrorResponse;
    
    return NextResponse.json(
      errorResponse,
      { status: errorResponse.status || 500 }
    );
  }
}

