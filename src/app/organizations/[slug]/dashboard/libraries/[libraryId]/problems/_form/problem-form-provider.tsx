"use client"

import { useForm, FormProvider, Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { metadataSchema, editMetadataSchema, MetadataFormValues, ProblemFormMode } from "./types"

interface ProblemFormProviderProps {
  children: React.ReactNode
  defaultValues?: Partial<MetadataFormValues>
  mode?: ProblemFormMode
}

export function ProblemFormProvider({ children, defaultValues, mode = "create" }: ProblemFormProviderProps) {
  const schema = mode === "create" ? metadataSchema : editMetadataSchema

  const methods = useForm<MetadataFormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<MetadataFormValues>,
    mode: "onChange",
    defaultValues: {
      title: "",
      slug: "",
      difficulty: "MEDIUM",
      languages: [],
      tags: [],
      statement: "",
      ...defaultValues,
    },
  })

  return (
    <FormProvider {...methods}>
      <div className="flex flex-1 min-h-0 flex-col">{children}</div>
    </FormProvider>
  )
}
