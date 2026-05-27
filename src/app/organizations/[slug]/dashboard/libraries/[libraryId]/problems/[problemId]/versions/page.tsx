import { requireAuth } from "@/lib/auth"
import { getUserOrganizations } from "@/lib/organizations"
import {
  getOrganizationProblemLibraries,
  getProblemVersions,
} from "@/lib/problems"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VersionsTableView } from "./versions-view"
import { parseSortParam } from "@/lib/table-sort"
import { PROBLEM_VERSION_SORT_FIELDS } from "@/lib/table-sort"
import type { PaginationMeta } from "@/lib/types/api"

interface PageProps {
  params: Promise<{ slug: string; libraryId: string; problemId: string }>
  searchParams: Promise<{ page?: string; size?: string; sort?: string }>
}

const ALLOWED_SORT_FIELDS = new Set(PROBLEM_VERSION_SORT_FIELDS.map((f) => f.value))

export default async function ProblemVersionsPage({ params, searchParams }: PageProps) {
  await requireAuth()
  const { slug, libraryId, problemId } = await params
  const sp = await searchParams

  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1)
  const size = Math.min(100, Math.max(1, parseInt(sp.size ?? "20", 10) || 20))
  const sortParsed = parseSortParam(sp.sort ?? null, ALLOWED_SORT_FIELDS)
  const sort = sortParsed
    ? `${sortParsed.field},${sortParsed.order}`
    : "createdAt,desc"

  const [organizations, { data: libraries }, versionsResult] = await Promise.all([
    getUserOrganizations(),
    getOrganizationProblemLibraries(slug),
    getProblemVersions(slug, libraryId, problemId, { page, size, sort }),
  ])

  const currentOrg = organizations?.find((o) => o.slug === slug)
  if (!currentOrg) {
    redirect("/organizations")
  }

  const librariesList = libraries ?? []
  if (librariesList.length === 0) {
    redirect(`/organizations/${slug}/dashboard/libraries/select/problems`)
  }

  const libraryExists = librariesList.some((lib) => lib.id === libraryId)
  if (!libraryExists) {
    notFound()
  }

  const versions = versionsResult.data ?? []
  if (versionsResult.data === null && versionsResult.error) {
    notFound()
  }

  const meta: PaginationMeta =
    versionsResult.data != null && versionsResult.meta != null
      ? versionsResult.meta
      : {
          page: 1,
          size,
          totalPages: Math.max(1, Math.ceil((versions.length || 0) / size)),
          totalElements: versions.length,
          numberOfElements: versions.length,
          first: true,
          last: true,
        }

  const basePath = `/organizations/${slug}/dashboard/libraries/${libraryId}/problems`

  return (
    <div className="min-w-0 flex flex-col gap-4 h-[calc(100vh-11rem)]">
      <div className="shrink-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" asChild className="px-0 text-muted-foreground hover:text-foreground">
            <Link href={`${basePath}`}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Problems
            </Link>
          </Button>
          <h1 className="text-xl font-semibold tracking-tight">Problem Versions</h1>
          <p className="text-sm text-muted-foreground">
            All versions of this problem. Click a version to edit or view details.
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
      <VersionsTableView
        versions={versions}
        basePath={basePath}
        problemId={problemId}
        meta={meta}
        searchParams={{ page: String(page), size: String(size), sort }}
        paginationBasePath={`${basePath}/${problemId}/versions`}
      />
      </div>
    </div>
  )
}
