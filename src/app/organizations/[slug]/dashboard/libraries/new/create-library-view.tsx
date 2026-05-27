"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Library } from "lucide-react"
import { toast } from "sonner"
import { useMutation } from "@tanstack/react-query"

interface CreateLibraryViewProps {
  slug: string
}

export function CreateLibraryView({ slug }: CreateLibraryViewProps) {
  const router = useRouter()
  const [newLibraryName, setNewLibraryName] = useState("")
  const [newLibraryDescription, setNewLibraryDescription] = useState("")

  const { mutate: createLibrary, isPending: isCreatingLibrary } = useMutation({
    mutationFn: async (values: { name: string; description?: string }) => {
      const response = await fetch(
        `/api/organizations/${encodeURIComponent(slug)}/problem-libraries`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        }
      )

      const data = await response.json()
      if (!response.ok) {
        throw { status: response.status, data }
      }

      return data as { data?: { id: string } }
    },
    onSuccess: (payload) => {
      const created = payload?.data
      if (!created?.id) {
        toast.error("Library created, but response was unexpected.")
        return
      }

      toast.success("Problem library created!")
      router.push(
        `/organizations/${slug}/dashboard/libraries/${created.id}/problems`
      )
    },
    onError: (error: { data?: { message?: string }; message?: string }) => {
      console.error("Error creating problem library:", error)
      const message =
        error?.data?.message ||
        error?.message ||
        "Failed to create library. Please try again."
      toast.error(message)
    },
  })

  return (
    <div className="min-w-0 space-y-6">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight">
          Create problem library
        </h1>
        <p className="text-sm text-muted-foreground">
          Add a new library to organize your problems.
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
            <Library className="h-5 w-5 text-muted-foreground" />
          </div>
          <CardTitle>New library</CardTitle>
          <CardDescription>
            Give your library a name and optional description.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()

              const name = newLibraryName.trim()
              const descriptionRaw = newLibraryDescription.trim()

              if (!name) {
                toast.error("Library name is required.")
                return
              }

              if (
                descriptionRaw.length > 0 &&
                (descriptionRaw.length < 8 || descriptionRaw.length > 1024)
              ) {
                toast.error("Description must be 8–1024 characters (or empty).")
                return
              }

              createLibrary({
                name,
                ...(descriptionRaw.length > 0
                  ? { description: descriptionRaw }
                  : {}),
              })
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="library-name">Name</Label>
              <Input
                id="library-name"
                value={newLibraryName}
                onChange={(e) => setNewLibraryName(e.target.value)}
                placeholder="e.g. sre"
                disabled={isCreatingLibrary}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="library-description">
                Description (optional)
              </Label>
              <Textarea
                id="library-description"
                value={newLibraryDescription}
                onChange={(e) => setNewLibraryDescription(e.target.value)}
                placeholder="Optional description (8–1024 chars if provided)"
                disabled={isCreatingLibrary}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isCreatingLibrary}>
                {isCreatingLibrary ? "Creating…" : "Create library"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isCreatingLibrary}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
