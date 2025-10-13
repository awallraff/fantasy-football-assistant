# Sleeper API Cache Implementation

## Overview

Multi-tier caching system for Sleeper API `getAllPlayers` endpoint. Reduces load times from 2-5 seconds to near-instant on subsequent page loads using IndexedDB (Phase 2) with sessionStorage fallback (Phase 1).

## Performance Improvement

| Scenario | Phase 1 (sessionStorage) | Phase 2 (IndexedDB) | Improvement |
|----------|----------|----------|-------------|
| **First Load (Cache Miss)** | 2000-5000ms | 2000-5000ms | Baseline |
| **Subsequent Loads (Cache Hit)** | <50ms | <15ms | 70% faster than Phase 1 |
| **Indexed Queries (by position)** | N/A | <5ms | New capability |
| **Data Size** | ~2.3MB (~11,400 players) | ~2.3MB (~11,400 players) | Same |
| **Persistence** | Session-only | Across browser restarts | Persistent |
| **Storage Type** | sessionStorage | IndexedDB | Upgraded |

## Architecture

### Files

**Phase 1 (sessionStorage):**
- **`sleeper-cache.ts`** - Session storage cache (fallback tier)
- **`cache-debug.ts`** - Debugging utilities for sessionStorage

**Phase 2 (IndexedDB):**
- **`indexeddb-cache.ts`** - IndexedDB persistent cache (primary tier)
- **`indexeddb-debug.ts`** - Debugging utilities for IndexedDB
- **`cache-migration.ts`** - Migration logic from sessionStorage to IndexedDB

**Shared:**
- **`README.md`** - This file

### Multi-Tier Cache Strategy

The cache uses a priority-based fallback chain:

1. **IndexedDB (Primary)** - Persistent across browser restarts
   - Fast indexed queries (position, team, name)
   - ~15ms read time for 11,400 players
   - Survives browser close/reopen

2. **sessionStorage (Fallback)** - Session-only cache
   - Used if IndexedDB unavailable
   - ~50ms read time
   - Clears when tab closes

3. **API Fetch (Last Resort)** - Direct Sleeper API call
   - 2000-5000ms load time
   - Always works as ultimate fallback

### IndexedDB Schema

```typescript
// Database: 'fantasy-assistant-cache'
// Version: 1

// Object Store: 'players'
// KeyPath: 'player_id'
// Indexes:
//   - position (for filtering by position)
//   - team (for filtering by team)
//   - full_name (for name search)

// Object Store: 'metadata'
// KeyPath: 'key'
// Stores: lastUpdated, version, playerCount, cacheSize, ttl

interface CacheMetadata {
  key: string                // "allPlayers"
  lastUpdated: number        // When cached (Date.now())
  version: string            // Cache version ("v1")
  playerCount: number        // Number of players cached
  cacheSize: number          // Size in bytes
  ttl: number                // Time-to-live (24 hours)
}
```

### sessionStorage Structure (Phase 1 Fallback)

```typescript
interface CacheEntry<T> {
  data: T                    // Cached data (all players dictionary)
  timestamp: number          // When cached (Date.now())
  ttl: number                // Time-to-live in milliseconds (24 hours)
  version: string            // Cache version for invalidation
}
```

### Storage Configuration

- **TTL:** 24 hours (86400000 ms) for both tiers
- **SSR-Safe:** Checks for window/IndexedDB before accessing storage
- **Quota Handling:** Automatic cleanup and retry on quota exceeded
- **Migration:** Auto-migrates from sessionStorage to IndexedDB on first load

## Usage

### Basic Usage (Automatic - Phase 2)

The cache is automatically used in `PlayerDataContext` with IndexedDB priority:

```typescript
// Automatic in PlayerDataProvider (Phase 2 with fallback)

// Auto-migrate from sessionStorage to IndexedDB
await cacheMigration.autoMigrate()

// Try IndexedDB first
if (indexedDBCache.isAvailable()) {
  const indexedPlayers = await indexedDBCache.getAllPlayers()
  if (indexedPlayers) {
    setPlayers(indexedPlayers) // ✅ ~15ms load time
    return
  }
}

// Fallback to sessionStorage
const sessionPlayers = sleeperCache.get("allPlayers", "nfl")
if (sessionPlayers) {
  setPlayers(sessionPlayers) // ✅ ~50ms load time
  return
}

// Last resort: API fetch
const playerData = await sleeperAPI.getAllPlayers("nfl")
await indexedDBCache.setPlayers(playerData) // Cache to IndexedDB
setPlayers(playerData) // ❌ 2000-5000ms load time
```

### Manual Cache Operations

**IndexedDB (Phase 2):**

```typescript
import { indexedDBCache } from "@/lib/cache/indexeddb-cache"

// Get all players
const players = await indexedDBCache.getAllPlayers()

// Get single player
const player = await indexedDBCache.getPlayer("4046")

// Save players (with custom TTL)
await indexedDBCache.setPlayers(data, 12 * 60 * 60 * 1000) // 12 hours

// Clear cache
await indexedDBCache.clearPlayers()

// Get cache metadata
const metadata = await indexedDBCache.getCacheMetadata()
console.log(`Last updated: ${new Date(metadata.lastUpdated)}`)
console.log(`Player count: ${metadata.playerCount}`)

// Indexed queries (NEW in Phase 2)
const qbs = await indexedDBCache.getPlayersByPosition("QB")
const bufPlayers = await indexedDBCache.getPlayersByTeam("BUF")
const search = await indexedDBCache.searchPlayersByName("Josh")

// Statistics
const stats = indexedDBCache.getStats()
console.log(`Hits: ${stats.hits}, Misses: ${stats.misses}`)
console.log(`Avg read time: ${stats.avgReadTime}ms`)
```

**sessionStorage (Phase 1 Fallback):**

```typescript
import { sleeperCache } from "@/lib/cache/sleeper-cache"

// Get cached data
const players = sleeperCache.get("allPlayers", "nfl")

// Set cached data (with custom TTL)
sleeperCache.set("allPlayers", data, "nfl", 12 * 60 * 60 * 1000) // 12 hours

// Invalidate cache
sleeperCache.invalidate("allPlayers", "nfl")

// Clear all cache
sleeperCache.clear()

// Get cache statistics
const stats = sleeperCache.stats()
console.log(`Total entries: ${stats.totalEntries}`)
console.log(`Total size: ${stats.totalSizeKB}KB`)
```

## Debugging

### Browser Console Commands

**IndexedDB Debug Commands (Phase 2):**

```javascript
// Show help menu
indexedDBDebug.help()

// Get detailed cache stats
await indexedDBDebug.stats()

// Log formatted cache info
await indexedDBDebug.log()

// Run performance test (cold vs warm start)
await indexedDBDebug.test()

// Inspect specific player
await indexedDBDebug.inspect("4046") // Josh Allen

// List top players by position
await indexedDBDebug.listByPosition("QB", 10)

// Test migration from sessionStorage
await indexedDBDebug.migrate()

// Validate migration integrity
await indexedDBDebug.validateMigration()

// Clear cache
await indexedDBDebug.clear()

// Delete entire database (nuclear option)
await indexedDBDebug.deleteDB()
```

**sessionStorage Debug Commands (Phase 1):**

```javascript
// Show help menu
sleeperCacheDebug.help()

// Get cache info
sleeperCacheDebug.info()

// Log formatted cache statistics
sleeperCacheDebug.log()

// Log detailed cache statistics
sleeperCacheDebug.stats()

// Clear all cache entries
sleeperCacheDebug.clear()

// Run performance test
sleeperCacheDebug.test()

// Legacy commands (also available)
clearSleeperCache()
sleeperCacheStats()
```

### Performance Testing

**IndexedDB Performance Test:**

```javascript
// In browser console
await indexedDBDebug.test()

// Output:
// ⚡ IndexedDB Cache Performance Test
//   Cold Start (API + Write): 2341ms
//   Warm Start (Read): 12ms
//   Indexed Query (QB): 3ms
//   Improvement: 99.5% faster
//   Players: 11,437
//   Cache Size: 2.18MB
```

**sessionStorage Performance Test:**

```javascript
// In browser console
await sleeperCacheDebug.test()

// Output:
// ⚡ Cache Performance Test Results
//   Cache Miss (API): 2341ms
//   Cache Hit (Storage): 23ms
//   Improvement: 99.0% faster
//   Players loaded: 11437
```

### Cache Monitoring

Monitor cache usage during development:

```javascript
// Check if cache is working
sleeperCacheDebug.log()

// Output:
// 🗄️ Sleeper Cache Debug Info
//   Status: ✅ Enabled
//   Total Entries: 1
//   Total Size: 2.18MB
//   Cache Entries:
//     • sleeper_cache_allPlayers_nfl_v1
//       Size: 2234KB | Age: 5m
```

## Console Logging

The cache provides informative console logs:

### Cache Hit
```
[PlayerData] ✅ Loaded 11437 players from cache
[SleeperCache] ✅ Cache HIT for allPlayers (nfl) - Age: 5m
```

### Cache Miss
```
[PlayerData] Cache miss - fetching from Sleeper API...
[SleeperCache] Cache miss for allPlayers (nfl)
[PlayerData] ✅ Loaded 11437 players from API (2341ms)
[SleeperCache] ✅ Cached allPlayers (nfl) - Size: 2.18MB (2234KB)
[PlayerData] ✅ Players cached successfully for 24 hours
```

### Cache Expired
```
[SleeperCache] Cache expired for allPlayers (age: 1441 min)
```

## Error Handling

### Quota Exceeded

If sessionStorage quota is exceeded:

1. Cache automatically clears all entries
2. Attempts to save again
3. Logs warning if second attempt fails
4. App continues to work without caching

```typescript
// Automatic handling - no action needed
[SleeperCache] Session storage quota exceeded. Clearing cache...
```

### SSR Compatibility

Cache checks for `window` object before any operations:

```typescript
function isSessionStorageAvailable(): boolean {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return false
  }
  // ... storage test
}
```

## Cache Invalidation

### Automatic Expiration

Cache automatically expires after 24 hours:

```typescript
const age = Date.now() - entry.timestamp
if (age > entry.ttl) {
  // Cache expired - will fetch fresh data
}
```

### Manual Invalidation

```typescript
// Clear specific cache entry
sleeperCache.invalidate("allPlayers", "nfl")

// Clear all cache entries
sleeperCache.clear()
```

### Version Invalidation

Bumping `CACHE_VERSION` in `sleeper-cache.ts` invalidates all existing cache:

```typescript
const CACHE_VERSION = "v2" // Invalidates all v1 cache entries
```

## Testing

### Unit Testing

```typescript
import { sleeperCache } from "@/lib/cache/sleeper-cache"

describe("Sleeper Cache", () => {
  beforeEach(() => {
    sleeperCache.clear()
  })

  it("should cache and retrieve data", () => {
    const data = { "4046": { player_id: "4046", ... } }

    sleeperCache.set("allPlayers", data, "nfl")
    const cached = sleeperCache.get("allPlayers", "nfl")

    expect(cached).toEqual(data)
  })

  it("should return null for expired cache", () => {
    const data = { "4046": { player_id: "4046", ... } }

    // Set with 0ms TTL (immediately expired)
    sleeperCache.set("allPlayers", data, "nfl", 0)

    const cached = sleeperCache.get("allPlayers", "nfl")
    expect(cached).toBeNull()
  })
})
```

### Integration Testing

Test with actual API calls in dev environment:

1. **First Load (Cold Start)**
   - Open dev tools console
   - Clear cache: `sleeperCacheDebug.clear()`
   - Refresh page
   - Observe "Cache miss" logs and load time

2. **Second Load (Warm Start)**
   - Refresh page again (without clearing cache)
   - Observe "Cache HIT" logs and instant load

3. **Performance Test**
   - Run: `await sleeperCacheDebug.test()`
   - Compare cache miss vs cache hit times

## Migration Notes

### Before (No Cache)

```typescript
// Every page load fetched from API (2-5 seconds)
const playerData = await sleeperAPI.getAllPlayers("nfl")
setPlayers(playerData)
```

### After (With Cache)

```typescript
// First load: API fetch (2-5 seconds) + cache save
// Subsequent loads: Cache hit (<50ms)
const cachedPlayers = sleeperCache.get("allPlayers", "nfl")
if (cachedPlayers) {
  setPlayers(cachedPlayers)
} else {
  const playerData = await sleeperAPI.getAllPlayers("nfl")
  sleeperCache.set("allPlayers", playerData, "nfl")
  setPlayers(playerData)
}
```

## FAQ

### Q: Why sessionStorage instead of localStorage?

**A:** Player data changes frequently during NFL season. sessionStorage provides:
- Automatic cleanup when tab closes
- No stale data between browser sessions
- Still persists across page navigations within same tab

### Q: What happens if cache exceeds quota?

**A:** Cache automatically clears and retries. If second attempt fails, app continues without caching.

### Q: How do I force fresh data?

**A:** Three options:
1. Browser console: `sleeperCacheDebug.clear()` then refresh
2. Close and reopen browser tab (clears sessionStorage)
3. Wait 24 hours (cache expires)

### Q: Does this cache other Sleeper endpoints?

**A:** No. Only `getAllPlayers` is cached per requirements. Rosters, matchups, and transactions are NOT cached to ensure real-time data.

### Q: Is this production-ready?

**A:** Yes. Includes:
- Error handling (quota exceeded, parse errors)
- SSR compatibility (window checks)
- Version management (cache invalidation)
- Fallback behavior (app works without cache)
- Comprehensive logging and debugging

## Phase 2: IndexedDB Migration

### Automatic Migration

Phase 2 automatically migrates sessionStorage data to IndexedDB on first load:

```typescript
// Triggered automatically in PlayerDataContext
await cacheMigration.autoMigrate()

// Migration steps:
// 1. Check if sessionStorage has data
// 2. Check if IndexedDB already has data (avoid overwriting)
// 3. Copy sessionStorage data to IndexedDB
// 4. Clear sessionStorage (to free up space)
// 5. Log success/failure
```

### Migration Status

Check migration status in browser console:

```javascript
// Test migration
await indexedDBDebug.migrate()

// Validate migration integrity
await indexedDBDebug.validateMigration()

// Output:
// ✅ Validating Migration
//   Valid: ✅ Yes
//   IndexedDB Count: 11437
//   Session Count: 0 (migrated)
```

### Rollback (Emergency)

If IndexedDB has issues, you can rollback to sessionStorage:

```typescript
import { cacheMigration } from "@/lib/cache/cache-migration"

// Copy IndexedDB data back to sessionStorage
await cacheMigration.rollback()
```

### Browser Support

IndexedDB is supported in all modern browsers:
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (some quirks handled)
- iOS Safari: ✅ Full support
- IE11: ❌ Not supported (falls back to sessionStorage)

If IndexedDB is unavailable, the app automatically falls back to sessionStorage (Phase 1).

## Phase 2 New Capabilities

### Indexed Queries

Phase 2 adds fast indexed queries using IndexedDB indexes:

```typescript
// Get all QBs (uses position index)
const qbs = await indexedDBCache.getPlayersByPosition("QB")
// ~5ms for 100+ players

// Get all Buffalo Bills players (uses team index)
const bufPlayers = await indexedDBCache.getPlayersByTeam("BUF")
// ~5ms

// Search players by name (uses full_name index)
const results = await indexedDBCache.searchPlayersByName("Josh")
// ~10ms with prefix matching
```

### Persistent Cache

Unlike sessionStorage (Phase 1), IndexedDB persists across browser restarts:

| Scenario | Phase 1 | Phase 2 |
|----------|---------|---------|
| Refresh page | ✅ Cached | ✅ Cached |
| New tab | ✅ Cached | ✅ Cached |
| Close browser | ❌ Lost | ✅ Cached |
| Restart computer | ❌ Lost | ✅ Cached |

### Storage Quota

IndexedDB typically has much larger quota than sessionStorage:

| Storage Type | Typical Quota | Fantasy Assistant Usage |
|--------------|---------------|------------------------|
| sessionStorage | 5-10MB | 2.3MB (tight fit) |
| IndexedDB | 50MB - 1GB+ | 2.3MB (plenty of room) |

## Future Enhancements

Potential improvements (not yet implemented):

1. **Selective Caching** - Cache by position or specific player IDs
2. **Stale-While-Revalidate** - Show cached data while fetching fresh in background
3. **Cache Compression** - Use LZ-string to reduce storage size
4. **Multi-Sport Support** - Extend beyond NFL to other sports
5. **Background Sync** - Auto-refresh cache in service worker

## Support

For issues or questions:

**Phase 2 (IndexedDB):**
1. Check browser console for cache logs
2. Run `indexedDBDebug.help()` for available commands
3. Use `await indexedDBDebug.test()` to verify cache is working
4. Check IndexedDB in DevTools: Application → Storage → IndexedDB → fantasy-assistant-cache
5. Test migration: `await indexedDBDebug.migrate()`
6. Validate integrity: `await indexedDBDebug.validateMigration()`

**Phase 1 (sessionStorage fallback):**
1. Run `sleeperCacheDebug.help()` for available commands
2. Use `sleeperCacheDebug.test()` to verify cache is working
3. Check sessionStorage in DevTools: Application → Storage → Session Storage
4. Review logs in PlayerDataContext component

**Both:**
1. Review logs in PlayerDataContext component
2. Check for "[PlayerData]" console logs
3. Verify which cache tier was used (IndexedDB, session, or API)
