import { z } from "zod"

export const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const
export type Difficulty = (typeof DIFFICULTIES)[number]

const baseMetadataSchema = {
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
  difficulty: z.enum(DIFFICULTIES),
  languages: z.array(z.string()).min(1, "Select at least one language"),
  tags: z.array(z.string()).min(1, "Select at least one tag"),
  statement: z.string().optional(),
}

export const metadataSchema = z.object(baseMetadataSchema)

export const editMetadataSchema = z.object({
  title: baseMetadataSchema.title.nullish(),
  slug: baseMetadataSchema.slug.nullish(),
  difficulty: baseMetadataSchema.difficulty.nullish(),
  // For arrays, we allow empty or null in edit mode if "progressing"
  languages: z.array(z.string()).nullish(),
  tags: z.array(z.string()).nullish(),
  statement: z.string().optional().nullish(),
})

export type MetadataFormValues = z.infer<typeof metadataSchema>
// Edit values can be partial/nullish
export type EditMetadataFormValues = z.infer<typeof editMetadataSchema>

export type ProblemFormMode = "create" | "edit"
