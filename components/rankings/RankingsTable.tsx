"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { getTierColor } from "@/lib/ranking-utils"

/**
 * Props interface for RankingsTable component
 */
export interface RankingsTableProps {
  rankings: SimplePlayerRanking[]
  sortField: string
  sortDirection: "asc" | "desc"
  onSort: (field: string) => void
  onPlayerClick: (player: SimplePlayerRanking) => void
}

/**
 * Simple player ranking structure for table display
 */
export interface SimplePlayerRanking {
  rank: number
  playerId: string
  playerName: string
  position: string
  team: string
  projectedPoints?: number
  tier?: number
  notes?: string
  injuryStatus?: string
}

/**
 * Sortable table header cell component
 */
interface SortableHeaderProps {
  field: string
  currentField: string
  direction: "asc" | "desc"
  onSort: (field: string) => void
  children: React.ReactNode
}

const SortableHeader: React.FC<SortableHeaderProps> = ({
  field,
  currentField,
  direction,
  onSort,
  children,
}) => (
  <th
    className="text-left p-2 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
    onClick={() => onSort(field)}
    role="columnheader"
    aria-sort={currentField === field ? (direction === "asc" ? "ascending" : "descending") : "none"}
  >
    <div className="flex items-center gap-1">
      {children}
      {currentField === field ? (
        direction === "asc" ? (
          <ArrowUp className="h-3 w-3" aria-hidden="true" />
        ) : (
          <ArrowDown className="h-3 w-3" aria-hidden="true" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" aria-hidden="true" />
      )}
    </div>
  </th>
)

/**
 * RankingsTable Component
 *
 * Displays player rankings in a sortable table format with tier indicators,
 * projected points, injury status, and notes. Supports click-to-view details.
 *
 * @component
 * @example
 * ```tsx
 * <RankingsTable
 *   rankings={filteredRankings}
 *   sortField={tableSortField}
 *   sortDirection={tableSortDirection}
 *   onSort={handleTableSort}
 *   onPlayerClick={setSelectedPlayerForModal}
 * />
 * ```
 */
export const RankingsTable = React.memo<RankingsTableProps>(
  ({ rankings, sortField, sortDirection, onSort, onPlayerClick }) => {
    // Rankings are pre-sorted by parent component
    return (
      <div className="border rounded-md overflow-hidden">
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-sm" role="table" aria-label="Player rankings table">
            <thead className="bg-muted/50 border-b sticky top-0">
              <tr>
                <SortableHeader
                  field="rank"
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={onSort}
                >
                  Rank
                </SortableHeader>
                <SortableHeader
                  field="playerName"
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={onSort}
                >
                  Player
                </SortableHeader>
                <SortableHeader
                  field="position"
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={onSort}
                >
                  Position
                </SortableHeader>
                <SortableHeader
                  field="team"
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={onSort}
                >
                  Team
                </SortableHeader>
                <SortableHeader
                  field="projectedPoints"
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={onSort}
                >
                  Projected Points
                </SortableHeader>
                <SortableHeader
                  field="tier"
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={onSort}
                >
                  Tier
                </SortableHeader>
                <th className="text-left p-2 font-medium" role="columnheader">
                  Status
                </th>
                <th className="text-left p-2 font-medium" role="columnheader">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((player) => (
                <tr
                  key={player.playerId}
                  className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => onPlayerClick(player)}
                  role="row"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      onPlayerClick(player)
                    }
                  }}
                  aria-label={`View details for ${player.playerName}`}
                >
                  <td className="p-2" role="cell">
                    <div
                      className={`w-8 h-8 text-white rounded-full flex items-center justify-center text-sm font-bold ${getTierColor(
                        player.tier
                      )}`}
                      aria-label={`Rank ${player.rank}${player.tier ? `, Tier ${player.tier}` : ""}`}
                    >
                      {player.rank}
                    </div>
                  </td>
                  <td className="p-2 font-medium" role="cell">
                    {player.playerName}
                  </td>
                  <td className="p-2" role="cell">
                    <Badge variant="outline" className="text-xs">
                      {player.position}
                    </Badge>
                  </td>
                  <td className="p-2" role="cell">
                    {player.team}
                  </td>
                  <td className="p-2 font-medium" role="cell">
                    {player.projectedPoints
                      ? `${player.projectedPoints.toFixed(1)} pts`
                      : "-"}
                  </td>
                  <td className="p-2" role="cell">
                    {player.tier ? `Tier ${player.tier}` : "-"}
                  </td>
                  <td className="p-2" role="cell">
                    {player.injuryStatus && player.injuryStatus !== "Healthy" ? (
                      <Badge variant="destructive" className="text-xs">
                        {player.injuryStatus}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Healthy
                      </Badge>
                    )}
                  </td>
                  <td className="p-2 text-xs text-muted-foreground" role="cell">
                    {player.notes
                      ? player.notes.slice(0, 50) +
                        (player.notes.length > 50 ? "..." : "")
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }
)

RankingsTable.displayName = "RankingsTable"
