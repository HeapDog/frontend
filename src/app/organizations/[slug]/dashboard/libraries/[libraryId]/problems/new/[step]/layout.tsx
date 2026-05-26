import { redirect } from "next/navigation"
import { getOrganizationProblemLibraries } from "@/lib/problems"
import { ProblemFormProvider } from "../../_form/problem-form-provider"
import { ProblemFormLayout } from "../../_form/problem-form-layout"
import { isValidStepId } from "../../_form/constants"

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string; libraryId: string; step: string }>
}

export default async function NewProblemStepLayout({ children, params }: LayoutProps) {
  const { slug, libraryId, step } = await params

  if (!isValidStepId(step)) {
    redirect(`/organizations/${slug}/dashboard/libraries/${libraryId}/problems/new/metadata`)
  }

  const { data: libraries } = await getOrganizationProblemLibraries(slug)
  const librariesList = libraries ?? []

  if (librariesList.length === 0) {
    redirect(`/organizations/${slug}/dashboard/libraries/select/problems`)
  }

  const libraryExists = librariesList.some((lib) => lib.id === libraryId)
  if (!libraryExists) {
    redirect(`/organizations/${slug}/dashboard/libraries/${libraryId}/problems`)
  }

  return (
    <ProblemFormProvider mode="create">
      <ProblemFormLayout
        mode="create"
        slug={slug}
        libraryId={libraryId}
        stepSlug={step}
      >
        {children}
      </ProblemFormLayout>
    </ProblemFormProvider>
  )
}
