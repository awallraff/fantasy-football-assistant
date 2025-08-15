"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Download, Search } from "lucide-react"
import type { RankingSystem } from "@/lib/rankings-types"

interface RankingsManagerProps {
  systems: RankingSystem[]
  selectedSystem: RankingSystem | null
  onSelectSystem: (system: RankingSystem) => void
  onDeleteSystem: (systemId: string) => void
  onUpdateSystem: (system: RankingSystem) => void
}

export function RankingsManager({
  systems,
  selectedSystem,
  onSelectSystem,
  onDeleteSystem,
  onUpdateSystem,
}: RankingsManagerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [positionFilter, setPositionFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"rank" | "name" | "position" | "team">("rank")

  const handleExport = (system: RankingSystem) => {
    const dataStr = JSON.stringify(system, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const exportFileDefaultName = `${system.name.replace(/\s+/g, "_")}_rankings.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const filteredRankings = selectedSystem
    ? selectedSystem.rankings
        .filter((player) => {
          const matchesSearch = player.playerName.toLowerCase().includes(searchTerm.toLowerCase())
          const matchesPosition = positionFilter === "all" || player.position === positionFilter
          return matchesSearch && matchesPosition
        })
        .sort((a, b) => {
          switch (sortBy) {
            case "name":
              return a.playerName.localeCompare(b.playerName)
            case "position":
              return a.position.localeCompare(b.position)
            case "team":
              return a.team.localeCompare(b.team)
            default:
              return a.rank - b.rank
          }
        })
    : []

  const uniquePositions = selectedSystem ? [...new Set(selectedSystem.rankings.map((r) => r.position))] : []

  return (
    <div className="space-y-6">
      {/* System Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking Systems</CardTitle>
          <CardDescription>Select and manage your imported ranking systems</CardDescription>
        </CardHeader>
        <CardContent>
          {systems.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No ranking systems imported yet</p>
          ) : (
            <div className="grid gap-4">
              {systems.map((system) => (
                <div
                  key={system.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedSystem?.id === system.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => onSelectSystem(system)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{system.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{system.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{system.scoringFormat?.toUpperCase() || "STANDARD"}</Badge>
                        <Badge variant="outline">{system.season}</Badge>
                        <Badge variant="outline">{system.rankings.length} players</Badge>
                        {system.source && <Badge variant="secondary">{system.source}</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleExport(system)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteSystem(system.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Player Rankings Table */}
      {selectedSystem && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedSystem.name} - Player Rankings</CardTitle>
            <CardDescription>
              {filteredRankings.length} of {selectedSystem.rankings.length} players
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search players..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  {uniquePositions.map((pos) => (
                    <SelectItem key={pos} value={pos}>
                      {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rank">Rank</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="position">Position</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rankings Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Proj. Pts</TableHead>
                    <TableHead>ADP</TableHead>
                    <TableHead>Bye</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRankings.slice(0, 100).map((player) => (
                    <TableRow key={player.playerId}>
                      <TableCell className="font-medium">{player.rank}</TableCell>
                      <TableCell className="font-medium">{player.playerName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{player.position}</Badge>
                      </TableCell>
                      <TableCell>{player.team}</TableCell>
                      <TableCell>{player.tier || "-"}</TableCell>
                      <TableCell>{player.projectedPoints?.toFixed(1) || "-"}</TableCell>
                      <TableCell>{player.adp?.toFixed(1) || "-"}</TableCell>
                      <TableCell>{player.bye || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredRankings.length > 100 && (
              <p className="text-sm text-gray-500 mt-4 text-center">
                Showing first 100 results. Use filters to narrow down the list.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
