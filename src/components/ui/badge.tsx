
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border-2 px-3 py-1 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "professional-badge-primary",
        secondary: "professional-badge-secondary", 
        destructive: "bg-destructive text-destructive-foreground border-destructive/30",
        outline: "border-border text-foreground hover:bg-muted font-semibold",
        success: "professional-badge-success",
        warning: "professional-badge-warning", 
        info: "professional-badge-info",
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
