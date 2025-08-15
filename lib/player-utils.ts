import type { SleeperPlayer } from "./sleeper-api"

export function formatPlayerName(player: SleeperPlayer): string {
  if (player.full_name) {
    return player.full_name
  }

  if (player.first_name && player.last_name) {
    return `${player.first_name} ${player.last_name}`
  }

  return `Player ${player.player_id}`
}

export function normalizePosition(position: string | null | undefined): string {
  if (!position) {
    return "UNKNOWN"
  }

  // Map any numeric or non-standard positions to proper football positions
  const positionMap: Record<string, string> = {
    "1": "QB",
    "2": "RB",
    "3": "WR",
    "4": "TE",
    "5": "K",
    "6": "DEF",
    qb: "QB",
    rb: "RB",
    wr: "WR",
    te: "TE",
    k: "K",
    def: "DEF",
    dst: "DEF",
    defense: "DEF",
  }

  const normalized = positionMap[position.toLowerCase()]
  return normalized || position.toUpperCase()
}

export function getPositionPriority(position: string): number {
  // Define position priority for sorting
  const priorities: Record<string, number> = {
    QB: 1,
    RB: 2,
    WR: 3,
    TE: 4,
    K: 5,
    DEF: 6,
  }

  return priorities[position] || 99
}

export function getRelevantPositions(leagueSettings: { roster_positions: string[] }): string[] {
  // Extract relevant positions from league settings, excluding FLEX, BN, etc.
  const relevantPositions = new Set<string>()

  for (const pos of leagueSettings.roster_positions) {
    const normalized = normalizePosition(pos)
    if (!["FLEX", "BN", "BENCH", "IR", "TAXI"].includes(normalized)) {
      relevantPositions.add(normalized)
    }
  }

  return Array.from(relevantPositions).sort((a, b) => getPositionPriority(a) - getPositionPriority(b))
}

export function filterPlayersByPosition(
  players: { [player_id: string]: SleeperPlayer },
  position: string,
): SleeperPlayer[] {
  return Object.values(players)
    .filter((player) => player.position && normalizePosition(player.position) === position)
    .sort((a, b) => formatPlayerName(a).localeCompare(formatPlayerName(b)))
}
