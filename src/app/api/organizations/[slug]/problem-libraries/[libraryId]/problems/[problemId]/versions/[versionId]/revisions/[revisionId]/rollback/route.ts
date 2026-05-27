import { NextRequest, NextResponse } from "next/server"
import { getValidAccessToken } from "@/lib/token-utils"
import { BackendClient } from "@/lib/backend-client"

export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ slug: string; libraryId: string; problemId: string; versionId: string; revisionId: string }> }
) {
    try {
        const { slug, libraryId, problemId, versionId, revisionId } = await params
        const token = await getValidAccessToken()

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const endpoint = `/problem-libraries/${libraryId}/problems/${problemId}/versions/${versionId}/revisions/${revisionId}/rollback`
        const response = await BackendClient.post<unknown>(endpoint, undefined, {
            headers: { Authorization: `Bearer ${token}` },
        })

        return NextResponse.json(response)
    } catch (error: unknown) {
        console.error("Rollback revision error:", error)
        const status = (error as { status?: number } | null)?.status || 500
        return NextResponse.json(error, { status })
    }
}
