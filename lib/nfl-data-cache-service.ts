import { PrismaClient } from '@/lib/generated/prisma'
import nflDataService, {
  type NFLDataOptions,
  type NFLDataResponse,
  type NFLWeeklyStats,
  type NFLSeasonalStats,
} from './nfl-data-service'

/**
 * NFL Data Caching Service
 *
 * Implements a cache-first strategy for NFL data fetching with the following features:
 * - Cache hit: Return cached data if fresh (not expired)
 * - Cache miss: Fetch from Python/external API, populate cache
 * - Cache warming: Pre-populate cache with common queries
 * - Cache invalidation: Manual and automatic expiration
 * - Monitoring: Track cache hits, misses, and API calls
 *
 * Cache TTL Strategy:
 * - Current week data: 1 hour (frequent updates during games)
 * - Past week data: 24 hours (stable but may have stat corrections)
 * - Seasonal data: 7 days (rarely changes mid-season)
 * - Historical data (completed seasons): 30 days (very stable)
 */

const DEFAULT_TTL = {
  CURRENT_WEEK: 60 * 60 * 1000, // 1 hour
  PAST_WEEK: 24 * 60 * 60 * 1000, // 24 hours
  SEASONAL: 7 * 24 * 60 * 60 * 1000, // 7 days
  HISTORICAL: 30 * 24 * 60 * 60 * 1000, // 30 days
}

export interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  avgResponseTime: number
  totalCalls: number
}

class NFLDataCacheService {
  private prisma: PrismaClient
  private cacheEnabled: boolean = true

  constructor() {
    // Initialize Prisma client
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
  }

  /**
   * Main entry point: Extract NFL data with caching
   * Cache-first strategy with automatic fallback
   */
  async extractNFLData(options: NFLDataOptions = {}): Promise<NFLDataResponse> {
    const startTime = Date.now()

    try {
      if (!this.cacheEnabled) {
        return await this.fetchAndPopulateCache(options, startTime)
      }

      // Try to get data from cache first
      const cachedData = await this.getCachedData(options)

      if (cachedData) {
        console.log('[Cache] Cache hit for options:', options)
        await this.logAPICall(
          'cache_hit',
          options,
          true,
          Date.now() - startTime
        )
        return cachedData
      }

      // Cache miss: fetch from data source
      console.log('[Cache] Cache miss for options:', options)
      return await this.fetchAndPopulateCache(options, startTime)
    } catch (error) {
      console.error('[Cache] Error in extractNFLData:', error)
      await this.logAPICall(
        'extract_error',
        options,
        false,
        Date.now() - startTime,
        error instanceof Error ? error.message : 'Unknown error'
      )

      // Fallback to uncached data on error
      return nflDataService.extractNFLData(options)
    }
  }

  /**
   * Get cached data if available and fresh
   */
  private async getCachedData(
    options: NFLDataOptions
  ): Promise<NFLDataResponse | null> {
    const { years, positions = ['QB', 'RB', 'WR', 'TE'], week } = options

    try {
      // Build query filters
      const where: {
        expiresAt: { gte: Date }
        season?: { in: number[] }
        position?: { in: string[] }
        week?: number | null
      } = {
        expiresAt: { gte: new Date() }, // Only return non-expired records
      }

      if (years && years.length > 0) {
        where.season = { in: years }
      }

      if (positions.length > 0) {
        where.position = { in: positions }
      }

      if (week !== undefined) {
        where.week = week
      } else {
        // If no week specified, get seasonal stats (week is null)
        where.week = null
      }

      // Fetch cached player stats
      const cachedStats = await this.prisma.nFLPlayerStats.findMany({
        where,
        orderBy: [{ season: 'desc' }, { week: 'desc' }],
      })

      // If no cached data found, return null
      if (cachedStats.length === 0) {
        return null
      }

      // Transform cached data to NFLDataResponse format
      const weeklyStats: NFLWeeklyStats[] = []
      const seasonalStats: NFLSeasonalStats[] = []

      for (const stat of cachedStats) {
        if (stat.week !== null) {
          // Weekly stat
          weeklyStats.push(this.transformToWeeklyStats(stat))
        } else {
          // Seasonal stat
          seasonalStats.push(this.transformToSeasonalStats(stat))
        }
      }

      return {
        weekly_stats: weeklyStats,
        seasonal_stats: seasonalStats,
        aggregated_season_stats: seasonalStats, // Same as seasonal for cached data
        player_info: [], // Player info not cached (can be added later)
        team_analytics: [], // Team analytics not cached (can be added later)
        metadata: {
          years: years || [],
          positions,
          week,
          extracted_at: new Date().toISOString(),
          total_weekly_records: weeklyStats.length,
          total_seasonal_records: seasonalStats.length,
          total_aggregated_records: seasonalStats.length,
          total_players: new Set(cachedStats.map((s) => s.playerId)).size,
          total_teams: new Set(cachedStats.map((s) => s.team).filter(Boolean)).size,
        },
      }
    } catch (error) {
      console.error('[Cache] Error getting cached data:', error)
      return null
    }
  }

  /**
   * Fetch data from source and populate cache
   */
  private async fetchAndPopulateCache(
    options: NFLDataOptions,
    startTime: number
  ): Promise<NFLDataResponse> {
    try {
      // Fetch from original data source
      const data = await nflDataService.extractNFLData(options)

      // Log the API call
      await this.logAPICall(
        'fetch_and_cache',
        options,
        !data.error,
        Date.now() - startTime,
        data.error
      )

      // If fetch was successful, populate cache
      if (!data.error && (data.weekly_stats.length > 0 || data.seasonal_stats.length > 0)) {
        await this.populateCache(data, options)
      }

      return data
    } catch (error) {
      console.error('[Cache] Error fetching and populating cache:', error)
      throw error
    }
  }

  /**
   * Populate cache with fetched data
   */
  private async populateCache(
    data: NFLDataResponse,
    _options: NFLDataOptions
  ): Promise<void> {
    try {
      const recordsToCache: Array<{
        playerId: string
        playerName: string
        position: string
        team: string | null
        season: number
        week: number | null
        passingYards: number | undefined
        passingTDs: number | undefined
        passingINTs: number | undefined
        passingAttempts: number
        passingCompletions: number
        rushingYards: number | undefined
        rushingTDs: number | undefined
        rushingAttempts: number | undefined
        receivingYards: number | undefined
        receivingTDs: number | undefined
        receptions: number | undefined
        targets: number | undefined
        fantasyPoints: number | undefined
        pprPoints: number | undefined
        halfPprPoints: undefined
        cachedAt: Date
        expiresAt: Date
      }> = []

      // Cache weekly stats
      for (const stat of data.weekly_stats) {
        const ttl = this.calculateTTL(stat.season, stat.week)
        recordsToCache.push({
          playerId: stat.player_id,
          playerName: stat.player_name,
          position: stat.position,
          team: stat.team,
          season: stat.season,
          week: stat.week,
          passingYards: stat.passing_yards,
          passingTDs: stat.passing_tds,
          passingINTs: stat.interceptions,
          passingAttempts: 0, // Not in current schema
          passingCompletions: 0, // Not in current schema
          rushingYards: stat.rushing_yards,
          rushingTDs: stat.rushing_tds,
          rushingAttempts: stat.rushing_attempts,
          receivingYards: stat.receiving_yards,
          receivingTDs: stat.receiving_tds,
          receptions: stat.receptions,
          targets: stat.targets,
          fantasyPoints: stat.fantasy_points,
          pprPoints: stat.fantasy_points_ppr,
          halfPprPoints: undefined, // Can be calculated
          cachedAt: new Date(),
          expiresAt: new Date(Date.now() + ttl),
        })
      }

      // Cache seasonal stats
      for (const stat of data.seasonal_stats) {
        const ttl = this.calculateTTL(stat.season, null)
        recordsToCache.push({
          playerId: stat.player_id,
          playerName: stat.player_name,
          position: stat.position,
          team: stat.team,
          season: stat.season,
          week: null, // Seasonal stats have no week
          passingYards: stat.passing_yards,
          passingTDs: stat.passing_tds,
          passingINTs: stat.interceptions,
          passingAttempts: 0,
          passingCompletions: 0,
          rushingYards: stat.rushing_yards,
          rushingTDs: stat.rushing_tds,
          rushingAttempts: stat.rushing_attempts,
          receivingYards: stat.receiving_yards,
          receivingTDs: stat.receiving_tds,
          receptions: stat.receptions,
          targets: stat.targets,
          fantasyPoints: stat.fantasy_points,
          pprPoints: stat.fantasy_points_ppr,
          halfPprPoints: undefined,
          cachedAt: new Date(),
          expiresAt: new Date(Date.now() + ttl),
        })
      }

      // Bulk insert with upsert to avoid duplicates
      // Note: We need to find existing records first because Prisma unique constraints
      // don't handle null values in compound keys the way we need
      for (const record of recordsToCache) {
        const existing = await this.prisma.nFLPlayerStats.findFirst({
          where: {
            playerId: record.playerId,
            season: record.season,
            week: record.week,
          },
        })

        if (existing) {
          await this.prisma.nFLPlayerStats.update({
            where: { id: existing.id },
            data: record,
          })
        } else {
          await this.prisma.nFLPlayerStats.create({
            data: record,
          })
        }
      }

      console.log(`[Cache] Cached ${recordsToCache.length} records`)
    } catch (error) {
      console.error('[Cache] Error populating cache:', error)
      // Don't throw - caching failure shouldn't break the main flow
    }
  }

  /**
   * Calculate TTL based on data recency
   */
  private calculateTTL(season: number, week: number | null): number {
    const currentSeason = nflDataService.getCurrentSeason()
    const currentWeek = this.getCurrentNFLWeek()

    // Historical season (completed)
    if (season < currentSeason) {
      return DEFAULT_TTL.HISTORICAL
    }

    // Current season
    if (season === currentSeason) {
      // Seasonal stats
      if (week === null) {
        return DEFAULT_TTL.SEASONAL
      }

      // Current week
      if (week === currentWeek) {
        return DEFAULT_TTL.CURRENT_WEEK
      }

      // Past week in current season
      return DEFAULT_TTL.PAST_WEEK
    }

    // Future season (shouldn't happen)
    return DEFAULT_TTL.CURRENT_WEEK
  }

  /**
   * Get current NFL week (rough estimation)
   */
  private getCurrentNFLWeek(): number {
    const currentDate = new Date()
    const seasonStart = new Date(currentDate.getFullYear(), 8, 1) // Roughly September 1

    if (currentDate < seasonStart) {
      return 1
    }

    const weeksSinceStart = Math.floor(
      (currentDate.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
    )

    return Math.min(Math.max(weeksSinceStart + 1, 1), 18) // NFL has 18 weeks
  }

  /**
   * Transform cached stat to weekly stat format
   */
  private transformToWeeklyStats(stat: {
    playerId: string
    playerName: string
    position: string
    team: string | null
    season: number
    week: number | null
    fantasyPoints: number | null
    pprPoints: number | null
    passingYards: number | null
    passingTDs: number | null
    passingINTs: number | null
    rushingYards: number | null
    rushingTDs: number | null
    rushingAttempts: number | null
    receivingYards: number | null
    receivingTDs: number | null
    receptions: number | null
    targets: number | null
  }): NFLWeeklyStats {
    return {
      player_id: stat.playerId,
      player_name: stat.playerName,
      position: stat.position,
      team: stat.team || '',
      season: stat.season,
      week: stat.week!,
      fantasy_points: stat.fantasyPoints || undefined,
      fantasy_points_ppr: stat.pprPoints || undefined,
      passing_yards: stat.passingYards || undefined,
      passing_tds: stat.passingTDs || undefined,
      interceptions: stat.passingINTs || undefined,
      rushing_yards: stat.rushingYards || undefined,
      rushing_tds: stat.rushingTDs || undefined,
      rushing_attempts: stat.rushingAttempts || undefined,
      receiving_yards: stat.receivingYards || undefined,
      receiving_tds: stat.receivingTDs || undefined,
      receptions: stat.receptions || undefined,
      targets: stat.targets || undefined,
    }
  }

  /**
   * Transform cached stat to seasonal stat format
   */
  private transformToSeasonalStats(stat: {
    playerId: string
    playerName: string
    position: string
    team: string | null
    season: number
    fantasyPoints: number | null
    pprPoints: number | null
    passingYards: number | null
    passingTDs: number | null
    passingINTs: number | null
    rushingYards: number | null
    rushingTDs: number | null
    rushingAttempts: number | null
    receivingYards: number | null
    receivingTDs: number | null
    receptions: number | null
    targets: number | null
  }): NFLSeasonalStats {
    return {
      player_id: stat.playerId,
      player_name: stat.playerName,
      position: stat.position,
      team: stat.team || '',
      season: stat.season,
      fantasy_points: stat.fantasyPoints || undefined,
      fantasy_points_ppr: stat.pprPoints || undefined,
      passing_yards: stat.passingYards || undefined,
      passing_tds: stat.passingTDs || undefined,
      interceptions: stat.passingINTs || undefined,
      rushing_yards: stat.rushingYards || undefined,
      rushing_tds: stat.rushingTDs || undefined,
      rushing_attempts: stat.rushingAttempts || undefined,
      receiving_yards: stat.receivingYards || undefined,
      receiving_tds: stat.receivingTDs || undefined,
      receptions: stat.receptions || undefined,
      targets: stat.targets || undefined,
    }
  }

  /**
   * Log API call for monitoring
   */
  private async logAPICall(
    endpoint: string,
    parameters: NFLDataOptions | Record<string, unknown>,
    success: boolean,
    responseTime: number,
    errorMessage?: string
  ): Promise<void> {
    try {
      // Convert parameters to JSON-compatible format
      const jsonParameters = JSON.parse(JSON.stringify(parameters))

      await this.prisma.aPICallLog.create({
        data: {
          endpoint,
          parameters: jsonParameters,
          success,
          responseTime,
          errorMessage: errorMessage || null,
          timestamp: new Date(),
        },
      })
    } catch (error) {
      console.error('[Cache] Error logging API call:', error)
      // Don't throw - logging failure shouldn't break the main flow
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(since?: Date): Promise<CacheStats> {
    try {
      const where = since ? { timestamp: { gte: since } } : {}

      const logs = await this.prisma.aPICallLog.findMany({
        where,
        select: {
          endpoint: true,
          success: true,
          responseTime: true,
        },
      })

      const hits = logs.filter((log) => log.endpoint === 'cache_hit').length
      const misses = logs.filter((log) => log.endpoint === 'fetch_and_cache').length
      const totalCalls = hits + misses

      return {
        hits,
        misses,
        hitRate: totalCalls > 0 ? hits / totalCalls : 0,
        avgResponseTime:
          logs.length > 0
            ? logs.reduce((sum, log) => sum + log.responseTime, 0) / logs.length
            : 0,
        totalCalls,
      }
    } catch (error) {
      console.error('[Cache] Error getting cache stats:', error)
      return { hits: 0, misses: 0, hitRate: 0, avgResponseTime: 0, totalCalls: 0 }
    }
  }

  /**
   * Invalidate expired cache entries
   */
  async invalidateExpiredCache(): Promise<number> {
    try {
      const result = await this.prisma.nFLPlayerStats.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      })

      // Log invalidation
      await this.prisma.cacheInvalidation.create({
        data: {
          cacheType: 'player',
          reason: 'expired',
          recordCount: result.count,
          timestamp: new Date(),
        },
      })

      console.log(`[Cache] Invalidated ${result.count} expired records`)
      return result.count
    } catch (error) {
      console.error('[Cache] Error invalidating expired cache:', error)
      return 0
    }
  }

  /**
   * Manually invalidate cache for specific criteria
   */
  async invalidateCache(options: {
    season?: number
    week?: number
    playerId?: string
  }): Promise<number> {
    try {
      const where: {
        season?: number
        week?: number
        playerId?: string
      } = {}

      if (options.season !== undefined) {
        where.season = options.season
      }

      if (options.week !== undefined) {
        where.week = options.week
      }

      if (options.playerId) {
        where.playerId = options.playerId
      }

      const result = await this.prisma.nFLPlayerStats.deleteMany({ where })

      // Log invalidation
      await this.prisma.cacheInvalidation.create({
        data: {
          cacheType: 'player',
          reason: 'manual',
          recordCount: result.count,
          timestamp: new Date(),
        },
      })

      console.log(`[Cache] Manually invalidated ${result.count} records`)
      return result.count
    } catch (error) {
      console.error('[Cache] Error invalidating cache:', error)
      return 0
    }
  }

  /**
   * Warm cache with common queries
   */
  async warmCache(years: number[], positions: string[]): Promise<void> {
    console.log('[Cache] Warming cache for years:', years, 'positions:', positions)

    try {
      // Fetch and cache data for each year and position combination
      for (const year of years) {
        for (const position of positions) {
          await this.extractNFLData({ years: [year], positions: [position] })
        }

        // Also cache seasonal stats
        await this.extractNFLData({ years: [year] })
      }

      console.log('[Cache] Cache warming completed')
    } catch (error) {
      console.error('[Cache] Error warming cache:', error)
    }
  }

  /**
   * Enable or disable caching
   */
  setCacheEnabled(enabled: boolean): void {
    this.cacheEnabled = enabled
    console.log(`[Cache] Caching ${enabled ? 'enabled' : 'disabled'}`)
  }

  /**
   * Cleanup - close Prisma connection
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
  }
}

// Create singleton instance
const nflDataCacheService = new NFLDataCacheService()

export { nflDataCacheService }
export default nflDataCacheService
