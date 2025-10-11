import { NextRequest, NextResponse } from 'next/server'
import nflDataService from '@/lib/nfl-data-service'
import nflDataCacheService from '@/lib/nfl-data-cache-service'
import {
  validateNFLDataResponse,
  logValidationError,
  formatValidationError
} from '@/lib/schemas/nfl-data-schemas'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const action = searchParams.get('action') || 'extract'
    const yearsParam = searchParams.get('years')
    const positionsParam = searchParams.get('positions')
    const weekParam = searchParams.get('week')
    const playerIdParam = searchParams.get('playerId')
    const teamParam = searchParams.get('team')
    const positionParam = searchParams.get('position')
    
    // Parse years parameter
    const years = yearsParam ? yearsParam.split(',').map(y => parseInt(y.trim())).filter(y => !isNaN(y)) : undefined
    
    // Parse positions parameter
    const positions = positionsParam ? positionsParam.split(',').map(p => p.trim().toUpperCase()) : undefined
    
    // Parse week parameter
    const week = weekParam ? parseInt(weekParam) : undefined
    
    switch (action) {
      case 'test':
        const testResult = await nflDataService.testConnection()
        return NextResponse.json(testResult)
        
      case 'extract':
        // Use caching service for data extraction
        const data = await nflDataCacheService.extractNFLData({
          years,
          positions,
          week
        })

        // Validate the response data
        const validationResult = validateNFLDataResponse(data)

        if (!validationResult.success) {
          logValidationError(validationResult.error, 'NFL Data API - Extract')

          // Return the data with validation warning (graceful degradation)
          return NextResponse.json({
            ...data,
            validation_warning: 'Data failed schema validation. Some fields may be missing or incorrect.',
            validation_errors: formatValidationError(validationResult.error),
          })
        }

        return NextResponse.json(validationResult.data)
        
      case 'player':
        if (!playerIdParam) {
          return NextResponse.json(
            { error: 'playerId parameter is required for player action' },
            { status: 400 }
          )
        }
        const playerStats = await nflDataService.getPlayerStats(playerIdParam, years)
        return NextResponse.json(playerStats)
        
      case 'team':
        if (!teamParam) {
          return NextResponse.json(
            { error: 'team parameter is required for team action' },
            { status: 400 }
          )
        }
        const teamStats = await nflDataService.getTeamStats(teamParam, years)

        // Validate the response data
        const teamValidationResult = validateNFLDataResponse(teamStats)

        if (!teamValidationResult.success) {
          logValidationError(teamValidationResult.error, 'NFL Data API - Team')

          return NextResponse.json({
            ...teamStats,
            validation_warning: 'Data failed schema validation.',
            validation_errors: formatValidationError(teamValidationResult.error),
          })
        }

        return NextResponse.json(teamValidationResult.data)
        
      case 'position':
        if (!positionParam) {
          return NextResponse.json(
            { error: 'position parameter is required for position action' },
            { status: 400 }
          )
        }
        const positionStats = await nflDataService.getPositionStats(positionParam, years)

        // Validate the response data
        const positionValidationResult = validateNFLDataResponse(positionStats)

        if (!positionValidationResult.success) {
          logValidationError(positionValidationResult.error, 'NFL Data API - Position')

          return NextResponse.json({
            ...positionStats,
            validation_warning: 'Data failed schema validation.',
            validation_errors: formatValidationError(positionValidationResult.error),
          })
        }

        return NextResponse.json(positionValidationResult.data)
        
      case 'current-week':
        if (week === undefined) {
          return NextResponse.json(
            { error: 'week parameter is required for current-week action' },
            { status: 400 }
          )
        }
        const currentWeekStats = await nflDataService.getCurrentWeekStats(week)

        // Validate the response data
        const weekValidationResult = validateNFLDataResponse(currentWeekStats)

        if (!weekValidationResult.success) {
          logValidationError(weekValidationResult.error, 'NFL Data API - Current Week')

          return NextResponse.json({
            ...currentWeekStats,
            validation_warning: 'Data failed schema validation.',
            validation_errors: formatValidationError(weekValidationResult.error),
          })
        }

        return NextResponse.json(weekValidationResult.data)
        
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Available actions: test, extract, player, team, position, current-week` },
          { status: 400 }
        )
    }
    
  } catch (error) {
    console.error('NFL Data API Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...options } = body
    
    switch (action) {
      case 'extract':
        // Use caching service for data extraction
        const data = await nflDataCacheService.extractNFLData(options)

        // Validate the response data
        const validationResult = validateNFLDataResponse(data)

        if (!validationResult.success) {
          logValidationError(validationResult.error, 'NFL Data API - POST Extract')

          return NextResponse.json({
            ...data,
            validation_warning: 'Data failed schema validation.',
            validation_errors: formatValidationError(validationResult.error),
          })
        }

        return NextResponse.json(validationResult.data)
        
      case 'player':
        if (!options.playerId) {
          return NextResponse.json(
            { error: 'playerId is required for player action' },
            { status: 400 }
          )
        }
        const playerStats = await nflDataService.getPlayerStats(options.playerId, options.years)
        return NextResponse.json(playerStats)
        
      case 'team':
        if (!options.team) {
          return NextResponse.json(
            { error: 'team is required for team action' },
            { status: 400 }
          )
        }
        const teamStats = await nflDataService.getTeamStats(options.team, options.years)

        // Validate the response data
        const postTeamValidationResult = validateNFLDataResponse(teamStats)

        if (!postTeamValidationResult.success) {
          logValidationError(postTeamValidationResult.error, 'NFL Data API - POST Team')

          return NextResponse.json({
            ...teamStats,
            validation_warning: 'Data failed schema validation.',
            validation_errors: formatValidationError(postTeamValidationResult.error),
          })
        }

        return NextResponse.json(postTeamValidationResult.data)
        
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
    
  } catch (error) {
    console.error('NFL Data API Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
