import { redirect } from "next/navigation"

interface PageProps {
  params: Promise<{ slug: string; libraryId: string; problemId: string; versionId: string }>
}

export default async function VersionPage({ params }: PageProps) {
  const { slug, libraryId, problemId, versionId } = await params
  const basePath = `/organizations/${slug}/dashboard/libraries/${libraryId}/problems`
  redirect(`${basePath}/${problemId}/versions/${versionId}/view/details`)
}
