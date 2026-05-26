"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Step } from "@/components/ui/stepper"

interface StepPillsProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (stepIndex: number) => void
  allowAllStepsClickable?: boolean
  className?: string
}

export function StepPills({
  steps,
  currentStep,
  onStepClick,
  allowAllStepsClickable = false,
  className,
}: StepPillsProps) {
  return (
    <nav aria-label="Progress" className={cn("flex items-center flex-1 min-w-0", className)}>
      {steps.map((step, index) => {
        const isActive = index === currentStep
        const isCompleted = index < currentStep
        const isClickable = onStepClick && (allowAllStepsClickable || isCompleted || isActive)
        const isLast = index === steps.length - 1

        return (
          <div key={step.id} className="flex items-center flex-1 min-w-0">
            <button
              type="button"
              onClick={() => isClickable && onStepClick(index)}
              disabled={!isClickable}
              className={cn(
                "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 shrink-0",
                isActive && "bg-primary/10 text-primary ring-1 ring-primary/20 ring-offset-2 ring-offset-background",
                isCompleted && "text-primary hover:bg-primary/5",
                !isActive && !isCompleted && "text-muted-foreground",
                isClickable && "cursor-pointer",
                !isClickable && "cursor-default opacity-60"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-200",
                  isActive && "bg-primary text-primary-foreground shadow-sm",
                  isCompleted && "bg-primary/15 text-primary",
                  !isActive && !isCompleted && "bg-muted/80 text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : index + 1}
              </span>
              <span className="hidden md:inline truncate">{step.title}</span>
            </button>

            {/* Connecting line */}
            {!isLast && (
              <div
                className={cn(
                  "flex-1 min-w-[12px] h-[2px] mx-1 rounded-full transition-colors duration-300",
                  isCompleted ? "bg-primary/60" : "bg-border"
                )}
                aria-hidden="true"
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}
