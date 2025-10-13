# Design Spec Proposal Analysis & Engineering Roadmap

**Document Status:** Product Owner Analysis
**Date Created:** 2025-10-13
**Author:** Claude (Product Owner Agent)
**Source:** `DESIGN_SPEC_PROPOSAL.md` (3rd Party Vendor)

---

## Executive Summary

The DynastyFF Analytics Platform design spec proposes a **live game tracking application** focused on real-time player monitoring across multiple fantasy leagues during NFL games. This is fundamentally different from our current **league management and analytics platform** focused on dynasty football decision-making (trades, rankings, roster building).

**Key Finding:** The design spec describes a **different product** with a different primary use case:
- **Proposed Spec:** Live game-day tracking (roots/boos/conflicts in real-time)
- **Our Application:** Dynasty management & decision support (trades, rankings, roster analysis)

**Strategic Recommendation:** Selectively adopt design system elements and UI patterns while maintaining our core product identity as a dynasty football analytics platform, not a live game tracker.

---

## Applicability Analysis

### ✅ Highly Applicable (Direct Implementation Value)

#### 1. **"Midnight Blue" Design System** (90% Applicable)
**What it is:** Dark-themed UI with specific color palette, typography, and spacing optimized for mobile data density.

**Why we should adopt:**
- Our app IS data-intensive (rankings, rosters, trades)
- Mobile-first requirement aligns perfectly
- Reduces eye strain for dynasty managers (who study data extensively)
- Professional appearance matches our target audience

**Current implementation gap:**
- We use shadcn/ui components but lack consistent dark theme
- No systematic color palette for semantic states
- Inconsistent spacing (no 8px grid system)
- Limited mobile optimization

**Adoptable elements:**
- Color palette with semantic colors (green/red/amber for positive/negative/warning states)
- 8-point grid spacing system
- Typography scale (Inter font already in use)
- Opacity-based text hierarchy
- Surface elevation approach (instead of shadows)

#### 2. **Component-Based Architecture** (100% Applicable)
**What it is:** Atomic, reusable UI components with clear data contracts.

**Why we should adopt:**
- Industry best practice
- We already use React components, but need better organization
- Design spec provides clear component specifications
- Improves maintainability and consistency

**Current implementation gap:**
- Large, monolithic components (dashboard, enhanced-team-roster)
- Inconsistent component patterns
- No standardized data props/interfaces

**Adoptable elements:**
- Card-based layouts (Game Group → League Card pattern)
- Player Row component pattern (compact, dense, mobile-optimized)
- Tag/chip components for status indicators
- Modal pattern for detail views
- Standardized loading/empty/error states

#### 3. **Mobile-First UI Patterns** (100% Applicable)
**What it is:** 44px minimum touch targets, bottom navigation, mobile-optimized layouts.

**Why we should adopt:**
- CLAUDE.md already mandates mobile-first (375px viewport)
- Dynasty managers make decisions on mobile constantly
- We have existing mobile responsiveness issues (P0-009, P0-010 from Sprint 3)

**Current implementation gap:**
- Inconsistent touch target sizing
- Top navigation instead of bottom tab bar
- Desktop-first layouts scaled down

**Adoptable elements:**
- Bottom tab bar navigation (thumb-zone accessible)
- 44px minimum touch targets
- Compact, scannable layouts
- Skeleton loaders instead of spinners
- Swipe-to-dismiss modals

#### 4. **State Management Patterns** (85% Applicable)
**What it is:** Loading states, empty states, error states with helpful messaging.

**Why we should adopt:**
- Professional UX requirement
- We already have some (NoLeaguesConnected, DashboardLoadingSkeleton)
- Design spec provides comprehensive patterns

**Current implementation gap:**
- Inconsistent error handling across pages
- Generic spinners instead of skeleton loaders
- Limited empty state guidance

**Adoptable elements:**
- Skeleton loaders for all loading states
- Helpful empty states with clear CTAs
- User-friendly error messages (non-technical)
- Retry buttons and fallback paths

#### 5. **Accessibility Standards** (100% Applicable)
**What it is:** WCAG 2.1 AA compliance with contrast ratios, touch targets, alternative cues.

**Why we should adopt:**
- Legal/ethical requirement
- Better UX for everyone
- Improves SEO and discoverability

**Current implementation gap:**
- No systematic accessibility audit
- Color-only semantic indicators
- Unknown contrast ratio compliance

**Adoptable elements:**
- 4.5:1 contrast ratio enforcement
- Icon + color for semantic states (not color alone)
- Alt text standards
- Screen reader compatibility
- 44px minimum touch targets

---

### ⚠️ Partially Applicable (Requires Adaptation)

#### 6. **Player Detail Modal Pattern** (60% Applicable)
**What it is:** Bottom-sheet modal showing player details across all user's leagues.

**Why it's partially applicable:**
- We already have player detail modals
- "Cross-league player view" is VERY valuable for dynasty managers
- But we're not focused on live game tracking

**Adaptation needed:**
- Repurpose for **dynasty-specific insights**: trade value, age curve, recent performance
- Show player across user's leagues (like spec), but with **dynasty context** (roster fit, positional depth)
- Add dynasty-specific data points (contract status, breakout age, etc.)

**Implementation tasks:**
- Refactor existing player modals to show cross-league context
- Add dynasty metrics to modal
- Implement bottom-sheet pattern for mobile

#### 7. **Filter and View Controls** (50% Applicable)
**What it is:** Week selector, view toggle (By Game vs Chronological), filter chips.

**Why it's partially applicable:**
- We need filtering (position, team, status) for rankings/rosters
- Week selector is less relevant (dynasty = long-term)
- View toggles are useful for different roster views

**Adaptation needed:**
- Replace "Week Selector" with **Season/Year Selector** (we already have YearSelector)
- Adapt "By Game" toggle to **"By Position" / "By Team" / "By Value"** toggles
- Add filter chips for rankings page (position, age, team)

**Implementation tasks:**
- Add segmented control toggles to rankings page
- Implement filter chips for rosters/rankings
- Persist user's preferred view (localStorage)

#### 8. **Settings for User Preferences** (40% Applicable)
**What it is:** Settings page for league entry fees (for Conflict Score) and default view preferences.

**Why it's partially applicable:**
- We don't have Conflict Score feature (live game tracking)
- But we DO need settings for user preferences
- Dynasty managers need customization (scoring settings, position preferences)

**Adaptation needed:**
- Repurpose Settings tab for **dynasty-specific preferences**:
  - Scoring system (PPR, half-PPR, standard)
  - Position preferences (Superflex, TE premium)
  - Trade evaluation settings
  - League stake weighting (for multi-league trade recommendations)

**Implementation tasks:**
- Create Settings page/tab
- Add preference storage (localStorage + future DB)
- Wire preferences into ranking/trade algorithms

---

### ❌ Not Applicable (Different Product Focus)

#### 9. **Live Game Tracking Features** (0% Applicable)
**What it is:** Game Group component, live score updates, roots/boos/conflicts, real-time player tracking.

**Why it's not applicable:**
- Our product is **dynasty management**, not live game tracking
- Dynasty managers care about **long-term value**, not weekly performance
- We don't have (and shouldn't build) live scoring integration
- Sleeper app already provides excellent live tracking

**Why we should NOT implement:**
- Feature scope creep
- Duplicates Sleeper's core functionality
- Requires WebSocket/polling infrastructure we don't have
- Not aligned with our value proposition

**Alternative approach:**
- Focus on **post-game analysis** and **trend identification**
- Provide **week-over-week performance insights** (not live)
- Emphasize **multi-week trends** for dynasty decision-making

#### 10. **Spotlight View (Roots/Boos/Conflicts)** (5% Applicable)
**What it is:** Dedicated tab showing all roots (players user owns), boos (opponents own), conflicts (both).

**Why it's not applicable:**
- These concepts are live-game specific
- Dynasty focus is on **roster composition**, not weekly matchups
- Opponent analysis is less relevant in dynasty (trades matter more)

**What we CAN adapt:**
- **"My Players Across Leagues"** view: Shows all players user owns across multiple leagues
- **"Trade Targets"** view: Shows players frequently traded in user's leagues
- **"Available Players"** view: Shows valuable dynasty assets currently on waivers

**Implementation tasks:**
- Create "My Players" cross-league view
- Add "Trade Targets" analysis page
- Implement "Waiver Wire Gems" dashboard

---

## Current Implementation Status

### ✅ Already Implemented

1. **League Connection & Onboarding**
   - Simple username input (LeagueConnector component)
   - localStorage persistence
   - Redirect to dashboard
   - **Spec alignment:** 95% - matches "zero-to-value" philosophy

2. **Dashboard with Multiple Leagues**
   - Multi-league dashboard (dashboard/page.tsx)
   - League cards with analytics
   - Year selector
   - **Spec alignment:** 70% - lacks bottom navigation, needs mobile optimization

3. **Player Data Management**
   - PlayerDataContext with Sleeper API integration
   - Player search and filtering
   - **Spec alignment:** 60% - lacks player detail modal with cross-league view

4. **Custom Hooks Architecture**
   - use-dashboard-data, use-league-selection, use-loading-states
   - **Spec alignment:** 100% - matches spec's component-based approach

5. **Mobile-Responsive Components**
   - Responsive grid layouts
   - Touch targets (some 44px, some not)
   - **Spec alignment:** 50% - needs systematic mobile optimization

### 🚧 Partially Implemented

1. **Loading States**
   - Have: DashboardLoadingSkeleton, generic spinners
   - Need: Skeleton loaders for all pages, consistent patterns
   - **Spec alignment:** 40%

2. **Error Handling**
   - Have: NoLeaguesConnected, basic error messages
   - Need: Comprehensive error states, retry logic, user-friendly messaging
   - **Spec alignment:** 35%

3. **Dark Theme**
   - Have: Basic dark mode via shadcn/ui
   - Need: Systematic "Midnight Blue" color palette, semantic colors
   - **Spec alignment:** 30%

4. **Navigation**
   - Have: Top navigation (Navigation component)
   - Need: Bottom tab bar for mobile
   - **Spec alignment:** 20%

### ❌ Not Implemented

1. **8-Point Grid System** (0%)
2. **Bottom Tab Bar Navigation** (0%)
3. **Player Detail Modal (Cross-League)** (0%)
4. **Filter Chips & Segmented Controls** (0%)
5. **Settings Page** (0%)
6. **Skeleton Loaders (Comprehensive)** (10% - only dashboard)
7. **Semantic Color System** (0%)
8. **Accessibility Audit** (Unknown %)

---

## Gap Analysis

### Design System Gaps
| Element | Current State | Spec Recommendation | Priority |
|---------|---------------|---------------------|----------|
| Color Palette | shadcn defaults | "Midnight Blue" system | P0 |
| Spacing | Ad-hoc | 8px grid system | P0 |
| Typography | Inter (inconsistent) | Inter with scale | P1 |
| Dark Mode | Basic | Optimized dark UI | P0 |
| Icons | Mixed sources | Consistent icon set | P2 |

### Component Gaps
| Component | Current State | Spec Recommendation | Priority |
|-----------|---------------|---------------------|----------|
| Player Row | Multiple variants | Standardized compact row | P1 |
| Status Tags | Badges (inconsistent) | League Context Tags | P2 |
| Modals | Basic Dialog | Bottom-sheet modal | P1 |
| Loading | Spinners + 1 skeleton | Skeleton loaders everywhere | P0 |
| Empty States | Limited | Comprehensive guidance | P1 |

### Navigation Gaps
| Feature | Current State | Spec Recommendation | Priority |
|---------|---------------|---------------------|----------|
| Primary Nav | Top nav bar | Bottom tab bar (mobile) | P0 |
| Touch Targets | Inconsistent | 44px minimum | P0 |
| Accessibility | Unknown | WCAG 2.1 AA | P0 |

### Feature Gaps (Dynasty-Specific)
| Feature | Current State | Our Adaptation | Priority |
|---------|---------------|----------------|----------|
| Settings Page | None | Dynasty preferences | P1 |
| Cross-League View | None | "My Players" view | P1 |
| Filter Controls | Limited | Position/Team/Age filters | P1 |
| Player Detail Modal | Basic | Dynasty context modal | P2 |

---

## Engineering Roadmap

### Phase 1: Foundation (MVP Design System)
**Goal:** Establish "Midnight Blue" design system and fix critical mobile UX issues
**Timeline:** 2-3 weeks
**Success Metrics:**
- All pages use 8px grid
- Mobile Lighthouse score >80
- All touch targets ≥44px

#### Sprint 1A: Design Tokens & Theming (5 days)
**Tasks:**

**TASK-001: Implement "Midnight Blue" Color System**
- **Description:** Create Tailwind config with spec's color palette (surfaces, semantic colors, opacity-based text)
- **Acceptance Criteria:**
  - Surface colors: #0A1929 (base), #102A43 (elevated), #1A3A5B (highly elevated)
  - Semantic colors: #2ECC71 (positive), #E74C3C (negative), #F39C12 (warning), #3399FF (accent)
  - Text colors: rgba(255,255,255,0.87/0.60/0.38)
  - All colors accessible via Tailwind classes (surface-1, surface-2, semantic-positive, etc.)
- **Priority:** Must Have
- **Estimated Effort:** M (3 days)
- **Dependencies:** None
- **UX Considerations:** Must maintain 4.5:1 contrast ratio for all text
- **Technical Notes:** Update tailwind.config.ts with custom theme

**TASK-002: Implement 8-Point Grid System**
- **Description:** Enforce 8px grid spacing across all components using Tailwind spacing scale
- **Acceptance Criteria:**
  - All padding/margin uses multiples of 8 (8px, 16px, 24px, 32px)
  - Update existing components to use systematic spacing
  - Document spacing tokens in DESIGN_SYSTEM.md
- **Priority:** Must Have
- **Estimated Effort:** M (2 days)
- **Dependencies:** None
- **UX Considerations:** Creates visual rhythm and reduces cognitive load
- **Technical Notes:** May require component refactoring

**TASK-003: Implement Typography Scale**
- **Description:** Define and enforce typographic scale from spec (Heading 1, Heading 2, Body, Caption)
- **Acceptance Criteria:**
  - H1: 24px/32px line height
  - H2: 20px/28px
  - Body: 16px/24px
  - Body Secondary: 14px/20px
  - Caption: 12px/16px
  - Add Tailwind utilities (text-ios-h1, text-ios-body, etc.)
- **Priority:** Should Have
- **Estimated Effort:** S (1 day)
- **Dependencies:** TASK-001
- **UX Considerations:** Improves readability and hierarchy
- **Technical Notes:** Update globals.css with typography utilities

#### Sprint 1B: Mobile-First Navigation (8 days)
**Tasks:**

**TASK-004: Design Bottom Tab Bar Component**
- **Description:** Create iOS-style bottom tab bar with icon + label for primary navigation
- **Acceptance Criteria:**
  - 4 tabs: Dashboard, Rankings, Trades, More
  - 44px minimum height
  - Active state clearly visible (color + icon change)
  - Fixed position at bottom of viewport
  - Works on 375px viewport (iPhone SE)
- **Priority:** Must Have
- **Estimated Effort:** M (2 days)
- **Dependencies:** TASK-001 (colors)
- **UX Considerations:** Must be thumb-zone accessible, clear active state
- **Technical Notes:** Use Radix UI or custom component, test on real mobile devices

**TASK-005: Migrate Primary Routes to Bottom Tab Bar**
- **Description:** Replace top navigation with bottom tab bar for mobile viewports
- **Acceptance Criteria:**
  - Bottom tab bar shows on mobile (<768px)
  - Desktop keeps top navigation (≥768px)
  - All routes accessible via bottom tabs
  - Smooth transition between navigation modes
- **Priority:** Must Have
- **Estimated Effort:** M (3 days)
- **Dependencies:** TASK-004
- **UX Considerations:** Desktop vs mobile navigation parity
- **Technical Notes:** Update layout.tsx, test responsive breakpoints

**TASK-006: Implement Icon System**
- **Description:** Select and implement consistent icon set (Lucide/Feather)
- **Acceptance Criteria:**
  - All icons from single library (lucide-react)
  - Consistent stroke width (2px)
  - Accessible with aria-label
  - Icons scale proportionally
- **Priority:** Should Have
- **Estimated Effort:** S (1 day)
- **Dependencies:** None
- **UX Considerations:** Icons must have text alternatives for screen readers
- **Technical Notes:** Update package.json if new library needed

**TASK-007: Mobile Touch Target Audit & Fixes**
- **Description:** Audit all interactive elements and ensure ≥44x44px touch targets
- **Acceptance Criteria:**
  - All buttons, tabs, cards, toggles ≥44px height
  - Document violations in audit log
  - Fix all P0 issues (navigation, core actions)
  - Add Tailwind utility classes (min-touch-target)
- **Priority:** Must Have
- **Estimated Effort:** M (2 days)
- **Dependencies:** TASK-005
- **UX Considerations:** Critical for mobile usability and accessibility
- **Technical Notes:** Use Chrome DevTools mobile emulation to test

#### Sprint 1C: Loading & Empty States (5 days)
**Tasks:**

**TASK-008: Create Skeleton Loader Library**
- **Description:** Build reusable skeleton components for all loading states
- **Acceptance Criteria:**
  - SkeletonCard, SkeletonRow, SkeletonTable components
  - Mimic final layout structure
  - Animate with pulse effect
  - Use surface colors from design system
- **Priority:** Must Have
- **Estimated Effort:** M (2 days)
- **Dependencies:** TASK-001
- **UX Considerations:** Reduces perceived loading time, manages expectations
- **Technical Notes:** Use CSS animations, not JavaScript

**TASK-009: Replace Spinners with Skeleton Loaders**
- **Description:** Replace all generic spinners with contextual skeleton loaders
- **Acceptance Criteria:**
  - Dashboard: skeleton league cards
  - Rankings: skeleton table rows
  - Trades: skeleton trade cards
  - No generic spinners remain on primary pages
- **Priority:** Must Have
- **Estimated Effort:** M (2 days)
- **Dependencies:** TASK-008
- **UX Considerations:** Contextual loading feels faster and more professional
- **Technical Notes:** Update all page loading states

**TASK-010: Standardize Empty States**
- **Description:** Create EmptyState component with icon, headline, body text, CTA pattern
- **Acceptance Criteria:**
  - Reusable EmptyState component
  - Props: icon, title, description, action button
  - Helpful messaging (not just "No data")
  - Use semantic colors and typography scale
- **Priority:** Should Have
- **Estimated Effort:** S (1 day)
- **Dependencies:** TASK-001, TASK-003
- **UX Considerations:** Guides user on what to do next
- **Technical Notes:** Follow spec's empty state examples

---

### Phase 2: Component Library (Dynasty-Focused)
**Goal:** Build reusable component library with dynasty-specific adaptations
**Timeline:** 3-4 weeks
**Success Metrics:**
- 15+ documented, reusable components
- Component storybook (or equivalent)
- 80% code reuse across pages

#### Sprint 2A: Player Components (8 days)
**Tasks:**

**TASK-011: Standardized Player Row Component**
- **Description:** Create compact, scannable player row for roster/rankings display
- **Acceptance Criteria:**
  - Props: player data, show controls (headshot, position, team, stats)
  - 44px minimum height (touch target)
  - Mobile-optimized (works on 375px)
  - Includes position badge, team logo (optional), key stat
  - Tappable (opens player detail modal)
- **Priority:** Must Have
- **Estimated Effort:** L (3 days)
- **Dependencies:** TASK-001, TASK-007
- **UX Considerations:** High information density, must be scannable at a glance
- **Technical Notes:** Use usePlayerData hook for player info

**TASK-012: Player Detail Modal (Cross-League Dynasty Context)**
- **Description:** Bottom-sheet modal showing player details across user's leagues with dynasty metrics
- **Acceptance Criteria:**
  - Shows player name, headshot, position, team
  - Lists all leagues user owns/faces this player
  - Dynasty-specific data: age, years experience, trend (up/down/stable)
  - Bottom-sheet animation (slides up from bottom)
  - Swipe-to-dismiss on mobile
  - 44px close button
- **Priority:** Must Have
- **Estimated Effort:** L (4 days)
- **Dependencies:** TASK-011
- **UX Considerations:** Must load quickly, show most relevant dynasty insights
- **Technical Notes:** Use Radix Dialog with custom animations, fetch dynasty metrics from new service

**TASK-013: League Context Tag Component**
- **Description:** Small chip showing which league(s) a player status applies to
- **Acceptance Criteria:**
  - Props: league name, count (if multiple leagues)
  - Compact design (Caption typography)
  - Color-coded by league (optional)
  - Max-width defined (truncate long names)
- **Priority:** Could Have
- **Estimated Effort:** S (1 day)
- **Dependencies:** TASK-001
- **UX Considerations:** Provides essential context without clutter
- **Technical Notes:** Reuse Badge component from shadcn/ui with custom styling

#### Sprint 2B: Card & Layout Components (7 days)
**Tasks:**

**TASK-014: Standardized Card Component Variants**
- **Description:** Create consistent card patterns for league, player, and stat displays
- **Acceptance Criteria:**
  - LeagueCard: name, season, roster count, CTA
  - StatCard: icon, label, value, trend indicator
  - PlayerCard: player row + expanded info
  - All cards use surface colors and 8px grid spacing
- **Priority:** Should Have
- **Estimated Effort:** M (3 days)
- **Dependencies:** TASK-001, TASK-002
- **UX Considerations:** Cards provide visual grouping and hierarchy
- **Technical Notes:** Extend shadcn Card component

**TASK-015: Filter Control Components**
- **Description:** Build filter chips and segmented controls for rankings/rosters
- **Acceptance Criteria:**
  - FilterChip: label, active state, count badge (optional)
  - SegmentedControl: 2-4 options, clear active state, 44px height
  - FilterGroup: horizontal scroll on mobile
  - Persist selected filters to localStorage
- **Priority:** Must Have
- **Estimated Effort:** M (2 days)
- **Dependencies:** TASK-001, TASK-007
- **UX Considerations:** Must be immediately clear which filter is active
- **Technical Notes:** Use Radix Toggle Group for segmented control

**TASK-016: Responsive Layout Utilities**
- **Description:** Create layout patterns for consistent responsive behavior
- **Acceptance Criteria:**
  - Mobile: single column, full-width cards
  - Tablet: 2-column grid
  - Desktop: 3-column grid or sidebar layout
  - Fluid breakpoints (not hard-coded widths)
- **Priority:** Should Have
- **Estimated Effort:** M (2 days)
- **Dependencies:** TASK-002
- **UX Considerations:** Adapts to user's device without information loss
- **Technical Notes:** Use Tailwind responsive utilities (sm:, md:, lg:)

#### Sprint 2C: Semantic Components (Dynasty-Specific) (5 days)
**Tasks:**

**TASK-017: Dynasty Status Indicators**
- **Description:** Create visual indicators for dynasty-specific player states
- **Acceptance Criteria:**
  - Breakout candidate: upward arrow icon + green
  - Declining asset: downward arrow icon + red
  - Hold/stable: horizontal line icon + amber
  - Rookie: star icon + blue
  - Veteran: shield icon + gray
  - Icons + color (never color alone)
- **Priority:** Should Have
- **Estimated Effort:** M (2 days)
- **Dependencies:** TASK-001, TASK-006
- **UX Considerations:** Must be instantly understandable without legend
- **Technical Notes:** Use semantic colors from design system

**TASK-018: Trend Visualization Micro-Components**
- **Description:** Small charts/graphs for showing trends (inspired by Conflict Score bar)
- **Acceptance Criteria:**
  - Sparkline: 7-game performance trend
  - Progress bar: age curve position (e.g., "72% of peak")
  - Segmented bar: roster position strength (deep/average/weak)
  - Compact (fits in player row)
- **Priority:** Could Have
- **Estimated Effort:** M (3 days)
- **Dependencies:** TASK-001
- **UX Considerations:** Transforms complex data into instant visual insight
- **Technical Notes:** Use recharts or custom SVG

---

### Phase 3: Feature Implementation (Dynasty Views)
**Goal:** Implement dynasty-specific features using new component library
**Timeline:** 4-5 weeks
**Success Metrics:**
- 3 new dynasty-focused views
- User testing with 10+ dynasty managers
- Feature adoption rate >60%

#### Sprint 3A: "My Players" Cross-League View (8 days)
**Tasks:**

**TASK-019: Design "My Players" Page Architecture**
- **Description:** Plan data model and UI for showing all user's players across leagues
- **Acceptance Criteria:**
  - Define data structure (player ID → [leagues owned])
  - Sketch wireframes for mobile and desktop
  - Identify API calls needed (rosters from all leagues)
  - Document in FEATURE_SPEC.md
- **Priority:** Must Have
- **Estimated Effort:** S (1 day)
- **Dependencies:** None
- **UX Considerations:** Must handle users with 1 league vs 10+ leagues
- **Technical Notes:** Consider caching strategy (IndexedDB)

**TASK-020: Implement "My Players" Data Service**
- **Description:** Service to aggregate user's players across all leagues
- **Acceptance Criteria:**
  - Input: user ID, list of league IDs
  - Output: { playerId: string, leagues: [{ leagueId, leagueName, rosterPosition }] }
  - Handles multiple leagues in parallel (Promise.all)
  - Error handling for failed league fetches
- **Priority:** Must Have
- **Estimated Effort:** M (2 days)
- **Dependencies:** TASK-019
- **UX Considerations:** Must be fast (<2s for 5 leagues)
- **Technical Notes:** Add to lib/dynasty/ directory

**TASK-021: Build "My Players" Page UI**
- **Description:** Full-page view showing all players with filter and sort controls
- **Acceptance Criteria:**
  - Filter chips: All, QB, RB, WR, TE, Rookies
  - Sort dropdown: By name, by position, by league count
  - Uses Player Row component (TASK-011)
  - Tapping player opens dynasty detail modal (TASK-012)
  - Skeleton loader while fetching
  - Empty state if no leagues connected
- **Priority:** Must Have
- **Estimated Effort:** L (4 days)
- **Dependencies:** TASK-011, TASK-012, TASK-015, TASK-020
- **UX Considerations:** Must work on 375px mobile, list should be scannable
- **Technical Notes:** Create app/my-players/page.tsx

**TASK-022: Add "My Players" to Bottom Tab Navigation**
- **Description:** Add "My Players" as 4th or 5th tab in bottom navigation
- **Acceptance Criteria:**
  - New tab with person icon + "My Players" label
  - Tab active state works
  - Route: /my-players
- **Priority:** Must Have
- **Estimated Effort:** XS (1 day)
- **Dependencies:** TASK-005, TASK-021
- **UX Considerations:** Tab bar may need to handle 5 tabs (consider "More" overflow)
- **Technical Notes:** Update navigation component

#### Sprint 3B: Settings Page (Dynasty Preferences) (7 days)
**Tasks:**

**TASK-023: Design Settings Page Architecture**
- **Description:** Plan settings structure and storage strategy
- **Acceptance Criteria:**
  - Define settings schema: scoring system, position preferences, league stakes
  - Choose storage: localStorage (short-term) vs database (long-term)
  - Sketch UI (list-based settings page)
  - Document in FEATURE_SPEC.md
- **Priority:** Should Have
- **Estimated Effort:** S (1 day)
- **Dependencies:** None
- **UX Considerations:** Settings must sync across devices (future: auth + DB)
- **Technical Notes:** Start with localStorage, plan DB migration path

**TASK-024: Implement Settings Storage Service**
- **Description:** Service for saving/loading user preferences
- **Acceptance Criteria:**
  - Save preferences to localStorage
  - Load preferences with defaults if not set
  - Type-safe interface (TypeScript)
  - Update hook: useSettings() → { settings, updateSettings }
- **Priority:** Should Have
- **Estimated Effort:** S (1 day)
- **Dependencies:** TASK-023
- **UX Considerations:** Must handle corrupt/missing localStorage data gracefully
- **Technical Notes:** Add to lib/dynasty/ or lib/settings/

**TASK-025: Build Settings Page UI**
- **Description:** Full-page settings view with form controls
- **Acceptance Criteria:**
  - Section: Scoring System (PPR, Half-PPR, Standard radio buttons)
  - Section: League Stakes (list of leagues with input fields)
  - Section: Position Preferences (Superflex, TE Premium toggles)
  - Section: Default View (By Position, By Team, By Value)
  - Save button with confirmation toast
  - Uses surface colors and typography scale
- **Priority:** Should Have
- **Estimated Effort:** L (4 days)
- **Dependencies:** TASK-001, TASK-024
- **UX Considerations:** Must be easy to understand (helper text for each setting)
- **Technical Notes:** Create app/settings/page.tsx

**TASK-026: Wire Settings into Ranking/Trade Services**
- **Description:** Update AI rankings and trade evaluation to use user settings
- **Acceptance Criteria:**
  - Rankings service uses scoring system preference
  - Trade evaluator weights by league stakes
  - Position filters respect user preferences
- **Priority:** Should Have
- **Estimated Effort:** M (1 day)
- **Dependencies:** TASK-024, TASK-025
- **UX Considerations:** Settings should immediately affect app behavior
- **Technical Notes:** Update lib/ai-rankings-service.ts and lib/trade-evaluation-service.ts

#### Sprint 3C: Enhanced Rankings Page (7 days)
**Tasks:**

**TASK-027: Add Filter Chips to Rankings Page**
- **Description:** Add position and status filters to rankings page
- **Acceptance Criteria:**
  - Filter chips: All, QB, RB, WR, TE, Rookies, Breakout, Declining
  - Active filter clearly indicated
  - Updates table in real-time (no page reload)
  - Persists selection to sessionStorage
- **Priority:** Must Have
- **Estimated Effort:** M (2 days)
- **Dependencies:** TASK-015
- **UX Considerations:** Mobile: horizontal scroll for filters, desktop: wrap filters
- **Technical Notes:** Update app/rankings/page.tsx

**TASK-028: Add View Toggle (By Position / By Value)**
- **Description:** Segmented control to switch between position-based and overall value ranking views
- **Acceptance Criteria:**
  - 2-option toggle: "By Position" | "Overall Value"
  - By Position: shows separate tables for QB, RB, WR, TE
  - Overall Value: single ranked list (current behavior)
  - Active view persists to localStorage
- **Priority:** Should Have
- **Estimated Effort:** M (3 days)
- **Dependencies:** TASK-015
- **UX Considerations:** Position-based view helps with depth chart planning
- **Technical Notes:** Update rankings table rendering logic

**TASK-029: Integrate Dynasty Status Indicators**
- **Description:** Add dynasty status badges to rankings table
- **Acceptance Criteria:**
  - Each player row shows status indicator (breakout, declining, etc.)
  - Color + icon (never color alone)
  - Hovering/tapping shows tooltip with explanation
  - Data source: dynasty player service (new)
- **Priority:** Could Have
- **Estimated Effort:** M (2 days)
- **Dependencies:** TASK-017
- **UX Considerations:** Must not clutter the table, optional column on mobile
- **Technical Notes:** May require new dynasty metrics service

---

### Phase 4: Polish & Accessibility (Ongoing)
**Goal:** WCAG 2.1 AA compliance and production-ready polish
**Timeline:** 2-3 weeks (parallel to Phase 3)
**Success Metrics:**
- WCAG 2.1 AA compliant
- Lighthouse accessibility score >90
- Zero critical a11y issues

#### Sprint 4A: Accessibility Audit & Fixes (10 days)
**Tasks:**

**TASK-030: Run Comprehensive Accessibility Audit**
- **Description:** Use axe DevTools and Lighthouse to audit all pages
- **Acceptance Criteria:**
  - Document all accessibility violations in ACCESSIBILITY_AUDIT.md
  - Categorize by severity (critical, serious, moderate, minor)
  - Prioritize fixes (P0 = blocks screen reader users)
- **Priority:** Must Have
- **Estimated Effort:** M (2 days)
- **Dependencies:** None
- **UX Considerations:** Accessibility is a legal and ethical requirement
- **Technical Notes:** Use axe DevTools Chrome extension

**TASK-031: Fix Color Contrast Issues**
- **Description:** Ensure all text meets 4.5:1 contrast ratio
- **Acceptance Criteria:**
  - Audit all text color/background combinations
  - Update colors in design system if needed
  - Verify with contrast checker tool
  - No contrast failures in Lighthouse
- **Priority:** Must Have
- **Estimated Effort:** M (2 days)
- **Dependencies:** TASK-030
- **UX Considerations:** Critical for low-vision users
- **Technical Notes:** Use WebAIM Contrast Checker

**TASK-032: Add Alternative Text & ARIA Labels**
- **Description:** Ensure all images, icons, and interactive elements have accessible labels
- **Acceptance Criteria:**
  - All images have alt text (or role="presentation" if decorative)
  - All icons have aria-label or sr-only text
  - All interactive elements have accessible names
  - Screen reader testing passes
- **Priority:** Must Have
- **Estimated Effort:** M (3 days)
- **Dependencies:** TASK-030
- **UX Considerations:** Screen reader users must understand all content
- **Technical Notes:** Test with NVDA or VoiceOver

**TASK-033: Keyboard Navigation & Focus Management**
- **Description:** Ensure all interactive elements are keyboard accessible
- **Acceptance Criteria:**
  - All buttons, links, modals accessible via Tab
  - Focus indicator visible (2px outline)
  - Tab order logical (matches visual order)
  - Escape key closes modals
  - Focus returns to trigger element on modal close
- **Priority:** Must Have
- **Estimated Effort:** M (3 days)
- **Dependencies:** TASK-030
- **UX Considerations:** Keyboard-only users must access all features
- **Technical Notes:** Use focus-visible CSS, test with Tab key only

#### Sprint 4B: Microinteractions & Polish (5 days)
**Tasks:**

**TASK-034: Add Loading Transitions & Animations**
- **Description:** Implement subtle animations for state transitions
- **Acceptance Criteria:**
  - Page transitions: 200ms fade
  - Modal entrance: slide up from bottom (300ms)
  - Button hover: subtle scale (0.98x)
  - Data updates: pulse animation (highlight new values)
- **Priority:** Could Have
- **Estimated Effort:** M (2 days)
- **Dependencies:** TASK-008, TASK-012
- **UX Considerations:** Animations provide feedback, but must be cancelable (prefers-reduced-motion)
- **Technical Notes:** Use framer-motion or CSS transitions

**TASK-035: Improve Error States**
- **Description:** User-friendly error messages with recovery actions
- **Acceptance Criteria:**
  - No raw error messages shown to users
  - Error state component with icon, title, message, CTA
  - Retry button for transient errors
  - Help link for persistent errors
- **Priority:** Should Have
- **Estimated Effort:** M (2 days)
- **Dependencies:** TASK-010
- **UX Considerations:** Errors should explain what happened and how to fix it
- **Technical Notes:** Update error boundaries and API error handling

**TASK-036: Add Help/Onboarding Tooltips**
- **Description:** Contextual help for complex features
- **Acceptance Criteria:**
  - Tooltips on hover/long-press for icons and badges
  - Onboarding tour for first-time users (optional)
  - "What's this?" help icons for dynasty-specific features
- **Priority:** Could Have
- **Estimated Effort:** S (1 day)
- **Dependencies:** None
- **UX Considerations:** Helps new users understand dynasty concepts
- **Technical Notes:** Use Radix Tooltip or Popper.js

---

## Prioritization Summary

### MoSCoW Priority Breakdown

#### Must Have (P0) - Critical for MVP
1. TASK-001: "Midnight Blue" Color System
2. TASK-002: 8-Point Grid System
3. TASK-004: Bottom Tab Bar Component
4. TASK-005: Migrate to Bottom Tab Bar
5. TASK-007: Touch Target Audit & Fixes
6. TASK-008: Skeleton Loader Library
7. TASK-009: Replace Spinners with Skeletons
8. TASK-011: Standardized Player Row
9. TASK-012: Player Detail Modal (Dynasty Context)
10. TASK-015: Filter Control Components
11. TASK-019-022: "My Players" Cross-League View
12. TASK-027: Rankings Filter Chips
13. TASK-030-033: Accessibility Audit & Fixes

**Estimated Total Effort:** 12-15 weeks (with 1-2 engineers)

#### Should Have (P1) - Important for Full Release
1. TASK-003: Typography Scale
2. TASK-006: Icon System
3. TASK-010: Standardized Empty States
4. TASK-014: Standardized Card Variants
5. TASK-016: Responsive Layout Utilities
6. TASK-017: Dynasty Status Indicators
7. TASK-023-026: Settings Page
8. TASK-028: Rankings View Toggle
9. TASK-035: Improve Error States

**Estimated Total Effort:** 6-8 weeks (with 1-2 engineers)

#### Could Have (P2) - Nice to Have
1. TASK-013: League Context Tags
2. TASK-018: Trend Visualization Micro-Components
3. TASK-029: Dynasty Status in Rankings Table
4. TASK-034: Microinteractions & Animations
5. TASK-036: Help/Onboarding Tooltips

**Estimated Total Effort:** 3-4 weeks (with 1-2 engineers)

#### Won't Have (P3) - Explicitly Out of Scope
1. Live game tracking features (Game Group component, live scores)
2. Roots/Boos/Conflicts concepts (game-day specific)
3. Real-time score updates via WebSocket
4. Week-by-week matchup analysis (beyond current dashboard)

---

## Risk Assessment

### High-Risk Items
1. **Bottom Tab Navigation (TASK-005):**
   - **Risk:** Major UX change may confuse existing users
   - **Mitigation:** Implement for mobile only first, A/B test, provide toggle in settings

2. **Cross-League Data Aggregation (TASK-020):**
   - **Risk:** Performance issues with 10+ leagues
   - **Mitigation:** Implement caching (IndexedDB), show progress indicator, paginate if needed

3. **Dynasty Metrics Calculation:**
   - **Risk:** Complex algorithms may slow down player modal
   - **Mitigation:** Pre-compute metrics, cache aggressively, lazy load non-critical data

### Medium-Risk Items
1. **Design System Migration:**
   - **Risk:** Refactoring all components may introduce bugs
   - **Mitigation:** Incremental rollout, comprehensive testing, visual regression testing

2. **Accessibility Compliance:**
   - **Risk:** May uncover deep architectural issues
   - **Mitigation:** Start audit early (Phase 1), fix incrementally

3. **Mobile Performance:**
   - **Risk:** Heavy data tables may lag on mobile
   - **Mitigation:** Virtual scrolling, reduce initial render size, optimize images

---

## Success Metrics & KPIs

### User Experience Metrics
- **Mobile Lighthouse Score:** >80 (currently unknown)
- **Time to Interactive:** <3s on Slow 4G
- **Touch Target Compliance:** 100% (currently ~50%)
- **WCAG 2.1 AA Compliance:** 100% (currently unknown)

### Feature Adoption Metrics
- **"My Players" View Usage:** >60% of multi-league users within 30 days
- **Settings Configuration:** >40% of users customize at least 1 setting
- **Bottom Tab Navigation:** <5% user complaints about navigation change
- **Mobile Traffic:** Increase from current baseline (measure first)

### Technical Quality Metrics
- **Component Reuse:** 80% of UI uses shared component library
- **Consistent Spacing:** 95% of components use 8px grid
- **Design System Coverage:** 100% of pages use "Midnight Blue" theme
- **Loading State Coverage:** 100% of data-fetching views have skeleton loaders

---

## Next Steps

### Immediate Actions (This Week)
1. **Create Design System Foundation:**
   - Set up Tailwind config with "Midnight Blue" colors
   - Document design tokens in DESIGN_SYSTEM.md
   - Share with team for review

2. **Prototype Bottom Tab Bar:**
   - Build simple prototype in Figma or code
   - Test on real mobile devices (iPhone SE, Android)
   - Get user feedback before full implementation

3. **Run Accessibility Audit:**
   - Use axe DevTools on current app
   - Document critical issues
   - Prioritize P0 fixes

4. **Set Up Testing Strategy:**
   - Mobile testing protocol (devices, viewports)
   - Visual regression testing (Percy or Chromatic)
   - User testing plan for major UX changes

### Sprint Planning Recommendations
1. **Start with Phase 1 (Foundation):**
   - High impact, low risk
   - Enables all future work
   - Relatively quick (2-3 weeks)

2. **Run Phase 4A (Accessibility) in Parallel:**
   - Long lead time for audit
   - Can fix issues as discovered
   - Don't block feature work

3. **Defer Phase 3C (Enhanced Rankings):**
   - Lower priority than "My Players" view
   - Can be incrementally improved
   - Existing rankings page is functional

---

## Appendix: Design Spec Concepts We're NOT Adopting

### Live Game Tracking (Explicitly Rejected)
**Why proposed:** Original spec is for game-day companion app
**Why rejected:** Our product is dynasty management, not live tracking
**Alternative:** Focus on post-game analysis and long-term trends

### Roots/Boos/Conflicts (Explicitly Rejected)
**Why proposed:** Track players across weekly matchups
**Why rejected:** Dynasty focus is multi-year, not weekly
**Alternative:** "My Players" cross-league view (ownership, not matchups)

### Week Selector (Adapted)
**Why proposed:** Navigate between NFL weeks
**Why adapted:** Dynasty cares about seasons, not weeks
**Our version:** Year selector (already implemented)

### League Entry Fees for Conflict Score (Rejected)
**Why proposed:** Weight scores by financial stakes
**Why rejected:** Feature doesn't exist in our app
**Adapted version:** League stake weighting for trade recommendations (future)

### Chronological vs By Game View (Rejected)
**Why proposed:** Different ways to view live game tracking
**Why rejected:** We don't track live games
**Adapted version:** By Position vs Overall Value (for rankings)

---

## Conclusion

The DynastyFF Analytics Platform design spec provides **exceptional value** for our design system, component architecture, and mobile-first approach. However, its **core feature set** (live game tracking) is fundamentally misaligned with our product vision (dynasty management).

**Strategic Recommendation:**
1. **Adopt:** Design system, component patterns, mobile-first UX, accessibility standards
2. **Adapt:** Player detail modal, filter controls, settings page (repurpose for dynasty)
3. **Reject:** Live game tracking, roots/boos/conflicts, real-time scoring

**Estimated Timeline:**
- **Phase 1 (Foundation):** 2-3 weeks → Production-ready design system
- **Phase 2 (Components):** 3-4 weeks → Reusable component library
- **Phase 3 (Features):** 4-5 weeks → "My Players" view, Settings, Enhanced Rankings
- **Phase 4 (Polish):** 2-3 weeks (parallel) → WCAG compliance

**Total Estimated Effort:** 11-15 weeks with 1-2 full-time engineers

**ROI Justification:**
- **User Retention:** Mobile-first UX addresses #1 user complaint
- **Accessibility:** Legal compliance + expands addressable market
- **Development Velocity:** Component library speeds up future features
- **Product Differentiation:** "My Players" view is unique to dynasty space

This roadmap transforms a game-day tracking spec into a dynasty management excellence initiative.

---

**Document prepared by:** Claude (Product Owner Agent)
**For review by:** Engineering team, Product leadership
**Next review date:** After Phase 1 Sprint 1A completion
