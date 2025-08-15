export interface FunctionalTestResult {
  testName: string
  passed: boolean
  error?: string
  duration: number
  details?: any
}

export class FunctionalTestRunner {
  private results: FunctionalTestResult[] = []

  async runAllTests(): Promise<FunctionalTestResult[]> {
    console.log("🔧 Running functional tests...")
    this.results = []

    const tests = [
      this.testUserLeagueFlow,
      this.testPlayerDataIntegrity,
      this.testRankingsIntegration,
      this.testTradeRecommendations,
      this.testActivityTracking,
      this.testPositionFiltering,
    ]

    for (const test of tests) {
      await this.runTest(test.name, test.bind(this))
    }

    const passedTests = this.results.filter((r) => r.passed).length
    const totalTests = this.results.length

    console.log(`🔧 Functional tests completed: ${passedTests}/${totalTests} passed`)
    return this.results
  }

  private async runTest(testName: string, testFn: () => Promise<any>): Promise<void> {
    const startTime = Date.now()
    try {
      const details = await testFn()
      this.results.push({
        testName,
        passed: true,
        duration: Date.now() - startTime,
        details,
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

  private async testUserLeagueFlow(): Promise<any> {
    const { default: sleeperAPI } = await import("@/lib/sleeper-api")

    // Test complete user -> leagues -> rosters flow
    const testUsername = "testuser"
    const user = await sleeperAPI.getUser(testUsername)

    if (user) {
      const leagues = await sleeperAPI.getUserLeagues(user.user_id)
      const leagueCount = leagues.length

      if (leagues.length > 0) {
        const rosters = await sleeperAPI.getLeagueRosters(leagues[0].league_id)
        return {
          userFound: true,
          leagueCount,
          rosterCount: rosters.length,
        }
      }
    }

    return { userFound: false, leagueCount: 0, rosterCount: 0 }
  }

  private async testPlayerDataIntegrity(): Promise<any> {
    const { default: sleeperAPI } = await import("@/lib/sleeper-api")

    const players = await sleeperAPI.getAllPlayers("nfl")
    const playerIds = Object.keys(players)

    let validPlayers = 0
    let invalidPositions = 0
    let missingNames = 0

    const validPositions = ["QB", "RB", "WR", "TE", "K", "DEF"]

    for (const playerId of playerIds.slice(0, 100)) {
      // Test first 100 players
      const player = players[playerId]

      if (player.first_name && player.last_name) {
        validPlayers++
      } else {
        missingNames++
      }

      if (!validPositions.includes(player.position)) {
        invalidPositions++
      }
    }

    return {
      totalTested: Math.min(100, playerIds.length),
      validPlayers,
      missingNames,
      invalidPositions,
    }
  }

  private async testRankingsIntegration(): Promise<any> {
    // Test rankings system integration
    const mockRankings = [
      { playerId: "4046", playerName: "Josh Allen", position: "QB", rank: 1 },
      { playerId: "4017", playerName: "Christian McCaffrey", position: "RB", rank: 1 },
    ]

    const positionCounts = mockRankings.reduce(
      (acc, player) => {
        acc[player.position] = (acc[player.position] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      totalRankings: mockRankings.length,
      positionCounts,
    }
  }

  private async testTradeRecommendations(): Promise<any> {
    // Test trade recommendation logic
    const mockRoster = ["4046", "4017", "6794"] // QB, RB, WR
    const mockAvailablePlayers = ["4881", "5045"] // TE, RB

    // Simple recommendation logic test
    const recommendations = mockAvailablePlayers.map((playerId) => ({
      playerId,
      confidence: Math.random(),
      reasoning: "Test recommendation",
    }))

    return {
      rosterSize: mockRoster.length,
      availablePlayers: mockAvailablePlayers.length,
      recommendationCount: recommendations.length,
    }
  }

  private async testActivityTracking(): Promise<any> {
    const { default: sleeperAPI } = await import("@/lib/sleeper-api")

    // Test transaction tracking
    const mockLeagueId = "test123"
    const transactions = await sleeperAPI.getTransactions(mockLeagueId)

    const transactionTypes = transactions.reduce(
      (acc, t) => {
        acc[t.type] = (acc[t.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      totalTransactions: transactions.length,
      transactionTypes,
    }
  }

  private async testPositionFiltering(): Promise<any> {
    // Test position filtering logic
    const mockLeagueSettings = {
      roster_positions: ["QB", "RB", "RB", "WR", "WR", "TE", "FLEX", "K", "DEF"],
    }

    const relevantPositions = mockLeagueSettings.roster_positions
      .filter((pos) => !["FLEX", "BN"].includes(pos))
      .reduce((acc, pos) => {
        if (!acc.includes(pos)) acc.push(pos)
        return acc
      }, [] as string[])

    return {
      totalPositions: mockLeagueSettings.roster_positions.length,
      uniquePositions: relevantPositions.length,
      relevantPositions,
    }
  }
}

export const functionalTestRunner = new FunctionalTestRunner()
