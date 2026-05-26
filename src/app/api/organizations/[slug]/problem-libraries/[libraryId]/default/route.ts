import { NextRequest, NextResponse } from "next/server"
import { getValidAccessToken } from "@/lib/token-utils"
import { setDefaultProblemLibrary } from "@/lib/problems"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; libraryId: string }> }
) {
  try {
    const { slug, libraryId } = await params
    const token = await getValidAccessToken()

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const response = await setDefaultProblemLibrary(slug, libraryId, token)

    return NextResponse.json(response)
  } catch (error: unknown) {
    console.error("Set default problem library error:", error)
    const status = (error as { status?: number } | null)?.status || 500
    const errorData = (error as { data?: any })?.data || { message: "Internal Server Error" }
    return NextResponse.json(errorData, { status })
  }
}
