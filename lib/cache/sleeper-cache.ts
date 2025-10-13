/**
 * Session Storage Cache for Sleeper API
 *
 * Provides session storage caching for Sleeper getAllPlayers API call.
 * Reduces load times from 2-5 seconds to near-instant on subsequent page loads.
 *
 * Cache TTL: 24 hours (86400000 ms)
 * Storage: sessionStorage (persists until browser tab closed)
 */

import type { SleeperPlayer } from "@/lib/sleeper-api"

// ============================================================================
// Types & Constants
// ============================================================================

const CACHE_VERSION = "v1"
const CACHE_KEY_PREFIX = "sleeper_cache"
const DEFAULT_TTL = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  version: string
}

interface SleeperCacheStructure {
  allPlayers: CacheEntry<Record<string, SleeperPlayer>>
}

type CacheKey = keyof SleeperCacheStructure

// ============================================================================
// Cache Key Generation
// ============================================================================

function getCacheKey(key: CacheKey, sport = "nfl"): string {
  return `${CACHE_KEY_PREFIX}_${key}_${sport}_${CACHE_VERSION}`
}

// ============================================================================
// Session Storage Helpers
// ============================================================================

/**
 * Check if sessionStorage is available (SSR-safe)
 */
function isSessionStorageAvailable(): boolean {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return false
  }

  try {
    const test = "__storage_test__"
    window.sessionStorage.setItem(test, test)
    window.sessionStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

/**
 * Get item from session storage with error handling
 */
function getStorageItem(key: string): string | null {
  if (!isSessionStorageAvailable()) {
    return null
  }

  try {
    return window.sessionStorage.getItem(key)
  } catch (error) {
    console.warn("[SleeperCache] Failed to read from sessionStorage:", error)
    return null
  }
}

/**
 * Set item in session storage with quota exceeded handling
 */
function setStorageItem(key: string, value: string): boolean {
  if (!isSessionStorageAvailable()) {
    return false
  }

  try {
    window.sessionStorage.setItem(key, value)
    return true
  } catch (error) {
    if (error instanceof Error && error.name === "QuotaExceededError") {
      console.warn("[SleeperCache] Session storage quota exceeded. Clearing cache...")
      clearAllCache()

      try {
        window.sessionStorage.setItem(key, value)
        return true
      } catch {
        console.error("[SleeperCache] Failed to save after clearing cache")
        return false
      }
    }

    console.warn("[SleeperCache] Failed to write to sessionStorage:", error)
    return false
  }
}

/**
 * Remove item from session storage
 */
function removeStorageItem(key: string): void {
  if (!isSessionStorageAvailable()) {
    return
  }

  try {
    window.sessionStorage.removeItem(key)
  } catch (error) {
    console.warn("[SleeperCache] Failed to remove from sessionStorage:", error)
  }
}

// ============================================================================
// Cache Operations
// ============================================================================

/**
 * Get cached data if valid (within TTL)
 */
export function getCachedData<K extends CacheKey>(
  key: K,
  sport = "nfl"
): SleeperCacheStructure[K]["data"] | null {
  const cacheKey = getCacheKey(key, sport)
  const cached = getStorageItem(cacheKey)

  if (!cached) {
    console.log(`[SleeperCache] Cache miss for ${key} (${sport})`)
    return null
  }

  try {
    const entry = JSON.parse(cached) as CacheEntry<SleeperCacheStructure[K]["data"]>

    // Validate cache structure
    if (!entry.data || !entry.timestamp || !entry.ttl || !entry.version) {
      console.warn(`[SleeperCache] Invalid cache structure for ${key}. Clearing...`)
      removeStorageItem(cacheKey)
      return null
    }

    // Check version compatibility
    if (entry.version !== CACHE_VERSION) {
      console.log(`[SleeperCache] Cache version mismatch for ${key}. Clearing...`)
      removeStorageItem(cacheKey)
      return null
    }

    // Check if cache is expired
    const age = Date.now() - entry.timestamp
    if (age > entry.ttl) {
      console.log(`[SleeperCache] Cache expired for ${key} (age: ${Math.round(age / 1000 / 60)} min)`)
      removeStorageItem(cacheKey)
      return null
    }

    const ageMinutes = Math.round(age / 1000 / 60)
    const ageHours = Math.round(age / 1000 / 60 / 60)
    const ageDisplay = ageHours > 0 ? `${ageHours}h` : `${ageMinutes}m`

    console.log(`[SleeperCache] ✅ Cache HIT for ${key} (${sport}) - Age: ${ageDisplay}`)

    return entry.data
  } catch (error) {
    console.warn(`[SleeperCache] Failed to parse cached data for ${key}:`, error)
    removeStorageItem(cacheKey)
    return null
  }
}

/**
 * Set cached data with TTL
 */
export function setCachedData<K extends CacheKey>(
  key: K,
  data: SleeperCacheStructure[K]["data"],
  sport = "nfl",
  ttl = DEFAULT_TTL
): boolean {
  const cacheKey = getCacheKey(key, sport)

  const entry: CacheEntry<SleeperCacheStructure[K]["data"]> = {
    data,
    timestamp: Date.now(),
    ttl,
    version: CACHE_VERSION,
  }

  try {
    const serialized = JSON.stringify(entry)
    const success = setStorageItem(cacheKey, serialized)

    if (success) {
      const sizeKB = Math.round(serialized.length / 1024)
      const sizeMB = (sizeKB / 1024).toFixed(2)
      console.log(`[SleeperCache] ✅ Cached ${key} (${sport}) - Size: ${sizeMB}MB (${sizeKB}KB)`)
    }

    return success
  } catch (error) {
    console.warn(`[SleeperCache] Failed to serialize data for ${key}:`, error)
    return false
  }
}

/**
 * Invalidate (remove) cached data
 */
export function invalidateCache(key: CacheKey, sport = "nfl"): void {
  const cacheKey = getCacheKey(key, sport)
  removeStorageItem(cacheKey)
  console.log(`[SleeperCache] Invalidated cache for ${key} (${sport})`)
}

/**
 * Clear all Sleeper cache entries
 */
export function clearAllCache(): void {
  if (!isSessionStorageAvailable()) {
    return
  }

  try {
    const keys = Object.keys(window.sessionStorage)
    const sleeperKeys = keys.filter((key) => key.startsWith(CACHE_KEY_PREFIX))

    sleeperKeys.forEach((key) => {
      window.sessionStorage.removeItem(key)
    })

    console.log(`[SleeperCache] Cleared ${sleeperKeys.length} cache entries`)
  } catch (error) {
    console.warn("[SleeperCache] Failed to clear all cache:", error)
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  totalEntries: number
  totalSizeKB: number
  entries: Array<{ key: string; sizeKB: number; age: string }>
} {
  if (!isSessionStorageAvailable()) {
    return { totalEntries: 0, totalSizeKB: 0, entries: [] }
  }

  try {
    const keys = Object.keys(window.sessionStorage)
    const sleeperKeys = keys.filter((key) => key.startsWith(CACHE_KEY_PREFIX))

    let totalSizeKB = 0
    const entries = sleeperKeys.map((key) => {
      const value = window.sessionStorage.getItem(key) || ""
      const sizeKB = Math.round(value.length / 1024)
      totalSizeKB += sizeKB

      let age = "unknown"
      try {
        const entry = JSON.parse(value) as CacheEntry<unknown>
        const ageMs = Date.now() - entry.timestamp
        const ageMinutes = Math.round(ageMs / 1000 / 60)
        const ageHours = Math.round(ageMs / 1000 / 60 / 60)
        age = ageHours > 0 ? `${ageHours}h` : `${ageMinutes}m`
      } catch {
        // Ignore parse errors
      }

      return { key, sizeKB, age }
    })

    return {
      totalEntries: sleeperKeys.length,
      totalSizeKB,
      entries,
    }
  } catch (error) {
    console.warn("[SleeperCache] Failed to get cache stats:", error)
    return { totalEntries: 0, totalSizeKB: 0, entries: [] }
  }
}

// ============================================================================
// Debug Utilities
// ============================================================================

/**
 * Log cache statistics to console
 */
export function logCacheStats(): void {
  const stats = getCacheStats()

  console.group("[SleeperCache] Cache Statistics")
  console.log(`Total Entries: ${stats.totalEntries}`)
  console.log(`Total Size: ${(stats.totalSizeKB / 1024).toFixed(2)}MB (${stats.totalSizeKB}KB)`)

  if (stats.entries.length > 0) {
    console.table(stats.entries)
  }

  console.groupEnd()
}

/**
 * Manual cache clear function for debugging (exposed globally)
 */
if (typeof window !== "undefined") {
  // @ts-expect-error - intentionally adding to window for debugging
  window.clearSleeperCache = () => {
    clearAllCache()
    console.log("[SleeperCache] Manual cache clear complete. Reload page to fetch fresh data.")
  }

  // @ts-expect-error - intentionally adding to window for debugging
  window.sleeperCacheStats = logCacheStats
}

// ============================================================================
// Export API
// ============================================================================

export const sleeperCache = {
  get: getCachedData,
  set: setCachedData,
  invalidate: invalidateCache,
  clear: clearAllCache,
  stats: getCacheStats,
  logStats: logCacheStats,
}

export default sleeperCache
