interface FantasyNerdsPlayer {
  playerId: string
  player: string
  position: string
  team: string
  rank: number
  tier?: number
  projectedPoints?: number
}

interface FantasyNerdsResponse {
  players: FantasyNerdsPlayer[]
}

export class FantasyNerdsAPI {
  private baseUrl = "https://api.fantasynerds.com/v1/nfl"
  private apiKey: string

  constructor(apiKey = "TEST") {
    this.apiKey = apiKey
  }

  async getDraftRankings(position?: string): Promise<FantasyNerdsPlayer[]> {
    try {
      const url = `${this.baseUrl}/draft-rankings?apikey=${this.apiKey}${position ? `&position=${position}` : ""}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Fantasy Nerds API error: ${response.status}`)
      }

      const data: FantasyNerdsResponse = await response.json()
      return data.players || []
    } catch (error) {
      console.error("Error fetching Fantasy Nerds rankings:", error)
      return []
    }
  }

  async getWeeklyRankings(week: number, position?: string): Promise<FantasyNerdsPlayer[]> {
    try {
      const url = `${this.baseUrl}/weekly-rankings?apikey=${this.apiKey}&week=${week}${position ? `&position=${position}` : ""}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Fantasy Nerds API error: ${response.status}`)
      }

      const data: FantasyNerdsResponse = await response.json()
      return data.players || []
    } catch (error) {
      console.error("Error fetching Fantasy Nerds weekly rankings:", error)
      return []
    }
  }

  async getDraftProjections(position?: string): Promise<FantasyNerdsPlayer[]> {
    try {
      const url = `${this.baseUrl}/draft-projections?apikey=${this.apiKey}${position ? `&position=${position}` : ""}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Fantasy Nerds API error: ${response.status}`)
      }

      const data: FantasyNerdsResponse = await response.json()
      return data.players || []
    } catch (error) {
      console.error("Error fetching Fantasy Nerds projections:", error)
      return []
    }
  }
}
