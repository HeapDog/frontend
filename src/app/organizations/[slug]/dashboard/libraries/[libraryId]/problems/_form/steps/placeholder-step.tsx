import { Construction, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PlaceholderStepProps {
  title: string
  description?: string
}

export function PlaceholderStep({ title, description }: PlaceholderStepProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-6 border rounded-xl border-dashed bg-muted/5">
      <div className="relative">
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 blur-sm" />
        <div className="relative p-4 bg-background rounded-full border shadow-sm">
          <Construction className="w-8 h-8 text-muted-foreground/80" />
        </div>
      </div>

      <div className="space-y-2 max-w-md mx-auto px-4">
        <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description || "This module is being actively developed. Check back soon for updates."}
        </p>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button variant="outline" size="sm" className="gap-2" disabled>
          <Lightbulb className="w-4 h-4" />
          View Documentation
        </Button>
      </div>
    </div>
  )
}
