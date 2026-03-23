/**
 * NFL Season Constants
 *
 * Centralized constants for NFL season management.
 *
 * IMPORTANT:
 * - PLATFORM_CURRENT_SEASON: what the app should target for league UX (upcoming season support).
 * - LATEST_AVAILABLE_SEASON: latest season with published NFL stats data (nflverse/nflreadpy).
 */

/**
 * The most recent NFL season for which data is available.
 *
 * **IMPORTANT:** Update this constant when new season data becomes available.
 * Typically this happens in early September of each year.
 *
 * Update locations:
 * 1. This file: `lib/constants/nfl-season.ts`
 * 2. Test the Python API: `curl "https://your-api.onrender.com/api/nfl-data/extract?years=YYYY&positions=QB&week=1"`
 * 3. Deploy changes before Week 1 of the new season
 *
 * @example
 * // When 2026 season data becomes available (September 2026):
 * export const LATEST_AVAILABLE_SEASON = 2026
 *
 * @changelog
 * - 2026-03-22: Set to 2025 — nflverse releases `stats_player_week_YYYY.parquet` only after that
 *   season exists; requesting the next calendar year (e.g. 2026 in March) returns 404 until ~Sept.
 * - 2025-10-12: Updated to 2025 (completed nflreadpy migration, 2025 data confirmed available)
 * - 2025-10-12: Reverted to 2024 (2025 season data not yet available in nfl_data_py)
 * - 2025-10-10: Updated to 2025 (migrated to nflreadpy library)
 */
export const LATEST_AVAILABLE_SEASON = 2025

/**
 * Season the product should present as current for league workflows.
 *
 * MVP is intentionally static for launch readiness.
 * Future: make this dynamic via schedule/date-based logic or admin config.
 */
export const PLATFORM_CURRENT_SEASON = 2026

/**
 * Get the default season year for UI components
 * Uses the latest available season as the default
 */
export function getDefaultSeasonYear(): number {
  return PLATFORM_CURRENT_SEASON
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
  return Array.from({ length: yearsBack }, (_, i) => PLATFORM_CURRENT_SEASON - i)
}

/**
 * Get available years for NFL stats extraction.
 * This is intentionally capped to published stats data, not platform target season.
 */
export function getAvailableDataSeasonYears(yearsBack: number = 5): number[] {
  return Array.from({ length: yearsBack }, (_, i) => LATEST_AVAILABLE_SEASON - i)
}

/**
 * Clamp requested seasons to what nflverse actually publishes (avoids 404 on parquet downloads).
 * Call this for any API/query path that passes `years` into nflreadpy.
 */
export function clampSeasonYearsToAvailable(years: number[]): number[] {
  const unique = [
    ...new Set(
      years
        .filter((y) => Number.isFinite(y) && y >= 1999)
        .map((y) => Math.min(Math.trunc(y), LATEST_AVAILABLE_SEASON))
    ),
  ].sort((a, b) => b - a)
  return unique
}
