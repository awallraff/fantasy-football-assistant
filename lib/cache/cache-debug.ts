/**
 * Cache Debugging Utilities
 *
 * Development tools for monitoring and debugging Sleeper cache performance.
 * Available in browser console via window.sleeperCacheDebug
 */

import { sleeperCache } from "./sleeper-cache"

export interface CacheDebugInfo {
  enabled: boolean
  totalEntries: number
  totalSizeMB: string
  entries: Array<{
    key: string
    sizeKB: number
    age: string
  }>
}

/**
 * Get comprehensive cache debug information
 */
export function getCacheDebugInfo(): CacheDebugInfo {
  const stats = sleeperCache.stats()

  return {
    enabled: typeof window !== "undefined" && !!window.sessionStorage,
    totalEntries: stats.totalEntries,
    totalSizeMB: (stats.totalSizeKB / 1024).toFixed(2),
    entries: stats.entries,
  }
}

/**
 * Log cache debug info to console with formatting
 */
export function logCacheDebugInfo(): void {
  const info = getCacheDebugInfo()

  console.group("🗄️ Sleeper Cache Debug Info")
  console.log(`Status: ${info.enabled ? "✅ Enabled" : "❌ Disabled"}`)
  console.log(`Total Entries: ${info.totalEntries}`)
  console.log(`Total Size: ${info.totalSizeMB}MB`)

  if (info.entries.length > 0) {
    console.group("Cache Entries:")
    info.entries.forEach((entry) => {
      console.log(`  • ${entry.key}`)
      console.log(`    Size: ${entry.sizeKB}KB | Age: ${entry.age}`)
    })
    console.groupEnd()
  } else {
    console.log("No cache entries found")
  }

  console.groupEnd()
}

/**
 * Test cache performance
 */
export async function testCachePerformance(): Promise<{
  cacheHitTime: number
  cacheMissTime: number
  improvement: string
}> {
  const { sleeperAPI } = await import("@/lib/sleeper-api")

  // Clear cache first
  sleeperCache.clear()

  // Test cache miss (cold start)
  console.log("Testing cache miss (cold start)...")
  const missStart = Date.now()
  const players1 = await sleeperAPI.getAllPlayers("nfl")
  const cacheMissTime = Date.now() - missStart

  // Cache the data
  sleeperCache.set("allPlayers", players1, "nfl")

  // Test cache hit
  console.log("Testing cache hit (warm start)...")
  const hitStart = Date.now()
  sleeperCache.get("allPlayers", "nfl")
  const cacheHitTime = Date.now() - hitStart

  const improvement = ((1 - cacheHitTime / cacheMissTime) * 100).toFixed(1)

  console.group("⚡ Cache Performance Test Results")
  console.log(`Cache Miss (API): ${cacheMissTime}ms`)
  console.log(`Cache Hit (Storage): ${cacheHitTime}ms`)
  console.log(`Improvement: ${improvement}% faster`)
  console.log(`Players loaded: ${Object.keys(players1).length}`)
  console.groupEnd()

  return {
    cacheHitTime,
    cacheMissTime,
    improvement: `${improvement}%`,
  }
}

/**
 * Global debug API (exposed to window)
 */
export const cacheDebugAPI = {
  info: getCacheDebugInfo,
  log: logCacheDebugInfo,
  stats: sleeperCache.logStats,
  clear: sleeperCache.clear,
  test: testCachePerformance,
}

// Expose to window for debugging
if (typeof window !== "undefined") {
  // @ts-expect-error - intentionally adding to window for debugging
  window.sleeperCacheDebug = {
    info: getCacheDebugInfo,
    log: logCacheDebugInfo,
    stats: sleeperCache.logStats,
    clear: () => {
      sleeperCache.clear()
      console.log("✅ Cache cleared. Reload page to fetch fresh data.")
    },
    test: testCachePerformance,
    help: () => {
      console.group("🔧 Sleeper Cache Debug Commands")
      console.log("sleeperCacheDebug.info()  - Get cache info object")
      console.log("sleeperCacheDebug.log()   - Log formatted cache info")
      console.log("sleeperCacheDebug.stats() - Log detailed cache statistics")
      console.log("sleeperCacheDebug.clear() - Clear all cache entries")
      console.log("sleeperCacheDebug.test()  - Run performance test")
      console.log("sleeperCacheDebug.help()  - Show this help menu")
      console.groupEnd()
    },
  }

  // Log availability message once
  console.log(
    "🔧 Cache debugging available: sleeperCacheDebug.help() for commands"
  )
}

export default cacheDebugAPI
