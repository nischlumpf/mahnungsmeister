"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ReminderBadgeProps {
  level: number
  className?: string
}

const reminderLabels: Record<number, string> = {
  0: "Neu",
  1: "Erinnerung",
  2: "Mahnung 1",
  3: "Mahnung 2",
  4: "Letzte Mahnung",
}

const reminderVariants: Record<number, 
  "reminderNew" | "reminderLevel1" | "reminderLevel2" | "reminderLevel3" | "reminderLevel4" | "default"
> = {
  0: "reminderNew",
  1: "reminderLevel1",
  2: "reminderLevel2",
  3: "reminderLevel3",
  4: "reminderLevel4",
}

export function ReminderBadge({ level, className }: ReminderBadgeProps) {
  const variant = reminderVariants[level] || "default"
  const label = reminderLabels[level] || `Level ${level}`

  return (
    <Badge 
      variant={variant} 
      className={cn("font-medium", className)}
    >
      {label}
    </Badge>
  )
}

export function ReminderLevelIndicator({ level, className }: ReminderBadgeProps) {
  const colors = [
    "bg-muted-foreground",
    "bg-info",
    "bg-warning",
    "bg-destructive",
    "bg-destructive animate-pulse",
  ]

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={cn(
            "w-2 h-2 rounded-full transition-colors",
            i <= level ? colors[level] : "bg-muted"
          )}
        />
      ))}
    </div>
  )
}
