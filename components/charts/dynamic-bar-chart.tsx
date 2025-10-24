"use client"

import dynamic from "next/dynamic"
import { ComponentProps } from "react"

// Lazy-load recharts to reduce initial bundle size
// Recharts is ~90KB gzipped - only load when chart is actually needed
const BarChart = dynamic(
  () => import("recharts").then(mod => mod.BarChart),
  {
    loading: () => (
      <div className="flex items-center justify-center h-80">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading chart...</p>
        </div>
      </div>
    ),
    ssr: false
  }
)

const Bar = dynamic(
  () => import("recharts").then(mod => mod.Bar),
  { ssr: false }
)

const XAxis = dynamic(
  () => import("recharts").then(mod => mod.XAxis),
  { ssr: false }
)

const YAxis = dynamic(
  () => import("recharts").then(mod => mod.YAxis),
  { ssr: false }
)

const CartesianGrid = dynamic(
  () => import("recharts").then(mod => mod.CartesianGrid),
  { ssr: false }
)

const Tooltip = dynamic(
  () => import("recharts").then(mod => mod.Tooltip),
  { ssr: false }
)

const ResponsiveContainer = dynamic(
  () => import("recharts").then(mod => mod.ResponsiveContainer),
  { ssr: false }
)

// Export all recharts components with lazy loading
export {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
}

// Type exports for convenience
export type BarChartProps = ComponentProps<typeof BarChart>
export type BarProps = ComponentProps<typeof Bar>
export type XAxisProps = ComponentProps<typeof XAxis>
export type YAxisProps = ComponentProps<typeof YAxis>
export type CartesianGridProps = ComponentProps<typeof CartesianGrid>
export type TooltipProps = ComponentProps<typeof Tooltip>
export type ResponsiveContainerProps = ComponentProps<typeof ResponsiveContainer>
