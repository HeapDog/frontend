import { Step } from "@/components/ui/stepper"
import { FileText, AlignLeft, Settings, Database, Code, Flag } from "lucide-react"

export const PROBLEM_STEPS: Step[] = [
  { id: "metadata", title: "Metadata", description: "Basic info like title, slug, and tags.", icon: FileText },
  { id: "statement", title: "Statement", description: "Problem description and examples.", icon: AlignLeft },
  { id: "config", title: "Configuration", description: "Time, memory, and CPU limits.", icon: Settings },
  { id: "test-data", title: "Test Data", description: "Upload inputs and expected outputs.", icon: Database },
  { id: "reference", title: "Solution", description: "Reference solution for verification.", icon: Code },
  { id: "finalize", title: "Finalize", description: "Review settings and publish.", icon: Flag },
]

export type ProblemStepId = (typeof PROBLEM_STEPS)[number]["id"]

export function getStepIndex(stepId: string): number {
  const idx = PROBLEM_STEPS.findIndex((s) => s.id === stepId)
  return idx >= 0 ? idx : 0
}

export function getStepByIndex(index: number): Step | undefined {
  return PROBLEM_STEPS[index]
}

export function getStepById(stepId: string): Step | undefined {
  return PROBLEM_STEPS.find((s) => s.id === stepId)
}

export function isValidStepId(stepId: string): stepId is ProblemStepId {
  return PROBLEM_STEPS.some((s) => s.id === stepId)
}
