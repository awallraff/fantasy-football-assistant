import { useState, useCallback, useMemo } from 'react'

/**
 * Sort direction type
 */
export type SortDirection = "asc" | "desc"

/**
 * Sort configuration for a specific field
 */
export interface SortConfig<T> {
  field: keyof T
  direction: SortDirection
}

/**
 * Custom comparator function type
 */
export type ComparatorFn<T> = (a: T, b: T, direction: SortDirection) => number

/**
 * Field comparators map type
 */
export type FieldComparators<T> = Partial<Record<keyof T, ComparatorFn<T>>>

/**
 * Return type for the useRankingsSort hook
 */
export interface UseRankingsSortReturn<T> {
  // Sort state
  sortField: keyof T
  sortDirection: SortDirection

  // Sort actions
  handleSort: (field: keyof T) => void
  setSortField: (field: keyof T) => void
  setSortDirection: (direction: SortDirection) => void

  // Sorted data
  sortedData: T[]
}

/**
 * Parameters for the useRankingsSort hook
 */
export interface UseRankingsSortParams<T> {
  data: T[]
  initialSortField: keyof T
  initialSortDirection?: SortDirection
  fieldComparators?: FieldComparators<T>
}

/**
 * Generic custom hook for managing sortable data.
 *
 * This hook provides:
 * - Sort field and direction state
 * - Toggle sort logic (click same field to reverse direction)
 * - Memoized sorted data computation
 * - Custom comparator functions per field
 * - Generic implementation for any data type
 *
 * @example
 * ```tsx
 * interface Player {
 *   rank: number
 *   playerName: string
 *   projectedPoints?: number
 * }
 *
 * const { sortedData, handleSort, sortField, sortDirection } = useRankingsSort({
 *   data: players,
 *   initialSortField: "rank",
 *   fieldComparators: {
 *     projectedPoints: (a, b, dir) => {
 *       // Custom logic for sorting points with 0 values at bottom
 *       const aPoints = a.projectedPoints || 0
 *       const bPoints = b.projectedPoints || 0
 *       if (dir === "desc") {
 *         if (aPoints === 0 && bPoints !== 0) return 1
 *         if (bPoints === 0 && aPoints !== 0) return -1
 *       }
 *       return aPoints - bPoints
 *     }
 *   }
 * })
 * ```
 */
export function useRankingsSort<T extends Record<string, any>>({
  data,
  initialSortField,
  initialSortDirection = "asc",
  fieldComparators = {},
}: UseRankingsSortParams<T>): UseRankingsSortReturn<T> {
  const [sortField, setSortField] = useState<keyof T>(initialSortField)
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection)

  /**
   * Handle sort click - toggles direction if same field, or sets new field
   */
  const handleSort = useCallback((field: keyof T) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(prev => prev === "asc" ? "desc" : "asc")
    } else {
      // Set new field and reset to ascending
      setSortField(field)
      setSortDirection("asc")
    }
  }, [sortField])

  /**
   * Default comparator for generic values
   */
  const defaultComparator = useCallback((a: T, b: T, field: keyof T, direction: SortDirection): number => {
    const aValue = a[field]
    const bValue = b[field]

    let compareValue = 0

    // Handle different types
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      compareValue = aValue - bValue
    } else if (typeof aValue === 'string' && typeof bValue === 'string') {
      compareValue = aValue.localeCompare(bValue)
    } else {
      // Fallback to string comparison
      compareValue = String(aValue).localeCompare(String(bValue))
    }

    return direction === "desc" ? -compareValue : compareValue
  }, [])

  /**
   * Sort data based on current sort configuration
   */
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      // Use custom comparator if available for this field
      if (fieldComparators[sortField]) {
        return fieldComparators[sortField]!(a, b, sortDirection)
      }

      // Otherwise use default comparator
      return defaultComparator(a, b, sortField, sortDirection)
    })
  }, [data, sortField, sortDirection, fieldComparators, defaultComparator])

  return {
    sortField,
    sortDirection,
    handleSort,
    setSortField,
    setSortDirection,
    sortedData,
  }
}
