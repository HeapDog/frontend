import { NextRequest, NextResponse } from "next/server";
import { ApiErrorResponse } from "@/lib/types/api";
import { SignupRequest, SignupResponse } from "@/lib/types/auth";
import { BackendClient } from "@/lib/backend-client";

export async function POST(request: NextRequest) {
  try {
    const body: SignupRequest = await request.json();
    
    // Proxies to Spring Boot POST /users/signup
    const response = await BackendClient.post<SignupResponse>("/users/signup", body);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Signup error:", error);
    
    const errorResponse = error as ApiErrorResponse;
    
    return NextResponse.json(
      errorResponse,
      { status: errorResponse.status || 500 }
    );
  }
}

