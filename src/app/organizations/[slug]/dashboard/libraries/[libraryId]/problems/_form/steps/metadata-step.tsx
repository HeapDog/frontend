"use client"

import { useEffect } from "react"
import { useFormContext } from "react-hook-form"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Tag, Language } from "@/lib/types/problem"
import { MultiSelect } from "@/components/ui/multi-select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { MetadataFormValues, DIFFICULTIES } from "../types"
import { ProblemFormMode } from "../types"

/** Only mounts in create mode - avoids form state subscriptions that can cause stack overflow in edit mode */
function SlugAutoGenerator() {
  const { watch, setValue, getValues } = useFormContext<MetadataFormValues>()
  const title = watch("title")

  useEffect(() => {
    if (!title) return
    const generatedSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
    const currentSlug = getValues("slug")
    // Don't override if user manually edited (slug differs from what we'd generate)
    if (currentSlug && currentSlug !== generatedSlug) return
    if (currentSlug === generatedSlug) return // already in sync
    setValue("slug", generatedSlug, { shouldValidate: true })
  }, [title, setValue, getValues])

  return null
}

interface MetadataStepProps {
  availableTags: Tag[]
  availableLanguages: Language[]
  mode: ProblemFormMode
}

export function MetadataStep({ availableTags, availableLanguages, mode }: MetadataStepProps) {
  const form = useFormContext<MetadataFormValues>()
  const isEdit = mode === "edit"

  const languageOptions = availableLanguages.map((l) => ({
    label: l.version ? `${l.name} (${l.version})` : l.name,
    value: l.id,
    description: undefined,
  }))

  const tagOptions = availableTags.map((t) => ({
    label: t.name,
    value: t.id,
    description: t.description ?? undefined,
  }))

  return (
    <div className="space-y-8">
      {!isEdit && <SlugAutoGenerator />}
      <div className="grid gap-6 md:grid-cols-2">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Problem Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Two Sum" className="h-10" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormDescription className="text-xs">
                A clear and concise title for the problem.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Slug</FormLabel>
              <FormControl>
                <div className="flex rounded-md border border-input focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:border-transparent transition-shadow">
                  <div className="flex h-10 items-center rounded-l-md border-r border-input bg-muted/30 px-3 text-[13px] text-muted-foreground select-none font-mono">
                    /problems/
                  </div>
                  <Input
                    placeholder="two-sum"
                    className="h-10 rounded-l-none border-0 font-mono text-[13px] focus-visible:ring-0 focus-visible:ring-offset-0 pl-3"
                    readOnly={isEdit}
                    {...field}
                    value={field.value ?? ""}
                  />
                </div>
              </FormControl>
              <FormDescription className="text-xs">
                {isEdit ? "Slug cannot be changed when editing." : "URL-friendly identifier."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="difficulty"
        render={({ field }) => (
          <FormItem className="space-y-2.5">
            <FormLabel className="text-sm font-medium">Difficulty</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value ?? undefined}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3"
              >
                {DIFFICULTIES.map((difficulty) => (
                  <Label
                    key={difficulty}
                    className={cn(
                      "cursor-pointer flex flex-col gap-1 rounded-lg border p-3.5 transition-colors duration-150",
                      "hover:bg-muted/30",
                      field.value === difficulty
                        ? "border-primary/40 bg-primary/[0.04]"
                        : "border-border/80 bg-transparent"
                    )}
                  >
                    <RadioGroupItem value={difficulty} className="sr-only" />
                    <span
                      className={cn(
                        "text-sm font-medium",
                        field.value === difficulty
                          ? cn(
                              difficulty === "EASY" && "text-emerald-600/90 dark:text-emerald-400/90",
                              difficulty === "MEDIUM" && "text-amber-600/90 dark:text-amber-400/90",
                              difficulty === "HARD" && "text-rose-600/90 dark:text-rose-400/90"
                            )
                          : "text-muted-foreground"
                      )}
                    >
                      {difficulty}
                    </span>
                    <span className="text-[11px] text-muted-foreground leading-snug">
                      {difficulty === "EASY" && "Fundamental concepts"}
                      {difficulty === "MEDIUM" && "Standard interviews"}
                      {difficulty === "HARD" && "Advanced complexity"}
                    </span>
                  </Label>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Language & tags: same visual weight as other fields, clearer grouping */}
      <div className="space-y-4">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="languages"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Supported Languages</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={languageOptions}
                    selected={field.value || []}
                    onChange={field.onChange}
                    placeholder="Add languages…"
                    searchPlaceholder="Search languages…"
                    emptyMessage="No languages match."
                    className="min-h-10"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Allowed languages for submission.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Tags</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={tagOptions}
                    selected={field.value || []}
                    onChange={field.onChange}
                    placeholder="Add tags…"
                    searchPlaceholder="Search tags…"
                    emptyMessage="No tags match."
                    className="min-h-10"
                    maxVisibleBadges={5}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Algorithms and data structures used.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  )
}
