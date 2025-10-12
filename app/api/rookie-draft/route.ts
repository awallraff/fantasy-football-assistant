/**
 * Rookie Draft Data API Route
 *
 * This API route fetches real 2025 NFL Draft data from Python scripts.
 * It uses child_process (Node.js only) to run the Python script.
 */

import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

// ============================================================================
// Python Response Types
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

interface PythonRookieResponse {
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
// API Route Handler
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    console.log('[Rookie Draft API] Fetching 2025 rookie data...')

    const scriptPath = path.join(process.cwd(), 'scripts', 'fetch_rookie_draft_data.py')
    const data = await runPythonScript(scriptPath)

    if (data.error) {
      console.error('[Rookie Draft API] Python error:', data.error)
      return NextResponse.json(
        { error: data.error, rookies: [] },
        { status: 500 }
      )
    }

    console.log(`[Rookie Draft API] Successfully fetched ${data.rookies.length} rookies`)

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      }
    })
  } catch (error) {
    console.error('[Rookie Draft API] Error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        rookies: [],
        metadata: {
          total_rookies: 0,
          fetched_at: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// Python Script Execution
// ============================================================================

function runPythonScript(scriptPath: string): Promise<PythonRookieResponse> {
  return new Promise((resolve, reject) => {
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'

    const python = spawn(pythonCmd, [scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''
    let isResolved = false

    python.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    python.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    const timeout = 60000 // 60 seconds
    const timeoutId = setTimeout(() => {
      if (!isResolved) {
        isResolved = true
        python.kill('SIGKILL')
        reject(new Error(`Python script timed out after ${timeout}ms`))
      }
    }, timeout)

    python.on('close', (code) => {
      if (isResolved) return
      isResolved = true
      clearTimeout(timeoutId)

      if (code !== 0) {
        reject(new Error(`Python script failed with code ${code}. Error: ${stderr}`))
        return
      }

      try {
        if (stderr) {
          console.log('[Rookie Draft API] Python logs:', stderr)
        }

        if (!stdout.trim()) {
          reject(new Error('Python script returned empty output'))
          return
        }

        const result: PythonRookieResponse = JSON.parse(stdout)
        resolve(result)
      } catch (parseError) {
        reject(new Error(`Failed to parse Python script output: ${parseError}`))
      }
    })

    python.on('error', (error) => {
      if (isResolved) return
      isResolved = true
      clearTimeout(timeoutId)
      reject(new Error(`Failed to start Python script: ${error.message}`))
    })
  })
}
