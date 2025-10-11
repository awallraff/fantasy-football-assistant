# NFL Data Fixes - Critical Action Items

**Generated:** 2025-10-08
**Full Review:** See `SRE_REVIEW_NFL_DATA_FIXES.md`

---

## Deployment Decision: APPROVED ✅

The NFL Data page fixes are **production-ready** and resolve all P0 blocking issues. Deploy with confidence.

**Deployment Risk:** LOW
**User Impact:** HIGH POSITIVE
**Rollback Time:** 5 minutes

---

## Critical Actions (Do Before Next Season)

### 1. Fix Hardcoded 2024 Logic (URGENT - 1 hour)

**File:** `lib/nfl-season-utils.ts`
**Lines:** 68-72

**Current Code:**
```typescript
// For 2025, since we're in preseason, target Week 1
if (currentYear === 2024) {
  targetYear = 2025;
  targetWeek = 1;
}
```

**Problem:** This hardcoded check will break on January 1, 2025.

**Fix:**
```typescript
// Import LATEST_AVAILABLE_SEASON constant
import { LATEST_AVAILABLE_SEASON } from '../config/nfl-season'

// Remove hardcoded year check
// Use dynamic logic based on LATEST_AVAILABLE_SEASON instead
```

**Assignee:** Developer
**Deadline:** Within 1 week of deployment

---

### 2. Create Operational Runbook (HIGH - 4 hours)

**File to Create:** `docs/runbooks/nfl-data-service.md`

**Must Include:**
- Common failure scenarios (404 errors, timeouts, Python failures)
- Step-by-step resolution procedures
- How to verify Python environment
- Rollback procedures
- Escalation contacts

**Why Critical:** When page breaks at 3 AM, on-call engineer needs this.

**Assignee:** SRE/DevOps
**Deadline:** Within 2 weeks

---

### 3. Create Season Update Guide (HIGH - 2 hours)

**File to Create:** `docs/guides/updating-nfl-season.md`

**Must Include:**
- When to update (September each year)
- Which files to modify (checklist)
- How to verify data availability
- Testing checklist
- Deployment steps

**Why Critical:** Prevents page from breaking when 2025 season starts.

**Assignee:** Developer
**Deadline:** Before August 2025

---

## Recommended Improvements (Next Sprint)

### 4. Add Structured Logging (6 hours)

**Create:** `lib/logging-service.ts`

**Benefits:**
- Better debugging in production
- Performance tracking
- Error monitoring
- Alert integration

**Priority:** P1 - High

---

### 5. Add Retry Mechanism (3 hours)

**Modify:** `components/nfl-data-manager-fixed.tsx`

**Add:**
- Exponential backoff on failures
- Max 3 retry attempts
- User-facing retry button
- Better error categorization

**Priority:** P1 - High

---

### 6. Implement Metrics Collection (4 hours)

**Create:** `lib/metrics-service.ts`

**Track:**
- Request success rate
- Fetch duration (p50, p95, p99)
- Error rate by type
- Python process spawn frequency

**Priority:** P1 - High

---

### 7. Write Component Tests (8 hours)

**Create:** `__tests__/nfl-data-manager-fixed.test.tsx`

**Test:**
- Default year is 2024
- Warning shown for 2025
- Single auto-load on mount
- AbortController cancellation
- Error message variations

**Priority:** P2 - Medium

---

## Monitoring Setup (Do After Deployment)

### Critical Alerts

**Set up these alerts in your monitoring service:**

1. **Page Down Alert**
   - Condition: Success rate < 50% for 15 minutes
   - Severity: P0 - Critical
   - Action: PagerDuty notification

2. **Python Service Down**
   - Condition: Python failures > 10 in 5 minutes
   - Severity: P0 - Critical
   - Action: PagerDuty notification

3. **Slow Fetches**
   - Condition: p95 duration > 60s for 10 minutes
   - Severity: P1 - High
   - Action: Slack notification

4. **High 404 Rate**
   - Condition: 404 errors > 20 in 1 hour
   - Severity: P2 - Medium
   - Action: Slack notification
   - Hint: Check if LATEST_AVAILABLE_SEASON needs updating

---

## Post-Deployment Checklist

**Within 24 Hours:**

- [ ] Monitor error rate (expect decrease from baseline)
- [ ] Check page load performance
- [ ] Verify no spike in Python process failures
- [ ] Review Vercel logs for unexpected errors
- [ ] Check user feedback/support tickets

**Within 1 Week:**

- [ ] Fix hardcoded 2024 logic in nfl-season-utils.ts
- [ ] Set calendar reminder for August 2025 (season update)
- [ ] Begin work on operational runbook

**Within 1 Month:**

- [ ] Complete operational runbook
- [ ] Implement structured logging
- [ ] Add retry mechanism
- [ ] Set up metrics collection
- [ ] Configure monitoring alerts

---

## Calendar Reminders to Set

**Annual Reminders:**

1. **August 15, 2025** - Check if 2025 NFL data available
   - Test: `python scripts/nfl_data_extractor.py --years 2025 --positions QB --week 1`
   - If successful, follow `docs/guides/updating-nfl-season.md`

2. **September 1, 2025** - Verify season update completed
   - Confirm LATEST_AVAILABLE_SEASON = 2025 in all files
   - Run full test suite
   - Deploy before Week 1

**One-Time Reminders:**

1. **1 week from deployment** - Fix hardcoded 2024 logic
2. **2 weeks from deployment** - Complete runbook
3. **1 month from deployment** - Implement logging/metrics

---

## Quick Reference

### Rollback Procedure
```bash
git revert HEAD
git push origin main
# Vercel auto-deploys in ~3 minutes
```

### Files Modified in This PR
- `components/nfl-data-manager-fixed.tsx` - Race conditions, error handling
- `lib/prompt-builder-service.ts` - LATEST_AVAILABLE_SEASON constant
- `lib/nfl-data-fetcher-service.ts` - LATEST_AVAILABLE_SEASON constant
- `app/nfl-data/page.tsx` - No changes (uses fixed component)
- `app/api/nfl-data/route.ts` - No changes (already correct)

### Constants to Update Each Season

**Search for:** `LATEST_AVAILABLE_SEASON`

**Files:**
1. `lib/prompt-builder-service.ts` - Line 12
2. `lib/nfl-data-fetcher-service.ts` - Line 11
3. `components/nfl-data-manager-fixed.tsx` - Line 93 (`latestAvailableYear`)
4. **TODO:** `lib/nfl-season-utils.ts` - Lines 68-72 (hardcoded, needs refactor)

---

## Questions or Issues?

**For deployment questions:**
- Review full SRE analysis: `SRE_REVIEW_NFL_DATA_FIXES.md`
- Check original roadmap: `NFL_DATA_PAGE_FIXES.md`

**For operational questions:**
- Create runbook: `docs/runbooks/nfl-data-service.md` (TODO)
- Create update guide: `docs/guides/updating-nfl-season.md` (TODO)

**For monitoring questions:**
- See Section 7 in `SRE_REVIEW_NFL_DATA_FIXES.md`
- Configure alerts based on recommended thresholds

---

**Status:** Ready for Deployment ✅
**Next Review:** After 2025 season data becomes available
