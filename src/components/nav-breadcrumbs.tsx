"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Home, Plus, ChevronDown, Check, Building2 } from "lucide-react";
import { Fragment, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { UserOrganization } from "@/lib/types";
import { cn } from "@/lib/utils";

// Helper to calculate target path in new organization
function getNewOrgPath(currentPath: string, newSlug: string): string {
  const parts = currentPath.split("/");
  if (parts[1] !== "organizations" || !parts[2]) {
    return "/organizations";
  }

  // If the path is a deep path under libraries (like a specific libraryId),
  // fall back to /organizations/[newSlug]/dashboard/problems
  if (parts.includes("libraries")) {
    return `/organizations/${newSlug}/dashboard/problems`;
  }

  // Otherwise, just replace the slug part
  parts[2] = newSlug;
  return parts.join("/");
}

export interface BreadcrumbNavData {
  title: string;
  href?: string;
  items?: BreadcrumbNavData[];
  /** When set with pathSuffix, item matches when pathname.startsWith(pathPrefix) && pathname.endsWith(pathSuffix) */
  pathPrefix?: string;
  pathSuffix?: string;
}

const getOrgGradient = (name: string) => {
  const colors = [
    "from-pink-500 to-rose-500",
    "from-purple-600 to-indigo-600",
    "from-blue-500 to-cyan-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-violet-600 to-fuchsia-600",
    "from-sky-400 to-blue-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const getOrgInitials = (name: string) => {
  if (!name) return "??";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

function isPathMatch(item: BreadcrumbNavData, pathname: string): boolean {
  if (item.href && item.href !== "/" && (pathname === item.href || pathname.startsWith(item.href))) {
    return true;
  }
  if (item.pathPrefix && item.pathSuffix) {
    const matchesSuffix =
      pathname.endsWith(item.pathSuffix) ||
      pathname.includes(item.pathSuffix + "/");
    return pathname.startsWith(item.pathPrefix) && matchesSuffix;
  }
  return false;
}

interface NavBreadcrumbsProps {
  items: BreadcrumbNavData[];
  organizationName?: string;
  organizationSlug?: string;
  organizations?: UserOrganization[];
  currentOrgId?: string;
}

export function NavBreadcrumbs({
  items,
  organizationName,
  organizationSlug,
  organizations = [],
  currentOrgId,
}: NavBreadcrumbsProps) {
  const pathname = usePathname();
  const router = useRouter();

  const currentOrg = useMemo(() => {
    return organizations.find((org) => org.id === currentOrgId || org.slug === organizationSlug);
  }, [organizations, currentOrgId, organizationSlug]);
  const logoUrl = currentOrg?.logoUrl;

  // Switch organization mutation matching standard implementation
  const { mutate: switchOrg, isPending: isSwitchingOrg } = useMutation({
    mutationFn: async ({ organizationId, slug }: { organizationId: string; slug: string }) => {
      const response = await fetch("/api/organizations/switch", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ organizationId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to switch organization");
      }

      const res = await response.json();
      return { data: res, slug };
    },
    onSuccess: (result) => {
      router.refresh();
      const targetPath = getNewOrgPath(pathname, result.slug);
      router.push(targetPath);
      toast.success("Switched organization successfully");
    },
    onError: (error: any) => {
      console.error("Switch organization failed:", error);
      toast.error(error.message || "Failed to switch organization");
    },
  });

  // Helper to find the path to the active item
  const findPath = (
    currentItems: BreadcrumbNavData[],
    targetPath: string,
    currentPath: BreadcrumbNavData[] = []
  ): BreadcrumbNavData[] | null => {
    if (!currentItems) return null;
    for (const item of currentItems) {
      if (isPathMatch(item, targetPath) && !item.items) {
        return [...currentPath, item];
      }
      if (item.items) {
        const result = findPath(item.items, targetPath, [...currentPath, item]);
        if (result) return result;
        if (item.pathPrefix && item.pathSuffix && targetPath.startsWith(item.pathPrefix) && targetPath.endsWith(item.pathSuffix)) {
          return [...currentPath, item];
        }
      }
    }
    return null;
  };

  // Try to find exact match first
  let activePath = findPath(items, pathname);

  // If no exact match, try to find partial match (for sub-pages)
  if (!activePath) {
    const findPartialPath = (
      currentItems: BreadcrumbNavData[],
      targetPath: string,
      currentPath: BreadcrumbNavData[] = []
    ): BreadcrumbNavData[] | null => {
      for (const item of currentItems) {
        if (isPathMatch(item, targetPath)) {
          const extendedPath = [...currentPath, item];
          if (item.items) {
            const childMatch = findPartialPath(item.items, targetPath, extendedPath);
            if (childMatch) return childMatch;
          }
          return extendedPath;
        }
        if (item.items) {
          const result = findPartialPath(item.items, targetPath, [...currentPath, item]);
          if (result) return result;
        }
      }
      return null;
    };
    activePath = findPartialPath(items, pathname);
  }

  const hasMultipleOrgs = organizations && organizations.length > 0;

  return (
    <Breadcrumb>
      <BreadcrumbList className="flex-nowrap items-center">
        {/* Home / Organizations */}
        <BreadcrumbItem className="hidden sm:flex">
          <BreadcrumbLink asChild>
            <Link
              href="/organizations"
              className="flex items-center gap-1.5 text-muted-foreground transition-all duration-200 hover:text-violet-600 dark:hover:text-violet-400"
            >
              <Home className="h-3.5 w-3.5" />
              <span className="hidden lg:inline text-xs font-medium">Organizations</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {/* Organization Name & Custom Dropdown Switcher */}
        {organizationName && (
          <>
            <BreadcrumbSeparator className="hidden sm:block" />
            <BreadcrumbItem>
              {hasMultipleOrgs ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      disabled={isSwitchingOrg}
                      className="group flex items-center gap-1.5 px-1.5 py-1 -mx-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/60 text-foreground transition-all duration-200 cursor-pointer select-none outline-none focus-visible:ring-1 focus-visible:ring-ring shrink-0"
                    >
                      {isSwitchingOrg ? (
                        <div className="size-[18px] flex items-center justify-center shrink-0">
                          <Spinner className="h-3 w-3 animate-spin text-violet-600 dark:text-violet-400" />
                        </div>
                      ) : logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={organizationName}
                          className="size-[18px] rounded object-cover shrink-0"
                        />
                      ) : (
                        <div className={cn(
                          "size-[18px] rounded flex items-center justify-center text-[9px] font-bold text-white bg-gradient-to-br shadow-sm shrink-0",
                          getOrgGradient(organizationName)
                        )}>
                          {getOrgInitials(organizationName)}
                        </div>
                      )}
                      <span className="max-w-[100px] truncate font-semibold text-xs tracking-tight sm:max-w-[150px]">
                        {organizationName}
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50 transition-transform duration-200 group-data-[state=open]:rotate-180 shrink-0" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 p-1.5 shadow-lg border border-border/40 bg-popover/95 backdrop-blur-md">
                    <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Switch Workspace
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="my-1 bg-border/40" />
                    {organizations.map((org) => {
                      const isActive = org.id === currentOrgId;
                      return (
                        <DropdownMenuItem
                          key={org.id}
                          disabled={isSwitchingOrg}
                          onClick={() => {
                            if (!isActive) switchOrg({ organizationId: org.id, slug: org.slug });
                          }}
                          className={cn(
                            "flex items-center justify-between px-2.5 py-2 rounded-sm cursor-pointer transition-all duration-150 focus:bg-accent/80 focus:text-accent-foreground",
                            isActive && "bg-violet-50/50 dark:bg-violet-950/20 text-violet-900 dark:text-violet-300 font-medium"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {org.logoUrl ? (
                              <img
                                src={org.logoUrl}
                                alt={org.orgName}
                                className="size-5 rounded object-cover shrink-0"
                              />
                            ) : (
                              <div className={cn(
                                "size-5 rounded flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br shadow-sm shrink-0",
                                getOrgGradient(org.orgName)
                              )}>
                                {getOrgInitials(org.orgName)}
                              </div>
                            )}
                            <span className="truncate text-sm font-medium">
                              {org.orgName}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 pl-2">
                            <span className="text-[8px] font-extrabold tracking-wider text-muted-foreground/60 bg-muted/80 px-1 py-0.5 rounded border border-border/30 uppercase select-none">
                              {org.role}
                            </span>
                            {isActive && (
                              <Check className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                            )}
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator className="my-1 bg-border/40" />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/organizations/new"
                        className="flex items-center gap-2 px-2.5 py-2 rounded-sm cursor-pointer hover:bg-accent focus:bg-accent focus:text-accent-foreground transition-colors duration-150"
                      >
                        <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">Create organization</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <BreadcrumbLink asChild>
                  <Link
                    href={organizationSlug ? `/organizations/${organizationSlug}/dashboard/basic-info` : "#"}
                    className="flex items-center gap-1.5 text-foreground transition-all duration-200 hover:text-violet-600 dark:hover:text-violet-400"
                  >
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt={organizationName}
                        className="size-[18px] rounded object-cover shrink-0"
                      />
                    ) : (
                      <div className={cn(
                        "size-[18px] rounded flex items-center justify-center text-[9px] font-bold text-white bg-gradient-to-br shadow-sm shrink-0",
                        organizationName ? getOrgGradient(organizationName) : "bg-neutral-500"
                      )}>
                        {organizationName ? getOrgInitials(organizationName) : <Building2 className="h-3 w-3" />}
                      </div>
                    )}
                    <span className="max-w-[100px] truncate font-semibold text-xs tracking-tight sm:max-w-[150px]">
                      {organizationName}
                    </span>
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </>
        )}

        {/* Dynamic Path - Desktop */}
        {activePath && activePath.length > 0 && (
          <>
            {activePath.map((item, index) => {
              const isLast = index === activePath.length - 1;

              return (
                <Fragment key={item.title}>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem className="hidden md:flex">
                    {isLast ? (
                      <BreadcrumbPage className="max-w-[150px] truncate text-xs">
                        {item.title}
                      </BreadcrumbPage>
                    ) : item.href ? (
                      <BreadcrumbLink asChild>
                        <Link
                          href={item.href}
                          className="max-w-[120px] truncate text-xs text-muted-foreground transition-all duration-200"
                        >
                          {item.title}
                        </Link>
                      </BreadcrumbLink>
                    ) : (
                      <span className="max-w-[120px] truncate text-xs text-muted-foreground font-medium">
                        {item.title}
                      </span>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              );
            })}
          </>
        )}

        {/* Mobile: Show only current page */}
        {activePath && activePath.length > 0 && (
          <>
            <BreadcrumbSeparator className="md:hidden" />
            <BreadcrumbItem className="md:hidden">
              <BreadcrumbPage className="max-w-[120px] truncate text-xs">
                {activePath[activePath.length - 1].title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
