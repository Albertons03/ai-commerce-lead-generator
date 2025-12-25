import { Badge } from "@/components/ui/badge"
import { LeadStatus } from "@/lib/types/lead"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: LeadStatus
  className?: string
}

const statusConfig: Record<LeadStatus, { label: string; className: string }> = {
  new: {
    label: 'New',
    className: 'bg-info-500 text-white hover:bg-info-600 border-transparent',
  },
  contacted: {
    label: 'Contacted',
    className: 'bg-warning-500 text-bg-primary hover:bg-warning-600 border-transparent',
  },
  qualified: {
    label: 'Qualified',
    className: 'bg-success-500 text-white hover:bg-success-600 border-transparent',
  },
  converted: {
    label: 'Converted',
    className: 'bg-purple-500 text-white hover:bg-purple-600 border-transparent',
  },
  lost: {
    label: 'Lost',
    className: 'bg-gray-600 text-gray-300 hover:bg-gray-700 border-transparent',
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}
