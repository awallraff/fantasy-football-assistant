# TASK-058: PlayerDataContext Optimization Plan

**Date:** 2025-10-25
**Priority:** P0 (CRITICAL)
**Related:** TASK-056, TASK-057
**Target:** Reduce 1,089ms execution time in `610-91e7e847c89f465e.js`

## Root Cause Analysis

The chunk `610-91e7e847c89f465e.js` contains **PlayerDataContext** (`contexts/player-data-context.tsx`) which is loaded on every page because it's in the root layout. The 1,089ms execution time is caused by:

### 1. Heavy Dependencies (PRIMARY CAUSE)

**File:** `contexts/player-data-context.tsx` (lines 7-11)

```typescript
import { sleeperCache } from "@/lib/cache/sleeper-cache"
import { indexedDBCache } from "@/lib/cache/indexeddb-cache"
import { cacheMigration } from "@/lib/cache/cache-migration"
import "@/lib/cache/cache-debug" // Initialize debug utilities
import "@/lib/cache/indexeddb-debug" // Initialize IndexedDB debug utilities
```

**Problem:**
- **Debug utilities** are imported and initialized on EVERY page load (even in production!)
- **IndexedDB cache implementation** is ~600 lines of complex DB operations
- **Migration logic** checks sessionStorage → IndexedDB migration on init
- All imports are **synchronous** and block the main thread

**Impact:** +300-400ms from unnecessary debug code in production

### 2. Synchronous Cache Initialization

**File:** `contexts/player-data-context.tsx` (lines 42-43)

```typescript
// Auto-migrate from sessionStorage to IndexedDB if needed
await cacheMigration.autoMigrate()
```

**Problem:**
- Migration runs **before** rendering starts
- IndexedDB.open() is called synchronously during component mount
- Database schema check blocks the main thread
- Migration checks sessionStorage, IndexedDB metadata, and validates data

**Impact:** +200-300ms from blocking DB operations

### 3. Complex Fallback Chain

**File:** `contexts/player-data-context.tsx` (lines 50-90)

```typescript
// Try IndexedDB first
if (indexedDBCache.isAvailable()) {
  const indexedPlayers = await indexedDBCache.getAllPlayers()
  if (indexedPlayers) { /* ... */ return }
}

// Fallback to sessionStorage
const sessionPlayers = sleeperCache.get("allPlayers", "nfl")
if (sessionPlayers) {
  setPlayers(sessionPlayers)
  // Background: Try to populate IndexedDB for next time
  indexedDBCache.setPlayers(sessionPlayers).catch(/* ... */)
  return
}

// Cache miss - fetch from API
const playerData = await sleeperAPI.getAllPlayers("nfl")
```

**Problem:**
- Each cache layer adds latency
- IndexedDB transactions are slow on mobile (simulated Slow 4G)
- Background IndexedDB population (line 84) still blocks if it fails
- Multiple async operations in sequence (not parallel)

**Impact:** +200-300ms from sequential cache checks

### 4. Excessive Console Logging (PRODUCTION!)

**Examples from minified chunk:**
- `console.log("[PlayerData] ✅ Loaded...`
- `console.log("[IndexedDBCache] Database initialized...`
- `console.warn("[SleeperCache] Failed to...`
- `console.group` / `console.groupEnd` / `console.table` calls

**Problem:**
- Console operations are synchronous and slow
- Production builds should strip console logs (currently not configured)
- Debug logging adds ~50-100ms on slower devices

**Impact:** +50-100ms from production console logs

### 5. Large Bundle Size

**Minified chunk size:** 26.3KB (should be <10KB for context provider)

**What's included:**
- Entire IndexedDB cache implementation (~600 lines)
- Entire sessionStorage cache (~200 lines)
- Cache migration logic (~300 lines)
- Debug utilities (~400 lines)
- Player utility functions

**Problem:**
- Too much code for a simple context provider
- Debug code should be tree-shaken in production
- Cache implementations should be lazy-loaded

**Impact:** +100-150ms from parse/compile time

## Optimization Strategy

### Phase 1: Quick Wins (Expected: -400-500ms) ⚡

#### 1.1: Remove Debug Imports from Production

**Change:** Use conditional imports for debug utilities

```typescript
// Before:
import "@/lib/cache/cache-debug"
import "@/lib/cache/indexeddb-debug"

// After:
if (process.env.NODE_ENV !== "production") {
  await import("@/lib/cache/cache-debug")
  await import("@/lib/cache/indexeddb-debug")
}
```

**Expected Impact:** -300ms (debug code removed from production bundle)
**Risk:** Low
**Effort:** 5 minutes

#### 1.2: Strip Console Logs in Production Build

**Change:** Configure Next.js to remove console logs in production

```javascript
// next.config.mjs
const nextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"] // Keep error/warn for debugging
    } : false
  }
}
```

**Expected Impact:** -50-100ms (console operations removed)
**Risk:** Low (preserves error/warn)
**Effort:** 2 minutes

#### 1.3: Lazy-Load Cache Migration

**Change:** Move migration to background after initial render

```typescript
// Before:
await cacheMigration.autoMigrate() // Blocks render

// After:
useEffect(() => {
  // Run migration in background after mount
  cacheMigration.autoMigrate().catch(console.error)
}, [])
```

**Expected Impact:** -100-150ms (non-blocking migration)
**Risk:** Low (migration still happens, just async)
**Effort:** 5 minutes

### Phase 2: Architectural Changes (Expected: -300-400ms) 🏗️

#### 2.1: Lazy-Load IndexedDB Cache

**Change:** Dynamic import IndexedDB only when needed

```typescript
// Before:
import { indexedDBCache } from "@/lib/cache/indexeddb-cache"

// After:
const indexedDBCache = await import("@/lib/cache/indexeddb-cache").then(
  m => m.indexedDBCache
)
```

**Expected Impact:** -200-250ms (defer heavy DB code)
**Risk:** Medium (requires careful async handling)
**Effort:** 15 minutes

#### 2.2: Parallel Cache Checks

**Change:** Check all caches in parallel instead of sequential

```typescript
// Before: Sequential (slow)
const indexed = await indexedDBCache.getAllPlayers()
if (!indexed) {
  const session = sleeperCache.get("allPlayers")
  if (!session) {
    const api = await sleeperAPI.getAllPlayers()
  }
}

// After: Parallel (fast)
const [indexed, session] = await Promise.all([
  indexedDBCache.getAllPlayers().catch(() => null),
  Promise.resolve(sleeperCache.get("allPlayers"))
])

const players = indexed || session || await sleeperAPI.getAllPlayers()
```

**Expected Impact:** -100-150ms (parallel async ops)
**Risk:** Low
**Effort:** 10 minutes

#### 2.3: Move Player Data to Server Component

**Change:** Fetch player data server-side, hydrate client

```typescript
// Server Component (app/providers.tsx)
export async function PlayerDataServerProvider({ children }) {
  const initialPlayers = await sleeperAPI.getAllPlayers("nfl")

  return (
    <PlayerDataClientProvider initialPlayers={initialPlayers}>
      {children}
    </PlayerDataClientProvider>
  )
}

// Client Component
export function PlayerDataClientProvider({
  children,
  initialPlayers
}: {
  initialPlayers: SleeperPlayers
}) {
  // Start with server data, no need for cache check
  const [players] = useState(initialPlayers)
  // ... rest of client logic
}
```

**Expected Impact:** -500-700ms (no client-side fetch needed)
**Risk:** Medium (requires RSC migration)
**Effort:** 30 minutes

### Phase 3: Advanced Optimizations (Expected: -200-300ms) 🚀

#### 3.1: Use Web Worker for Cache Operations

**Change:** Move IndexedDB operations to Web Worker

```typescript
// cache-worker.ts
self.addEventListener("message", async (event) => {
  if (event.data.type === "GET_PLAYERS") {
    const players = await indexedDBCache.getAllPlayers()
    self.postMessage({ type: "PLAYERS", data: players })
  }
})

// player-data-context.tsx
const worker = new Worker("/cache-worker.js")
worker.postMessage({ type: "GET_PLAYERS" })
worker.onmessage = (e) => {
  if (e.data.type === "PLAYERS") {
    setPlayers(e.data.data)
  }
}
```

**Expected Impact:** -200-250ms (main thread unblocked)
**Risk:** High (Worker overhead, debugging complexity)
**Effort:** 60 minutes

#### 3.2: Implement Streaming SSR

**Change:** Stream player data progressively

```typescript
// Use Next.js streaming with Suspense
<Suspense fallback={<LoadingPlayers />}>
  <PlayerDataProvider>
    {children}
  </PlayerDataProvider>
</Suspense>
```

**Expected Impact:** -300-400ms perceived (progressive rendering)
**Risk:** Medium (requires Next.js 15 App Router features)
**Effort:** 45 minutes

## Recommended Implementation Order

### Sprint 1: Quick Wins (1-2 hours, -400-500ms)

1. ✅ Remove debug imports from production
2. ✅ Strip console logs in Next.js config
3. ✅ Lazy-load cache migration

**Expected LCP:** 13.4s → 12.9s (10% improvement)

### Sprint 2: Architectural Changes (2-3 hours, -300-400ms)

4. ✅ Lazy-load IndexedDB cache
5. ✅ Parallel cache checks
6. ⚠️ Move to Server Component (optional, high effort)

**Expected LCP:** 12.9s → 12.5s (cumulative 15% improvement)

### Sprint 3: Advanced (Optional, if needed)

7. ⚠️ Web Worker for cache ops (complex, high risk)
8. ⚠️ Streaming SSR (requires more research)

## Success Metrics

| Metric | Before | After Phase 1 | After Phase 2 | Target |
|--------|--------|---------------|---------------|--------|
| **Chunk Execution Time** | 1,089ms | 600ms | 400ms | <300ms |
| **Long Task Duration** | 1,070ms | 700ms | 500ms | <300ms |
| **LCP** | 13.4s | 12.9s | 12.5s | <2.5s |
| **Chunk Size** | 26.3KB | 18KB | 15KB | <10KB |

**Note:** Even with all optimizations, we may not hit the 2.5s LCP target because:
- Other heavy chunks still exist (`19-758199db89b24191.js` = 169KB)
- General Next.js hydration overhead
- This addresses only ONE bottleneck

**Full LCP fix requires:**
- This optimization (TASK-058) ✅
- React Server Components migration (TASK-059)
- Suspense boundaries (TASK-060)
- CSS optimization (inline critical CSS)
- Bundle reduction across ALL chunks

## Next Steps

1. **Implement Phase 1** (Quick Wins) - Start immediately
2. **Measure impact** with Lighthouse after Phase 1
3. **Decide on Phase 2** based on Phase 1 results
4. **Consider broader RSC migration** if needed for <2.5s LCP

---

**Ready to implement:** Phase 1 optimizations can begin now with low risk and immediate impact.
