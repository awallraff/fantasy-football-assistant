import { NextResponse } from 'next/server'
import nflDataCacheService from '@/lib/nfl-data-cache-service'

/**
 * GET /api/cache/stats
 *
 * Returns cache statistics including hit rate, miss rate, and performance metrics.
 *
 * Query Parameters:
 * - since: ISO date string to filter stats from a specific time (optional)
 *
 * Example: /api/cache/stats?since=2025-01-01T00:00:00Z
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sinceParam = searchParams.get('since')

    let since: Date | undefined
    if (sinceParam) {
      since = new Date(sinceParam)
      if (isNaN(since.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format for "since" parameter' },
          { status: 400 }
        )
      }
    }

    const stats = await nflDataCacheService.getCacheStats(since)

    return NextResponse.json({
      success: true,
      data: stats,
      metadata: {
        since: since?.toISOString() || null,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('[API] Error getting cache stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve cache statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
