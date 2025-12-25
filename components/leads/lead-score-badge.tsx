import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface LeadScoreBadgeProps {
  score: number
  className?: string
}

function getScoreConfig(score: number): { label: string; className: string } {
  if (score >= 80) {
    return {
      label: 'Hot',
      className: 'bg-error-500 text-white hover:bg-error-600 border-transparent',
    }
  } else if (score >= 60) {
    return {
      label: 'Warm',
      className: 'bg-warning-500 text-bg-primary hover:bg-warning-600 border-transparent',
    }
  } else if (score >= 40) {
    return {
      label: 'Cool',
      className: 'bg-info-500 text-white hover:bg-info-600 border-transparent',
    }
  } else {
    return {
      label: 'Cold',
      className: 'bg-gray-600 text-gray-300 hover:bg-gray-700 border-transparent',
    }
  }
}

export function LeadScoreBadge({ score, className }: LeadScoreBadgeProps) {
  const config = getScoreConfig(score)

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge className={config.className}>
        {score}
      </Badge>
      <span className="text-xs text-gray-400">{config.label}</span>
    </div>
  )
}
