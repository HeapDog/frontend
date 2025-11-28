"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, Shield, Settings2, LayoutDashboard } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

const iconMap = {
  profile: User,
  security: Shield,
  account: Settings2,
  default: LayoutDashboard
} as const

export interface SettingsSidebarNavItem {
  href: string
  title: string
  icon: keyof typeof iconMap
}

export function SettingsSidebar({ items, className, ...props }: React.ComponentProps<typeof Sidebar> & { items: SettingsSidebarNavItem[] }) {
  const pathname = usePathname()

  return (
    <Sidebar 
      collapsible="icon"
      className={cn("top-16 h-[calc(100svh-4rem)]", className)} 
      {...props}
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const Icon = iconMap[item.icon] || iconMap.default
                const isActive = pathname === item.href

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive}
                    >
                      <Link href={item.href}>
                        <Icon />
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

