"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { FileText, History } from "lucide-react"

export interface ServerTabItem {
  id: string
  label: string
  href: string
  icon?: "file-text" | "history"
  badge?: string
}

interface ServerTabbedLayoutProps {
  tabs: ServerTabItem[]
  className?: string
}

const iconMap = {
  "file-text": FileText,
  "history": History,
}

export function ServerTabbedLayout({
  tabs,
  className,
}: ServerTabbedLayoutProps) {
  const pathname = usePathname()
  
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => {
          const Icon = tab.icon ? iconMap[tab.icon] : null
          // Exact match: pathname must exactly equal tab.href
          // This ensures /versions/123/revisions doesn't match /versions/123
          const isActive = pathname === tab.href
          
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/20"
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {tab.label}
              {tab.badge && (
                <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {tab.badge}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
