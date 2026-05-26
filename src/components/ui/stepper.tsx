"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Step {
  id: string
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
}

interface StepperProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (stepIndex: number) => void
  /** When true, all steps are clickable (e.g. for edit mode). When false, only completed/current steps are clickable. */
  allowAllStepsClickable?: boolean
  className?: string
}

export function Stepper({ steps, currentStep, onStepClick, allowAllStepsClickable = false, className }: StepperProps) {
  return (
    <nav aria-label="Progress" className={cn("flex flex-col", className)}>
      <ol role="list" className="space-y-0">
        {steps.map((step, index) => {
          const isActive = index === currentStep
          const isCompleted = index < currentStep
          const isLast = index === steps.length - 1

          return (
            <li key={step.id} className="relative">
              {!isLast && (
                <div
                  className={cn(
                    "absolute left-6 top-6 -bottom-3 w-[2px] transition-colors duration-300",
                    isCompleted ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                  aria-hidden="true"
                />
              )}

              <div
                className={cn(
                  "group relative flex items-start gap-4 p-2 rounded-lg transition-all duration-200",
                  onStepClick && (allowAllStepsClickable || isCompleted || isActive) && "cursor-pointer hover:bg-muted/40",
                  !allowAllStepsClickable && !isActive && !isCompleted && "opacity-70"
                )}
                onClick={() => {
                  if (onStepClick && (allowAllStepsClickable || isCompleted || isActive)) {
                    onStepClick(index)
                  }
                }}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center">
                  <span
                    className={cn(
                      "relative flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors duration-300 z-10 bg-background",
                      isActive && "border-primary text-primary shadow-sm ring-4 ring-primary/10",
                      isCompleted && "border-primary bg-primary text-primary-foreground",
                      !isActive && !isCompleted && "border-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : step.icon ? (
                      <step.icon className="h-4 w-4" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </span>
                </span>
                <span className="flex min-w-0 flex-col pt-1">
                  <span
                    className={cn(
                      "text-sm font-medium leading-none transition-colors",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </span>
                  {step.description && (
                    <span className="text-sm text-muted-foreground mt-1.5 leading-snug">
                      {step.description}
                    </span>
                  )}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
