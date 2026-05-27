import { NextRequest, NextResponse } from "next/server"
import { getValidAccessToken } from "@/lib/token-utils"
import { removeEmptyFields } from "@/lib/utils"
import { createOrganizationProblemLibrary } from "@/lib/problems"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const token = await getValidAccessToken()

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, description } = body as {
      name?: unknown
      description?: unknown
    }

    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    const cleanedBody = removeEmptyFields({
      name: name.trim(),
      description:
        typeof description === "string" ? description : undefined,
    }) as { name: string; description?: string | null }

    const response = await createOrganizationProblemLibrary(
      slug,
      cleanedBody,
      token
    )

    return NextResponse.json(response)
  } catch (error: unknown) {
    console.error("Create problem library error:", error)
    const status = (error as { status?: number } | null)?.status || 500
    return NextResponse.json(error, { status })
  }
}

