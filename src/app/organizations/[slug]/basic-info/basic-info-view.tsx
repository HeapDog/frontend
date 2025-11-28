"use client";

import { OrganizationBasicInfo } from "@/lib/types/organization";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OrganizationForm, OrganizationFormValues } from "../../components/organization-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";

interface BasicInfoViewProps {
  info: OrganizationBasicInfo;
  userRole?: string;
}

export function BasicInfoView({ info, userRole }: BasicInfoViewProps) {
  const router = useRouter();
  const [form, setForm] = useState<UseFormReturn<OrganizationFormValues> | null>(null);
  const isAdmin = userRole === "ADMIN";

  const { mutate: updateOrg, isPending } = useMutation({
    mutationFn: async (values: OrganizationFormValues) => {
      const response = await fetch(`/api/organizations/${info.slug}/basic-info`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw { status: response.status, data };
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success("Organization information updated successfully.");
      router.refresh();
    },
    onError: (error: any) => {
      console.error("Error updating organization:", error);
      const { status, data } = error;

      if (!form) return;

      if (status === 409) {
        if (data?.details) {
          data.details.forEach((detail: any) => {
            form.setError(detail.field as any, {
              type: "manual",
              message: detail.message,
            });
          });
          toast.error("Conflict error. Please check the errors.");
        } else {
          toast.error(data?.message || "Resource already exists.");
        }
      } else if (status === 400 && data?.details) {
        data.details.forEach((detail: any) => {
           form.setError(detail.field as any, {
             type: "manual",
             message: detail.message,
           });
        });
        toast.error("Validation failed. Please check the highlighted fields.");
      } else {
        toast.error(data?.message || "Failed to update organization.");
      }
    },
  });

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>
          {isAdmin 
            ? "Manage your organization's profile details." 
            : "View your organization's profile details."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <OrganizationForm
          defaultValues={{
            name: info.name,
            slug: info.slug,
            description: info.description || "",
            email: info.email || "",
            website: info.website || "",
            address: info.address || "",
            phone: info.phone || "",
          }}
          onSubmit={(values) => updateOrg(values)}
          isPending={isPending}
          mode="update"
          formRef={setForm}
          readOnly={!isAdmin}
        />
      </CardContent>
    </Card>
  );
}
