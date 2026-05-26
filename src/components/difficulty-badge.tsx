import { cn } from "@/lib/utils"
import type { ProblemDifficulty } from "@/lib/types/problem"

const DIFFICULTY_MAP: Record<string, string> = { EASY: "Easy", MEDIUM: "Medium", HARD: "Hard" }

export function formatDifficulty(d: string | undefined): string {
  return d ? DIFFICULTY_MAP[d] ?? d : "-"
}

const DIFFICULTY_CLASSES: Record<string, string> = {
  EASY: "bg-success/20 text-success-deep border-success/40 dark:bg-success/20 dark:text-success dark:border-success/40",
  MEDIUM: "bg-primary/20 text-primary border-primary/40 dark:bg-primary/20 dark:text-primary dark:border-primary/40",
  HARD: "bg-destructive/20 text-destructive border-destructive/40 dark:bg-destructive/20 dark:text-destructive dark:border-destructive/40",
}

interface DifficultyBadgeProps {
  difficulty?: ProblemDifficulty | string | null
  className?: string
}

export function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  if (!difficulty) {
    return <span className={cn("text-muted-foreground text-xs", className)}>-</span>
  }
  const display = formatDifficulty(difficulty)
  const difficultyKey = typeof difficulty === "string" ? difficulty.toUpperCase() : difficulty
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border",
        DIFFICULTY_CLASSES[difficultyKey] ?? "bg-muted text-muted-foreground border-muted-foreground/20",
        className
      )}
    >
      {display}
    </span>
  )
}
