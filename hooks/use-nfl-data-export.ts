import { useCallback } from "react"
import type { NFLDataResponse } from "@/lib/nfl-data-service"

export interface UseNFLDataExportResult {
  exportData: (data: NFLDataResponse | null, selectedYears: string[]) => void
}

/**
 * Custom hook for exporting NFL data to JSON
 * Handles data serialization and browser download
 */
export function useNFLDataExport(): UseNFLDataExportResult {
  const exportData = useCallback((data: NFLDataResponse | null, selectedYears: string[]) => {
    if (!data) return

    const dataStr = JSON.stringify(data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement('a')
    link.href = url
    link.download = `nfl-data-${selectedYears.join('-')}-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return {
    exportData,
  }
}
