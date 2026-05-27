"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export interface TabItem {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  content: React.ReactNode
  disabled?: boolean
  badge?: string
}

interface TabbedLayoutProps {
  tabs: TabItem[]
  defaultTab?: string
  className?: string
}

export function TabbedLayout({
  tabs,
  defaultTab,
  className,
}: TabbedLayoutProps) {
  const firstEnabledId = tabs.find((t) => !t.disabled)?.id ?? tabs[0]?.id
  const defaultValue = defaultTab ?? firstEnabledId

  return (
    <Tabs defaultValue={defaultValue} className={cn("flex flex-col gap-4", className)}>
      <TabsList className="w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              disabled={tab.disabled}
              className="gap-2"
            >
              {Icon && <Icon className="h-4 w-4" />}
              {tab.label}
              {tab.badge && (
                <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {tab.badge}
                </span>
              )}
            </TabsTrigger>
          )
        })}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="mt-0">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
