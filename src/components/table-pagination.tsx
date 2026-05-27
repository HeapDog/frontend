"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react"
import type { PaginationMeta } from "@/lib/types/api"

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100] as const

export type SortOrder = "asc" | "desc"

export interface SortFieldOption {
  value: string
  label: string
}

export interface TablePaginationProps {
  meta: PaginationMeta
  /** Base path (no query) for building links. */
  basePath: string
  /** Current searchParams - will be merged when navigating. */
  searchParams: Record<string, string>
  /** Allowed sort fields for the sort dropdown. */
  sortFields: SortFieldOption[]
  /** Current sort field (e.g. "title"). */
  sortField: string | null
  /** Current sort order. */
  sortOrder: SortOrder
  /** Called when user changes page/size/sort - parent should navigate. */
  onNavigate: (params: { page?: number; size?: number; sort?: string }) => void
  /** Number of rows currently selected (for "X of Y selected"). Y = meta.numberOfElements. */
  selectedCount?: number
  /** Clear selection callback. */
  onClearSelection?: () => void
  /** Custom page size options. Default 10,20,30,50,100. */
  pageSizeOptions?: number[]
  /** Put sort + page size in a filter popover instead of inline. */
  useFilterPopover?: boolean
}

export function TablePagination({
  meta,
  basePath,
  searchParams,
  sortFields,
  sortField,
  sortOrder,
  onNavigate,
  selectedCount = 0,
  onClearSelection,
  pageSizeOptions = [...PAGE_SIZE_OPTIONS],
  useFilterPopover = true,
}: TablePaginationProps) {
  const totalPages = Math.max(1, meta.totalPages)
  const pageFromUrl = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1)
  const isOutOfRange = pageFromUrl > totalPages
  const requestedPage = pageFromUrl
  const currentPage = isOutOfRange ? totalPages : Math.min(pageFromUrl, totalPages)
  const totalElements = meta.totalElements
  const numberOfElements = meta.numberOfElements
  const size = meta.size
  const first = meta.first
  const last = meta.last

  const startItem = totalElements === 0 ? 0 : (currentPage - 1) * size + 1
  const endItem = Math.min((currentPage - 1) * size + numberOfElements, totalElements)
  const hasInvalidRange = totalElements > 0 && startItem > endItem

  const handlePageChange = (delta: number) => {
    const next = currentPage + delta
    if (next < 1 || next > totalPages) return
    onNavigate({ page: next })
  }

  const handleSizeChange = (newSize: string) => {
    const n = parseInt(newSize, 10)
    if (!Number.isNaN(n)) onNavigate({ size: n, page: 1 })
  }

  const handleSortChange = (field: string | null, order: SortOrder) => {
    if (!field) return
    onNavigate({ sort: `${field},${order}`, page: 1 })
  }

  const sortContent = (
    <div className="flex flex-col gap-4 min-w-[200px]">
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Sort by</label>
        <Select
          value={sortField ?? ""}
          onValueChange={(v) => handleSortChange(v || null, sortOrder)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select field" />
          </SelectTrigger>
          <SelectContent>
            {sortFields.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Order</label>
        <Select
          value={sortOrder}
          onValueChange={(v) => handleSortChange(sortField ?? sortFields[0]?.value ?? "", v as SortOrder)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Page size</label>
        <Select value={String(size)} onValueChange={handleSizeChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-4">
      <div className="flex flex-wrap items-center gap-3">
        {selectedCount > 0 && (
          <>
            <span className="text-sm text-muted-foreground">
              {selectedCount} of {numberOfElements} row(s) selected.
            </span>
            {onClearSelection && (
              <Button variant="ghost" size="sm" onClick={onClearSelection}>
                Clear selection
              </Button>
            )}
          </>
        )}
        {selectedCount === 0 && (
          <span className="text-sm text-muted-foreground">
            {totalElements === 0
              ? "No rows."
              : isOutOfRange || hasInvalidRange
                ? `Requested page (${requestedPage}) is out of range. There are ${totalPages} page(s) (${totalElements} item${totalElements === 1 ? "" : "s"} total).`
                : `Showing ${startItem}–${endItem} of ${totalElements}.`}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {useFilterPopover ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Sort &amp; size
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto">
              {sortContent}
            </PopoverContent>
          </Popover>
        ) : (
          <>
            <Select value={String(size)} onValueChange={handleSizeChange}>
              <SelectTrigger className="w-[72px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {sortFields.length > 0 && (
              <Select
                value={sortField ? `${sortField},${sortOrder}` : ""}
                onValueChange={(v) => {
                  const [f, o] = v.split(",")
                  if (f && (o === "asc" || o === "desc")) handleSortChange(f, o)
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  {sortFields.flatMap((f) => [
                    <SelectItem key={`${f.value}-asc`} value={`${f.value},asc`}>
                      {f.label} (A→Z)
                    </SelectItem>,
                    <SelectItem key={`${f.value}-desc`} value={`${f.value},desc`}>
                      {f.label} (Z→A)
                    </SelectItem>,
                  ])}
                </SelectContent>
              </Select>
            )}
          </>
        )}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(-1)}
            disabled={first}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[80px] text-center">
            {isOutOfRange
              ? `Page ${requestedPage} of ${totalPages} (out of range)`
              : `Page ${currentPage} of ${totalPages}`}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(1)}
            disabled={last}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
