import { NextRequest, NextResponse } from "next/server"
import { BackendClient } from "@/lib/backend-client"
import { getValidAccessToken } from "@/lib/token-utils"
import { ProblemVersion } from "@/lib/types/problem"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; libraryId: string; problemId: string; versionId: string }> }
) {
  try {
    const { slug, libraryId, problemId, versionId } = await params
    const token = await getValidAccessToken()

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    // Forward the entire body as is
    const response = await BackendClient.patch<ProblemVersion>(
      `/problem-libraries/${libraryId}/problems/${problemId}/versions/${versionId}`,
      body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    return NextResponse.json({ data: response.data })
  } catch (error: unknown) {
    console.error("Error updating problem version:", error)
    const status = (error as { status?: number } | null)?.status || 500
    // Try to return the error body from backend if available
    const errorData = (error as { data?: any })?.data || { message: "Internal Server Error" }
    return NextResponse.json(errorData, { status })
  }
}
