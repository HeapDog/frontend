import { NextRequest, NextResponse } from "next/server"
import { BackendClient } from "@/lib/backend-client"
import { getValidAccessToken } from "@/lib/token-utils"
import { ProblemWithLatestVersion } from "@/lib/types/problem"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; libraryId: string }> }
) {
  try {
    const { slug, libraryId } = await params
    const token = await getValidAccessToken()

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { slug: problemSlug, title, difficulty, tags, languages } = body

    if (!problemSlug || !title || !Array.isArray(tags) || !Array.isArray(languages)) {
      return NextResponse.json(
        { message: "slug, title, tags, and languages are required" },
        { status: 400 }
      )
    }

    const response = await BackendClient.post<ProblemWithLatestVersion>(
      `/problem-libraries/${libraryId}/problems`,
      { slug: problemSlug, title, tags, languages, ...(difficulty != null && { difficulty }) },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    return NextResponse.json({ data: response.data })
  } catch (error: unknown) {
    console.error("Error creating problem:", error)
    const status = (error as { status?: number } | null)?.status || 500
    return NextResponse.json(error, { status })
  }
}
