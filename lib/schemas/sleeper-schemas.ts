/**
 * Sleeper API Validation Schemas
 *
 * Zod schemas for validating Sleeper API responses.
 * These schemas ensure data integrity at the API boundary and catch schema
 * mismatches before they reach the UI.
 */

import { z } from 'zod';

// ============================================================================
// User Schema
// ============================================================================

/**
 * Schema for Sleeper user data
 */
export const SleeperUserSchema = z.object({
  user_id: z.string(),
  username: z.string().optional(),
  display_name: z.string(),
  avatar: z.string().nullable(),
});

export type SleeperUserValidated = z.infer<typeof SleeperUserSchema>;

// ============================================================================
// League Schemas
// ============================================================================

/**
 * Schema for league settings
 */
export const SleeperLeagueSettingsSchema = z.object({
  max_keepers: z.number().optional(),
  draft_rounds: z.number().optional(),
  trade_deadline: z.number().optional(),
  playoff_week_start: z.number().optional(),
  num_teams: z.number(),
  playoff_teams: z.number().optional(),
  squads: z.number().optional(),
  divisions: z.number().optional(),
}).catchall(z.unknown()); // Allow additional unknown properties

/**
 * Schema for scoring settings
 */
export const SleeperScoringSettingsSchema = z.record(z.string(), z.number());

/**
 * Schema for Sleeper league data
 */
export const SleeperLeagueSchema = z.object({
  league_id: z.string(),
  name: z.string(),
  season: z.string(),
  season_type: z.string(),
  total_rosters: z.number(),
  status: z.string(),
  sport: z.string(),
  settings: SleeperLeagueSettingsSchema,
  scoring_settings: SleeperScoringSettingsSchema,
  roster_positions: z.array(z.string()),
});

export type SleeperLeagueValidated = z.infer<typeof SleeperLeagueSchema>;

// ============================================================================
// Roster Schema
// ============================================================================

/**
 * Schema for roster settings
 */
export const SleeperRosterSettingsSchema = z.object({
  wins: z.number(),
  losses: z.number(),
  ties: z.number(),
  fpts: z.number(),
  fpts_against: z.number(),
  fpts_decimal: z.number(),
  fpts_against_decimal: z.number(),
});

/**
 * Schema for Sleeper roster data
 */
export const SleeperRosterSchema = z.object({
  roster_id: z.number(),
  owner_id: z.string(),
  players: z.array(z.string()),
  starters: z.array(z.string()),
  reserve: z.array(z.string()).nullable().optional(),
  taxi: z.array(z.string()).nullable().optional(),
  settings: SleeperRosterSettingsSchema,
});

export type SleeperRosterValidated = z.infer<typeof SleeperRosterSchema>;

// ============================================================================
// Player Schema
// ============================================================================

/**
 * Schema for Sleeper player data
 */
export const SleeperPlayerSchema = z.object({
  player_id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  full_name: z.string(),
  position: z.string(),
  team: z.string(),
  age: z.number().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  years_exp: z.number().optional(),
  college: z.string().optional(),
  injury_status: z.string().optional(),
  fantasy_positions: z.array(z.string()).optional(),
});

export type SleeperPlayerValidated = z.infer<typeof SleeperPlayerSchema>;

/**
 * Schema for all players (dictionary format)
 */
export const SleeperAllPlayersSchema = z.record(z.string(), SleeperPlayerSchema);

export type SleeperAllPlayersValidated = z.infer<typeof SleeperAllPlayersSchema>;

// ============================================================================
// Transaction Schema
// ============================================================================

/**
 * Schema for draft pick in transactions
 */
export const SleeperDraftPickSchema = z.object({
  season: z.string(),
  round: z.number(),
  roster_id: z.number(),
  previous_owner_id: z.number(),
  owner_id: z.number(),
});

/**
 * Schema for waiver budget
 */
export const SleeperWaiverBudgetSchema = z.object({
  sender: z.number(),
  receiver: z.number(),
  amount: z.number(),
});

/**
 * Schema for Sleeper transactions
 */
export const SleeperTransactionSchema = z.object({
  transaction_id: z.string(),
  type: z.enum(['trade', 'waiver', 'free_agent']),
  status: z.string(),
  created: z.number(),
  roster_ids: z.array(z.number()),
  adds: z.record(z.string(), z.number()).optional(),
  drops: z.record(z.string(), z.number()).optional(),
  draft_picks: z.array(SleeperDraftPickSchema).optional(),
  waiver_budget: z.array(SleeperWaiverBudgetSchema).optional(),
});

export type SleeperTransactionValidated = z.infer<typeof SleeperTransactionSchema>;

// ============================================================================
// Matchup Schema
// ============================================================================

/**
 * Schema for Sleeper matchup data
 */
export const SleeperMatchupSchema = z.object({
  matchup_id: z.number(),
  roster_id: z.number(),
  points: z.number(),
  players: z.array(z.string()),
  starters: z.array(z.string()),
  players_points: z.record(z.string(), z.number()),
  custom_points: z.number().optional(),
});

export type SleeperMatchupValidated = z.infer<typeof SleeperMatchupSchema>;

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
 * Validate Sleeper user data
 */
export function validateSleeperUser(data: unknown): ValidationResult<SleeperUserValidated> {
  try {
    const validated = SleeperUserSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error, rawData: data };
    }
    throw error;
  }
}

/**
 * Validate Sleeper league data
 */
export function validateSleeperLeague(data: unknown): ValidationResult<SleeperLeagueValidated> {
  try {
    const validated = SleeperLeagueSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error, rawData: data };
    }
    throw error;
  }
}

/**
 * Validate array of Sleeper leagues
 */
export function validateSleeperLeagues(data: unknown): ValidationResult<SleeperLeagueValidated[]> {
  try {
    const validated = z.array(SleeperLeagueSchema).parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error, rawData: data };
    }
    throw error;
  }
}

/**
 * Validate Sleeper roster data
 */
export function validateSleeperRoster(data: unknown): ValidationResult<SleeperRosterValidated> {
  try {
    const validated = SleeperRosterSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error, rawData: data };
    }
    throw error;
  }
}

/**
 * Validate array of Sleeper rosters
 */
export function validateSleeperRosters(data: unknown): ValidationResult<SleeperRosterValidated[]> {
  try {
    const validated = z.array(SleeperRosterSchema).parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error, rawData: data };
    }
    throw error;
  }
}

/**
 * Validate array of Sleeper users
 */
export function validateSleeperUsers(data: unknown): ValidationResult<SleeperUserValidated[]> {
  try {
    const validated = z.array(SleeperUserSchema).parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error, rawData: data };
    }
    throw error;
  }
}

/**
 * Validate Sleeper all players data
 */
export function validateSleeperAllPlayers(data: unknown): ValidationResult<SleeperAllPlayersValidated> {
  try {
    const validated = SleeperAllPlayersSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error, rawData: data };
    }
    throw error;
  }
}

/**
 * Validate Sleeper transaction data
 */
export function validateSleeperTransaction(data: unknown): ValidationResult<SleeperTransactionValidated> {
  try {
    const validated = SleeperTransactionSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error, rawData: data };
    }
    throw error;
  }
}

/**
 * Validate array of Sleeper transactions
 */
export function validateSleeperTransactions(data: unknown): ValidationResult<SleeperTransactionValidated[]> {
  try {
    const validated = z.array(SleeperTransactionSchema).parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error, rawData: data };
    }
    throw error;
  }
}

/**
 * Validate array of Sleeper matchups
 */
export function validateSleeperMatchups(data: unknown): ValidationResult<SleeperMatchupValidated[]> {
  try {
    const validated = z.array(SleeperMatchupSchema).parse(data);
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
 */
export function logValidationError(error: z.ZodError, context: string): void {
  console.error(`[${context}] Schema validation failed:`);
  console.error(formatValidationError(error));
  console.error('First issue details:', error.issues[0]);
}

/**
 * Safe parse with logging
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
  SleeperUserSchema,
  SleeperLeagueSchema,
  SleeperRosterSchema,
  SleeperPlayerSchema,
  SleeperAllPlayersSchema,
  SleeperTransactionSchema,
  SleeperMatchupSchema,
  SleeperDraftPickSchema,

  // Validation functions
  validateSleeperUser,
  validateSleeperLeague,
  validateSleeperLeagues,
  validateSleeperRoster,
  validateSleeperRosters,
  validateSleeperUsers,
  validateSleeperAllPlayers,
  validateSleeperTransaction,
  validateSleeperTransactions,
  validateSleeperMatchups,

  // Error utilities
  formatValidationError,
  logValidationError,
  safeParseWithLogging,
  validatePartial,
};
