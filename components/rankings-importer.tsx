"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react"
import type { RankingSystem, PlayerRanking } from "@/lib/rankings-types"

interface RankingsImporterProps {
  onImportComplete: (system: RankingSystem) => void
}

export function RankingsImporter({ onImportComplete }: RankingsImporterProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    source: "",
    season: "2024",
    scoringFormat: "ppr" as const,
  })
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      setSuccess(false)
    }
  }

  const parseCSV = (csvText: string): PlayerRanking[] => {
    const lines = csvText.trim().split("\n")
    if (lines.length < 2) {
      throw new Error("CSV file must have at least a header row and one data row")
    }

    // Parse CSV properly handling quoted fields
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = []
      let current = ""
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === "," && !inQuotes) {
          result.push(current.trim())
          current = ""
        } else {
          current += char
        }
      }
      result.push(current.trim())
      return result
    }

    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""))

    // Flexible header mapping - try to detect common variations
    const findColumnIndex = (possibleNames: string[]): number => {
      for (const name of possibleNames) {
        const index = headers.findIndex((h) => h.includes(name.toLowerCase().replace(/[^a-z0-9]/g, "")))
        if (index !== -1) return index
      }
      return -1
    }

    const columnMap = {
      rank: findColumnIndex(["rank", "ranking", "pos", "position", "rk", "#"]),
      playerName: findColumnIndex(["playername", "player", "name", "fullname", "playerfullname"]),
      position: findColumnIndex(["position", "pos", "slot"]),
      team: findColumnIndex(["team", "tm", "nflteam"]),
      projectedPoints: findColumnIndex(["projectedpoints", "points", "proj", "projection", "pts", "fpts"]),
      tier: findColumnIndex(["tier", "tr"]),
      adp: findColumnIndex(["adp", "averagedraftposition", "avgdraft"]),
      bye: findColumnIndex(["bye", "byeweek", "week"]),
    }

    // If we can't find essential columns, try positional fallback
    if (columnMap.playerName === -1) {
      // Look for the column with the most text-like data (likely player names)
      const sampleRow = parseCSVLine(lines[1])
      for (let i = 0; i < sampleRow.length; i++) {
        const value = sampleRow[i]
        if (value && /^[A-Za-z\s.']+$/.test(value) && value.length > 3) {
          columnMap.playerName = i
          break
        }
      }
    }

    if (columnMap.rank === -1) {
      // Look for the column with sequential numbers starting from 1
      const sampleRows = lines.slice(1, Math.min(6, lines.length)).map((line) => parseCSVLine(line))
      for (let i = 0; i < (sampleRows[0]?.length || 0); i++) {
        const values = sampleRows.map((row) => Number.parseInt(row[i]))
        if (values.every((v, idx) => !isNaN(v) && v === idx + 1)) {
          columnMap.rank = i
          break
        }
      }
    }

    if (columnMap.position === -1) {
      // Look for column with position-like values (QB, RB, WR, TE, etc.)
      const sampleRow = parseCSVLine(lines[1])
      for (let i = 0; i < sampleRow.length; i++) {
        const value = sampleRow[i]?.toUpperCase()
        if (value && /^(QB|RB|WR|TE|K|DST|DEF)$/.test(value)) {
          columnMap.position = i
          break
        }
      }
    }

    const rankings: PlayerRanking[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])

      if (values.length < 2) continue // Skip invalid rows

      // Extract values using column mapping with fallbacks
      const playerName =
        columnMap.playerName !== -1
          ? values[columnMap.playerName]
          : values.find((v) => v && /^[A-Za-z\s.']+$/.test(v) && v.length > 3) || ""

      const rank = columnMap.rank !== -1 ? Number.parseInt(values[columnMap.rank]) : i

      const position =
        columnMap.position !== -1
          ? values[columnMap.position]
          : values.find((v) => v && /^(QB|RB|WR|TE|K|DST|DEF)$/i.test(v.toUpperCase())) || ""

      if (!playerName.trim()) {
        console.warn(`Skipping row ${i + 1}: No player name found`)
        continue
      }

      const ranking: PlayerRanking = {
        playerId: `${playerName.replace(/\s+/g, "_")}_${i}`,
        playerName: playerName.trim(),
        position: position.toUpperCase(),
        team: columnMap.team !== -1 ? values[columnMap.team] || "" : "",
        rank: isNaN(rank) ? i : rank,
        tier: columnMap.tier !== -1 && values[columnMap.tier] ? Number.parseInt(values[columnMap.tier]) : undefined,
        projectedPoints:
          columnMap.projectedPoints !== -1 && values[columnMap.projectedPoints]
            ? Number.parseFloat(values[columnMap.projectedPoints])
            : undefined,
        notes: undefined,
        adp: columnMap.adp !== -1 && values[columnMap.adp] ? Number.parseFloat(values[columnMap.adp]) : undefined,
        bye: columnMap.bye !== -1 && values[columnMap.bye] ? Number.parseInt(values[columnMap.bye]) : undefined,
      }

      rankings.push(ranking)
    }

    if (rankings.length === 0) {
      throw new Error("No valid player data found. Please check your CSV format and ensure it contains player names.")
    }

    return rankings
  }

  const parseJSON = (jsonText: string): PlayerRanking[] => {
    try {
      const data = JSON.parse(jsonText)
      if (Array.isArray(data)) {
        return data.map((item, index) => ({
          playerId: item.playerId || `${item.playerName || item.name}_${index}`,
          playerName: item.playerName || item.name || "",
          position: item.position || "",
          team: item.team || "",
          rank: item.rank || index + 1,
          tier: item.tier,
          projectedPoints: item.projectedPoints || item.points,
          notes: item.notes,
          adp: item.adp,
          bye: item.bye,
        }))
      }
      throw new Error("JSON must be an array of player objects")
    } catch (err) {
      throw new Error("Invalid JSON format")
    }
  }

  const handleImport = async () => {
    if (!file || !formData.name.trim()) {
      setError("Please provide a name and select a file")
      return
    }

    setImporting(true)
    setError(null)

    try {
      const fileText = await file.text()
      let rankings: PlayerRanking[]

      if (file.name.endsWith(".csv")) {
        rankings = parseCSV(fileText)
      } else if (file.name.endsWith(".json")) {
        rankings = parseJSON(fileText)
      } else {
        throw new Error("Unsupported file format. Please use CSV or JSON.")
      }

      if (rankings.length === 0) {
        throw new Error("No valid player rankings found in file")
      }

      // Extract unique positions
      const positions = [...new Set(rankings.map((r) => r.position).filter(Boolean))]

      const newSystem: RankingSystem = {
        id: `system_${Date.now()}`,
        name: formData.name,
        description: formData.description,
        source: formData.source,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        season: formData.season,
        scoringFormat: formData.scoringFormat,
        positions,
        rankings: rankings.sort((a, b) => a.rank - b.rank),
        metadata: {
          totalPlayers: rankings.length,
          lastUpdated: new Date().toISOString(),
        },
      }

      onImportComplete(newSystem)
      setSuccess(true)

      // Reset form
      setFormData({
        name: "",
        description: "",
        source: "",
        season: "2024",
        scoringFormat: "ppr",
      })
      setFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import rankings")
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Player Rankings
          </CardTitle>
          <CardDescription>
            Upload CSV or JSON files with player rankings. Supported formats include FantasyPros, ESPN, Yahoo, and
            custom formats.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>Rankings imported successfully!</AlertDescription>
            </Alert>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">System Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., FantasyPros Week 1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="e.g., FantasyPros, ESPN, Custom"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this ranking system..."
              rows={2}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="season">Season</Label>
              <Input
                id="season"
                value={formData.season}
                onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                placeholder="2024"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scoring">Scoring Format</Label>
              <Select
                value={formData.scoringFormat}
                onValueChange={(value: any) => setFormData({ ...formData, scoringFormat: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="ppr">PPR</SelectItem>
                  <SelectItem value="half-ppr">Half PPR</SelectItem>
                  <SelectItem value="superflex">Superflex</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Rankings File *</Label>
            <Input id="file" type="file" accept=".csv,.json" onChange={handleFileChange} />
            <p className="text-xs text-gray-500">
              Supported formats: CSV, JSON. CSV should include columns: rank, player_name, position, team
            </p>
          </div>

          <Button onClick={handleImport} disabled={importing || !file || !formData.name.trim()} className="w-full">
            {importing ? "Importing..." : "Import Rankings"}
          </Button>
        </CardContent>
      </Card>

      {/* Format Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            File Format Examples
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">CSV Format:</h4>
            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
              {`rank,player_name,position,team,projected_points,tier,adp,bye
1,Josh Allen,QB,BUF,24.5,1,15.2,12
2,Lamar Jackson,QB,BAL,23.8,1,18.5,14
3,Christian McCaffrey,RB,SF,22.1,1,2.1,9`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">JSON Format:</h4>
            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
              {`[
  {
    "rank": 1,
    "playerName": "Josh Allen",
    "position": "QB",
    "team": "BUF",
    "projectedPoints": 24.5,
    "tier": 1,
    "adp": 15.2,
    "bye": 12
  }
]`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
