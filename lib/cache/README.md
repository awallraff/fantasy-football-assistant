# Sleeper API Cache Implementation

## Overview

Session storage caching system for Sleeper API `getAllPlayers` endpoint. Reduces load times from 2-5 seconds to near-instant on subsequent page loads.

## Performance Improvement

| Scenario | Load Time | Improvement |
|----------|-----------|-------------|
| **First Load (Cache Miss)** | 2000-5000ms | Baseline |
| **Subsequent Loads (Cache Hit)** | <50ms | 95-98% faster |
| **Data Size** | ~2.3MB (~11,400 players) | Cached in sessionStorage |

## Architecture

### Files

- **`sleeper-cache.ts`** - Core cache utility with get/set/invalidate operations
- **`cache-debug.ts`** - Debugging utilities and performance testing
- **`README.md`** - This file

### Cache Structure

```typescript
interface CacheEntry<T> {
  data: T                    // Cached data (all players dictionary)
  timestamp: number          // When cached (Date.now())
  ttl: number                // Time-to-live in milliseconds (24 hours)
  version: string            // Cache version for invalidation
}
```

### Storage

- **Storage Type:** `sessionStorage` (persists until browser tab closed)
- **TTL:** 24 hours (86400000 ms)
- **Key Format:** `sleeper_cache_allPlayers_nfl_v1`
- **SSR-Safe:** Checks for window object before accessing storage

## Usage

### Basic Usage (Automatic)

The cache is automatically used in `PlayerDataContext`:

```typescript
// Automatic in PlayerDataProvider
const cachedPlayers = sleeperCache.get("allPlayers", "nfl")

if (cachedPlayers) {
  // Cache hit - load instantly
  setPlayers(cachedPlayers)
} else {
  // Cache miss - fetch from API and cache
  const playerData = await sleeperAPI.getAllPlayers("nfl")
  sleeperCache.set("allPlayers", playerData, "nfl")
  setPlayers(playerData)
}
```

### Manual Cache Operations

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

The cache exposes debugging utilities in the browser console:

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

Run a performance comparison test:

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

## Future Enhancements

Potential improvements (not implemented):

1. **IndexedDB Support** - For larger datasets beyond sessionStorage quota
2. **Selective Caching** - Cache by position or specific player IDs
3. **Stale-While-Revalidate** - Show cached data while fetching fresh in background
4. **Cache Compression** - Use LZ-string to reduce storage size
5. **Multi-Sport Support** - Extend beyond NFL to other sports

## Support

For issues or questions:
1. Check browser console for cache logs
2. Run `sleeperCacheDebug.help()` for available commands
3. Use `sleeperCacheDebug.test()` to verify cache is working
4. Review logs in PlayerDataContext component
