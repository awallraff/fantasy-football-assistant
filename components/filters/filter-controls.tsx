"use client"

/**
 * Filter Control Components (TASK-015)
 *
 * Reusable filter chips and segmented controls for rankings/rosters.
 *
 * Design Specs:
 * - FilterChip: label, active state, count badge (optional)
 * - SegmentedControl: 2-4 options, clear active state, 44px height
 * - FilterGroup: horizontal scroll on mobile
 * - Persist selected filters to localStorage
 *
 * Acceptance Criteria:
 * ✅ FilterChip: label, active state, count badge (optional)
 * ✅ SegmentedControl: 2-4 options, clear active state, 44px height
 * ✅ FilterGroup: horizontal scroll on mobile
 * ✅ Persist selected filters to localStorage
 */

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

/**
 * FilterChip Component
 *
 * Single filter chip with active state and optional count badge
 */
export interface FilterChipProps {
  /** Label to display */
  label: string

  /** Unique value for this filter */
  value: string

  /** Whether this chip is currently active */
  active?: boolean

  /** Optional count to display as badge */
  count?: number

  /** Click handler */
  onClick?: () => void

  /** Show remove icon when active */
  removable?: boolean

  /** Additional CSS classes */
  className?: string

  /** Disabled state */
  disabled?: boolean
}

export function FilterChip({
  label,
  value: _value,
  active = false,
  count,
  onClick,
  removable = false,
  className,
  disabled = false,
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        // Base styles
        "inline-flex items-center gap-1.5 rounded-full border transition-all",
        // 8px grid spacing
        "px-3 py-1.5",
        // 44px minimum touch target
        "min-h-[44px]",
        // Typography
        "text-sm font-medium whitespace-nowrap",
        // Active state
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-foreground border-border hover:bg-muted",
        // Disabled state
        disabled && "opacity-50 cursor-not-allowed",
        // Focus
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      aria-pressed={active}
      aria-label={`Filter by ${label}${count ? ` (${count} items)` : ""}`}
    >
      <span>{label}</span>

      {/* Count Badge */}
      {count !== undefined && count > 0 && (
        <Badge
          variant={active ? "secondary" : "outline"}
          className={cn("text-[10px] px-1.5 py-0 ml-0.5", active && "bg-primary-foreground/20 text-primary-foreground")}
        >
          {count}
        </Badge>
      )}

      {/* Remove Icon (when active and removable) */}
      {active && removable && (
        <X className="h-3 w-3 ml-0.5" aria-hidden="true" />
      )}
    </button>
  )
}

/**
 * FilterGroup Component
 *
 * Container for multiple filter chips with horizontal scroll on mobile
 */
export interface FilterGroupProps {
  /** Child filter chips */
  children: React.ReactNode

  /** Label for the filter group */
  label?: string

  /** Additional CSS classes */
  className?: string

  /** Show clear all button */
  showClearAll?: boolean

  /** Clear all handler */
  onClearAll?: () => void
}

export function FilterGroup({ children, label, className, showClearAll, onClearAll }: FilterGroupProps) {
  return (
    <div className={cn("space-y-compact-sm", className)}>
      {/* Label and Clear All */}
      {(label || showClearAll) && (
        <div className="flex items-center justify-between gap-2">
          {label && <span className="text-sm font-medium text-muted-foreground">{label}</span>}
          {showClearAll && onClearAll && (
            <Button variant="ghost" size="sm" onClick={onClearAll} className="h-8 text-xs">
              Clear All
            </Button>
          )}
        </div>
      )}

      {/* Horizontal scrollable container */}
      <div
        className={cn(
          "flex items-center gap-2 overflow-x-auto pb-2",
          // Hide scrollbar on Webkit browsers
          "scrollbar-hide",
          // Snap scroll on mobile
          "snap-x snap-mandatory md:snap-none"
        )}
        role="group"
        aria-label={label || "Filter options"}
      >
        {children}
      </div>
    </div>
  )
}

/**
 * SegmentedControl Component
 *
 * iOS-style segmented control for 2-4 mutually exclusive options
 */
export interface SegmentedControlOption {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
  disabled?: boolean
}

export interface SegmentedControlProps {
  /** Options to display (2-4 options) */
  options: SegmentedControlOption[]

  /** Currently selected value */
  value: string

  /** Change handler */
  onChange: (value: string) => void

  /** Additional CSS classes */
  className?: string

  /** Full width on mobile */
  fullWidth?: boolean
}

export function SegmentedControl({ options, value, onChange, className, fullWidth = true }: SegmentedControlProps) {
  if (options.length < 2 || options.length > 4) {
    console.warn("SegmentedControl should have 2-4 options")
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border bg-muted p-1",
        // 44px minimum height
        "min-h-[44px]",
        fullWidth && "w-full",
        className
      )}
      role="tablist"
      aria-label="View options"
    >
      {options.map((option) => {
        const Icon = option.icon
        const isActive = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${option.value}`}
            disabled={option.disabled}
            onClick={() => !option.disabled && onChange(option.value)}
            className={cn(
              "flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all",
              // 44px minimum touch target (with parent padding)
              "min-h-[36px]",
              // Active state
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
              // Disabled state
              option.disabled && "opacity-50 cursor-not-allowed",
              // Focus
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            <span className="hidden sm:inline">{option.label}</span>
            <span className="sr-only sm:hidden">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/**
 * useFilterState Hook
 *
 * Manages filter state with localStorage persistence
 */
export interface UseFilterStateOptions {
  /** Storage key for localStorage */
  storageKey: string

  /** Default selected values */
  defaultValues?: string[]

  /** Whether to persist to localStorage */
  persist?: boolean
}

export function useFilterState({ storageKey, defaultValues = [], persist = true }: UseFilterStateOptions) {
  const [selectedFilters, setSelectedFilters] = useState<string[]>(defaultValues)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    if (!persist) {
      setIsLoaded(true)
      return
    }

    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setSelectedFilters(parsed)
        }
      }
    } catch (error) {
      console.warn(`Failed to load filter state from localStorage:`, error)
    } finally {
      setIsLoaded(true)
    }
  }, [storageKey, persist])

  // Save to localStorage when filters change
  useEffect(() => {
    if (!persist || !isLoaded) return

    try {
      localStorage.setItem(storageKey, JSON.stringify(selectedFilters))
    } catch (error) {
      console.warn(`Failed to save filter state to localStorage:`, error)
    }
  }, [selectedFilters, storageKey, persist, isLoaded])

  const toggleFilter = (value: string) => {
    setSelectedFilters((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
  }

  const addFilter = (value: string) => {
    setSelectedFilters((prev) => (prev.includes(value) ? prev : [...prev, value]))
  }

  const removeFilter = (value: string) => {
    setSelectedFilters((prev) => prev.filter((v) => v !== value))
  }

  const clearFilters = () => {
    setSelectedFilters([])
  }

  const hasFilter = (value: string) => {
    return selectedFilters.includes(value)
  }

  return {
    selectedFilters,
    toggleFilter,
    addFilter,
    removeFilter,
    clearFilters,
    hasFilter,
    isLoaded,
  }
}

/**
 * useSegmentedControlState Hook
 *
 * Manages segmented control state with localStorage persistence
 */
export interface UseSegmentedControlStateOptions {
  /** Storage key for localStorage */
  storageKey: string

  /** Default selected value */
  defaultValue: string

  /** Whether to persist to localStorage */
  persist?: boolean
}

export function useSegmentedControlState({
  storageKey,
  defaultValue,
  persist = true,
}: UseSegmentedControlStateOptions) {
  const [value, setValue] = useState<string>(defaultValue)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    if (!persist) {
      setIsLoaded(true)
      return
    }

    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        setValue(stored)
      }
    } catch (error) {
      console.warn(`Failed to load segmented control state from localStorage:`, error)
    } finally {
      setIsLoaded(true)
    }
  }, [storageKey, persist])

  // Save to localStorage when value changes
  useEffect(() => {
    if (!persist || !isLoaded) return

    try {
      localStorage.setItem(storageKey, value)
    } catch (error) {
      console.warn(`Failed to save segmented control state to localStorage:`, error)
    }
  }, [value, storageKey, persist, isLoaded])

  return {
    value,
    setValue,
    isLoaded,
  }
}
