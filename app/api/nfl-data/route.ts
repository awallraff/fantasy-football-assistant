import { NextRequest, NextResponse } from 'next/server'
import nflDataService from '@/lib/nfl-data-service'

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
        const data = await nflDataService.extractNFLData({
          years,
          positions,
          week
        })
        return NextResponse.json(data)
        
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
        return NextResponse.json(teamStats)
        
      case 'position':
        if (!positionParam) {
          return NextResponse.json(
            { error: 'position parameter is required for position action' },
            { status: 400 }
          )
        }
        const positionStats = await nflDataService.getPositionStats(positionParam, years)
        return NextResponse.json(positionStats)
        
      case 'current-week':
        if (week === undefined) {
          return NextResponse.json(
            { error: 'week parameter is required for current-week action' },
            { status: 400 }
          )
        }
        const currentWeekStats = await nflDataService.getCurrentWeekStats(week)
        return NextResponse.json(currentWeekStats)
        
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
        const data = await nflDataService.extractNFLData(options)
        return NextResponse.json(data)
        
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
        return NextResponse.json(teamStats)
        
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