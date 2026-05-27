"use client"

import * as React from "react"
import { ChevronsUpDown, X } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface Option {
  label: string
  value: string
  description?: string
}

interface MultiSelectProps {
  options: Option[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  modal?: boolean
  /** Max badges to show in trigger before collapsing to "+N more". Omit to show all. */
  maxVisibleBadges?: number
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  className,
  modal = false,
  maxVisibleBadges,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  const handleUnselect = React.useCallback(
    (value: string) => {
      onChange(selected.filter((s) => s !== value))
    },
    [onChange, selected]
  )

  const handleSelect = React.useCallback(
    (value: string) => {
      const newSelected = selected.includes(value)
        ? selected.filter((s) => s !== value)
        : [...selected, value]
      onChange(newSelected)
    },
    [onChange, selected]
  )

  const filteredOptions = React.useMemo(() => {
    if (!inputValue) return options
    const lowerInput = inputValue.toLowerCase()
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(lowerInput) ||
        option.description?.toLowerCase().includes(lowerInput)
    )
  }, [options, inputValue])

  const selectedOptions = React.useMemo(
    () => options.filter((o) => selected.includes(o.value)),
    [options, selected]
  )

  const badgesToShow = React.useMemo(() => {
    if (maxVisibleBadges == null || selectedOptions.length <= maxVisibleBadges)
      return { visible: selectedOptions, overflow: 0 }
    return {
      visible: selectedOptions.slice(0, maxVisibleBadges - 1),
      overflow: selectedOptions.length - (maxVisibleBadges - 1),
    }
  }, [selectedOptions, maxVisibleBadges])

  const selectedFiltered = React.useMemo(
    () => filteredOptions.filter((o) => selected.includes(o.value)),
    [filteredOptions, selected]
  )

  const unselectedFiltered = React.useMemo(
    () => filteredOptions.filter((o) => !selected.includes(o.value)),
    [filteredOptions, selected]
  )

  const handleClear = React.useCallback(() => {
    onChange([])
  }, [onChange])

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          className={cn(
            "group flex min-h-10 w-full flex-wrap items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-[box-shadow,border-color]",
            "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer hover:border-input/80",
            "data-[state=open]:ring-2 data-[state=open]:ring-ring data-[state=open]:ring-offset-2 data-[state=open]:border-transparent",
            className
          )}
          onClick={() => setOpen(!open)}
        >
          <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
            {selected.length === 0 && (
              <span className="text-muted-foreground py-0.5">{placeholder}</span>
            )}
            {badgesToShow.visible.map((option) => (
              <Badge
                key={option.value}
                variant="secondary"
                className="rounded-md px-2 py-0 font-normal text-xs border border-border/60 bg-muted/60 text-foreground hover:bg-muted transition-colors shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  handleUnselect(option.value)
                }}
              >
                {option.label}
                <button
                  type="button"
                  className="ml-1.5 rounded-full p-0.5 outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-1 hover:bg-muted-foreground/20"
                  aria-label={`Remove ${option.label}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      handleUnselect(option.value)
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleUnselect(option.value)
                  }}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            ))}
            {badgesToShow.overflow > 0 && (
              <span className="rounded-md px-2 py-0.5 text-xs text-muted-foreground bg-muted/50 border border-border/50 shrink-0">
                +{badgesToShow.overflow} more
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {selected.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                }}
                className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                aria-label="Clear selection"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            
            {selectedFiltered.length > 0 && (
              <CommandGroup heading="Selected">
                {selectedFiltered.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                    className="cursor-pointer gap-2"
                  >
                    <Checkbox checked className="pointer-events-none shrink-0" />
                    <div className="flex flex-1 min-w-0 flex-col gap-0.5">
                      <span className="truncate font-medium">{option.label}</span>
                      {option.description && (
                        <span className="text-xs text-muted-foreground truncate">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {selectedFiltered.length > 0 && unselectedFiltered.length > 0 && <CommandSeparator />}

            {unselectedFiltered.length > 0 && (
              <CommandGroup heading={selectedFiltered.length > 0 ? "Available" : undefined}>
                {unselectedFiltered.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                    className="cursor-pointer gap-2"
                  >
                    <Checkbox checked={false} className="pointer-events-none shrink-0" />
                    <div className="flex flex-1 min-w-0 flex-col gap-0.5">
                      <span className="truncate font-medium">{option.label}</span>
                      {option.description && (
                        <span className="text-xs text-muted-foreground truncate">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
