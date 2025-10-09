import type { RankingSystem } from "./rankings-types"
import type { NFLDataResponse } from "./nfl-data-service"

export interface PromptBuilderOptions {
  year?: number
  week?: number
  useHistoricalData?: boolean
}

// Most recent season with complete NFL data available
// Update this when new season data becomes available
import { LATEST_AVAILABLE_SEASON } from './constants/nfl-season';

/**
 * Service responsible for building AI prompts for player ranking generation
 */
export class PromptBuilderService {
  /**
   * Builds a comprehensive prompt with historical data context
   */
  buildPromptWithHistoricalData(
    allRankings: RankingSystem[],
    nflData: NFLDataResponse | null,
    options: PromptBuilderOptions = {},
  ): string {
    let prompt =
      "Analyze the following player rankings from different sources and create a single, consolidated ranking. "
    prompt +=
      "Use the provided historical NFL performance data as additional context to make more informed predictions.\n\n"

    // Add historical data context if available
    if (nflData) {
      prompt += "HISTORICAL NFL PERFORMANCE DATA:\n"
      prompt += "================================\n"

      const year = options.year || LATEST_AVAILABLE_SEASON
      const week = options.week

      if (week) {
        prompt += `Week ${week}, ${year} Performance:\n`
      } else {
        prompt += `${year} Season Performance:\n`
      }

      // Add top performers by position from historical data
      prompt += this.addHistoricalPerformanceContext(nflData, week ? "weekly" : "season")

      prompt += "\n"
    }

    // Add user rankings
    if (allRankings.length > 0) {
      prompt += "USER PROVIDED RANKINGS:\n"
      prompt += "======================\n"

      for (const system of allRankings) {
        prompt += `Source: ${system.name}\n`
        prompt += "--------------------\n"
        for (const ranking of system.rankings.slice(0, 20)) {
          prompt += `${ranking.rank}. ${ranking.playerName} (${ranking.position} - ${ranking.team})\n`
        }
        prompt += "\n"
      }
    }

    prompt +=
      "\nInstructions: Create consolidated rankings that balance user preferences with historical performance data. "
    prompt += "Prioritize players with strong historical performance while respecting user ranking systems. "
    prompt += "Consider recent trends, consistency, and upside potential.\n"

    return prompt
  }

  /**
   * Builds a basic prompt without historical data
   */
  buildBasicPrompt(allRankings: RankingSystem[]): string {
    let prompt =
      "Analyze the following player rankings from different sources and create a single, consolidated ranking. Justify your rankings with a brief analysis for each player.\n\n"

    for (const system of allRankings) {
      prompt += `Source: ${system.name}\n`
      prompt += "--------------------\n"
      for (const ranking of system.rankings.slice(0, 20)) {
        // Limit to top 20 for brevity
        prompt += `${ranking.rank}. ${ranking.playerName} (${ranking.position} - ${ranking.team})\n`
      }
      prompt += "\n"
    }

    return prompt
  }

  /**
   * Adds historical performance context to prompt
   */
  private addHistoricalPerformanceContext(nflData: NFLDataResponse, type: "weekly" | "season"): string {
    let contextPrompt = ""

    // Type assertion to avoid TypeScript union type inference issues with array methods
    // Both NFLWeeklyStats and NFLSeasonalStats extend NFLPlayerStats and have compatible properties
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (type === "weekly" ? nflData.weekly_stats : nflData.aggregated_season_stats) as any[]

    contextPrompt += `\nCOMPREHENSIVE HISTORICAL PERFORMANCE ANALYSIS:\n`
    contextPrompt += `Data includes ${nflData.metadata.total_players} players across ${nflData.metadata.years.join(", ")}\n`
    contextPrompt += `Total season records: ${nflData.metadata.total_aggregated_records}\n`
    contextPrompt += `\nUse the following metrics for predictive analysis:\n`

    // Group by position and get comprehensive stats for top performers
    const positions = ["QB", "RB", "WR", "TE"]

    for (const pos of positions) {
      const positionPlayers = data
        .filter((player) => player.position === pos)
        .sort((a, b) => (b.fantasy_points_ppr || 0) - (a.fantasy_points_ppr || 0))
        .slice(0, 12) // More players for better predictive context

      if (positionPlayers.length > 0) {
        contextPrompt += `\n${pos} PERFORMANCE METRICS:\n`
        contextPrompt += `${"=".repeat(pos.length + 20)}\n`

        positionPlayers.forEach((player, index) => {
          contextPrompt += `${index + 1}. ${player.player_name} (${player.team}):\n`

          // Fantasy Metrics
          const ppr = player.fantasy_points_ppr?.toFixed(1) || "0.0"
          const std = player.fantasy_points?.toFixed(1) || "0.0"
          const games = ((player as unknown as Record<string, unknown>).games as number) || 0
          const pprPerGame = games > 0 ? (player.fantasy_points_ppr || 0) / games : 0

          contextPrompt += `   Fantasy: ${ppr} PPR (${std} STD) | ${pprPerGame.toFixed(1)} PPR/game | ${games} games\n`

          // Position-specific metrics
          if (pos === "QB") {
            const p = player as unknown as Record<string, unknown>
            contextPrompt += `   Passing: ${p.passing_yards || 0} yds, ${p.passing_tds || 0} TDs, ${p.interceptions || 0} INTs\n`
            contextPrompt += `   Efficiency: ${((((p.completions as number) || 0) / ((p.passing_attempts as number) || 1)) * 100).toFixed(1)}% comp, ${(((p.passing_yards as number) || 0) / ((p.passing_attempts as number) || 1)).toFixed(1)} Y/A\n`
            if (p.rushing_yards) {
              contextPrompt += `   Rushing: ${p.rushing_yards} yds, ${p.rushing_tds || 0} TDs\n`
            }
          } else if (pos === "RB") {
            contextPrompt += `   Rushing: ${player.rushing_yards || 0} yds, ${player.rushing_tds || 0} TDs, ${player.rushing_attempts || 0} att\n`
            contextPrompt += `   Efficiency: ${((player.rushing_yards || 0) / (player.rushing_attempts || 1)).toFixed(1)} YPC\n`
            if (player.targets) {
              contextPrompt += `   Receiving: ${player.receptions || 0}/${player.targets} tgt, ${player.receiving_yards || 0} yds, ${player.receiving_tds || 0} TDs\n`
            }
          } else if (pos === "WR" || pos === "TE") {
            const p = player as unknown as Record<string, unknown>
            contextPrompt += `   Receiving: ${p.receptions || 0}/${p.targets || 0} tgt, ${p.receiving_yards || 0} yds, ${p.receiving_tds || 0} TDs\n`
            contextPrompt += `   Efficiency: ${p.targets ? ((((p.receptions as number) || 0) / (p.targets as number)) * 100).toFixed(1) : "0.0"}% catch rate, ${p.targets ? (((p.receiving_yards as number) || 0) / (p.targets as number)).toFixed(1) : "0.0"} Y/T\n`
            if (p.target_share) {
              contextPrompt += `   Usage: ${((p.target_share as number) * 100).toFixed(1)}% target share\n`
            }
          }

          // Advanced metrics
          const p = player as unknown as Record<string, unknown>
          if (p.red_zone_targets || p.red_zone_carries || p.red_zone_touches) {
            const rzTargets = (p.red_zone_targets as number) || 0
            const rzCarries = (p.red_zone_carries as number) || 0
            const rzTouches = (p.red_zone_touches as number) || 0
            contextPrompt += `   Red Zone: ${rzTargets} tgt, ${rzCarries} car, ${rzTouches} touches\n`
          }

          contextPrompt += `\n`
        })
      }
    }

    // Add trend analysis
    contextPrompt += `\nTREND ANALYSIS GUIDELINES:\n`
    contextPrompt += `- Prioritize players with consistent high performance across multiple seasons\n`
    contextPrompt += `- Consider efficiency metrics (YPC, catch rate, target share) for upside\n`
    contextPrompt += `- Weight red zone usage heavily for TD prediction\n`
    contextPrompt += `- Factor in team context and offensive systems\n`
    contextPrompt += `- Account for age and injury history when available\n\n`

    return contextPrompt
  }
}
