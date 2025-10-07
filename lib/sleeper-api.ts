// Sleeper API client for fantasy football data
import { fetchWithRetry, type RetryOptions } from "./api-retry"

const SLEEPER_BASE_URL = "https://api.sleeper.app/v1"

export interface SleeperUser {
  user_id: string
  username: string
  display_name: string
  avatar: string | null
}

export interface SleeperLeague {
  league_id: string
  name: string
  season: string
  season_type: string
  total_rosters: number
  status: string
  sport: string
  settings: {
    max_keepers?: number
    draft_rounds?: number
    trade_deadline?: number
    playoff_week_start?: number
    num_teams: number
    playoff_teams?: number
    squads?: number
    divisions?: number
    [key: string]: unknown
  }
  scoring_settings: {
    [key: string]: number
  }
  roster_positions: string[]
}

export interface SleeperRoster {
  roster_id: number
  owner_id: string
  players: string[]
  starters: string[]
  reserve?: string[]
  taxi?: string[]
  settings: {
    wins: number
    losses: number
    ties: number
    fpts: number
    fpts_against: number
    fpts_decimal: number
    fpts_against_decimal: number
  }
}

export interface SleeperPlayer {
  player_id: string
  first_name: string
  last_name: string
  full_name: string
  position: string
  team: string
  age?: number
  height?: string
  weight?: string
  years_exp?: number
  college?: string
  injury_status?: string
  fantasy_positions?: string[]
}

export interface SleeperTransaction {
  transaction_id: string
  type: "trade" | "waiver" | "free_agent"
  status: string
  created: number
  roster_ids: number[]
  adds?: { [player_id: string]: number }
  drops?: { [player_id: string]: number }
  draft_picks?: Array<{
    season: string
    round: number
    roster_id: number
    previous_owner_id: number
    owner_id: number
  }>
  waiver_budget?: Array<{
    sender: number
    receiver: number
    amount: number
  }>
}

export interface SleeperMatchup {
  matchup_id: number
  roster_id: number
  points: number
  players: string[]
  starters: string[]
  players_points: { [player_id: string]: number }
  custom_points?: number
}

class SleeperAPI {
  private baseUrl = SLEEPER_BASE_URL
  private playersCache: { [sport: string]: { data: { [player_id: string]: SleeperPlayer }; sessionId: string } } = {}
  private currentSessionId: string
  private defaultRetryOptions: RetryOptions = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    useJitter: true,
    onRetry: (error, attemptNumber, delayMs) => {
      console.log(
        `[Sleeper API] Retry attempt ${attemptNumber} after ${delayMs}ms:`,
        error instanceof Error ? error.message : error
      )
    },
  }

  constructor() {
    this.currentSessionId = Date.now().toString()
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    _timeoutMs = 10000, // Timeout is handled by fetch's signal, kept for API compatibility
    retryOptions?: RetryOptions
  ): Promise<Response> {
    // Use fetchWithRetry for automatic retry with exponential backoff
    return fetchWithRetry(
      url,
      {
        ...options,
        signal: options.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "Fantasy-Analytics-App",
          "Cache-Control": "public, max-age=300", // 5 minute cache
          ...options.headers,
        },
      },
      {
        ...this.defaultRetryOptions,
        ...retryOptions,
        shouldRetry: (error, attemptNumber) => {
          // Custom retry logic
          if (error instanceof Error) {
            const message = error.message

            // Don't retry on 404 (not found) - these are expected for missing data
            if (message.includes("HTTP 404")) {
              return false
            }

            // Don't retry on 400 (bad request) - client error that won't change
            if (message.includes("HTTP 400")) {
              return false
            }

            // Retry on rate limiting (429)
            if (message.includes("HTTP 429")) {
              console.log("[Sleeper API] Rate limited, will retry with backoff")
              return attemptNumber <= 3
            }

            // Retry on server errors (5xx)
            if (message.includes("HTTP 5")) {
              console.log("[Sleeper API] Server error, will retry with backoff")
              return attemptNumber <= 3
            }

            // Retry on network/timeout errors
            if (
              message.includes("network") ||
              message.includes("timeout") ||
              message.includes("Failed to fetch")
            ) {
              console.log("[Sleeper API] Network error, will retry with backoff")
              return attemptNumber <= 3
            }
          }

          return false
        },
      }
    ).catch((error) => {
      // Transform errors for better user experience
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error("Request timed out")
        }
        if (error.message.includes("Failed to fetch")) {
          throw new Error("Network error - please check your connection")
        }
      }
      throw error
    })
  }

  // User endpoints
  async getUser(username: string, options: RequestInit = {}): Promise<SleeperUser | null> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/user/${username}`, options)
      if (!response.ok) return null
      return await response.json()
    } catch (error) {
      console.error("Error fetching user:", error)
      return null
    }
  }

  async getUserById(userId: string, options: RequestInit = {}): Promise<SleeperUser | null> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/user/${userId}`, options)
      if (!response.ok) return null
      return await response.json()
    } catch (error) {
      console.error("Error fetching user by ID:", error)
      return null
    }
  }

  // League endpoints
  async getUserLeagues(
    userId: string,
    sport = "nfl",
    season = "2025", // Prioritizing 2025 as default since dynasty drafts are complete
    options: RequestInit = {},
  ): Promise<SleeperLeague[]> {
    try {
      console.log(`Fetching leagues for user ${userId} in ${season} season...`)
      const response = await this.fetchWithTimeout(`${this.baseUrl}/user/${userId}/leagues/${sport}/${season}`, options)

      if (!response.ok) {
        console.log(`${season} season data not available (status: ${response.status}), trying fallback...`)
        if (season === "2025") {
          console.log("Trying 2024 season as fallback...")
          return this.getUserLeagues(userId, sport, "2024", options)
        } else if (season === "2024") {
          console.log("Trying 2023 season as final fallback...")
          return this.getUserLeagues(userId, sport, "2023", options)
        }
        return []
      }

      const leagues = await response.json()
      console.log(`Successfully fetched ${leagues.length} leagues for ${season} season`)
      return leagues
    } catch (error) {
      console.error(`Error fetching user leagues for ${season}:`, error)
      if (season === "2025") {
        console.log("Error occurred, trying 2024 season...")
        return this.getUserLeagues(userId, sport, "2024", options)
      }
      return []
    }
  }

  async getLeague(leagueId: string): Promise<SleeperLeague | null> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/league/${leagueId}`)
      if (!response.ok) return null
      return await response.json()
    } catch (error) {
      console.error("Error fetching league:", error)
      return null
    }
  }

  async getLeagueRosters(leagueId: string, options: RequestInit = {}): Promise<SleeperRoster[]> {
    try {
      if (!leagueId?.trim()) {
        throw new Error("Invalid league ID")
      }
      const response = await this.fetchWithTimeout(`${this.baseUrl}/league/${leagueId}/rosters`, options)
      return await response.json()
    } catch (error) {
      console.error("Error fetching league rosters:", error)
      return []
    }
  }

  async getLeagueUsers(leagueId: string, options: RequestInit = {}): Promise<SleeperUser[]> {
    try {
      if (!leagueId?.trim()) {
        throw new Error("Invalid league ID")
      }
      const response = await this.fetchWithTimeout(`${this.baseUrl}/league/${leagueId}/users`, options)
      return await response.json()
    } catch (error) {
      console.error("Error fetching league users:", error)
      return []
    }
  }

  async getMatchups(leagueId: string, week: number): Promise<SleeperMatchup[]> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/league/${leagueId}/matchups/${week}`)
      if (!response.ok) return []
      return await response.json()
    } catch (error) {
      console.error("Error fetching matchups:", error)
      return []
    }
  }

  async getTransactions(leagueId: string, week?: number): Promise<SleeperTransaction[]> {
    try {
      if (!leagueId || leagueId.trim() === "") {
        console.error("Invalid league ID provided to getTransactions")
        return []
      }

      const url = week
        ? `${this.baseUrl}/league/${leagueId}/transactions/${week}`
        : `${this.baseUrl}/league/${leagueId}/transactions`

      console.log(`Fetching transactions from: ${url}`)
      const response = await this.fetchWithTimeout(url, {}, 15000) // Increased timeout

      if (!response.ok) {
        console.warn(`Failed to fetch transactions: ${response.status} ${response.statusText}`)
        if (response.status === 404) {
          console.log("League not found or no transactions available")
        } else if (response.status === 429) {
          console.log("Rate limited by Sleeper API")
        } else if (response.status >= 500) {
          console.log("Sleeper API server error")
        }
        return []
      }

      const transactions = await response.json()

      if (!Array.isArray(transactions)) {
        console.warn("Invalid response format from transactions API")
        return []
      }

      console.log(`Successfully fetched ${transactions.length} transactions`)
      return transactions
    } catch (error) {
      console.warn(
        "Error fetching transactions (returning empty array):",
        error instanceof Error ? error.message : error,
      )
      return []
    }
  }

  async getTradedPicks(leagueId: string): Promise<unknown[]> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/league/${leagueId}/traded_picks`)
      if (!response.ok) return []
      return await response.json()
    } catch (error) {
      console.error("Error fetching traded picks:", error)
      return []
    }
  }

  // Player endpoints
  async getAllPlayers(sport = "nfl"): Promise<{ [player_id: string]: SleeperPlayer }> {
    try {
      const cached = this.playersCache[sport]
      if (cached && cached.sessionId === this.currentSessionId) {
        console.log("Using session-cached players data")
        return cached.data
      }

      console.log("Fetching players data from Sleeper API (session cache miss)...")
      const response = await this.fetchWithTimeout(`${this.baseUrl}/players/${sport}`, {}, 30000)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      this.playersCache[sport] = {
        data,
        sessionId: this.currentSessionId,
      }

      console.log(`Successfully loaded ${Object.keys(data).length} players for session`)
      return data
    } catch (error) {
      console.error("Error fetching all players:", error)

      const cached = this.playersCache[sport]
      if (cached) {
        console.log("Using cached players data as fallback")
        return cached.data
      }

      console.log("Using mock players data as fallback")
      return this.getMockPlayersData()
    }
  }

  async getTrendingPlayers(
    sport = "nfl",
    addDrop: "add" | "drop" = "add",
    lookbackHours = 24,
    limit = 25,
  ): Promise<Array<{ player_id: string; count: number }>> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/players/${sport}/trending/${addDrop}?lookback_hours=${lookbackHours}&limit=${limit}`,
      )
      if (!response.ok) return []
      return await response.json()
    } catch (error) {
      console.error("Error fetching trending players:", error)
      return []
    }
  }

  // Utility methods
  async getLeagueWithDetails(leagueId: string, options: RequestInit = {}): Promise<{
    league: SleeperLeague | null;
    rosters: SleeperRoster[];
    users: SleeperUser[];
  }> {
    try {
      const [league, rosters, users] = await Promise.all([
        this.getLeague(leagueId),
        this.getLeagueRosters(leagueId, options),
        this.getLeagueUsers(leagueId, options),
      ])

      return {
        league,
        rosters,
        users,
      }
    } catch (error) {
      console.error("Error fetching league details:", error)
      return {
        league: null,
        rosters: [],
        users: [],
      }
    }
  }

  async getTradeHistory(leagueId: string, weeks?: number[]): Promise<SleeperTransaction[]> {
    try {
      if (weeks && Array.isArray(weeks)) {
        const allTransactions = await Promise.all(weeks.map((week) => this.getTransactions(leagueId, week)))
        return allTransactions.flat().filter((t) => t.type === "trade")
      } else {
        const transactions = await this.getTransactions(leagueId)
        return transactions.filter((t) => t.type === "trade")
      }
    } catch (error) {
      console.error("Error fetching trade history:", error)
      return []
    }
  }

  async getTradeHistoryBySeason(leagueId: string): Promise<SleeperTransaction[]> {
    try {
      // Get all transactions for the league (no specific week)
      const transactions = await this.getTransactions(leagueId)

      // Filter for trades only
      const trades = transactions.filter((t) => t.type === "trade")

      // For now, return all trades since Sleeper API doesn't directly support season filtering
      // In a real implementation, you'd need to determine which league ID corresponds to which season
      return trades
    } catch (error) {
      console.error("Error fetching trade history by season:", error)
      return []
    }
  }

  // New methods
  getCurrentSeason(): string {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // JavaScript months are 0-indexed

    // NFL season typically starts in September and runs through February of next year
    // If it's March-August, we're in the offseason for the upcoming season
    if (currentYear === 2025) {
      return "2025"
    }

    if (currentMonth >= 3 && currentMonth <= 8) {
      return currentYear.toString()
    } else {
      return currentMonth >= 9 ? currentYear.toString() : (currentYear - 1).toString()
    }
  }

  async isSeasonDataAvailable(userId: string, season: string): Promise<boolean> {
    try {
      const leagues = await this.getUserLeagues(userId, "nfl", season)
      return leagues.length > 0
    } catch {
      return false
    }
  }

  private getMockPlayersData(): { [player_id: string]: SleeperPlayer } {
    return {
      "4046": {
        player_id: "4046",
        first_name: "Josh",
        last_name: "Allen",
        full_name: "Josh Allen",
        position: "QB",
        team: "BUF",
        age: 28,
        height: "6'5\"",
        weight: "237",
        years_exp: 6,
        college: "Wyoming",
        fantasy_positions: ["QB"],
      },
      "4017": {
        player_id: "4017",
        first_name: "Christian",
        last_name: "McCaffrey",
        full_name: "Christian McCaffrey",
        position: "RB",
        team: "SF",
        age: 28,
        height: "5'11\"",
        weight: "205",
        years_exp: 7,
        college: "Stanford",
        fantasy_positions: ["RB"],
      },
      "6794": {
        player_id: "6794",
        first_name: "Cooper",
        last_name: "Kupp",
        full_name: "Cooper Kupp",
        position: "WR",
        team: "LAR",
        age: 31,
        height: "6'2\"",
        weight: "208",
        years_exp: 7,
        college: "Eastern Washington",
        fantasy_positions: ["WR"],
      },
      "4881": {
        player_id: "4881",
        first_name: "Travis",
        last_name: "Kelce",
        full_name: "Travis Kelce",
        position: "TE",
        team: "KC",
        age: 35,
        height: "6'5\"",
        weight: "250",
        years_exp: 11,
        college: "Cincinnati",
        fantasy_positions: ["TE"],
      },
    }
  }

  async getUserLeaguesMultiSeason(
    userId: string,
    sport = "nfl",
  ): Promise<{ season: string; leagues: SleeperLeague[] }[]> {
    const seasons = ["2025", "2024", "2023"]
    const results = []

    for (const season of seasons) {
      try {
        console.log(`Checking ${season} season for user ${userId}...`)
        const response = await this.fetchWithTimeout(`${this.baseUrl}/user/${userId}/leagues/${sport}/${season}`)

        if (response.ok) {
          const leagues = await response.json()
          console.log(`Found ${leagues.length} leagues in ${season}`)
          results.push({ season, leagues })
        } else {
          console.log(`No data available for ${season} season (status: ${response.status})`)
          results.push({ season, leagues: [] })
        }
      } catch (error) {
        console.error(`Error checking ${season} season:`, error)
        results.push({ season, leagues: [] })
      }
    }

    return results
  }

  clearSessionCache(): void {
    this.currentSessionId = Date.now().toString()
    this.playersCache = {}
    console.log("Session cache cleared")
  }
}

// Create instance
const sleeperAPIInstance = new SleeperAPI()

// Export both as named and default for compatibility
export const sleeperAPI = sleeperAPIInstance
export default sleeperAPIInstance
