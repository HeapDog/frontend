import { redirect, notFound } from "next/navigation"
import { getProblemVersion, getOrganizationProblemLibraries } from "@/lib/problems"
import { ProblemFormProvider } from "../../../../../_form/problem-form-provider"
import { ProblemFormLayout } from "../../../../../_form/problem-form-layout"
import { isValidStepId } from "../../../../../_form/constants"
import type { MetadataFormValues } from "../../../../../_form/types"

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string; libraryId: string; problemId: string; versionId: string; step: string }>
}

function apiDifficultyToForm(difficulty?: string): "EASY" | "MEDIUM" | "HARD" {
  if (!difficulty) return "MEDIUM"
  const upper = difficulty.toUpperCase()
  return upper === "EASY" || upper === "MEDIUM" || upper === "HARD" ? upper : "MEDIUM"
}

function problemVersionToFormValues(data: {
  problem: { slug: string }
  version: { title: string; difficulty?: string; tags: { id: string }[]; languages: { id: string }[]; statement?: string | null }
}): Partial<MetadataFormValues> {
  return {
    title: data.version.title,
    slug: data.problem.slug,
    difficulty: apiDifficultyToForm(data.version.difficulty),
    tags: data.version.tags?.map((t) => t.id) ?? [],
    languages: data.version.languages?.map((l) => l.id) ?? [],
    statement: data.version.statement ?? "",
  }
}

export default async function EditProblemStepLayout({ children, params }: LayoutProps) {
  const { slug, libraryId, problemId, versionId, step } = await params

  if (!isValidStepId(step)) {
    redirect(
      `/organizations/${slug}/dashboard/libraries/${libraryId}/problems/${problemId}/versions/${versionId}/edit/metadata`
    )
  }

  const [problemResult, { data: libraries }] = await Promise.all([
    getProblemVersion(slug, libraryId, problemId, versionId),
    getOrganizationProblemLibraries(slug),
  ])

  if (!problemResult.data || !libraries?.length) {
    notFound()
  }

  const libraryExists = libraries.some((lib) => lib.id === libraryId)
  if (!libraryExists) {
    notFound()
  }

  const defaultValues = problemVersionToFormValues(problemResult.data)
  const versionNumber = problemResult.data.version.number

  return (
    <ProblemFormProvider defaultValues={defaultValues} mode="edit">
      <ProblemFormLayout
        mode="edit"
        slug={slug}
        libraryId={libraryId}
        stepSlug={step}
        problemId={problemId}
        versionId={versionId}
        versionNumber={versionNumber}
      >
        {children}
      </ProblemFormLayout>
    </ProblemFormProvider>
  )
}
