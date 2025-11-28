import { NextRequest, NextResponse } from "next/server";
import { ApiErrorResponse, ApiResponse } from "@/lib/types/api";
import { SigninRequest, SigninResponse } from "@/lib/types/auth";
import { BackendClient } from "@/lib/backend-client";

export async function POST(request: NextRequest) {
  try {
    const body: SigninRequest = await request.json();
    
    // Use the reusable client
    const response = await BackendClient.post<SigninResponse>("/auth/signin", body);

    // response is ApiResponse<SigninResponse>
    // { timestamp, data: { token }, path }

    const nextResponse = NextResponse.json(response, { status: 200 });

    // Set HttpOnly cookie
    nextResponse.cookies.set({
      name: "auth_token",
      value: response.data.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, 
    });

    return nextResponse;
  } catch (error) {
    console.error("Signin error:", error);
    
    // BackendClient throws ApiErrorResponse or constructs one
    const errorResponse = error as ApiErrorResponse;
    
    return NextResponse.json(
      errorResponse,
      { status: errorResponse.status || 500 }
    );
  }
}
