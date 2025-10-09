import { useState, useCallback } from "react"
import { safeString, safeNumber } from "@/lib/nfl-data-utils"

export interface UseNFLDataSortResult {
  sortField: string
  sortDirection: "asc" | "desc"
  handleSort: (field: string) => void
  sortData: (data: Record<string, unknown>[]) => Record<string, unknown>[]
}

/**
 * Custom hook for sorting NFL data
 * Handles sort field selection, direction toggling, and data sorting logic
 */
export function useNFLDataSort(initialField: string = "fantasy_points_ppr"): UseNFLDataSortResult {
  const [sortField, setSortField] = useState<string>(initialField)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }, [sortField])

  const sortData = useCallback((data: Record<string, unknown>[]) => {
    if (!Array.isArray(data) || data.length === 0) return []

    const validData = data.filter(item => item && typeof item === 'object')

    return validData.sort((a, b) => {
      const aVal = a?.[sortField]
      const bVal = b?.[sortField]

      // Handle string columns
      if (sortField === "player_name" || sortField === "position" || sortField === "team") {
        const aStr = safeString(aVal).toLowerCase()
        const bStr = safeString(bVal).toLowerCase()
        return sortDirection === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
      }

      // Handle numeric columns
      const aNum = safeNumber(aVal)
      const bNum = safeNumber(bVal)

      if (sortDirection === "desc") {
        if (aNum === 0 && bNum !== 0) return 1
        if (bNum === 0 && aNum !== 0) return -1
        return bNum - aNum
      } else {
        if (aNum === 0 && bNum !== 0) return 1
        if (bNum === 0 && aNum !== 0) return -1
        return aNum - bNum
      }
    })
  }, [sortField, sortDirection])

  return {
    sortField,
    sortDirection,
    handleSort,
    sortData,
  }
}
