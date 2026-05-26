"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, History, Clock, User, ChevronRight, RotateCcw, Loader2 } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { useState, useMemo, useCallback } from "react"
import { toast } from "sonner"
import type { ProblemVersionRevisionWithDisplay } from "@/lib/problems"
import type { PaginationMeta } from "@/lib/types/api"
import { SnapshotViewer } from "./snapshot-viewer"

/* ─── helpers ─── */

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function formatFullDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getDateGroupLabel(date: Date): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor((today.getTime() - target.getTime()) / 86400000)

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

interface DateGroup {
  label: string
  revisions: { revision: ProblemVersionRevisionWithDisplay; revNumber: number; globalIndex: number }[]
}

/* ─── props ─── */

interface RevisionsTimelineViewProps {
  revisions: ProblemVersionRevisionWithDisplay[]
  currentPage: number
  pageSize: number
  paginationBasePath: string
  meta?: PaginationMeta
}

/* ─── component ─── */

export function RevisionsTimelineView({
  revisions,
  currentPage,
  pageSize,
  paginationBasePath,
  meta,
}: RevisionsTimelineViewProps) {
  const router = useRouter()
  const routeParams = useParams<{ slug: string; libraryId: string; problemId: string; versionId: string }>()
  const [selectedRevision, setSelectedRevision] = useState<ProblemVersionRevisionWithDisplay | null>(null)
  const [selectedRevNum, setSelectedRevNum] = useState<number>(0)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [isRollingBack, setIsRollingBack] = useState(false)

  const hasMore = meta ? !meta.last && meta.totalPages > currentPage : false
  const nextPage = currentPage + 1
  const latestRevNumber = meta?.totalElements ?? revisions.length

  const dateGroups = useMemo<DateGroup[]>(() => {
    const groups: DateGroup[] = []
    let currentLabel = ""

    revisions.forEach((revision, index) => {
      const date = new Date(revision.createdAt)
      const label = getDateGroupLabel(date)
      const revNumber = latestRevNumber - index

      if (label !== currentLabel) {
        currentLabel = label
        groups.push({ label, revisions: [] })
      }
      groups[groups.length - 1].revisions.push({ revision, revNumber, globalIndex: index })
    })

    return groups
  }, [revisions, latestRevNumber])

  const handleLoadMore = () => {
    const url = new URL(paginationBasePath, window.location.origin)
    url.searchParams.set("page", String(nextPage))
    url.searchParams.set("size", String(pageSize))
    router.push(url.pathname + url.search)
  }

  const handleRevisionClick = (revision: ProblemVersionRevisionWithDisplay, revNum: number) => {
    setSelectedRevision(revision)
    setSelectedRevNum(revNum)
    setSheetOpen(true)
  }

  const handleRollback = useCallback(async () => {
    if (!selectedRevision || !routeParams) return
    const { slug, libraryId, problemId, versionId } = routeParams
    setIsRollingBack(true)
    try {
      const res = await fetch(
        `/api/organizations/${slug}/problem-libraries/${libraryId}/problems/${problemId}/versions/${versionId}/revisions/${selectedRevision.id}/rollback`,
        { method: "POST" }
      )
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `Rollback failed (${res.status})`)
      }
      toast.success(`Rolled back to revision #${selectedRevNum}`)
      setSheetOpen(false)
      setSelectedRevision(null)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rollback failed")
    } finally {
      setIsRollingBack(false)
    }
  }, [selectedRevision, selectedRevNum, routeParams, router])

  /* ─── empty state ─── */

  if (revisions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-muted/50 p-4 mb-4">
          <History className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <h3 className="text-base font-semibold mb-1.5">No revisions yet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Revision history will appear here as changes are made to this version.
        </p>
      </div>
    )
  }

  /* ─── main render ─── */

  return (
    <div className="space-y-1">
      {dateGroups.map((group, groupIdx) => (
        <div key={group.label}>
          {/* Date group header */}
          <div className="flex items-center gap-2.5 py-2 px-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {group.label}
            </span>
            <div className="flex-1 h-px bg-border/50" />
          </div>

          {/* Revisions in this group */}
          <div className="relative ml-3">
            {/* Vertical connector line */}
            <div className="absolute left-0 top-3 bottom-3 w-px bg-gradient-to-b from-border via-border to-transparent" />

            <div className="space-y-0.5">
              {group.revisions.map(({ revision, revNumber, globalIndex }) => {
                const isSelected = selectedRevision?.id === revision.id
                const isLatest = groupIdx === 0 && globalIndex === 0

                return (
                  <button
                    key={revision.id}
                    onClick={() => handleRevisionClick(revision, revNumber)}
                    className={cn(
                      "group relative flex items-center gap-3 w-full text-left rounded-lg px-3 py-2.5 transition-all duration-200",
                      "hover:bg-accent/60",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                      isSelected && "bg-primary/5 hover:bg-primary/8"
                    )}
                  >
                    {/* Timeline node */}
                    <div className="relative shrink-0 flex items-center justify-center">
                      {/* Active indicator bar */}
                      {isSelected && (
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary" />
                      )}
                      <div className={cn(
                        "h-2 w-2 rounded-full transition-all duration-200",
                        isLatest
                          ? "h-2.5 w-2.5 bg-primary shadow-[0_0_0_3px_rgba(var(--primary-rgb,59,130,246),0.15)]"
                          : "bg-muted-foreground/30 group-hover:bg-muted-foreground/50",
                        isSelected && !isLatest && "bg-primary/70"
                      )} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      {/* Rev badge */}
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-mono font-semibold px-1.5 py-0 h-5 shrink-0 tabular-nums border-border/60",
                          isSelected && "border-primary/30 text-primary"
                        )}
                      >
                        #{revNumber}
                      </Badge>

                      {/* Comment */}
                      <span className={cn(
                        "text-sm truncate transition-colors",
                        revision.comment
                          ? "text-foreground font-medium"
                          : "text-muted-foreground/60 italic"
                      )}>
                        {revision.comment || "No description"}
                      </span>

                      {/* Latest pill */}
                      {isLatest && (
                        <Badge className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10" variant="outline">
                          Latest
                        </Badge>
                      )}
                    </div>

                    {/* Right side: metadata + arrow */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
                        <User className="h-3 w-3" />
                        <span className="max-w-[100px] truncate">{revision.createdByDisplay}</span>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
                            <Clock className="h-3 w-3" />
                            <span>{formatRelativeTime(new Date(revision.createdAt))}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>{formatFullDate(new Date(revision.createdAt))}</TooltipContent>
                      </Tooltip>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      ))}

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center pt-3 pb-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
            className="gap-1.5 h-8 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Load older revisions
          </Button>
        </div>
      )}

      {/* Pagination info */}
      {meta && (
        <div className="text-center text-[11px] text-muted-foreground/60 pt-2 pb-1">
          Showing {revisions.length} of {meta.totalElements} revision{meta.totalElements !== 1 ? "s" : ""}
          {currentPage > 1 && ` · pages 1–${currentPage}`}
        </div>
      )}

      {/* Snapshot detail sheet */}
      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open)
          if (!open) setSelectedRevision(null)
        }}
      >
        <SheetContent
          side="right"
          className="w-full sm:w-[560px] lg:w-[640px] p-0 flex flex-col overflow-hidden"
        >
          {selectedRevision && (
            <>
              <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0 bg-card/80 backdrop-blur-sm">
                <div className="flex items-center gap-2.5">
                  <Badge variant="outline" className="text-xs font-mono font-semibold px-2 py-0.5 tabular-nums">
                    #{selectedRevNum}
                  </Badge>
                  <SheetTitle className="text-base font-semibold">
                    {selectedRevision.title || "Untitled"}
                  </SheetTitle>
                  {selectedRevision.comment && (
                    <p className="text-xs text-muted-foreground mt-0.5">{selectedRevision.comment}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3 w-3" />
                    <span>{selectedRevision.createdByDisplay}</span>
                  </div>
                  <span className="text-muted-foreground/40">·</span>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    <span>{formatFullDate(new Date(selectedRevision.createdAt))}</span>
                  </div>
                </div>
              </SheetHeader>
              <div className="px-6 py-3 border-b bg-card/50 shrink-0">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 h-8 text-xs"
                      disabled={isRollingBack}
                    >
                      {isRollingBack ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="h-3.5 w-3.5" />
                      )}
                      {isRollingBack ? "Rolling back…" : "Rollback to this revision"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Rollback to revision #{selectedRevNum}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will create a new revision with the state from revision #{selectedRevNum}.
                        The current version data will be replaced.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isRollingBack}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRollback} disabled={isRollingBack}>
                        {isRollingBack ? "Rolling back…" : "Rollback"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <div className="flex-1 min-h-0 overflow-auto">
                <SnapshotViewer snapshot={selectedRevision.snapshot} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
