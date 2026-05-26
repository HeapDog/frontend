"use client";

import { useState } from "react";
import { PublicOrganization } from "@/lib/types/organization";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SafeLink } from "@/components/safe-link";
import { cn } from "@/lib/utils";
import {
  BadgeCheck,
  Calendar,
  ChevronDown,
  Globe,
  ImageIcon,
  Mail,
  MapPin,
  Phone,
  Share2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

interface PublicOrgViewProps {
  organization: PublicOrganization;
}

export function PublicOrgView({ organization }: PublicOrgViewProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const descriptionText = organization.description?.trim() || "";
  const hasLongDescription = descriptionText.length > 200;

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: organization.name,
          text: organization.description || `Check out ${organization.name}`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
    } catch {
      // User cancelled or error
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-muted/30 to-background">
      {/* Cover Section */}
      <div className="relative">
        {/* Cover Image Placeholder */}
        <div className="h-48 w-full bg-gradient-to-br from-primary/20 via-primary/10 to-background sm:h-56 md:h-64 lg:h-72">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,color-mix(in_oklch,var(--primary)_15%,transparent),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,color-mix(in_oklch,var(--info)_15%,transparent),transparent_50%)]" />
          {/* Future: Cover image upload indicator */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity hover:opacity-100">
            <div className="flex items-center gap-2 rounded-lg bg-background/80 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm">
              <ImageIcon className="h-4 w-4" />
              Cover photo coming soon
            </div>
          </div>
        </div>

        {/* Profile Section */}
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-16 flex flex-col gap-4 sm:-mt-20 sm:flex-row sm:items-end sm:gap-6">
            {/* Profile Picture */}
            <div className="relative shrink-0">
              <div className="h-28 w-28 overflow-hidden rounded-2xl border-4 border-background bg-gradient-to-br from-primary/20 to-primary/5 shadow-xl sm:h-36 sm:w-36 md:h-40 md:w-40">
                {organization.logoUrl ? (
                  <img
                    src={organization.logoUrl}
                    alt={organization.name}
                    className="h-full w-full object-cover rounded-2xl"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-primary/60 sm:text-4xl">
                    {getInitials(organization.name)}
                  </div>
                )}
              </div>
              {organization.websiteStatus === "VERIFIED" && (
                <div className="absolute -bottom-1 -right-1 rounded-full bg-background p-1 shadow-sm">
                  <BadgeCheck className="h-6 w-6 fill-info/20 text-info" />
                </div>
              )}
            </div>

            {/* Name & Meta */}
            <div className="flex-1 pb-2 sm:pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                    {organization.name}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary" className="font-mono text-xs">
                      @{organization.slug}
                    </Badge>
                    <span className="hidden text-muted-foreground/50 sm:inline">•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Joined {formatDate(organization.createdAt)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="w-fit"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-5xl px-4 py-8 pb-24 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* About Section */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-foreground">About</h2>
              <Card className="border-0 bg-card/50 shadow-sm backdrop-blur-sm">
                <CardContent className="p-6">
                  {descriptionText ? (
                    <div className="space-y-3">
                      <p
                        className={cn(
                          "whitespace-pre-wrap break-words text-base leading-relaxed text-muted-foreground",
                          !isDescriptionExpanded && hasLongDescription && "line-clamp-4"
                        )}
                      >
                        {descriptionText}
                      </p>
                      {hasLongDescription && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto gap-1 p-0 text-sm font-medium text-primary hover:text-primary/80"
                          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        >
                          {isDescriptionExpanded ? "Show less" : "Read more"}
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform",
                              isDescriptionExpanded && "rotate-180"
                            )}
                          />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground/60 italic">
                      This organization hasn't added a description yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Stats */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-foreground">Overview</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Card className="border-0 bg-card/50 shadow-sm">
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    <div className="mb-2 rounded-full bg-primary/10 p-3">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-3xl font-bold text-foreground">
                      {organization.memberCount}
                    </span>
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {organization.memberCount === 1 ? "Member" : "Members"}
                    </span>
                  </CardContent>
                </Card>
                {/* Placeholder for future stats */}
                <Card className="border-0 bg-muted/30 shadow-sm">
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground/50">
                    <div className="mb-2 rounded-full bg-muted/50 p-3">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-2xl font-bold">—</span>
                    <span className="text-xs font-medium uppercase tracking-wider">Problems</span>
                  </CardContent>
                </Card>
                <Card className="border-0 bg-muted/30 shadow-sm">
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground/50">
                    <div className="mb-2 rounded-full bg-muted/50 p-3">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <span className="text-2xl font-bold">—</span>
                    <span className="text-xs font-medium uppercase tracking-wider">Contests</span>
                  </CardContent>
                </Card>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Contact
                </h3>
                <div className="space-y-4">
                  {/* Website */}
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Globe className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground">Website</p>
                      {organization.website ? (
                        <SafeLink
                          href={organization.website}
                          target="_blank"
                          className="block truncate text-sm text-foreground hover:text-primary"
                          showExternalIcon
                        >
                          {organization.website.replace(/^https?:\/\//, "")}
                        </SafeLink>
                      ) : (
                        <p className="text-sm text-muted-foreground/60">—</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Email */}
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground">Email</p>
                      {organization.email ? (
                        <a
                          href={`mailto:${organization.email}`}
                          className="block truncate text-sm text-foreground hover:text-primary"
                        >
                          {organization.email}
                        </a>
                      ) : (
                        <p className="text-sm text-muted-foreground/60">—</p>
                      )}
                    </div>
                  </div>

                  {/* Phone */}
                  {organization.phone && (
                    <>
                      <Separator />
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Phone className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-muted-foreground">Phone</p>
                          <a
                            href={`tel:${organization.phone}`}
                            className="text-sm text-foreground hover:text-primary"
                          >
                            {organization.phone}
                          </a>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Address */}
                  {organization.address && (
                    <>
                      <Separator />
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-muted-foreground">Location</p>
                          <p className="text-sm text-foreground">{organization.address}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Verified Badge Info */}
            {organization.websiteStatus === "VERIFIED" && (
              <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-900/10">
                <CardContent className="flex items-start gap-3 p-4">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 fill-blue-500/20 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Verified Organization
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      This organization has verified ownership of their website domain.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
