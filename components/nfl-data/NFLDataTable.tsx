"use client"

import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { safeString } from "@/lib/nfl-data-utils"

export interface DataField {
  key: string
  label: string
  category: string
}

export interface NFLDataTableProps {
  data: Record<string, unknown>[]
  showWeek?: boolean
  selectedColumns: string[]
  availableDataFields: DataField[]
  sortField: string
  sortDirection: "asc" | "desc"
  onSort: (field: string) => void
  formatValue: (value: unknown, field: string) => string
  generateKey: (...parts: unknown[]) => string
  maxRows?: number
}

export function NFLDataTable({
  data,
  showWeek = false,
  selectedColumns,
  availableDataFields,
  sortField,
  sortDirection,
  onSort,
  formatValue,
  generateKey,
  maxRows = 100,
}: NFLDataTableProps) {

  const displayData = data.slice(0, maxRows)

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No data available.</p>
      </div>
    )
  }

  return (
    <div className="border rounded-md overflow-hidden">
      {data.length > maxRows && (
        <div className="bg-yellow-50 p-2 text-xs text-yellow-800 border-b">
          Showing first {maxRows} of {data.length} results. Use filters to narrow down.
        </div>
      )}
      <div className="overflow-x-auto max-h-96">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b sticky top-0">
            <tr>
              {showWeek && (
                <th
                  className="text-left p-2 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={() => onSort("week")}
                >
                  <div className="flex items-center gap-1">
                    Week
                    {sortField === "week" ? (
                      sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </div>
                </th>
              )}
              {selectedColumns.map((col, index) => {
                const field = availableDataFields.find(f => f.key === col)
                if (!field) return null

                return (
                  <th
                    key={`header-${col}-${index}`}
                    className="text-left p-2 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => onSort(col)}
                  >
                    <div className="flex items-center gap-1">
                      {field.label}
                      {sortField === col ? (
                        sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {displayData.map((stat, index) => (
              <tr
                key={generateKey(stat?.player_id, stat?.week, stat?.season, index)}
                className="border-b hover:bg-muted/30 transition-colors"
              >
                {showWeek && (
                  <td className="p-2">
                    Week {safeString(stat?.week)}
                  </td>
                )}
                {selectedColumns.map((col, colIndex) => {
                  const field = availableDataFields.find(f => f.key === col)
                  if (!field) return null

                  const value = stat?.[col]
                  const formattedValue = formatValue(value, col)

                  return (
                    <td key={`cell-${col}-${index}-${colIndex}`} className="p-2">
                      {formattedValue}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
