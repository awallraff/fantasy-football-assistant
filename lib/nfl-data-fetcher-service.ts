import type { NFLDataResponse } from "./nfl-data-service";

export interface NflDataFetchOptions {
  year?: number;
  week?: number;
  positions?: string[];
}

// Most recent season with complete NFL data available
// Update this when new season data becomes available
const LATEST_AVAILABLE_SEASON = 2024;

/**
 * Service responsible for fetching NFL historical data for AI rankings
 * This is a simplified wrapper around the NFL data API specifically for rankings use
 */
export class NflDataFetcherService {
  private cachedData: NFLDataResponse | null = null;

  /**
   * Fetches comprehensive NFL historical data for predictive analysis
   */
  async fetchHistoricalData(options: NflDataFetchOptions = {}): Promise<NFLDataResponse | null> {
    try {
      console.log(`Fetching comprehensive NFL historical data for predictive analysis...`);

      // Use most recent complete season for predictions
      const currentYear = new Date().getFullYear();
      const targetYear = options.year || (currentYear >= 2025 ? 2025 : currentYear);
      const dataYear = LATEST_AVAILABLE_SEASON; // Use most recent complete season for historical analysis

      const positions = options.positions || ['QB', 'RB', 'WR', 'TE'];

      const params = new URLSearchParams({
        action: 'extract',
        years: dataYear.toString(),
        positions: positions.join(',')
      });

      // For predictions, we don't filter by week - we want full historical data
      console.log(`Fetching ${dataYear} NFL data to predict ${targetYear}${options.week ? ` Week ${options.week}` : ''}`);

      const response = await fetch(`/api/nfl-data?${params}`);
      
      if (response.ok) {
        this.cachedData = await response.json();
        console.log(`Successfully loaded comprehensive NFL data with ${this.cachedData?.metadata.total_players || 0} players and ${this.cachedData?.metadata.total_aggregated_records || 0} season records for predictive analysis`);
        return this.cachedData;
      } else {
        console.warn('Failed to fetch NFL historical data for rankings');
        this.cachedData = null;
        return null;
      }
    } catch (error) {
      console.error('Error fetching NFL historical data:', error);
      this.cachedData = null;
      return null;
    }
  }

  /**
   * Gets cached NFL data if available
   */
  getCachedData(): NFLDataResponse | null {
    return this.cachedData;
  }

  /**
   * Clears cached data
   */
  clearCache(): void {
    this.cachedData = null;
  }

  /**
   * Gets historical player data for a specific player by name
   */
  getPlayerData(playerName: string): Record<string, unknown> | null {
    if (!this.cachedData) return null;

    const normalizedName = playerName.toLowerCase();
    
    // Search in aggregated season stats first
    const seasonData = this.cachedData.aggregated_season_stats.find(player => 
      player.player_name?.toLowerCase().includes(normalizedName) ||
      normalizedName.includes(player.player_name?.toLowerCase() || '')
    );

    if (seasonData) return seasonData as unknown as Record<string, unknown>;

    // Search in weekly stats as fallback
    const weeklyData = this.cachedData.weekly_stats.find(player => 
      player.player_name?.toLowerCase().includes(normalizedName) ||
      normalizedName.includes(player.player_name?.toLowerCase() || '')
    );

    return weeklyData ? weeklyData as unknown as Record<string, unknown> : null;
  }

  /**
   * Gets players by position from cached data
   */
  getPlayersByPosition(position: string): Record<string, unknown>[] {
    if (!this.cachedData) return [];

    return this.cachedData.aggregated_season_stats
      .filter(player => player.position === position)
      .map(player => player as unknown as Record<string, unknown>);
  }

  /**
   * Checks if historical data is available
   */
  hasHistoricalData(): boolean {
    return !!(this.cachedData?.aggregated_season_stats && this.cachedData.aggregated_season_stats.length > 0);
  }

  /**
   * Gets weekly or seasonal data based on type
   */
  getData(type: 'weekly' | 'seasonal' = 'seasonal') {
    if (!this.cachedData) return [];
    
    return type === 'weekly' ? this.cachedData.weekly_stats : this.cachedData.aggregated_season_stats;
  }
}
