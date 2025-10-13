# Information Density - Implementation Guide

Quick reference guide for implementing compact, information-dense layouts.

---

## Quick Start: Find & Replace

### Global Spacing Replacements

Use your IDE's find-and-replace (with regex) to update spacing across files:

```bash
# Page-level vertical padding
Find:    className="(.*?)py-8(.*?)"
Replace: className="$1py-4 md:py-6$2"

# Section bottom margins
Find:    className="(.*?)mb-8(.*?)"
Replace: className="$1mb-4 md:mb-6$2"

# Section spacing (space-y)
Find:    className="(.*?)space-y-6(.*?)"
Replace: className="$1space-y-3 md:space-y-4$2"

# Card top padding
Find:    className="(.*?)pt-6(.*?)"
Replace: className="$1pt-4 md:pt-6$2"

# Grid gaps
Find:    gap-4 md:gap-6
Replace: gap-2 md:gap-3

Find:    gap-6
Replace: gap-3 md:gap-4
```

**Warning:** Review each replacement manually. Not all spacing should be reduced (e.g., page margins for safe areas).

---

## Component Patterns

### Pattern 1: Icon-First Labels

**Use Case:** Replace verbose text with icon + short label

```tsx
// BEFORE
<p className="text-sm text-muted-foreground">
  Select a league to view detailed analytics and insights
</p>

// AFTER
<div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
  <BarChart3 className="h-4 w-4" />
  <span>Select league for analytics</span>
</div>
```

---

### Pattern 2: Compact Stats Card

**Use Case:** Dense metric display with icon background

```tsx
// BEFORE
<Card>
  <CardContent className="pt-6">
    <div className="flex items-center space-x-2">
      <BarChart3 className="h-5 w-5 text-primary" />
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  </CardContent>
</Card>

// AFTER
<Card>
  <CardContent className="pt-4 pb-4">
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <BarChart3 className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-bold truncate">{value}</p>
        <p className="text-xs text-muted-foreground truncate">{label}</p>
      </div>
    </div>
  </CardContent>
</Card>
```

**Key Changes:**
- `pt-6` → `pt-4 pb-4` (explicit bottom padding)
- `space-x-2` → `gap-2` (better flex layout)
- Added icon background circle
- `text-sm` → `text-xs` for label
- Added `truncate` for overflow protection

---

### Pattern 3: Mobile Icon-Only Tabs

**Use Case:** Reduce tab width by hiding text on mobile

```tsx
// BEFORE
<TabsTrigger value="overview" className="min-h-[44px]">
  Overview
</TabsTrigger>

// AFTER
<TabsTrigger value="overview" className="min-h-[44px]">
  <BarChart3 className="h-5 w-5 md:mr-2" />
  <span className="hidden md:inline">Overview</span>
  <span className="sr-only md:hidden">Overview</span>
</TabsTrigger>
```

**Key Changes:**
- Icon visible on all screens
- Text hidden on mobile (`hidden md:inline`)
- Screen reader text for accessibility (`sr-only`)
- Icon margin only on desktop (`md:mr-2`)

---

### Pattern 4: Abbreviated Badges

**Use Case:** Replace long text with single-letter badges

```tsx
// BEFORE
<div className="text-sm font-medium">
  {isStarter ? "Starter" : "Bench"}
</div>

// AFTER
<Badge variant={isStarter ? "default" : "secondary"} className="text-xs">
  {isStarter ? "S" : "B"}
</Badge>
```

**Alternative with Icons:**
```tsx
<Badge variant={isStarter ? "default" : "secondary"} className="text-xs">
  <TrendingUp className="h-3 w-3 mr-1" />
  {isStarter ? "S" : "B"}
</Badge>
```

---

### Pattern 5: Single-Line Metadata

**Use Case:** Compress multi-row info into single row with separators

```tsx
// BEFORE
<div className="space-y-1">
  <div className="text-sm text-muted-foreground">Sport: NFL</div>
  <div className="text-sm text-muted-foreground">Teams: 12</div>
  <div className="text-sm text-muted-foreground">Season: 2025</div>
</div>

// AFTER
<div className="flex items-center gap-2 text-xs text-muted-foreground">
  <Users className="h-3 w-3" />
  <span>12</span>
  <span>•</span>
  <Calendar className="h-3 w-3" />
  <span>2025</span>
  <span>•</span>
  <Badge variant="outline" className="text-[10px] px-1.5">NFL</Badge>
</div>
```

**Key Changes:**
- Vertical stack → horizontal flex
- Icons replace labels
- Bullet separators (•)
- Smaller text (`text-sm` → `text-xs`)
- Inline badge for categorical data

---

### Pattern 6: Mobile 2-Column Grid

**Use Case:** Show filters/controls side-by-side instead of stacked

```tsx
// BEFORE (Stacked on mobile)
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  {/* 4 filters */}
</div>

// AFTER (2x2 on mobile)
<div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
  {/* 4 filters */}
</div>
```

**Responsive Grid Examples:**
```tsx
// Always 3 columns, tighter on mobile
grid-cols-3 gap-2 md:gap-3

// 2 columns mobile, 4 desktop
grid-cols-2 gap-2 md:grid-cols-4 md:gap-3

// 1 column mobile, 3 desktop
grid-cols-1 gap-2 md:grid-cols-3 md:gap-3
```

---

### Pattern 7: Truncate with Tooltip

**Use Case:** Show abbreviated text with full text on hover

```tsx
// Component: lib/components/truncated-text.tsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function TruncatedText({ text, maxLength = 30 }: { text: string; maxLength?: number }) {
  const shouldTruncate = text.length > maxLength
  const displayText = shouldTruncate ? `${text.substring(0, maxLength)}...` : text

  if (!shouldTruncate) {
    return <span>{text}</span>
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="truncate cursor-help">{displayText}</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Usage
<TruncatedText text={player.notes || ""} maxLength={40} />
```

---

### Pattern 8: Icon-Only Buttons (Mobile)

**Use Case:** Show icon on mobile, text + icon on desktop

```tsx
// BEFORE
<Button onClick={handleClick} className="min-h-[44px]">
  <BarChart3 className="h-4 w-4 mr-2" />
  View Analytics
</Button>

// AFTER
<Button onClick={handleClick} className="min-h-[44px] px-3">
  <BarChart3 className="h-4 w-4 md:mr-2" />
  <span className="hidden md:inline">View Analytics</span>
  <span className="sr-only md:hidden">View Analytics</span>
</Button>
```

**Variant: Icon-Only, Always**
```tsx
<Button
  variant="ghost"
  size="icon"
  className="min-w-[44px] min-h-[44px] p-2"
  aria-label="View Analytics"
>
  <BarChart3 className="h-5 w-5" />
</Button>
```

---

## Spacing Constants

Create a centralized spacing config:

```typescript
// lib/config/spacing.ts

export const SPACING = {
  mobile: {
    // Page-level
    pageY: 'py-4',
    pageX: 'px-4',

    // Sections
    sectionMb: 'mb-4',
    sectionGap: 'space-y-3',

    // Cards
    cardPt: 'pt-4',
    cardPb: 'pb-4',
    cardPx: 'px-4',

    // Grids
    gridGap: 'gap-2',

    // Components
    componentGap: 'space-y-1.5',
    inlineGap: 'gap-2',
  },
  desktop: {
    // Desktop overrides
    pageY: 'md:py-6',
    sectionMb: 'md:mb-6',
    sectionGap: 'md:space-y-4',
    cardPt: 'md:pt-6',
    cardPb: 'md:pb-6',
    gridGap: 'md:gap-3',
    componentGap: 'md:space-y-2',
  }
}

// Helper to combine mobile + desktop
export function responsive(mobileKey: keyof typeof SPACING.mobile) {
  const mobile = SPACING.mobile[mobileKey]
  const desktop = SPACING.desktop[mobileKey] || ''
  return `${mobile} ${desktop}`.trim()
}

// Usage
<div className={cn('container mx-auto', responsive('pageX'), responsive('pageY'))}>
  {/* content */}
</div>
```

---

## Icon Library Setup

Centralize icon imports for consistency:

```typescript
// lib/ui/app-icons.ts

import {
  BarChart3,
  Users,
  Trophy,
  Activity,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  ArrowRightLeft,
  Brain,
  Search,
  Settings,
  Home,
  Filter,
  Database,
  RefreshCw,
  Trash2,
  ChevronRight,
  Plus,
  Minus,
  X,
  Check,
} from "lucide-react"

export const AppIcons = {
  // Navigation
  overview: BarChart3,
  teams: Users,
  standings: Trophy,
  activity: Activity,
  home: Home,

  // Stats
  trending: TrendingUp,
  declining: TrendingDown,
  target: Target,
  calendar: Calendar,

  // Features
  trades: ArrowRightLeft,
  ai: Brain,
  search: Search,
  settings: Settings,
  filter: Filter,

  // Data
  database: Database,
  refresh: RefreshCw,

  // Actions
  delete: Trash2,
  next: ChevronRight,
  add: Plus,
  remove: Minus,
  close: X,
  confirm: Check,
} as const

// Usage
import { AppIcons } from '@/lib/ui/app-icons'

<AppIcons.overview className="h-5 w-5" />
```

---

## Typography Scale

Use smaller text sizes for dense layouts:

```tsx
// Current typography
text-ios-body      // 17px
text-sm            // 14px
text-xs            // 12px

// Additional compact sizes
text-[10px]        // 10px (for badges)
text-[11px]        // 11px (for tight labels)

// Line height adjustments
leading-tight      // 1.25
leading-snug       // 1.375
leading-none       // 1
```

**Example:**
```tsx
// Normal density
<p className="text-sm text-muted-foreground">User Imported Rankings</p>

// High density
<p className="text-xs text-muted-foreground leading-tight truncate">Imported</p>

// Ultra-compact (badges)
<Badge className="text-[10px] px-1.5 py-0.5">Active</Badge>
```

---

## Responsive Breakpoint Strategy

Use mobile-first approach with progressive enhancement:

```tsx
// Mobile-first: Default is mobile
className="grid grid-cols-2 gap-2"

// Tablet: md breakpoint (768px)
className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3"

// Desktop: lg breakpoint (1024px)
className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3 lg:grid-cols-4 lg:gap-4"
```

**Spacing Breakpoints:**
```tsx
// Pattern: compact mobile, comfortable desktop
py-4 md:py-6           // Padding
mb-4 md:mb-6           // Margin
space-y-3 md:space-y-4 // Stack spacing
gap-2 md:gap-3         // Grid gap
text-xs md:text-sm     // Text size
```

---

## Touch Target Compliance

Ensure all interactive elements meet 44×44px minimum:

```tsx
// Button with text
<Button className="min-h-[44px] px-3">
  Click Me
</Button>

// Icon-only button
<Button
  variant="ghost"
  size="icon"
  className="min-w-[44px] min-h-[44px] p-2"
>
  <X className="h-5 w-5" />
</Button>

// Tab trigger
<TabsTrigger className="min-h-[44px] min-w-[44px]">
  <Users className="h-5 w-5" />
</TabsTrigger>

// Card with onClick
<Card
  onClick={handleClick}
  className="cursor-pointer min-h-[44px] p-3"
>
  {/* content */}
</Card>
```

**Rule of Thumb:**
- Icon size: 16-20px (h-4 to h-5)
- Padding: 12-14px (p-3 or p-3.5)
- Total: Icon + Padding ≥ 44px

---

## Badge Size Variants

Create consistent badge sizing:

```tsx
// Standard badge (current)
<Badge className="text-xs">Default</Badge>

// Compact badge
<Badge className="text-xs px-2 py-0.5">Compact</Badge>

// Ultra-compact badge
<Badge className="text-[10px] px-1.5 py-0">Tiny</Badge>

// Icon + text badge
<Badge className="text-xs flex items-center gap-1">
  <Check className="h-3 w-3" />
  Verified
</Badge>

// Single character badge
<Badge className="text-xs w-6 h-6 rounded-full flex items-center justify-center p-0">
  S
</Badge>
```

---

## Testing Checklist

After implementing density changes:

### Visual Testing
- [ ] Check 375px mobile viewport (iPhone SE)
- [ ] Check 768px tablet viewport (iPad)
- [ ] Check 1024px desktop viewport
- [ ] Verify no horizontal overflow
- [ ] Verify no text truncation issues
- [ ] Verify icon alignment

### Accessibility Testing
- [ ] Run Lighthouse accessibility audit (score ≥95)
- [ ] Use aXe DevTools to check violations
- [ ] Test keyboard navigation (Tab, Enter, Escape)
- [ ] Test screen reader announcements (NVDA/VoiceOver)
- [ ] Verify touch targets ≥44×44px
- [ ] Check color contrast ratios (WCAG AA)

### Performance Testing
- [ ] Page load time ≤2s on 3G
- [ ] Time to Interactive ≤2.5s
- [ ] No layout shift (CLS score <0.1)
- [ ] Verify no performance regression

### User Testing
- [ ] Can users find information faster?
- [ ] Are icons clearly understood?
- [ ] Is the UI still comfortable?
- [ ] Any complaints about cramped layout?

---

## Rollback Strategy

If density changes cause issues:

```tsx
// Feature flag approach
const useCompactLayout = localStorage.getItem('ff_compact_layout') !== 'false'

// Conditional spacing
<div className={useCompactLayout ? 'py-4' : 'py-8'}>
  {/* content */}
</div>

// Or use CSS custom properties
:root {
  --page-padding-y: 1rem; /* compact */
  /* --page-padding-y: 2rem; /* original */
}

.page-container {
  padding-top: var(--page-padding-y);
  padding-bottom: var(--page-padding-y);
}
```

---

## File Priority List

Implement in this order for maximum impact:

**Week 1: High Impact Pages**
1. `app/dashboard/page.tsx` - Main dashboard
2. `app/rankings/page.tsx` - Rankings page
3. `app/trades/page.tsx` - Trades page

**Week 2: Key Components**
4. `components/dashboard/league-card.tsx` - League cards
5. `components/enhanced-team-roster.tsx` - Team rosters
6. `components/roster/player-card.tsx` - Player cards

**Week 3: Supporting Components**
7. `components/league-overview.tsx` - League overview
8. `components/standings-table.tsx` - Standings
9. `components/recent-activity.tsx` - Activity feed

**Week 4: Polish & Optimization**
10. Test all breakpoints
11. Performance optimization
12. User feedback integration

---

## Common Pitfalls

### Pitfall 1: Breaking Touch Targets
**Problem:** Icon-only button too small
```tsx
// ❌ Wrong (only 32px)
<Button size="sm">
  <X className="h-4 w-4" />
</Button>

// ✅ Correct (44px)
<Button size="sm" className="min-w-[44px] min-h-[44px]">
  <X className="h-4 w-4" />
</Button>
```

### Pitfall 2: Hiding Critical Info
**Problem:** Over-abbreviating loses meaning
```tsx
// ❌ Wrong (unclear)
<Badge>ATP</Badge>

// ✅ Correct (with tooltip)
<Tooltip>
  <TooltipTrigger>
    <Badge>ATP</Badge>
  </TooltipTrigger>
  <TooltipContent>All-Time Points</TooltipContent>
</Tooltip>
```

### Pitfall 3: Desktop Compromised
**Problem:** Desktop also too compact
```tsx
// ❌ Wrong (no desktop adjustment)
className="py-4 gap-2 text-xs"

// ✅ Correct (progressive enhancement)
className="py-4 md:py-6 gap-2 md:gap-3 text-xs md:text-sm"
```

### Pitfall 4: Inconsistent Spacing
**Problem:** Some components dense, others spacious
```tsx
// ❌ Wrong (mixing systems)
<div className="space-y-6">  {/* old */}
  <Card className="pt-4">    {/* new */}
    {/* content */}
  </Card>
</div>

// ✅ Correct (consistent system)
<div className="space-y-3 md:space-y-4">
  <Card className="pt-4 md:pt-6">
    {/* content */}
  </Card>
</div>
```

---

## Quick Reference: Class Replacements

| Old Class | New Class (Mobile + Desktop) |
|-----------|------------------------------|
| `py-8` | `py-4 md:py-6` |
| `mb-8` | `mb-4 md:mb-6` |
| `space-y-6` | `space-y-3 md:space-y-4` |
| `pt-6` | `pt-4 md:pt-6` |
| `pb-6` | `pb-4 md:pb-6` |
| `gap-4` | `gap-2 md:gap-3` |
| `gap-6` | `gap-3 md:gap-4` |
| `p-3` | `p-2.5 md:p-3` |
| `text-sm` (labels) | `text-xs md:text-sm` |
| `space-x-2` | `gap-2` (with flex) |

---

**Document Version:** 1.0
**Last Updated:** 2025-01-13
**Author:** Claude (UI/UX Design Agent)
