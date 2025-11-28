"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Info, Users, Settings, Archive, ClipboardList, Trophy, ChevronRight, LayoutDashboard } from "lucide-react"

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
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

const iconMap = {
  "basic-info": Info,
  members: Users,
  settings: Settings,
  "problem-archive": Archive,
  "online-assessment": ClipboardList,
  contest: Trophy,
  default: LayoutDashboard
} as const

export interface SidebarNavItem {
  href?: string
  title: string
  icon?: keyof typeof iconMap
  items?: SidebarNavItem[]
}

export function AppSidebar({ items, className, ...props }: React.ComponentProps<typeof Sidebar> & { items: SidebarNavItem[] }) {
  const pathname = usePathname()

  return (
    <Sidebar 
      collapsible="icon"
      className={cn("top-16 h-[calc(100svh-4rem)]", className)} 
      {...props}
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Manage Organization</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const Icon = item.icon ? iconMap[item.icon] : iconMap.default
                const isActive = item.href ? pathname === item.href : false
                const isChildActive = item.items?.some(
                  (child) => child.href === pathname || (child.href && pathname.startsWith(child.href))
                )

                if (item.items?.length) {
                  return (
                    <Collapsible
                      key={item.title}
                      asChild
                      defaultOpen={isChildActive}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.title} isActive={isChildActive}>
                            {Icon && <Icon />}
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={subItem.href === pathname}
                                >
                                  <Link href={subItem.href!}>
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive}
                    >
                      <Link href={item.href!}>
                        {Icon && <Icon />}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

