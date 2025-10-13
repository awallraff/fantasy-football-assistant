/**
 * Responsive Layout Utilities (TASK-016)
 *
 * Reusable layout patterns for mobile/tablet/desktop responsive design.
 * Following mobile-first approach with fluid breakpoints.
 *
 * Breakpoints:
 * - Mobile: 375px-639px (default)
 * - Tablet: 640px-1023px (sm:, md:)
 * - Desktop: 1024px+ (lg:, xl:)
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Responsive grid columns configuration
 */
export const RESPONSIVE_GRIDS = {
  /** Single column on mobile, 2 on tablet, 3 on desktop */
  "1-2-3": "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",

  /** Single column on mobile, 2 on tablet, 4 on desktop */
  "1-2-4": "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",

  /** Single column on mobile, 3 on tablet+desktop */
  "1-3-3": "grid-cols-1 sm:grid-cols-3",

  /** 2 columns on mobile, 4 on tablet+desktop */
  "2-4-4": "grid-cols-2 sm:grid-cols-4",

  /** Single column all breakpoints (mobile-only pattern) */
  "1-1-1": "grid-cols-1",

  /** 2 columns on mobile, 3 on desktop */
  "2-3-4": "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
} as const

export type ResponsiveGridPattern = keyof typeof RESPONSIVE_GRIDS

/**
 * Responsive gap spacing
 */
export const RESPONSIVE_GAPS = {
  /** Small gap: 12px mobile, 16px tablet, 24px desktop */
  sm: "gap-3 md:gap-4 lg:gap-6",

  /** Medium gap: 16px mobile, 24px tablet, 32px desktop */
  md: "gap-4 md:gap-6 lg:gap-8",

  /** Large gap: 24px mobile, 32px tablet, 48px desktop */
  lg: "gap-6 md:gap-8 lg:gap-12",

  /** Tight gap: 8px mobile, 12px tablet, 16px desktop */
  tight: "gap-2 md:gap-3 lg:gap-4",
} as const

export type ResponsiveGapSize = keyof typeof RESPONSIVE_GAPS

/**
 * Page container patterns (max-width + horizontal padding)
 */
export const PAGE_CONTAINERS = {
  /** Standard page container with responsive padding */
  standard: "container mx-auto px-4 py-6 md:py-8",

  /** Full-width container (no max-width constraint) */
  full: "container mx-auto px-4 py-6 md:py-8 max-w-full",

  /** Narrow container for content-focused pages */
  narrow: "container mx-auto px-4 py-6 md:py-8 max-w-4xl",

  /** Wide container for data-heavy pages */
  wide: "container mx-auto px-4 py-6 md:py-8 max-w-7xl",
} as const

export type PageContainerVariant = keyof typeof PAGE_CONTAINERS

/**
 * Responsive flex patterns
 */
export const RESPONSIVE_FLEX = {
  /** Vertical on mobile, horizontal on tablet+ */
  "col-row": "flex flex-col md:flex-row",

  /** Horizontal on mobile, vertical on tablet+ (rare) */
  "row-col": "flex flex-row md:flex-col",

  /** Vertical all breakpoints */
  col: "flex flex-col",

  /** Horizontal all breakpoints */
  row: "flex flex-row",

  /** Wrap on mobile, no-wrap on desktop */
  "wrap-nowrap": "flex flex-wrap lg:flex-nowrap",
} as const

export type ResponsiveFlexPattern = keyof typeof RESPONSIVE_FLEX

/**
 * Helper: Get responsive grid class string
 */
export function getResponsiveGrid(
  pattern: ResponsiveGridPattern,
  gap: ResponsiveGapSize = "md"
): string {
  return twMerge("grid", RESPONSIVE_GRIDS[pattern], RESPONSIVE_GAPS[gap])
}

/**
 * Helper: Get page container class string
 */
export function getPageContainer(variant: PageContainerVariant = "standard"): string {
  return PAGE_CONTAINERS[variant]
}

/**
 * Helper: Get responsive flex class string
 */
export function getResponsiveFlex(
  pattern: ResponsiveFlexPattern,
  gap: ResponsiveGapSize = "md"
): string {
  return twMerge("flex", RESPONSIVE_FLEX[pattern], RESPONSIVE_GAPS[gap])
}

/**
 * Custom responsive grid builder
 */
export interface CustomGridOptions {
  /** Number of columns on mobile (default: 1) */
  mobile?: number

  /** Number of columns on tablet (default: 2) */
  tablet?: number

  /** Number of columns on desktop (default: 3) */
  desktop?: number

  /** Gap size (default: "md") */
  gap?: ResponsiveGapSize

  /** Additional classes */
  className?: ClassValue
}

/**
 * Build custom responsive grid with specific column counts
 */
export function buildResponsiveGrid(options: CustomGridOptions = {}): string {
  const {
    mobile = 1,
    tablet = 2,
    desktop = 3,
    gap = "md",
    className,
  } = options

  const gridClasses = [
    "grid",
    `grid-cols-${mobile}`,
    tablet !== mobile && `md:grid-cols-${tablet}`,
    desktop !== tablet && `lg:grid-cols-${desktop}`,
    RESPONSIVE_GAPS[gap],
  ].filter(Boolean)

  return twMerge(clsx(gridClasses, className))
}

/**
 * Responsive spacing utilities (for sections, not components)
 */
export const RESPONSIVE_SPACING = {
  /** Section vertical spacing: 24px mobile, 32px desktop */
  section: "space-y-6 md:space-y-8",

  /** Tight section spacing: 16px mobile, 24px desktop */
  sectionTight: "space-y-4 md:space-y-6",

  /** Large section spacing: 32px mobile, 48px desktop */
  sectionLarge: "space-y-8 md:space-y-12",

  /** Page padding: 24px mobile, 32px desktop */
  pagePadding: "py-6 md:py-8",

  /** Section margin: 32px mobile, 48px desktop */
  sectionMargin: "mb-8 md:mb-12",
} as const

export type ResponsiveSpacing = keyof typeof RESPONSIVE_SPACING

/**
 * Helper: Get responsive spacing class string
 */
export function getResponsiveSpacing(spacing: ResponsiveSpacing): string {
  return RESPONSIVE_SPACING[spacing]
}

/**
 * Responsive visibility helpers
 */
export const RESPONSIVE_VISIBILITY = {
  /** Show only on mobile */
  mobileOnly: "block md:hidden",

  /** Show only on tablet+ */
  tabletUp: "hidden md:block",

  /** Show only on desktop */
  desktopOnly: "hidden lg:block",

  /** Hide on mobile, show on tablet+ */
  hideMobile: "hidden md:block",

  /** Hide on desktop, show on mobile/tablet */
  hideDesktop: "block lg:hidden",
} as const

export type ResponsiveVisibility = keyof typeof RESPONSIVE_VISIBILITY

/**
 * Helper: Get responsive visibility class string
 */
export function getResponsiveVisibility(visibility: ResponsiveVisibility): string {
  return RESPONSIVE_VISIBILITY[visibility]
}

/**
 * Common layout compositions
 */
export const LAYOUT_COMPOSITIONS = {
  /** Card grid with standard spacing */
  cardGrid: getResponsiveGrid("1-2-3", "md"),

  /** Stats grid (2 on mobile, 3 on tablet, 4 on desktop) */
  statsGrid: getResponsiveGrid("2-3-4", "sm"),

  /** Hero section with vertical spacing */
  heroSection: twMerge("text-center", RESPONSIVE_SPACING.sectionMargin),

  /** Dashboard page container */
  dashboardContainer: getPageContainer("standard"),

  /** Data-heavy page container */
  dataContainer: getPageContainer("full"),
} as const

export type LayoutComposition = keyof typeof LAYOUT_COMPOSITIONS

/**
 * Helper: Get layout composition class string
 */
export function getLayoutComposition(composition: LayoutComposition): string {
  return LAYOUT_COMPOSITIONS[composition]
}

/**
 * TypeScript type for all responsive layout helpers
 */
export type ResponsiveLayoutHelpers = {
  getResponsiveGrid: typeof getResponsiveGrid
  getPageContainer: typeof getPageContainer
  getResponsiveFlex: typeof getResponsiveFlex
  buildResponsiveGrid: typeof buildResponsiveGrid
  getResponsiveSpacing: typeof getResponsiveSpacing
  getResponsiveVisibility: typeof getResponsiveVisibility
  getLayoutComposition: typeof getLayoutComposition
}
