"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useSearchParams, useParams, useRouter } from "next/navigation"
import {
  Info, Users, Settings, Archive, ClipboardList, Trophy, ChevronRight,
  LayoutDashboard, User as UserIcon, Mail, PlusCircle, Library, Globe,
  ShieldCheck, PlugZap, AlertTriangle, Bell, CreditCard, Code, Eye,
  LogOut, ChevronsUpDown, Sparkles, UserMinus,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useMyPermissions } from "@/hooks/use-my-permissions"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

import { User, UserOrganization } from "@/lib/types"

const iconMap = {
  "basic-info": Info,
  members: Users,
  settings: Settings,
  problems: Archive,
  libraries: Library,
  "access-control": ShieldCheck,
  "access-rules": ShieldCheck,
  "access-groups": Users,
  "access-json": Code,
  "online-assessment": ClipboardList,
  contest: Trophy,
  "members-all": UserIcon,
  "members-invitations": Mail,
  "problem-new": PlusCircle,
  "problem-library": Library,
  "settings-website": Globe,
  "settings-members": Users,
  "settings-notifications": Bell,
  "settings-integrations": PlugZap,
  "settings-billing": CreditCard,
  "settings-transfer": UserMinus,
  "settings-danger": AlertTriangle,
  default: LayoutDashboard
} as const

export interface SidebarNavItem {
  href?: string
  title: string
  icon?: keyof typeof iconMap
  items?: SidebarNavItem[]
  section?: "Workspace" | "Administration"
  /** When set with pathSuffix, item is active when pathname.startsWith(pathPrefix) && pathname.endsWith(pathSuffix) */
  pathPrefix?: string
  pathSuffix?: string
}

const normalizeHref = (href?: string) => {
  if (!href) return ""
  return href.split("#")[0].split("?")[0]
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
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

const getOrgInitials = (name: string) => {
  if (!name) return "??"
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

const getUserInitials = (user?: User) => {
  if (!user) return "?"
  if (user.first_name && user.last_name) {
    return (user.first_name[0] + user.last_name[0]).toUpperCase()
  }
  if (user.username) {
    return user.username.substring(0, 2).toUpperCase()
  }
  return user.email?.substring(0, 2).toUpperCase() || "?"
}

const getUserDisplayName = (user?: User) => {
  if (!user) return "User"
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`
  }
  return user.username || user.email || "User"
}

// --- Active state helpers ---

function isDirectMatch(item: SidebarNavItem, pathname: string, searchParams?: URLSearchParams): boolean {
  const href = normalizeHref(item.href)
  if (href && pathname === href) {
    if (item.href && item.href.includes("?")) {
      const itemUrl = new URL(item.href, "http://localhost")
      const itemQuery = itemUrl.searchParams

      if (!searchParams) return false

      let matchesAll = true
      itemQuery.forEach((value, key) => {
        const currentVal = searchParams.get(key)
        if (key === "view") {
          const effectiveCurrent = currentVal || "rules"
          if (effectiveCurrent !== value) {
            matchesAll = false
          }
        } else {
          if (currentVal !== value) {
            matchesAll = false
          }
        }
      })
      return matchesAll
    }
    return true
  }
  if (item.pathPrefix && item.pathSuffix) {
    const startsWithPrefix = pathname.startsWith(item.pathPrefix)
    const matchesSuffix =
      pathname.endsWith(item.pathSuffix) ||
      pathname.includes(item.pathSuffix + "/")
    if (startsWithPrefix && matchesSuffix) {
      return true
    }
  }
  if (item.pathPrefix && !item.pathSuffix && pathname.startsWith(item.pathPrefix)) {
    return true
  }
  return false
}

function hasAnyDirectMatch(items: SidebarNavItem[], pathname: string, searchParams?: URLSearchParams): boolean {
  for (const item of items) {
    if (isDirectMatch(item, pathname, searchParams)) {
      return true
    }
    if (item.items && hasAnyDirectMatch(item.items, pathname, searchParams)) {
      return true
    }
  }
  return false
}

function isItemActive(item: SidebarNavItem, pathname: string, allItems: SidebarNavItem[], searchParams?: URLSearchParams): boolean {
  if (hasAnyDirectMatch(allItems, pathname, searchParams)) {
    return isDirectMatch(item, pathname, searchParams)
  }

  // Fallback: If no direct match in the entire sidebar, use prefix matching for deep subpages
  const href = normalizeHref(item.href)
  if (href && (pathname === href || (pathname.startsWith(href + "/") && href !== "/"))) {
    return true
  }
  if (item.pathPrefix && item.pathSuffix) {
    const startsWithPrefix = pathname.startsWith(item.pathPrefix)
    const matchesSuffix =
      pathname.endsWith(item.pathSuffix) ||
      pathname.includes(item.pathSuffix + "/")
    return startsWithPrefix && matchesSuffix
  }
  return false
}

// --- Animated submenu content ---

const submenuVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: "auto",
    transition: {
      height: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const },
      opacity: { duration: 0.2, delay: 0.05 },
      staggerChildren: 0.04,
      delayChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: {
      height: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const },
      opacity: { duration: 0.15 },
    },
  },
}

const submenuItemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const } },
  exit: { opacity: 0, x: -4, transition: { duration: 0.1 } },
}

// --- Collapsible sidebar group ---

function CollapsibleSidebarItem({
  item,
  pathname,
  allItems,
  searchParams,
  disabled,
  isCollapsed,
  user,
  currentOrg,
}: {
  item: SidebarNavItem
  pathname: string
  allItems: SidebarNavItem[]
  searchParams?: URLSearchParams
  disabled?: boolean
  isCollapsed: boolean
  user?: User
  currentOrg?: UserOrganization
}) {
  const params = useParams()
  const slug = (params?.slug as string) || ""
  const { check, permissions } = useMyPermissions(slug)

  const isChildActive = React.useMemo(() => {
    if (disabled) return false
    return Boolean(
      item.items?.some((child) => isItemActive(child, pathname, allItems, searchParams)) ||
      (item.pathPrefix &&
        item.pathSuffix &&
        pathname.startsWith(item.pathPrefix) &&
        (pathname.endsWith(item.pathSuffix) || pathname.includes(item.pathSuffix + "/")))
    )
  }, [item, pathname, allItems, searchParams, disabled])

  const [isOpen, setIsOpen] = React.useState(isChildActive)

  React.useEffect(() => {
    if (isChildActive && !disabled) {
      setIsOpen(true)
    }
  }, [isChildActive, disabled])

  const Icon = item.icon ? iconMap[item.icon] : iconMap.default
  const isAccessControl = item.title === "Access Control"
  const isAclReadOnly = isAccessControl && check("acl:read") && !check("acl:write")

  return (
    <Collapsible
      asChild
      open={disabled ? false : isOpen}
      onOpenChange={disabled ? undefined : setIsOpen}
      className="group/collapsible"
    >
      <SidebarMenuItem className={cn(disabled && "opacity-45 cursor-not-allowed select-none")}>
        <CollapsibleTrigger asChild disabled={disabled}>
          <SidebarMenuButton
            tooltip={item.title}
            isActive={isChildActive}
            className={cn(
              "group/btn relative transition-all duration-200 ease-out",
              disabled && "pointer-events-none hover:bg-transparent text-muted-foreground/60",
              !disabled && !isChildActive && "hover:translate-x-0.5 hover:bg-sidebar-accent/80",
              isChildActive && "bg-primary/8 text-primary font-medium hover:bg-primary/12",
            )}
          >
            {/* Active accent bar */}
            {isChildActive && !isCollapsed && (
              <motion.div
                layoutId="sidebar-active-bar"
                className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-primary"
                initial={{ opacity: 0, scaleY: 0.5 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              />
            )}
            {/* Collapsed mode accent dot */}
            {isChildActive && isCollapsed && (
              <motion.div
                className="absolute -left-0.5 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-primary"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              />
            )}
            {Icon && <Icon className={cn("size-4 transition-colors duration-200", disabled && "text-muted-foreground/40", isChildActive && "text-primary")} />}
            <span>{item.title}</span>
            {isAclReadOnly && (
              <span className="ml-1.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors shrink-0" title="Read-only access">
                <Eye className="size-3.5" />
              </span>
            )}
            <ChevronRight className={cn(
              "ml-auto transition-transform duration-200 shrink-0 size-4",
              isOpen && "rotate-90"
            )} />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        {!disabled && (
          <CollapsibleContent forceMount>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  variants={submenuVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => {
                      if (subItem.title === "Website Verification" && !check("domain:read")) {
                        return null
                      }
                      if (subItem.title === "All Members" && !check("member:read")) {
                        return null
                      }
                      if (subItem.title === "Invitations" && !check("invitation:read")) {
                        return null
                      }
                      if (subItem.title === "Transfer Ownership") {
                        const isOwner = Boolean(
                          currentOrg?.owner?.id &&
                          user?.id &&
                          currentOrg.owner.id === user.id
                        )
                        if (!isOwner) return null
                      }
                      if (subItem.title === "Danger Zone" && !check("lifecycle:manage")) {
                        return null
                      }
                      const SubIcon = subItem.icon ? iconMap[subItem.icon] : null
                      const subIsActive = isItemActive(subItem, pathname, allItems, searchParams)
                      return (
                        <motion.div key={subItem.title} variants={submenuItemVariants}>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              asChild
                              isActive={subIsActive}
                              className={cn(
                                "transition-all duration-200 ease-out",
                                !subIsActive && "hover:translate-x-0.5",
                                subIsActive && "bg-primary/10 text-primary font-semibold hover:bg-primary/15 hover:text-primary"
                              )}
                            >
                              <Link href={subItem.href!}>
                                {SubIcon && <SubIcon className={cn("size-4 text-muted-foreground transition-colors", subIsActive && "text-primary")} />}
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </motion.div>
                      )
                    })}
                  </SidebarMenuSub>
                </motion.div>
              )}
            </AnimatePresence>
          </CollapsibleContent>
        )}
      </SidebarMenuItem>
    </Collapsible>
  )
}

// --- Section renderer ---

function SidebarSection({
  label,
  items,
  pathname,
  searchParams,
  isCollapsed,
  user,
  currentOrg,
}: {
  label: string
  items: SidebarNavItem[]
  pathname: string
  searchParams?: URLSearchParams
  isCollapsed: boolean
  user?: User
  currentOrg?: UserOrganization
}) {
  const params = useParams()
  const slug = (params?.slug as string) || ""
  const { check, permissions } = useMyPermissions(slug)

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60 px-3">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon ? iconMap[item.icon] : iconMap.default
            const isActive = item.href ? isItemActive(item, pathname, items, searchParams) : false

            const isAccessControl = item.title === "Access Control"
            const hasAclRead = isAccessControl ? check("acl:read") : true

            if (isAccessControl && !hasAclRead) {
              return null
            }

            if (item.items?.length) {
              const visibleChildren = item.items.filter((subItem) => {
                if (subItem.title === "Website Verification" && !check("domain:read")) return false
                if (subItem.title === "All Members" && !check("member:read")) return false
                if (subItem.title === "Invitations" && !check("invitation:read")) return false
                if (subItem.title === "Transfer Ownership") {
                  const isOwner = Boolean(
                    currentOrg?.owner?.id &&
                    user?.id &&
                    currentOrg.owner.id === user.id
                  )
                  if (!isOwner) return false
                }
                if (subItem.title === "Danger Zone" && !check("lifecycle:manage")) return false
                return true
              })

              if (visibleChildren.length === 0) return null

              return (
                <CollapsibleSidebarItem
                  key={item.title}
                  item={item}
                  pathname={pathname}
                  allItems={items}
                  searchParams={searchParams}
                  isCollapsed={isCollapsed}
                  user={user}
                  currentOrg={currentOrg}
                />
              )
            }

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive}
                  className={cn(
                    "group/btn relative transition-all duration-200 ease-out",
                    !isActive && "hover:translate-x-0.5 hover:bg-sidebar-accent/80",
                    isActive && "bg-primary/8 text-primary font-medium hover:bg-primary/12",
                  )}
                >
                  <Link href={item.href!}>
                    {/* Active accent bar */}
                    {isActive && !isCollapsed && (
                      <motion.div
                        layoutId="sidebar-active-bar"
                        className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-primary"
                        initial={{ opacity: 0, scaleY: 0.5 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                      />
                    )}
                    {/* Collapsed mode accent dot */}
                    {isActive && isCollapsed && (
                      <motion.div
                        className="absolute -left-0.5 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-primary"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                    {Icon && <Icon className={cn("size-4 transition-colors duration-200", isActive && "text-primary")} />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

// --- Main sidebar ---

export function AppSidebar({ items, className, user, organizationName, organizations, currentOrgId, userRole, slug: propSlug, ...props }: React.ComponentProps<typeof Sidebar> & {
  items: SidebarNavItem[]
  user?: User
  organizationName?: string
  organizations?: UserOrganization[]
  currentOrgId?: string
  userRole?: string
  slug?: string
}) {
  const pathname = usePathname()
  const rawSearchParams = useSearchParams()
  const params = useParams()
  const router = useRouter()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  const slug = propSlug || (params?.slug as string) || ""
  const { check } = useMyPermissions(slug)

  // Local storage synchronization states for dynamic mocking
  const [archivedOrgs, setArchivedOrgs] = React.useState<string[]>([])
  const [deletedOrgs, setDeletedOrgs] = React.useState<string[]>([])

  const syncState = React.useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        const archived = localStorage.getItem("heapdog:archived_orgs")
        const deleted = localStorage.getItem("heapdog:deleted_orgs")
        setArchivedOrgs(archived ? JSON.parse(archived) : [])
        setDeletedOrgs(deleted ? JSON.parse(deleted) : [])
      } catch (e) {
        console.error("Failed to sync sidebar organization states", e)
      }
    }
  }, [])

  React.useEffect(() => {
    syncState()
    if (typeof window !== "undefined") {
      window.addEventListener("heapdog-org-state-change", syncState)
      window.addEventListener("storage", syncState)
      return () => {
        window.removeEventListener("heapdog-org-state-change", syncState)
        window.removeEventListener("storage", syncState)
      }
    }
  }, [syncState])

  const filteredOrganizations = React.useMemo(() => {
    return organizations?.filter((org) => !deletedOrgs.includes(org.slug)) || []
  }, [organizations, deletedOrgs])

  const searchParams = React.useMemo(() => {
    return rawSearchParams ? new URLSearchParams(rawSearchParams.toString()) : undefined
  }, [rawSearchParams])

  // Group items by section
  const workspaceItems = React.useMemo(
    () => items.filter((item) => item.section === "Workspace"),
    [items]
  )
  const administrationItems = React.useMemo(
    () => items.filter((item) => item.section === "Administration"),
    [items]
  )

  const currentOrg = React.useMemo(() => {
    return organizations?.find((org) => org.id === currentOrgId || org.slug === slug)
  }, [organizations, currentOrgId, slug])
  const logoUrl = currentOrg?.logoUrl

  const gradientClass = getOrgGradient(organizationName || "Select Organization")
  const isCurrentOrgArchived = archivedOrgs.includes(slug)

  return (
    <Sidebar
      collapsible="icon"
      className={cn("top-16 h-[calc(100svh-4rem)]", className)}
      {...props}
    >
      {/* --- Organization Header --- */}
      <SidebarHeader className="p-0 border-b border-border/40 dark:border-border/15">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "group/org flex w-full items-center gap-3 px-3 py-3 text-left transition-all duration-300",
                "hover:bg-sidebar-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring",
                isCollapsed ? "justify-center px-2" : "px-4"
              )}
            >
              {/* Org Avatar with hover glow */}
              <div className="relative shrink-0">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={organizationName || "Organization"}
                    className={cn(
                      "aspect-square object-cover rounded-xl shadow-md select-none transition-all duration-300",
                      "group-hover/org:shadow-lg group-hover/org:scale-105",
                      isCollapsed ? "size-9 rounded-lg" : "size-10"
                    )}
                  />
                ) : (
                  <div className={cn(
                    "flex aspect-square items-center justify-center rounded-xl font-bold text-white bg-gradient-to-br shadow-md select-none transition-all duration-300",
                    "group-hover/org:shadow-lg group-hover/org:scale-105",
                    isCollapsed ? "size-9 text-xs rounded-lg" : "size-10 text-sm",
                    gradientClass
                  )}>
                    {getOrgInitials(organizationName || "Select Organization")}
                  </div>
                )}
                
                {/* Collapsed state archived indicator dot */}
                {isCollapsed && isCurrentOrgArchived && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                )}

                {/* Glow effect on hover */}
                <div className={cn(
                  "absolute inset-0 rounded-xl bg-gradient-to-br opacity-0 blur-md transition-opacity duration-300 -z-10",
                  "group-hover/org:opacity-30",
                  gradientClass
                )} />
              </div>

              {/* Org Info */}
              {!isCollapsed && (
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="truncate text-sm font-semibold tracking-tight text-foreground/90 leading-tight">
                    {organizationName || "Organization"}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary border border-primary/15 tracking-wide uppercase select-none">
                      {userRole || "Member"}
                    </span>
                    {isCurrentOrgArchived && (
                      <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/15 tracking-wide uppercase select-none">
                        Archived
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Switcher chevron */}
              {!isCollapsed && (
                <ChevronsUpDown className="size-4 text-muted-foreground/50 shrink-0 transition-colors group-hover/org:text-muted-foreground" />
              )}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              Organizations
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {filteredOrganizations.map((org) => {
              const isOrgArchived = archivedOrgs.includes(org.slug);
              return (
                <DropdownMenuItem
                  key={org.id}
                  className={cn(
                    "gap-3 py-2",
                    org.id === currentOrgId && "bg-primary/5"
                  )}
                  onClick={() => router.push(`/organizations/${org.slug}/dashboard/basic-info`)}
                >
                  {org.logoUrl ? (
                    <img
                      src={org.logoUrl}
                      alt={org.orgName}
                      className="size-7 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className={cn(
                      "flex size-7 items-center justify-center rounded-lg text-[10px] font-bold text-white bg-gradient-to-br flex-shrink-0",
                      getOrgGradient(org.orgName)
                    )}>
                      {getOrgInitials(org.orgName)}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium">{org.orgName}</span>
                      {isOrgArchived && (
                        <span className="inline-flex items-center rounded px-1 py-0.2 text-[9px] font-semibold bg-amber-500/10 text-amber-500 dark:text-amber-450 border border-amber-500/15 uppercase tracking-wide">
                          Archived
                        </span>
                      )}
                    </div>
                    <span className="truncate text-[11px] text-muted-foreground">{org.role}</span>
                  </div>
                  {org.id === currentOrgId && (
                    <Sparkles className="ml-auto size-3.5 text-primary shrink-0" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      {/* --- Navigation --- */}
      <SidebarContent className="gap-0">
        {workspaceItems.length > 0 && (
          <SidebarSection
            label="Workspace"
            items={workspaceItems}
            pathname={pathname}
            searchParams={searchParams}
            isCollapsed={isCollapsed}
            user={user}
            currentOrg={currentOrg}
          />
        )}
        {administrationItems.length > 0 && (
          <>
            <div className="mx-3 my-1">
              <div className="h-px bg-border/40 dark:bg-border/20" />
            </div>
            <SidebarSection
              label="Administration"
              items={administrationItems}
              pathname={pathname}
              searchParams={searchParams}
              isCollapsed={isCollapsed}
              user={user}
              currentOrg={currentOrg}
            />
          </>
        )}
      </SidebarContent>

      {/* --- User Footer --- */}
      <SidebarFooter className="p-0 border-t border-border/40 dark:border-border/15">
        <div className={cn(
          "flex items-center gap-3 px-3 py-3 transition-all duration-300",
          isCollapsed ? "justify-center px-2" : "px-4"
        )}>
          <Avatar className={cn(
            "transition-all duration-300",
            isCollapsed ? "size-8" : "size-9"
          )}>
            {user?.profile_picture && (
              <AvatarImage src={user.profile_picture} alt={getUserDisplayName(user)} />
            )}
            <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
              {getUserInitials(user)}
            </AvatarFallback>
          </Avatar>

          {!isCollapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="truncate text-sm font-medium text-foreground/90 leading-tight">
                {getUserDisplayName(user)}
              </span>
              <span className="truncate text-[11px] text-muted-foreground leading-tight">
                {user?.email || ""}
              </span>
            </div>
          )}

          {!isCollapsed && (
            <Link
              href="/auth/logout"
              className="shrink-0 p-1.5 rounded-md text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-all duration-200"
              title="Sign out"
            >
              <LogOut className="size-4" />
            </Link>
          )}
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
