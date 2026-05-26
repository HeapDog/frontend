"use client"

import { useRouter } from "next/navigation"
import { useFormContext, useWatch } from "react-hook-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTopLoader } from "nextjs-toploader"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, ChevronLeft, Save, X, ListChecks, Loader2, HelpCircle, Check, Cloud, CloudOff } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { VerticalStepSidebar } from "./vertical-step-sidebar"
import { PROBLEM_STEPS, getStepIndex, getStepByIndex } from "./constants"
import type { ProblemFormMode } from "./types"
import type { MetadataFormValues } from "./types"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import { useEffect, useRef, useState, useMemo } from "react"

const problemsBasePath = (slug: string, libraryId: string) =>
  `/organizations/${slug}/dashboard/libraries/${libraryId}/problems`

export interface ProblemFormLayoutProps {
  children: React.ReactNode
  mode: ProblemFormMode
  slug: string
  libraryId: string
  stepSlug: string
  problemId?: string
  versionId?: string
  versionNumber?: number
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    if (!keysB.includes(key) || !deepEqual(a[key], b[key])) return false
  }
  return true
}

export function ProblemFormLayout({
  children,
  mode,
  slug,
  libraryId,
  stepSlug,
  problemId,
  versionId,
  versionNumber,
}: ProblemFormLayoutProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const topLoader = useTopLoader()
  const methods = useFormContext<MetadataFormValues>()
  const { isDirty, isValid, defaultValues } = methods.formState
  
  // Track current values for auto-save
  const currentValues = useWatch({ control: methods.control })
  const debouncedValues = useDebounce(currentValues, 2000) // Auto-save after 2s
  
  // Store the last successfully saved state to determine "unsaved changes"
  // Initialize with defaultValues on mount
  const [lastSavedValues, setLastSavedValues] = useState<Partial<MetadataFormValues>>((defaultValues as unknown as Partial<MetadataFormValues>) || {})
  
  // Update lastSavedValues when defaultValues changes (initial load)
  useEffect(() => {
    if (defaultValues) {
      setLastSavedValues(defaultValues as unknown as Partial<MetadataFormValues>)
    }
  }, [defaultValues])

  const createProblemMutation = useMutation({
    mutationFn: async (values: { slug: string; title: string; difficulty: string; tags: string[]; languages: string[] }) => {
      const res = await fetch(
        `/api/organizations/${encodeURIComponent(slug)}/problem-libraries/${encodeURIComponent(libraryId)}/problems`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      )
      const json = await res.json()
      if (!res.ok) {
        const msg = (json as { message?: string }).message || "Failed to create problem"
        throw new Error(msg)
      }
      const data = (json as { data?: { problem: { id: string }; version: { id: string } } }).data
      if (!data?.problem?.id || !data?.version?.id) {
        throw new Error("Unexpected response from server")
      }
      return data
    },
    onSuccess: (data) => {
      toast.success("Metadata created")
      queryClient.invalidateQueries({ queryKey: ["library-problems", slug, libraryId] })
      topLoader.start()
      router.push(`${problemsBasePath(slug, libraryId)}/${data.problem.id}/versions/${data.version.id}/edit/statement`)
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create problem")
    },
  })

  const updateMetadataMutation = useMutation({
    mutationFn: async (values: Partial<MetadataFormValues>) => {
      if (!problemId || !versionId) throw new Error("Missing problem or version")
      const res = await fetch(
        `/api/organizations/${encodeURIComponent(slug)}/problem-libraries/${encodeURIComponent(libraryId)}/problems/${encodeURIComponent(problemId)}/versions/${encodeURIComponent(versionId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      )
      const json = await res.json()
      if (!res.ok) {
        const msg = (json as { message?: string }).message || "Failed to update problem"
        throw new Error(msg)
      }
      return json
    },
    onSuccess: (_, variables) => {
      // Update our local "saved" state to match what we just saved
      setLastSavedValues(prev => ({ ...prev, ...variables }))
      queryClient.invalidateQueries({ queryKey: ["library-problems", slug, libraryId] })
    },
    onError: (err) => {
      console.error("Auto-save failed", err)
      // Don't show toast for auto-save errors to avoid spamming, just log
    },
  })

  const saveStatementMutation = useMutation({
    mutationFn: async (statement: string) => {
      if (!problemId || !versionId) throw new Error("Missing problem or version")
      const res = await fetch(
        `/api/organizations/${encodeURIComponent(slug)}/problem-libraries/${encodeURIComponent(libraryId)}/problems/${encodeURIComponent(problemId)}/versions/${encodeURIComponent(versionId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statement }),
        }
      )
      const json = await res.json()
      if (!res.ok) {
        const msg = (json as { message?: string }).message || "Failed to save statement"
        throw new Error(msg)
      }
      return json
    },
    onSuccess: (_, variables) => {
      setLastSavedValues(prev => ({ ...prev, statement: variables }))
      queryClient.invalidateQueries({ queryKey: ["library-problems", slug, libraryId] })
    },
    onError: (err) => {
      console.error("Statement auto-save failed", err)
    },
  })

  const isCreating = createProblemMutation.isPending
  const isUpdating = updateMetadataMutation.isPending
  const isSavingStatement = saveStatementMutation.isPending
  const isSaving = isUpdating || isSavingStatement

  const currentStepIndex = getStepIndex(stepSlug)
  const currentStep = getStepByIndex(currentStepIndex)
  const statusLabel = isValid ? "Ready" : "Draft"

  const basePath = problemsBasePath(slug, libraryId)
  const newPath = `${basePath}/new`
  const editBasePath =
    problemId && versionId
      ? `${basePath}/${problemId}/versions/${versionId}/edit`
      : ""

  const getStepPath = (stepIndex: number) => {
    const step = getStepByIndex(stepIndex)
    if (!step) return basePath
    if (mode === "create") return `${newPath}/${step.id}`
    return `${editBasePath}/${step.id}`
  }

  const handleStepChange = (stepIndex: number) => {
    topLoader.start()
    router.push(getStepPath(stepIndex))
  }

  // --- Auto-save Logic ---
  const autoSaveRef = useRef(false) // Prevent initial run

  // Helper to determine what needs saving
  const getChanges = (current: any, saved: any, keys: string[]) => {
    const changes: Record<string, any> = {}
    let hasChanges = false
    for (const key of keys) {
      if (!deepEqual(current[key], saved[key])) {
        changes[key] = current[key]
        hasChanges = true
      }
    }
    return hasChanges ? changes : null
  }

  const hasUnsavedChanges = useMemo(() => {
    if (!currentValues || !lastSavedValues) return false
    
    // Check fields relevant to current step or all fields?
    // Let's check based on what step we are in, similar to how we'd save manually.
    if (currentStepIndex === 0) { // Metadata
      const fields = ["title", "slug", "difficulty", "tags", "languages"]
      return !!getChanges(currentValues, lastSavedValues, fields)
    } else if (currentStepIndex === 1) { // Statement
      return currentValues.statement !== lastSavedValues.statement
    }
    return false
  }, [currentValues, lastSavedValues, currentStepIndex])

  useEffect(() => {
    if (mode !== "edit" || !problemId || !versionId) return
    if (!autoSaveRef.current) {
      autoSaveRef.current = true
      return
    }

    // Attempt auto-save
    const save = async () => {
      if (currentStepIndex === 0) { // Metadata
        const changes = getChanges(debouncedValues, lastSavedValues, ["title", "slug", "difficulty", "tags", "languages"])
        if (changes) {
          updateMetadataMutation.mutate(changes)
        }
      } else if (currentStepIndex === 1) { // Statement
        if (debouncedValues.statement !== lastSavedValues.statement) {
          saveStatementMutation.mutate(debouncedValues.statement || "")
        }
      }
    }
    
    save()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValues, mode, problemId, versionId, currentStepIndex]) // removed lastSavedValues to prevent loops, but we need to compare against it inside.
  // Actually, we should compare debouncedValues against lastSavedValues. 
  // If we update lastSavedValues on success, and debouncedValues hasn't changed, equality check passes and we don't save again.

  const handleNext = async () => {
    if (currentStepIndex === 0) {
      const valid = await methods.trigger()
      if (!valid) return

      if (mode === "create") {
        const values = methods.getValues()
        createProblemMutation.mutate({
          slug: values.slug,
          title: values.title,
          difficulty: values.difficulty,
          tags: values.tags,
          languages: values.languages,
        })
        return
      } 
      // In edit mode, auto-save handles it, or manual save. 
      // If user clicks next, we can trigger an immediate save if unsaved changes exist.
      else if (mode === "edit" && problemId && versionId) {
        const values = methods.getValues()
        const changes = getChanges(values, lastSavedValues, ["title", "slug", "difficulty", "tags", "languages"])
        if (changes) {
           try {
             await updateMetadataMutation.mutateAsync(changes)
           } catch { return }
        }
      }
    }
    if (currentStepIndex === 1 && mode === "edit" && problemId && versionId) {
      const statement = methods.getValues("statement") ?? ""
      if (statement !== lastSavedValues.statement) {
        try {
          await saveStatementMutation.mutateAsync(statement)
        } catch { return }
      }
    }
    if (currentStepIndex < PROBLEM_STEPS.length - 1) {
      handleStepChange(currentStepIndex + 1)
    }
  }

  const handleBack = () => {
    if (currentStepIndex > 0) {
      handleStepChange(currentStepIndex - 1)
    }
  }

  // Manual save handler
  const handleManualSave = async () => {
    if (currentStepIndex === 1 && mode === "edit" && problemId && versionId) {
      const statement = methods.getValues("statement") ?? ""
      try {
        await saveStatementMutation.mutateAsync(statement)
        toast.success("Saved")
      } catch {
        /* error handled in mutation */
      }
    } else if (currentStepIndex === 0 && mode === "edit" && problemId && versionId) {
       const values = methods.getValues()
       const changes = getChanges(values, lastSavedValues, ["title", "slug", "difficulty", "tags", "languages"])
       if (changes) {
          try {
            await updateMetadataMutation.mutateAsync(changes)
            toast.success("Saved")
          } catch {
            // error handled in mutation
          }
       } else {
         toast.info("No changes to save")
       }
    } else {
      // Fallback for non-API steps or create mode (though create button is separate)
      toast.success("Draft saved locally")
    }
  }

  const pageTitle =
    mode === "create"
      ? "New problem"
      : versionNumber != null
        ? `Edit (v${versionNumber})`
        : "Edit problem"

  const isBusy = isCreating || isUpdating || isSavingStatement

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden bg-background">
      {/* Top action bar - always visible */}
      <header className="sticky top-0 z-20 shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-12 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="shrink-0 px-2 text-muted-foreground hover:text-foreground">
              <Link href={basePath}>
                <ChevronLeft className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">Problems</span>
              </Link>
            </Button>
            <span className="text-muted-foreground/60 hidden sm:inline">/</span>
            <span className="truncate text-sm font-medium">{pageTitle}</span>
            {mode === "edit" && versionNumber != null && (
              <Badge variant="secondary" className="shrink-0 font-mono text-[10px]">
                v{versionNumber}
              </Badge>
            )}
            <Badge
              variant={isValid ? "default" : "outline"}
              className={cn(
                "shrink-0 font-mono text-[10px] transition-colors",
                isValid && "bg-emerald-600 hover:bg-emerald-600"
              )}
            >
              {statusLabel}
            </Badge>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {mode === "edit" && (
              <div className="flex items-center mr-2 text-xs text-muted-foreground animate-in fade-in duration-300">
                {isSaving ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : hasUnsavedChanges ? (
                  <>
                    <div className="h-2 w-2 rounded-full bg-amber-500 mr-2" />
                    <span className="text-amber-600 dark:text-amber-500">Unsaved changes</span>
                  </>
                ) : (
                  <>
                    <Cloud className="h-3.5 w-3.5 mr-1.5 text-muted-foreground/70" />
                    <span>Saved</span>
                  </>
                )}
              </div>
            )}

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <HelpCircle className="h-4 w-4" />
                  <span className="sr-only">Setter checklist</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-3">
                <div className="flex items-center gap-2 font-medium text-sm mb-2">
                  <ListChecks className="h-4 w-4 text-primary" />
                  Setter Checklist
                </div>
                <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                  <li>Constrain for intended solution.</li>
                  <li>Samples must cover tricky cases.</li>
                  <li>Validate input format strictly.</li>
                </ul>
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <Link href={basePath}>
                <X className="h-4 w-4" />
                <span className="sr-only">Cancel</span>
              </Link>
            </Button>
            <div className="h-5 w-px bg-border" />
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStepIndex === 0 || isBusy}
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {mode === "edit" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSave}
                disabled={isBusy || !hasUnsavedChanges}
                className={cn(
                  "h-8 transition-all",
                  hasUnsavedChanges && "border-primary/50 text-primary hover:bg-primary/5"
                )}
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Save
              </Button>
            )}

            <Button
              size="sm"
              onClick={handleNext}
              disabled={isBusy}
              className="h-8 min-w-[72px]"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {currentStepIndex === PROBLEM_STEPS.length - 1
                    ? mode === "create"
                      ? "Create"
                      : "Finish"
                    : "Next"}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>

      </header>

      {/* Sidebar + content: vertical steps on left, content fills the rest */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <VerticalStepSidebar
          steps={PROBLEM_STEPS}
          currentStep={currentStepIndex}
          onStepClick={handleStepChange}
          allowAllStepsClickable={mode === "edit"}
        />
        <main
          className={cn(
            "flex-1 min-w-0 min-h-0 flex flex-col",
            currentStepIndex === 1 ? "overflow-hidden" : "overflow-y-auto"
          )}
        >
          {currentStepIndex === 1 ? (
            /* Statement step: editor scrolls inside its container */
            <form onSubmit={(e) => e.preventDefault()} className="flex-1 min-h-0 flex flex-col">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStepIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex-1 min-h-0 flex flex-col"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </form>
          ) : (
            /* Form steps: contained with boundary */
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 w-full">
              <div className="mb-6">
                <h1 className="text-[15px] font-medium tracking-tight text-foreground">
                  {currentStep?.title ?? "Step"}
                </h1>
                <p className="text-[13px] text-muted-foreground mt-1">
                  {currentStep?.description}
                </p>
              </div>

              <div className="rounded-lg border border-border/60 bg-background p-6 sm:p-8">
                <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStepIndex}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      {children}
                    </motion.div>
                  </AnimatePresence>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
