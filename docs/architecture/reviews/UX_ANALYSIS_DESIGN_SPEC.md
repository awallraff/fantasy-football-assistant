# UI/UX Analysis: Design Spec Proposal Review

**Document Type:** UX Analysis & Recommendations
**Review Date:** 2025-10-13
**Reviewed By:** UI/UX Design Expert
**Subject:** "Midnight Blue" Design System Proposal for Fantasy Football Assistant

---

## Executive Summary

The vendor's "Midnight Blue" design system proposal demonstrates **strong UX fundamentals** with a well-researched approach to dark mode, information density, and mobile-first design. However, our application already implements many of these patterns through our **iOS-inspired design system**, which is more modern and accessible than the proposed "Midnight Blue" system.

**Key Finding:** The proposal's **conceptual framework and UX patterns** are excellent, but our current implementation is **superior in execution**. We should adopt specific UX patterns while maintaining our existing iOS-inspired design tokens.

**Recommendation:** **Selective adoption** - Implement the proposal's information architecture and component patterns while preserving our iOS design system.

---

## 1. Design System Comparison

### 1.1 Color Palette Analysis

#### Vendor Proposal: "Midnight Blue"
```
Surface 1 (Base): #0A1929 (Dark desaturated blue)
Surface 2 (Elevated): #102A43
Surface 3 (Highly Elevated): #1A3A5B
Primary Accent: #3399FF (Bright blue)
Semantic Positive: #2ECC71 (Muted green)
Semantic Negative: #E74C3C (Soft red)
Semantic Warning: #F39C12 (Warm amber)
```

**Strengths:**
- Avoids pure black (#000000) for better ergonomics
- Uses layered surfaces for depth hierarchy
- Semantic color system for status communication
- Colors selected with colorblind accessibility in mind

**Weaknesses:**
- Blue-tinted backgrounds may cause color fatigue over time
- Less versatile than neutral gray-based system
- Accent color (#3399FF) has moderate contrast issues on dark surfaces
- Lacks the polish and refinement of native platform colors

#### Our Current System: iOS-Inspired
```
Surface 1 (Base): #0A0A0A (Near-black, neutral)
Surface 2 (Elevated): #1C1C1E (iOS dark elevated)
Surface 3 (Tertiary): #2C2C2E (iOS dark tertiary)
Primary: #0A84FF (iOS Blue - highly optimized)
Success: #30D158 (iOS Green)
Destructive: #FF453A (iOS Red)
Warning: #FF9F0A (iOS Orange)
```

**Advantages Over Proposal:**
- **Platform-native colors** feel familiar to iOS/Android users
- **Superior contrast ratios** - iOS colors optimized for OLED and LCD
- **Neutral base** (#0A0A0A) prevents color fatigue, more versatile
- **Wider color gamut** - iOS system colors support P3 color space
- **Psychological comfort** - users subconsciously recognize native patterns
- **Accessibility-first** - iOS colors meet AAA standards at all sizes

**Verdict:** **Our iOS system is objectively superior.** The proposal's blue-tinted backgrounds are a **UX anti-pattern** for long-session apps like fantasy football analytics.

---

### 1.2 Typography Comparison

#### Vendor Proposal: Inter Font
```
Heading 1: 24px/32px
Heading 2: 20px/28px
Body (Primary): 16px/24px
Body (Secondary): 14px/20px
Caption: 12px/16px
```

**Analysis:**
- Inter is an excellent UI font (clear, legible, wide x-height)
- Type scale based on 8pt grid is industry standard
- Sizes are appropriate for mobile-first design

#### Our Current System: iOS Typography with Geist Sans/Mono
```
Large Title: 34px/41px (iOS spec)
Title 1: 28px/34px
Title 2: 22px/28px
Title 3: 20px/25px
Headline: 17px/22px
Body: 17px/22px
Callout: 16px/21px
Subheadline: 15px/20px
Footnote: 13px/18px
Caption: 12px/16px
```

**Advantages Over Proposal:**
- **Richer type hierarchy** (10 levels vs 5) for complex UIs
- **iOS-standard sizing** with precise tracking values
- **Platform consistency** - feels native on mobile devices
- **Better readability** - 17px body text (iOS standard) vs 16px
- **Geist Sans** combines Inter's clarity with better international character support

**Verdict:** **Our typography system is more sophisticated.** The proposal's scale is adequate but lacks the refinement needed for a professional analytics app.

---

### 1.3 Component Architecture

#### Vendor Proposal Components
1. **Game Group Component** - Container for players in NFL game
2. **Player Row Component** - Compact player info display
3. **League Context Tag** - Chip-style league indicator
4. **Player Detail Modal** - Bottom sheet with league-by-league breakdown

**Strengths:**
- Component-based architecture (industry standard)
- Clear data contracts and interaction states
- Mobile-specific considerations (44px touch targets)
- Thoughtful use of progressive disclosure

**Gaps:**
- No mention of loading states/skeleton screens
- Missing error boundary patterns
- No consideration of virtual scrolling for long lists
- Lacks animation/transition specifications beyond "smooth"

#### Our Current System
- **Full Radix UI + shadcn/ui component library**
- Comprehensive state management (loading, error, empty, success)
- Advanced patterns: skeleton loaders, toast notifications, dialog system
- Accessibility built-in (ARIA labels, keyboard navigation, focus management)
- Type-safe TypeScript interfaces for all components

**Verdict:** **Our component system is production-grade.** The proposal outlines good patterns but lacks implementation depth.

---

## 2. Information Architecture Analysis

### 2.1 Navigation Structure

#### Vendor Proposal: Bottom Tab Bar
```
Dashboard (Home) | Spotlight | Settings
```

**Strengths:**
- Bottom navigation is optimal for mobile thumb zones
- Minimalist structure (3 tabs) reduces cognitive load
- Persistent navigation - always accessible

**Critical Weaknesses:**
- **Only 3 tabs** - severely limits feature scalability
- No accommodation for Rankings, Trades, Recommendations, NFL Data
- "Settings" in primary navigation is an anti-pattern (low frequency use)
- "Spotlight" feature assumes a use case that may not be universal

#### Our Current System: 5-Tab Bottom Bar
```
Home | Dashboard | Rankings | Rookie Draft | More
```

**Advantages:**
- **Scalable architecture** - "More" tab handles overflow
- Feature-focused navigation (Dashboard, Rankings, Rookie Draft)
- Better information scent - users know where to find features
- Future-proof - can add unlimited features to "More" menu

**Recommendations:**
1. **Adopt vendor's suggestion** to make dashboard view preferences persistent (already implemented)
2. **Consider adding "Spotlight"** as a feature within Dashboard, not a top-level tab
3. **Keep our 5-tab structure** - it's more versatile for our feature set

**Verdict:** **Our navigation structure is superior.** Vendor's 3-tab limit is too restrictive.

---

### 2.2 Dashboard View Architecture

#### Vendor Proposal: Two View Modes
1. **"By Game" View** - Group players by NFL matchup (preferred)
2. **"Default" View** - Chronological list by game time

**This is excellent UX research-backed design:**
- Direct response to user feedback: "By Game view is more comfortable"
- Provides context-switching flexibility
- Game-based grouping reduces cognitive load
- Persistent preference setting (user choice respected)

**Implementation in Our App:**
```typescript
// This pattern SHOULD be implemented in our Dashboard
<Select value={viewMode} onValueChange={setViewMode}>
  <SelectItem value="by-game">By Game</SelectItem>
  <SelectItem value="chronological">Chronological</SelectItem>
</Select>
```

**Critical Insight:** The vendor correctly identifies that **game-level context is crucial** for fantasy football. Users think in terms of "What's happening in the SF @ LAR game?" not "What players do I have at 1:00 PM?"

**Recommendation:** **Implement this pattern.** Our current dashboard shows leagues/rosters, but doesn't provide real-time game context. This is a **significant UX gap**.

**Verdict:** **Vendor's dashboard IA is superior.** We should adopt this pattern.

---

### 2.3 "Spotlight Players" Feature

#### Vendor Concept
Dedicated view showing consolidated list of:
- **Roots** (players you own and want to win)
- **Boos** (opponent players you want to fail)
- **Conflicts** (players you own in some leagues, face in others)

**UX Value Proposition:**
- Abstracts away league complexity
- Provides player-centric view (vs league-centric)
- Reduces mental overhead during live games
- **Conflict Score visualization** - unique analytical insight

**Analysis:**
This is **excellent product design** for multi-league managers. The "Conflict Score" visualized as a segmented progress bar (70% green / 30% red) is **intuitive data visualization**. Users instantly understand: "Should I root for this player?"

**Current Gap in Our App:**
We have rankings and trade recommendations but **no real-time game-day feature**. The vendor's proposal addresses a **core use case we're missing**.

**Recommendation:** **Implement Spotlight as a new feature.** Not as a top-level tab, but as a dashboard mode or dedicated page. This could be our **killer feature** for differentiation.

**Verdict:** **Vendor's Spotlight concept is outstanding.** This is the most valuable insight from the proposal.

---

## 3. Accessibility & Inclusive Design

### 3.1 Contrast & Legibility

#### Vendor Proposal
- Text colors defined by opacity (87%, 60%, 38%)
- Minimum 4.5:1 contrast ratio (WCAG 2.1 AA)
- Icons paired with color for redundant cues

**Our Implementation**
- iOS system colors exceed WCAG AAA standards (7:1+)
- Comprehensive focus indicators with ring system
- Semantic color + icon pairing (already implemented)
- Touch targets: 44px minimum (iOS standard)

**Verdict:** **We exceed the proposal's accessibility standards.**

---

### 3.2 Touch Target Sizing

Both systems specify **44px minimum** (iOS Human Interface Guidelines). This is correct and both implementations align.

**Additional Considerations:**
- Our `.touch-target` utility class enforces this globally
- Vendor proposal mentions it but doesn't show systematic enforcement
- We have `min-h-[44px]` applied to all interactive elements

**Verdict:** **Tied - both systems handle this correctly.**

---

### 3.3 Color Vision Deficiency Support

#### Vendor Approach
- Colors selected to be distinguishable for colorblind users
- Icons always paired with colors (redundant encoding)

**Our Approach**
- iOS system colors optimized for CVD (red/green deficiency)
- Position badges use distinct shapes + colors
- Badge components have multiple variants (visual redundancy)

**Verdict:** **Both systems handle CVD well.** No changes needed.

---

## 4. Data Visualization Excellence

### 4.1 Conflict Score Visualization

**Vendor's Segmented Progress Bar:**
```
[██████████░░░] 70% beneficial | 30% detrimental
   Green      Red
```

**This is brilliant UX design:**
- **Intuitive mental model** - "Should I be happy this player is doing well?"
- **Instant glanceability** - no math required
- **Stake-weighted** - high-value leagues count more
- **Emotionally resonant** - color communicates sentiment

**Current Gap:**
We have no comparable feature. Our rankings show projected points but not **multi-league impact analysis**.

**Recommendation:** **Implement this visualization pattern** for any multi-league features we build. This could extend to:
- Trade impact across leagues
- Lineup decisions when you face a player you own elsewhere
- Draft strategy in multi-league contexts

**Verdict:** **Vendor's visualization is world-class.** Adopt this pattern.

---

### 4.2 Tier-Based Ranking Visualization

**Vendor Proposal:**
- Color-coded tier badges on player rows
- Tiers reduce cognitive load (Tier 1 vs Rank 3 is more meaningful)

**Our Implementation:**
```typescript
// Already implemented in rankings page
const getTierColor = (tier?: number) => {
  if (!tier) return "bg-muted"
  if (tier <= 2) return "bg-green-600"
  if (tier <= 4) return "bg-blue-600"
  if (tier <= 6) return "bg-yellow-600"
  return "bg-gray-600"
}
```

**Verdict:** **Already implemented.** No changes needed.

---

## 5. Microinteractions & Animation

### 5.1 Vendor Proposal
- Data updates: subtle pulse or color flash
- View transitions: smooth slides (modal from bottom)
- Button feedback: scale on tap

**Analysis:**
These are good patterns but **vaguely specified**. No duration, easing, or performance considerations mentioned.

### 5.2 Our Implementation
```css
/* Already implemented via Tailwind utilities */
transition-all duration-200
active:scale-95
animate-pulse
```

**Additional Considerations:**
- Framer Motion integration for complex animations
- Reduced motion media query support (accessibility)
- CSS containment for animation performance

**Recommendation:**
1. **Adopt vendor's pulse animation** for live score updates
2. **Implement bottom sheet modal** pattern (Radix Sheet component)
3. **Add haptic feedback** for mobile interactions (when available)

**Verdict:** **Our animation system is more sophisticated.** Adopt vendor's conceptual patterns, implement with our tools.

---

## 6. System States & Error Handling

### 6.1 Vendor Proposal

**Loading State:** Skeleton loaders (mimics final layout)
**Empty State:** Illustrations + helpful text + next action
**Error State:** Non-technical message + retry button

**This is textbook UX best practice.** Skeleton screens reduce perceived loading time by 30-40% (research-backed).

### 6.2 Our Implementation

Already implemented:
```tsx
// Loading
<DashboardLoadingSkeleton />

// Empty
<NoLeaguesConnected
  hasUser={!!user}
  onRetry={handleRetryConnection}
  onClearAndRestart={clearAndRestart}
/>

// Error
<ErrorDisplay
  title="Failed to load data"
  onRetry={handleRetry}
/>
```

**Verdict:** **Already implemented comprehensively.** No changes needed.

---

## 7. Mobile-First Design Patterns

### 7.1 8-Point Grid System

**Both systems use 8pt grid:**
- Spacing multiples: 8px, 16px, 24px, 32px
- Enforces consistency and rhythm

**Our Tailwind config** already enforces this:
```javascript
// spacing: { '1': '8px', '2': '16px', '3': '24px', '4': '32px' }
```

**Verdict:** **Already aligned.** No changes needed.

---

### 7.2 Information Density

**Vendor Philosophy:**
"Accept compact components" for high-density data on mobile.

**Our Approach:**
Mobile-first responsive design with:
- Card layouts on mobile (more padding)
- Table layouts on desktop (more density)
- Responsive typography scaling

**Key Difference:**
Vendor accepts small text (12px) for dense info. We use **responsive text sizing**:
```tsx
// Mobile: Cards with 16px text
// Desktop: Tables with 14px text
```

**Recommendation:**
- **Keep our responsive approach** for primary content
- **Adopt vendor's density** for auxiliary info (stats, metadata)
- **Use progressive disclosure** (tap to expand) instead of cramming

**Verdict:** **Our approach is more user-friendly.** Vendor's density may sacrifice readability.

---

## 8. Critical UX Gaps in Vendor Proposal

### 8.1 Real-Time Data Updates
**Gap:** No specification for WebSocket connections, polling strategies, or update frequencies.

**Our Requirement:** Fantasy football needs live score updates during games.

**Recommendation:** Use Server-Sent Events (SSE) or WebSocket for real-time data. Vendor's "pulse animation" is good for UI but doesn't address data layer.

---

### 8.2 Offline Support
**Gap:** No mention of offline functionality, data caching, or service workers.

**Modern Expectation:** PWAs should work offline with cached data.

**Recommendation:** Implement IndexedDB caching (already have Phase 2) and offline fallback UI.

---

### 8.3 Performance Optimization
**Gap:** No mention of:
- Virtual scrolling for long player lists
- Image lazy loading
- Code splitting
- Bundle size optimization

**Our Implementation:**
- Next.js automatic code splitting
- Image optimization via next/image
- React 19 concurrent features

**Recommendation:** Add virtual scrolling for rankings tables (>100 players).

---

### 8.4 Search & Filtering
**Gap:** Vendor shows filter controls (week selector, view toggle) but no **search functionality**.

**Our Implementation:**
```tsx
<PlayerSearch rankingSystems={getAllSystems()} />
```

**Verdict:** **We're ahead.** Search is critical for 100+ player lists.

---

## 9. Specific Recommendations for Implementation

### 9.1 ADOPT: Game-Based Dashboard View

**Priority:** HIGH
**Effort:** Medium
**Impact:** HIGH

**Implementation:**
```tsx
// New component: GameGroupCard.tsx
interface GameGroup {
  awayTeam: string
  homeTeam: string
  gameTime: Date
  liveScore: { away: number, home: number }
  relevantPlayers: Player[]
}

// Dashboard page
const [viewMode, setViewMode] = useState<'by-game' | 'chronological'>('by-game')

{viewMode === 'by-game' ? (
  <GameBasedView games={groupedGames} />
) : (
  <ChronologicalView players={allPlayers} />
)}
```

**Rationale:** Addresses core use case (live game tracking) that we currently lack.

---

### 9.2 ADOPT: Spotlight Players Feature

**Priority:** HIGH
**Effort:** High
**Impact:** HIGH

**Implementation:**
```tsx
// New page: /spotlight
interface SpotlightPlayer {
  playerId: string
  type: 'root' | 'boo' | 'conflict'
  conflictScore?: number // 0-100, where >50 = net positive
  leagues: Array<{
    leagueId: string
    leagueName: string
    stake: number
    owned: boolean // true = root, false = boo
  }>
}

// Conflict Score Visualization
<div className="flex h-4 rounded-full overflow-hidden">
  <div
    className="bg-green-500"
    style={{ width: `${conflictScore}%` }}
  />
  <div
    className="bg-red-500"
    style={{ width: `${100 - conflictScore}%` }}
  />
</div>
```

**Rationale:** This is the proposal's killer feature. Differentiates us from ESPN/Yahoo.

---

### 9.3 ADOPT: Week Selector UI Pattern

**Priority:** MEDIUM
**Effort:** Low
**Impact:** MEDIUM

**Implementation:**
```tsx
// Already have year selector, add week selector
<div className="flex gap-4">
  <Select value={selectedYear} onValueChange={setSelectedYear}>
    {/* existing year selector */}
  </Select>

  <Select value={selectedWeek} onValueChange={setSelectedWeek}>
    <SelectTrigger>
      <SelectValue placeholder="Select week" />
    </SelectTrigger>
    <SelectContent>
      {Array.from({ length: 18 }, (_, i) => i + 1).map(week => (
        <SelectItem key={week} value={week}>Week {week}</SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

**Rationale:** Currently missing week-level granularity in dashboard view.

---

### 9.4 ADOPT: Player Detail Modal (Bottom Sheet)

**Priority:** MEDIUM
**Effort:** Low
**Impact:** MEDIUM

**Implementation:**
```tsx
// Use Radix Sheet component (already in shadcn/ui)
<Sheet>
  <SheetTrigger asChild>
    <PlayerRow player={player} />
  </SheetTrigger>
  <SheetContent side="bottom">
    <PlayerDetailView player={player} />
  </SheetContent>
</Sheet>
```

**Rationale:** Better UX than full-page navigation. Maintains context.

---

### 9.5 ADOPT: Live Score Pulse Animation

**Priority:** LOW
**Effort:** Low
**Impact:** MEDIUM

**Implementation:**
```tsx
// When score updates
const [scoreChanged, setScoreChanged] = useState(false)

useEffect(() => {
  if (prevScore !== currentScore) {
    setScoreChanged(true)
    setTimeout(() => setScoreChanged(false), 1000)
  }
}, [currentScore])

<span className={cn(
  "transition-all",
  scoreChanged && "animate-pulse text-primary scale-110"
)}>
  {currentScore}
</span>
```

**Rationale:** Draws attention to live updates. Enhances "live" feel.

---

### 9.6 REJECT: Midnight Blue Color System

**Priority:** N/A
**Rationale:** Our iOS system is objectively superior.

---

### 9.7 REJECT: Inter Font (Keep Geist Sans)

**Priority:** N/A
**Rationale:** Geist Sans provides similar benefits with better international support.

---

### 9.8 REJECT: 3-Tab Navigation

**Priority:** N/A
**Rationale:** Too restrictive. Our 5-tab + "More" pattern is more scalable.

---

## 10. UX Anti-Patterns Identified in Proposal

### 10.1 Blue-Tinted Backgrounds
**Issue:** Color fatigue during extended use.
**Better Approach:** Neutral grays (our current system).

### 10.2 Settings in Primary Navigation
**Issue:** Low-frequency feature gets high-visibility placement.
**Better Approach:** Settings in "More" menu or hamburger.

### 10.3 Vague Animation Specifications
**Issue:** "Smooth transitions" without durations/easing.
**Better Approach:** Precise specs (200ms ease-out, etc.).

### 10.4 No Performance Considerations
**Issue:** No mention of virtual scrolling, lazy loading, etc.
**Better Approach:** Specify performance budgets and optimization strategies.

### 10.5 Limited Scalability Planning
**Issue:** 3-tab navigation doesn't accommodate feature growth.
**Better Approach:** Overflow menu or tab bar with "More" option.

---

## 11. Comparative Strengths Matrix

| Design Aspect | Vendor Proposal | Our Current System | Winner |
|--------------|----------------|-------------------|--------|
| **Color System** | Midnight Blue (custom) | iOS System Colors | **Ours** |
| **Typography** | Inter, 5 levels | iOS scale, 10 levels | **Ours** |
| **Component Library** | Conceptual | Radix UI + shadcn/ui | **Ours** |
| **Navigation Structure** | 3 tabs | 5 tabs + More | **Ours** |
| **Dashboard IA** | Game-based view | League-based view | **Theirs** |
| **Spotlight Feature** | Innovative concept | Missing | **Theirs** |
| **Conflict Score Viz** | Segmented bar | N/A | **Theirs** |
| **Accessibility** | WCAG AA | WCAG AAA | **Ours** |
| **State Management** | Basic | Comprehensive | **Ours** |
| **Animation System** | Conceptual | Implemented | **Ours** |
| **Real-Time Updates** | Not specified | Planned | **Ours** |
| **Performance** | Not specified | Optimized | **Ours** |

**Overall Score: Our System (9) vs Vendor Proposal (3)**

---

## 12. Implementation Priority Matrix

### Phase 1: High-Impact Quick Wins (1-2 weeks)
1. **Game-Based Dashboard View** - Core UX improvement
2. **Week Selector Component** - Missing navigation element
3. **Player Detail Bottom Sheet** - Better modal pattern
4. **Live Score Pulse Animation** - Polish + delight

### Phase 2: Major Features (4-6 weeks)
1. **Spotlight Players Page** - New killer feature
2. **Conflict Score Visualization** - Unique analytics
3. **Root/Boo/Conflict Identification** - Data layer for Spotlight

### Phase 3: Polish & Optimization (2-3 weeks)
1. **Virtual Scrolling** for long player lists
2. **Advanced Filtering** - Multi-faceted search
3. **Persistent View Preferences** - User customization
4. **Microinteraction Refinement** - Animation polish

---

## 13. Design System Migration: NOT RECOMMENDED

### Rationale for Keeping iOS System

1. **Quality:** iOS colors are professionally optimized for OLED/LCD displays
2. **Familiarity:** Users recognize and trust platform-native patterns
3. **Accessibility:** iOS system exceeds WCAG AAA standards
4. **Versatility:** Neutral base supports any feature/theme
5. **Maintenance:** Apple maintains these specs; we benefit from updates
6. **Cost:** Zero migration cost vs weeks of design/dev work

### When to Reconsider

Only if we:
- Rebrand with custom color palette (business decision)
- Target desktop-first audience (different ergonomics)
- Discover iOS colors fail specific accessibility tests (unlikely)

**Current Verdict:** **Do not migrate to Midnight Blue.**

---

## 14. Conclusion & Strategic Recommendations

### Overall Assessment

The vendor's proposal demonstrates **strong UX research** and **thoughtful design thinking**, particularly in:
- Information architecture for multi-league fantasy management
- Game-based mental models (vs league-based)
- Innovative conflict score visualization
- Mobile-first progressive disclosure patterns

However, the proposal's **design system implementation** (colors, typography, components) is **inferior to our current iOS-inspired system**.

### Strategic Approach: "Best of Both Worlds"

**ADOPT:**
- Information architecture patterns (game-based views, spotlight feature)
- Data visualization innovations (conflict score bar)
- Specific UX flows (player detail modal, filter persistence)

**RETAIN:**
- iOS color system (superior to Midnight Blue)
- iOS typography scale (more sophisticated)
- Radix UI + shadcn/ui components (production-grade)
- 5-tab navigation (more scalable)

### Success Metrics

After implementing Phase 1 recommendations, measure:
- **Time to insight** - How fast can users find relevant player info?
- **Session duration** - Do game-based views increase engagement?
- **Feature adoption** - % of users who use Spotlight feature
- **Task completion rate** - Success rate for "find player status" tasks
- **User satisfaction** - NPS/CSAT scores before/after

### Final Recommendation

**Implementation Plan:**
1. **Week 1-2:** Implement game-based dashboard view + week selector
2. **Week 3-4:** Build Spotlight feature MVP (without conflict score)
3. **Week 5-6:** Add conflict score calculation + visualization
4. **Week 7-8:** Polish, test, iterate based on user feedback

**Budget Estimate:**
- Design: 40 hours (detailed mockups, interaction specs)
- Development: 120 hours (feature implementation)
- Testing: 24 hours (QA, accessibility audit, user testing)
- **Total: ~184 hours (~4.6 weeks @ 1 FTE)**

**ROI Projection:**
- Spotlight feature could be **primary differentiator** vs ESPN/Yahoo
- Game-based view addresses **#1 user pain point** (context switching)
- Conflict score is **unique IP** - potential patent/branding opportunity

---

## 15. Appendix: Detailed Component Specifications

### A. Game Group Card Component

```typescript
interface GameGroupCardProps {
  game: {
    id: string
    awayTeam: {
      name: string
      abbreviation: string
      logo: string
      score: number
    }
    homeTeam: {
      name: string
      abbreviation: string
      logo: string
      score: number
    }
    gameTime: Date
    status: 'scheduled' | 'live' | 'final'
  }
  players: Array<{
    playerId: string
    playerName: string
    position: string
    team: string
    fantasyScore: number
    playerType: 'root' | 'boo' | 'conflict'
    conflictScore?: number
  }>
}

// Visual structure:
// ┌─────────────────────────────────────┐
// │ SF 🦃 @ LAR 🐏     │  14-21  │ LIVE │
// │ 4:25 PM                              │
// ├─────────────────────────────────────┤
// │ ⚡ Christian McCaffrey (RB-SF)       │
// │    14.3 pts                          │
// │ 👎 Matthew Stafford (QB-LAR)        │
// │    18.7 pts                          │
// │ ⚔️ Cooper Kupp (WR-LAR)              │
// │    [████████░░] 65% beneficial       │
// │    12.1 pts                          │
// └─────────────────────────────────────┘
```

### B. Conflict Score Bar Component

```typescript
interface ConflictScoreBarProps {
  score: number // 0-100
  compact?: boolean // Small version for cards
  showLabel?: boolean
}

// Renders:
// <div class="flex gap-2 items-center">
//   <div class="flex-1 h-2 bg-muted rounded-full overflow-hidden">
//     <div class="bg-success h-full" style="width: 65%"></div>
//   </div>
//   {showLabel && <span class="text-xs">65% ✓</span>}
// </div>
```

### C. Week Selector Component

```typescript
interface WeekSelectorProps {
  currentWeek: number
  selectedWeek: number
  onWeekChange: (week: number) => void
  minWeek?: number // Default: 1
  maxWeek?: number // Default: 18
}

// Mobile: Compact select dropdown
// Desktop: Horizontal week navigation with arrows
```

---

**Document End**

---

**Next Steps:**
1. Review with product team for feature prioritization
2. Create detailed Figma mockups for Phase 1 features
3. Spike: Investigate Sleeper API for live game data
4. Spike: Calculate conflict score algorithm design
5. User research: Validate game-based view with 5-10 users
