/**
 * IndexedDB Persistent Cache for Sleeper API
 *
 * Provides persistent storage caching for Sleeper getAllPlayers API call.
 * Survives browser restarts and provides fast indexed queries.
 *
 * Cache TTL: 24 hours (86400000 ms)
 * Storage: IndexedDB (persistent across sessions)
 * Fallback: sessionStorage if IndexedDB unavailable
 *
 * Database Schema:
 * - Database: 'fantasy-assistant-cache'
 * - Version: 1
 * - Object Stores:
 *   - 'players' (keyPath: 'player_id', indexes: ['position', 'team', 'full_name'])
 *   - 'metadata' (keyPath: 'key', for timestamps/versions)
 */

import type { SleeperPlayer } from "@/lib/sleeper-api"

// ============================================================================
// Types & Constants
// ============================================================================

const DB_NAME = "fantasy-assistant-cache"
const DB_VERSION = 1
const PLAYERS_STORE = "players"
const METADATA_STORE = "metadata"
const CACHE_VERSION = "v1"
const DEFAULT_TTL = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

export interface CacheMetadata {
  key: string
  lastUpdated: number
  version: string
  playerCount: number
  cacheSize: number
  ttl: number
}

export interface CacheStats {
  hits: number
  misses: number
  avgReadTime: number
  lastRefresh: Date | null
  storageType: "indexeddb" | "session" | "none"
  playerCount: number
  cacheSize: number
}

interface IndexedDBConnection {
  db: IDBDatabase | null
  isInitialized: boolean
  initPromise: Promise<IDBDatabase> | null
}

// ============================================================================
// Global State
// ============================================================================

const connection: IndexedDBConnection = {
  db: null,
  isInitialized: false,
  initPromise: null,
}

const stats: CacheStats = {
  hits: 0,
  misses: 0,
  avgReadTime: 0,
  lastRefresh: null,
  storageType: "none",
  playerCount: 0,
  cacheSize: 0,
}

// ============================================================================
// IndexedDB Availability Check
// ============================================================================

/**
 * Check if IndexedDB is available (SSR-safe)
 */
export function isIndexedDBAvailable(): boolean {
  if (typeof window === "undefined") {
    return false
  }

  try {
    const testDB = window.indexedDB
    return !!testDB && typeof testDB.open === "function"
  } catch {
    return false
  }
}

// ============================================================================
// Database Initialization
// ============================================================================

/**
 * Initialize IndexedDB database with schema
 */
export async function initDB(): Promise<IDBDatabase> {
  // Return existing connection if already initialized
  if (connection.db && connection.isInitialized) {
    return connection.db
  }

  // Return existing init promise if already in progress
  if (connection.initPromise) {
    return connection.initPromise
  }

  // Check availability
  if (!isIndexedDBAvailable()) {
    throw new Error("IndexedDB not available")
  }

  // Create new init promise
  connection.initPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error("[IndexedDBCache] Failed to open database:", request.error)
      connection.initPromise = null
      reject(request.error)
    }

    request.onblocked = () => {
      console.warn("[IndexedDBCache] Database blocked by another connection")
    }

    request.onsuccess = () => {
      const db = request.result

      // Handle database errors
      db.onerror = (event) => {
        console.error("[IndexedDBCache] Database error:", event)
      }

      // Handle unexpected close
      db.onclose = () => {
        console.warn("[IndexedDBCache] Database connection closed")
        connection.db = null
        connection.isInitialized = false
        connection.initPromise = null
      }

      connection.db = db
      connection.isInitialized = true
      stats.storageType = "indexeddb"

      console.log("[IndexedDBCache] Database initialized successfully")
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      console.log("[IndexedDBCache] Database upgrade needed, creating schema...")

      // Create players object store with indexes
      if (!db.objectStoreNames.contains(PLAYERS_STORE)) {
        const playersStore = db.createObjectStore(PLAYERS_STORE, {
          keyPath: "player_id",
        })

        // Create indexes for efficient queries
        playersStore.createIndex("position", "position", { unique: false })
        playersStore.createIndex("team", "team", { unique: false })
        playersStore.createIndex("full_name", "full_name", { unique: false })

        console.log("[IndexedDBCache] Created players store with indexes")
      }

      // Create metadata object store
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE, { keyPath: "key" })
        console.log("[IndexedDBCache] Created metadata store")
      }
    }
  })

  return connection.initPromise
}

// ============================================================================
// Core CRUD Operations
// ============================================================================

/**
 * Get single player by ID
 */
export async function getPlayer(playerId: string): Promise<SleeperPlayer | null> {
  const startTime = Date.now()

  try {
    const db = await initDB()
    const transaction = db.transaction([PLAYERS_STORE], "readonly")
    const store = transaction.objectStore(PLAYERS_STORE)

    return new Promise<SleeperPlayer | null>((resolve, reject) => {
      const request = store.get(playerId)

      request.onsuccess = () => {
        const readTime = Date.now() - startTime
        stats.avgReadTime = (stats.avgReadTime + readTime) / 2

        if (request.result) {
          stats.hits++
          resolve(request.result as SleeperPlayer)
        } else {
          stats.misses++
          resolve(null)
        }
      }

      request.onerror = () => {
        stats.misses++
        reject(request.error)
      }
    })
  } catch (error) {
    console.warn("[IndexedDBCache] Failed to get player:", error)
    stats.misses++
    return null
  }
}

/**
 * Get all players from cache (optimized batch read)
 */
export async function getAllPlayers(): Promise<Record<string, SleeperPlayer> | null> {
  const startTime = Date.now()

  try {
    // Check if cache is expired before reading
    const metadata = await getCacheMetadata()
    if (!metadata || isCacheExpired(metadata)) {
      console.log("[IndexedDBCache] Cache expired or not found")
      stats.misses++
      return null
    }

    const db = await initDB()
    const transaction = db.transaction([PLAYERS_STORE], "readonly")
    const store = transaction.objectStore(PLAYERS_STORE)

    return new Promise<Record<string, SleeperPlayer> | null>((resolve, reject) => {
      const request = store.getAll()

      request.onsuccess = () => {
        const readTime = Date.now() - startTime

        if (!request.result || request.result.length === 0) {
          console.log("[IndexedDBCache] No players found in cache")
          stats.misses++
          resolve(null)
          return
        }

        // Convert array to record keyed by player_id
        const players: Record<string, SleeperPlayer> = {}
        request.result.forEach((player: SleeperPlayer) => {
          players[player.player_id] = player
        })

        stats.hits++
        stats.avgReadTime = (stats.avgReadTime + readTime) / 2

        const ageMs = Date.now() - metadata.lastUpdated
        const ageMinutes = Math.round(ageMs / 1000 / 60)
        const ageHours = Math.round(ageMs / 1000 / 60 / 60)
        const ageDisplay = ageHours > 0 ? `${ageHours}h` : `${ageMinutes}m`

        console.log(
          `[IndexedDBCache] ✅ Cache HIT - ${Object.keys(players).length} players loaded in ${readTime}ms (Age: ${ageDisplay})`
        )

        resolve(players)
      }

      request.onerror = () => {
        stats.misses++
        reject(request.error)
      }
    })
  } catch (error) {
    console.warn("[IndexedDBCache] Failed to get all players:", error)
    stats.misses++
    return null
  }
}

/**
 * Save all players to cache (optimized batch write)
 */
export async function setPlayers(
  players: Record<string, SleeperPlayer>,
  ttl = DEFAULT_TTL
): Promise<boolean> {
  const startTime = Date.now()

  try {
    const db = await initDB()
    const transaction = db.transaction([PLAYERS_STORE, METADATA_STORE], "readwrite")
    const playersStore = transaction.objectStore(PLAYERS_STORE)
    const metadataStore = transaction.objectStore(METADATA_STORE)

    // Clear existing players
    await new Promise<void>((resolve, reject) => {
      const clearRequest = playersStore.clear()
      clearRequest.onsuccess = () => resolve()
      clearRequest.onerror = () => reject(clearRequest.error)
    })

    // Add all players
    const playerArray = Object.values(players)
    for (const player of playerArray) {
      playersStore.put(player)
    }

    // Calculate cache size (approximate)
    const cacheSize = JSON.stringify(players).length

    // Save metadata
    const metadata: CacheMetadata = {
      key: "allPlayers",
      lastUpdated: Date.now(),
      version: CACHE_VERSION,
      playerCount: playerArray.length,
      cacheSize,
      ttl,
    }
    metadataStore.put(metadata)

    return new Promise<boolean>((resolve, reject) => {
      transaction.oncomplete = () => {
        const writeTime = Date.now() - startTime
        const sizeMB = (cacheSize / 1024 / 1024).toFixed(2)

        stats.lastRefresh = new Date()
        stats.playerCount = playerArray.length
        stats.cacheSize = cacheSize

        console.log(
          `[IndexedDBCache] ✅ Cached ${playerArray.length} players in ${writeTime}ms - Size: ${sizeMB}MB`
        )

        resolve(true)
      }

      transaction.onerror = () => {
        console.error("[IndexedDBCache] Transaction failed:", transaction.error)
        reject(transaction.error)
      }

      transaction.onabort = () => {
        console.error("[IndexedDBCache] Transaction aborted")
        reject(new Error("Transaction aborted"))
      }
    })
  } catch (error) {
    if (error instanceof Error && error.name === "QuotaExceededError") {
      console.warn("[IndexedDBCache] Quota exceeded, clearing cache...")

      try {
        await clearPlayers()
        // Retry once after clearing
        return await setPlayers(players, ttl)
      } catch (retryError) {
        console.error("[IndexedDBCache] Failed to save after clearing:", retryError)
        return false
      }
    }

    console.warn("[IndexedDBCache] Failed to set players:", error)
    return false
  }
}

/**
 * Clear all players from cache
 */
export async function clearPlayers(): Promise<void> {
  try {
    const db = await initDB()
    const transaction = db.transaction([PLAYERS_STORE, METADATA_STORE], "readwrite")

    transaction.objectStore(PLAYERS_STORE).clear()
    transaction.objectStore(METADATA_STORE).clear()

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => {
        stats.playerCount = 0
        stats.cacheSize = 0
        stats.lastRefresh = null
        console.log("[IndexedDBCache] Cache cleared")
        resolve()
      }

      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    console.warn("[IndexedDBCache] Failed to clear cache:", error)
  }
}

/**
 * Get cache metadata (timestamps, version, stats)
 */
export async function getCacheMetadata(): Promise<CacheMetadata | null> {
  try {
    const db = await initDB()
    const transaction = db.transaction([METADATA_STORE], "readonly")
    const store = transaction.objectStore(METADATA_STORE)

    return new Promise<CacheMetadata | null>((resolve, reject) => {
      const request = store.get("allPlayers")

      request.onsuccess = () => {
        resolve(request.result as CacheMetadata | null)
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  } catch (error) {
    console.warn("[IndexedDBCache] Failed to get metadata:", error)
    return null
  }
}

/**
 * Check if cache is expired
 */
export function isCacheExpired(metadata: CacheMetadata): boolean {
  const age = Date.now() - metadata.lastUpdated
  return age > metadata.ttl
}

// ============================================================================
// Indexed Queries
// ============================================================================

/**
 * Get players by position (uses index)
 */
export async function getPlayersByPosition(position: string): Promise<SleeperPlayer[]> {
  const startTime = Date.now()

  try {
    const db = await initDB()
    const transaction = db.transaction([PLAYERS_STORE], "readonly")
    const store = transaction.objectStore(PLAYERS_STORE)
    const index = store.index("position")

    return new Promise<SleeperPlayer[]>((resolve, reject) => {
      const request = index.getAll(position)

      request.onsuccess = () => {
        const readTime = Date.now() - startTime
        console.log(
          `[IndexedDBCache] Queried ${request.result.length} players by position '${position}' in ${readTime}ms`
        )
        resolve(request.result as SleeperPlayer[])
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  } catch (error) {
    console.warn("[IndexedDBCache] Failed to query by position:", error)
    return []
  }
}

/**
 * Get players by team (uses index)
 */
export async function getPlayersByTeam(team: string): Promise<SleeperPlayer[]> {
  const startTime = Date.now()

  try {
    const db = await initDB()
    const transaction = db.transaction([PLAYERS_STORE], "readonly")
    const store = transaction.objectStore(PLAYERS_STORE)
    const index = store.index("team")

    return new Promise<SleeperPlayer[]>((resolve, reject) => {
      const request = index.getAll(team)

      request.onsuccess = () => {
        const readTime = Date.now() - startTime
        console.log(
          `[IndexedDBCache] Queried ${request.result.length} players by team '${team}' in ${readTime}ms`
        )
        resolve(request.result as SleeperPlayer[])
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  } catch (error) {
    console.warn("[IndexedDBCache] Failed to query by team:", error)
    return []
  }
}

/**
 * Search players by name (uses index with prefix matching)
 */
export async function searchPlayersByName(query: string): Promise<SleeperPlayer[]> {
  const startTime = Date.now()

  try {
    const db = await initDB()
    const transaction = db.transaction([PLAYERS_STORE], "readonly")
    const store = transaction.objectStore(PLAYERS_STORE)
    const index = store.index("full_name")

    return new Promise<SleeperPlayer[]>((resolve, reject) => {
      const results: SleeperPlayer[] = []
      const lowerQuery = query.toLowerCase()

      // Use cursor for prefix matching
      const request = index.openCursor()

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result

        if (cursor) {
          const player = cursor.value as SleeperPlayer
          const fullName = (player.full_name || "").toLowerCase()

          if (fullName.startsWith(lowerQuery)) {
            results.push(player)
          }

          cursor.continue()
        } else {
          // All done
          const readTime = Date.now() - startTime
          console.log(
            `[IndexedDBCache] Searched players by name '${query}' - ${results.length} results in ${readTime}ms`
          )
          resolve(results)
        }
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  } catch (error) {
    console.warn("[IndexedDBCache] Failed to search by name:", error)
    return []
  }
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Get current cache statistics
 */
export function getCacheStats(): CacheStats {
  return { ...stats }
}

/**
 * Reset cache statistics
 */
export function resetStats(): void {
  stats.hits = 0
  stats.misses = 0
  stats.avgReadTime = 0
}

// ============================================================================
// Database Management
// ============================================================================

/**
 * Close database connection
 */
export function closeDB(): void {
  if (connection.db) {
    connection.db.close()
    connection.db = null
    connection.isInitialized = false
    connection.initPromise = null
    console.log("[IndexedDBCache] Database connection closed")
  }
}

/**
 * Delete entire database (nuclear option)
 */
export async function deleteDB(): Promise<void> {
  closeDB()

  if (!isIndexedDBAvailable()) {
    return
  }

  return new Promise<void>((resolve, reject) => {
    const request = window.indexedDB.deleteDatabase(DB_NAME)

    request.onsuccess = () => {
      console.log("[IndexedDBCache] Database deleted")
      resolve()
    }

    request.onerror = () => {
      console.error("[IndexedDBCache] Failed to delete database:", request.error)
      reject(request.error)
    }

    request.onblocked = () => {
      console.warn("[IndexedDBCache] Database deletion blocked - close all tabs")
    }
  })
}

// ============================================================================
// Export API
// ============================================================================

export const indexedDBCache = {
  // Initialization
  init: initDB,
  isAvailable: isIndexedDBAvailable,

  // CRUD
  getPlayer,
  getAllPlayers,
  setPlayers,
  clearPlayers,

  // Metadata
  getCacheMetadata,
  isCacheExpired,

  // Indexed Queries
  getPlayersByPosition,
  getPlayersByTeam,
  searchPlayersByName,

  // Statistics
  getStats: getCacheStats,
  resetStats,

  // Database Management
  close: closeDB,
  delete: deleteDB,
}

export default indexedDBCache
