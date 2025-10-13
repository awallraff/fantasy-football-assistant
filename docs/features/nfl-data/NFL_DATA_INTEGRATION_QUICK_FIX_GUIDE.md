# NFL Data Integration - Quick Fix Guide

**For Developers: How to Fix Common Issues**

---

## Issue 1: "Users see empty tables with no error message"

### Symptom
- User selects 2025 season → sees empty table
- Console shows error but UI shows nothing
- Loading spinner disappears, table is empty

### Root Cause
Error in `data.error` field but component doesn't display it

### Quick Fix (5 minutes)

**File:** Component using `use-nfl-data-fetch.ts`

```typescript
// BEFORE:
const { data, loading, error } = useNFLDataFetch({ /* ... */ })

if (loading) return <LoadingSpinner />
if (!data) return null

return <DataTable data={data.weekly_stats} />

// AFTER:
const { data, loading, error } = useNFLDataFetch({ /* ... */ })

if (loading) return <LoadingSpinner />

// CHECK ERROR FIRST
if (error) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Failed to load NFL data</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  )
}

// CHECK DATA.ERROR
if (data?.error) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Data fetch error</AlertTitle>
      <AlertDescription>{data.error}</AlertDescription>
    </Alert>
  )
}

if (!data) return null

return <DataTable data={data.weekly_stats} />
```

---

## Issue 2: "TypeError: Cannot read property 'player_name' of undefined"

### Symptom
- Component crashes when rendering player data
- Console shows: `Cannot read property 'player_name' of undefined`

### Root Cause
Column name mismatch: Python returns `player_display_name` but code expects `player_name`

### Quick Fix (2 minutes)

**In component:**

```typescript
// BEFORE:
<div>{player.player_name}</div>

// AFTER (until normalization layer is added):
<div>{player.player_name || player.player_display_name || 'Unknown Player'}</div>
```

**In TypeScript interface:**

```typescript
// Add optional variations:
interface NFLWeeklyStats {
  player_id: string
  player_name?: string
  player_display_name?: string  // ADD THIS
  team?: string
  recent_team?: string           // ADD THIS
  position?: string
  fantasy_pos?: string           // ADD THIS
  // ...
}

// Helper function:
function getPlayerName(stat: NFLWeeklyStats): string {
  return stat.player_name || stat.player_display_name || 'Unknown'
}

function getTeam(stat: NFLWeeklyStats): string {
  return stat.team || stat.recent_team || stat.team_abbr || 'FA'
}
```

---

## Issue 3: "404 Error when fetching 2025 data"

### Symptom
- User selects 2025 season
- Request returns 404
- No data shown

### Root Cause
`nfl_data_py` doesn't have 2025 data yet (season hasn't happened)

### Quick Fix (10 minutes)

**File:** `components/nfl-data-manager.tsx` (or wherever year selection is)

```typescript
// Add validation BEFORE making API call:
const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth()

// NFL season starts in September (month 8)
const latestAvailableYear = currentMonth >= 8 ? currentYear : currentYear - 1

function validateYearSelection(years: number[]): { valid: boolean; message?: string } {
  const invalidYears = years.filter(y => y > latestAvailableYear)

  if (invalidYears.length > 0) {
    return {
      valid: false,
      message: `Data not available for ${invalidYears.join(', ')}. Latest available year: ${latestAvailableYear}`
    }
  }

  return { valid: true }
}

// Before making API call:
const validation = validateYearSelection(selectedYears)
if (!validation.valid) {
  setError(validation.message!)
  return
}
```

**Better: Update default year**

```typescript
// BEFORE:
const [selectedYears, setSelectedYears] = useState(['2025'])

// AFTER:
const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth()
const defaultYear = currentMonth >= 8 ? currentYear : currentYear - 1

const [selectedYears, setSelectedYears] = useState([defaultYear.toString()])
```

---

## Issue 4: "Request timeout after 2 minutes"

### Symptom
- Large data request (multiple years, all positions)
- Loading for 2+ minutes
- Then fails with timeout error

### Root Cause
Python script takes too long to fetch data

### Quick Fix (2 minutes)

**Option A: Increase timeout**

```typescript
// In use-nfl-data-fetch.ts or API call:
const response = await fetch(`/api/nfl-data?${params}`, {
  signal: AbortSignal.timeout(300000) // 5 minutes instead of 2
})
```

**Option B: Reduce scope (recommended)**

```typescript
// Warn user before large requests:
function estimateRequestTime(years: number[], positions: string[]): number {
  // Rough estimate: 30 seconds per year * positions
  return years.length * positions.length * 30
}

const estimatedTime = estimateRequestTime(selectedYears, selectedPositions)

if (estimatedTime > 120) {
  return (
    <Alert variant="warning">
      <AlertTitle>Large request detected</AlertTitle>
      <AlertDescription>
        This request may take {Math.round(estimatedTime / 60)} minutes.
        Consider selecting fewer years or positions.
      </AlertDescription>
    </Alert>
  )
}
```

---

## Issue 5: "Python script fails with 'KeyError: team'"

### Symptom
- API returns error: `KeyError: 'team'`
- Only happens for certain years/positions

### Root Cause
nfl_data_py returns different columns for different years

### Quick Fix (Already partially fixed in commit 427fbaf, but here's the pattern)

**File:** `python-api/main.py` or `scripts/nfl_data_extractor.py`

```python
# BEFORE:
aggregated_df = weekly_df.groupby(['player_id', 'player_name', 'team']).agg(...)

# AFTER:
groupby_cols = ['player_id']
if 'player_name' in weekly_df.columns:
    groupby_cols.append('player_name')
if 'team' in weekly_df.columns:
    groupby_cols.append('team')
elif 'recent_team' in weekly_df.columns:
    groupby_cols.append('recent_team')

aggregated_df = weekly_df.groupby(groupby_cols).agg(...)
```

**Pattern:**
Always check if column exists before using it:

```python
# Pattern for accessing columns:
team_col = None
for col_name in ['team', 'recent_team', 'team_abbr']:
    if col_name in df.columns:
        team_col = col_name
        break

if team_col:
    # Use team_col instead of hardcoded 'team'
    teams = df[team_col].unique()
```

---

## Issue 6: "External Python API returns 500 error"

### Symptom
- External API (Render) returns 500
- Works locally but not in production

### Root Cause
- Python API doesn't have required packages
- Environment variable not set
- Memory limit exceeded

### Quick Fix (Depends on cause)

**Check 1: Environment Variables**

```bash
# In Render dashboard, verify:
PORT=8000  # Should be set
NFL_DATA_API_URL=https://your-python-api.onrender.com  # In Next.js app
```

**Check 2: Python Dependencies**

```bash
# In python-api/requirements.txt, ensure:
fastapi==0.109.0
uvicorn==0.27.0
nfl-data-py==0.3.2
pandas==2.1.4
```

**Check 3: Memory Limits**

```python
# In python-api/main.py, limit data:
@app.get("/api/nfl-data/extract")
def extract_nfl_data(...):
    # BEFORE: Allow any year range
    year_list = [int(y.strip()) for y in years.split(',')]

    # AFTER: Limit to prevent memory issues
    year_list = [int(y.strip()) for y in years.split(',')]
    if len(year_list) > 3:
        raise HTTPException(
            status_code=400,
            detail="Maximum 3 years allowed per request"
        )
```

---

## Issue 7: "TypeError: Cannot read property 'map' of undefined"

### Symptom
- Component crashes when trying to render data
- Console: `Cannot read property 'map' of undefined`

### Root Cause
Component assumes `data.weekly_stats` exists but API returned error

### Quick Fix (2 minutes)

```typescript
// BEFORE:
<Table>
  {data.weekly_stats.map(stat => (
    <Row key={stat.player_id} {...stat} />
  ))}
</Table>

// AFTER:
<Table>
  {data?.weekly_stats?.map(stat => (
    <Row key={stat.player_id} {...stat} />
  )) || (
    <EmptyState message="No data available" />
  )}
</Table>

// BETTER: Check before rendering
if (!data?.weekly_stats || data.weekly_stats.length === 0) {
  return <EmptyState message="No data available" />
}

return (
  <Table>
    {data.weekly_stats.map(stat => (
      <Row key={stat.player_id} {...stat} />
    ))}
  </Table>
)
```

---

## Common Patterns

### Pattern 1: Safe Property Access

```typescript
// Instead of:
const name = player.player_name
const team = player.team

// Use:
const name = player.player_name || player.player_display_name || 'Unknown'
const team = player.team || player.recent_team || player.team_abbr || 'FA'
const position = player.position || player.fantasy_pos || 'UNKNOWN'
```

### Pattern 2: Validate Before Using

```typescript
// Instead of:
const totalPoints = data.weekly_stats.reduce((sum, stat) => sum + stat.fantasy_points_ppr, 0)

// Use:
const totalPoints = data?.weekly_stats?.reduce(
  (sum, stat) => sum + (stat.fantasy_points_ppr || 0),
  0
) || 0
```

### Pattern 3: Error Display

```typescript
// Always show errors to users:
if (error) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {error}
        <Button onClick={retry} className="mt-2">Try Again</Button>
      </AlertDescription>
    </Alert>
  )
}
```

### Pattern 4: Loading States

```typescript
// Show what's happening:
if (loading) {
  return (
    <div className="text-center py-8">
      <Spinner />
      <p className="mt-2 text-sm text-muted-foreground">
        Fetching NFL data for {selectedYears.join(', ')}...
        This may take up to 2 minutes.
      </p>
    </div>
  )
}
```

---

## Prevention Checklist

Before deploying NFL data features:

- [ ] Error states displayed to users (not just console.error)
- [ ] Column name variations handled (player_name || player_display_name)
- [ ] Year validation prevents 404s (don't allow future years)
- [ ] Loading states show progress/ETA
- [ ] Empty data states have helpful messages
- [ ] Retry buttons for transient errors
- [ ] Optional chaining for all data access (data?.weekly_stats?.map)
- [ ] Fallback values for all calculations
- [ ] Type guards before .map, .filter, .reduce
- [ ] Error boundaries wrap data components

---

## When to Escalate

Contact the Principal Software Architect if:

1. **Python API returns unexpected columns** - May need normalization layer
2. **Errors occur for specific years** - May need Python library update
3. **Performance issues persist** - May need caching layer
4. **Schema changes break multiple components** - Need validation layer (see full architecture review)

---

## Long-term Solution

These quick fixes address symptoms. For root cause solutions, see:

- `NFL_DATA_INTEGRATION_ARCHITECTURE_REVIEW.md` - Full technical details
- `NFL_DATA_INTEGRATION_EXECUTIVE_SUMMARY.md` - High-level plan
- TODO list in Claude Code session - Implementation tasks

**Estimated time to permanent fix:** 2 sprints (52 hours)

---

## Quick Reference

| Problem | File | Line | Quick Fix |
|---------|------|------|-----------|
| Empty tables | Component | N/A | Display `error` and `data.error` |
| Column name errors | Component | N/A | Use `player.player_name \|\| player.player_display_name` |
| 2025 data 404 | Year selector | N/A | Default to `currentYear - 1` |
| Timeout | API call | N/A | Increase timeout or reduce scope |
| KeyError in Python | Python script | N/A | Check if column exists before using |
| External API 500 | Render | N/A | Check env vars, dependencies, memory |
| Cannot read property | Component | N/A | Use optional chaining `data?.weekly_stats?.map` |

---

**Document Version:** 1.0
**Last Updated:** 2025-10-10
**Status:** Quick reference for immediate issues
