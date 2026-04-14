"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CurrencyDisplayProps {
  amount: number
  currency?: string
  locale?: string
  className?: string
  variant?: "default" | "positive" | "negative" | "neutral"
  size?: "sm" | "md" | "lg" | "xl"
}

const variantStyles = {
  default: "text-foreground",
  positive: "text-success",
  negative: "text-destructive",
  neutral: "text-muted-foreground",
}

const sizeStyles = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg font-semibold",
  xl: "text-2xl font-bold",
}

export function CurrencyDisplay({
  amount,
  currency = "EUR",
  locale = "de-DE",
  className,
  variant = "default",
  size = "md",
}: CurrencyDisplayProps) {
  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount)

  return (
    <span className={cn(variantStyles[variant], sizeStyles[size], className)}>
      {formatted}
    </span>
  )
}

interface AmountBadgeProps extends CurrencyDisplayProps {
  showSign?: boolean
}

export function AmountBadge({
  amount,
  currency = "EUR",
  locale = "de-DE",
  className,
  showSign = false,
}: AmountBadgeProps) {
  const isPositive = amount > 0
  const isNegative = amount < 0
  
  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    signDisplay: showSign ? "always" : "auto",
  }).format(amount)

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-sm font-medium",
        isPositive && "bg-success/10 text-success",
        isNegative && "bg-destructive/10 text-destructive",
        !isPositive && !isNegative && "bg-muted text-muted-foreground",
        className
      )}
    >
      {formatted}
    </span>
  )
}
