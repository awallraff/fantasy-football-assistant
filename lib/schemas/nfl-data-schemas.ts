/**
 * NFL Data Validation Schemas
 *
 * Zod schemas for validating NFL data from Python scripts and external APIs.
 * These schemas ensure data integrity at the API boundary and catch schema
 * mismatches before they reach the UI.
 */

import { z } from 'zod';

// ============================================================================
// Base Player Stats Schema
// ============================================================================

/**
 * Base schema for NFL player stats (minimal properties)
 */
export const NFLPlayerStatsSchema = z.object({
  position: z.string(),
  fantasy_points_ppr: z.number().optional(),
});

// ============================================================================
// Weekly Stats Schema
// ============================================================================

/**
 * Schema for weekly NFL player statistics
 */
export const NFLWeeklyStatsSchema = NFLPlayerStatsSchema.extend({
  player_id: z.string(),
  player_name: z.string(),
  team: z.string(),
  season: z.number().int().min(2000).max(2100),
  week: z.number().int().min(1).max(18),
  fantasy_points: z.number().optional(),
  passing_yards: z.number().optional(),
  passing_tds: z.number().optional(),
  interceptions: z.number().optional(),
  rushing_yards: z.number().optional(),
  rushing_tds: z.number().optional(),
  rushing_attempts: z.number().optional(),
  receiving_yards: z.number().optional(),
  receiving_tds: z.number().optional(),
  receptions: z.number().optional(),
  targets: z.number().optional(),
});

export type NFLWeeklyStatsValidated = z.infer<typeof NFLWeeklyStatsSchema>;

// ============================================================================
// Seasonal Stats Schema
// ============================================================================

/**
 * Schema for seasonal NFL player statistics
 */
export const NFLSeasonalStatsSchema = NFLPlayerStatsSchema.extend({
  player_id: z.string(),
  player_name: z.string(),
  team: z.string(),
  season: z.number().int().min(2000).max(2100),
  games: z.number().int().optional(),
  fantasy_points: z.number().optional(),
  passing_yards: z.number().optional(),
  passing_tds: z.number().optional(),
  interceptions: z.number().optional(),
  rushing_yards: z.number().optional(),
  rushing_tds: z.number().optional(),
  rushing_attempts: z.number().optional(),
  receiving_yards: z.number().optional(),
  receiving_tds: z.number().optional(),
  receptions: z.number().optional(),
  targets: z.number().optional(),
});

export type NFLSeasonalStatsValidated = z.infer<typeof NFLSeasonalStatsSchema>;

// ============================================================================
// Player Info Schema
// ============================================================================

/**
 * Schema for NFL player information
 */
export const NFLPlayerInfoSchema = z.object({
  player_id: z.string(),
  player_name: z.string(),
  position: z.string(),
  team: z.string(),
  jersey_number: z.number().int().optional(),
  height: z.string().optional(),
  weight: z.number().optional(),
  birth_date: z.string().optional(),
  college: z.string().optional(),
  season: z.number().int().min(2000).max(2100),
});

export type NFLPlayerInfoValidated = z.infer<typeof NFLPlayerInfoSchema>;

// ============================================================================
// Team Analytics Schema
// ============================================================================

/**
 * Schema for team analytics data
 */
export const NFLTeamAnalyticsSchema = z.object({
  team: z.string(),
  total_fantasy_points: z.number(),
  total_fantasy_points_ppr: z.number(),
  passing_yards: z.number(),
  passing_tds: z.number(),
  interceptions_thrown: z.number(),
  rushing_yards: z.number(),
  rushing_tds: z.number(),
  rushing_attempts: z.number(),
  receiving_yards: z.number(),
  receiving_tds: z.number(),
  receptions: z.number(),
  targets: z.number(),
  yards_per_carry: z.number(),
  catch_rate: z.number(),
  yards_per_target: z.number(),
  qb_fantasy_points: z.number(),
  rb_fantasy_points: z.number(),
  wr_fantasy_points: z.number(),
  te_fantasy_points: z.number(),
  rb_touches: z.number(),
  wr_targets: z.number(),
  te_targets: z.number(),
  red_zone_targets: z.number().optional(),
  red_zone_carries: z.number().optional(),
  red_zone_touches: z.number().optional(),
  offensive_identity: z.enum(['Pass-Heavy', 'Run-Heavy', 'Balanced', 'Unknown']),
  passing_percentage: z.number(),
});

export type NFLTeamAnalyticsValidated = z.infer<typeof NFLTeamAnalyticsSchema>;

// ============================================================================
// Metadata Schema
// ============================================================================

/**
 * Schema for NFL data response metadata
 */
export const NFLDataMetadataSchema = z.object({
  years: z.array(z.number().int()),
  positions: z.array(z.string()),
  week: z.number().int().optional(),
  extracted_at: z.string(),
  total_weekly_records: z.number().int(),
  total_seasonal_records: z.number().int(),
  total_aggregated_records: z.number().int(),
  total_players: z.number().int(),
  total_teams: z.number().int(),
});

export type NFLDataMetadataValidated = z.infer<typeof NFLDataMetadataSchema>;

// ============================================================================
// Full Response Schema
// ============================================================================

/**
 * Schema for complete NFL data response
 */
export const NFLDataResponseSchema = z.object({
  weekly_stats: z.array(NFLWeeklyStatsSchema),
  seasonal_stats: z.array(NFLSeasonalStatsSchema),
  aggregated_season_stats: z.array(NFLSeasonalStatsSchema),
  player_info: z.array(NFLPlayerInfoSchema),
  team_analytics: z.array(NFLTeamAnalyticsSchema),
  metadata: NFLDataMetadataSchema,
  error: z.string().optional(),
});

export type NFLDataResponseValidated = z.infer<typeof NFLDataResponseSchema>;

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Result type for validation operations
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: z.ZodError; rawData?: unknown };

/**
 * Validate NFL data response with detailed error handling
 *
 * @param data - Raw data from Python script or external API
 * @returns Validation result with typed data or error details
 */
export function validateNFLDataResponse(data: unknown): ValidationResult<NFLDataResponseValidated> {
  try {
    const validated = NFLDataResponseSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error, rawData: data };
    }
    throw error;
  }
}

/**
 * Validate array of weekly stats
 *
 * @param data - Array of weekly stats
 * @returns Validation result
 */
export function validateWeeklyStats(data: unknown): ValidationResult<NFLWeeklyStatsValidated[]> {
  try {
    const validated = z.array(NFLWeeklyStatsSchema).parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error, rawData: data };
    }
    throw error;
  }
}

/**
 * Validate array of seasonal stats
 *
 * @param data - Array of seasonal stats
 * @returns Validation result
 */
export function validateSeasonalStats(data: unknown): ValidationResult<NFLSeasonalStatsValidated[]> {
  try {
    const validated = z.array(NFLSeasonalStatsSchema).parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error, rawData: data };
    }
    throw error;
  }
}

/**
 * Validate array of player info
 *
 * @param data - Array of player info
 * @returns Validation result
 */
export function validatePlayerInfo(data: unknown): ValidationResult<NFLPlayerInfoValidated[]> {
  try {
    const validated = z.array(NFLPlayerInfoSchema).parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error, rawData: data };
    }
    throw error;
  }
}

/**
 * Validate array of team analytics
 *
 * @param data - Array of team analytics
 * @returns Validation result
 */
export function validateTeamAnalytics(data: unknown): ValidationResult<NFLTeamAnalyticsValidated[]> {
  try {
    const validated = z.array(NFLTeamAnalyticsSchema).parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error, rawData: data };
    }
    throw error;
  }
}

// ============================================================================
// Error Formatting Utilities
// ============================================================================

/**
 * Format Zod validation errors into human-readable messages
 *
 * @param error - Zod error object
 * @returns Formatted error message
 */
export function formatValidationError(error: z.ZodError): string {
  const issues = error.issues.map((issue) => {
    const path = issue.path.join('.');
    return `${path}: ${issue.message}`;
  });

  return `Validation failed:\n${issues.join('\n')}`;
}

/**
 * Log validation errors with context
 *
 * @param error - Zod error object
 * @param context - Context string (e.g., "NFL Data API")
 */
export function logValidationError(error: z.ZodError, context: string): void {
  console.error(`[${context}] Schema validation failed:`);
  console.error(formatValidationError(error));
  console.error('First issue details:', error.issues[0]);
}

/**
 * Safe parse with logging
 *
 * @param data - Data to validate
 * @param schema - Zod schema
 * @param context - Context for logging
 * @returns Validation result
 */
export function safeParseWithLogging<T extends z.ZodTypeAny>(
  data: unknown,
  schema: T,
  context: string
): ValidationResult<z.infer<T>> {
  const result = schema.safeParse(data);

  if (!result.success) {
    logValidationError(result.error, context);
    return { success: false, error: result.error, rawData: data };
  }

  return { success: true, data: result.data };
}

// ============================================================================
// Partial Validation (graceful degradation)
// ============================================================================

/**
 * Validate with partial success - filters out invalid records
 * This is useful when some records in an array may be malformed
 * but you want to process the valid ones
 *
 * @param data - Array of data to validate
 * @param schema - Zod schema for individual items
 * @returns Valid records and list of errors
 */
export function validatePartial<T extends z.ZodTypeAny>(
  data: unknown[],
  schema: T
): {
  validRecords: z.infer<T>[];
  invalidCount: number;
  errors: Array<{ index: number; error: z.ZodError }>;
} {
  const validRecords: z.infer<T>[] = [];
  const errors: Array<{ index: number; error: z.ZodError }> = [];

  data.forEach((item, index) => {
    const result = schema.safeParse(item);
    if (result.success) {
      validRecords.push(result.data);
    } else {
      errors.push({ index, error: result.error });
    }
  });

  return {
    validRecords,
    invalidCount: errors.length,
    errors,
  };
}

// ============================================================================
// Export all schemas and utilities
// ============================================================================

export default {
  // Schemas
  NFLPlayerStatsSchema,
  NFLWeeklyStatsSchema,
  NFLSeasonalStatsSchema,
  NFLPlayerInfoSchema,
  NFLTeamAnalyticsSchema,
  NFLDataMetadataSchema,
  NFLDataResponseSchema,

  // Validation functions
  validateNFLDataResponse,
  validateWeeklyStats,
  validateSeasonalStats,
  validatePlayerInfo,
  validateTeamAnalytics,

  // Error utilities
  formatValidationError,
  logValidationError,
  safeParseWithLogging,
  validatePartial,
};
