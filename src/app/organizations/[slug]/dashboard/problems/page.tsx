import { redirect } from "next/navigation"
import { getOrganizationBasicInfoServer } from "@/lib/organizations"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ProblemsPage({ params }: PageProps) {
  const { slug } = await params
  const basicInfo = await getOrganizationBasicInfoServer(slug)

  if (basicInfo?.defaultProblemLibraryId) {
    redirect(
      `/organizations/${slug}/dashboard/libraries/${basicInfo.defaultProblemLibraryId}/problems`
    )
  }

  redirect(`/organizations/${slug}/dashboard/libraries/select/problems`)
}


