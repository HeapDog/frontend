import { MetadataStep } from "../../../../../_form/steps/metadata-step"
import { StatementStep } from "../../../../../_form/steps/statement-step"
import { PlaceholderStep } from "../../../../../_form/steps/placeholder-step"
import { getStepByIndex, getStepIndex } from "../../../../../_form/constants"
import { getProblemTags, getProblemLanguages } from "@/lib/problems"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ slug: string; libraryId: string; problemId: string; versionId: string; step: string }>
}

export default async function EditProblemStepPage({ params }: PageProps) {
  const { step } = await params

  const stepIndex = getStepIndex(step)
  const stepDef = getStepByIndex(stepIndex)
  if (!stepDef) notFound()

  switch (stepDef.id) {
    case "metadata": {
      const [tagsRes, languagesRes] = await Promise.all([
        getProblemTags(),
        getProblemLanguages(),
      ])
      return (
        <MetadataStep
          availableTags={tagsRes.data || []}
          availableLanguages={languagesRes.data || []}
          mode="edit"
        />
      )
    }
    case "statement":
      return <StatementStep mode="edit" />
    case "config":
      return (
        <PlaceholderStep
          title="Configuration"
          description="Set CPU and memory limits, time limits, and other execution parameters."
        />
      )
    case "test-data":
      return (
        <PlaceholderStep
          title="Test Data"
          description="Upload or generate test cases for your problem."
        />
      )
    case "reference":
      return (
        <PlaceholderStep
          title="Reference Solution"
          description="Provide a correct solution to verify test cases."
        />
      )
    case "finalize":
      return (
        <PlaceholderStep
          title="Finalization"
          description="Review everything and publish your problem."
        />
      )
    default:
      return null
  }
}
