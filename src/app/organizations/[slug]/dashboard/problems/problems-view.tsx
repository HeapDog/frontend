"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ColumnDef,
  ColumnOrderState,
  VisibilityState,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { motion } from "framer-motion"
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
  Filter,
  Hash,
  FileText,
  Calendar,
  Clock,
  User,
  Eye,
  Tags,
  Trophy,
  Globe,
  Building2,
  Lock,
  Library,
  MoreHorizontal,
  Maximize2,
  Plus,
  PlusCircle,
  FilePlus2,
  PencilLine,
  Settings2,
  Copy,
  ExternalLink,
  Trash2,
  GitFork,
  Check,
  Layers,
  Send,
  FolderInput,
  Signal,
  AlertTriangle,
  Star,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import { Language, ProblemDifficulty, ProblemLibrary, ProblemStatus, Tag } from "@/lib/types/problem"
import { type ProblemRow } from "@/lib/problems"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { useMutation } from "@tanstack/react-query"
import { useTopLoader } from "nextjs-toploader"
import { DataTable } from "@/components/data-table"
import { ShiftWheelScroll } from "@/components/shift-wheel-scroll"
import { TablePagination } from "@/components/table-pagination"
import { TruncatedBadgesPopover } from "@/components/truncated-badges-popover"
import { DifficultyBadge, formatDifficulty } from "@/components/difficulty-badge"
import { PROBLEM_VERSION_SORT_FIELDS } from "@/lib/table-sort"
import { parseSortParam } from "@/lib/table-sort"
import type { PaginationMeta } from "@/lib/types/api"
import { useMyPermissions } from "@/hooks/use-my-permissions"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

type ProblemStatusValue = ProblemStatus

interface ProblemCreator {
  id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
}

const formatCreator = (creator?: ProblemCreator | null, fallbackId?: string) => {
  if (!creator) {
    return fallbackId || "Unknown"
  }

  const fullName = [creator.firstName, creator.lastName].filter(Boolean).join(" ").trim()
  if (fullName.length > 0) return fullName
  if (creator.username) return creator.username
  if (creator.email) return creator.email
  return fallbackId || "Unknown"
}

function createColumns(
  copiedSlugId: string | null,
  handleCopySlug: (slug: string, problemId: string) => void,
  orgSlug: string,
  libraryId: string,
  canWriteLibrary: boolean
): ColumnDef<ProblemRow>[] {
  return [
    {
      id: "select",
      size: 40,
      minSize: 40,
      maxSize: 40,
      enableResizing: false,
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "slug",
      meta: { label: "Slug" },
      header: () => (
        <div className="flex items-center gap-2">
          <Hash className="h-3.5 w-3.5" />
          Slug
        </div>
      ),
      cell: ({ row }) => {
        const slug = row.getValue("slug") as string
        const problemId = row.original.id
        const isCopied = copiedSlugId === problemId
        return (
          <div className="flex w-full min-w-0 items-center justify-between gap-2 overflow-hidden pe-1">
            <span className="min-w-0 flex-1 truncate font-mono text-xs" title={slug}>
              {slug}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => handleCopySlug(slug, problemId)}
            >
              {isCopied ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              <span className="sr-only">Copy slug</span>
            </Button>
          </div>
        )
      },
      enableHiding: false,
      size: 200,
      minSize: 180,
    },
    {
      accessorKey: "title",
      meta: { label: "Title" },
      header: () => (
        <div className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5" />
          Title
        </div>
      ),
      cell: ({ row }) => {
        const title = row.getValue("title") as string | null
        const displayTitle = title || "Untitled"
        return (
          <div className="flex items-center gap-2 max-w-[400px]">
            <span className="truncate" title={displayTitle}>
              {displayTitle.length > 100
                ? `${displayTitle.substring(0, 100)}...`
                : displayTitle}
            </span>
            {displayTitle.length > 100 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                    <Maximize2 className="h-3 w-3" />
                    <span className="sr-only">Show full title</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-4 text-sm">
                  <h4 className="font-medium mb-2">Full Title</h4>
                  <p>{displayTitle}</p>
                </PopoverContent>
              </Popover>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "versionNumber",
      meta: { label: "Latest Version" },
      header: () => (
        <div className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5" />
          Latest Version
        </div>
      ),
      cell: ({ row }) => {
        const version = row.getValue("versionNumber") as number | null
        if (version == null) return <span className="text-muted-foreground text-xs italic">-</span>
        return (
          <span className="font-mono text-xs">
            v{version}
          </span>
        )
      },
      size: 130,
      minSize: 110,
    },
    {
      accessorKey: "publishedVersionId",
      meta: { label: "Published Version" },
      header: () => (
        <div className="flex items-center gap-2">
          <Send className="h-3.5 w-3.5" />
          Published Version
        </div>
      ),
      cell: ({ row }) => {
        const publishedVersionId = row.getValue("publishedVersionId") as string | null
        if (!publishedVersionId) {
          return <span className="text-muted-foreground text-xs italic">Not published</span>
        }
        const shortId = `${publishedVersionId.slice(0, 8)}…`
        return (
          <span className="font-mono text-xs" title={publishedVersionId}>
            {shortId}
          </span>
        )
      },
      size: 150,
      minSize: 130,
    },
    {
      accessorKey: "status",
      meta: { label: "Status" },
      header: () => (
        <div className="flex items-center gap-2">
          <Eye className="h-3.5 w-3.5" />
          Status
        </div>
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as ProblemStatusValue
        const commonClasses =
          "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border"

        if (status === "PUBLISHED") {
          return (
            <span
              className={cn(
                commonClasses,
                "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
              )}
            >
              <Globe className="w-3 h-3 mr-1" />
              Published
            </span>
          )
        }

        if (status === "ARCHIVED") {
          return (
            <span
              className={cn(
                commonClasses,
                "bg-muted text-muted-foreground border-muted-foreground/20"
              )}
            >
              <Lock className="w-3 h-3 mr-1" />
              Archived
            </span>
          )
        }

        return (
          <span
            className={cn(
              commonClasses,
              "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
            )}
          >
            <Clock className="w-3 h-3 mr-1" />
            Draft
          </span>
        )
      },
    },
    {
      accessorKey: "difficulty",
      meta: { label: "Difficulty" },
      header: () => (
        <div className="flex items-center gap-2">
          <Signal className="h-3.5 w-3.5" />
          Difficulty
        </div>
      ),
      cell: ({ row }) => {
        const difficulty = row.getValue("difficulty") as string | undefined
        return <DifficultyBadge difficulty={difficulty} />
      },
      size: 110,
      minSize: 90,
    },
    {
      accessorKey: "tags",
      meta: { label: "Tags" },
      header: () => (
        <div className="flex items-center gap-2">
          <Tags className="h-3.5 w-3.5" />
          Tags
        </div>
      ),
      cell: ({ row }) => {
        const tags = (row.getValue("tags") as Tag[] | null) || []
        if (tags.length === 0) return <span className="text-muted-foreground text-xs italic">-</span>
        return (
          <TruncatedBadgesPopover
            items={tags}
            maxVisible={3}
            renderBadge={(tag) => (
              <Badge variant="outline" className="text-xs font-normal">
                {tag.name}
              </Badge>
            )}
            renderPopoverBadge={(tag) => (
              <Badge variant="outline" className="text-xs font-normal">
                {tag.name}
              </Badge>
            )}
            expandLabel={`View all ${tags.length} tags`}
            popoverTitle="Tags"
            containerClassName="max-w-[300px]"
          />
        )
      },
    },
    {
      accessorKey: "languages",
      meta: { label: "Languages" },
      header: () => (
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5" />
          Languages
        </div>
      ),
      cell: ({ row }) => {
        const languages = (row.getValue("languages") as Language[] | null) || []
        if (languages.length === 0) return <span className="text-muted-foreground text-xs italic">-</span>
        const languagePill = (lang: Language) => (
          <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-mono text-muted-foreground">
            {lang.version}
          </span>
        )
        return (
          <TruncatedBadgesPopover
            items={languages}
            maxVisible={2}
            renderBadge={languagePill}
            renderPopoverBadge={languagePill}
            expandLabel={`View all ${languages.length} languages`}
            popoverTitle="Languages"
            containerClassName="max-w-[260px]"
            triggerClassName="rounded-md bg-muted/50 font-mono text-[11px] font-normal"
          />
        )
      },
    },
    {
      accessorKey: "createdAt",
      meta: { label: "Created" },
      header: () => (
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5" />
          Created
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-muted-foreground whitespace-nowrap text-xs">
          {row.getValue("createdAt") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "createdBy",
      meta: { label: "Created By" },
      header: () => (
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5" />
          Created By
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-muted-foreground text-xs">
          {row.getValue("createdBy") || "-"}
        </div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      size: 40,
      minSize: 40,
      maxSize: 40,
      enableResizing: false,
      header: () => <div className="w-4" aria-hidden />,
      cell: ({ row }) => {
        const problem = row.original
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
                disabled={!canWriteLibrary}
                onClick={() => {
                  if (canWriteLibrary) {
                    toast.info("Fork and edit will create a new version based on the published version.")
                  }
                }}
              >
                <GitFork className="mr-2 h-4 w-4" />
                Fork and edit
              </DropdownMenuItem>
              {problem.versionId && problem.status === "DRAFT" ? (
                <DropdownMenuItem asChild disabled={!canWriteLibrary}>
                  <Link
                    href={canWriteLibrary ? `/organizations/${orgSlug}/dashboard/libraries/${libraryId}/problems/${problem.id}/versions/${problem.versionId}/edit/metadata` : "#"}
                    className={cn(!canWriteLibrary && "pointer-events-none opacity-50")}
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
              <DropdownMenuItem asChild>
                <Link
                  href={`/organizations/${orgSlug}/dashboard/libraries/${libraryId}/problems/${problem.id}/versions`}
                >
                  <Layers className="mr-2 h-4 w-4" />
                  Manage versions
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={!canWriteLibrary}
                onClick={() => {
                  if (canWriteLibrary) {
                    toast.info("Delete action not yet wired to a specific API call.")
                  }
                }}
                className={cn(
                  "text-destructive focus:text-destructive",
                  !canWriteLibrary && "opacity-50 pointer-events-none"
                )}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}


const ALLOWED_SORT_FIELDS = new Set(PROBLEM_VERSION_SORT_FIELDS.map((f) => f.value))

interface ProblemsViewProps {
  slug: string
  libraries: ProblemLibrary[]
  initialLibraryId?: string
  initialProblems?: ProblemRow[]
  meta?: PaginationMeta
  searchParams?: Record<string, string>
  defaultLibraryId?: string
  hasDefaultLibraryAccessDenied?: boolean
  isNoDefaultLibrary?: boolean
}

export function ProblemsView({ 
  slug, 
  libraries, 
  initialLibraryId, 
  initialProblems, 
  meta: metaProp, 
  searchParams: searchParamsProp = {},
  defaultLibraryId,
  hasDefaultLibraryAccessDenied = false,
  isNoDefaultLibrary = false
}: ProblemsViewProps) {
  const router = useRouter()
  const topLoader = useTopLoader()
  const [isPending, startTransition] = useTransition()
  const NONE_LIBRARY_VALUE = "__none__"

  const { check, isLoading: isPermissionsLoading, permissions } = useMyPermissions(slug)

  const meta = metaProp ?? {
    page: 1,
    size: 20,
    totalPages: 1,
    totalElements: initialProblems?.length ?? 0,
    numberOfElements: initialProblems?.length ?? 0,
    first: true,
    last: true,
  }
  const searchParams = searchParamsProp
  const sortParsed = parseSortParam(searchParams.sort ?? null, ALLOWED_SORT_FIELDS)
  const sortField = sortParsed?.field ?? "createdAt"
  const sortOrder = sortParsed?.order ?? "desc"
  const [librariesState, setLibrariesState] = useState<ProblemLibrary[]>(
    libraries ?? []
  )
  const [currentDefaultId, setCurrentDefaultId] = useState<string | undefined>(
    defaultLibraryId
  )
  const [isLibraryIdCopied, setIsLibraryIdCopied] = useState(false)
  const [gateModalMode, setGateModalMode] = useState<"select" | "create">(
    libraries.length > 0 ? "select" : "create"
  )
  const effectiveInitialId =
    initialLibraryId && (libraries ?? []).some((l) => l.id === initialLibraryId)
      ? initialLibraryId
      : (libraries ?? [])[0]?.id ?? NONE_LIBRARY_VALUE
  const [selectedLibraryId, setSelectedLibraryId] = useState<string>(
    effectiveInitialId
  )

  // While permissions are loading, default to true to avoid a flash of restricted UI
  const hasLibraryWrite = isPermissionsLoading
    ? true
    : selectedLibraryId && selectedLibraryId !== NONE_LIBRARY_VALUE
      ? check("library:write", selectedLibraryId)
      : false

  // Library creation is an org-level action; gate on admin/owner status
  const canCreateLibrary = isPermissionsLoading
    ? true
    : Boolean(permissions?.isOwner || permissions?.isAdmin || check("library:write"))

  const selectedLibrary = useMemo(
    () => librariesState.find((l) => l.id === selectedLibraryId) || null,
    [librariesState, selectedLibraryId]
  )

  useEffect(() => {
    if (selectedLibraryId === NONE_LIBRARY_VALUE && librariesState.length > 0) {
      setSelectedLibraryId(librariesState[0].id)
    }
  }, [librariesState, selectedLibraryId, NONE_LIBRARY_VALUE])

  useEffect(() => {
    if (
      initialLibraryId &&
      librariesState.some((l) => l.id === initialLibraryId) &&
      selectedLibraryId !== initialLibraryId
    ) {
      setSelectedLibraryId(initialLibraryId)
    }
  }, [initialLibraryId, librariesState, selectedLibraryId])

  const [isCreateLibraryOpen, setIsCreateLibraryOpen] = useState(false)
  const [newLibraryName, setNewLibraryName] = useState("")
  const [newLibraryDescription, setNewLibraryDescription] = useState("")

  const [isEditLibraryOpen, setIsEditLibraryOpen] = useState(false)
  const [editLibraryName, setEditLibraryName] = useState("")
  const [editLibraryDescription, setEditLibraryDescription] = useState("")

  const [isDeleteLibraryOpen, setIsDeleteLibraryOpen] = useState(false)

  const [isAccessDeniedDialogOpen, setIsAccessDeniedDialogOpen] = useState(
    Boolean(hasDefaultLibraryAccessDenied)
  )
  const [newDefaultLibraryId, setNewDefaultLibraryId] = useState<string>(
    libraries[0]?.id || ""
  )

  const { mutate: setDefaultLibrary, isPending: isSettingDefault } = useMutation({
    mutationFn: async (libraryId: string) => {
      const response = await fetch(
        `/api/organizations/${encodeURIComponent(slug)}/problem-libraries/${encodeURIComponent(libraryId)}/default`,
        {
          method: "PUT",
        }
      )
      const data = await response.json()
      if (!response.ok) {
        throw { status: response.status, data }
      }
      return data
    },
    onSuccess: (data, libraryId) => {
      setCurrentDefaultId(libraryId)
      toast.success("Default library updated!")
      if (isAccessDeniedDialogOpen) {
        setIsAccessDeniedDialogOpen(false)
        router.push(`/organizations/${slug}/dashboard/libraries/${libraryId}/problems`)
      }
    },
    onError: (error: any) => {
      console.error("Error setting default library:", error)
      const message =
        error?.data?.message ||
        error?.message ||
        "Failed to update default library."
      toast.error(message)
    }
  })


  const { mutate: createLibrary, isPending: isCreatingLibrary } = useMutation({
    mutationFn: async (values: { name: string; description?: string }) => {
      const response = await fetch(
        `/api/organizations/${encodeURIComponent(slug)}/problem-libraries`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        }
      )

      const data = await response.json()
      if (!response.ok) {
        throw { status: response.status, data }
      }

      return data as { data?: ProblemLibrary }
    },
    onSuccess: (payload) => {
      const created = payload?.data
      if (!created?.id) {
        toast.error("Library created, but response was unexpected.")
        return
      }

      setLibrariesState((prev) => {
        if (prev.some((l) => l.id === created.id)) return prev
        return [...prev, created]
      })
      setIsCreateLibraryOpen(false)
      setNewLibraryName("")
      setNewLibraryDescription("")
      toast.success("Problem library created!")

      if (isAccessDeniedDialogOpen && isNoDefaultLibrary) {
        setDefaultLibrary(created.id)
      } else {
        router.push(
          `/organizations/${slug}/dashboard/libraries/${created.id}/problems`
        )
      }
    },
    onError: (error: any) => {
      console.error("Error creating problem library:", error)
      const message =
        error?.data?.message ||
        error?.message ||
        "Failed to create library. Please try again."
      toast.error(message)
    },
  })

  const { mutate: updateLibrary, isPending: isUpdatingLibrary } = useMutation({
    mutationFn: async (values: {
      libraryId: string
      name: string
      description: string | null
    }) => {
      const response = await fetch(
        `/api/organizations/${encodeURIComponent(slug)}/problem-libraries/${encodeURIComponent(values.libraryId)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: values.name,
            description: values.description,
          }),
        }
      )

      const data = await response.json()
      if (!response.ok) {
        throw { status: response.status, data }
      }

      return data as { data?: ProblemLibrary }
    },
    onSuccess: (payload) => {
      const updated = payload?.data
      if (!updated?.id) {
        toast.error("Library updated, but response was unexpected.")
        return
      }

      setLibrariesState((prev) =>
        prev.map((l) => (l.id === updated.id ? updated : l))
      )
      setIsEditLibraryOpen(false)
      toast.success("Library updated!")
    },
    onError: (error: any) => {
      console.error("Error updating problem library:", error)
      const message =
        error?.data?.message ||
        error?.message ||
        "Failed to update library. Please try again."
      toast.error(message)
    },
  })
  const { mutate: deleteLibrary, isPending: isDeletingLibrary } = useMutation({
    mutationFn: async (libraryId: string) => {
      const response = await fetch(
        `/api/organizations/${encodeURIComponent(slug)}/problem-libraries/${encodeURIComponent(libraryId)}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw { status: response.status, data }
      }

      return libraryId
    },
    onSuccess: (deletedId) => {
      setLibrariesState((prev) => {
        const next = prev.filter((l) => l.id !== deletedId)
        if (selectedLibraryId === deletedId) {
          setSelectedLibraryId(next.length > 0 ? next[0].id : NONE_LIBRARY_VALUE)
        }
        return next
      })
      setIsDeleteLibraryOpen(false)
      toast.success("Library deleted!")
    },
    onError: (error: any) => {
      console.error("Error deleting problem library:", error)
      const message =
        error?.data?.message ||
        error?.message ||
        "Failed to delete library. Please try again."
      toast.error(message)
    },
  })

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    publishedVersionId: false,
    createdAt: false,
    createdBy: false,
  })
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([])
  const [columnSizing, setColumnSizing] = useState<Record<string, number>>({})
  const [rowSelection, setRowSelection] = useState({})
  const [copiedSlugId, setCopiedSlugId] = useState<string | null>(null)

  const basePath = `/organizations/${slug}/dashboard/libraries/${selectedLibraryId}/problems`
  const handlePaginationNavigate = useCallback(
    (params: { page?: number; size?: number; sort?: string }) => {
      const next = new URLSearchParams(searchParams)
      if (params.page != null) next.set("page", String(params.page))
      if (params.size != null) next.set("size", String(params.size))
      if (params.sort != null) next.set("sort", params.sort)
      else next.delete("sort")
      topLoader.start()
      startTransition(() => {
        router.push(`${basePath}?${next.toString()}`)
      })
    },
    [basePath, searchParams, router, topLoader]
  )

  const handleCopySlug = useCallback((slug: string, problemId: string) => {
    navigator.clipboard.writeText(slug).then(() => {
      setCopiedSlugId(problemId)
      toast.success("Copied to clipboard")
      setTimeout(() => setCopiedSlugId(null), 2000)
    }).catch(() => {
      toast.error("Failed to copy")
    })
  }, [])

  const hasSelection = Object.keys(rowSelection).length > 0

  const columns = useMemo(
    () => createColumns(copiedSlugId, handleCopySlug, slug, selectedLibraryId, hasLibraryWrite),
    [copiedSlugId, handleCopySlug, slug, selectedLibraryId, hasLibraryWrite]
  )

  const problems = initialProblems ?? []

  const table = useReactTable({
    data: problems,
    columns,
    getRowId: (row) => row.id,
    enableRowSelection: true,
    enableColumnResizing: true,
    columnResizeMode: "onEnd",
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      columnVisibility,
      columnOrder,
      columnSizing,
      rowSelection,
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
      // Swap: moving column takes target's position, target takes moving column's position
      newOrder[fromIdx] = targetColumnId
      newOrder[toIdx] = movingColumnId
      setColumnOrder(newOrder)
    },
    [table]
  )

  const selectValue =
    selectedLibraryId === NONE_LIBRARY_VALUE ? undefined : selectedLibraryId

  const canCreateProblem =
    librariesState.length > 0 &&
    selectedLibraryId !== NONE_LIBRARY_VALUE &&
    hasLibraryWrite

  const newProblemHref = canCreateProblem
    ? `/organizations/${slug}/dashboard/libraries/${selectedLibraryId}/problems/new/metadata`
    : `/organizations/${slug}/dashboard/libraries/select/problems`

  return (
    <div className="min-w-0 flex flex-col gap-4 h-[calc(100vh-11rem)]">
      <div className="shrink-0 space-y-4">
        {/* Title & Library Selector */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.08)]">
                <Library className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight">Problem Libraries</h1>
            </div>

            {librariesState.length > 0 && (
              <div className="flex items-center gap-2">
                <Select
                  value={selectValue}
                  onValueChange={(value) => {
                    if (value && value !== NONE_LIBRARY_VALUE) {
                      router.push(
                        `/organizations/${slug}/dashboard/libraries/${value}/problems`
                      )
                    } else {
                      setSelectedLibraryId(value)
                    }
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[220px] font-medium transition-all duration-200 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                    <SelectValue placeholder="Select library" />
                  </SelectTrigger>
                  <SelectContent>
                    {librariesState.map((lib) => (
                      <SelectItem key={lib.id} value={lib.id}>
                        {lib.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {canCreateLibrary && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-foreground border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 rounded-md"
                    onClick={() => {
                      setNewLibraryName("")
                      setNewLibraryDescription("")
                      setIsCreateLibraryOpen(true)
                    }}
                    title="Create new library"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {librariesState.length > 0 && canCreateProblem && (
              <Button asChild className="shadow-xs bg-indigo-600 hover:bg-indigo-500 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 transition-all duration-200">
                <Link href={newProblemHref}>
                  <FilePlus2 className="mr-2 h-4 w-4" />
                  New Problem
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Selected Library Meta Details Panel */}
        {selectedLibrary && (
          <div className="relative overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 bg-linear-to-b from-white to-neutral-50/50 dark:from-neutral-950 dark:to-neutral-950/20 p-5 shadow-xs transition-all duration-300">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between relative z-10">
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
                    {selectedLibrary.name}
                  </h2>

                  {selectedLibrary.id === currentDefaultId ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]">
                      <Star className="h-3 w-3 fill-emerald-600 dark:fill-emerald-400" />
                      Default Library
                    </span>
                  ) : (
                    hasLibraryWrite && (
                      <button
                        type="button"
                        onClick={() => setDefaultLibrary(selectedLibrary.id)}
                        disabled={isSettingDefault}
                        className="inline-flex items-center gap-1 rounded-full bg-neutral-100 hover:bg-indigo-500/10 hover:text-indigo-600 dark:bg-neutral-900 px-2 py-0.5 text-xs font-medium text-muted-foreground border border-neutral-200 dark:border-neutral-800 transition-all duration-200 cursor-pointer disabled:pointer-events-none disabled:opacity-50"
                        title="Set this library as your default library"
                      >
                        <Star className="h-3 w-3" />
                        {isSettingDefault ? "Setting..." : "Set as Default"}
                      </button>
                    )
                  )}
                </div>

                <p className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap leading-relaxed">
                  {selectedLibrary.description || (
                    <span className="text-neutral-400 dark:text-neutral-500 italic">
                      No description provided. Click edit to add a description.
                    </span>
                  )}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground font-normal">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      {problems.length}
                    </span>
                    <span>{problems.length === 1 ? "problem" : "problems"}</span>
                  </div>
                  {selectedLibrary.createdAt && (
                    <div className="flex items-center gap-1">
                      <span className="text-neutral-300 dark:text-neutral-800">•</span>
                      <span>Created {new Date(selectedLibrary.createdAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  {selectedLibrary.createdBy && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-300 dark:text-neutral-800">•</span>
                      <span>by</span>
                      <div className="inline-flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800/80 rounded-full pl-1 pr-2 py-0.5 text-xs text-neutral-800 dark:text-neutral-200 font-medium select-none shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-all duration-200">
                        <Avatar className="h-4 w-4 rounded-full border border-white dark:border-neutral-950">
                          {selectedLibrary.createdBy.pictureUrl ? (
                            <AvatarImage src={selectedLibrary.createdBy.pictureUrl} alt={selectedLibrary.createdBy.username} />
                          ) : null}
                          <AvatarFallback className="text-[8px] bg-indigo-500/20 text-indigo-500 rounded-full font-bold flex items-center justify-center">
                            {selectedLibrary.createdBy.firstName && selectedLibrary.createdBy.lastName
                              ? `${selectedLibrary.createdBy.firstName[0]}${selectedLibrary.createdBy.lastName[0]}`.toUpperCase()
                              : selectedLibrary.createdBy.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {selectedLibrary.createdBy.firstName && selectedLibrary.createdBy.lastName
                            ? `${selectedLibrary.createdBy.firstName} ${selectedLibrary.createdBy.lastName}`
                            : selectedLibrary.createdBy.username}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {hasLibraryWrite && (
                <div className="flex items-center gap-1.5 self-end sm:self-start">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedLibrary.id).then(() => {
                        setIsLibraryIdCopied(true)
                        toast.success("Library ID copied to clipboard!")
                        setTimeout(() => setIsLibraryIdCopied(false), 2000)
                      })
                    }}
                    title="Copy Library ID"
                  >
                    {isLibraryIdCopied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span className="hidden md:inline ml-1">{isLibraryIdCopied ? "Copied" : "Copy ID"}</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                    onClick={() => {
                      setEditLibraryName(selectedLibrary.name)
                      setEditLibraryDescription(selectedLibrary.description || "")
                      setIsEditLibraryOpen(true)
                    }}
                    title="Edit library"
                  >
                    <PencilLine className="h-3.5 w-3.5" />
                    <span className="hidden md:inline ml-1">Edit</span>
                  </Button>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={problems.length > 0}
                          className="h-8 text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive dark:border-destructive/30 dark:hover:bg-destructive/20 disabled:opacity-50"
                          onClick={() => setIsDeleteLibraryOpen(true)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="hidden md:inline ml-1">Delete</span>
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {problems.length > 0 && (
                      <TooltipContent side="bottom" className="max-w-[280px]">
                        Cannot delete a library that contains problems. Move or delete the problems first.
                      </TooltipContent>
                    )}
                  </Tooltip>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {librariesState.length === 0 && (
        <div className="flex-1 flex items-center justify-center p-4 bg-radial from-indigo-500/5 via-transparent to-transparent">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative overflow-hidden max-w-2xl w-full rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-xl p-8 md:p-12 shadow-xl text-center space-y-6"
          >
            {/* Glowing radial ornament */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

            <div className="flex flex-col items-center gap-4 relative z-10">
              {/* Ultra-premium float-animated icon ring */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="flex size-16 items-center justify-center rounded-2xl bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
              >
                <Library className="h-8 w-8" />
              </motion.div>

              <div className="space-y-2 max-w-lg">
                <h3 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                  Initialize Your Knowledge Space
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Libraries act as isolated workspaces to catalog mock questions, team interviews, and assessment blueprints. Create one now to begin your engineering journey.
                </p>
              </div>
            </div>

            {canCreateLibrary && (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-block relative z-10"
              >
                <Button
                  type="button"
                  size="lg"
                  className="bg-linear-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium shadow-md shadow-indigo-500/10 border-0 transition-all duration-300"
                  onClick={() => {
                    setNewLibraryName("")
                    setNewLibraryDescription("")
                    setIsCreateLibraryOpen(true)
                  }}
                >
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Create First Library
                </Button>
              </motion.div>
            )}

            {/* Premium feature overview grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-neutral-100 dark:border-neutral-900 text-left text-xs">
              <div className="space-y-1.5">
                <div className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-indigo-500" />
                  Isolated Workspaces
                </div>
                <p className="text-muted-foreground leading-normal">Keep coding, system design, and SRE scenarios organized separately.</p>
              </div>
              <div className="space-y-1.5">
                <div className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-indigo-500" />
                  Version Control
                </div>
                <p className="text-muted-foreground leading-normal">Track versions, drafts, revisions, and roll back changes instantly.</p>
              </div>
              <div className="space-y-1.5">
                <div className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-indigo-500" />
                  Team Collaboration
                </div>
                <p className="text-muted-foreground leading-normal">Assign permissions, role-based controls, and share across your organization.</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {librariesState.length > 0 && (
        <div className="flex-1 min-h-0 flex flex-col gap-3">
          <div className="shrink-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
            <Button variant="outline" disabled>
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
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
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {(column.columnDef.meta as { label?: string } | undefined)?.label ?? column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
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

          {table.getSelectedRowModel().rows.length > 0 && (
            <div className="flex items-center gap-3 rounded-md border bg-muted/50 px-4 py-2">
              <span className="text-sm font-medium">
                {table.getSelectedRowModel().rows.length} selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={!hasLibraryWrite}
                  onClick={() => {
                    if (hasLibraryWrite) {
                      // TODO: wire to bulk delete API
                      toast.info("Bulk delete will be wired to API.")
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasLibraryWrite}
                      onClick={() => {
                        if (hasLibraryWrite) {
                          // TODO: wire to bulk move API
                          toast.info("Bulk move will be wired to API.")
                        }
                      }}
                    >
                      <FolderInput className="mr-2 h-4 w-4" />
                      Move
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[280px]">
                    <p>Move selected problems to another library.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => table.resetRowSelection()}
              >
                Clear selection
              </Button>
            </div>
          )}
          <div className="relative flex-1 min-h-0 flex flex-col rounded-md border bg-card overflow-hidden">
            {isPending && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/80 backdrop-blur-[1px]" aria-hidden>
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}
            <div id="problems-table-scroll" className="flex-1 min-h-0 overflow-auto">
              <ShiftWheelScroll scrollAreaId="problems-table-scroll" />
              <DataTable<ProblemRow>
                table={table}
                reorderColumn={reorderColumn}
                nonReorderableColumnIds={["select", "actions"]}
                scrollAreaId="problems-table-scroll"
                wrapperClassName="border-0 rounded-none"
                stickyHeader
                onColumnResizeEnd={(columnId, width) =>
                  setColumnSizing((prev) => ({ ...prev, [columnId]: width }))
                }
                emptyMessage={
                  meta.totalElements > 0 && meta.page > Math.max(1, meta.totalPages)
                    ? "Requested page is out of range. Use the pagination controls to go to a valid page."
                    : "No results."
                }
                renderRowWrapper={(row, cells) => {
                  const problem = row.original
                  return (
                    <ContextMenu key={row.id}>
                      <ContextMenuTrigger asChild>
                        <motion.tr
                          data-slot="table-row"
                          data-state={row.getIsSelected() && "selected"}
                          className={cn(
                            "hover:bg-muted/50 data-[state=selected]:bg-muted border-b border-border/50 transition-colors",
                            row.getIsSelected() && "bg-muted",
                            "group cursor-pointer"
                          )}
                          onClick={(e) => {
                            const target = e.target as HTMLElement
                            if (target.closest("button, a, input, [role='button'], [role='menuitem'], [role='checkbox']")) return
                            topLoader.start()
                            router.push(`/organizations/${slug}/dashboard/libraries/${selectedLibraryId}/problems/${problem.id}/versions`)
                          }}
                        >
                          {cells}
                        </motion.tr>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuLabel>Actions</ContextMenuLabel>
                        <ContextMenuItem
                          disabled={!hasLibraryWrite}
                          onClick={() => {
                            if (hasLibraryWrite) {
                              toast.info("Fork and edit will create a new version based on the published version.")
                            }
                          }}
                        >
                          <GitFork className="mr-2 h-4 w-4" />
                          Fork and edit
                        </ContextMenuItem>
                        {problem.versionId && problem.status === "DRAFT" && hasLibraryWrite ? (
                          <ContextMenuItem asChild>
                            <Link
                              href={`/organizations/${slug}/dashboard/libraries/${selectedLibraryId}/problems/${problem.id}/versions/${problem.versionId}/edit/metadata`}
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
                        <ContextMenuItem asChild>
                          <Link
                            href={`/organizations/${slug}/dashboard/libraries/${selectedLibraryId}/problems/${problem.id}/versions`}
                          >
                            <Layers className="mr-2 h-4 w-4" />
                            Manage versions
                          </Link>
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                          disabled={!hasLibraryWrite}
                          onClick={() => {
                            if (hasLibraryWrite) {
                              toast.info("Delete action not yet wired to a specific API call.")
                            }
                          }}
                          className="text-destructive focus:text-destructive"
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
          {selectedLibraryId && selectedLibraryId !== NONE_LIBRARY_VALUE && (
            <div className="shrink-0">
              <TablePagination
                meta={meta}
                basePath={basePath}
                searchParams={searchParams}
                sortFields={[...PROBLEM_VERSION_SORT_FIELDS]}
                sortField={sortField}
                sortOrder={sortOrder}
                onNavigate={handlePaginationNavigate}
                selectedCount={table.getSelectedRowModel().rows.length}
                onClearSelection={() => table.resetRowSelection()}
                useFilterPopover={true}
              />
            </div>
          )}
        </div>
      )}

      {/* Global Dialogs & Modals */}
      <Dialog open={isCreateLibraryOpen} onOpenChange={setIsCreateLibraryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create problem library</DialogTitle>
            <DialogDescription>
              Add a new library to organize your problems.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()

              const name = newLibraryName.trim()
              const descriptionRaw = newLibraryDescription.trim()

              if (!name) {
                toast.error("Library name is required.")
                return
              }

              if (
                descriptionRaw.length > 0 &&
                (descriptionRaw.length < 8 || descriptionRaw.length > 1024)
              ) {
                toast.error("Description must be 8–1024 characters (or empty).")
                return
              }

              createLibrary({
                name,
                ...(descriptionRaw.length > 0
                  ? { description: descriptionRaw }
                  : {}),
              })
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="library-name">Name</Label>
              <Input
                id="library-name"
                value={newLibraryName}
                onChange={(e) => setNewLibraryName(e.target.value)}
                placeholder="e.g. sre"
                disabled={isCreatingLibrary}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="library-description">Description (optional)</Label>
              <Textarea
                id="library-description"
                value={newLibraryDescription}
                onChange={(e) => setNewLibraryDescription(e.target.value)}
                placeholder="Optional description (8–1024 chars if provided)"
                disabled={isCreatingLibrary}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateLibraryOpen(false)}
                disabled={isCreatingLibrary}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreatingLibrary}>
                {isCreatingLibrary ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditLibraryOpen} onOpenChange={setIsEditLibraryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit library</DialogTitle>
            <DialogDescription>
              Update the name and description of this library.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (!selectedLibrary) {
                toast.error("Select a library to edit.")
                return
              }

              const name = editLibraryName.trim()
              const descriptionRaw = editLibraryDescription.trim()

              if (!name) {
                toast.error("Library name is required.")
                return
              }

              if (
                descriptionRaw.length > 0 &&
                (descriptionRaw.length < 8 || descriptionRaw.length > 1024)
              ) {
                toast.error("Description must be 8–1024 characters (or empty).")
                return
              }

              updateLibrary({
                libraryId: selectedLibrary.id,
                name,
                // Allow clearing description by sending null.
                description: descriptionRaw.length > 0 ? descriptionRaw : null,
              })
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="edit-library-name">Name</Label>
              <Input
                id="edit-library-name"
                value={editLibraryName}
                onChange={(e) => setEditLibraryName(e.target.value)}
                placeholder="e.g. sre"
                disabled={isUpdatingLibrary}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-library-description">Description (optional)</Label>
              <Textarea
                id="edit-library-description"
                value={editLibraryDescription}
                onChange={(e) => setEditLibraryDescription(e.target.value)}
                placeholder="Optional description (8–1024 chars if provided)"
                disabled={isUpdatingLibrary}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditLibraryOpen(false)}
                disabled={isUpdatingLibrary}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdatingLibrary}>
                {isUpdatingLibrary ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAccessDeniedDialogOpen} onOpenChange={setIsAccessDeniedDialogOpen}>
        <DialogContent 
          showCloseButton={false}
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className="sm:max-w-[420px]"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isNoDefaultLibrary ? (
                <>
                  <Library className="h-5 w-5 text-primary" />
                  {librariesState.length === 0 ? "Create Your First Library" : gateModalMode === "create" ? "Create Problem Library" : "Select Default Library"}
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Library Access Denied
                </>
              )}
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-normal">
              {isNoDefaultLibrary ? (
                librariesState.length === 0
                  ? "No problem libraries exist in this organization yet. Create a library to start organizing your problems."
                  : gateModalMode === "create"
                    ? "Add a new library to organize your problems."
                    : "Please select a default library for this organization to browse problems, or create a new library."
              ) : (
                "You no longer have access to the library set as your default. Please select a different library to proceed."
              )}
            </DialogDescription>
          </DialogHeader>

          {isNoDefaultLibrary && gateModalMode === "create" ? (
            <div className="space-y-4 py-4">
              {!canCreateLibrary ? (
                <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md text-center">
                  You do not have permission to create libraries in this organization. Please contact your organization administrator.
                  {librariesState.length > 0 && (
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => setGateModalMode("select")}
                    >
                      Back to selection
                    </Button>
                  )}
                </div>
              ) : (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault()
                    const name = newLibraryName.trim()
                    const descriptionRaw = newLibraryDescription.trim()
                    if (!name) {
                      toast.error("Library name is required.")
                      return
                    }
                    if (
                      descriptionRaw.length > 0 &&
                      (descriptionRaw.length < 8 || descriptionRaw.length > 1024)
                    ) {
                      toast.error("Description must be 8–1024 characters (or empty).")
                      return
                    }
                    createLibrary({
                      name,
                      ...(descriptionRaw.length > 0
                        ? { description: descriptionRaw }
                        : {}),
                    })
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="gate-new-lib-name" className="text-xs font-semibold">
                      Library Name
                    </Label>
                    <Input
                      id="gate-new-lib-name"
                      placeholder="e.g. Core Algorithms"
                      value={newLibraryName}
                      onChange={(e) => setNewLibraryName(e.target.value)}
                      disabled={isCreatingLibrary}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gate-new-lib-desc" className="text-xs font-semibold">
                      Description (Optional)
                    </Label>
                    <Textarea
                      id="gate-new-lib-desc"
                      placeholder="Optional description (8–1024 chars if provided)"
                      value={newLibraryDescription}
                      onChange={(e) => setNewLibraryDescription(e.target.value)}
                      disabled={isCreatingLibrary}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    {librariesState.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setGateModalMode("select")}
                        disabled={isCreatingLibrary}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isCreatingLibrary}
                    >
                      {isCreatingLibrary ? "Creating..." : "Create Library"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-library-select" className="text-xs font-semibold">
                    Select Library
                  </Label>
                  <Select
                    value={newDefaultLibraryId}
                    onValueChange={setNewDefaultLibraryId}
                  >
                    <SelectTrigger id="new-library-select" className="w-full">
                      <SelectValue placeholder="Select a library" />
                    </SelectTrigger>
                    <SelectContent>
                      {librariesState.map((lib) => (
                        <SelectItem key={lib.id} value={lib.id}>
                          {lib.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="flex flex-col gap-2 sm:flex-col">
                <Button
                  className="w-full"
                  disabled={!newDefaultLibraryId || isSettingDefault}
                  onClick={() => {
                    if (newDefaultLibraryId) {
                      setDefaultLibrary(newDefaultLibraryId)
                    }
                  }}
                >
                  {isSettingDefault ? "Updating..." : isNoDefaultLibrary ? "Set as Default" : "Switch & Set as Default"}
                </Button>
                {isNoDefaultLibrary && canCreateLibrary && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setGateModalMode("create")
                      setNewLibraryName("")
                      setNewLibraryDescription("")
                    }}
                  >
                    Or create a new library instead
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteLibraryOpen}
        onOpenChange={setIsDeleteLibraryOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete library?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {selectedLibrary?.name}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingLibrary}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeletingLibrary}
              onClick={(e) => {
                e.preventDefault()
                if (selectedLibrary) {
                  deleteLibrary(selectedLibrary.id)
                }
              }}
            >
              {isDeletingLibrary ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

