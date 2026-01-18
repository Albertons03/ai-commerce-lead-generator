import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface LeadScoreBadgeProps {
  score: number
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

interface ScoreConfig {
  label: string
  icon: string
  className: string
  textColor: string
  tooltip: string
}

function getScoreConfig(score: number): ScoreConfig {
  if (score >= 80) {
    return {
      label: 'Hot Lead',
      icon: '🔥',
      className: 'bg-error-500 text-white hover:bg-error-600 border-transparent shadow-lg shadow-error-500/20',
      textColor: 'text-error-400',
      tooltip: 'High purchase intent detected. Strong budget signals and urgency.',
    }
  } else if (score >= 60) {
    return {
      label: 'Warm Lead',
      icon: '⚡',
      className: 'bg-warning-500 text-bg-primary hover:bg-warning-600 border-transparent shadow-lg shadow-warning-500/20',
      textColor: 'text-warning-400',
      tooltip: 'Moderate purchase intent. Shows interest but needs nurturing.',
    }
  } else if (score >= 40) {
    return {
      label: 'Cool Lead',
      icon: '❄️',
      className: 'bg-info-500 text-white hover:bg-info-600 border-transparent shadow-lg shadow-info-500/20',
      textColor: 'text-info-400',
      tooltip: 'Low purchase intent. Early research phase or general inquiry.',
    }
  } else {
    return {
      label: 'Cold Lead',
      icon: '🧊',
      className: 'bg-gray-600 text-gray-300 hover:bg-gray-700 border-transparent',
      textColor: 'text-gray-500',
      tooltip: 'Minimal purchase intent. Informational questions only.',
    }
  }
}

export function LeadScoreBadge({
  score,
  className,
  showLabel = true,
  size = 'md'
}: LeadScoreBadgeProps) {
  const config = getScoreConfig(score)

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  }

  const labelSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  return (
    <div className={cn("flex items-center gap-2", className)} title={config.tooltip}>
      <Badge className={cn(config.className, sizeClasses[size], 'font-semibold transition-all')}>
        <span className="mr-1.5">{config.icon}</span>
        {score}
      </Badge>
      {showLabel && (
        <span className={cn("font-medium", config.textColor, labelSizeClasses[size])}>
          {config.label}
        </span>
      )}
    </div>
  )
}
