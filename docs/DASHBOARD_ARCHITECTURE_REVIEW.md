# Dashboard Architecture Review - React Architecture Analysis

**Date:** 2025-10-25
**Reviewer:** React Principal Architect
**Scope:** Dashboard application and supporting architecture
**Context:** Next.js 15 app with custom hook-based state management, recent 79% LCP performance optimization

---

## Executive Summary

The Dashboard application demonstrates **good foundational architecture** with modern React patterns, including custom hooks for state management, context providers for global state, and code splitting for performance. However, as the application scales from 11 pages to 10+, several architectural concerns will become critical:

**Key Findings:**
- ✅ **Strong custom hooks pattern** - Clean separation of concerns
- ✅ **Effective caching strategy** - IndexedDB + sessionStorage fallback
- ⚠️ **Missing error boundaries** - No graceful failure handling
- ⚠️ **Component complexity** - Several 200+ line components with mixed concerns
- ⚠️ **Context performance risks** - Large player data triggers re-renders
- ⚠️ **Testing gaps** - No evidence of component or hook tests
- ❌ **State synchronization issues** - Race conditions in league selection
- ❌ **Scalability concerns** - Custom hooks won't scale to 10+ pages

---

## Architecture Overview

### Current State Management Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Root Layout                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ThemeProvider (react-query style provider)         │   │
│  │    ├─ PlayerDataProvider (Context)                  │   │
│  │    │    └─ ~8000 NFL players (global state)         │   │
│  │    └─ ProjectionsProvider (Context)                 │   │
│  │         └─ AI projections with 5-min cache          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          Dashboard Page                              │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  useDashboardData() hook                       │  │   │
│  │  │    └─ User, leagues, year selection            │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  useLeagueSelection() hook                     │  │   │
│  │  │    └─ Selected league, rosters, users          │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  useLoadingStates() hook                       │  │   │
│  │  │    └─ Loading, retrying, async wrappers        │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  useDebugInfo() hook                           │  │   │
│  │  │    └─ Debug information generation             │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

Component Tree:
Dashboard
  ├─ LeagueHeader
  ├─ Tabs
  │   ├─ LeagueOverview (dynamic import)
  │   ├─ EnhancedTeamRoster × N (dynamic import)
  │   ├─ StandingsTable (dynamic import)
  │   └─ RecentActivity (dynamic import)
  └─ NoLeaguesConnected
```

### Strengths

1. **Hook-Based State Management:**
   - Clean separation: `useDashboardData`, `useLeagueSelection`, `useLoadingStates`
   - Single responsibility per hook
   - Composable and testable (if tests existed)

2. **Caching Strategy:**
   - Dual-layer cache: IndexedDB → sessionStorage
   - Lazy-loaded IndexedDB to reduce initial bundle
   - Background migration and cache warming

3. **Code Splitting:**
   - All heavy tab components dynamically imported
   - Loading states for async components

4. **Context Providers:**
   - PlayerDataContext loads once globally
   - ProjectionsProvider with 5-min cache prevents API spam

---

## Architectural Issues

### CRITICAL SEVERITY

#### ARCH-001: No Error Boundary Coverage
**Category:** Modern Features
**Severity:** Critical
**Impact:** Entire app crashes if any component throws error

**Current State:**
- No error boundaries anywhere in the app
- PlayerDataContext errors crash entire app
- Component errors crash entire page

**Problem:**
React 18+ requires error boundaries for production apps. A single error in `EnhancedTeamRoster` (222 lines, complex logic) takes down the entire dashboard.

**Recommendation:**
```tsx
// lib/error-boundary.tsx
export class ErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error tracking service
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback error={this.state.error} />
    }
    return this.props.children
  }
}

// Usage in layout.tsx
<ErrorBoundary fallback={<GlobalErrorFallback />}>
  <PlayerDataProvider>
    <ErrorBoundary fallback={<PlayerDataErrorFallback />}>
      {children}
    </ErrorBoundary>
  </PlayerDataProvider>
</ErrorBoundary>
```

**Migration Path:**
1. Create `ErrorBoundary` component with fallback UI
2. Wrap root layout providers (Phase 1)
3. Wrap dynamic imports (Phase 2)
4. Add error tracking integration (Phase 3)

**Effort:** 4-6 hours

---

#### ARCH-002: Context Performance - PlayerDataContext Re-render Cascade
**Category:** Scalability
**Severity:** Critical
**Impact:** Performance degradation as app scales

**Current State:**
- `PlayerDataContext` contains ~8000 player objects
- Every context update re-renders ALL consumers
- 76 components in project could consume this context

**Problem:**
```tsx
// contexts/player-data-context.tsx (line 183-192)
const value: PlayerDataContextType = useMemo(() => ({
  players,        // 8000 players - massive object
  isLoading,
  error,
  getPlayerName,  // Functions recreated on every players change
  getPlayer,
  getPlayerPosition,
  getPlayersByPosition,
  refreshPlayerData,
}), [players, isLoading, error, ...]) // Players changes = entire context updates
```

When `players` updates (e.g., cache refresh), ALL components using `usePlayerData()` re-render, even if they only use `getPlayerName()`.

**Recommendation:**
Split context into static data + utility functions:

```tsx
// contexts/player-data-context.tsx - REFACTORED
const PlayerDataContext = createContext<PlayerData>({ players, isLoading, error })
const PlayerUtilsContext = createContext<PlayerUtils>({ getPlayer, getPlayerName, ... })

export function PlayerDataProvider({ children }) {
  // Data context - rarely changes after initial load
  const dataValue = useMemo(() => ({ players, isLoading, error }), [players, isLoading, error])

  // Utils context - stable functions, NEVER changes
  const utilsValue = useMemo(() => ({
    getPlayerName: useCallback((id) => { /* stable */ }, []),
    getPlayer: useCallback((id) => { /* stable */ }, []),
    // ... other stable functions
  }), []) // Empty deps - created once

  return (
    <PlayerDataContext.Provider value={dataValue}>
      <PlayerUtilsContext.Provider value={utilsValue}>
        {children}
      </PlayerUtilsContext.Provider>
    </PlayerDataContext.Provider>
  )
}

// Consumers only re-render when they need to
export function usePlayerData() { return useContext(PlayerDataContext) }
export function usePlayerUtils() { return useContext(PlayerUtilsContext) }
```

**Migration Path:**
1. Create `PlayerUtilsContext` with stable functions (Phase 1)
2. Update all consumers to use `usePlayerUtils()` (Phase 2)
3. Measure re-render reduction with React DevTools Profiler (Phase 3)

**Effort:** 8-12 hours

---

#### ARCH-003: Race Condition in League Selection
**Category:** Technical Debt
**Severity:** Critical
**Impact:** Wrong data displayed if user rapidly switches leagues

**Current State:**
```tsx
// hooks/use-league-selection.ts (line 36-77)
const loadLeagueDetails = useCallback(async (league: SleeperLeague) => {
  if (abortControllerRef.current) {
    abortControllerRef.current.abort() // ✅ Good - aborts previous request
  }

  const controller = new AbortController()
  abortControllerRef.current = controller

  const [rostersData, usersData] = await Promise.all([
    sleeperAPI.getLeagueRosters(league.league_id),
    sleeperAPI.getLeagueUsers(league.league_id),
  ])

  if (!controller.signal.aborted) {
    // ⚠️ RACE CONDITION: State updates happen sequentially
    setRosters(rostersData)       // React schedules update
    setLeagueUsers(usersData)     // React schedules update
    setSelectedLeague(league)     // React schedules update

    // Problem: If component unmounts or new request starts,
    // partial state updates can occur
  }
}, [])
```

**Problem:**
React 18 batches state updates, but async operations can still cause race conditions:
1. User selects League A → starts fetching
2. User selects League B → starts fetching
3. League A request completes first
4. League B request completes second
5. UI shows League B header with League A rosters (MISMATCH)

**Recommendation:**
Use a single state object to ensure atomic updates:

```tsx
// hooks/use-league-selection.ts - REFACTORED
interface LeagueState {
  league: SleeperLeague | null
  rosters: SleeperRoster[]
  users: SleeperUser[]
}

const [leagueState, setLeagueState] = useState<LeagueState>({
  league: null,
  rosters: [],
  users: []
})

const loadLeagueDetails = useCallback(async (league: SleeperLeague) => {
  const controller = new AbortController()
  abortControllerRef.current = controller

  const [rostersData, usersData] = await Promise.all([...])

  if (!controller.signal.aborted) {
    // ✅ Atomic update - all or nothing
    setLeagueState({
      league,
      rosters: rostersData,
      users: usersData
    })
  }
}, [])
```

**Migration Path:**
1. Refactor `useLeagueSelection` to use single state object (Phase 1)
2. Add request ID validation for extra safety (Phase 2)
3. Add integration tests for rapid league switching (Phase 3)

**Effort:** 4-6 hours

---

### HIGH SEVERITY

#### ARCH-004: Component Complexity - EnhancedTeamRoster
**Category:** Technical Debt
**Severity:** High
**Impact:** Hard to test, maintain, and debug

**Current State:**
- `EnhancedTeamRoster`: 222 lines
- Responsibilities:
  1. Fetch player data from context
  2. Load projections
  3. Calculate starters vs bench
  4. Render collapsed/expanded states
  5. Render tabs (starters/bench)
  6. Handle player detail modal
  7. Handle loading states
  8. Handle empty states

**Problem:**
Violates Single Responsibility Principle. Component does too much, making it:
- Hard to test (requires mocking PlayerDataContext + ProjectionsContext)
- Hard to debug (222 lines to scan for bugs)
- Hard to reuse (tightly coupled to roster logic)

**Recommendation:**
Extract sub-components following Container/Presentation pattern:

```tsx
// components/enhanced-team-roster.tsx - REFACTORED
export function EnhancedTeamRoster({ roster, user, isCurrentUser }: Props) {
  const { players, isLoading } = useRosterPlayers(roster)  // Custom hook
  const [selectedPlayer, setSelectedPlayer] = useState<DisplayPlayer | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(!isCurrentUser)

  if (isLoading) return <RosterLoadingSkeleton />
  if (!hasPlayers) return <EmptyRosterCard user={user} isCurrentUser={isCurrentUser} />

  return (
    <RosterCard
      user={user}
      isCurrentUser={isCurrentUser}
      roster={roster}
      isCollapsed={isCollapsed}
      onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
    >
      {!isCollapsed && (
        <RosterTabs
          starters={players.starters}
          bench={players.bench}
          onPlayerClick={setSelectedPlayer}
        />
      )}
      {selectedPlayer && (
        <PlayerDetailModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      )}
    </RosterCard>
  )
}

// components/roster/roster-card.tsx (presentation)
export function RosterCard({ user, roster, isCollapsed, onToggleCollapse, children }) {
  return (
    <Card>
      <RosterHeader user={user} roster={roster} onToggle={onToggleCollapse} />
      {children}
    </Card>
  )
}

// components/roster/roster-tabs.tsx (presentation)
export function RosterTabs({ starters, bench, onPlayerClick }) {
  return (
    <Tabs defaultValue="starters">
      <TabsList>...</TabsList>
      <TabsContent value="starters">
        <PlayerList players={starters} onClick={onPlayerClick} />
      </TabsContent>
      <TabsContent value="bench">
        <PlayerList players={bench} onClick={onPlayerClick} />
      </TabsContent>
    </Tabs>
  )
}

// hooks/use-roster-players.ts (business logic)
export function useRosterPlayers(roster: SleeperRoster) {
  const { getPlayer, getPlayerName, isLoading } = usePlayerData()
  const { getProjection, loadProjectionsForPlayers } = useProjections()

  // Complex player loading logic extracted here
  const players = useMemo(() => {
    const allPlayers = loadPlayersWithProjections(roster, getPlayer, getProjection)
    return {
      starters: allPlayers.filter(p => roster.starters?.includes(p.player_id)),
      bench: allPlayers.filter(p => !roster.starters?.includes(p.player_id))
    }
  }, [roster, getPlayer, getProjection])

  return { players, isLoading }
}
```

**Benefits:**
- `EnhancedTeamRoster`: 50 lines (orchestration only)
- `RosterCard`: 30 lines (presentation, easily testable)
- `RosterTabs`: 40 lines (presentation, easily testable)
- `useRosterPlayers`: 60 lines (business logic, unit testable)

**Migration Path:**
1. Extract `RosterCard` presentation component (Phase 1)
2. Extract `RosterTabs` presentation component (Phase 1)
3. Extract `useRosterPlayers` custom hook (Phase 2)
4. Add unit tests for hook (Phase 2)
5. Refactor `EnhancedTeamRoster` to orchestrate (Phase 3)

**Effort:** 10-14 hours

---

#### ARCH-005: Missing Suspense Boundaries
**Category:** Modern Features
**Severity:** High
**Impact:** Sub-optimal loading UX, no streaming benefits

**Current State:**
```tsx
// app/dashboard/page.tsx (line 21-32)
const EnhancedTeamRoster = dynamic(() => import("..."), {
  loading: () => <div className="flex items-center...">...</div>
})
```

Dynamic imports use custom loading components, but don't leverage React 18 Suspense.

**Problem:**
- No support for React 18 concurrent features
- Can't use `<Suspense>` with `startTransition` for smoother loading
- Loading states are component-specific, not coordinated

**Recommendation:**
Replace custom loading with Suspense boundaries:

```tsx
// app/dashboard/page.tsx - REFACTORED
const EnhancedTeamRoster = dynamic(() => import("..."))
const LeagueOverview = dynamic(() => import("..."))
const StandingsTable = dynamic(() => import("..."))
const RecentActivity = dynamic(() => import("..."))

export default function DashboardPage() {
  return (
    <Tabs defaultValue="overview">
      <TabsContent value="overview">
        <Suspense fallback={<TabLoadingSkeleton />}>
          <LeagueOverview {...props} />
        </Suspense>
      </TabsContent>

      <TabsContent value="teams">
        <Suspense fallback={<RosterListSkeleton count={rosters.length} />}>
          {sortedRosters.map(roster => (
            <EnhancedTeamRoster key={roster.roster_id} {...props} />
          ))}
        </Suspense>
      </TabsContent>

      {/* ... other tabs ... */}
    </Tabs>
  )
}
```

**Benefits:**
- Enables `startTransition` for non-blocking UI updates
- Better loading coordination
- Prepares for React Server Components (Next.js 15+)

**Migration Path:**
1. Add `<Suspense>` boundaries to tab content (Phase 1)
2. Remove custom `loading` from dynamic imports (Phase 1)
3. Use `startTransition` for tab changes (Phase 2)
4. Add nested Suspense for fine-grained loading (Phase 3)

**Effort:** 4-6 hours

---

#### ARCH-006: No Testing Infrastructure
**Category:** Technical Debt
**Severity:** High
**Impact:** No confidence in refactoring, high regression risk

**Current State:**
- Unit tests exist: `npm run test:unit` command in package.json
- Integration tests exist: `npm run test:integration` command
- **BUT:** No evidence of component or hook tests in codebase review

**Problem:**
Complex hooks like `useDashboardData` (201 lines) and `useLeagueSelection` (157 lines) have no tests. Refactoring is risky.

**Recommendation:**
Add testing for critical hooks and components:

```tsx
// hooks/__tests__/use-league-selection.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useLeagueSelection } from '../use-league-selection'

describe('useLeagueSelection', () => {
  it('should prevent race conditions when rapidly switching leagues', async () => {
    const { result } = renderHook(() => useLeagueSelection(props))

    // Simulate rapid league changes
    act(() => result.current.handleLeagueChange('league-1'))
    act(() => result.current.handleLeagueChange('league-2'))
    act(() => result.current.handleLeagueChange('league-3'))

    await waitFor(() => {
      expect(result.current.selectedLeague?.league_id).toBe('league-3')
    })

    // Verify rosters match selected league
    expect(result.current.rosters).toMatchLeague('league-3')
  })

  it('should handle AbortController cleanup on unmount', () => {
    const { unmount } = renderHook(() => useLeagueSelection(props))
    const abortSpy = jest.spyOn(AbortController.prototype, 'abort')

    unmount()

    expect(abortSpy).toHaveBeenCalled()
  })
})
```

**Migration Path:**
1. Set up React Testing Library + Jest config (Phase 1)
2. Add tests for custom hooks (Phase 2)
3. Add tests for presentation components (Phase 3)
4. Add integration tests for user flows (Phase 4)

**Effort:** 20-30 hours (ongoing)

---

### MEDIUM SEVERITY

#### ARCH-007: Overly Broad localStorage Usage
**Category:** Pattern
**Severity:** Medium
**Impact:** Data persistence inconsistencies

**Current State:**
```tsx
// hooks/use-dashboard-data.ts (line 30-74)
const savedUser = getItem("sleeper_user")
const savedLeagues = getItem("sleeper_leagues")
```

localStorage is used for:
- User data (persist across sessions)
- League data (persist across sessions)

**Problem:**
- No data versioning strategy
- No migration path for schema changes
- localStorage can be cleared by users/browsers
- No fallback for quota exceeded errors (already handled in hook, but not validated)

**Recommendation:**
Add versioning and migration strategy:

```tsx
// lib/storage/versioned-storage.ts
const STORAGE_VERSION = 'v2'

interface VersionedData<T> {
  version: string
  data: T
  timestamp: number
}

export function getVersionedItem<T>(key: string): T | null {
  const raw = localStorage.getItem(key)
  if (!raw) return null

  const parsed = JSON.parse(raw) as VersionedData<T>

  // Validate version
  if (parsed.version !== STORAGE_VERSION) {
    console.log(`Migrating ${key} from ${parsed.version} to ${STORAGE_VERSION}`)
    const migrated = migrateData(parsed.data, parsed.version, STORAGE_VERSION)
    setVersionedItem(key, migrated)
    return migrated
  }

  return parsed.data
}

export function setVersionedItem<T>(key: string, data: T): void {
  const versioned: VersionedData<T> = {
    version: STORAGE_VERSION,
    data,
    timestamp: Date.now()
  }
  localStorage.setItem(key, JSON.stringify(versioned))
}
```

**Migration Path:**
1. Create `versioned-storage.ts` utility (Phase 1)
2. Migrate `useDashboardData` to use versioned storage (Phase 2)
3. Add migration tests (Phase 2)

**Effort:** 6-8 hours

---

#### ARCH-008: Recent Activity Component Complexity
**Category:** Technical Debt
**Severity:** Medium
**Impact:** Hard to maintain and test

**Current State:**
- `RecentActivity`: 457 lines (largest component in dashboard)
- Mixed concerns:
  1. Transaction fetching
  2. Player value calculation
  3. Ranking change estimation
  4. UI rendering
  5. Date formatting
  6. Impact scoring

**Problem:**
Component does too much. Complex business logic (lines 42-141) mixed with UI logic.

**Recommendation:**
Extract business logic into services:

```tsx
// lib/services/transaction-analyzer.ts
export class TransactionAnalyzer {
  constructor(private players: PlayerData) {}

  analyzeTransaction(transaction: SleeperTransaction): EnhancedTransaction {
    const playerDetails = this.extractPlayerDetails(transaction)
    const impactScore = this.calculateImpact(playerDetails)
    return { ...transaction, playerDetails, impactScore }
  }

  private calculatePlayerValue(playerId: string): number {
    // Complex value calculation logic extracted here
  }
}

// components/recent-activity.tsx - SIMPLIFIED
export function RecentActivity({ leagueId, users, rosters }: Props) {
  const { players } = usePlayerData()
  const transactions = useTransactions(leagueId, players, users, rosters)

  if (transactions.isLoading) return <LoadingState />
  if (transactions.isEmpty) return <EmptyState />

  return (
    <Card>
      <CardHeader>...</CardHeader>
      <CardContent>
        <TransactionList
          transactions={transactions.data}
          onRefresh={transactions.refresh}
        />
      </CardContent>
    </Card>
  )
}

// hooks/use-transactions.ts
export function useTransactions(leagueId, players, users, rosters) {
  const [transactions, setTransactions] = useState<EnhancedTransaction[]>([])
  const [loading, setLoading] = useState(false)

  const analyzer = useMemo(() => new TransactionAnalyzer(players), [players])

  const loadTransactions = useCallback(async () => {
    const raw = await sleeperAPI.getTransactions(leagueId)
    const enhanced = raw.map(t => analyzer.analyzeTransaction(t))
    setTransactions(enhanced)
  }, [leagueId, analyzer])

  useEffect(() => { loadTransactions() }, [loadTransactions])

  return {
    data: transactions,
    isLoading: loading,
    isEmpty: transactions.length === 0,
    refresh: loadTransactions
  }
}
```

**Migration Path:**
1. Extract `TransactionAnalyzer` service (Phase 1)
2. Create `useTransactions` hook (Phase 2)
3. Simplify `RecentActivity` component (Phase 3)
4. Add unit tests for analyzer (Phase 3)

**Effort:** 10-12 hours

---

#### ARCH-009: No Optimistic Updates
**Category:** Pattern
**Severity:** Medium
**Impact:** Perceived performance issues

**Current State:**
All mutations are pessimistic:
- Remove league → API call → update UI
- Year change → API call → update UI
- League selection → API call → update UI

**Problem:**
Users see loading states for every action, even when we know the outcome.

**Recommendation:**
Add optimistic updates for predictable mutations:

```tsx
// hooks/use-dashboard-data.ts - REFACTORED
const removeLeague = useCallback((leagueId: string, leagueName?: string) => {
  if (!confirm(`Remove "${leagueName}"?`)) return

  // Optimistic update
  const previousLeagues = leagues
  setLeagues(prev => prev.filter(l => l.league_id !== leagueId))

  try {
    // Persist to localStorage
    const filtered = previousLeagues.filter(l => l.league_id !== leagueId)
    setItem("sleeper_leagues", JSON.stringify(filtered))
  } catch (error) {
    // Rollback on error
    setLeagues(previousLeagues)
    console.error("Failed to remove league:", error)
  }
}, [leagues, setItem])
```

**Migration Path:**
1. Add optimistic updates to local-only mutations (Phase 1)
2. Add rollback logic for errors (Phase 2)
3. Add toast notifications for success/failure (Phase 3)

**Effort:** 4-6 hours

---

### LOW SEVERITY

#### ARCH-010: Inconsistent Loading State Patterns
**Category:** Pattern
**Severity:** Low
**Impact:** Code inconsistency, minor UX issues

**Current State:**
Multiple loading state patterns:
- `isLoading` (PlayerDataContext)
- `loading` (useLoadingStates)
- `playersLoading` (EnhancedTeamRoster)
- `isLoading: projectionsLoading` (EnhancedTeamRoster)

**Problem:**
Inconsistent naming makes code harder to scan.

**Recommendation:**
Standardize on `isLoading` prefix:

```tsx
// Preferred pattern
const { isLoading, isError, data } = useQuery(...)

// Applied to custom hooks
export function useDashboardData() {
  return {
    isLoading: boolean
    isError: boolean
    data: { user, leagues }
  }
}
```

**Migration Path:**
1. Update all hooks to use `isLoading` (Phase 1)
2. Update all components (Phase 1)

**Effort:** 2-3 hours

---

#### ARCH-011: Debug Code in Production
**Category:** Technical Debt
**Severity:** Low
**Impact:** Bundle size bloat

**Current State:**
```tsx
// app/dashboard/page.tsx (line 191-199)
{process.env.NODE_ENV === 'development' && (
  <div className="bg-yellow-100...">
    <div>Rosters: {rosters.length}</div>
    <div>Sorted Rosters: {sortedRosters.length}</div>
    {/* ... 6 more debug lines ... */}
  </div>
)}
```

**Problem:**
Debug code clutters components. Should be extracted to dev tools.

**Recommendation:**
Use React DevTools or custom debug panel:

```tsx
// components/dev/debug-panel.tsx
export function DebugPanel({ data }: { data: Record<string, unknown> }) {
  if (process.env.NODE_ENV !== 'development') return null

  return (
    <details className="fixed bottom-0 right-0 m-4 p-4 bg-yellow-50">
      <summary>Debug Info</summary>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </details>
  )
}

// Usage
<DebugPanel data={{ rosters, sortedRosters, leagueUsers }} />
```

**Migration Path:**
1. Create `DebugPanel` component (Phase 1)
2. Replace inline debug code (Phase 1)

**Effort:** 2-3 hours

---

## Refactoring Opportunities

### 1. Extract Shared Components

**Current Duplication:**
- Loading skeletons defined inline in multiple components
- Empty state messages duplicated
- Error displays duplicated

**Recommendation:**
```tsx
// components/ui/loading-skeleton.tsx
export const DashboardSkeleton = () => (...)
export const RosterSkeleton = () => (...)
export const TabSkeleton = () => (...)

// components/ui/empty-state.tsx
export const EmptyState = ({ icon, title, description, action }: Props) => (...)

// Usage
<EmptyState
  icon={<Users />}
  title="No Teams Found"
  description="No rosters loaded for this league"
  action={<Button onClick={refresh}>Retry</Button>}
/>
```

**Effort:** 6-8 hours

---

### 2. Hook Composition Improvements

**Current Issue:**
Hooks are called in page component, creating tight coupling.

**Recommendation:**
Create higher-level orchestration hooks:

```tsx
// hooks/use-dashboard-state.ts
export function useDashboardState() {
  const dashboardData = useDashboardData()
  const leagueSelection = useLeagueSelection({
    leaguesByYear: dashboardData.leaguesByYear,
    selectedYear: dashboardData.selectedYear,
    currentUser: dashboardData.user
  })
  const loadingStates = useLoadingStates()
  const debugInfo = useDebugInfo()

  return {
    ...dashboardData,
    ...leagueSelection,
    ...loadingStates,
    debugInfo
  }
}

// app/dashboard/page.tsx - SIMPLIFIED
export default function DashboardPage() {
  const state = useDashboardState()

  // Now page component focuses on UI orchestration only
}
```

**Effort:** 4-6 hours

---

### 3. State Management Library Migration (Future)

**When Custom Hooks No Longer Scale:**

If app grows to 20+ pages with complex state sharing, consider:

**Option A: Zustand (Lightweight)**
```tsx
// stores/dashboard-store.ts
export const useDashboardStore = create<DashboardState>((set) => ({
  user: null,
  leagues: [],
  selectedYear: "2025",
  setUser: (user) => set({ user }),
  setLeagues: (leagues) => set({ leagues }),
  // ... etc
}))

// Usage (same API as custom hooks)
const { user, leagues, setUser } = useDashboardStore()
```

**Option B: Jotai (Atomic State)**
```tsx
// atoms/dashboard-atoms.ts
export const userAtom = atom<SleeperUser | null>(null)
export const leaguesAtom = atom<SleeperLeague[]>([])
export const selectedYearAtom = atom<string>("2025")

// Computed atoms
export const currentYearLeaguesAtom = atom((get) => {
  const leagues = get(leaguesAtom)
  const year = get(selectedYearAtom)
  return leagues.filter(l => l.season === year)
})

// Usage
const [user, setUser] = useAtom(userAtom)
const currentLeagues = useAtomValue(currentYearLeaguesAtom)
```

**Recommendation:**
Stay with custom hooks for now. Migrate only when:
- 15+ pages sharing state
- Performance profiling shows context issues
- Team velocity is impacted by state management complexity

**Effort:** 40-60 hours (full migration)

---

## Future-Proofing

### React 19 Readiness

**Current Gaps:**
1. No `use()` hook usage for async data
2. No Server Components (Next.js 15 supports them)
3. No Actions (form submissions)

**Recommendation:**
Wait for React 19 stable release before adopting:
- `use()` hook for data fetching
- Server Components for static pages
- Server Actions for mutations

**Reason:** React 19 is still in beta. Current architecture (hooks + contexts) is compatible and can be migrated incrementally when stable.

---

### Next.js App Router Optimization

**Current Opportunities:**

1. **Partial Prerendering (PPR):**
```tsx
// app/dashboard/page.tsx
export const experimental_ppr = true

export default function DashboardPage() {
  return (
    <>
      {/* Static shell - prerendered */}
      <DashboardHeader />

      {/* Dynamic content - streamed */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </>
  )
}
```

2. **Server Components for Static Data:**
```tsx
// app/dashboard/league-header.tsx (Server Component)
export async function LeagueHeader({ leagueId }: Props) {
  const league = await getLeague(leagueId) // Server-side fetch
  return <header>...</header>
}
```

**Effort:** 20-30 hours (requires architectural shift)

---

### Scalability Recommendations

**For 10+ Page Application:**

1. **Shared State Management:**
   - Current: Context providers + custom hooks
   - Recommended at 10 pages: Zustand or Jotai
   - Reason: Avoid context provider nesting hell

2. **Code Organization:**
   ```
   app/
     features/
       dashboard/
         components/
         hooks/
         stores/
         utils/
       rankings/
         components/
         hooks/
         stores/
       trades/
         ...
   ```

3. **Data Fetching:**
   - Current: useEffect + fetch
   - Recommended: TanStack Query (React Query)
   - Benefits: Caching, deduplication, background refetch

4. **Testing:**
   - Add Cypress or Playwright for E2E
   - Add Storybook for component development
   - Add MSW (Mock Service Worker) for API mocking

---

## Technical Debt Tracking

### Phase 1: Critical Fixes (Sprint 1 - 2 weeks)

#### TD-001: Add Error Boundaries
**Priority:** High
**Description:** Add error boundaries to root layout and dynamic imports to prevent full app crashes
**Impact:** Improves app stability and user experience during errors
**Effort:** Small (4-6 hours)
**Files:** `app/layout.tsx`, `lib/error-boundary.tsx`
**Acceptance Criteria:**
- [ ] Error boundary component created with fallback UI
- [ ] Root layout wrapped with error boundary
- [ ] Dynamic imports wrapped with error boundaries
- [ ] Error tracking integration (Sentry/LogRocket) added
- [ ] Error boundary tested with intentional component errors

---

#### TD-002: Fix Race Condition in League Selection
**Priority:** High
**Description:** Refactor `useLeagueSelection` to use atomic state updates and prevent data mismatches
**Impact:** Eliminates critical bug where wrong data is displayed
**Effort:** Small (4-6 hours)
**Files:** `hooks/use-league-selection.ts`
**Acceptance Criteria:**
- [ ] Single state object replaces multiple `useState` calls
- [ ] Rapid league switching tested and verified
- [ ] Integration test added for race condition scenario
- [ ] Request ID validation added for extra safety

---

#### TD-003: Split PlayerDataContext
**Priority:** High
**Description:** Split PlayerDataContext into data + utils to prevent unnecessary re-renders
**Impact:** Significant performance improvement for components using player utilities
**Effort:** Medium (8-12 hours)
**Files:** `contexts/player-data-context.tsx`, all consumers
**Acceptance Criteria:**
- [ ] `PlayerUtilsContext` created with stable functions
- [ ] All consumers updated to use appropriate context
- [ ] React DevTools Profiler shows reduced re-renders
- [ ] Performance regression test added

---

#### TD-004: Add Suspense Boundaries
**Priority:** Medium
**Description:** Replace custom loading states with React Suspense for better UX
**Impact:** Enables concurrent features, smoother loading transitions
**Effort:** Small (4-6 hours)
**Files:** `app/dashboard/page.tsx`
**Acceptance Criteria:**
- [ ] All dynamic imports wrapped with `<Suspense>`
- [ ] Custom loading props removed from dynamic imports
- [ ] `startTransition` used for tab changes
- [ ] Loading skeletons match component layout

---

### Phase 2: Component Refactoring (Sprint 2-3 - 4 weeks)

#### TD-005: Decompose EnhancedTeamRoster
**Priority:** Medium
**Description:** Extract presentation components and business logic from 222-line component
**Impact:** Improves testability and maintainability
**Effort:** Medium (10-14 hours)
**Files:** `components/enhanced-team-roster.tsx` → multiple files
**Acceptance Criteria:**
- [ ] `RosterCard` presentation component created
- [ ] `RosterTabs` presentation component created
- [ ] `useRosterPlayers` hook created with business logic
- [ ] Main component reduced to <80 lines
- [ ] Unit tests added for hook and components

---

#### TD-006: Simplify RecentActivity
**Priority:** Medium
**Description:** Extract transaction analysis logic into service and custom hook
**Impact:** Reduces component from 457 to ~100 lines
**Effort:** Medium (10-12 hours)
**Files:** `components/recent-activity.tsx` → multiple files
**Acceptance Criteria:**
- [ ] `TransactionAnalyzer` service created
- [ ] `useTransactions` hook created
- [ ] Component simplified to UI orchestration only
- [ ] Unit tests added for analyzer service

---

#### TD-007: Extract Shared Components
**Priority:** Low
**Description:** Create reusable loading skeletons, empty states, and error displays
**Impact:** Reduces code duplication, improves consistency
**Effort:** Small (6-8 hours)
**Files:** `components/ui/loading-skeleton.tsx`, `components/ui/empty-state.tsx`
**Acceptance Criteria:**
- [ ] `LoadingSkeleton` component with variants created
- [ ] `EmptyState` component created
- [ ] All duplicated loading/empty code replaced
- [ ] Storybook stories added for all variants

---

### Phase 3: Testing & Infrastructure (Sprint 4-5 - 4 weeks)

#### TD-008: Add Hook Testing
**Priority:** High
**Description:** Add unit tests for all custom hooks
**Impact:** Enables confident refactoring, catches regressions
**Effort:** Large (20-30 hours)
**Files:** `hooks/__tests__/*.test.ts`
**Acceptance Criteria:**
- [ ] Tests for `useDashboardData` (201 lines)
- [ ] Tests for `useLeagueSelection` (157 lines)
- [ ] Tests for `useLoadingStates` (77 lines)
- [ ] 80%+ code coverage for hooks
- [ ] CI/CD integration for tests

---

#### TD-009: Add Component Testing
**Priority:** Medium
**Description:** Add React Testing Library tests for presentation components
**Impact:** Prevents UI regressions
**Effort:** Large (20-30 hours)
**Files:** `components/__tests__/*.test.tsx`
**Acceptance Criteria:**
- [ ] Tests for `LeagueOverview`
- [ ] Tests for `StandingsTable`
- [ ] Tests for extracted presentation components
- [ ] Accessibility tests with jest-axe
- [ ] 70%+ code coverage for components

---

#### TD-010: Add Versioned Storage
**Priority:** Low
**Description:** Add version management and migration strategy for localStorage
**Impact:** Prevents data corruption on schema changes
**Effort:** Small (6-8 hours)
**Files:** `lib/storage/versioned-storage.ts`, `hooks/use-dashboard-data.ts`
**Acceptance Criteria:**
- [ ] `versioned-storage.ts` utility created
- [ ] Migration system implemented
- [ ] `useDashboardData` migrated to versioned storage
- [ ] Migration tests added

---

#### TD-011: Standardize Loading States
**Priority:** Low
**Description:** Rename all loading state variables to `isLoading` for consistency
**Impact:** Improves code readability
**Effort:** Small (2-3 hours)
**Files:** All hooks and components
**Acceptance Criteria:**
- [ ] All hooks use `isLoading` naming
- [ ] All components use `isLoading` naming
- [ ] TypeScript errors resolved
- [ ] No regression in functionality

---

#### TD-012: Remove Debug Code
**Priority:** Low
**Description:** Extract inline debug code to reusable DebugPanel component
**Impact:** Cleaner production code, smaller bundle
**Effort:** Small (2-3 hours)
**Files:** `components/dev/debug-panel.tsx`, `app/dashboard/page.tsx`
**Acceptance Criteria:**
- [ ] `DebugPanel` component created
- [ ] All inline debug code replaced
- [ ] Tree-shaking verified (no debug code in production bundle)

---

#### TD-013: Add Optimistic Updates
**Priority:** Low
**Description:** Add optimistic UI updates for predictable mutations
**Impact:** Improved perceived performance
**Effort:** Small (4-6 hours)
**Files:** `hooks/use-dashboard-data.ts`
**Acceptance Criteria:**
- [ ] Optimistic updates for league removal
- [ ] Rollback logic for errors
- [ ] Toast notifications for success/failure
- [ ] No visual flicker during updates

---

## Migration Roadmap

### Sprint 1 (Week 1-2): Critical Stability
**Goal:** Eliminate critical bugs and crashes

**Week 1:**
- [ ] TD-001: Add Error Boundaries (6h)
- [ ] TD-002: Fix Race Condition (6h)
- [ ] TD-004: Add Suspense Boundaries (6h)

**Week 2:**
- [ ] TD-003: Split PlayerDataContext (12h)
- [ ] Testing and validation

**Deliverables:**
- Stable dashboard with no race conditions
- Error boundaries preventing crashes
- Improved loading UX with Suspense

**Success Metrics:**
- 0 reported race condition bugs
- Error boundary catches 100% of component errors
- LCP remains <2.5s (79% improvement maintained)

---

### Sprint 2-3 (Week 3-6): Component Architecture
**Goal:** Improve component maintainability and testability

**Week 3-4:**
- [ ] TD-005: Decompose EnhancedTeamRoster (14h)
- [ ] TD-007: Extract Shared Components (8h)

**Week 5-6:**
- [ ] TD-006: Simplify RecentActivity (12h)
- [ ] TD-011: Standardize Loading States (3h)
- [ ] TD-012: Remove Debug Code (3h)

**Deliverables:**
- EnhancedTeamRoster <80 lines
- RecentActivity <100 lines
- Reusable loading/empty state components
- Consistent naming conventions

**Success Metrics:**
- Average component size <150 lines
- 0 components >200 lines
- Storybook with 15+ component variants

---

### Sprint 4-5 (Week 7-10): Testing Infrastructure
**Goal:** Establish testing foundation for confident refactoring

**Week 7-8:**
- [ ] TD-008: Add Hook Testing (30h)

**Week 9-10:**
- [ ] TD-009: Add Component Testing (30h)
- [ ] TD-010: Add Versioned Storage (8h)
- [ ] TD-013: Add Optimistic Updates (6h)

**Deliverables:**
- 80% hook test coverage
- 70% component test coverage
- Versioned storage system
- Optimistic UI updates

**Success Metrics:**
- CI/CD tests pass on every PR
- <5 minute test suite runtime
- 0 regressions in production

---

## Conclusion

The Dashboard architecture is **solid for current scale (11 pages)** but has clear technical debt that will impede growth to 10+ pages. The refactoring roadmap provides a systematic path to:

1. **Immediate stability** (Sprint 1): Fix race conditions, add error boundaries
2. **Long-term maintainability** (Sprint 2-3): Decompose complex components
3. **Sustainable growth** (Sprint 4-5): Add testing infrastructure

**Recommended Next Steps:**

1. **Start with TD-001, TD-002, TD-003** (Critical fixes)
2. **Measure performance improvement** with React DevTools Profiler
3. **Add testing gradually** as components are refactored
4. **Revisit state management** if scaling beyond 15 pages

**Key Principle:**
> "Refactor toward testability. If it's hard to test, it's poorly designed."

---

**Appendix: Architecture Decision Records**

### ADR-001: Custom Hooks Over Redux
**Decision:** Use custom hooks for state management
**Context:** Small app (11 pages), simple state requirements
**Consequences:** Good developer experience, low learning curve, but won't scale to 20+ pages
**Review Date:** When app reaches 15 pages

### ADR-002: Context for Global State
**Decision:** Use React Context for PlayerData and Projections
**Context:** Data needed across many components
**Consequences:** Simple to implement, but performance concerns at scale
**Review Date:** If re-render issues detected in profiling

### ADR-003: Dynamic Imports for Code Splitting
**Decision:** Use Next.js dynamic imports for tab components
**Context:** Dashboard tabs contain heavy components
**Consequences:** 79% LCP improvement, but custom loading states needed
**Review Date:** Migrate to Suspense boundaries (TD-004)

---

**Review Conducted By:** React Principal Architect
**Review Date:** 2025-10-25
**Next Review:** After Sprint 1 completion (2 weeks)
