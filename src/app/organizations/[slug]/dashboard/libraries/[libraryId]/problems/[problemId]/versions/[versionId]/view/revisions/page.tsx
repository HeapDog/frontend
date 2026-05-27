import { getProblemVersionRevisions } from "@/lib/problems"
import { notFound } from "next/navigation"
import { RevisionsTimelineView } from "./revisions-timeline-view"

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string; libraryId: string; problemId: string; versionId: string }>
  searchParams: Promise<{ page?: string; size?: string }>
}

export default async function RevisionsPage({ params, searchParams }: PageProps) {
  const { slug, libraryId, problemId, versionId } = await params
  const sp = await searchParams

  const currentPage = Math.max(1, parseInt(sp.page ?? "1", 10) || 1)
  const size = Math.min(100, Math.max(1, parseInt(sp.size ?? "20", 10) || 20))

  // Fetch all pages from 1 to currentPage to accumulate revisions in timeline
  type RevisionsResult = Extract<Awaited<ReturnType<typeof getProblemVersionRevisions>>, { data: any[] }>
  const allRevisions: RevisionsResult["data"] = []
  let finalMeta: RevisionsResult["meta"] = undefined

  for (let page = 1; page <= currentPage; page++) {
    const result = await getProblemVersionRevisions(slug, libraryId, problemId, versionId, { page, size })

    console.log(`[RevisionsPage] Page ${page} result:`, {
      hasData: result.data !== null,
      dataIsArray: Array.isArray(result.data),
      dataLength: Array.isArray(result.data) ? result.data.length : 0,
      hasMeta: "meta" in result && !!result.meta,
      metaLast: "meta" in result ? result.meta?.last : undefined,
      error: "error" in result ? result.error : null,
    });

    if (result.data === null) {
      console.error(`[RevisionsPage] Failed to fetch revisions for page ${page}:`, "error" in result ? result.error : "Unknown error");
      if (page === 1) {
        // Only notFound if first page fails
        notFound()
      }
      break
    }

    // result.data is an array
    if (Array.isArray(result.data)) {
      allRevisions.push(...result.data)
    }

    if (page === currentPage) {
      finalMeta = result.meta
    }

    // If this was the last page, stop fetching
    if (result.meta?.last) {
      break
    }
  }

  console.log(`[RevisionsPage] Final accumulated revisions:`, {
    totalRevisions: allRevisions.length,
    currentPage,
    finalMeta,
  });

  const basePath = `/organizations/${slug}/dashboard/libraries/${libraryId}/problems`
  const paginationBasePath = `${basePath}/${problemId}/versions/${versionId}/view/revisions`

  return (
    <RevisionsTimelineView
      revisions={allRevisions}
      currentPage={currentPage}
      pageSize={size}
      paginationBasePath={paginationBasePath}
      meta={finalMeta}
    />
  )
}
