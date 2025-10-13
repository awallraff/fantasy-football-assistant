# Dynasty Components

Dynasty-specific UI components for player evaluation and roster management.

## DynastyStatusIndicator

Visual indicator for dynasty-specific player states with icon + color. Follows WCAG 2.1 AA accessibility guidelines by never using color alone.

### Features

- **5 Status Types**: Breakout, Declining, Stable, Rookie, Veteran
- **3 Variants**: Icon-only, Icon with label, Badge
- **3 Sizes**: Small (sm), Medium (md), Large (lg)
- **Accessibility**: ARIA labels, tooltips, icon + color (never color alone)
- **Touch-Friendly**: All sizes meet 44x44px minimum touch target

### Usage

```tsx
import { DynastyStatusIndicator } from '@/components/dynasty/dynasty-status-indicator'
import { DynastyStatus } from '@/lib/dynasty/dynasty-status-types'

// Icon only (compact)
<DynastyStatusIndicator status={DynastyStatus.BREAKOUT} />

// Icon with label
<DynastyStatusIndicator
  status={DynastyStatus.ROOKIE}
  variant="icon-with-label"
/>

// Badge variant (pill-shaped)
<DynastyStatusIndicator
  status={DynastyStatus.DECLINING}
  variant="badge"
  size="lg"
/>

// Without tooltip
<DynastyStatusIndicator
  status={DynastyStatus.STABLE}
  showTooltip={false}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `status` | `DynastyStatus` | **Required** | Status type to display |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size of the indicator |
| `variant` | `'icon-only' \| 'icon-with-label' \| 'badge'` | `'icon-only'` | Display variant |
| `className` | `string` | `undefined` | Additional CSS classes |
| `showTooltip` | `boolean` | `true` | Show tooltip on hover |

### Dynasty Status Types

#### Breakout Candidate
- **Icon**: Trending Up arrow
- **Color**: Green (success)
- **Meaning**: Player showing signs of breaking out with strong upward trajectory

#### Declining Asset
- **Icon**: Trending Down arrow
- **Color**: Red (destructive)
- **Meaning**: Player's dynasty value declining due to age or performance drop

#### Stable Hold
- **Icon**: Horizontal line
- **Color**: Amber (warning)
- **Meaning**: Player maintaining consistent dynasty value

#### Rookie
- **Icon**: Star
- **Color**: Blue (accent)
- **Meaning**: Player in first NFL season

#### Veteran
- **Icon**: Shield
- **Color**: Gray (muted)
- **Meaning**: Experienced player with 5+ years in the NFL

### Accessibility

- **WCAG 2.1 AA Compliant**: All text meets 4.5:1 contrast ratio
- **Icon + Color**: Never relies on color alone for meaning
- **ARIA Labels**: Each indicator includes descriptive `aria-label` for screen readers
- **Tooltips**: Hover/focus reveals full description of status
- **Touch Targets**: All sizes meet minimum 44x44px guideline
- **Keyboard Navigation**: Fully accessible via keyboard

### Demo Page

Visit `/dynasty-status-demo` to see all variants, sizes, and status types in action.

### Examples in Context

**Player Row**:
```tsx
<div className="flex items-center gap-2">
  <span>Ja'Marr Chase</span>
  <DynastyStatusIndicator status={DynastyStatus.BREAKOUT} size="sm" />
</div>
```

**Rankings Table**:
```tsx
<td>
  <DynastyStatusIndicator
    status={DynastyStatus.ROOKIE}
    variant="badge"
  />
</td>
```

**Player Detail Modal**:
```tsx
<div className="space-y-2">
  <h3>Dynasty Analysis</h3>
  <DynastyStatusIndicator
    status={DynastyStatus.DECLINING}
    variant="icon-with-label"
    size="lg"
  />
</div>
```

### Task Tracking

This component implements **TASK-017: Dynasty Status Indicators** from the Design Spec Analysis:
- ✅ Breakout candidate: upward arrow icon + green
- ✅ Declining asset: downward arrow icon + red
- ✅ Hold/stable: horizontal line icon + amber
- ✅ Rookie: star icon + blue
- ✅ Veteran: shield icon + gray
- ✅ Icons + color (never color alone)
- ✅ WCAG 2.1 AA accessibility compliance
- ✅ Instant understanding without legend
- ✅ Semantic colors from design system
