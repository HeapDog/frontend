"use client"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
    Copy,
    Check,
    Tag,
    Code2,
    Calendar,
    User,
    Hash,
    FileText,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Maximize2,
} from "lucide-react"
import { useState, useCallback } from "react"
import { StatementPreview } from "@/components/statement-preview"

interface SnapshotViewerProps {
    snapshot: string
}

interface ParsedSnapshot {
    id?: string
    title?: string
    statement?: string | null
    status?: string
    difficulty?: string
    number?: number
    tags?: { id: string; name: string; description?: string }[]
    languages?: { id: string; name: string; version: string }[]
    createdBy?: string
    createdAt?: string
    lastUpdatedBy?: string | null
    lastUpdatedAt?: string | null
}

const statusStyles: Record<string, string> = {
    DRAFT: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50",
    PUBLISHED: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50",
    ARCHIVED: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800/30 dark:text-zinc-400 dark:border-zinc-700/50",
}

const difficultyStyles: Record<string, string> = {
    EASY: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50",
    MEDIUM: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50",
    HARD: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50",
}

function formatDate(dateStr: string): string {
    try {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    } catch {
        return dateStr
    }
}

function MetadataRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3 py-2.5">
            <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium">{label}</span>
                <p className="text-sm text-foreground mt-0.5 font-mono break-all">{value}</p>
            </div>
        </div>
    )
}

function SyntaxHighlightedJson({ json }: { json: string }) {
    const colorize = (raw: string) => {
        const parts: { text: string; className: string }[] = []
        // Simple tokenizer for JSON display
        const regex = /("(?:[^"\\]|\\.)*")\s*:|("(?:[^"\\]|\\.)*")|(true|false)|(null)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([[\]{}:,])|(\s+)/g
        let match: RegExpExecArray | null
        while ((match = regex.exec(raw)) !== null) {
            if (match[1]) {
                // key
                parts.push({ text: match[1], className: "text-blue-600 dark:text-blue-400" })
                parts.push({ text: ":", className: "text-muted-foreground" })
            } else if (match[2]) {
                // string value
                parts.push({ text: match[2], className: "text-emerald-600 dark:text-emerald-400" })
            } else if (match[3]) {
                // boolean
                parts.push({ text: match[3], className: "text-violet-600 dark:text-violet-400" })
            } else if (match[4]) {
                // null
                parts.push({ text: match[4], className: "text-zinc-400 dark:text-zinc-500 italic" })
            } else if (match[5]) {
                // number
                parts.push({ text: match[5], className: "text-amber-600 dark:text-amber-400" })
            } else if (match[6]) {
                // structural
                parts.push({ text: match[6], className: "text-muted-foreground/60" })
            } else if (match[7]) {
                // whitespace
                parts.push({ text: match[7], className: "" })
            }
        }
        return parts
    }

    const parts = colorize(json)

    return (
        <pre className="text-[13px] leading-6 font-mono overflow-x-auto">
            {parts.map((part, i) => (
                <span key={i} className={part.className}>{part.text}</span>
            ))}
        </pre>
    )
}

export function SnapshotViewer({ snapshot }: SnapshotViewerProps) {
    const [copied, setCopied] = useState(false)
    const [statementExpanded, setStatementExpanded] = useState(false)
    const [statementFullscreen, setStatementFullscreen] = useState(false)

    let parsed: ParsedSnapshot | null = null
    let prettyJson = snapshot
    try {
        parsed = JSON.parse(snapshot)
        prettyJson = JSON.stringify(parsed, null, 2)
    } catch {
        // leave as raw string
    }

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(prettyJson)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // fallback
        }
    }, [prettyJson])

    return (
        <Tabs defaultValue="formatted" className="h-full">
            <div className="flex items-center justify-between px-6 pt-4 pb-2">
                <TabsList className="h-8">
                    <TabsTrigger value="formatted" className="text-xs px-3 h-7 gap-1.5">
                        <FileText className="h-3 w-3" />
                        Formatted
                    </TabsTrigger>
                    <TabsTrigger value="json" className="text-xs px-3 h-7 gap-1.5">
                        <Code2 className="h-3 w-3" />
                        Raw JSON
                    </TabsTrigger>
                </TabsList>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={handleCopy}
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-200",
                                "border bg-background hover:bg-accent text-muted-foreground hover:text-foreground",
                                copied && "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                            )}
                        >
                            {copied ? (
                                <>
                                    <Check className="h-3 w-3" />
                                    Copied
                                </>
                            ) : (
                                <>
                                    <Copy className="h-3 w-3" />
                                    Copy
                                </>
                            )}
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>Copy raw JSON to clipboard</TooltipContent>
                </Tooltip>
            </div>

            {/* Formatted View */}
            <TabsContent value="formatted" className="flex-1 overflow-auto px-6 pb-6 mt-0">
                {parsed ? (
                    <div className="space-y-5">
                        {/* Title */}
                        {parsed.title && (
                            <div>
                                <h2 className="text-xl font-semibold text-foreground leading-tight">
                                    {parsed.title}
                                </h2>
                            </div>
                        )}

                        {/* Status + Difficulty row */}
                        {(parsed.status || parsed.difficulty) && (
                            <div className="flex items-center gap-2 flex-wrap">
                                {parsed.status && (
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "text-xs font-medium px-2.5 py-0.5",
                                            statusStyles[parsed.status] ?? "bg-muted text-muted-foreground"
                                        )}
                                    >
                                        {parsed.status}
                                    </Badge>
                                )}
                                {parsed.difficulty && (
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "text-xs font-medium px-2.5 py-0.5",
                                            difficultyStyles[parsed.difficulty] ?? "bg-muted text-muted-foreground"
                                        )}
                                    >
                                        {parsed.difficulty}
                                    </Badge>
                                )}
                            </div>
                        )}

                        {/* Statement */}
                        <div className="rounded-lg border bg-muted/30 overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setStatementExpanded((v) => !v)}
                                className="flex items-center justify-between w-full px-4 py-3 hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium">Statement</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {parsed.statement && !statementExpanded && (
                                        <span className="text-[11px] text-muted-foreground/50">Click to preview</span>
                                    )}
                                    {statementExpanded ? (
                                        <ChevronUp className="h-3.5 w-3.5 text-muted-foreground/50" />
                                    ) : (
                                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50" />
                                    )}
                                </div>
                            </button>
                            {statementExpanded && (
                                <>
                                    {parsed.statement ? (
                                        <div className="border-t">
                                            <div className="flex justify-end px-3 pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setStatementFullscreen(true)}
                                                    className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-muted"
                                                >
                                                    <Maximize2 className="h-3 w-3" />
                                                    Full screen
                                                </button>
                                            </div>
                                            <StatementPreview content={parsed.statement} />
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground/60 italic px-4 pb-4 border-t pt-3">No statement provided</p>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Statement full-screen dialog */}
                        {parsed.statement && (
                            <Dialog open={statementFullscreen} onOpenChange={setStatementFullscreen}>
                                <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0">
                                    <DialogHeader className="shrink-0 px-6 pt-5 pb-3 border-b">
                                        <DialogTitle className="text-base">Statement Preview</DialogTitle>
                                        <DialogDescription className="sr-only">
                                            Full-screen preview of the problem statement
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="flex-1 min-h-0 overflow-y-auto px-2">
                                        <StatementPreview
                                            content={parsed.statement}
                                            className="min-h-[400px] px-6 sm:px-12 py-8 sm:py-12 text-[15px]"
                                        />
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}

                        {/* Tags */}
                        {parsed.tags && parsed.tags.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-2.5">
                                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium">Tags</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {parsed.tags.map((tag) => (
                                        <Tooltip key={tag.id}>
                                            <TooltipTrigger asChild>
                                                <span>
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-xs font-normal px-2.5 py-1 cursor-default"
                                                    >
                                                        {tag.name}
                                                    </Badge>
                                                </span>
                                            </TooltipTrigger>
                                            {tag.description && (
                                                <TooltipContent className="max-w-xs">
                                                    {tag.description}
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Languages */}
                        {parsed.languages && parsed.languages.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-2.5">
                                    <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium">Languages</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {parsed.languages.map((lang) => (
                                        <div
                                            key={lang.id}
                                            className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 transition-colors hover:bg-accent/50"
                                        >
                                            <span className="text-sm font-medium text-foreground">{lang.name}</span>
                                            <span className="text-[11px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                                                {lang.version}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Metadata */}
                        <div className="rounded-lg border bg-card">
                            <div className="px-4 py-3 border-b">
                                <span className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium">Metadata</span>
                            </div>
                            <div className="px-4 divide-y divide-border/60">
                                {parsed.id && (
                                    <MetadataRow icon={Hash} label="Version ID" value={parsed.id} />
                                )}
                                {parsed.number !== undefined && (
                                    <MetadataRow icon={Hash} label="Version Number" value={String(parsed.number)} />
                                )}
                                {parsed.createdBy && (
                                    <MetadataRow icon={User} label="Created By" value={parsed.createdBy} />
                                )}
                                {parsed.createdAt && (
                                    <MetadataRow icon={Calendar} label="Created At" value={formatDate(parsed.createdAt)} />
                                )}
                                {parsed.lastUpdatedBy && (
                                    <MetadataRow icon={User} label="Last Updated By" value={parsed.lastUpdatedBy} />
                                )}
                                {parsed.lastUpdatedAt && (
                                    <MetadataRow icon={Calendar} label="Last Updated At" value={formatDate(parsed.lastUpdatedAt)} />
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mb-2 opacity-40" />
                        <p className="text-sm">Unable to parse snapshot data</p>
                    </div>
                )}
            </TabsContent>

            {/* Raw JSON View */}
            <TabsContent value="json" className="flex-1 overflow-auto px-6 pb-6 mt-0">
                <div className="rounded-lg border bg-zinc-950 dark:bg-zinc-900/50 p-5 overflow-x-auto">
                    <SyntaxHighlightedJson json={prettyJson} />
                </div>
            </TabsContent>
        </Tabs>
    )
}
