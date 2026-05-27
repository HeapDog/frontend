import { requireAuth } from "@/lib/auth"
import { getUserOrganizations } from "@/lib/organizations"
import {
  getOrganizationProblemLibraries,
  getProblemVersion,
} from "@/lib/problems"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ServerTabbedLayout } from "@/components/server-tabbed-layout"

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string; libraryId: string; problemId: string; versionId: string }>
}

export default async function VersionViewLayout({ children, params }: LayoutProps) {
  await requireAuth()
  const { slug, libraryId, problemId, versionId } = await params

  const [organizations, { data: libraries }, versionResult] = await Promise.all([
    getUserOrganizations(),
    getOrganizationProblemLibraries(slug),
    getProblemVersion(slug, libraryId, problemId, versionId),
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

  if (!versionResult.data) {
    notFound()
  }

  const basePath = `/organizations/${slug}/dashboard/libraries/${libraryId}/problems`
  const detailsHref = `${basePath}/${problemId}/versions/${versionId}/view/details`
  const revisionsHref = `${basePath}/${problemId}/versions/${versionId}/view/revisions`

  const tabs = [
    {
      id: "details",
      label: "Details",
      href: detailsHref,
      icon: "file-text" as const,
    },
    {
      id: "revisions",
      label: "Revision History",
      href: revisionsHref,
      icon: "history" as const,
    },
  ]

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" asChild className="px-0 text-muted-foreground hover:text-foreground">
            <Link href={`${basePath}/${problemId}/versions`}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Versions
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            v{versionResult.data.version.number} — {versionResult.data.version.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            View version details and revision history.
          </p>
        </div>
      </div>

      <ServerTabbedLayout tabs={tabs} />
      <div className="mt-4">
        {children}
      </div>
    </div>
  )
}
