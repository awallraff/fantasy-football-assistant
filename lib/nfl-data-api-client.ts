/**
 * NFL Data API Client
 *
 * Fetches NFL data from external Python API service (Railway/Render)
 * This replaces the local Python child process spawning for production use
 */

import type { NFLDataResponse, NFLDataOptions } from './nfl-data-service'

const NFL_DATA_API_URL = process.env.NFL_DATA_API_URL || process.env.NEXT_PUBLIC_NFL_DATA_API_URL

/**
 * Check if external NFL Data API is configured and available
 */
export function isExternalAPIAvailable(): boolean {
  return !!NFL_DATA_API_URL
}

/**
 * Fetch NFL data from external API
 */
export async function fetchFromExternalAPI(options: NFLDataOptions = {}): Promise<NFLDataResponse> {
  const {
    years,
    positions = ['QB', 'RB', 'WR', 'TE'],
    week,
    timeout = 120000
  } = options

  if (!NFL_DATA_API_URL) {
    return {
      weekly_stats: [],
      seasonal_stats: [],
      aggregated_season_stats: [],
      player_info: [],
      team_analytics: [],
      metadata: {
        years: years || [],
        positions,
        week,
        extracted_at: new Date().toISOString(),
        total_weekly_records: 0,
        total_seasonal_records: 0,
        total_aggregated_records: 0,
        total_players: 0,
        total_teams: 0
      },
      error: 'NFL Data API URL not configured. Set NFL_DATA_API_URL environment variable.'
    }
  }

  try {
    const params = new URLSearchParams()

    if (years && years.length > 0) {
      params.set('years', years.join(','))
    }

    if (positions && positions.length > 0) {
      params.set('positions', positions.join(','))
    }

    if (week !== undefined) {
      params.set('week', week.toString())
    }

    const url = `${NFL_DATA_API_URL}/api/nfl-data/extract?${params}`

    console.log(`Fetching NFL data from external API: ${url}`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorText}`)
      }

      const data: NFLDataResponse = await response.json()

      console.log(`NFL data fetched successfully. Found ${data.metadata.total_players} players`)

      return data

    } finally {
      clearTimeout(timeoutId)
    }

  } catch (error) {
    console.error('Error fetching from external NFL Data API:', error)

    return {
      weekly_stats: [],
      seasonal_stats: [],
      aggregated_season_stats: [],
      player_info: [],
      team_analytics: [],
      metadata: {
        years: years || [],
        positions,
        week,
        extracted_at: new Date().toISOString(),
        total_weekly_records: 0,
        total_seasonal_records: 0,
        total_aggregated_records: 0,
        total_players: 0,
        total_teams: 0
      },
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Test connection to external API
 */
export async function testExternalAPIConnection(): Promise<{ success: boolean; message: string }> {
  if (!NFL_DATA_API_URL) {
    return {
      success: false,
      message: 'NFL Data API URL not configured. Set NFL_DATA_API_URL environment variable.'
    }
  }

  try {
    const url = `${NFL_DATA_API_URL}/api/nfl-data/test`
    console.log(`Testing external API connection: ${url}`)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(30000) // 30 second timeout
    })

    if (!response.ok) {
      throw new Error(`API health check failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    return {
      success: result.success,
      message: result.message || 'External API connection successful'
    }

  } catch (error) {
    return {
      success: false,
      message: `External API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}
