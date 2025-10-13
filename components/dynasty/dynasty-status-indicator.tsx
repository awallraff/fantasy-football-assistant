"use client"

/**
 * Dynasty Status Indicator Component
 *
 * Visual indicator for dynasty-specific player states with icon + color.
 * Follows WCAG 2.1 AA guidelines by never using color alone.
 *
 * @example
 * ```tsx
 * <DynastyStatusIndicator status={DynastyStatus.BREAKOUT} />
 * <DynastyStatusIndicator status={DynastyStatus.ROOKIE} variant="badge" />
 * <DynastyStatusIndicator status={DynastyStatus.DECLINING} size="lg" showTooltip />
 * ```
 */

import { TrendingUp, TrendingDown, Minus, Star, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  type DynastyStatusIndicatorProps,
  type DynastyStatusConfig,
  DynastyStatus,
} from '@/lib/dynasty/dynasty-status-types'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

/**
 * Status configuration mapping
 * Following TASK-017 specification:
 * - Breakout: upward arrow + green
 * - Declining: downward arrow + red
 * - Stable: horizontal line + amber
 * - Rookie: star + blue
 * - Veteran: shield + gray
 */
const STATUS_CONFIGS: Record<DynastyStatus, DynastyStatusConfig> = {
  [DynastyStatus.BREAKOUT]: {
    status: DynastyStatus.BREAKOUT,
    label: 'Breakout',
    icon: TrendingUp,
    colorClass: 'text-success',
    bgColorClass: 'bg-success/10',
    ariaLabel: 'Breakout candidate - player showing upward trajectory',
    description: 'Player showing signs of breaking out with strong upward trajectory',
  },
  [DynastyStatus.DECLINING]: {
    status: DynastyStatus.DECLINING,
    label: 'Declining',
    icon: TrendingDown,
    colorClass: 'text-destructive',
    bgColorClass: 'bg-destructive/10',
    ariaLabel: 'Declining asset - player value trending down',
    description: "Player's dynasty value declining due to age or performance drop",
  },
  [DynastyStatus.STABLE]: {
    status: DynastyStatus.STABLE,
    label: 'Stable',
    icon: Minus,
    colorClass: 'text-warning',
    bgColorClass: 'bg-warning/10',
    ariaLabel: 'Stable asset - player maintaining consistent value',
    description: 'Player maintaining stable dynasty value',
  },
  [DynastyStatus.ROOKIE]: {
    status: DynastyStatus.ROOKIE,
    label: 'Rookie',
    icon: Star,
    colorClass: 'text-accent',
    bgColorClass: 'bg-accent/10',
    ariaLabel: 'Rookie - first year player',
    description: 'Rookie player in first NFL season',
  },
  [DynastyStatus.VETERAN]: {
    status: DynastyStatus.VETERAN,
    label: 'Veteran',
    icon: Shield,
    colorClass: 'text-muted-foreground',
    bgColorClass: 'bg-muted',
    ariaLabel: 'Veteran - experienced player (5+ years)',
    description: 'Veteran player with 5+ years of NFL experience',
  },
}

/**
 * Size class mappings
 */
const SIZE_CLASSES = {
  sm: {
    icon: 'h-3 w-3',
    text: 'text-xs',
    padding: 'px-1.5 py-0.5',
    gap: 'gap-1',
  },
  md: {
    icon: 'h-4 w-4',
    text: 'text-sm',
    padding: 'px-2 py-1',
    gap: 'gap-1.5',
  },
  lg: {
    icon: 'h-5 w-5',
    text: 'text-base',
    padding: 'px-3 py-1.5',
    gap: 'gap-2',
  },
}

export function DynastyStatusIndicator({
  status,
  size = 'md',
  variant = 'icon-only',
  className,
  showTooltip = true,
}: DynastyStatusIndicatorProps) {
  const config = STATUS_CONFIGS[status]
  const sizeClasses = SIZE_CLASSES[size]

  if (!config) {
    console.warn(`DynastyStatusIndicator: Invalid status "${status}"`)
    return null
  }

  const Icon = config.icon

  const indicator = (
    <div
      className={cn(
        'inline-flex items-center',
        sizeClasses.gap,
        variant === 'badge' && [
          'rounded-full',
          sizeClasses.padding,
          config.bgColorClass,
        ],
        className
      )}
      aria-label={config.ariaLabel}
      role="img"
    >
      <Icon className={cn(sizeClasses.icon, config.colorClass)} aria-hidden="true" />
      {variant !== 'icon-only' && (
        <span className={cn(sizeClasses.text, config.colorClass, 'font-medium')}>
          {config.label}
        </span>
      )}
    </div>
  )

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            {indicator}
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">{config.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return indicator
}
