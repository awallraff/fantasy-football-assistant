# Chrome DevTools Testing Guide

**Fantasy Football Assistant - Manual Testing Reference**

This guide provides step-by-step instructions for testing the Fantasy Football Assistant using Chrome DevTools. Use this for browser-based testing, debugging cache behavior, and verifying user-facing features.

---

## Table of Contents

1. [Test Data & Credentials](#test-data--credentials)
2. [Initial Setup](#initial-setup)
3. [Testing Core Features](#testing-core-features)
4. [Cache Testing (IndexedDB)](#cache-testing-indexeddb)
5. [Performance Testing](#performance-testing)
6. [Network Testing](#network-testing)
7. [Mobile Testing](#mobile-testing)
8. [Common Issues & Debugging](#common-issues--debugging)

---

## Test Data & Credentials

### Sleeper Test Account

**Username:** `Wallreezy`

- **User ID:** (auto-fetched from API)
- **Leagues:** Multiple dynasty and redraft leagues
- **Use Case:** Primary test account with real league data
- **Why This Account:** Active leagues with roster data, trades, and historical activity

---

## Initial Setup

### 1. Open Chrome DevTools

**Keyboard Shortcuts:**
- Windows/Linux: `F12` or `Ctrl + Shift + I`
- Mac: `Cmd + Option + I`

**Or:** Right-click page → "Inspect"

### 2. Configure DevTools for Testing

**Recommended Layout:**
1. **Panel Position:** Bottom or Right (Settings → Preferences → Panel layout)
2. **Enable:** Settings → Experiments → "Show option to expose internals in heap snapshots"
3. **Disable:** Settings → Network → "Disable cache (while DevTools is open)" [For cache testing]

### 3. Key Panels to Use

- **Console:** Debug logs, cache inspection, manual API testing
- **Application:** IndexedDB cache inspection, localStorage viewing
- **Network:** API request monitoring, performance analysis
- **Performance:** Core Web Vitals, rendering performance
- **Mobile Emulation:** Responsive testing (375px viewport)

---

## Testing Core Features

### Feature 1: User Connection (Home Page)

**URL:** `https://dynastyff.vercel.app/`

**Test Steps:**

1. **Open Console** (`Console` tab)
2. **Clear Storage** (optional for fresh test):
   ```javascript
   localStorage.clear()
   indexedDB.deleteDatabase('fantasy-football-cache')
   location.reload()
   ```

3. **Enter Username:** `Wallreezy`

4. **Verify in Console:**
   ```javascript
   // Check user loaded
   console.log(localStorage.getItem('sleeper_user'))

   // Should see: {"user_id":"...","username":"wallreezy",...}
   ```

5. **Expected Behavior:**
   - ✅ Loading indicator appears
   - ✅ User leagues fetched (2025, 2024, 2023)
   - ✅ Redirect to `/dashboard`
   - ✅ No console errors

**Common Issues:**
- ❌ "User not found" → Check username spelling (case-insensitive)
- ❌ Infinite loading → Check Network tab for failed API calls
- ❌ Console errors → Check for CORS issues or API rate limiting

---

### Feature 2: Dashboard - League Selection

**URL:** `https://dynastyff.vercel.app/dashboard`

**Pre-Requisites:** Must be logged in as `Wallreezy`

**Test Steps:**

1. **Verify Year Selector:**
   - Default: 2025 (current year)
   - Click year dropdown → Should show: 2025, 2024, 2023

2. **Select a League:**
   - Click any league card
   - Verify loading state
   - Wait for roster data to populate

3. **Check Console Debug:**
   ```javascript
   // View loaded leagues
   console.log(JSON.parse(localStorage.getItem('sleeper_leagues')))

   // View selected league state
   console.table(/* league data */)
   ```

4. **Expected Behavior:**
   - ✅ League name and settings displayed
   - ✅ Teams tab shows all rosters
   - ✅ Current user's roster sorted first
   - ✅ Trade history loads (if available)

**Validation Checks:**
- Roster count matches league size
- All team owners have matching usernames
- No orphaned rosters (console warning if found)

---

### Feature 3: Rankings Page

**URL:** `https://dynastyff.vercel.app/rankings`

**Test Steps:**

1. **Initial Load:**
   - Verify default data source (FantasyPros, ESPN, etc.)
   - Check position filter (All, QB, RB, WR, TE)

2. **Test Player Search:**
   ```
   Search: "Christian McCaffrey"
   Expected: Player card with position, team, rank
   ```

3. **Test Filtering:**
   - Position: QB → Should show only quarterbacks
   - Source: Switch between ranking systems
   - Verify table updates dynamically

4. **Console Validation:**
   ```javascript
   // Check if rankings loaded
   console.log('Rankings loaded:', document.querySelectorAll('.player-card').length)
   ```

5. **Expected Behavior:**
   - ✅ Rankings load within 2 seconds
   - ✅ Search is case-insensitive and instant
   - ✅ Position badges color-coded
   - ✅ Horizontal scroll works on mobile

**Performance Check:**
- Rankings table should render < 1 second
- Scrolling should be smooth (no janky frames)
- Search input should respond instantly (< 100ms)

---

### Feature 4: Trade History

**URL:** `https://dynastyff.vercel.app/trades`

**Pre-Requisites:** League with trade history selected in dashboard

**Test Steps:**

1. **Verify Trade List:**
   - Check if trades are sorted by date (newest first)
   - Verify "X days ago" timestamps are accurate

2. **Inspect Trade Details:**
   - Click a trade to expand
   - Verify both sides show player names
   - Check draft picks (if included)

3. **Console Debug:**
   ```javascript
   // View raw trade data
   console.log('Trade history:', /* data from state */)

   // Check for transaction IDs
   document.querySelectorAll('[data-trade-id]').forEach(el =>
     console.log('Trade ID:', el.dataset.tradeId)
   )
   ```

4. **Expected Behavior:**
   - ✅ All trades from current season displayed
   - ✅ Player names resolve correctly
   - ✅ Empty state shows if no trades
   - ✅ Draft picks formatted (e.g., "2024 1st Round")

**Edge Cases to Test:**
- League with no trades → Shows empty state
- Trade with unknown player ID → Shows placeholder
- Multi-team trade (3+ teams) → All sides displayed

---

## Cache Testing (IndexedDB)

### Overview

The app uses **IndexedDB** for persistent caching to improve performance and reduce API calls.

**Cache Stores:**
- `user-cache`: Sleeper user data (TTL: 24 hours)
- `league-cache`: League metadata (TTL: 1 hour)
- `roster-cache`: Team rosters (TTL: 30 minutes)
- `player-cache`: Global player data (TTL: 24 hours)
- `nfl-data-cache`: Historical NFL stats (TTL: 7 days)

### Accessing Cache in DevTools

1. **Open Application Tab**
2. **Expand "Storage" → "IndexedDB"**
3. **Select Database:** `fantasy-football-cache`
4. **View Stores:**
   - Click each store to view entries
   - Columns: `key`, `value`, `timestamp`, `expiresAt`

### Test 1: Cache Hit vs Cache Miss

**Scenario:** Test performance improvement from cache

**Steps:**

1. **Cold Start (No Cache):**
   ```javascript
   // Clear all caches
   indexedDB.deleteDatabase('fantasy-football-cache')
   localStorage.clear()
   location.reload()
   ```

2. **Measure First Load:**
   - Open Network tab
   - Filter: `fetch/xhr`
   - Navigate to `/dashboard`
   - Count API calls: _____ requests
   - Note load time: _____ ms

3. **Warm Start (With Cache):**
   - Reload page (`Ctrl + R`)
   - Count API calls: _____ requests (should be fewer)
   - Note load time: _____ ms (should be faster)

4. **Expected Results:**
   - 🎯 70% reduction in API calls on warm load
   - 🎯 2-3x faster dashboard load time
   - 🎯 No visual difference in displayed data

### Test 2: Cache Expiration

**Scenario:** Verify stale data is refreshed

**Steps:**

1. **View Cache Entry:**
   - Application → IndexedDB → `league-cache`
   - Find any entry, note `expiresAt` timestamp

2. **Manually Expire Cache:**
   ```javascript
   // Open Console
   indexedDBDebug.expireCache('league-cache')
   ```

3. **Reload Page:**
   - Network tab should show fresh API calls
   - Cache should repopulate with new `expiresAt`

4. **Expected Behavior:**
   - ✅ Expired cache triggers API fetch
   - ✅ New data cached with updated expiry
   - ✅ No errors in console

### Test 3: Cache Invalidation (Manual)

**Scenario:** Force refresh of cached data

**Steps:**

1. **Open Console:**
   ```javascript
   // Invalidate specific cache
   indexedDBDebug.clear('roster-cache')

   // Or invalidate all caches
   indexedDBDebug.clearAll()
   ```

2. **Navigate to Dashboard:**
   - Should fetch fresh roster data
   - Cache should repopulate

3. **Verify in Application Tab:**
   - Check `roster-cache` has new entries
   - Timestamps should be current

### Cache Debug Commands (Console)

The app includes debug utilities for testing cache behavior:

```javascript
// Test cache operations
await indexedDBDebug.test()

// View cache statistics
await indexedDBDebug.stats()

// Clear specific cache
await indexedDBDebug.clear('player-cache')

// Clear all caches
await indexedDBDebug.clearAll()

// Force cache expiration (for testing)
await indexedDBDebug.expireCache('user-cache')
```

**Note:** These commands are only available in development builds or when `localStorage.setItem('debug', 'true')` is set.

---

## Performance Testing

### Core Web Vitals Testing

**Goal:** Ensure app meets Google's performance standards

**Test Location:** Performance tab → Lighthouse

**Steps:**

1. **Open Lighthouse:**
   - Right-click page → "Inspect" → "Lighthouse" tab
   - Device: Mobile
   - Categories: Performance, Accessibility

2. **Run Audit:**
   - Click "Analyze page load"
   - Wait for report (~30 seconds)

3. **Target Metrics:**
   - ✅ **LCP (Largest Contentful Paint):** < 2.5s
   - ✅ **FID (First Input Delay):** < 100ms
   - ✅ **CLS (Cumulative Layout Shift):** < 0.1
   - ✅ **Performance Score:** > 90

4. **Common Issues:**
   - ❌ LCP > 2.5s → Check image optimization, API latency
   - ❌ CLS > 0.1 → Check for layout shifts (missing width/height)
   - ❌ FID > 100ms → Check for blocking JavaScript

### Manual Performance Testing

**Test: Dashboard Load Time**

1. **Throttle Network (Simulated 3G):**
   - Network tab → "Throttling" → "Slow 3G"

2. **Measure Load:**
   ```javascript
   // Console timing
   performance.mark('start')
   // Navigate to dashboard
   performance.mark('end')
   performance.measure('dashboard-load', 'start', 'end')
   console.log(performance.getEntriesByName('dashboard-load')[0].duration)
   ```

3. **Target:** < 5 seconds on Slow 3G

**Test: Rankings Scroll Performance**

1. **Open Performance Tab**
2. **Click "Record" (circle icon)**
3. **Scroll rankings table rapidly for 5 seconds**
4. **Stop recording**
5. **Check FPS:**
   - Target: > 55 FPS average
   - No red bars (dropped frames)

---

## Network Testing

### Monitoring API Calls

**Goal:** Verify API behavior, caching, and error handling

**Steps:**

1. **Open Network Tab**
2. **Filter:** `fetch/xhr` (API calls only)
3. **Preserve Log:** Check "Preserve log" (keeps history on navigation)

### Test 1: Sleeper API Rate Limiting

**Background:** Sleeper API has rate limits (unknown specifics)

**Test Steps:**

1. **Rapidly Reload Dashboard:**
   - Press `Ctrl + Shift + R` multiple times (5-10x)
   - Watch Network tab for `429 Too Many Requests`

2. **Expected Behavior:**
   - ✅ App should retry with exponential backoff
   - ✅ User should see loading state (not error)
   - ✅ Eventually succeeds after backoff

3. **Console Log:**
   ```
   Retrying request... attempt 2/5
   Retrying request... attempt 3/5
   Request succeeded after 2 retries
   ```

**Debug:**
- If app fails after 5 retries → Check `lib/api-retry.ts`
- If no retry attempted → Check API call is wrapped with retry logic

### Test 2: Offline Behavior

**Scenario:** Test app behavior with no network

**Steps:**

1. **Open Network Tab**
2. **Throttling → "Offline"**
3. **Navigate to Dashboard**

4. **Expected Behavior:**
   - ✅ Shows error message: "Unable to connect. Check your internet."
   - ✅ "Retry" button appears
   - ✅ No infinite loading state

5. **Re-Enable Network:**
   - Throttling → "Online"
   - Click "Retry" → Should load successfully

### Test 3: Slow Network Performance

**Scenario:** Verify app usability on slow connections

**Steps:**

1. **Network Tab → Throttling → "Slow 3G"**
2. **Clear Cache:**
   ```javascript
   indexedDB.deleteDatabase('fantasy-football-cache')
   ```

3. **Load Dashboard:**
   - Time to interactive: _____
   - Time to first paint: _____

4. **Target Metrics:**
   - ✅ Skeleton loaders visible within 500ms
   - ✅ Content loaded within 5 seconds
   - ✅ Page remains responsive during load

---

## Mobile Testing

### Responsive Design Testing

**Goal:** Ensure mobile-first design works on all devices

**Primary Target:** iPhone SE (375px width)

**Steps:**

1. **Open Device Toolbar:**
   - Click phone/tablet icon (top-left of DevTools)
   - Or: `Ctrl + Shift + M`

2. **Select Device:**
   - Dropdown → "iPhone SE" (375x667)
   - Or custom: 375px width

3. **Test All Pages:**
   - Home: Username input, button sizing
   - Dashboard: League cards, navigation
   - Rankings: Table horizontal scroll
   - Trades: Trade cards, expandable sections

### Touch Target Testing

**Requirement:** All interactive elements ≥ 44px touch target

**Steps:**

1. **Enable Rulers:**
   - Settings → Show rulers

2. **Inspect Elements:**
   ```javascript
   // Console: Check touch target sizes
   document.querySelectorAll('button, a, input').forEach(el => {
     const rect = el.getBoundingClientRect()
     if (rect.width < 44 || rect.height < 44) {
       console.warn('Touch target too small:', el, rect)
     }
   })
   ```

3. **Expected:**
   - ✅ No warnings in console
   - ✅ All buttons easy to tap with thumb
   - ✅ No accidental adjacent tap hits

### Mobile Viewport Testing

**Test Multiple Devices:**

1. **iPhone SE (375px)** - Minimum width
2. **iPhone 14 Pro (393px)** - Common iPhone
3. **Galaxy S20 (360px)** - Common Android
4. **iPad Air (820px)** - Tablet landscape

**Verification:**
- ✅ No horizontal scroll (except data tables)
- ✅ Text readable without zoom
- ✅ Images don't overflow container
- ✅ Navigation accessible and functional

---

## Common Issues & Debugging

### Issue 1: "User not found" Error

**Symptoms:**
- Error message after entering username
- Network tab shows 404 from Sleeper API

**Debug Steps:**

1. **Check API Response:**
   - Network → Find `https://api.sleeper.app/v1/user/[username]`
   - Click → Response tab
   - If null → User doesn't exist

2. **Test with Known User:**
   - Try: `Wallreezy`
   - Should return user object

3. **Common Causes:**
   - Typo in username
   - Account deleted/deactivated
   - Sleeper API outage (check status.sleeper.com)

### Issue 2: Dashboard Shows "No Leagues"

**Symptoms:**
- User loads successfully
- Dashboard shows empty state

**Debug Steps:**

1. **Check localStorage:**
   ```javascript
   const leagues = JSON.parse(localStorage.getItem('sleeper_leagues'))
   console.log('Leagues:', leagues)
   ```

2. **Check API Response:**
   - Network → Find `getUserLeagues` call
   - Check if response is empty array: `[]`

3. **Common Causes:**
   - User has no leagues for selected year
   - Try switching years (2024, 2023)
   - User left all leagues

**Fix:**
- Have user join a league on Sleeper.com
- Or test with `Wallreezy` (has multiple leagues)

### Issue 3: Rankings Not Loading

**Symptoms:**
- Infinite loading spinner
- Console errors related to player data

**Debug Steps:**

1. **Check Console:**
   - Look for error messages
   - Common: "Failed to fetch player data"

2. **Check Network:**
   - Network → Find `/players/nfl` call
   - Should return large JSON object (all NFL players)

3. **Check Cache:**
   - Application → IndexedDB → `player-cache`
   - If corrupted, clear: `indexedDBDebug.clear('player-cache')`

4. **Common Causes:**
   - Sleeper API outage
   - Corrupted cache
   - Network timeout

### Issue 4: Trades Not Appearing

**Symptoms:**
- Trade history page empty
- But league has trades

**Debug Steps:**

1. **Check API:**
   - Network → Find `transactions` or `trades` call
   - Verify response has trade data

2. **Check League Selection:**
   - Ensure league is selected in dashboard first
   - Trade history only loads for selected league

3. **Console Validation:**
   ```javascript
   // Check if league ID is set
   console.log('Selected league:', localStorage.getItem('selected_league_id'))
   ```

4. **Common Causes:**
   - No league selected
   - League has no trades this season
   - API only returns current season trades

### Issue 5: Cache Not Working

**Symptoms:**
- Every page load fetches all data (Network tab flooded)
- No entries in IndexedDB

**Debug Steps:**

1. **Check IndexedDB Support:**
   ```javascript
   console.log('IndexedDB supported:', !!window.indexedDB)
   ```

2. **Check for Errors:**
   - Console → Filter: "indexedDB"
   - Look for permission errors

3. **Check Browser Settings:**
   - Chrome → Settings → Privacy → Site Settings
   - Ensure cookies/storage allowed for site

4. **Test Cache Manually:**
   ```javascript
   await indexedDBDebug.test()
   // Should log: "✅ All cache tests passed"
   ```

5. **Common Causes:**
   - Private/Incognito mode (IndexedDB disabled)
   - Browser storage quota exceeded
   - Cache implementation bug

---

## Testing Checklist

Use this checklist for comprehensive manual testing:

### Smoke Test (Quick Validation)

- [ ] Home page loads without errors
- [ ] Can connect with username: `Wallreezy`
- [ ] Dashboard shows leagues
- [ ] Can select a league and view rosters
- [ ] Rankings page loads player data
- [ ] No console errors on any page

### Full Regression Test (Pre-Deployment)

**User Flow:**
- [ ] Fresh browser (cleared cache/localStorage)
- [ ] Connect with `Wallreezy`
- [ ] Select 2025 league
- [ ] View Teams tab (rosters load)
- [ ] Switch to Trade History tab
- [ ] Navigate to Rankings
- [ ] Search for "Christian McCaffrey"
- [ ] Filter by position (QB)
- [ ] Navigate to More → Settings
- [ ] Test year switcher (2024, 2023)
- [ ] Back button navigation works
- [ ] Logout and reconnect

**Cache Testing:**
- [ ] Reload dashboard (should be instant)
- [ ] Check IndexedDB has entries
- [ ] Force cache clear → Reloads data
- [ ] Cache respects TTL expiration

**Mobile Testing:**
- [ ] Test on iPhone SE viewport (375px)
- [ ] All touch targets ≥ 44px
- [ ] No horizontal scroll (except tables)
- [ ] Navigation accessible
- [ ] Text readable without zoom

**Performance:**
- [ ] Lighthouse score > 90 (mobile)
- [ ] Dashboard loads < 2 seconds
- [ ] Rankings scroll smooth (> 55 FPS)
- [ ] No layout shifts (CLS < 0.1)

**Error Handling:**
- [ ] Test offline mode → Shows error + retry
- [ ] Test invalid username → Shows error
- [ ] Test slow network (Slow 3G) → Loads within 5s

---

## Advanced Testing Scenarios

### Scenario 1: Multi-League User

**Goal:** Verify app handles users with many leagues

**Test User:** `Wallreezy` (has 5+ leagues)

**Steps:**
1. Connect as Wallreezy
2. Dashboard should show all leagues grouped by year
3. Switch between years (2025, 2024, 2023)
4. Verify each year shows correct leagues
5. Select different leagues → Rosters should update

**Expected:**
- ✅ All leagues load within 3 seconds
- ✅ No duplicate leagues
- ✅ Year filter works correctly

### Scenario 2: Dynasty vs Redraft

**Goal:** Verify app handles both league types

**Steps:**
1. Select a dynasty league (look for "Dynasty" in name)
2. Check for rookie draft features
3. Select a redraft league
4. Verify standard fantasy features

**Expected:**
- ✅ Dynasty leagues show multi-year player values
- ✅ Redraft leagues show current season focus

### Scenario 3: Large Roster Testing

**Goal:** Test performance with large rosters (20+ players)

**Steps:**
1. Select league with large rosters
2. View Teams tab
3. Scroll through all rosters
4. Check for UI rendering issues

**Expected:**
- ✅ No janky scrolling
- ✅ All player names visible
- ✅ Roster sorting works (current user first)

---

## Quick Reference: Test Account

**Username:** `Wallreezy`

**What to Test:**
- ✅ User connection
- ✅ Multi-league handling
- ✅ Trade history (if available)
- ✅ Roster data loading
- ✅ Year switching (2025, 2024, 2023)

**Expected Data:**
- Multiple leagues across 3 seasons
- Active rosters with real player data
- Historical trades (season-specific)

---

## Tips for Effective Testing

### 1. Use Network Throttling

Always test with:
- **Fast 3G** - Simulates mobile network
- **Slow 3G** - Stress test loading states
- **Offline** - Test error handling

### 2. Clear Cache Between Tests

```javascript
// Full reset
localStorage.clear()
indexedDB.deleteDatabase('fantasy-football-cache')
location.reload()
```

### 3. Monitor Console

Keep Console open during testing:
- Look for warnings (yellow)
- Look for errors (red)
- Check for cache debug logs

### 4. Test on Real Devices

When possible:
- Test on real iPhone (Safari)
- Test on real Android (Chrome)
- Desktop browsers (Chrome, Firefox, Edge)

### 5. Document Issues

When you find a bug:
- Screenshot the issue
- Copy console error messages
- Note reproduction steps
- Record Network activity (HAR file)

---

## Getting Help

**Cache Issues:** Check `docs/testing/CACHE_TESTING.md`

**Performance Issues:** Check `docs/testing/PERFORMANCE_TESTING.md`

**API Issues:** Check `docs/api/SLEEPER_API.md`

**Report Bugs:** GitHub Issues with:
- Reproduction steps
- Console logs
- Network HAR file (if relevant)
- Screenshots

---

**Last Updated:** October 13, 2025
**For:** Fantasy Football Assistant v2.0
**Test Account:** `Wallreezy`
