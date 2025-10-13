# Sprint 3: Mobile Optimization - Process Documentation

**Created:** 2025-10-11
**Sprint:** Sprint 3 - Mobile Design & Optimization
**Duration:** 1.5 weeks (40 hours)
**Status:** 🔄 In Progress

---

## Purpose

This document provides a **repeatable, parallelizable process** for any agent (or human developer) to execute Sprint 3 mobile optimization tasks. The process is designed to enable **concurrent work** across multiple agents without collisions.

---

## Prerequisites

### Tools Required
- **Chrome DevTools MCP** - For mobile viewport testing
- **Read/Write/Edit tools** - For code modifications
- **Bark notifications** - For user communication

### Access Required
- Production URL: `https://dynastyff.vercel.app`
- Test Sleeper username: `Wallreezy`
- Local development environment

### Knowledge Required
- React 19 + Next.js 15.2.4
- Tailwind CSS 4.x responsive utilities
- Mobile-first design principles
- WCAG 2.1 AA accessibility standards

---

## Sprint 3 Overview

**Goal:** Transform the app from desktop-first to mobile-first, ensuring all features work perfectly on 375px viewport.

**Success Criteria:**
- ✅ All pages render correctly on 375px width (iPhone SE)
- ✅ All interactive elements ≥44px tap targets (WCAG 2.1 AA)
- ✅ Lighthouse mobile score >80 on all core pages
- ✅ Zero horizontal scroll on mobile viewports
- ✅ Load time <3s on Slow 4G

---

## Phase 1: Critical Fixes (Week 1) - 18 hours

### TASK-049: Mobile Viewport Audit (4 hours)

**Agent Assignment:** Can be split across 5 agents (1 per page)

**Process:**

1. **Setup Testing Environment**
   ```bash
   # Use Chrome DevTools MCP to test production site
   # Target URL: https://dynastyff.vercel.app
   ```

2. **Test Each Viewport Size**
   - iPhone SE: 375px width
   - iPhone 14 Pro: 390px width
   - Android: 360px width

3. **Document Issues Using This Template**

   For each page, create a section in `docs/SPRINT_3_MOBILE_AUDIT.md`:

   ```markdown
   ## Page: [Page Name]
   **File:** `[path/to/file.tsx]`
   **Test URL:** `https://dynastyff.vercel.app/[route]`
   **Viewport:** 375px

   ### Issues Found

   #### Issue #[N]: [Brief Description]
   **Priority:** P0/P1/P2
   **Component:** `[ComponentName]` (line [X])
   **Impact:** [What breaks/degrades]
   **Current Behavior:** [Screenshot or description]
   **Expected Behavior:** [What should happen]
   **Touch Target Size:** [Width]x[Height]px (if interactive)
   **Recommended Fix:** [Specific Tailwind classes or approach]

   **Code Reference:**
   ```tsx
   // Line [X] in [file]
   [paste problematic code]
   ```
   ```

4. **Issue Categorization**
   - **P0 (Critical):** Blocks core functionality, unusable
   - **P1 (High):** Severely degrades UX, workarounds exist
   - **P2 (Medium):** Minor UX issue, low impact

5. **Output Format**
   - One markdown file: `docs/SPRINT_3_MOBILE_AUDIT.md`
   - Table of contents with links to each page section
   - Summary matrix at top with counts by priority

**Parallel Execution Strategy:**

| Agent | Pages to Audit | Estimated Time |
|-------|----------------|----------------|
| Agent 1 | Dashboard | 50 min |
| Agent 2 | Rankings | 50 min |
| Agent 3 | Trades | 50 min |
| Agent 4 | Recommendations | 40 min |
| Agent 5 | NFL Data | 50 min |

**Total Time:** ~1 hour (if parallelized) vs 4 hours (sequential)

**Merge Process:**
1. Each agent writes to a separate file: `AUDIT_[PAGE_NAME].md`
2. Final agent consolidates into `SPRINT_3_MOBILE_AUDIT.md`
3. Creates summary matrix with all findings

---

### TASK-050: Fix Dashboard Mobile Layout (5 hours)

**Agent Assignment:** Single agent (requires cohesive changes)

**Files to Modify:**
- `app/dashboard/page.tsx` (252 lines)
- `components/enhanced-team-roster.tsx` (184 lines) if needed

**Process:**

1. **Read Audit Results**
   ```bash
   # Read the dashboard section from audit
   Read docs/SPRINT_3_MOBILE_AUDIT.md (dashboard section)
   ```

2. **Priority Order for Fixes**
   - P0 issues first (blocks usage)
   - P1 issues second (poor UX)
   - P2 issues last (polish)

3. **Common Fixes Required**

   **Tab Layout (Line 153):**
   ```tsx
   // BEFORE (desktop-first)
   <TabsList className="grid w-full grid-cols-4">

   // AFTER (mobile-first)
   <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
   ```

   **League Grid (Line 224):**
   ```tsx
   // BEFORE
   <div className="md:grid-cols-2 lg:grid-cols-3">

   // AFTER (explicit mobile)
   <div className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
   ```

   **Touch Targets:**
   ```tsx
   // Add to all interactive elements
   className="min-h-[44px] min-w-[44px]"
   ```

4. **Testing After Each Fix**
   ```bash
   # Use Chrome DevTools MCP
   # Test at 375px viewport
   # Verify no horizontal scroll
   # Verify all interactive elements are tappable
   ```

5. **Commit Strategy**
   ```bash
   # One commit per logical group of fixes
   git add app/dashboard/page.tsx
   git commit -m "fix(mobile): dashboard tab layout responsive for 375px viewport"
   ```

**Estimated Time:** 5 hours

**Parallel Execution:** Not recommended (single file, cohesive changes)

---

### TASK-051: Fix Rankings Page Mobile Layout (4 hours)

**Agent Assignment:** Single agent (complex table refactoring)

**Files to Modify:**
- `app/rankings/page.tsx` (959 lines)
- Potentially create: `components/ui/mobile-table.tsx` (reusable)

**Process:**

1. **Read Audit Results**
   ```bash
   Read docs/SPRINT_3_MOBILE_AUDIT.md (rankings section)
   ```

2. **Critical Issue: Table Overflow**

   **Problem:** 8-column table (lines 413-538) overflows on mobile

   **Solution:** Responsive rendering
   ```tsx
   {/* Mobile: Card layout */}
   <div className="md:hidden space-y-2">
     {sortedData.map(player => (
       <Card key={player.playerId} className="p-4">
         <div className="space-y-2">
           <div className="flex justify-between items-start">
             <div>
               <div className="font-semibold">{player.rank}. {player.playerName}</div>
               <div className="text-sm text-muted-foreground">{player.position} - {player.team}</div>
             </div>
             <Badge>{player.tier}</Badge>
           </div>
           <div className="flex justify-between text-sm">
             <span>Projected: {player.projectedPoints} pts</span>
             <span className="text-muted-foreground">{player.status}</span>
           </div>
         </div>
       </Card>
     ))}
   </div>

   {/* Desktop: Table layout */}
   <div className="hidden md:block overflow-x-auto">
     <table className="w-full">
       {/* Existing table code */}
     </table>
   </div>
   ```

3. **Filter Layout Fix (Line 669)**
   ```tsx
   // BEFORE
   <div className="md:grid-cols-2 lg:grid-cols-4">

   // AFTER
   <div className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
   ```

4. **Tab Layout Fix (Line 908)**
   ```tsx
   // BEFORE
   <TabsList className="grid-cols-5">

   // AFTER
   <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
   ```

5. **Testing**
   ```bash
   # Test ranking table in both card and table view
   # Test filter collapsing/expansion
   # Verify all tabs are tappable
   # Test search functionality on mobile
   ```

**Estimated Time:** 4 hours

**Parallel Execution:** Not recommended (table refactoring is complex)

**Reusability:** Consider extracting mobile table pattern to `components/ui/mobile-table.tsx` for reuse in other pages.

---

### TASK-052: Fix Trade Pages Mobile Layout (3 hours)

**Agent Assignment:** Single agent or split by sub-page

**Files to Modify:**
- `app/trades/page.tsx` (line 140, 192)
- `app/recommendations/page.tsx` (if needed)

**Process:**

1. **Read Audit Results**
   ```bash
   Read docs/SPRINT_3_MOBILE_AUDIT.md (trades section)
   ```

2. **Stats Cards Fix (Line 140)**
   ```tsx
   // BEFORE
   <div className="md:grid-cols-4">

   // AFTER
   <div className="grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
   ```

3. **Tab Layout Fix (Line 192)**
   ```tsx
   // BEFORE
   <TabsList className="grid-cols-4">

   // AFTER
   <TabsList className="grid grid-cols-2 md:grid-cols-4">
   ```

4. **Testing**
   ```bash
   # Test trade history view
   # Test trade evaluator
   # Verify stats cards stack properly
   ```

**Estimated Time:** 3 hours

**Parallel Execution:** Can be split
- Agent A: Trade history page fixes (1.5h)
- Agent B: Trade recommendations page fixes (1.5h)

---

### TASK-053: Mobile Navigation Improvements (2 hours)

**Agent Assignment:** Single agent

**Files to Modify:**
- Navigation component (already mobile-ready per frontend audit)
- May need minor enhancements

**Process:**

1. **Audit Existing Navigation**
   ```bash
   # Navigation already has hamburger menu (lines 54-96)
   # Verify it works properly
   ```

2. **Potential Enhancements**
   - Ensure z-index is correct (currently `z-50`)
   - Add swipe-to-close gesture (optional)
   - Optimize touch target sizing in menu

3. **Testing**
   ```bash
   # Test menu open/close
   # Test all navigation links
   # Verify menu doesn't conflict with page scrolling
   ```

**Estimated Time:** 2 hours

**Parallel Execution:** Not applicable (small task)

---

## Phase 2: Performance & Polish (Week 2) - 22 hours

### TASK-054: Implement Code Splitting (4 hours)

**Agent Assignment:** Single agent (requires build configuration)

**Files to Modify:**
- Heavy pages: `app/rankings/page.tsx`, `app/nfl-data/page.tsx`
- Add dynamic imports

**Process:**

1. **Identify Heavy Imports**
   ```bash
   # Look for large libraries
   - Chart libraries (recharts)
   - Data processing libraries
   - Heavy UI components
   ```

2. **Implement Dynamic Imports**
   ```tsx
   // BEFORE
   import { RankingsChart } from '@/components/rankings-chart'

   // AFTER
   import dynamic from 'next/dynamic'

   const RankingsChart = dynamic(
     () => import('@/components/rankings-chart'),
     {
       loading: () => <Skeleton className="h-64 w-full" />,
       ssr: false
     }
   )
   ```

3. **Target Bundle Sizes**
   - Initial bundle: <200KB
   - Per-route chunks: <100KB

4. **Testing**
   ```bash
   npm run build
   # Check bundle sizes in output
   # Test loading states on mobile
   ```

**Estimated Time:** 4 hours

**Parallel Execution:** Can be split by page
- Agent A: Rankings page (2h)
- Agent B: NFL Data page (2h)

---

### TASK-055: Image Optimization & Lazy Loading (3 hours)

**Agent Assignment:** Single agent

**Files to Modify:**
- All components with images
- Team logos, player headshots

**Process:**

1. **Find All Image Usage**
   ```bash
   Grep pattern="<img" path="." output_mode="files_with_matches"
   Grep pattern="Image from" path="." output_mode="files_with_matches"
   ```

2. **Convert to Next.js Image Component**
   ```tsx
   // BEFORE
   <img src="/logos/team.png" alt="Team Logo" />

   // AFTER
   import Image from 'next/image'
   <Image
     src="/logos/team.png"
     alt="Team Logo"
     width={40}
     height={40}
     loading="lazy"
   />
   ```

3. **Testing**
   ```bash
   # Verify images load progressively
   # Check network tab for image optimization
   ```

**Estimated Time:** 3 hours

**Parallel Execution:** Can be split by component directory

---

### TASK-056: Mobile Performance Audit (3 hours)

**Agent Assignment:** Single agent

**Tools Required:**
- Chrome DevTools Lighthouse
- WebPageTest (optional)

**Process:**

1. **Run Lighthouse on All Pages**
   ```bash
   # Use Chrome DevTools MCP
   # Navigate to each page
   # Run Lighthouse in mobile mode
   # Document scores
   ```

2. **Target Metrics**
   - Mobile score: >80
   - First Contentful Paint (FCP): <2s
   - Largest Contentful Paint (LCP): <2.5s
   - Time to Interactive (TTI): <3.5s

3. **Document Results**
   ```markdown
   ## Page: Dashboard
   - Mobile Score: 85/100
   - FCP: 1.8s
   - LCP: 2.2s
   - TTI: 3.1s
   - Issues: [list any warnings]
   ```

4. **Create Optimization Backlog**
   - List issues by impact
   - Prioritize P0 items for immediate fix

**Estimated Time:** 3 hours

**Parallel Execution:** Can be split by page (5 agents x 30 min each)

---

### TASK-057: API Response Optimization (2 hours)

**Agent Assignment:** Single agent (backend focus)

**Files to Modify:**
- `app/api/nfl-data/route.ts`
- `app/api/cache/*/route.ts`

**Process:**

1. **Analyze Response Sizes**
   ```bash
   # Check network tab for large responses
   # Identify fields that can be removed/compressed
   ```

2. **Implement Field Filtering**
   ```tsx
   // Add query param for field selection
   const fields = searchParams.get('fields')?.split(',')

   // Filter response
   const filteredData = fields
     ? data.map(item => pick(item, fields))
     : data
   ```

3. **Enable Compression**
   ```tsx
   // Already enabled in Next.js by default
   // Verify gzip is working
   ```

**Estimated Time:** 2 hours

**Parallel Execution:** Not recommended (API changes need coordination)

---

### TASK-058: Touch Target Optimization (3 hours)

**Agent Assignment:** Can be split by page

**Process:**

1. **Find All Interactive Elements**
   ```bash
   Grep pattern="onClick|Button|Link" path="." output_mode="content"
   ```

2. **Measure Current Sizes**
   ```bash
   # Use Chrome DevTools to inspect elements
   # Document any <44x44px
   ```

3. **Apply Fixes**
   ```tsx
   // Add to all buttons, links, interactive elements
   className="min-h-[44px] min-w-[44px] p-2"

   // Or use Tailwind arbitrary values
   className="touch-target" // Define in globals.css
   ```

4. **Testing**
   ```bash
   # Test all interactive elements with thumb
   # Verify no accidental taps
   ```

**Estimated Time:** 3 hours

**Parallel Execution:** Split by page (5 agents x 36 min each)

---

### TASK-059: Mobile-Optimized Tables (4 hours)

**Agent Assignment:** Single agent (creates reusable component)

**Files to Create:**
- `components/ui/mobile-table.tsx`
- `components/ui/mobile-table-card.tsx`

**Process:**

1. **Create Generic Mobile Table Component**
   ```tsx
   interface MobileTableProps<T> {
     data: T[]
     columns: ColumnDef<T>[]
     renderCard: (item: T) => React.ReactNode
   }

   export function MobileTable<T>({ data, columns, renderCard }: MobileTableProps<T>) {
     return (
       <>
         {/* Mobile: Card layout */}
         <div className="md:hidden space-y-2">
           {data.map((item, idx) => (
             <Card key={idx}>{renderCard(item)}</Card>
           ))}
         </div>

         {/* Desktop: Table layout */}
         <div className="hidden md:block overflow-x-auto">
           <Table columns={columns} data={data} />
         </div>
       </>
     )
   }
   ```

2. **Update Existing Tables**
   - Rankings table
   - NFL Data table
   - Trade history table
   - Roster table

3. **Testing**
   ```bash
   # Test table/card switching at breakpoint
   # Verify data displays correctly in both views
   ```

**Estimated Time:** 4 hours

**Parallel Execution:** Not recommended (requires reusable component first)

---

### TASK-060: Loading States & Skeleton Screens (3 hours)

**Agent Assignment:** Can be split by page

**Files to Modify:**
- All pages with async data loading

**Process:**

1. **Create Skeleton Components**
   ```tsx
   // components/ui/skeletons.tsx
   export function RankingsTableSkeleton() {
     return (
       <div className="space-y-2">
         {Array.from({ length: 10 }).map((_, i) => (
           <Skeleton key={i} className="h-16 w-full" />
         ))}
       </div>
     )
   }
   ```

2. **Replace Loading Spinners**
   ```tsx
   // BEFORE
   {loading && <Spinner />}

   // AFTER
   {loading && <RankingsTableSkeleton />}
   ```

3. **Testing**
   ```bash
   # Test with slow network throttling
   # Verify skeleton matches final layout
   ```

**Estimated Time:** 3 hours

**Parallel Execution:** Split by page (5 agents x 36 min each)

---

## Communication Protocol

### When to Send Bark Notifications

**ALWAYS send notification before:**
1. Asking user for a decision or input
2. Blocking on external dependency
3. Completing a major phase (all Phase 1 tasks done)
4. Encountering an unexpected error that requires user attention
5. Ready to deploy/test changes

**Notification Template:**
```typescript
mcp__bark__send_bark_notification({
  title: "Sprint 3 - [Task Name]",
  body: "[Status]: [Brief description]\n\n[Action needed or next steps]",
  level: "timeSensitive" // or "critical" for blockers
})
```

### Progress Updates

**Send notification every:**
- Task completion
- Blocking issue discovered
- Phase completion (all Phase 1 or Phase 2 tasks done)

---

## Conflict Avoidance Strategy

### File Locking (Manual)

When an agent starts work on a file:
1. Add comment to todo: "Agent [X] working on [file]"
2. Estimated completion time
3. Other agents skip that file

### Page-Based Parallelization

**Safe to parallelize:**
- Different pages (dashboard vs rankings vs trades)
- Different directories (components/ui vs app/)
- Read-only audits (multiple agents reading same files)

**NOT safe to parallelize:**
- Same file modifications
- Shared components (wait for one agent to finish)
- Database schema changes
- API route changes

---

## Quality Checklist

Before marking a task complete, verify:

- [ ] Code changes committed with descriptive message
- [ ] Tested on 375px viewport (iPhone SE)
- [ ] Tested on 390px viewport (iPhone 14 Pro)
- [ ] All interactive elements ≥44px tap targets
- [ ] No horizontal scroll
- [ ] Lighthouse mobile score documented
- [ ] Bark notification sent to user
- [ ] Todo list updated

---

## Rollback Plan

If changes break production:

1. **Immediate:**
   ```bash
   git revert [commit-hash]
   git push origin main
   ```

2. **Notify user:**
   ```typescript
   mcp__bark__send_bark_notification({
     title: "Sprint 3 - Rollback Required",
     body: "Changes reverted due to [issue]. Investigating fix.",
     level: "critical"
   })
   ```

3. **Document issue:**
   - What broke
   - Why it broke
   - How to prevent in future

---

## Sprint 3 Success Metrics

**Track throughout sprint:**

| Metric | Target | Current |
|--------|--------|---------|
| Pages mobile-ready | 5/5 | 0/5 |
| Lighthouse mobile score | >80 | TBD |
| Horizontal scroll issues | 0 | TBD |
| Touch target compliance | 100% | TBD |
| Load time (Slow 4G) | <3s | TBD |

**Update this table in `SPRINT_3_STATUS.md` after each task completion.**

---

## Next Steps After Sprint 3

Once Sprint 3 is complete:
1. Create `docs/SPRINT_3_COMPLETE.md` (mirror Sprint 2 format)
2. Update `DYNASTY_FEATURE_ROADMAP.md` (mark Sprint 3 complete)
3. Send final Bark notification with success metrics
4. Plan Sprint 4 (Rookie Draft & Player Development)

---

**Document Owner:** Development Team
**Last Updated:** 2025-10-11
**Next Review:** Sprint 3 completion
