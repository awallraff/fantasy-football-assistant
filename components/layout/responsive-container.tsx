/**
 * ResponsiveContainer Component (TASK-016)
 *
 * Optional wrapper component for common responsive layout patterns.
 * Provides a convenient React component API for the layout utilities.
 */

import React from 'react'
import {
  getPageContainer,
  getResponsiveGrid,
  getResponsiveFlex,
  getResponsiveSpacing,
  getResponsiveVisibility,
  type PageContainerVariant,
  type ResponsiveGridPattern,
  type ResponsiveFlexPattern,
  type ResponsiveGapSize,
  type ResponsiveSpacing,
  type ResponsiveVisibility,
} from '@/lib/utils/layout'
import { cn } from '@/lib/utils'

/**
 * PageContainer Component
 *
 * Wrapper for page-level layouts with responsive padding and max-width.
 *
 * @example
 * ```tsx
 * <PageContainer variant="standard">
 *   <h1>Dashboard</h1>
 *   {content}
 * </PageContainer>
 * ```
 */
export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Container variant (default: "standard") */
  variant?: PageContainerVariant

  /** Additional CSS classes */
  className?: string

  /** Child elements */
  children: React.ReactNode

  /** Optional semantic HTML element (default: "div") */
  as?: 'div' | 'main' | 'section' | 'article'
}

export function PageContainer({
  variant = 'standard',
  className,
  children,
  as: Component = 'div',
  ...props
}: PageContainerProps) {
  return (
    <Component
      className={cn(getPageContainer(variant), className)}
      {...props}
    >
      {children}
    </Component>
  )
}

/**
 * ResponsiveGrid Component
 *
 * Grid layout with responsive column counts.
 *
 * @example
 * ```tsx
 * <ResponsiveGrid pattern="1-2-3" gap="md">
 *   <Card />
 *   <Card />
 *   <Card />
 * </ResponsiveGrid>
 * ```
 */
export interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Grid pattern (e.g., "1-2-3" for 1 col mobile, 2 tablet, 3 desktop) */
  pattern: ResponsiveGridPattern

  /** Gap size between grid items (default: "md") */
  gap?: ResponsiveGapSize

  /** Additional CSS classes */
  className?: string

  /** Child elements */
  children: React.ReactNode
}

export function ResponsiveGrid({
  pattern,
  gap = 'md',
  className,
  children,
  ...props
}: ResponsiveGridProps) {
  return (
    <div
      className={cn(getResponsiveGrid(pattern, gap), className)}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * ResponsiveFlex Component
 *
 * Flex layout with responsive direction changes.
 *
 * @example
 * ```tsx
 * <ResponsiveFlex pattern="col-row" gap="md">
 *   <div>Sidebar</div>
 *   <div>Main Content</div>
 * </ResponsiveFlex>
 * ```
 */
export interface ResponsiveFlexProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Flex pattern (e.g., "col-row" for column on mobile, row on tablet+) */
  pattern: ResponsiveFlexPattern

  /** Gap size between flex items (default: "md") */
  gap?: ResponsiveGapSize

  /** Additional CSS classes */
  className?: string

  /** Child elements */
  children: React.ReactNode
}

export function ResponsiveFlex({
  pattern,
  gap = 'md',
  className,
  children,
  ...props
}: ResponsiveFlexProps) {
  return (
    <div
      className={cn(getResponsiveFlex(pattern, gap), className)}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * ResponsiveSection Component
 *
 * Section wrapper with responsive vertical spacing.
 *
 * @example
 * ```tsx
 * <ResponsiveSection spacing="section">
 *   <h2>Section Title</h2>
 *   <p>Content...</p>
 * </ResponsiveSection>
 * ```
 */
export interface ResponsiveSectionProps extends React.HTMLAttributes<HTMLElement> {
  /** Spacing size (default: "section") */
  spacing?: ResponsiveSpacing

  /** Additional CSS classes */
  className?: string

  /** Child elements */
  children: React.ReactNode

  /** Optional semantic HTML element (default: "section") */
  as?: 'div' | 'section' | 'article' | 'aside'
}

export function ResponsiveSection({
  spacing = 'section',
  className,
  children,
  as: Component = 'section',
  ...props
}: ResponsiveSectionProps) {
  return (
    <Component
      className={cn(getResponsiveSpacing(spacing), className)}
      {...props}
    >
      {children}
    </Component>
  )
}

/**
 * ResponsiveVisibility Component
 *
 * Conditionally render content based on viewport size.
 *
 * @example
 * ```tsx
 * <ResponsiveVisibility show="mobileOnly">
 *   <MobileNav />
 * </ResponsiveVisibility>
 * <ResponsiveVisibility show="tabletUp">
 *   <DesktopNav />
 * </ResponsiveVisibility>
 * ```
 */
export interface ResponsiveVisibilityProps extends React.HTMLAttributes<HTMLDivElement> {
  /** When to show this content */
  show: ResponsiveVisibility

  /** Additional CSS classes */
  className?: string

  /** Child elements */
  children: React.ReactNode
}

export function ResponsiveVisibility({
  show,
  className,
  children,
  ...props
}: ResponsiveVisibilityProps) {
  return (
    <div
      className={cn(getResponsiveVisibility(show), className)}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * CardGrid Component
 *
 * Convenience component for common card grid pattern (1-2-3 layout).
 *
 * @example
 * ```tsx
 * <CardGrid>
 *   <LeagueCard />
 *   <LeagueCard />
 *   <LeagueCard />
 * </CardGrid>
 * ```
 */
export interface CardGridProps extends Omit<ResponsiveGridProps, 'pattern'> {
  /** Override default gap (default: "md") */
  gap?: ResponsiveGapSize
}

export function CardGrid({ gap = 'md', className, children, ...props }: CardGridProps) {
  return (
    <ResponsiveGrid pattern="1-2-3" gap={gap} className={className} {...props}>
      {children}
    </ResponsiveGrid>
  )
}

/**
 * StatsGrid Component
 *
 * Convenience component for stats grid pattern (2-3-4 layout).
 *
 * @example
 * ```tsx
 * <StatsGrid>
 *   <StatCard />
 *   <StatCard />
 *   <StatCard />
 *   <StatCard />
 * </StatsGrid>
 * ```
 */
export interface StatsGridProps extends Omit<ResponsiveGridProps, 'pattern'> {
  /** Override default gap (default: "sm") */
  gap?: ResponsiveGapSize
}

export function StatsGrid({ gap = 'sm', className, children, ...props }: StatsGridProps) {
  return (
    <ResponsiveGrid pattern="2-3-4" gap={gap} className={className} {...props}>
      {children}
    </ResponsiveGrid>
  )
}
