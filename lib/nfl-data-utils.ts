/**
 * NFL Data Utility Functions
 *
 * Shared utilities for safe data handling and formatting across NFL data components.
 * These functions prevent runtime crashes from malformed or missing data.
 */

/**
 * Safe string conversion with fallback for null/undefined/empty values
 *
 * @param value - Value to convert to string
 * @param fallback - Default value if conversion fails (default: 'N/A')
 * @returns Converted string or fallback value
 *
 * @example
 * safeString(null) // 'N/A'
 * safeString('', 'Unknown') // 'Unknown'
 * safeString(123) // '123'
 */
export const safeString = (value: unknown, fallback: string = 'N/A'): string => {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

/**
 * Safe number conversion with fallback for non-numeric values
 * Handles both numeric types and parseable strings
 *
 * @param value - Value to convert to number
 * @param fallback - Default value if conversion fails (default: 0)
 * @returns Converted number or fallback value
 *
 * @example
 * safeNumber(null) // 0
 * safeNumber('123.45') // 123.45
 * safeNumber('invalid', -1) // -1
 */
export const safeNumber = (value: unknown, fallback: number = 0): number => {
  if (typeof value === 'number' && !isNaN(value)) return value
  const parsed = parseFloat(String(value))
  return isNaN(parsed) ? fallback : parsed
}

/**
 * Format a value for display based on the field type
 * Handles percentages, decimals, and whole numbers appropriately
 *
 * @param value - Value to format
 * @param field - Field name to determine formatting rules
 * @returns Formatted string value
 *
 * @example
 * formatValue(0.856, 'target_share') // '85.6%'
 * formatValue(12.456, 'fantasy_points_ppr') // '12.5'
 * formatValue(87, 'rushing_yards') // '87'
 */
export const formatValue = (value: unknown, field: string): string => {
  // Handle string fields (names, positions, teams, etc.)
  const stringFields = ["player_name", "player_id", "position", "team", "season", "week"]
  if (stringFields.includes(field)) {
    return safeString(value)
  }

  // Handle numeric fields
  const numValue = safeNumber(value)

  // Percentage fields - display as percentage with 1 decimal
  if (field.includes("rate") || field.includes("share") || field.includes("percentage") ||
      field.includes("snap_count_pct") || field === "target_share" || field === "air_yards_share") {
    return `${numValue.toFixed(1)}%`
  }
  // Per-game and efficiency metrics - display with 1 decimal
  else if (field.includes("per_game") || field.includes("yards_per") || field.includes("epa") ||
           field === "wopr" || field === "racr" || field === "dakota") {
    return numValue.toFixed(1)
  }
  // Fantasy points - display with 1 decimal
  else if (field.includes("points")) {
    return numValue.toFixed(1)
  }
  // Whole numbers for counts and yardage
  else {
    return Math.round(numValue).toString()
  }
}

/**
 * Generate a unique React key from player data fields
 * Falls back to 'unknown' for missing values to prevent duplicate keys
 *
 * @param parts - Array of values to combine into a key
 * @returns Unique key string
 *
 * @example
 * generateSafeKey('player_123', 'week_5', 2024) // 'player_123_week_5_2024'
 * generateSafeKey(null, undefined, '') // 'unknown_unknown_unknown'
 */
export const generateSafeKey = (...parts: unknown[]): string => {
  return parts.map(part => safeString(part, 'unknown')).join('_')
}
