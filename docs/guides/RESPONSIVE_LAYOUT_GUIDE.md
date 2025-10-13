# Responsive Layout Utilities Guide (TASK-016)

**Last Updated:** 2025-10-13
**Status:** ✅ Complete

---

## Overview

Reusable responsive layout utilities for mobile-first design. Provides consistent patterns for grids, flex layouts, spacing, and containers across the application.

**Key Features:**
- Mobile-first responsive design (375px → 768px → 1024px+)
- Type-safe utility functions and React components
- Consistent spacing and breakpoints
- Common layout compositions

---

## Quick Start

### Function-Based API (Utility Functions)

```tsx
import { getResponsiveGrid, getPageContainer } from '@/lib/utils/layout'

export default function MyPage() {
  return (
    <div className={getPageContainer()}>
      <div className={getResponsiveGrid('1-2-3', 'md')}>
        <Card />
        <Card />
        <Card />
      </div>
    </div>
  )
}
```

### Component-Based API (React Components)

```tsx
import { PageContainer, ResponsiveGrid } from '@/components/layout/responsive-container'

export default function MyPage() {
  return (
    <PageContainer>
      <ResponsiveGrid pattern="1-2-3" gap="md">
        <Card />
        <Card />
        <Card />
      </ResponsiveGrid>
    </PageContainer>
  )
}
```

---

## Responsive Grids

### Pre-defined Grid Patterns

| Pattern | Mobile | Tablet | Desktop | Use Case |
|---------|--------|--------|---------|----------|
| `1-2-3` | 1 col | 2 cols | 3 cols | League cards, team cards |
| `1-2-4` | 1 col | 2 cols | 4 cols | Stats cards, metrics |
| `1-3-3` | 1 col | 3 cols | 3 cols | Player cards, compact lists |
| `2-4-4` | 2 cols | 4 cols | 4 cols | Icon grids, badges |
| `1-1-1` | 1 col | 1 col | 1 col | Mobile-only layouts |
| `2-3-4` | 2 cols | 3 cols | 4 cols | Dense data grids |

### Usage Examples

**Function API:**
```tsx
import { getResponsiveGrid } from '@/lib/utils/layout'

// League cards (1→2→3 columns)
<div className={getResponsiveGrid('1-2-3', 'md')}>
  {leagues.map(league => <LeagueCard key={league.id} {...league} />)}
</div>

// Stats cards (2→3→4 columns)
<div className={getResponsiveGrid('2-3-4', 'sm')}>
  {stats.map(stat => <StatCard key={stat.id} {...stat} />)}
</div>
```

**Component API:**
```tsx
import { ResponsiveGrid, CardGrid, StatsGrid } from '@/components/layout/responsive-container'

// Generic responsive grid
<ResponsiveGrid pattern="1-2-3" gap="md">
  {items.map(item => <Card key={item.id} {...item} />)}
</ResponsiveGrid>

// Convenience component for cards (1-2-3 pattern)
<CardGrid>
  {leagues.map(league => <LeagueCard key={league.id} {...league} />)}
</CardGrid>

// Convenience component for stats (2-3-4 pattern)
<StatsGrid>
  {stats.map(stat => <StatCard key={stat.id} {...stat} />)}
</StatsGrid>
```

### Custom Grid Builder

For unique column configurations:

```tsx
import { buildResponsiveGrid } from '@/lib/utils/layout'

// Custom: 1 col mobile, 2 tablet, 5 desktop
<div className={buildResponsiveGrid({ mobile: 1, tablet: 2, desktop: 5, gap: 'md' })}>
  {items.map(item => <Item key={item.id} {...item} />)}
</div>
```

---

## Page Containers

### Container Variants

| Variant | Max Width | Use Case |
|---------|-----------|----------|
| `standard` | `container` (1280px) | Most pages |
| `full` | No max-width | Data-heavy pages (rankings, rosters) |
| `narrow` | `max-w-4xl` (896px) | Content-focused pages (articles) |
| `wide` | `max-w-7xl` (1280px) | Dashboard, analytics |

### Usage Examples

**Function API:**
```tsx
import { getPageContainer } from '@/lib/utils/layout'

// Standard page container (most common)
<div className={getPageContainer('standard')}>
  {pageContent}
</div>

// Full-width for data tables
<div className={getPageContainer('full')}>
  <RankingsTable />
</div>
```

**Component API:**
```tsx
import { PageContainer } from '@/components/layout/responsive-container'

// Standard container
<PageContainer>
  {pageContent}
</PageContainer>

// Full-width container
<PageContainer variant="full">
  <RankingsTable />
</PageContainer>

// Use semantic HTML
<PageContainer as="main" variant="wide">
  <Dashboard />
</PageContainer>
```

---

## Responsive Flex Layouts

### Flex Patterns

| Pattern | Mobile | Tablet+ | Use Case |
|---------|--------|---------|----------|
| `col-row` | Column | Row | Sidebar + content |
| `row-col` | Row | Column | Rare edge cases |
| `col` | Column | Column | Always vertical |
| `row` | Row | Row | Always horizontal |
| `wrap-nowrap` | Wrap | No wrap | Card rows |

### Usage Examples

**Function API:**
```tsx
import { getResponsiveFlex } from '@/lib/utils/layout'

// Vertical on mobile, horizontal on desktop
<div className={getResponsiveFlex('col-row', 'md')}>
  <Sidebar />
  <MainContent />
</div>
```

**Component API:**
```tsx
import { ResponsiveFlex } from '@/components/layout/responsive-container'

// Header with responsive layout
<ResponsiveFlex pattern="col-row" gap="md" as="header">
  <Logo />
  <Navigation />
</ResponsiveFlex>
```

---

## Responsive Spacing

### Spacing Sizes

| Size | Mobile | Desktop | Use Case |
|------|--------|---------|----------|
| `section` | 24px | 32px | Standard section spacing |
| `sectionTight` | 16px | 24px | Compact sections |
| `sectionLarge` | 32px | 48px | Hero sections, major dividers |
| `pagePadding` | 24px | 32px | Page vertical padding |
| `sectionMargin` | 32px | 48px | Section bottom margin |

### Usage Examples

**Function API:**
```tsx
import { getResponsiveSpacing } from '@/lib/utils/layout'

// Section with standard spacing
<div className={getResponsiveSpacing('section')}>
  {content}
</div>
```

**Component API:**
```tsx
import { ResponsiveSection } from '@/components/layout/responsive-container'

// Section wrapper
<ResponsiveSection spacing="section">
  <h2>Section Title</h2>
  <p>Content...</p>
</ResponsiveSection>

// Large spacing for hero
<ResponsiveSection spacing="sectionLarge" as="div">
  <Hero />
</ResponsiveSection>
```

---

## Responsive Visibility

### Visibility Patterns

| Pattern | Mobile | Tablet | Desktop | Use Case |
|---------|--------|--------|---------|----------|
| `mobileOnly` | ✅ Show | ❌ Hide | ❌ Hide | Mobile nav, swipe actions |
| `tabletUp` | ❌ Hide | ✅ Show | ✅ Show | Desktop nav, detailed data |
| `desktopOnly` | ❌ Hide | ❌ Hide | ✅ Show | Advanced features |
| `hideMobile` | ❌ Hide | ✅ Show | ✅ Show | Same as `tabletUp` |
| `hideDesktop` | ✅ Show | ✅ Show | ❌ Hide | Mobile-specific UX |

### Usage Examples

**Function API:**
```tsx
import { getResponsiveVisibility } from '@/lib/utils/layout'

// Show only on mobile
<div className={getResponsiveVisibility('mobileOnly')}>
  <MobileNav />
</div>

// Show only on tablet/desktop
<div className={getResponsiveVisibility('tabletUp')}>
  <DesktopNav />
</div>
```

**Component API:**
```tsx
import { ResponsiveVisibility } from '@/components/layout/responsive-container'

// Mobile-only hamburger menu
<ResponsiveVisibility show="mobileOnly">
  <HamburgerMenu />
</ResponsiveVisibility>

// Desktop-only detailed table
<ResponsiveVisibility show="tabletUp">
  <DetailedTable />
</ResponsiveVisibility>
```

---

## Gap Sizes

### Gap Size Reference

| Size | Mobile | Tablet | Desktop | Use Case |
|------|--------|--------|---------|----------|
| `tight` | 8px | 12px | 16px | Dense data, compact lists |
| `sm` | 12px | 16px | 24px | Stats cards, icon grids |
| `md` | 16px | 24px | 32px | Standard spacing (most common) |
| `lg` | 24px | 32px | 48px | Hero sections, major groups |

### Usage

All grid and flex utilities accept a `gap` parameter:

```tsx
// Tight spacing for dense data
getResponsiveGrid('2-3-4', 'tight')

// Standard spacing (default)
getResponsiveGrid('1-2-3', 'md')

// Large spacing for hero sections
getResponsiveGrid('1-2-3', 'lg')
```

---

## Common Layout Compositions

Pre-configured layout patterns for common use cases:

```tsx
import { getLayoutComposition } from '@/lib/utils/layout'

// Card grid (1-2-3 with medium gap)
<div className={getLayoutComposition('cardGrid')}>
  {cards}
</div>

// Stats grid (2-3-4 with small gap)
<div className={getLayoutComposition('statsGrid')}>
  {stats}
</div>

// Hero section with spacing
<div className={getLayoutComposition('heroSection')}>
  <Hero />
</div>

// Dashboard container
<div className={getLayoutComposition('dashboardContainer')}>
  {dashboard}
</div>

// Data-heavy container (full-width)
<div className={getLayoutComposition('dataContainer')}>
  {data}
</div>
```

---

## Breakpoints Reference

| Breakpoint | Min Width | Tailwind | Use Case |
|------------|-----------|----------|----------|
| Mobile | 375px | (default) | iPhone SE, small phones |
| Tablet | 640px | `sm:` | Large phones, small tablets |
| Tablet | 768px | `md:` | iPads, tablets |
| Desktop | 1024px | `lg:` | Laptops, desktops |
| Desktop | 1280px | `xl:` | Large desktops |

**Mobile-First Approach:**
- Base styles target 375px (iPhone SE)
- Use `md:` for tablet+ (768px)
- Use `lg:` for desktop+ (1024px)

---

## Migration Guide

### Replacing Manual Tailwind Classes

**Before:**
```tsx
<div className="container mx-auto px-4 py-6 md:py-8">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
    {cards}
  </div>
</div>
```

**After (Function API):**
```tsx
<div className={getPageContainer()}>
  <div className={getResponsiveGrid('1-2-3', 'md')}>
    {cards}
  </div>
</div>
```

**After (Component API):**
```tsx
<PageContainer>
  <ResponsiveGrid pattern="1-2-3" gap="md">
    {cards}
  </div>
</PageContainer>
```

---

## Best Practices

### 1. Use Pre-defined Patterns

✅ **Good:**
```tsx
<div className={getResponsiveGrid('1-2-3', 'md')}>
```

❌ **Avoid:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
```

### 2. Choose Function vs Component API

**Use Functions when:**
- You need maximum performance (no extra React components)
- You're already using `className` for other utilities
- You need to combine with other utility classes

**Use Components when:**
- You want semantic JSX with clear intent
- You need semantic HTML elements (`as` prop)
- You prefer declarative React patterns

### 3. Page-Level Spacing

✅ **Use standard Tailwind for pages:**
```tsx
<div className={getPageContainer()}>
  <div className="mb-8 md:mb-12">
    {section}
  </div>
</div>
```

❌ **Don't use compact spacing for pages:**
```tsx
<div className="py-compact-lg"> {/* Too tight for pages */}
```

### 4. Component-Level Spacing

✅ **Use compact spacing within components:**
```tsx
<Card className="p-compact-md space-y-compact-sm">
  {/* Tight spacing for information density */}
</Card>
```

---

## TypeScript Support

All utilities are fully typed:

```tsx
import type {
  ResponsiveGridPattern,
  ResponsiveGapSize,
  PageContainerVariant,
  ResponsiveFlexPattern,
} from '@/lib/utils/layout'

// Type-safe function calls
const gridClass: string = getResponsiveGrid('1-2-3', 'md')
const containerClass: string = getPageContainer('standard')

// Type-safe component props
<ResponsiveGrid
  pattern="1-2-3"  // TypeScript will autocomplete and validate
  gap="md"
/>
```

---

## Examples from Codebase

### Dashboard Page

```tsx
import { getPageContainer, getResponsiveGrid } from '@/lib/utils/layout'

export default function DashboardPage() {
  return (
    <div className={getPageContainer()}>
      {/* League cards: 1 col mobile, 2 tablet, 3 desktop */}
      <div className={getResponsiveGrid('1-2-3', 'md')}>
        {leagues.map(league => <LeagueCard key={league.id} {...league} />)}
      </div>
    </div>
  )
}
```

### Rankings Page

```tsx
import { getPageContainer, getResponsiveGrid } from '@/lib/utils/layout'

export default function RankingsPage() {
  return (
    <div className={getPageContainer('full')}>
      {/* Stats: 2 cols mobile, 3 tablet, 4 desktop */}
      <div className={getResponsiveGrid('2-3-4', 'sm')}>
        <StatCard />
        <StatCard />
        <StatCard />
        <StatCard />
      </div>
    </div>
  )
}
```

### Rookie Draft Page (For parallel developer)

```tsx
import { PageContainer, ResponsiveGrid } from '@/components/layout/responsive-container'

export default function RookieDraftPage() {
  return (
    <PageContainer>
      <h1>Rookie Draft</h1>

      {/* Draft picks grid */}
      <ResponsiveGrid pattern="1-2-3" gap="md">
        {draftPicks.map(pick => (
          <DraftPickCard key={pick.id} {...pick} />
        ))}
      </ResponsiveGrid>
    </PageContainer>
  )
}
```

---

## Testing Across Viewports

### Test Checklist

Test all layouts at these breakpoints:

- ✅ **375px** - iPhone SE (mobile minimum)
- ✅ **768px** - iPad (tablet)
- ✅ **1024px** - Desktop (laptop)
- ✅ **1440px** - Large desktop

### Chrome DevTools Testing

1. Open DevTools (F12)
2. Toggle device toolbar (Cmd+Shift+M / Ctrl+Shift+M)
3. Select "Responsive" mode
4. Test at 375px, 768px, 1024px

### Visual Checks

- ✅ No horizontal scroll
- ✅ Consistent gap spacing
- ✅ Proper column counts at each breakpoint
- ✅ Touch targets ≥44px on mobile
- ✅ Text readable at all sizes

---

## Files Created

1. **`lib/utils/layout.ts`** (262 lines)
   - Utility functions for responsive layouts
   - Grid, flex, spacing, visibility helpers
   - TypeScript types

2. **`components/layout/responsive-container.tsx`** (274 lines)
   - React component wrappers
   - PageContainer, ResponsiveGrid, ResponsiveFlex, etc.
   - Type-safe component props

3. **`docs/guides/RESPONSIVE_LAYOUT_GUIDE.md`** (this file)
   - Comprehensive usage guide
   - Examples and best practices

---

## Support

**Questions?** See the inline JSDoc comments in `lib/utils/layout.ts` for detailed parameter descriptions.

**Need a new pattern?** Add it to `RESPONSIVE_GRIDS` or use `buildResponsiveGrid()` for custom configurations.

---

**Last Updated:** 2025-10-13
**Maintained By:** Claude (Phase 2 Lead)
**TASK-016 Status:** ✅ Complete
