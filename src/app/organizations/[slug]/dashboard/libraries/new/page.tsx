import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth"
import { getUserOrganizations } from "@/lib/organizations"
import { getOrganizationBasicInfoServer } from "@/lib/organizations"
import { CreateLibraryView } from "./create-library-view"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function NewLibraryPage({ params }: PageProps) {
  await requireAuth()
  const { slug } = await params

  const [organizations, basicInfo] = await Promise.all([
    getUserOrganizations(),
    getOrganizationBasicInfoServer(slug),
  ])

  const currentOrg = organizations?.find((o) => o.slug === slug)
  if (!currentOrg) {
    redirect("/organizations")
  }

  if (basicInfo?.defaultProblemLibraryId) {
    redirect(
      `/organizations/${slug}/dashboard/libraries/${basicInfo.defaultProblemLibraryId}/problems`
    )
  }

  return <CreateLibraryView slug={slug} />
}
