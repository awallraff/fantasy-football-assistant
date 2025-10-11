import { NextResponse } from 'next/server'
import nflDataCacheService from '@/lib/nfl-data-cache-service'

/**
 * POST /api/cache/warm
 *
 * Pre-populates cache with common queries to improve performance.
 *
 * Request Body (JSON):
 * {
 *   "years": number[] (required),
 *   "positions": string[] (optional, defaults to ["QB", "RB", "WR", "TE"])
 * }
 *
 * Examples:
 * - Warm current season: { "years": [2025] }
 * - Warm last 3 seasons: { "years": [2023, 2024, 2025] }
 * - Warm specific positions: { "years": [2025], "positions": ["QB", "RB"] }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { years, positions = ['QB', 'RB', 'WR', 'TE'] } = body

    // Validate years
    if (!years || !Array.isArray(years) || years.length === 0) {
      return NextResponse.json(
        {
          error: 'Invalid request. "years" must be a non-empty array of numbers',
        },
        { status: 400 }
      )
    }

    // Validate positions
    if (!Array.isArray(positions) || positions.length === 0) {
      return NextResponse.json(
        {
          error: 'Invalid request. "positions" must be a non-empty array of strings',
        },
        { status: 400 }
      )
    }

    const validPositions = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF']
    const invalidPositions = positions.filter(
      (pos) => !validPositions.includes(pos)
    )

    if (invalidPositions.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid positions: ${invalidPositions.join(', ')}. Valid positions: ${validPositions.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Warm cache in the background
    // Note: This could take several minutes depending on the amount of data
    const startTime = Date.now()

    await nflDataCacheService.warmCache(years, positions)

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      data: {
        years,
        positions,
        duration: `${(duration / 1000).toFixed(2)}s`,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        message:
          'Cache warming completed. Data for the specified years and positions has been pre-populated.',
      },
    })
  } catch (error) {
    console.error('[API] Error warming cache:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to warm cache',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cache/warm
 *
 * Returns information about cache warming options (documentation endpoint).
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/cache/warm',
    method: 'POST',
    description:
      'Pre-populates cache with common queries to improve performance. This endpoint fetches data from the source (Python/API) and stores it in the cache.',
    requestBody: {
      years: {
        type: 'number[]',
        required: true,
        description: 'Array of season years to warm cache for (e.g., [2024, 2025])',
      },
      positions: {
        type: 'string[]',
        required: false,
        default: ['QB', 'RB', 'WR', 'TE'],
        description:
          'Array of positions to warm cache for. Valid: QB, RB, WR, TE, K, DEF',
      },
    },
    examples: [
      {
        description: 'Warm cache for current season (all positions)',
        request: { years: [2025] },
      },
      {
        description: 'Warm cache for last 3 seasons',
        request: { years: [2023, 2024, 2025] },
      },
      {
        description: 'Warm cache for specific positions',
        request: { years: [2025], positions: ['QB', 'RB'] },
      },
    ],
    notes: [
      'Cache warming can take several minutes depending on the amount of data',
      'This endpoint fetches data from the source (Python/API) and populates the cache',
      'Use this after deployments or when cache is cleared to improve initial response times',
      'Consider running this as a scheduled job (e.g., daily) to keep cache fresh',
    ],
  })
}
