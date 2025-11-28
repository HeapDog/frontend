"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useMutation } from "@tanstack/react-query"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { OrganizationForm, OrganizationFormValues } from "./components/organization-form"
import { UseFormReturn } from "react-hook-form"

export function CreateOrganizationForm() {
  const router = useRouter()
  const [showSwitchDialog, setShowSwitchDialog] = useState(false)
  const [newOrgMembershipId, setNewOrgMembershipId] = useState<number | null>(null)
  const [newOrgName, setNewOrgName] = useState("")
  const [form, setForm] = useState<UseFormReturn<OrganizationFormValues> | null>(null)

  const { mutate: switchOrg, isPending: isSwitchingOrg } = useMutation({
    mutationFn: async (membershipId: number) => {
      const response = await fetch("/api/organizations/switch", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ membershipId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to switch organization");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast.success("Switched to new organization successfully")
      // Hard reload to ensure all server-side state (like navbar user) is updated
      window.location.href = "/organizations"; 
    },
    onError: (error) => {
      console.error("Switch organization failed:", error);
      toast.error("Failed to switch organization");
      // Even if switch fails, we should probably redirect to list or let user stay
      router.push("/organizations"); 
    },
  });

  const { mutate: createOrg, isPending } = useMutation({
    mutationFn: async (values: OrganizationFormValues) => {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (!response.ok) {
        throw { status: response.status, data }
      }

      return data
    },
    onSuccess: (data) => {
      toast.success("Organization created successfully!")
      // Extract membershipId from the response data structure
      // Response format: { data: { ..., membershipId: 9, ... } }
      if (data?.data?.membershipId) {
        setNewOrgMembershipId(data.data.membershipId)
        setNewOrgName(data.data.name)
        setShowSwitchDialog(true)
      } else {
        // Fallback if no membershipId found
        router.refresh()
        router.push("/organizations")
      }
    },
    onError: (error: any) => {
      console.error("Error creating organization:", error)
      const { status, data } = error

      if (!form) return;

      if (status === 409) {
        // Handle specific duplicate resource error
        if (data?.details) {
          data.details.forEach((detail: any) => {
            form.setError(detail.field as any, {
              type: "manual",
              message: detail.message,
            })
          })
          toast.error("Organization already exists. Please check the errors.")
        } else {
          toast.error(data?.message || "Organization already exists.")
        }
      } else if (status === 400 && data?.details) {
        // Handle validation errors from Spring Boot
        data.details.forEach((detail: any) => {
           form.setError(detail.field as any, {
             type: "manual",
             message: detail.message,
           })
        })
        toast.error("Validation failed. Please check the highlighted fields.")
      } else {
        toast.error(data?.message || "Something went wrong. Please try again.")
      }
    },
  })

  async function checkSlugAvailability(slug: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/organizations/check-slug?slug=${encodeURIComponent(slug)}`, {
        method: "GET",
      });
      
      if (!response.ok) {
        // If request fails, we can't determine availability, maybe assume available or throw
        // But for UI, it's better to treat as unknown or error.
        // If 401, etc.
        console.error("Slug check failed", response.status);
        return false; // Safe default to prevent submission? Or allow and let submit fail?
      }

      const json = await response.json();
      // Expected: { data: { slug: "...", available: boolean } }
      return json?.data?.available ?? false;
    } catch (error) {
      console.error("Slug check error", error);
      return false;
    }
  }

  function onSubmit(values: OrganizationFormValues) {
    createOrg(values)
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Organization Details</CardTitle>
        <CardDescription>
          Enter the details of your new organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <OrganizationForm 
            onSubmit={onSubmit} 
            isPending={isPending} 
            mode="create"
            formRef={setForm}
            checkSlugAvailability={checkSlugAvailability}
        />
      </CardContent>

      <AlertDialog open={showSwitchDialog} onOpenChange={setShowSwitchDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch to {newOrgName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Organization created successfully. Would you like to switch to {newOrgName} now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                router.push("/organizations")
                router.refresh()
              }}
            >
              No, stay here
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                if (newOrgMembershipId) {
                   switchOrg(newOrgMembershipId)
                }
              }}
              disabled={isSwitchingOrg}
            >
              {isSwitchingOrg ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Yes, switch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
