/**
 * Rookie NFL Data Service (Client-Safe)
 *
 * This service fetches real 2025 NFL Draft data via API route (not direct Python).
 * It provides current roster status, performance data, and draft capital for rookies.
 *
 * Data Sources (via API):
 * - nfl_data_py.import_draft_picks() - 2025 NFL Draft results
 * - nfl_data_py.import_seasonal_rosters() - Current roster status
 * - nfl_data_py.import_weekly_data() - Performance data (when 2025 season active)
 *
 * Update Frequency:
 * - Draft data: Static after draft (April 2025)
 * - Roster data: Weekly updates during season
 * - Performance data: Real-time during games
 */

import type { RookiePlayer, NFLDraftCapital, DynastyProjection } from './rookie-draft-types'

// ============================================================================
// API Response Types
// ============================================================================

interface PythonRookieData {
  player_id: string
  player_name: string
  position: string
  nfl_team: string
  college: string
  draft_capital: {
    year: number
    round: number
    overall_pick: number
    team: string
  }
  physical: {
    height: number
    weight: number
    age: number
  }
  roster_status: {
    status: string
    depth_chart: string | null
    jersey_number: number | null
  }
  performance: {
    games_played: number
    stats: Record<string, number>
    weekly_stats: Array<{
      week: number
      fantasy_points_ppr: number
      snap_pct: number | null
    }>
  }
  landing_spot_grade: string
  is_active: boolean
}

interface APIRookieResponse {
  year: number
  rookies: PythonRookieData[]
  metadata: {
    total_rookies: number
    total_draft_picks: number
    has_performance_data: boolean
    has_roster_data: boolean
    fetched_at: string
    positions: string[]
    teams: string[]
  }
  error?: string
}

// ============================================================================
// Dynasty Projection Defaults by Position
// ============================================================================

const DEFAULT_PROJECTIONS: Record<string, { tier1: DynastyProjection; tier2: DynastyProjection; tier3: DynastyProjection }> = {
  QB: {
    tier1: {
      year1PPG: 18.5,
      year3PPG: 24.0,
      ceiling: 'Top 3 QB (elite tier)',
      floor: 'QB20-25 (backup)',
      mostLikely: 'QB8-15 (QB1)',
      bustRisk: 25
    },
    tier2: {
      year1PPG: 16.0,
      year3PPG: 20.0,
      ceiling: 'Top 10 QB',
      floor: 'QB25+ (backup)',
      mostLikely: 'QB12-18 (mid QB1)',
      bustRisk: 35
    },
    tier3: {
      year1PPG: 12.0,
      year3PPG: 16.0,
      ceiling: 'QB15 (low QB1)',
      floor: 'QB30+ (depth)',
      mostLikely: 'QB20-25 (QB2)',
      bustRisk: 50
    }
  },
  RB: {
    tier1: {
      year1PPG: 15.2,
      year3PPG: 18.5,
      ceiling: 'Elite RB1 (top 5)',
      floor: 'RB25-30 (backup)',
      mostLikely: 'RB8-12 (RB1)',
      bustRisk: 30
    },
    tier2: {
      year1PPG: 12.0,
      year3PPG: 15.0,
      ceiling: 'RB10-15 (RB1)',
      floor: 'RB30+ (depth)',
      mostLikely: 'RB15-20 (RB2)',
      bustRisk: 40
    },
    tier3: {
      year1PPG: 8.0,
      year3PPG: 11.0,
      ceiling: 'RB20 (flex)',
      floor: 'Roster cut',
      mostLikely: 'RB25-35 (depth)',
      bustRisk: 55
    }
  },
  WR: {
    tier1: {
      year1PPG: 12.8,
      year3PPG: 16.5,
      ceiling: 'Elite WR1 (top 5)',
      floor: 'WR35-40 (WR3)',
      mostLikely: 'WR12-18 (WR2)',
      bustRisk: 20
    },
    tier2: {
      year1PPG: 10.0,
      year3PPG: 13.5,
      ceiling: 'WR15 (WR2)',
      floor: 'WR40+ (depth)',
      mostLikely: 'WR20-30 (WR3)',
      bustRisk: 35
    },
    tier3: {
      year1PPG: 7.0,
      year3PPG: 10.0,
      ceiling: 'WR25 (flex)',
      floor: 'Roster cut',
      mostLikely: 'WR35+ (depth)',
      bustRisk: 50
    }
  },
  TE: {
    tier1: {
      year1PPG: 8.5,
      year3PPG: 12.0,
      ceiling: 'Top 5 TE',
      floor: 'TE20+ (streamer)',
      mostLikely: 'TE8-12 (TE1)',
      bustRisk: 35
    },
    tier2: {
      year1PPG: 6.0,
      year3PPG: 9.0,
      ceiling: 'TE12 (TE1)',
      floor: 'TE25+ (depth)',
      mostLikely: 'TE15-20 (TE2)',
      bustRisk: 45
    },
    tier3: {
      year1PPG: 4.0,
      year3PPG: 6.0,
      ceiling: 'TE20 (flex)',
      floor: 'Roster cut',
      mostLikely: 'TE25+ (depth)',
      bustRisk: 60
    }
  }
}

// ============================================================================
// Service Class
// ============================================================================

class RookieNFLDataService {
  private apiEndpoint = '/api/rookie-draft'

  /**
   * Fetch 2025 rookie draft data from API
   */
  async fetch2025RookieData(): Promise<RookiePlayer[]> {
    try {
      console.log('[RookieNFLDataService] Fetching 2025 rookie draft data from API...')

      const response = await fetch(this.apiEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        // Use cache when available (24 hours)
        next: { revalidate: 86400 }
      })

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`)
      }

      const data: APIRookieResponse = await response.json()

      if (data.error) {
        console.error('[RookieNFLDataService] API error:', data.error)
        return []
      }

      console.log(`[RookieNFLDataService] Successfully fetched ${data.rookies.length} rookies`)

      // Transform API data to RookiePlayer format
      const rookies = data.rookies.map(rookie => this.transformToRookiePlayer(rookie))

      return rookies
    } catch (error) {
      console.error('[RookieNFLDataService] Error fetching rookie data:', error)
      return []
    }
  }

  /**
   * Transform API rookie data to RookiePlayer type
   */
  private transformToRookiePlayer(apiRookie: PythonRookieData): RookiePlayer {
    // Calculate tier based on draft capital
    const tier = this.calculateTier(apiRookie.draft_capital.round, apiRookie.draft_capital.overall_pick)

    // Get position-specific projection based on tier
    const projection = this.getProjection(apiRookie.position, tier, apiRookie.performance)

    // Calculate consensus rank (approximate based on draft position)
    const consensusRank = this.calculateConsensusRank(
      apiRookie.draft_capital.round,
      apiRookie.draft_capital.overall_pick,
      apiRookie.position
    )

    // Calculate position rank
    const positionRank = this.calculatePositionRank(apiRookie.draft_capital.overall_pick, apiRookie.position)

    // Convert height from inches to feet/inches format
    const height = this.formatHeight(apiRookie.physical.height)

    // Get landing spot grade
    const landingSpotGrade = this.normalizeLandingSpotGrade(apiRookie.landing_spot_grade)

    // Generate strengths and concerns based on data
    const { strengths, concerns } = this.generateAnalysis(apiRookie)

    const rookiePlayer: RookiePlayer = {
      // Sleeper-compatible player fields
      player_id: apiRookie.player_id,
      first_name: apiRookie.player_name.split(' ')[0] || '',
      last_name: apiRookie.player_name.split(' ').slice(1).join(' ') || '',
      full_name: apiRookie.player_name,
      position: apiRookie.position,
      team: apiRookie.nfl_team,
      age: apiRookie.physical.age,
      height,
      weight: apiRookie.physical.weight.toString(),
      years_exp: 0,
      college: apiRookie.college,
      fantasy_positions: [apiRookie.position],

      // NFL Draft capital
      nflDraft: {
        year: apiRookie.draft_capital.year,
        round: apiRookie.draft_capital.round,
        overallPick: apiRookie.draft_capital.overall_pick,
        draftedBy: apiRookie.draft_capital.team
      },

      // Dynasty projections
      projection,

      // Rankings
      consensusRank,
      positionRank,
      tier,
      landingSpotGrade,

      // Analysis
      strengths,
      concerns
    }

    return rookiePlayer
  }

  /**
   * Calculate tier based on draft capital
   * Tier 1: Round 1, picks 1-15
   * Tier 2: Round 1 picks 16-32, Round 2 picks 1-20
   * Tier 3: Round 2 picks 21-32+, Round 3
   */
  private calculateTier(round: number, overallPick: number): number {
    if (round === 1 && overallPick <= 15) return 1
    if (round === 1 || (round === 2 && overallPick <= 52)) return 2
    return 3
  }

  /**
   * Get projection based on position and tier
   */
  private getProjection(position: string, tier: number, performance: PythonRookieData['performance']): DynastyProjection {
    const positionDefaults = DEFAULT_PROJECTIONS[position] || DEFAULT_PROJECTIONS.WR

    let baseProjection: DynastyProjection
    if (tier === 1) baseProjection = positionDefaults.tier1
    else if (tier === 2) baseProjection = positionDefaults.tier2
    else baseProjection = positionDefaults.tier3

    // Adjust projection if performance data is available
    if (performance.games_played > 0 && performance.stats.fantasy_points_ppr) {
      const avgPPG = performance.stats.fantasy_points_ppr / performance.games_played
      // Boost year1PPG based on actual performance
      baseProjection = {
        ...baseProjection,
        year1PPG: avgPPG,
        year3PPG: avgPPG * 1.3 // Project growth
      }
    }

    return baseProjection
  }

  /**
   * Calculate consensus fantasy rank (approximation based on draft capital and position)
   */
  private calculateConsensusRank(round: number, overallPick: number, position: string): number {
    // Position multipliers (QB values later in dynasty rookie drafts)
    const positionMultipliers: Record<string, number> = {
      RB: 1.0,
      WR: 1.1,
      TE: 1.5,
      QB: 1.8
    }

    const multiplier = positionMultipliers[position] || 1.0

    // Base rank on draft position with position adjustment
    let rank = Math.ceil(overallPick * 0.4 * multiplier)

    // First round picks get premium
    if (round === 1 && overallPick <= 10) {
      rank = Math.min(rank, overallPick)
    }

    return Math.max(1, rank)
  }

  /**
   * Calculate position rank within rookie class
   */
  private calculatePositionRank(overallPick: number, position: string): number {
    // Rough approximation - in real implementation, would count actual position draft order
    const avgPicksPerPosition = {
      QB: 8,
      RB: 12,
      WR: 18,
      TE: 8
    }

    const avgPicks = avgPicksPerPosition[position as keyof typeof avgPicksPerPosition] || 10
    return Math.max(1, Math.ceil(overallPick / avgPicks))
  }

  /**
   * Format height from inches to feet'inches" format
   */
  private formatHeight(inches: number): string {
    const feet = Math.floor(inches / 12)
    const remainingInches = inches % 12
    return `${feet}'${remainingInches}"`
  }

  /**
   * Normalize landing spot grade to allowed values
   */
  private normalizeLandingSpotGrade(grade: string): RookiePlayer['landingSpotGrade'] {
    const validGrades: RookiePlayer['landingSpotGrade'][] = [
      'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'
    ]

    const upperGrade = grade.toUpperCase() as RookiePlayer['landingSpotGrade']
    if (validGrades.includes(upperGrade)) {
      return upperGrade
    }

    return 'B' // Default
  }

  /**
   * Generate strengths and concerns based on player data
   */
  private generateAnalysis(rookie: PythonRookieData): { strengths: string[]; concerns: string[] } {
    const strengths: string[] = []
    const concerns: string[] = []

    // Draft capital analysis
    if (rookie.draft_capital.round === 1 && rookie.draft_capital.overall_pick <= 15) {
      strengths.push('Elite draft capital - first round selection')
    } else if (rookie.draft_capital.round === 1) {
      strengths.push('Strong draft capital - first round pick')
    } else if (rookie.draft_capital.round === 2) {
      strengths.push('Day 2 draft capital - team investment')
    }

    // Physical profile
    if (rookie.position === 'WR' && rookie.physical.height >= 76) {
      strengths.push('Elite size for position (6\'4"+)')
    } else if (rookie.position === 'RB' && rookie.physical.weight >= 215) {
      strengths.push('Size to handle workhorse role')
    } else if (rookie.position === 'QB' && rookie.physical.height >= 74) {
      strengths.push('Ideal size for NFL QB')
    }

    // Age concerns
    if (rookie.physical.age >= 24) {
      concerns.push('Age concern - older prospect')
    }

    // Roster status
    if (!rookie.is_active) {
      concerns.push('Currently not on active roster (IR/Practice Squad)')
    } else if (rookie.roster_status.depth_chart && rookie.roster_status.depth_chart.includes('QB')) {
      strengths.push('On depth chart as QB')
    }

    // Performance data
    if (rookie.performance.games_played > 0) {
      const avgPPG = rookie.performance.stats.fantasy_points_ppr / rookie.performance.games_played
      if (avgPPG >= 15) {
        strengths.push(`Strong early production (${avgPPG.toFixed(1)} PPG)`)
      } else if (avgPPG < 8) {
        concerns.push('Limited fantasy production so far')
      }
    } else {
      concerns.push('No game experience yet')
    }

    // Landing spot
    if (rookie.landing_spot_grade === 'A' || rookie.landing_spot_grade === 'A+') {
      strengths.push('Excellent landing spot with opportunity')
    } else if (rookie.landing_spot_grade === 'C-' || rookie.landing_spot_grade === 'D' || rookie.landing_spot_grade === 'F') {
      concerns.push('Crowded depth chart or poor offensive situation')
    }

    // Ensure we have at least 2 of each
    if (strengths.length === 0) {
      strengths.push('Drafted to NFL team - professional opportunity')
      strengths.push('Fantasy-relevant position')
    }
    if (concerns.length === 0) {
      concerns.push('Needs to prove himself at NFL level')
      concerns.push('Rookie learning curve expected')
    }

    return { strengths: strengths.slice(0, 3), concerns: concerns.slice(0, 3) }
  }
}

// Export singleton instance
export const rookieNFLDataService = new RookieNFLDataService()
export default rookieNFLDataService
