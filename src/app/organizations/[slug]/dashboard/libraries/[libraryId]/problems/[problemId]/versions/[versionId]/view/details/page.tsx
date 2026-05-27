import { VersionDetailsContent } from "../../version-details-content"
import { getProblemVersion } from "@/lib/problems"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ slug: string; libraryId: string; problemId: string; versionId: string }>
}

export default async function VersionDetailsPage({ params }: PageProps) {
  const { slug, libraryId, problemId, versionId } = await params

  const versionResult = await getProblemVersion(slug, libraryId, problemId, versionId)

  if (!versionResult.data) {
    notFound()
  }

  const basePath = `/organizations/${slug}/dashboard/libraries/${libraryId}/problems`

  return (
    <VersionDetailsContent
      data={versionResult.data}
      basePath={basePath}
      problemId={problemId}
      versionId={versionId}
    />
  )
}
