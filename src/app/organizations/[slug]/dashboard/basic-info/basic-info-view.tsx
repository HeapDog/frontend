"use client";

import { InternalUser, OrganizationBasicInfo } from "@/lib/types/organization";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { OrganizationForm, OrganizationFormValues } from "@/app/organizations/components/organization-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useMyPermissions } from "@/hooks/use-my-permissions";
import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { SafeLink } from "@/components/safe-link";
import { cn, removeEmptyFields } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CalendarClock,
  UserRoundCheck,
  ExternalLink,
  Fingerprint,
  CalendarDays,
  PencilLine,
  ChevronDown,
  ArrowUpRight,
  ShieldAlert,
  ShieldCheck,
  Mail,
  Globe,
  Phone,
  MapPin,
  Copy,
  Check,
  Eye,
  Camera,
  ImageIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface BasicInfoViewProps {
  info: OrganizationBasicInfo;
  userRole?: string;
  mode?: "view" | "update";
}

export function BasicInfoView({ info, userRole, mode = "view" }: BasicInfoViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { check } = useMyPermissions(info.slug);
  const [form, setForm] = useState<UseFormReturn<OrganizationFormValues> | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isWebsitePreviewLoading, setIsWebsitePreviewLoading] = useState(Boolean(info.website));
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const hasWritePermission = check("basic-info:write");
  const isUpdateMode = mode === "update";
  const creator = info.createdByUser;
  const updater = info.updatedByUser;
  const descriptionText = info.description?.trim() || "";
  const hasLongDescription = descriptionText.length > 150;
  const descriptionPreview = hasLongDescription
    ? `${descriptionText.slice(0, 150)}…`
    : descriptionText;

  useEffect(() => {
    setIsWebsitePreviewLoading(Boolean(info.website));
  }, [info.website]);

  useEffect(() => {
    if (!isUpdateMode) return;
    if (searchParams.get("highlight") !== "website") return;

    // Let the form render first, then bring the field into view.
    requestAnimationFrame(() => {
      const fieldEl = document.querySelector(
        '[data-org-field="website"]'
      ) as HTMLElement | null;
      if (!fieldEl) return;

      fieldEl.scrollIntoView({ behavior: "smooth", block: "center" });

      const input = fieldEl.querySelector("input") as HTMLInputElement | null;
      input?.focus();

      fieldEl.classList.add(
        "ring-2",
        "ring-primary/40",
        "rounded-md",
        "animate-[shake-x_0.45s_ease-in-out_0s_2]"
      );

      window.setTimeout(() => {
        fieldEl.classList.remove(
          "ring-2",
          "ring-primary/40",
          "rounded-md",
          "animate-[shake-x_0.45s_ease-in-out_0s_2]"
        );
      }, 1000);
    });

    // Remove the highlight param so it doesn't re-trigger on future renders.
    const params = new URLSearchParams(searchParams.toString());
    params.delete("highlight");
    const qs = params.toString();
    router.replace(
      `/organizations/${info.slug}/dashboard/basic-info${qs ? `?${qs}` : ""}`
    );
  }, [info.slug, isUpdateMode, router, searchParams]);

  const formatUserName = (user?: InternalUser) => {
    if (!user) return "Unknown user";
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
    return fullName || user.username || user.email || "Unknown user";
  };

  const formatUserMeta = (user?: InternalUser) => {
    if (!user) return "";
    const meta = [];
    if (user.username) meta.push(`@${user.username}`);
    if (user.email) meta.push(user.email);
    return meta.join(" • ");
  };

  const formatDate = (value?: string) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (value?: string) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
  };

  const displayValue = (value?: string | null) => {
    if (typeof value === "string" && value.trim().length > 0) return value;
    return "—";
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(info.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      toast.error("Failed to copy ID");
    }
  };

  const { mutate: updateOrg, isPending } = useMutation({
    mutationFn: async (values: OrganizationFormValues) => {
      const { name, slug, ...optionalFields } = values;
      const cleanedOptional = removeEmptyFields(optionalFields);
      const payload = { name, slug, ...cleanedOptional };
      const response = await fetch(`/api/organizations/${info.slug}/basic-info`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw { status: response.status, data };
      return data;
    },
    onSuccess: () => {
      toast.success("Organization information updated successfully.");
      router.push(`/organizations/${info.slug}/dashboard/basic-info?mode=view`);
      router.refresh();
    },
    onError: (error: any) => {
      console.error("Error updating organization:", error);
      const { status, data } = error;
      if (!form) return;
      if (status === 409) {
        if (data?.details) {
          data.details.forEach((detail: any) => {
            form.setError(detail.field as any, { type: "manual", message: detail.message });
          });
          toast.error("Conflict error. Please check the errors.");
        } else {
          toast.error(data?.message || "Resource already exists.");
        }
      } else if (status === 400 && data?.details) {
        data.details.forEach((detail: any) => {
          form.setError(detail.field as any, { type: "manual", message: detail.message });
        });
        toast.error("Validation failed. Please check the highlighted fields.");
      } else {
        toast.error(data?.message || "Failed to update organization.");
      }
    },
  });

  // Contact items for cleaner rendering
  const contactItems = [
    { icon: Mail, label: "Email", value: info.email },
    { icon: Phone, label: "Phone", value: info.phone },
    { icon: MapPin, label: "Address", value: info.address },
  ];

  return (
    <Card className="max-w-4xl overflow-hidden border-border/50 shadow-sm transition-all hover:shadow-md">
      {/* Cover Image Section */}
      <div className="group relative h-48 w-full bg-muted/30">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/50 via-muted/30 to-background/10" />
        
        {/* Pattern overlay for better visual if no image */}
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} 
        />

        {hasWritePermission && (
          <Button 
            variant="secondary" 
            size="sm" 
            className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            Edit Cover
          </Button>
        )}
      </div>

      <CardContent className="relative px-6 pt-0">
        {/* Profile Section & Actions */}
        <div className="-mt-12 mb-6 flex items-end justify-between">
          <div className="relative">
            <Avatar className="h-32 w-32 rounded-2xl border-4 border-background bg-background shadow-sm">
              {info.logoUrl && (
                <AvatarImage
                  src={info.logoUrl}
                  alt={info.name}
                  className="rounded-2xl object-cover"
                />
              )}
              <AvatarFallback className="rounded-2xl text-4xl font-bold bg-primary/5 text-primary">
                {info.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {hasWritePermission && (
              <Button 
                size="icon" 
                variant="secondary" 
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full border border-background shadow-md"
              >
                <Camera className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="flex shrink-0 items-center gap-2 mb-2">
            {!isUpdateMode && hasWritePermission && (
              <Button size="sm" variant="secondary" asChild>
                <Link href={`/organizations/${info.slug}/dashboard/basic-info?mode=update`}>
                  <PencilLine className="mr-1.5 h-3.5 w-3.5" />
                  Edit Details
                </Link>
              </Button>
            )}
            <SafeLink
              href={`/organizations/${info.slug}`}
              target="_blank"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              Public View
            </SafeLink>
          </div>
        </div>

        {/* Organization Header Info */}
        <div className="mb-8 space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {info.name}
              </h1>
              {info.websiteStatus === "VERIFIED" && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <ShieldCheck className="h-5 w-5 text-emerald-500" />
                    </TooltipTrigger>
                    <TooltipContent>Verified Organization</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">@{info.slug}</span>
              <span className="text-border">•</span>
              <span>Joined {formatDate(info.createdAt)}</span>
            </div>
        </div>
        
        {/* Main Content Area */}
        <div className="space-y-8">
        {isUpdateMode ? (
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
            readOnly={!hasWritePermission}
          />
        ) : (
          <>
            {/* Description */}
            {descriptionText && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">About</h3>
                <div className="relative">
                  <div
                    className={cn(
                      "whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground",
                      !isDescriptionExpanded && hasLongDescription && "line-clamp-3"
                    )}
                  >
                    {descriptionText}
                  </div>
                  {hasLongDescription && (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs text-primary mt-1"
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    >
                      {isDescriptionExpanded ? "Show less" : "Read more"}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Website - Featured if exists, otherwise nudge if admin */}
            {info.website ? (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Website</h3>
                <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      {info.websiteStatus && info.websiteStatus !== "VERIFIED" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                          <ShieldAlert className="h-3 w-3" />
                          Not verified
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SafeLink
                              href={info.website}
                              target="_blank"
                              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                            >
                              {info.website}
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </SafeLink>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" align="start" className="p-2">
                            <div className="relative h-48 w-72 overflow-hidden rounded-md border bg-background">
                              {isWebsitePreviewLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-background/90">
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:-0.2s]" />
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:0s]" />
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:0.2s]" />
                                  </div>
                                </div>
                              )}
                              <iframe
                                title="Website preview"
                                src={info.website}
                                className="h-[720px] w-[1280px] origin-top-left scale-[0.225]"
                                onLoad={() => setIsWebsitePreviewLoading(false)}
                                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                                scrolling="no"
                              />
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  {info.websiteStatus && info.websiteStatus !== "VERIFIED" && check("domain:write") && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/organizations/${info.slug}/dashboard/settings/website-verification`}>
                        Verify
                        <ArrowUpRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
              </div>
            ) : check("basic-info:write") && (
              <div className="rounded-lg border border-dashed p-6 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-foreground">No website added</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Add a website to verify your organization and build trust.</p>
                  <Button size="sm" variant="outline" className="mt-4" asChild>
                    <Link href={`/organizations/${info.slug}/dashboard/basic-info?mode=update`}>
                      Add Website
                    </Link>
                  </Button>
              </div>
            )}

            {/* Contact Details - Grid */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Contact</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {contactItems.map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="flex flex-col gap-1 rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium uppercase">{label}</span>
                    </div>
                    <span className="text-sm font-medium text-foreground truncate" title={value || ""}>
                      {displayValue(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit & Metadata - Collapsible */}
            <Collapsible open={isAuditOpen} onOpenChange={setIsAuditOpen} className="pt-4 border-t">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-between py-2 text-left hover:text-foreground/80"
                >
                  <div className="flex items-center gap-2">
                    <Fingerprint className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Audit Log & Metadata
                    </span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      isAuditOpen && "rotate-180"
                    )}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 grid gap-6 rounded-lg bg-muted/30 p-4 text-sm sm:grid-cols-2">
                  {/* Organization ID */}
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Organization ID</div>
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{info.id}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={handleCopyId}
                      >
                        {copiedId ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Created */}
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Created</div>
                    <div className="flex items-center gap-2">
                      <UserRoundCheck className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{formatUserName(creator)}</span>
                    </div>
                     <div className="flex items-center gap-2 text-xs text-muted-foreground">
                       <CalendarDays className="h-3.5 w-3.5" />
                       <span>{formatDateTime(info.createdAt)}</span>
                     </div>
                  </div>

                  {/* Updated */}
                  {info.updatedAt && info.updatedBy && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Last Updated</div>
                      <div className="flex items-center gap-2">
                         <UserRoundCheck className="h-3.5 w-3.5 text-muted-foreground" />
                         <span>{formatUserName(updater)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarClock className="h-3.5 w-3.5" />
                        <span>{formatDateTime(info.updatedAt)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
        </div>
      </CardContent>
    </Card>
  );
}
