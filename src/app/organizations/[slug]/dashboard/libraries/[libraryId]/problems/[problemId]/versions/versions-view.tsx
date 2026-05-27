"use client"

import { useCallback, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ColumnDef,
  ColumnOrderState,
  VisibilityState,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Globe,
  Lock,
  Clock,
  PencilLine,
  Settings2,
  Calendar,
  User,
  Signal,
  Tags,
  FileText,
  Layers,
  Eye,
  Archive,
  History,
  GitFork,
  Trash2,
  MoreHorizontal,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DifficultyBadge } from "@/components/difficulty-badge"
import { type ProblemVersionWithDisplay } from "@/lib/problems"
import { ProblemStatus } from "@/lib/types/problem"
import { toast } from "sonner"
import { useTopLoader } from "nextjs-toploader"
import { TruncatedBadgesPopover } from "@/components/truncated-badges-popover"
import { ShiftWheelScroll } from "@/components/shift-wheel-scroll"
import { TablePagination } from "@/components/table-pagination"
import { PROBLEM_VERSION_SORT_FIELDS } from "@/lib/table-sort"
import { parseSortParam } from "@/lib/table-sort"
import type { PaginationMeta } from "@/lib/types/api"

const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString() : "-")

function formatStatus(status: ProblemStatus) {
  if (status === "PUBLISHED")
    return {
      label: "Published",
      icon: Globe,
      className:
        "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
    }
  if (status === "ARCHIVED")
    return {
      label: "Archived",
      icon: Lock,
      className: "bg-muted text-muted-foreground border-muted-foreground/20",
    }
  return {
    label: "Draft",
    icon: Clock,
    className:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  }
}

const ALLOWED_SORT_FIELDS = new Set(PROBLEM_VERSION_SORT_FIELDS.map((f) => f.value))

interface VersionsTableViewProps {
  versions: ProblemVersionWithDisplay[]
  basePath: string
  problemId: string
  meta?: PaginationMeta
  searchParams?: Record<string, string>
  paginationBasePath: string
}

export function VersionsTableView({
  versions,
  basePath,
  problemId,
  meta: metaProp,
  searchParams: searchParamsProp = {},
  paginationBasePath,
}: VersionsTableViewProps) {
  const router = useRouter()
  const topLoader = useTopLoader()
  const [isPending, startTransition] = useTransition()
  const size = metaProp?.size ?? 20
  const meta = metaProp ?? {
    page: 1,
    size,
    totalPages: Math.max(1, Math.ceil((versions.length || 0) / size)),
    totalElements: versions.length,
    numberOfElements: versions.length,
    first: true,
    last: true,
  }
  const searchParams = searchParamsProp
  const sortParsed = parseSortParam(searchParams.sort ?? null, ALLOWED_SORT_FIELDS)
  const sortField = sortParsed?.field ?? "createdAt"
  const sortOrder = sortParsed?.order ?? "desc"
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    createdAt: false,
    createdByDisplay: false,
    lastUpdatedAt: false,
    lastUpdatedByDisplay: false,
  })
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([])
  const [columnSizing, setColumnSizing] = useState<Record<string, number>>({})

  const latestVersionNumber = useMemo(
    () => Math.max(0, ...versions.map((v) => v.number)),
    [versions]
  )

  const columns = useMemo<ColumnDef<ProblemVersionWithDisplay>[]>(
    () => [
      {
        accessorKey: "number",
        meta: { label: "Version" },
        size: 140,
        minSize: 100,
        header: () => (
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5" />
            Version
          </div>
        ),
        cell: ({ row }) => {
          const num = row.getValue("number") as number
          const isLatest = num === latestVersionNumber
          return (
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">v{num}</span>
              {isLatest && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                  title="Latest version"
                >
                  <Sparkles className="h-3 w-3" />
                  Latest
                </span>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: "title",
        meta: { label: "Title" },
        size: 220,
        minSize: 150,
        header: () => (
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5" />
            Title
          </div>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("title")}</span>
        ),
      },
      {
        accessorKey: "status",
        meta: { label: "Status" },
        size: 120,
        minSize: 100,
        header: () => (
          <div className="flex items-center gap-2">
            <Eye className="h-3.5 w-3.5" />
            Status
          </div>
        ),
        cell: ({ row }) => {
          const status = row.getValue("status") as ProblemStatus
          const info = formatStatus(status)
          const Icon = info.icon
          return (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border",
                info.className
              )}
            >
              <Icon className="w-3 h-3 mr-1" />
              {info.label}
            </span>
          )
        },
      },
      {
        accessorKey: "difficulty",
        meta: { label: "Difficulty" },
        size: 110,
        minSize: 90,
        header: () => (
          <div className="flex items-center gap-2">
            <Signal className="h-3.5 w-3.5" />
            Difficulty
          </div>
        ),
        cell: ({ row }) => (
          <DifficultyBadge difficulty={row.getValue("difficulty")} />
        ),
      },
      {
        accessorKey: "tags",
        meta: { label: "Tags" },
        size: 200,
        minSize: 120,
        header: () => (
          <div className="flex items-center gap-2">
            <Tags className="h-3.5 w-3.5" />
            Tags
          </div>
        ),
        cell: ({ row }) => {
          const tags = row.getValue("tags") as ProblemVersionWithDisplay["tags"]
          return (
            <TruncatedBadgesPopover
              items={tags ?? []}
              maxVisible={3}
              renderBadge={(t) => (
                <Badge variant="outline" className="text-xs font-normal">
                  {t.name}
                </Badge>
              )}
              renderPopoverBadge={(t) => (
                <Badge variant="outline" className="text-xs font-normal">
                  {t.name}
                </Badge>
              )}
              expandLabel={`View all ${tags?.length ?? 0} tags`}
              popoverTitle="Tags"
              containerClassName="max-w-[200px]"
            />
          )
        },
      },
      {
        accessorKey: "languages",
        meta: { label: "Languages" },
        size: 180,
        minSize: 100,
        header: () => (
          <div className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5" />
            Languages
          </div>
        ),
        cell: ({ row }) => {
          const languages = row.getValue("languages") as ProblemVersionWithDisplay["languages"]
          const languagePill = (l: { id: string; version: string }) => (
            <span className="inline-flex rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-mono text-muted-foreground">
              {l.version}
            </span>
          )
          return (
            <TruncatedBadgesPopover
              items={languages ?? []}
              maxVisible={2}
              renderBadge={languagePill}
              renderPopoverBadge={languagePill}
              expandLabel={`View all ${languages?.length ?? 0} languages`}
              popoverTitle="Languages"
              containerClassName="max-w-[180px]"
              triggerClassName="rounded-md bg-muted/50 font-mono text-[11px] font-normal"
            />
          )
        },
      },
      {
        accessorKey: "createdAt",
        meta: { label: "Created" },
        size: 110,
        minSize: 90,
        header: () => (
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            Created
          </div>
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground whitespace-nowrap text-xs">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        accessorKey: "createdByDisplay",
        meta: { label: "Created By" },
        size: 120,
        minSize: 90,
        header: () => (
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5" />
            Created By
          </div>
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">
            {row.original.createdByDisplay}
          </span>
        ),
      },
      {
        accessorKey: "lastUpdatedAt",
        meta: { label: "Last Updated" },
        size: 120,
        minSize: 90,
        header: () => (
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            Last Updated
          </div>
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground whitespace-nowrap text-xs">
            {formatDate(row.original.lastUpdatedAt)}
          </span>
        ),
      },
      {
        accessorKey: "lastUpdatedByDisplay",
        meta: { label: "Last Updated By" },
        size: 140,
        minSize: 100,
        header: () => (
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5" />
            Last Updated By
          </div>
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">
            {row.original.lastUpdatedByDisplay}
          </span>
        ),
      },
      {
        id: "actions",
        meta: { label: "Actions" },
        enableHiding: false,
        size: 40,
        minSize: 40,
        maxSize: 40,
        enableResizing: false,
        header: () => <div className="w-4" aria-hidden />,
        cell: ({ row }) => {
          const version = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Row actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    toast.info("Fork will create a new version based on this version.")
                  }}
                >
                  <GitFork className="mr-2 h-4 w-4" />
                  Fork and edit
                </DropdownMenuItem>
                {version.status === "DRAFT" ? (
                  <DropdownMenuItem asChild>
                    <Link
                      href={`${basePath}/${problemId}/versions/${version.id}/edit/metadata`}
                    >
                      <PencilLine className="mr-2 h-4 w-4" />
                      Edit draft
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem disabled>
                    <PencilLine className="mr-2 h-4 w-4" />
                    Edit draft
                  </DropdownMenuItem>
                )}
                {version.status === "PUBLISHED" ? (
                  <DropdownMenuItem
                    onClick={() => {
                      toast.info("Archive action not yet wired.")
                    }}
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </DropdownMenuItem>
                ) : version.status === "ARCHIVED" ? (
                  <DropdownMenuItem
                    onClick={() => {
                      toast.info("Unarchive action not yet wired.")
                    }}
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Unarchive
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  onClick={() => {
                    topLoader.start()
                    router.push(`${basePath}/${problemId}/versions/${version.id}/view/revisions`)
                  }}
                >
                  <History className="mr-2 h-4 w-4" />
                  Revision history
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    toast.info("Delete action not yet wired.")
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [basePath, problemId, latestVersionNumber]
  )

  const handlePaginationNavigate = useCallback(
    (params: { page?: number; size?: number; sort?: string }) => {
      const next = new URLSearchParams(searchParams)
      if (params.page != null) next.set("page", String(params.page))
      if (params.size != null) next.set("size", String(params.size))
      if (params.sort != null) next.set("sort", params.sort)
      startTransition(() => {
        topLoader.start()
        router.push(`${paginationBasePath}?${next.toString()}`)
      })
    },
    [paginationBasePath, searchParams, router, topLoader]
  )

  const table = useReactTable({
    data: versions,
    columns,
    getRowId: (row) => row.id,
    enableColumnResizing: true,
    columnResizeMode: "onEnd",
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnVisibility,
      columnOrder,
      columnSizing,
    },
  })

  const reorderColumn = useCallback(
    (movingColumnId: string, targetColumnId: string) => {
      const currentOrder = table.getState().columnOrder
      const order = currentOrder.length > 0 ? currentOrder : table.getAllLeafColumns().map((c) => c.id)
      const newOrder = [...order]
      const fromIdx = newOrder.indexOf(movingColumnId)
      const toIdx = newOrder.indexOf(targetColumnId)
      if (fromIdx === -1 || toIdx === -1) return
      newOrder[fromIdx] = targetColumnId
      newOrder[toIdx] = movingColumnId
      setColumnOrder(newOrder)
    },
    [table]
  )

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3">
      <div className="shrink-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              <Settings2 className="mr-2 h-4 w-4" />
              View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter(
                (column) =>
                  typeof column.accessorFn !== "undefined" && column.getCanHide()
              )
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) =>
                    column.toggleVisibility(!!value)
                  }
                >
                  {(column.columnDef.meta as { label?: string } | undefined)
                    ?.label ?? column.id}
                </DropdownMenuCheckboxItem>
              ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setColumnOrder([])}
              disabled={columnOrder.length === 0}
            >
              Reset column order
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="relative flex-1 min-h-0 flex flex-col rounded-md border bg-card overflow-hidden">
        {isPending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/80 backdrop-blur-[1px]" aria-hidden>
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
        <div id="versions-table-scroll" className="flex-1 min-h-0 overflow-auto">
          <ShiftWheelScroll scrollAreaId="versions-table-scroll" />
          <DataTable<ProblemVersionWithDisplay>
            table={table}
            reorderColumn={reorderColumn}
            nonReorderableColumnIds={["actions"]}
            scrollAreaId="versions-table-scroll"
            wrapperClassName="border-0 rounded-none"
            stickyHeader
            onColumnResizeEnd={(columnId, width) =>
              setColumnSizing((prev) => ({ ...prev, [columnId]: width }))
            }
            emptyMessage={
              meta.totalElements > 0 && meta.page > Math.max(1, meta.totalPages)
                ? "Requested page is out of range. Use the pagination controls to go to a valid page."
                : "No versions found."
            }
            tableClassName="w-full min-w-[1200px] table-fixed"
            renderRowWrapper={(row, cells) => {
              const version = row.original
              const versionDetailHref = `${basePath}/${problemId}/versions/${version.id}/view/details`
              return (
                <ContextMenu key={row.id}>
                  <ContextMenuTrigger asChild>
                    <motion.tr
                      data-slot="table-row"
                      className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b border-border/50 transition-colors group cursor-pointer"
                      onClick={(e) => {
                        const target = e.target as HTMLElement
                        if (target.closest("button, a, input, [role='button'], [role='menuitem']")) return
                        topLoader.start()
                        router.push(versionDetailHref)
                      }}
                    >
                      {cells}
                    </motion.tr>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuLabel>Actions</ContextMenuLabel>
                    <ContextMenuItem asChild>
                      <Link href={`${basePath}/${problemId}/versions/${version.id}/view/details`}>
                        <FileText className="mr-2 h-4 w-4" />
                        View details
                      </Link>
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() => {
                        toast.info("Fork will create a new version based on this version.")
                      }}
                    >
                      <GitFork className="mr-2 h-4 w-4" />
                      Fork and edit
                    </ContextMenuItem>
                    {version.status === "DRAFT" ? (
                      <ContextMenuItem asChild>
                        <Link
                          href={`${basePath}/${problemId}/versions/${version.id}/edit/metadata`}
                        >
                          <PencilLine className="mr-2 h-4 w-4" />
                          Edit draft
                        </Link>
                      </ContextMenuItem>
                    ) : (
                      <ContextMenuItem disabled>
                        <PencilLine className="mr-2 h-4 w-4" />
                        Edit draft
                      </ContextMenuItem>
                    )}
                    {version.status === "PUBLISHED" ? (
                      <ContextMenuItem
                        onClick={() => toast.info("Archive action not yet wired.")}
                      >
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                      </ContextMenuItem>
                    ) : version.status === "ARCHIVED" ? (
                      <ContextMenuItem
                        onClick={() => toast.info("Unarchive action not yet wired.")}
                      >
                        <Archive className="mr-2 h-4 w-4" />
                        Unarchive
                      </ContextMenuItem>
                    ) : null}
                    <ContextMenuItem
                      onClick={() => {
                        topLoader.start()
                        router.push(`${basePath}/${problemId}/versions/${version.id}/view/revisions`)
                      }}
                    >
                      <History className="mr-2 h-4 w-4" />
                      Revision history
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      variant="destructive"
                      onClick={() => toast.info("Delete action not yet wired.")}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              )
            }}
          />
        </div>
      </div>
      <div className="shrink-0">
        <TablePagination
          meta={meta}
          basePath={paginationBasePath}
          searchParams={searchParams}
          sortFields={[...PROBLEM_VERSION_SORT_FIELDS]}
          sortField={sortField}
          sortOrder={sortOrder}
          onNavigate={handlePaginationNavigate}
          useFilterPopover={true}
        />
      </div>
    </div>
  )
}
