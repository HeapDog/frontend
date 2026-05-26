"use client"

import { ChevronDown } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface TruncatedBadgesPopoverProps<T> {
  items: T[]
  maxVisible: number
  renderBadge: (item: T) => React.ReactNode
  renderPopoverBadge: (item: T) => React.ReactNode
  emptyLabel?: React.ReactNode
  /** Label for the expand trigger, e.g. "View all 5 tags" */
  expandLabel: string
  /** Optional title shown in popover header */
  popoverTitle?: string
  /** Class for the visible badges container */
  containerClassName?: string
  /** Class for the expand trigger - should match badge/pill style */
  triggerClassName?: string
}

export function TruncatedBadgesPopover<T extends { id: string }>({
  items,
  maxVisible,
  renderBadge,
  renderPopoverBadge,
  emptyLabel = "-",
  expandLabel,
  popoverTitle,
  containerClassName,
  triggerClassName,
}: TruncatedBadgesPopoverProps<T>) {
  if (!items?.length) {
    return <span className="text-muted-foreground text-xs">{emptyLabel}</span>
  }

  const visible = items.slice(0, maxVisible)
  const remaining = items.length - visible.length

  if (remaining <= 0) {
    return (
      <div className={cn("flex flex-wrap gap-1.5 items-center", containerClassName)}>
        {items.map((item) => (
          <span key={item.id}>{renderBadge(item)}</span>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("flex flex-wrap gap-1.5 items-center", containerClassName)}>
      {visible.map((item) => (
        <span key={item.id}>{renderBadge(item)}</span>
      ))}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1 rounded-md border border-input bg-background px-2 py-0.5 text-xs font-normal text-muted-foreground",
              "hover:bg-muted hover:text-foreground hover:border-muted-foreground/30",
              "transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              triggerClassName
            )}
            aria-label={expandLabel}
          >
            <span>+{remaining}</span>
            <ChevronDown className="h-2.5 w-2.5 opacity-70" aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-auto max-w-[280px] p-3"
        >
          {popoverTitle && (
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
              {popoverTitle}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
            {items.map((item) => (
              <span key={item.id}>{renderPopoverBadge(item)}</span>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
