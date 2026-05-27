import { NextRequest, NextResponse } from "next/server"
import { getValidAccessToken } from "@/lib/token-utils"
import { updateProblemLibrary, deleteProblemLibrary } from "@/lib/problems"

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

    const body = (await req.json()) as {
      name?: unknown
      description?: unknown
    }

    const name = body?.name
    const description = body?.description

    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    if (
      description !== undefined &&
      description !== null &&
      typeof description !== "string"
    ) {
      return NextResponse.json(
        { error: "Description must be a string or null" },
        { status: 400 }
      )
    }

    const response = await updateProblemLibrary(
      slug,
      libraryId,
      {
        name: name.trim(),
        ...(description !== undefined ? { description } : {}),
      },
      token
    )

    return NextResponse.json(response)
  } catch (error: unknown) {
    console.error("Update problem library error:", error)
    const status = (error as { status?: number } | null)?.status || 500
    return NextResponse.json(error, { status })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; libraryId: string }> }
) {
  try {
    const { slug, libraryId } = await params
    const token = await getValidAccessToken()

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const response = await deleteProblemLibrary(slug, libraryId, token)

    return NextResponse.json(response)
  } catch (error: unknown) {
    console.error("Delete problem library error:", error)
    const status = (error as { status?: number } | null)?.status || 500
    return NextResponse.json(error, { status })
  }
}
