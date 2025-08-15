"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calculator, Plus, Minus, ArrowRightLeft } from "lucide-react"
import type { SleeperLeague } from "@/lib/sleeper-api"

interface TradeEvaluatorProps {
  league: SleeperLeague
}

interface TradePlayer {
  id: string
  name: string
  position: string
  team: string
  value: number
  rank?: number
}

interface TradeProposal {
  teamA: {
    name: string
    players: TradePlayer[]
    totalValue: number
  }
  teamB: {
    name: string
    players: TradePlayer[]
    totalValue: number
  }
  fairness: "fair" | "favors_a" | "favors_b"
  valueDifference: number
}

export function TradeEvaluator({ league }: TradeEvaluatorProps) {
  const [proposal, setProposal] = useState<TradeProposal>({
    teamA: { name: "Your Team", players: [], totalValue: 0 },
    teamB: { name: "Their Team", players: [], totalValue: 0 },
    fairness: "fair",
    valueDifference: 0,
  })

  const [newPlayer, setNewPlayer] = useState({
    name: "",
    position: "RB",
    team: "",
    value: 0,
    rank: 0,
  })

  const [selectedTeam, setSelectedTeam] = useState<"A" | "B">("A")

  const addPlayer = () => {
    if (!newPlayer.name.trim()) return

    const player: TradePlayer = {
      id: Date.now().toString(),
      name: newPlayer.name,
      position: newPlayer.position,
      team: newPlayer.team,
      value: newPlayer.value,
      rank: newPlayer.rank,
    }

    const updatedProposal = { ...proposal }
    if (selectedTeam === "A") {
      updatedProposal.teamA.players.push(player)
      updatedProposal.teamA.totalValue += player.value
    } else {
      updatedProposal.teamB.players.push(player)
      updatedProposal.teamB.totalValue += player.value
    }

    // Calculate fairness
    updatedProposal.valueDifference = Math.abs(updatedProposal.teamA.totalValue - updatedProposal.teamB.totalValue)
    if (updatedProposal.valueDifference <= 5) {
      updatedProposal.fairness = "fair"
    } else if (updatedProposal.teamA.totalValue > updatedProposal.teamB.totalValue) {
      updatedProposal.fairness = "favors_a"
    } else {
      updatedProposal.fairness = "favors_b"
    }

    setProposal(updatedProposal)
    setNewPlayer({ name: "", position: "RB", team: "", value: 0, rank: 0 })
  }

  const removePlayer = (team: "A" | "B", playerId: string) => {
    const updatedProposal = { ...proposal }
    if (team === "A") {
      const player = updatedProposal.teamA.players.find((p) => p.id === playerId)
      if (player) {
        updatedProposal.teamA.players = updatedProposal.teamA.players.filter((p) => p.id !== playerId)
        updatedProposal.teamA.totalValue -= player.value
      }
    } else {
      const player = updatedProposal.teamB.players.find((p) => p.id === playerId)
      if (player) {
        updatedProposal.teamB.players = updatedProposal.teamB.players.filter((p) => p.id !== playerId)
        updatedProposal.teamB.totalValue -= player.value
      }
    }

    // Recalculate fairness
    updatedProposal.valueDifference = Math.abs(updatedProposal.teamA.totalValue - updatedProposal.teamB.totalValue)
    if (updatedProposal.valueDifference <= 5) {
      updatedProposal.fairness = "fair"
    } else if (updatedProposal.teamA.totalValue > updatedProposal.teamB.totalValue) {
      updatedProposal.fairness = "favors_a"
    } else {
      updatedProposal.fairness = "favors_b"
    }

    setProposal(updatedProposal)
  }

  const clearTrade = () => {
    setProposal({
      teamA: { name: "Your Team", players: [], totalValue: 0 },
      teamB: { name: "Their Team", players: [], totalValue: 0 },
      fairness: "fair",
      valueDifference: 0,
    })
  }

  const getFairnessColor = (fairness: string) => {
    switch (fairness) {
      case "fair":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "favors_a":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "favors_b":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getFairnessText = (fairness: string) => {
    switch (fairness) {
      case "fair":
        return "Fair Trade"
      case "favors_a":
        return "Favors Your Team"
      case "favors_b":
        return "Favors Their Team"
      default:
        return "Unknown"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Trade Evaluator
          </CardTitle>
          <CardDescription>
            Evaluate trade proposals using player values and rankings to determine fairness
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add Player Form */}
          <div className="grid md:grid-cols-6 gap-4 p-4 border rounded-lg">
            <div className="space-y-2">
              <Label>Player Name</Label>
              <Input
                value={newPlayer.name}
                onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                placeholder="Enter player name"
              />
            </div>
            <div className="space-y-2">
              <Label>Position</Label>
              <Select
                value={newPlayer.position}
                onValueChange={(value) => setNewPlayer({ ...newPlayer, position: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="QB">QB</SelectItem>
                  <SelectItem value="RB">RB</SelectItem>
                  <SelectItem value="WR">WR</SelectItem>
                  <SelectItem value="TE">TE</SelectItem>
                  <SelectItem value="K">K</SelectItem>
                  <SelectItem value="DEF">DEF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Team</Label>
              <Input
                value={newPlayer.team}
                onChange={(e) => setNewPlayer({ ...newPlayer, team: e.target.value })}
                placeholder="Team"
              />
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              <Input
                type="number"
                value={newPlayer.value}
                onChange={(e) => setNewPlayer({ ...newPlayer, value: Number.parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Add To</Label>
              <Select value={selectedTeam} onValueChange={(value: "A" | "B") => setSelectedTeam(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Your Team</SelectItem>
                  <SelectItem value="B">Their Team</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={addPlayer} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

          {/* Trade Proposal */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Team A */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{proposal.teamA.name}</CardTitle>
                <CardDescription>Total Value: {proposal.teamA.totalValue.toFixed(1)}</CardDescription>
              </CardHeader>
              <CardContent>
                {proposal.teamA.players.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No players added</p>
                ) : (
                  <div className="space-y-2">
                    {proposal.teamA.players.map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{player.name}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{player.position}</Badge>
                            <span className="text-sm text-gray-500">{player.team}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{player.value}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removePlayer("A", player.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Team B */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{proposal.teamB.name}</CardTitle>
                <CardDescription>Total Value: {proposal.teamB.totalValue.toFixed(1)}</CardDescription>
              </CardHeader>
              <CardContent>
                {proposal.teamB.players.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No players added</p>
                ) : (
                  <div className="space-y-2">
                    {proposal.teamB.players.map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{player.name}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{player.position}</Badge>
                            <span className="text-sm text-gray-500">{player.team}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{player.value}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removePlayer("B", player.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Trade Analysis */}
          {(proposal.teamA.players.length > 0 || proposal.teamB.players.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5" />
                  Trade Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{proposal.teamA.totalValue.toFixed(1)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Your Team Value</p>
                  </div>
                  <div className="text-center">
                    <Badge className={getFairnessColor(proposal.fairness)} variant="secondary">
                      {getFairnessText(proposal.fairness)}
                    </Badge>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Difference: {proposal.valueDifference.toFixed(1)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{proposal.teamB.totalValue.toFixed(1)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Their Team Value</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Trade Recommendation</h4>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      {proposal.fairness === "fair" && (
                        <p className="text-green-700 dark:text-green-300">
                          ✅ This appears to be a fair trade with balanced value on both sides.
                        </p>
                      )}
                      {proposal.fairness === "favors_a" && (
                        <p className="text-blue-700 dark:text-blue-300">
                          📈 This trade favors your team by {proposal.valueDifference.toFixed(1)} points. Consider
                          accepting if you need the players being offered.
                        </p>
                      )}
                      {proposal.fairness === "favors_b" && (
                        <p className="text-orange-700 dark:text-orange-300">
                          📉 This trade favors their team by {proposal.valueDifference.toFixed(1)} points. You might
                          want to ask for additional value or reconsider.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={clearTrade} variant="outline">
                      Clear Trade
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
