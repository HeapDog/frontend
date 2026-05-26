import { redirect } from "next/navigation"
import { getOrganizationBasicInfoServer } from "@/lib/organizations"

interface NewProblemLayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function NewProblemLayout({ children, params }: NewProblemLayoutProps) {
  const { slug } = await params
  const basicInfo = await getOrganizationBasicInfoServer(slug)

  if (basicInfo?.defaultProblemLibraryId) {
    redirect(
      `/organizations/${slug}/dashboard/libraries/${basicInfo.defaultProblemLibraryId}/problems/new/metadata`
    )
  }

  redirect(`/organizations/${slug}/dashboard/libraries/select/problems`)
}


