import { spawn } from 'child_process'
import path from 'path'

export interface NFLWeeklyStats {
  player_id: string
  player_name: string
  position: string
  team: string
  season: number
  week: number
  fantasy_points?: number
  fantasy_points_ppr?: number
  passing_yards?: number
  passing_tds?: number
  interceptions?: number
  rushing_yards?: number
  rushing_tds?: number
  rushing_attempts?: number
  receiving_yards?: number
  receiving_tds?: number
  receptions?: number
  targets?: number
}

export interface NFLSeasonalStats {
  player_id: string
  player_name: string
  position: string
  team: string
  season: number
  games?: number
  fantasy_points?: number
  fantasy_points_ppr?: number
  passing_yards?: number
  passing_tds?: number
  interceptions?: number
  rushing_yards?: number
  rushing_tds?: number
  rushing_attempts?: number
  receiving_yards?: number
  receiving_tds?: number
  receptions?: number
  targets?: number
}

export interface NFLPlayerInfo {
  player_id: string
  player_name: string
  position: string
  team: string
  jersey_number?: number
  height?: string
  weight?: number
  birth_date?: string
  college?: string
  season: number
}

export interface NFLTeamAnalytics {
  team: string
  total_fantasy_points: number
  total_fantasy_points_ppr: number
  passing_yards: number
  passing_tds: number
  interceptions_thrown: number
  rushing_yards: number
  rushing_tds: number
  rushing_attempts: number
  receiving_yards: number
  receiving_tds: number
  receptions: number
  targets: number
  yards_per_carry: number
  catch_rate: number
  yards_per_target: number
  qb_fantasy_points: number
  rb_fantasy_points: number
  wr_fantasy_points: number
  te_fantasy_points: number
  rb_touches: number
  wr_targets: number
  te_targets: number
  red_zone_targets?: number
  red_zone_carries?: number
  red_zone_touches?: number
  offensive_identity: 'Pass-Heavy' | 'Run-Heavy' | 'Balanced' | 'Unknown'
  passing_percentage: number
}

export interface NFLDataResponse {
  weekly_stats: NFLWeeklyStats[]
  seasonal_stats: NFLSeasonalStats[]
  aggregated_season_stats: NFLSeasonalStats[]
  player_info: NFLPlayerInfo[]
  team_analytics: NFLTeamAnalytics[]
  metadata: {
    years: number[]
    positions: string[]
    week?: number
    extracted_at: string
    total_weekly_records: number
    total_seasonal_records: number
    total_aggregated_records: number
    total_players: number
    total_teams: number
  }
  error?: string
}

export interface NFLDataOptions {
  years?: number[]
  positions?: string[]
  week?: number
  timeout?: number
}

class NFLDataService {
  private scriptPath: string
  private defaultTimeout: number = 120000 // 120 seconds (2 minutes)

  constructor() {
    this.scriptPath = path.join(process.cwd(), 'scripts', 'nfl_data_extractor.py')
  }

  async extractNFLData(options: NFLDataOptions = {}): Promise<NFLDataResponse> {
    const {
      years,
      positions = ['QB', 'RB', 'WR', 'TE'],
      week,
      timeout = this.defaultTimeout
    } = options

    try {
      console.log('Starting NFL data extraction with options:', options)
      
      const args = ['--positions', ...positions]
      
      if (years && years.length > 0) {
        args.push('--years', ...years.map(y => y.toString()))
      }
      
      if (week !== undefined) {
        args.push('--week', week.toString())
      }

      const data = await this.runPythonScript(args, timeout)
      
      console.log(`NFL data extraction completed. Found ${data.metadata.total_players} players`)
      
      return data
    } catch (error) {
      console.error('Error extracting NFL data:', error)
      
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

  async getPlayerStats(playerId: string, years?: number[]): Promise<{
    weekly: NFLWeeklyStats[]
    seasonal: NFLSeasonalStats[]
    info: NFLPlayerInfo | null
  }> {
    try {
      const data = await this.extractNFLData({ years })
      
      const weekly = data.weekly_stats.filter(stat => stat.player_id === playerId)
      const seasonal = data.seasonal_stats.filter(stat => stat.player_id === playerId)
      const info = data.player_info.find(player => player.player_id === playerId) || null
      
      return { weekly, seasonal, info }
    } catch (error) {
      console.error(`Error getting stats for player ${playerId}:`, error)
      return { weekly: [], seasonal: [], info: null }
    }
  }

  async getTeamStats(team: string, years?: number[]): Promise<NFLDataResponse> {
    try {
      const data = await this.extractNFLData({ years })
      
      return {
        ...data,
        weekly_stats: data.weekly_stats.filter(stat => stat.team === team),
        seasonal_stats: data.seasonal_stats.filter(stat => stat.team === team),
        player_info: data.player_info.filter(player => player.team === team)
      }
    } catch (error) {
      console.error(`Error getting stats for team ${team}:`, error)
      throw error
    }
  }

  async getPositionStats(position: string, years?: number[]): Promise<NFLDataResponse> {
    try {
      const data = await this.extractNFLData({ years, positions: [position] })
      return data
    } catch (error) {
      console.error(`Error getting stats for position ${position}:`, error)
      throw error
    }
  }

  async getCurrentWeekStats(week: number, year?: number): Promise<NFLDataResponse> {
    try {
      const currentYear = year || new Date().getFullYear()
      const data = await this.extractNFLData({ 
        years: [currentYear], 
        week 
      })
      return data
    } catch (error) {
      console.error(`Error getting week ${week} stats:`, error)
      throw error
    }
  }

  private runPythonScript(args: string[], timeout: number): Promise<NFLDataResponse> {
    return new Promise((resolve, reject) => {
      // Use 'python' instead of 'python3' on Windows
      const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'
      
      const python = spawn(pythonCmd, [this.scriptPath, ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        // Set memory limit for Windows
        ...(process.platform === 'win32' && {
          env: {
            ...process.env,
            PYTHONPATH: process.env.PYTHONPATH || '',
            // Increase memory limit
            NODE_OPTIONS: '--max-old-space-size=4096'
          }
        })
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
            console.log('Python script logs:', stderr)
          }
          
          if (!stdout.trim()) {
            reject(new Error('Python script returned empty output'))
            return
          }
          
          const result = JSON.parse(stdout)
          resolve(result)
        } catch (parseError) {
          reject(new Error(`Failed to parse Python script output: ${parseError}. Output: ${stdout.slice(0, 500)}...`))
        }
      })

      python.on('error', (error) => {
        if (isResolved) return
        isResolved = true
        clearTimeout(timeoutId)
        reject(new Error(`Failed to start Python script: ${error.message}`))
      })

      // Handle process exit
      process.on('exit', () => {
        if (!isResolved) {
          python.kill('SIGKILL')
        }
      })
    })
  }

  // Utility methods
  getCurrentSeason(): number {
    const now = new Date()
    // NFL season typically starts in September
    return now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
  }

  getLastNSeasons(n: number): number[] {
    const currentSeason = this.getCurrentSeason()
    return Array.from({ length: n }, (_, i) => currentSeason - i).reverse()
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Testing NFL data service connection...')
      
      // Test with minimal data request
      const testData = await this.extractNFLData({
        years: [this.getCurrentSeason()],
        positions: ['QB'],
        week: 1
      })
      
      if (testData.error) {
        return {
          success: false,
          message: `Test failed: ${testData.error}`
        }
      }
      
      return {
        success: true,
        message: `Connection successful. Found ${testData.metadata.total_players} QB records for week 1.`
      }
    } catch (error) {
      return {
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}

// Create singleton instance
const nflDataService = new NFLDataService()

export { nflDataService }
export default nflDataService
