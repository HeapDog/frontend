"use client"

import Link from "next/link"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChevronDown,
  ChevronRight,
  PencilLine,
  AlignLeft,
  Settings,
  Database,
  Code,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DifficultyBadge } from "@/components/difficulty-badge"
import type { ProblemVersionDetail } from "@/lib/problems"
import { Globe, Lock, Clock } from "lucide-react"

const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" }) : "-")

function formatStatus(status: string) {
  if (status === "PUBLISHED")
    return { label: "Published", icon: Globe, className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" }
  if (status === "ARCHIVED")
    return { label: "Archived", icon: Lock, className: "bg-muted text-muted-foreground border-muted-foreground/20" }
  return { label: "Draft", icon: Clock, className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800" }
}

function DetailSection({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="rounded-lg border [&[data-state=open]_.chevron]:rotate-180">
      <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors rounded-lg">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{title}</span>
        </div>
        <ChevronDown className="chevron h-4 w-4 text-muted-foreground transition-transform" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t px-4 py-4 bg-muted/20">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function OverviewSection({
  data,
  editHref,
}: {
  data: ProblemVersionDetail
  editHref: string
}) {
  const { problem, version } = data
  const statusInfo = formatStatus(version.status)
  const StatusIcon = statusInfo.icon

  return (
    <DetailSection title="Overview" icon={Info}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</dt>
          <dd className="mt-1 text-sm font-medium">{version.title}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Slug</dt>
          <dd className="mt-1 font-mono text-sm">{problem.slug}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Version</dt>
          <dd className="mt-1 font-mono text-sm">v{version.number}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Difficulty</dt>
          <dd className="mt-1">
            <DifficultyBadge difficulty={version.difficulty} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</dt>
          <dd className="mt-1">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border",
                statusInfo.className
              )}
            >
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusInfo.label}
            </span>
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tags</dt>
          <dd className="mt-1 flex flex-wrap gap-1">
            {version.tags?.length
              ? version.tags.map((t) => (
                  <Badge key={t.id} variant="outline" className="text-xs font-normal">
                    {t.name}
                  </Badge>
                ))
              : <span className="text-sm text-muted-foreground">—</span>}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Languages</dt>
          <dd className="mt-1 flex flex-wrap gap-1">
            {version.languages?.length
              ? version.languages.map((l) => (
                  <span
                    key={l.id}
                    className="inline-flex rounded-md bg-muted px-2 py-1 text-xs font-mono text-muted-foreground"
                  >
                    {l.version}
                  </span>
                ))
              : <span className="text-sm text-muted-foreground">—</span>}
          </dd>
        </div>
        <div className="sm:col-span-2 pt-4 border-t space-y-3">
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Problem</dt>
          <dd className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Created</span>{" "}
              {formatDate(problem.createdAt)} by {data.problemCreatedByDisplay}
            </p>
          </dd>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">This version</dt>
          <dd className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Created</span>{" "}
              {formatDate(version.createdAt)} by {data.versionCreatedByDisplay}
            </p>
            {version.lastUpdatedAt && (
              <p>
                <span className="text-muted-foreground">Last updated</span>{" "}
                {formatDate(version.lastUpdatedAt)} by {data.versionLastUpdatedByDisplay}
              </p>
            )}
          </dd>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t">
        <Button variant="outline" size="sm" asChild>
          <Link href={editHref}>
            <PencilLine className="mr-2 h-4 w-4" />
            Edit metadata
          </Link>
        </Button>
      </div>
    </DetailSection>
  )
}

function WipSection({ title, icon: Icon }: { title: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <DetailSection title={title} icon={Icon} defaultOpen={false}>
      <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
        <ChevronRight className="h-4 w-4" />
        <span>Work in progress</span>
      </div>
    </DetailSection>
  )
}

const DETAIL_SECTIONS = [
  { id: "problem-content", title: "Problem content", icon: AlignLeft },
  { id: "limits", title: "Limits & configuration", icon: Settings },
  { id: "test-cases", title: "Test cases", icon: Database },
  { id: "reference-solution", title: "Reference solution", icon: Code },
] as const

interface VersionDetailsContentProps {
  data: ProblemVersionDetail
  basePath: string
  problemId: string
  versionId: string
}

export function VersionDetailsContent({
  data,
  basePath,
  problemId,
  versionId,
}: VersionDetailsContentProps) {
  const editMetadataHref = `${basePath}/${problemId}/versions/${versionId}/edit/metadata`

  return (
    <div className="space-y-4">
      <OverviewSection data={data} editHref={editMetadataHref} />
      {DETAIL_SECTIONS.map((section) => (
        <WipSection key={section.id} title={section.title} icon={section.icon} />
      ))}
    </div>
  )
}
