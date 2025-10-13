/**
 * Dynasty Status Types
 *
 * Defines status indicators for dynasty-specific player evaluation.
 * Each status combines semantic color with icon for accessibility.
 */

import type { LucideIcon } from 'lucide-react'

/**
 * Dynasty player status categories
 *
 * @enum {string}
 */
export enum DynastyStatus {
  /** Player showing signs of breaking out (upward trajectory) */
  BREAKOUT = 'breakout',

  /** Player's value declining (age, performance drop) */
  DECLINING = 'declining',

  /** Player maintaining stable value */
  STABLE = 'stable',

  /** Rookie player (first year) */
  ROOKIE = 'rookie',

  /** Veteran player (5+ years experience) */
  VETERAN = 'veteran',
}

/**
 * Status configuration including visual elements
 */
export interface DynastyStatusConfig {
  /** Unique identifier matching DynastyStatus enum */
  status: DynastyStatus

  /** Human-readable label */
  label: string

  /** Icon component from lucide-react */
  icon: LucideIcon

  /** Tailwind color class (must meet WCAG AA contrast) */
  colorClass: string

  /** Background color class for badge variant */
  bgColorClass: string

  /** Accessible description for screen readers */
  ariaLabel: string

  /** Tooltip text explaining the status */
  description: string
}

/**
 * Size variants for status indicator display
 */
export type StatusIndicatorSize = 'sm' | 'md' | 'lg'

/**
 * Display variant for status indicator
 */
export type StatusIndicatorVariant = 'icon-only' | 'icon-with-label' | 'badge'

/**
 * Props for DynastyStatusIndicator component
 */
export interface DynastyStatusIndicatorProps {
  /** Dynasty status to display */
  status: DynastyStatus

  /** Size of the indicator */
  size?: StatusIndicatorSize

  /** Display variant */
  variant?: StatusIndicatorVariant

  /** Optional className for custom styling */
  className?: string

  /** Whether to show tooltip on hover */
  showTooltip?: boolean
}
