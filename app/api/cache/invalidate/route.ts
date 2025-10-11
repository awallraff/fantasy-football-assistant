import { NextResponse } from 'next/server'
import nflDataCacheService from '@/lib/nfl-data-cache-service'

/**
 * POST /api/cache/invalidate
 *
 * Invalidates cache entries based on provided criteria.
 *
 * Request Body (JSON):
 * {
 *   "type": "expired" | "manual" | "all",
 *   "season": number (optional, for manual invalidation),
 *   "week": number (optional, for manual invalidation),
 *   "playerId": string (optional, for manual invalidation)
 * }
 *
 * Examples:
 * - Invalidate all expired entries: { "type": "expired" }
 * - Invalidate 2024 season: { "type": "manual", "season": 2024 }
 * - Invalidate specific week: { "type": "manual", "season": 2024, "week": 10 }
 * - Invalidate specific player: { "type": "manual", "playerId": "player_123" }
 * - Invalidate all cache: { "type": "all" }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, season, week, playerId } = body

    if (!type || !['expired', 'manual', 'all'].includes(type)) {
      return NextResponse.json(
        {
          error: 'Invalid invalidation type. Must be "expired", "manual", or "all"',
        },
        { status: 400 }
      )
    }

    let recordsInvalidated = 0

    switch (type) {
      case 'expired':
        // Invalidate only expired entries
        recordsInvalidated = await nflDataCacheService.invalidateExpiredCache()
        break

      case 'manual':
        // Manual invalidation with optional filters
        if (!season && !week && !playerId) {
          return NextResponse.json(
            {
              error:
                'Manual invalidation requires at least one filter: season, week, or playerId',
            },
            { status: 400 }
          )
        }

        recordsInvalidated = await nflDataCacheService.invalidateCache({
          season,
          week,
          playerId,
        })
        break

      case 'all':
        // Invalidate all cache entries (use with caution!)
        recordsInvalidated = await nflDataCacheService.invalidateCache({})
        break
    }

    return NextResponse.json({
      success: true,
      data: {
        type,
        recordsInvalidated,
        filters: {
          season: season || null,
          week: week || null,
          playerId: playerId || null,
        },
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('[API] Error invalidating cache:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to invalidate cache',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cache/invalidate
 *
 * Returns information about cache invalidation options (documentation endpoint).
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/cache/invalidate',
    method: 'POST',
    description: 'Invalidates cache entries based on provided criteria',
    requestBody: {
      type: {
        type: 'string',
        required: true,
        enum: ['expired', 'manual', 'all'],
        description:
          'Type of invalidation: expired (auto-expired entries), manual (specific filters), all (everything)',
      },
      season: {
        type: 'number',
        required: false,
        description: 'Season year for manual invalidation (e.g., 2024)',
      },
      week: {
        type: 'number',
        required: false,
        description: 'Week number for manual invalidation (1-18)',
      },
      playerId: {
        type: 'string',
        required: false,
        description: 'Player ID for manual invalidation',
      },
    },
    examples: [
      {
        description: 'Invalidate all expired entries',
        request: { type: 'expired' },
      },
      {
        description: 'Invalidate entire 2024 season',
        request: { type: 'manual', season: 2024 },
      },
      {
        description: 'Invalidate 2024 week 10',
        request: { type: 'manual', season: 2024, week: 10 },
      },
      {
        description: 'Invalidate specific player',
        request: { type: 'manual', playerId: 'player_123' },
      },
      {
        description: 'Invalidate all cache (use with caution)',
        request: { type: 'all' },
      },
    ],
  })
}
