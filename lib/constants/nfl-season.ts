/**
 * NFL Season Constants
 *
 * Centralized constants for NFL season management.
 * Update LATEST_AVAILABLE_SEASON at the start of each new NFL season (typically early September).
 */

/**
 * The most recent NFL season for which data is available.
 *
 * **IMPORTANT:** Update this constant when new season data becomes available.
 * Typically this happens in early September of each year.
 *
 * Update locations:
 * 1. This file: `lib/constants/nfl-season.ts`
 * 2. Test the Python script: `python scripts/nfl_data_extractor.py --years YYYY --positions QB --week 1`
 * 3. Deploy changes before Week 1 of the new season
 *
 * @example
 * // When 2025 season data becomes available (September 2025):
 * export const LATEST_AVAILABLE_SEASON = 2025
 */
export const LATEST_AVAILABLE_SEASON = 2025

/**
 * Get the default season year for UI components
 * Uses the latest available season as the default
 */
export function getDefaultSeasonYear(): number {
  return LATEST_AVAILABLE_SEASON
}

/**
 * Get available years for season selection
 * Returns last N years including the latest available season
 *
 * @param yearsBack - Number of years to include (default: 5)
 * @returns Array of years in descending order
 *
 * @example
 * getAvailableSeasonYears(5) // [2024, 2023, 2022, 2021, 2020]
 */
export function getAvailableSeasonYears(yearsBack: number = 5): number[] {
  return Array.from({ length: yearsBack }, (_, i) => LATEST_AVAILABLE_SEASON - i)
}
