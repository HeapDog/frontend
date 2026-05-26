"use client"

import { useState, useEffect, useCallback } from "react"
import { Mafs, Coordinates, Plot } from "mafs"
import { Parser } from "expr-eval"
import { Maximize2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface MafsGraphConfig {
  expressions: string[]
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  /** Equal scale: 1 unit on x = 1 unit on y (Desmos-style). When false, graph fills the container. */
  equalScale?: boolean
  /** Grid subdivisions. Higher = denser grid (Desmos-style). */
  subdivisions?: number
  /** Show axis labels (numbers on axes). */
  showLabels?: boolean
}

const DEFAULT_CONFIG: MafsGraphConfig = {
  expressions: ["x^2"],
  xMin: -5,
  xMax: 5,
  yMin: -5,
  yMax: 5,
  equalScale: true,
  subdivisions: 5,
  showLabels: true,
}

const COLORS = ["#2563eb", "#dc2626", "#16a34a", "#ca8a04", "#7c3aed", "#0d9488"]

const parser = new Parser()

function parseExpression(expr: string): ((x: number) => number) | null {
  const trimmed = expr.trim()
  if (!trimmed) return null
  try {
    const parsed = parser.parse(trimmed)
    return (x: number) => {
      try {
        return parsed.evaluate({ x })
      } catch {
        return NaN
      }
    }
  } catch {
    return null
  }
}

export function MafsGraphRenderer({
  config,
  height = 280,
  interactive = false,
  showFullscreenButton = true,
}: {
  config: Partial<MafsGraphConfig> | string
  height?: number
  interactive?: boolean
  showFullscreenButton?: boolean
}) {
  const [fullscreen, setFullscreen] = useState(false)

  const closeFullscreen = useCallback(() => setFullscreen(false), [])

  useEffect(() => {
    if (!fullscreen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFullscreen()
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [fullscreen, closeFullscreen])
  let cfg: MafsGraphConfig
  try {
    cfg =
      typeof config === "string"
        ? { ...DEFAULT_CONFIG, ...JSON.parse(config || "{}") }
        : { ...DEFAULT_CONFIG, ...config }
  } catch {
    cfg = DEFAULT_CONFIG
  }

  const {
    expressions,
    xMin,
    xMax,
    yMin,
    yMax,
    equalScale = true,
    subdivisions = 5,
    showLabels = true,
  } = cfg
  const validExpressions = expressions
    ?.filter(Boolean)
    .map((expr) => ({ expr, fn: parseExpression(expr) }))
    .filter(({ fn }) => fn != null) ?? []

  if (validExpressions.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-8 text-sm text-muted-foreground">
        {expressions?.length
          ? "Invalid expression(s). Use x as variable, e.g. x^2, sin(x)"
          : "No expressions. Add y = f(x) like x^2 or sin(x)"}
      </div>
    )
  }

  const axisConfig = {
    axis: true,
    lines: 1,
    subdivisions,
    ...(showLabels ? {} : { labels: false as const }),
  }

  const graphContent = (
    <Mafs
      height={height}
      pan={interactive}
      zoom={interactive}
      viewBox={{
        x: [xMin, xMax],
        y: [yMin, yMax],
        padding: 0.5,
      }}
      preserveAspectRatio={equalScale ? "contain" : false}
    >
      <Coordinates.Cartesian
        xAxis={axisConfig}
        yAxis={axisConfig}
        subdivisions={subdivisions}
      />
      {validExpressions.map(({ fn }, i) => (
        <Plot.OfX
          key={i}
          y={fn!}
          domain={[xMin, xMax]}
          color={COLORS[i % COLORS.length]}
          weight={2}
        />
      ))}
    </Mafs>
  )

  return (
    <>
      <div className="relative overflow-hidden rounded-lg border border-border bg-background">
        {graphContent}
        {showFullscreenButton && (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8 rounded-md opacity-70 hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation()
              setFullscreen(true)
            }}
            title="Fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {fullscreen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-background"
          role="dialog"
          aria-modal="true"
          aria-label="Graph fullscreen"
        >
          <div className="flex shrink-0 items-center justify-end gap-2 border-b border-border bg-muted/30 px-4 py-2">
            <span className="text-sm text-muted-foreground">Press Esc to close</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={closeFullscreen}
              title="Close fullscreen"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 min-h-0 p-4">
            <MafsGraphRenderer
              config={cfg}
              height={typeof window !== "undefined" ? window.innerHeight - 80 : 600}
              interactive
              showFullscreenButton={false}
            />
          </div>
        </div>
      )}
    </>
  )
}
