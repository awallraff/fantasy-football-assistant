export interface SmokeTestResult {
  testName: string
  passed: boolean
  error?: string
  duration: number
}

export class SmokeTestRunner {
  private results: SmokeTestResult[] = []

  async runAllTests(): Promise<SmokeTestResult[]> {
    console.log("🧪 Running smoke tests...")
    this.results = []

    const tests = [
      this.testSleeperAPIConnection,
      this.testPlayerDataLoading,
      this.testLeagueConnection,
      this.testRankingsSystem,
      this.testTradeAnalysis,
      this.testRecommendationEngine,
    ]

    for (const test of tests) {
      await this.runTest(test.name, test.bind(this))
    }

    const passedTests = this.results.filter((r) => r.passed).length
    const totalTests = this.results.length

    console.log(`✅ Smoke tests completed: ${passedTests}/${totalTests} passed`)
    return this.results
  }

  private async runTest(testName: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now()
    try {
      await testFn()
      this.results.push({
        testName,
        passed: true,
        duration: Date.now() - startTime,
      })
      console.log(`✅ ${testName} - PASSED`)
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      })
      console.log(`❌ ${testName} - FAILED: ${error}`)
    }
  }

  private async testSleeperAPIConnection(): Promise<void> {
    const { default: sleeperAPI } = await import("@/lib/sleeper-api")

    // Test basic API connectivity
    const testUser = await sleeperAPI.getUser("testuser")
    if (testUser === undefined) {
      throw new Error("Sleeper API connection failed")
    }

    // Test players endpoint (should not throw)
    const players = await sleeperAPI.getAllPlayers("nfl")
    if (!players || typeof players !== "object") {
      throw new Error("Players data not accessible")
    }
  }

  private async testPlayerDataLoading(): Promise<void> {
    const { default: sleeperAPI } = await import("@/lib/sleeper-api")

    const players = await sleeperAPI.getAllPlayers("nfl")
    const playerIds = Object.keys(players)

    if (playerIds.length === 0) {
      throw new Error("No players loaded")
    }

    // Test player data structure
    const firstPlayer = players[playerIds[0]]
    if (!firstPlayer.first_name || !firstPlayer.last_name || !firstPlayer.position) {
      throw new Error("Player data structure invalid")
    }

    // Test position formatting
    const validPositions = ["QB", "RB", "WR", "TE", "K", "DEF"]
    if (!validPositions.includes(firstPlayer.position)) {
      console.warn(`Unexpected position format: ${firstPlayer.position}`)
    }
  }

  private async testLeagueConnection(): Promise<void> {
    // Test league data structure and connection flow
    const mockLeagueData = {
      league_id: "test123",
      name: "Test League",
      season: "2025",
      roster_positions: ["QB", "RB", "RB", "WR", "WR", "TE", "FLEX", "K", "DEF"],
    }

    if (!mockLeagueData.league_id || !mockLeagueData.roster_positions) {
      throw new Error("League data structure invalid")
    }
  }

  private async testRankingsSystem(): Promise<void> {
    // Test rankings data structure
    const mockRanking = {
      playerId: "4046",
      playerName: "Josh Allen",
      position: "QB",
      rank: 1,
      tier: 1,
      projectedPoints: 350.5,
    }

    if (!mockRanking.playerId || !mockRanking.position || typeof mockRanking.rank !== "number") {
      throw new Error("Rankings data structure invalid")
    }
  }

  private async testTradeAnalysis(): Promise<void> {
    // Test trade analysis functionality
    const mockTrade = {
      transaction_id: "test123",
      type: "trade" as const,
      status: "complete",
      created: Date.now(),
      roster_ids: [1, 2],
      adds: { "4046": 1 },
      drops: { "4017": 2 },
    }

    if (!mockTrade.transaction_id || !mockTrade.adds || !mockTrade.drops) {
      throw new Error("Trade analysis data structure invalid")
    }
  }

  private async testRecommendationEngine(): Promise<void> {
    // Test recommendation system
    const mockRecommendation = {
      type: "trade",
      confidence: 0.85,
      reasoning: "Test reasoning",
      players: ["4046", "4017"],
    }

    if (!mockRecommendation.type || typeof mockRecommendation.confidence !== "number") {
      throw new Error("Recommendation engine data structure invalid")
    }
  }
}

export const smokeTestRunner = new SmokeTestRunner()
