import type { SleeperPlayer } from "./sleeper-api"

export class PlayerMappingService {
  private players: { [player_id: string]: SleeperPlayer } = {}

  setPlayers(players: { [player_id: string]: SleeperPlayer }) {
    this.players = players
  }

  getPlayerName(playerId: string): string {
    const player = this.players[playerId]
    if (!player) {
      return `Player ${playerId}`
    }
    return player.full_name || `${player.first_name} ${player.last_name}` || `Player ${playerId}`
  }

  getPlayer(playerId: string): SleeperPlayer | null {
    return this.players[playerId] || null
  }

  getPlayersByPosition(position: string): SleeperPlayer[] {
    return Object.values(this.players).filter(
      (player) => player.position === position || player.fantasy_positions?.includes(position),
    )
  }

  getPlayersByTeam(team: string): SleeperPlayer[] {
    return Object.values(this.players).filter((player) => player.team === team)
  }

  searchPlayers(query: string): SleeperPlayer[] {
    const searchTerm = query.toLowerCase()
    return Object.values(this.players)
      .filter(
        (player) =>
          player.full_name?.toLowerCase().includes(searchTerm) ||
          player.first_name?.toLowerCase().includes(searchTerm) ||
          player.last_name?.toLowerCase().includes(searchTerm) ||
          player.team?.toLowerCase().includes(searchTerm),
      )
      .slice(0, 50) // Limit results for performance
  }

  mapPlayerIdsToNames(playerIds: string[]): { [playerId: string]: string } {
    const result: { [playerId: string]: string } = {}
    playerIds.forEach((id) => {
      result[id] = this.getPlayerName(id)
    })
    return result
  }

  getPlayersCount(): number {
    return Object.keys(this.players).length
  }
}

// Export singleton instance
export const playerMapping = new PlayerMappingService()
