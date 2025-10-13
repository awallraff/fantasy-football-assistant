/**
 * IndexedDB Cache Debugging Utilities
 *
 * Development tools for monitoring and debugging IndexedDB cache performance.
 * Available in browser console via window.indexedDBDebug
 */

import { indexedDBCache } from "./indexeddb-cache"
import { cacheMigration } from "./cache-migration"
import type { CacheStats, CacheMetadata } from "./indexeddb-cache"
import type { MigrationStatus } from "./cache-migration"

// ============================================================================
// Debug Info
// ============================================================================

export interface IndexedDBDebugInfo {
  available: boolean
  initialized: boolean
  metadata: CacheMetadata | null
  stats: CacheStats
  storageEstimate: {
    quota: number
    usage: number
    percentUsed: string
    available: string
  } | null
}

/**
 * Get comprehensive cache debug information
 */
export async function getDebugInfo(): Promise<IndexedDBDebugInfo> {
  const info: IndexedDBDebugInfo = {
    available: indexedDBCache.isAvailable(),
    initialized: false,
    metadata: null,
    stats: indexedDBCache.getStats(),
    storageEstimate: null,
  }

  if (!info.available) {
    return info
  }

  try {
    // Try to get metadata (will initialize DB if not already)
    info.metadata = await indexedDBCache.getCacheMetadata()
    info.initialized = info.metadata !== null

    // Get storage estimate
    if ("storage" in navigator && "estimate" in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      if (estimate.quota && estimate.usage) {
        const percentUsed = ((estimate.usage / estimate.quota) * 100).toFixed(2)
        const availableBytes = estimate.quota - estimate.usage
        const availableMB = (availableBytes / 1024 / 1024).toFixed(2)

        info.storageEstimate = {
          quota: estimate.quota,
          usage: estimate.usage,
          percentUsed: `${percentUsed}%`,
          available: `${availableMB}MB`,
        }
      }
    }
  } catch (error) {
    console.error("[IndexedDBDebug] Error getting debug info:", error)
  }

  return info
}

/**
 * Log formatted debug info to console
 */
export async function logDebugInfo(): Promise<void> {
  const info = await getDebugInfo()

  console.group("🗄️ IndexedDB Cache Debug Info")

  // Availability
  console.log(
    `Status: ${info.available ? "✅ Available" : "❌ Not Available"}`
  )
  console.log(
    `Initialized: ${info.initialized ? "✅ Yes" : "❌ No"}`
  )

  // Metadata
  if (info.metadata) {
    console.group("📋 Cache Metadata:")
    console.log(`Version: ${info.metadata.version}`)
    console.log(`Player Count: ${info.metadata.playerCount.toLocaleString()}`)
    console.log(`Cache Size: ${(info.metadata.cacheSize / 1024 / 1024).toFixed(2)}MB`)
    console.log(`TTL: ${info.metadata.ttl / 1000 / 60 / 60}h`)

    const age = Date.now() - info.metadata.lastUpdated
    const ageMinutes = Math.round(age / 1000 / 60)
    const ageHours = Math.round(age / 1000 / 60 / 60)
    const ageDisplay = ageHours > 0 ? `${ageHours}h` : `${ageMinutes}m`
    console.log(`Age: ${ageDisplay}`)
    console.log(
      `Expires: ${new Date(info.metadata.lastUpdated + info.metadata.ttl).toLocaleString()}`
    )

    const isExpired = indexedDBCache.isCacheExpired(info.metadata)
    console.log(`Expired: ${isExpired ? "❌ Yes" : "✅ No"}`)
    console.groupEnd()
  } else {
    console.log("📋 Cache Metadata: None (cache empty)")
  }

  // Statistics
  console.group("📊 Performance Stats:")
  console.log(`Storage Type: ${info.stats.storageType}`)
  console.log(`Cache Hits: ${info.stats.hits}`)
  console.log(`Cache Misses: ${info.stats.misses}`)
  const hitRate =
    info.stats.hits + info.stats.misses > 0
      ? ((info.stats.hits / (info.stats.hits + info.stats.misses)) * 100).toFixed(1)
      : "0"
  console.log(`Hit Rate: ${hitRate}%`)
  console.log(`Avg Read Time: ${info.stats.avgReadTime.toFixed(2)}ms`)
  if (info.stats.lastRefresh) {
    console.log(`Last Refresh: ${info.stats.lastRefresh.toLocaleString()}`)
  }
  console.groupEnd()

  // Storage estimate
  if (info.storageEstimate) {
    console.group("💾 Storage Estimate:")
    console.log(`Quota: ${(info.storageEstimate.quota / 1024 / 1024 / 1024).toFixed(2)}GB`)
    console.log(`Usage: ${(info.storageEstimate.usage / 1024 / 1024).toFixed(2)}MB`)
    console.log(`Percent Used: ${info.storageEstimate.percentUsed}`)
    console.log(`Available: ${info.storageEstimate.available}`)
    console.groupEnd()
  }

  console.groupEnd()
}

// ============================================================================
// Performance Testing
// ============================================================================

export interface PerformanceTestResult {
  coldStartTime: number
  warmStartTime: number
  improvement: string
  playerCount: number
  cacheSize: string
  indexedQueryTime: number
}

/**
 * Run comprehensive performance tests
 */
export async function testPerformance(): Promise<PerformanceTestResult> {
  console.group("⚡ IndexedDB Cache Performance Test")

  try {
    const { default: sleeperAPI } = await import("@/lib/sleeper-api")

    // Clear cache first
    console.log("🧹 Clearing cache...")
    await indexedDBCache.clearPlayers()

    // Test 1: Cold start (API fetch + cache write)
    console.log("❄️ Testing cold start (API fetch + cache write)...")
    const coldStart = Date.now()
    const players = await sleeperAPI.getAllPlayers("nfl")
    await indexedDBCache.setPlayers(players)
    const coldStartTime = Date.now() - coldStart

    const playerCount = Object.keys(players).length
    const cacheSize = (JSON.stringify(players).length / 1024 / 1024).toFixed(2)

    // Test 2: Warm start (cache read)
    console.log("🔥 Testing warm start (cache read)...")
    const warmStart = Date.now()
    await indexedDBCache.getAllPlayers()
    const warmStartTime = Date.now() - warmStart

    // Test 3: Indexed query performance
    console.log("🔍 Testing indexed query (position: QB)...")
    const indexedStart = Date.now()
    await indexedDBCache.getPlayersByPosition("QB")
    const indexedQueryTime = Date.now() - indexedStart

    // Calculate improvement
    const improvement = ((1 - warmStartTime / coldStartTime) * 100).toFixed(1)

    const result: PerformanceTestResult = {
      coldStartTime,
      warmStartTime,
      improvement: `${improvement}%`,
      playerCount,
      cacheSize: `${cacheSize}MB`,
      indexedQueryTime,
    }

    console.log("\n📊 Results:")
    console.log(`Cold Start (API + Write): ${coldStartTime}ms`)
    console.log(`Warm Start (Read): ${warmStartTime}ms`)
    console.log(`Indexed Query: ${indexedQueryTime}ms`)
    console.log(`Improvement: ${improvement}% faster`)
    console.log(`Players: ${playerCount.toLocaleString()}`)
    console.log(`Cache Size: ${cacheSize}MB`)

    console.groupEnd()
    return result
  } catch (error) {
    console.error("❌ Performance test failed:", error)
    console.groupEnd()
    throw error
  }
}

// ============================================================================
// Cache Inspection
// ============================================================================

/**
 * Inspect a specific player in the cache
 */
export async function inspectPlayer(playerId: string): Promise<void> {
  console.group(`🔍 Inspecting Player: ${playerId}`)

  try {
    const player = await indexedDBCache.getPlayer(playerId)

    if (!player) {
      console.log("❌ Player not found in cache")
      console.groupEnd()
      return
    }

    console.log("✅ Player found:")
    console.table({
      ID: player.player_id,
      Name: player.full_name || "N/A",
      Position: player.position || "N/A",
      Team: player.team || "N/A",
      Age: player.age || "N/A",
      "Years Exp": player.years_exp || "N/A",
    })

    console.log("Full Player Object:")
    console.log(player)
  } catch (error) {
    console.error("❌ Error inspecting player:", error)
  }

  console.groupEnd()
}

/**
 * List top N players by position
 */
export async function listPlayersByPosition(
  position: string,
  limit = 10
): Promise<void> {
  console.group(`📋 Top ${limit} Players - Position: ${position}`)

  try {
    const players = await indexedDBCache.getPlayersByPosition(position)

    if (players.length === 0) {
      console.log(`❌ No players found for position: ${position}`)
      console.groupEnd()
      return
    }

    console.log(`✅ Found ${players.length} players`)

    const topPlayers = players.slice(0, limit).map((p) => ({
      ID: p.player_id,
      Name: p.full_name || "N/A",
      Team: p.team || "N/A",
      Age: p.age || "N/A",
    }))

    console.table(topPlayers)
  } catch (error) {
    console.error("❌ Error listing players:", error)
  }

  console.groupEnd()
}

// ============================================================================
// Migration Testing
// ============================================================================

/**
 * Test migration process
 */
export async function testMigration(): Promise<MigrationStatus> {
  console.group("🔄 Testing Migration")

  try {
    console.log("Checking migration status...")
    const needsMigration = cacheMigration.needsMigration()
    console.log(`Needs Migration: ${needsMigration ? "Yes" : "No"}`)

    if (!needsMigration) {
      console.log("ℹ️ No migration needed")
      console.groupEnd()
      return {
        attempted: false,
        success: false,
        error: "No migration needed",
        playersCount: 0,
        timeMs: 0,
      }
    }

    console.log("Starting migration...")
    const status = await cacheMigration.migrateWithRetry(2)

    if (status.success) {
      console.log(`✅ Migration successful: ${status.playersCount} players in ${status.timeMs}ms`)
    } else {
      console.error(`❌ Migration failed: ${status.error}`)
    }

    console.groupEnd()
    return status
  } catch (error) {
    console.error("❌ Migration test error:", error)
    console.groupEnd()
    throw error
  }
}

/**
 * Validate migration integrity
 */
export async function validateMigration(): Promise<void> {
  console.group("✅ Validating Migration")

  try {
    const validation = await cacheMigration.validate()

    console.log(`Valid: ${validation.valid ? "✅ Yes" : "❌ No"}`)
    console.log(`IndexedDB Count: ${validation.indexedDBCount}`)
    console.log(`Session Count: ${validation.sessionCount}`)

    if (validation.mismatch.length > 0) {
      console.warn("⚠️ Mismatches found:")
      validation.mismatch.forEach((m) => console.log(`  • ${m}`))
    } else {
      console.log("✅ No mismatches found")
    }
  } catch (error) {
    console.error("❌ Validation error:", error)
  }

  console.groupEnd()
}

// ============================================================================
// Cache Management
// ============================================================================

/**
 * Clear cache with confirmation
 */
export async function clearCache(): Promise<void> {
  console.log("🧹 Clearing IndexedDB cache...")

  try {
    await indexedDBCache.clearPlayers()
    indexedDBCache.resetStats()
    console.log("✅ Cache cleared successfully")
    console.log("ℹ️ Reload page to fetch fresh data")
  } catch (error) {
    console.error("❌ Failed to clear cache:", error)
  }
}

/**
 * Delete entire database
 */
export async function deleteDatabase(): Promise<void> {
  console.warn("⚠️ This will delete the entire IndexedDB database!")

  try {
    await indexedDBCache.delete()
    console.log("✅ Database deleted successfully")
    console.log("ℹ️ Reload page to recreate database")
  } catch (error) {
    console.error("❌ Failed to delete database:", error)
  }
}

// ============================================================================
// Global Debug API
// ============================================================================

export const indexedDBDebugAPI = {
  // Info & Stats
  stats: getDebugInfo,
  log: logDebugInfo,

  // Testing
  test: testPerformance,

  // Inspection
  inspect: inspectPlayer,
  listByPosition: listPlayersByPosition,

  // Migration
  migrate: testMigration,
  validateMigration,

  // Management
  clear: clearCache,
  deleteDB: deleteDatabase,

  // Help
  help: () => {
    console.group("🔧 IndexedDB Cache Debug Commands")
    console.log("indexedDBDebug.stats()                    - Get cache statistics object")
    console.log("indexedDBDebug.log()                      - Log formatted cache info")
    console.log("indexedDBDebug.test()                     - Run performance test")
    console.log("indexedDBDebug.inspect('playerId')        - Inspect specific player")
    console.log("indexedDBDebug.listByPosition('QB', 10)   - List top N players by position")
    console.log("indexedDBDebug.migrate()                  - Test migration from sessionStorage")
    console.log("indexedDBDebug.validateMigration()        - Validate migration integrity")
    console.log("indexedDBDebug.clear()                    - Clear cache")
    console.log("indexedDBDebug.deleteDB()                 - Delete entire database")
    console.log("indexedDBDebug.help()                     - Show this help menu")
    console.groupEnd()
  },
}

// ============================================================================
// Expose to Window
// ============================================================================

if (typeof window !== "undefined") {
  // @ts-expect-error - intentionally adding to window for debugging
  window.indexedDBDebug = indexedDBDebugAPI

  console.log("🔧 IndexedDB cache debugging available: indexedDBDebug.help() for commands")
}

export default indexedDBDebugAPI
