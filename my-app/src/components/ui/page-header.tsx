"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LucideIcon } from "lucide-react"

interface PageHeaderProps {
  title: string
  description?: string
  actions?: {
    label: string
    href: string
    icon?: LucideIcon
    variant?: "default" | "outline" | "ghost"
  }[]
  className?: string
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {actions && actions.length > 0 && (
          <div className="flex items-center gap-2">
            {actions.map((action, index) => {
              const Icon = action.icon
              return (
                <Link key={index} href={action.href}>
                  <Button variant={action.variant || "default"}>
                    {Icon && <Icon className="w-4 h-4 mr-2" />}
                    {action.label}
                  </Button>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
