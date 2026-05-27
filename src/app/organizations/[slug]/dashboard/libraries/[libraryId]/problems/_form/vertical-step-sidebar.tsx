"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Step } from "@/components/ui/stepper"

interface VerticalStepSidebarProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (stepIndex: number) => void
  allowAllStepsClickable?: boolean
  className?: string
}

/**
 * Vertical step sidebar for problem form. Notion-inspired: minimal, refined, restrained.
 * Steps are connected by a subtle vertical line. Clean typography and subtle states.
 */
export function VerticalStepSidebar({
  steps,
  currentStep,
  onStepClick,
  allowAllStepsClickable = false,
  className,
}: VerticalStepSidebarProps) {
  return (
    <nav
      aria-label="Progress"
      className={cn(
        "flex w-56 shrink-0 flex-col self-stretch overflow-y-auto py-8 pl-6 pr-4 relative",
        className
      )}
    >
      {/* Full-height divider - extends edge to edge */}
      <div
        aria-hidden
        className="absolute right-0 top-0 bottom-0 w-px bg-border/80 pointer-events-none"
      />
      <ol role="list" className="space-y-0">
        {steps.map((step, index) => {
          const isActive = index === currentStep
          const isCompleted = index < currentStep
          const isLast = index === steps.length - 1
          const isClickable =
            onStepClick && (allowAllStepsClickable || isCompleted || isActive)

          return (
            <li key={step.id} className="relative">
              {/* Vertical connecting line - thin, subtle */}
              {!isLast && (
                <div
                  className={cn(
                    "absolute left-[29px] top-8 bottom-0 w-px transition-colors duration-200",
                    isCompleted ? "bg-primary/30" : "bg-border/80"
                  )}
                  aria-hidden="true"
                />
              )}

              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick?.(index)}
                className={cn(
                  "group relative flex w-full items-start gap-3 rounded-md py-2.5 pr-2 text-left transition-colors duration-150",
                  "border-l-2 pl-5",
                  isActive && "border-l-primary bg-primary/[0.04]",
                  !isActive && "border-l-transparent",
                  isCompleted && !isActive && "text-foreground/80",
                  !isActive && !isCompleted && "text-muted-foreground",
                  isClickable && "cursor-pointer hover:bg-muted/30",
                  !isClickable && "cursor-default opacity-60"
                )}
              >
                {/* Step indicator - minimal circle */}
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium transition-all duration-200",
                    isActive && "bg-primary text-primary-foreground",
                    isCompleted && !isActive && "bg-foreground/10 text-foreground/70",
                    !isActive && !isCompleted && "border border-border bg-transparent text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
                  ) : step.icon ? (
                    <step.icon className="h-3 w-3" />
                  ) : (
                    index + 1
                  )}
                </span>

                <span className="flex min-w-0 flex-1 flex-col gap-0.5 pt-px">
                  <span
                    className={cn(
                      "text-[13px] leading-snug transition-colors",
                      isActive ? "font-medium text-foreground" : "font-normal"
                    )}
                  >
                    {step.title}
                  </span>
                  {step.description && (
                    <span className="text-[11px] leading-snug text-muted-foreground line-clamp-2">
                      {step.description}
                    </span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
