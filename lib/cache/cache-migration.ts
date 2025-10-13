/**
 * Cache Migration Utility
 *
 * Migrates player data from sessionStorage (Phase 1) to IndexedDB (Phase 2).
 * Ensures smooth upgrade path without data loss.
 */

import { indexedDBCache } from "./indexeddb-cache"
import { sleeperCache } from "./sleeper-cache"

// ============================================================================
// Migration Status
// ============================================================================

export interface MigrationStatus {
  attempted: boolean
  success: boolean
  error: string | null
  playersCount: number
  timeMs: number
}

// ============================================================================
// Migration Detection
// ============================================================================

/**
 * Check if sessionStorage cache exists and needs migration
 */
export function needsMigration(): boolean {
  // Only migrate in browser environment
  if (typeof window === "undefined") {
    return false
  }

  // Check if IndexedDB is available
  if (!indexedDBCache.isAvailable()) {
    console.log("[Migration] IndexedDB not available, migration not needed")
    return false
  }

  // Check if sessionStorage has cached data
  const sessionData = sleeperCache.get("allPlayers", "nfl")
  if (!sessionData) {
    console.log("[Migration] No sessionStorage data found, migration not needed")
    return false
  }

  console.log("[Migration] SessionStorage data found, migration needed")
  return true
}

/**
 * Check if migration has already been completed
 */
export async function isMigrationComplete(): Promise<boolean> {
  if (!indexedDBCache.isAvailable()) {
    return false
  }

  try {
    const metadata = await indexedDBCache.getCacheMetadata()
    return metadata !== null
  } catch {
    return false
  }
}

// ============================================================================
// Migration Execution
// ============================================================================

/**
 * Migrate player data from sessionStorage to IndexedDB
 */
export async function migrateSessionStorageToIndexedDB(): Promise<MigrationStatus> {
  const startTime = Date.now()
  const status: MigrationStatus = {
    attempted: true,
    success: false,
    error: null,
    playersCount: 0,
    timeMs: 0,
  }

  try {
    console.log("[Migration] Starting migration from sessionStorage to IndexedDB...")

    // Check if IndexedDB is available
    if (!indexedDBCache.isAvailable()) {
      throw new Error("IndexedDB not available")
    }

    // Get data from sessionStorage
    const sessionData = sleeperCache.get("allPlayers", "nfl")
    if (!sessionData) {
      throw new Error("No sessionStorage data found")
    }

    const playersCount = Object.keys(sessionData).length
    console.log(`[Migration] Found ${playersCount} players in sessionStorage`)

    // Initialize IndexedDB
    await indexedDBCache.init()

    // Check if IndexedDB already has data (avoid overwriting newer data)
    const existingMetadata = await indexedDBCache.getCacheMetadata()
    if (existingMetadata) {
      console.log("[Migration] IndexedDB already has data, skipping migration")
      status.success = true
      status.playersCount = existingMetadata.playerCount
      status.timeMs = Date.now() - startTime
      return status
    }

    // Migrate data to IndexedDB
    const success = await indexedDBCache.setPlayers(sessionData)

    if (!success) {
      throw new Error("Failed to write to IndexedDB")
    }

    // Clear sessionStorage after successful migration
    sleeperCache.invalidate("allPlayers", "nfl")

    // Update status
    status.success = true
    status.playersCount = playersCount
    status.timeMs = Date.now() - startTime

    console.log(
      `[Migration] ✅ Successfully migrated ${playersCount} players in ${status.timeMs}ms`
    )
    console.log("[Migration] SessionStorage cache cleared")

    return status
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    status.error = errorMessage
    status.timeMs = Date.now() - startTime

    console.error("[Migration] ❌ Migration failed:", errorMessage)
    return status
  }
}

/**
 * Attempt migration with retry logic
 */
export async function migrateWithRetry(maxRetries = 2): Promise<MigrationStatus> {
  let lastStatus: MigrationStatus | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[Migration] Attempt ${attempt}/${maxRetries}`)

    lastStatus = await migrateSessionStorageToIndexedDB()

    if (lastStatus.success) {
      return lastStatus
    }

    // Wait before retry (exponential backoff)
    if (attempt < maxRetries) {
      const delayMs = Math.pow(2, attempt) * 500
      console.log(`[Migration] Retrying in ${delayMs}ms...`)
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  return (
    lastStatus || {
      attempted: true,
      success: false,
      error: "No migration attempts made",
      playersCount: 0,
      timeMs: 0,
    }
  )
}

// ============================================================================
// Auto-Migration
// ============================================================================

/**
 * Automatically migrate on app startup if needed
 */
export async function autoMigrate(): Promise<void> {
  // Skip in server environment
  if (typeof window === "undefined") {
    return
  }

  try {
    // Check if migration is needed
    if (!needsMigration()) {
      return
    }

    // Check if migration already complete
    const complete = await isMigrationComplete()
    if (complete) {
      console.log("[Migration] Migration already complete")
      return
    }

    // Attempt migration with retry
    console.log("[Migration] Auto-migration triggered")
    const status = await migrateWithRetry(2)

    if (status.success) {
      console.log(
        `[Migration] ✅ Auto-migration successful - ${status.playersCount} players migrated`
      )
    } else {
      console.warn(
        `[Migration] ⚠️ Auto-migration failed: ${status.error}. Will continue with sessionStorage.`
      )
    }
  } catch (error) {
    console.error("[Migration] Auto-migration error:", error)
  }
}

// ============================================================================
// Rollback (Emergency)
// ============================================================================

/**
 * Rollback migration by copying IndexedDB data back to sessionStorage
 * Use only in emergency situations
 */
export async function rollbackMigration(): Promise<boolean> {
  try {
    console.log("[Migration] Starting rollback from IndexedDB to sessionStorage...")

    // Get data from IndexedDB
    const indexedData = await indexedDBCache.getAllPlayers()
    if (!indexedData) {
      throw new Error("No IndexedDB data found")
    }

    // Save to sessionStorage
    const success = sleeperCache.set("allPlayers", indexedData, "nfl")
    if (!success) {
      throw new Error("Failed to write to sessionStorage")
    }

    console.log(
      `[Migration] ✅ Rollback successful - ${Object.keys(indexedData).length} players restored to sessionStorage`
    )
    return true
  } catch (error) {
    console.error("[Migration] ❌ Rollback failed:", error)
    return false
  }
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate that IndexedDB and sessionStorage data match
 */
export async function validateMigration(): Promise<{
  valid: boolean
  indexedDBCount: number
  sessionCount: number
  mismatch: string[]
}> {
  const result = {
    valid: false,
    indexedDBCount: 0,
    sessionCount: 0,
    mismatch: [] as string[],
  }

  try {
    // Get data from both sources
    const indexedData = await indexedDBCache.getAllPlayers()
    const sessionData = sleeperCache.get("allPlayers", "nfl")

    if (!indexedData && !sessionData) {
      result.mismatch.push("Both caches are empty")
      return result
    }

    if (indexedData) {
      result.indexedDBCount = Object.keys(indexedData).length
    }

    if (sessionData) {
      result.sessionCount = Object.keys(sessionData).length
    }

    // If both exist, compare counts
    if (indexedData && sessionData) {
      if (result.indexedDBCount !== result.sessionCount) {
        result.mismatch.push(
          `Player count mismatch: IndexedDB=${result.indexedDBCount}, Session=${result.sessionCount}`
        )
      }

      // Sample check: validate 10 random players
      const sampleIds = Object.keys(indexedData).slice(0, 10)
      for (const id of sampleIds) {
        const indexedPlayer = indexedData[id]
        const sessionPlayer = sessionData[id]

        if (!sessionPlayer) {
          result.mismatch.push(`Player ${id} missing from sessionStorage`)
          continue
        }

        if (indexedPlayer.full_name !== sessionPlayer.full_name) {
          result.mismatch.push(
            `Player ${id} data mismatch: ${indexedPlayer.full_name} vs ${sessionPlayer.full_name}`
          )
        }
      }
    }

    result.valid = result.mismatch.length === 0
    return result
  } catch (error) {
    result.mismatch.push(`Validation error: ${error}`)
    return result
  }
}

// ============================================================================
// Export API
// ============================================================================

export const cacheMigration = {
  needsMigration,
  isMigrationComplete,
  migrate: migrateSessionStorageToIndexedDB,
  migrateWithRetry,
  autoMigrate,
  rollback: rollbackMigration,
  validate: validateMigration,
}

export default cacheMigration
