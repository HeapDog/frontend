import { requireAuth } from "@/lib/auth"
import { getUserOrganizations, getOrganizationBasicInfoServer } from "@/lib/organizations"
import {
  getOrganizationProblemLibraries,
  getLibraryProblems,
  ProblemRow,
} from "@/lib/problems"
import { redirect, notFound } from "next/navigation"
import { ProblemsView } from "@/app/organizations/[slug]/dashboard/problems/problems-view"
import { parseSortParam } from "@/lib/table-sort"
import { PROBLEM_VERSION_SORT_FIELDS } from "@/lib/table-sort"
import { ErrorView } from "@/components/error-view"
import { ApiErrorResponse } from "@/lib/types/api"

interface PageProps {
  params: Promise<{ slug: string; libraryId: string }>
  searchParams: Promise<{ page?: string; size?: string; sort?: string }>
}

const ALLOWED_SORT_FIELDS = new Set(PROBLEM_VERSION_SORT_FIELDS.map((f) => f.value))

export default async function LibraryProblemsPage({ params, searchParams }: PageProps) {
  await requireAuth()
  const { slug, libraryId } = await params

  if (libraryId === "select") {
    const basicInfo = await getOrganizationBasicInfoServer(slug)
    if (basicInfo?.defaultProblemLibraryId) {
      redirect(
        `/organizations/${slug}/dashboard/libraries/${basicInfo.defaultProblemLibraryId}/problems`
      )
    }
  }
  const sp = await searchParams

  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1)
  const size = Math.min(100, Math.max(1, parseInt(sp.size ?? "20", 10) || 20))
  const sortParsed = parseSortParam(sp.sort ?? null, ALLOWED_SORT_FIELDS)
  const sort = sortParsed
    ? `${sortParsed.field},${sortParsed.order}`
    : "createdAt,desc"

  const isSelect = libraryId === "select"
  const [organizations, librariesResult, problemsResult, basicInfo] = await Promise.all([
    getUserOrganizations(),
    getOrganizationProblemLibraries(slug),
    isSelect
      ? Promise.resolve({ data: [] as ProblemRow[], meta: undefined })
      : getLibraryProblems(slug, libraryId, { page, size, sort }),
    getOrganizationBasicInfoServer(slug),
  ])

  if ("error" in librariesResult && librariesResult.error) {
    return (
      <ErrorView
        error={librariesResult.error as ApiErrorResponse}
        retryLink={`/organizations/${slug}/dashboard/libraries/${libraryId}/problems`}
      />
    )
  }

  const currentOrg = organizations?.find((o) => o.slug === slug)
  if (!currentOrg) {
    redirect("/organizations")
  }

  const libraries = librariesResult.data ?? []
  if (libraries.length === 0 && !isSelect) {
    redirect(`/organizations/${slug}/dashboard/libraries/select/problems`)
  }

  const libraryExists = libraries.some((lib) => lib.id === libraryId)

  // A 403 error in fetching problems signifies access is denied for this specific library
  const isProblems403 =
    "error" in problemsResult &&
    problemsResult.error != null &&
    (problemsResult.error as any).status === 403

  const isDefaultLibraryBlocked =
    (!libraryExists && libraryId === basicInfo?.defaultProblemLibraryId) ||
    (libraryExists && libraryId === basicInfo?.defaultProblemLibraryId && isProblems403) ||
    (isSelect && !basicInfo?.defaultProblemLibraryId)

  if (!libraryExists && !isDefaultLibraryBlocked) {
    notFound()
  }

  // If the problems query returns another kind of error (other than a 403 for default library), show ErrorView
  if ("error" in problemsResult && problemsResult.error && !isDefaultLibraryBlocked) {
    return (
      <ErrorView
        error={problemsResult.error as ApiErrorResponse}
        retryLink={`/organizations/${slug}/dashboard/libraries/${libraryId}/problems`}
      />
    )
  }

  const hasDefaultLibraryAccessDenied = isDefaultLibraryBlocked
  const targetLibraryId = isDefaultLibraryBlocked ? (libraries[0]?.id || "select") : libraryId
  const initialProblems = isDefaultLibraryBlocked ? [] : (problemsResult.data ?? [])

  const meta =
    !isDefaultLibraryBlocked && problemsResult.data != null && problemsResult.meta != null
      ? problemsResult.meta
      : {
          page: 1,
          size,
          totalPages: 1,
          totalElements: initialProblems.length,
          numberOfElements: initialProblems.length,
          first: true,
          last: true,
        }

  return (
    <ProblemsView
      slug={slug}
      libraries={libraries}
      initialLibraryId={targetLibraryId}
      initialProblems={initialProblems}
      meta={meta}
      searchParams={{ page: String(page), size: String(size), sort }}
      defaultLibraryId={basicInfo?.defaultProblemLibraryId || undefined}
      hasDefaultLibraryAccessDenied={hasDefaultLibraryAccessDenied}
      isNoDefaultLibrary={!basicInfo?.defaultProblemLibraryId}
    />
  )
}
