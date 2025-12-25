import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary-500 text-white hover:bg-primary-600",
        secondary:
          "border-transparent bg-secondary-500 text-white hover:bg-secondary-600",
        destructive:
          "border-transparent bg-error-500 text-white hover:bg-error-600",
        outline: "text-gray-300 border-border-primary",
        success:
          "border-transparent bg-success-500 text-white hover:bg-success-600",
        warning:
          "border-transparent bg-warning-500 text-bg-primary hover:bg-warning-600",
        info:
          "border-transparent bg-info-500 text-white hover:bg-info-600",
        purple:
          "border-transparent bg-purple-500 text-white hover:bg-purple-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
