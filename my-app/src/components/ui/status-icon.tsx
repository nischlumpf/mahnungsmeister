"use client"

import * as React from "react"
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  XCircle,
  AlertTriangle,
  FileText,
  type LucideIcon 
} from "lucide-react"
import { cn } from "@/lib/utils"

interface StatusIconProps {
  status: "paid" | "pending" | "overdue" | "cancelled" | "reminder" | "draft"
  size?: "sm" | "md" | "lg"
  className?: string
}

const statusConfig: Record<StatusIconProps["status"], { 
  icon: LucideIcon
  color: string
  label: string
}> = {
  paid: {
    icon: CheckCircle2,
    color: "text-success",
    label: "Bezahlt",
  },
  pending: {
    icon: Clock,
    color: "text-muted-foreground",
    label: "Ausstehend",
  },
  overdue: {
    icon: AlertCircle,
    color: "text-destructive",
    label: "Überfällig",
  },
  cancelled: {
    icon: XCircle,
    color: "text-muted-foreground",
    label: "Storniert",
  },
  reminder: {
    icon: AlertTriangle,
    color: "text-warning",
    label: "Mahnung",
  },
  draft: {
    icon: FileText,
    color: "text-muted-foreground",
    label: "Entwurf",
  },
}

const sizeConfig = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
}

export function StatusIcon({ status, size = "md", className }: StatusIconProps) {
  const config = statusConfig[status]
  const Icon = config.icon
  const sizeClass = sizeConfig[size]

  return (
    <Icon 
      className={cn(sizeClass, config.color, className)}
      aria-label={config.label}
    />
  )
}

export function StatusBadge({ status, size = "md", className }: StatusIconProps) {
  const config = statusConfig[status]
  
  const bgColors: Record<StatusIconProps["status"], string> = {
    paid: "bg-success/10",
    pending: "bg-muted",
    overdue: "bg-destructive/10",
    cancelled: "bg-muted",
    reminder: "bg-warning/10",
    draft: "bg-muted",
  }

  return (
    <div className={cn("flex items-center gap-2 px-2 py-1 rounded-full", bgColors[status], className)}>
      <StatusIcon status={status} size={size} />
      <span className={cn("text-sm font-medium", config.color)}>
        {config.label}
      </span>
    </div>
  )
}
