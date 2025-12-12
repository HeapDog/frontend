"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, UseFormReturn } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { Building2, Globe, Mail, Phone, MapPin, AlignLeft, Link as LinkIcon, Check, X } from "lucide-react"
import { useEffect, useState } from "react"
import { useDebounce } from "use-debounce"

export const organizationFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  slug: z.string().min(2, {
    message: "Slug must be at least 2 characters.",
  }).regex(/^[a-z0-9-]+$/, {
    message: "Slug must contain only lowercase letters, numbers, and hyphens.",
  }),
  description: z.string().max(1000, {
    message: "Description cannot exceed 1000 characters.",
  }).optional().or(z.literal("")),
  email: z.string().email({ message: "Invalid email address" }).max(500, {
    message: "Email cannot exceed 500 characters.",
  }).optional().or(z.literal("")),
  website: z.string().url({ message: "Invalid URL" }).max(500, {
    message: "Website cannot exceed 500 characters.",
  }).optional().or(z.literal("")),
  address: z.string().max(1000, {
    message: "Address cannot exceed 1000 characters.",
  }).optional().or(z.literal("")),
  phone: z.string().max(20, {
    message: "Phone number cannot exceed 20 characters.",
  }).optional().or(z.literal("")),
})

export type OrganizationFormValues = z.infer<typeof organizationFormSchema>

interface OrganizationFormProps {
  defaultValues?: Partial<OrganizationFormValues>
  onSubmit: (values: OrganizationFormValues) => void
  isPending: boolean
  mode: "create" | "update"
  formRef?: (form: UseFormReturn<OrganizationFormValues>) => void
  checkSlugAvailability?: (slug: string) => Promise<boolean>
  readOnly?: boolean
}

export function OrganizationForm({ 
  defaultValues, 
  onSubmit, 
  isPending, 
  mode,
  formRef,
  checkSlugAvailability,
  readOnly = false
}: OrganizationFormProps) {
  // Some browser extensions (password managers, etc.) mutate <input> DOM before React hydrates,
  // which can cause hydration mismatches. We gate rendering of a few "high risk" inputs until mount.
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      email: "",
      website: "",
      address: "",
      phone: "",
      ...defaultValues,
    },
    disabled: readOnly,
  })

  const slugValue = form.watch("slug")
  const [debouncedSlug] = useDebounce(slugValue, 500)
  const [isCheckingSlug, setIsCheckingSlug] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)

  // Check slug availability when debounced slug changes
  useEffect(() => {
    const checkSlug = async () => {
      if (readOnly || mode === "update" || !checkSlugAvailability || !debouncedSlug || debouncedSlug.length < 2) {
        setSlugAvailable(null)
        return
      }
      
      // Only check if valid slug format to save requests
      if (!/^[a-z0-9-]+$/.test(debouncedSlug)) {
          setSlugAvailable(null) // Or false if we want strict feedback
          return
      }

      setIsCheckingSlug(true)
      try {
        const available = await checkSlugAvailability(debouncedSlug)
        setSlugAvailable(available)
        if (!available) {
          form.setError("slug", {
            type: "manual",
            message: "This slug is already taken.",
          })
        } else {
          form.clearErrors("slug")
        }
      } catch (error) {
        console.error("Failed to check slug:", error)
        // On error, maybe assume unavailable or let it pass to backend validation
        setSlugAvailable(null)
      } finally {
        setIsCheckingSlug(false)
      }
    }

    checkSlug()
  }, [debouncedSlug, mode, checkSlugAvailability, form, readOnly])

  // Expose form instance to parent if needed (for setError etc)
  useEffect(() => {
    if (formRef) {
      formRef(form)
    }
  }, [form, formRef])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex flex-col h-full">
                <FormLabel>Name <span className="text-destructive">*</span></FormLabel>
                <div className="relative">
                    <Building2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input placeholder="Acme Corp" className="pl-9" {...field} onChange={(e) => {
                        field.onChange(e)
                      }} />
                    </FormControl>
                </div>
                <FormDescription>
                  This is your public display name.
                </FormDescription>
                <div className="h-5">
                     <FormMessage />
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem className="flex flex-col h-full">
                <FormLabel>Slug <span className="text-destructive">*</span></FormLabel>
                <div className="relative">
                    <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input 
                        placeholder="acme-corp" 
                        className={`pl-9 pr-9 ${!readOnly && slugAvailable === false ? "border-destructive focus-visible:ring-destructive" : !readOnly && slugAvailable === true ? "border-green-500 focus-visible:ring-green-500" : ""}`} 
                        {...field} 
                        disabled={mode === "update" || readOnly} 
                      />
                    </FormControl>
                    {!readOnly && isCheckingSlug && (
                        <div className="absolute right-2.5 top-2.5">
                            <Spinner className="h-4 w-4 text-muted-foreground" />
                        </div>
                    )}
                    {!readOnly && !isCheckingSlug && slugAvailable === true && (
                        <Check className="absolute right-2.5 top-2.5 h-4 w-4 text-green-500" />
                    )}
                    {!readOnly && !isCheckingSlug && slugAvailable === false && (
                         <X className="absolute right-2.5 top-2.5 h-4 w-4 text-destructive" />
                    )}
                </div>
                <FormDescription>
                  Unique identifier for your organization URL.{mode === "update" && " Cannot be changed."}
                </FormDescription>
                 <div className="h-5">
                     <FormMessage />
                </div>
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <div className="relative">
                <AlignLeft className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <FormControl>
                    <Textarea
                    placeholder="Brief description of your organization"
                    className="resize-none pl-9 min-h-[80px]"
                    {...field}
                    />
                </FormControl>
              </div>
                <FormDescription>
                  Optional. Max 1000 characters.
                </FormDescription>
              </FormItem>
            )}
          />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                    {isMounted ? (
                      <Input
                        placeholder="contact@acme.com"
                        type="email"
                        className="pl-9"
                        autoComplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        data-bwignore="true"
                        {...field}
                      />
                    ) : (
                      // Avoid rendering an actual <input> during SSR/first client render to prevent
                      // extension-injected DOM from causing hydration mismatches.
                      <div
                        className="h-9 w-full rounded-md border border-input bg-transparent pl-9"
                        aria-hidden="true"
                      />
                    )}
                    </FormControl>
                </div>
                <FormDescription>
                  Optional. Max 500 characters.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <div className="relative">
                    <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                    <Input placeholder="https://acme.com" className="pl-9" {...field} />
                    </FormControl>
                </div>
                <FormDescription>
                  Optional. Max 500 characters.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

         <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <div className="relative">
                    <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                    <Input placeholder="+1 234 567 890" className="pl-9" {...field} />
                    </FormControl>
                </div>
                <FormDescription>
                  Optional. Max 20 characters.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <div className="relative">
                    <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                    <Input placeholder="123 Main St, City, Country" className="pl-9" {...field} />
                    </FormControl>
                </div>
                <FormDescription>
                  Optional. Max 1000 characters.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!readOnly && (
            <div className="flex justify-end">
            <Button type="submit" disabled={isPending || (slugAvailable === false && mode === "create")}>
                {isPending && <Spinner className="mr-2 h-4 w-4" />}
                {mode === "create" ? "Create Organization" : "Save Changes"}
            </Button>
            </div>
        )}
      </form>
    </Form>
  )
}
