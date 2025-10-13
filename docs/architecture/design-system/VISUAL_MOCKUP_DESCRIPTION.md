# iOS Dark Theme - Visual Mockup Description

## Mobile View (375px - 430px)

### Bottom Tab Bar
```
┌─────────────────────────────────────────┐
│                                         │
│         (Page Content Area)             │
│                                         │
│                                         │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  🏠    📊    📈    👥    ⋯             │
│ Home  Dash  Rank  Rook  More           │
│  ●                                      │ ← Active indicator (blue pill)
│ (Glass morphism frosted background)     │
└─────────────────────────────────────────┘
```

**Colors:**
- Background: Frosted glass (rgba(28, 28, 30, 0.72))
- Active tab: Blue background pill (#0A84FF at 15% opacity)
- Active icon/text: iOS Blue (#0A84FF)
- Inactive icon/text: Gray (#8E8E93)
- Border top: White at 10% opacity

**Behavior:**
- Fixed to bottom of screen
- Always visible
- Respects safe area insets (home indicator)
- Active state with scale animation
- Press feedback (scale 0.98)

---

### Home Page (Mobile)

```
┌─────────────────────────────────────────┐
│  Fantasy Analytics              [≡]     │ ← Simple header, no full nav
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Welcome back, Username!          │ │
│  │  Connect your Sleeper account     │ │
│  │                                   │ │
│  │  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │ │
│  │  ┃  Connect Sleeper           ┃  │ │ ← iOS blue button, 44px min
│  │  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Recent Activity                        │
│  ┌───────────────────────────────────┐ │
│  │ [Icon] Trade completed            │ │
│  │        2 hours ago                │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  🏠    📊    📈    👥    ⋯             │ ← Bottom tab bar
└─────────────────────────────────────────┘
```

**Background**: Pure dark (#0A0A0A)
**Cards**: #1C1C1E with subtle border and shadow

---

### Dashboard Page (Mobile)

```
┌─────────────────────────────────────────┐
│  ← League Name              2025  [↻]   │ ← Back button, year, refresh
│                                         │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│  ┃ Overview │ Teams │ Standings │ +  ┃ │ ← iOS segmented control
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                                         │
│  League Overview                        │
│  ┌───────────────────────────────────┐ │
│  │  12 Teams  •  Week 15  •  PPR    │ │
│  │                                   │ │
│  │  Your Team: The Champions         │ │
│  │  Rank: 3rd  •  8-5 Record        │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Your Roster                            │
│  ┌───────────────────────────────────┐ │
│  │  [QB] Patrick Mahomes      24.8  │ │ ← Position badge (red for QB)
│  │  KC  •  vs LV                    │ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │  [RB] Christian McCaffrey   31.2 │ │ ← Teal for RB
│  │  SF  •  vs SEA                   │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  🏠    📊    📈    👥    ⋯             │
└─────────────────────────────────────────┘
```

**Position Badge Colors:**
- QB: Red (#FF453A)
- RB: Teal (#5AC8FA)
- WR: Blue (#0A84FF)
- TE: Orange (#FF9F0A)
- K: Purple (#BF5AF2)
- DEF: Green (#30D158)

---

### Rankings Page (Mobile)

```
┌─────────────────────────────────────────┐
│  Rankings                               │
│                                         │
│  ┌─────────────┐  ┌─────────────────┐ │
│  │ Position ▼  │  │ Scoring Type ▼  │ │ ← iOS select dropdowns
│  └─────────────┘  └─────────────────┘ │
│                                         │
│  ┌────────┬────────┬────────┐         │
│  │  652   │  89    │  1.2K  │         │ ← Glass cards with stats
│  │ Players│ Sources│ Rank   │         │
│  └────────┴────────┴────────┘         │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  1  [RB] Christian McCaffrey      │ │
│  │     SF  •  Consensus #1  •  95.2 │ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │  2  [WR] CeeDee Lamb              │ │
│  │     DAL  •  Consensus #2  •  93.8│ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  🏠    📊    📈    👥    ⋯             │
└─────────────────────────────────────────┘
```

**Note**: On mobile, player cards replace table rows for better touch interaction

---

### More/Settings Page (Mobile)

```
┌─────────────────────────────────────────┐
│  More                                   │
│                                         │
│  Tools & Features                       │
│  ┌───────────────────────────────────┐ │
│  │  🗂️  NFL Data              >      │ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │  📈  Trade Analysis        >      │ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │  🎯  Recommendations       >      │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Settings                               │
│  ┌───────────────────────────────────┐ │
│  │  🌙  Dark Mode             ●      │ │ ← Toggle (always on)
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │  ℹ️  About                >      │ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │  🗑️  Clear Data            >      │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Version 1.0.0                          │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  🏠    📊    📈    👥    ⋯             │
└─────────────────────────────────────────┘
```

**List Style**: iOS Settings app style with chevrons

---

## Desktop View (1280px+)

### Layout with Sidebar

```
┌─────────────────────────────────────────────────────────────┐
│  Sidebar (256px)      │  Main Content Area                  │
│  ┌──────────────┐     │                                     │
│  │  ⚡ Fantasy  │     │  (Page content here)                │
│  │   Analytics  │     │                                     │
│  └──────────────┘     │  - Dashboard                        │
│                       │  - Rankings                         │
│  🏠 Home              │  - Rookie Draft                     │
│  📊 Dashboard    ●    │  - etc.                             │ ← Active state (blue bg)
│  📈 Rankings          │                                     │
│  👥 Rookie Draft      │  Max width container: 1280px        │
│  🔄 Trade Analysis    │  Centered on larger screens         │
│  🎯 Recommendations   │                                     │
│  🗂️ NFL Data          │                                     │
│  ⚙️ Settings           │                                     │
│                       │                                     │
│  ─────────────────    │                                     │
│  v1.0.0 - iOS Dark    │                                     │
└─────────────────────────────────────────────────────────────┘
```

**Sidebar:**
- Fixed left side
- Width: 256px
- Background: #1C1C1E (card color)
- Active item: Blue background (#0A84FF), white text
- Hover: #2C2C2E background

**Main Content:**
- Left margin: 256px
- Full height
- Background: #0A0A0A

---

## Component Examples

### Button Variants

```
┌─────────────────────────────────────────┐
│                                         │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃  Primary Button (iOS Blue)       ┃  │ ← #0A84FF background, white text
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Secondary Button (Ghost)       │   │ ← Border, transparent bg
│  └─────────────────────────────────┘   │
│                                         │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃  Destructive Button (Red)       ┃  │ ← #FF453A background
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
└─────────────────────────────────────────┘
```

**States:**
- Hover: Lighter shade, shadow increase
- Active: Darker shade, scale(0.98), shadow decrease
- Disabled: 50% opacity

---

### Card Examples

```
┌─────────────────────────────────────────┐
│  Standard Card (#1C1C1E)                │
│  ┌───────────────────────────────────┐  │
│  │  Card Title (20px, semibold)     │  │
│  │  Card description text (15px)    │  │
│  │                                  │  │
│  │  Content area...                 │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Glass Morphism Card (Frosted)          │
│  ┌───────────────────────────────────┐  │
│  │  [Frosted glass effect]          │  │
│  │  Backdrop blur + saturation      │  │
│  │  Semi-transparent background     │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

### Input/Form Examples

```
┌─────────────────────────────────────────┐
│  Username                               │ ← Label (15px, medium weight)
│  ┌───────────────────────────────────┐  │
│  │  Enter your username...           │  │ ← Input (44px height, 12px radius)
│  └───────────────────────────────────┘  │
│                                         │
│  Position                               │
│  ┌───────────────────────────────┐     │
│  │  Select position...        ▼  │     │ ← Select dropdown
│  └───────────────────────────────┘     │
└─────────────────────────────────────────┘
```

**Focus State:**
- Border color: #0A84FF (iOS Blue)
- Ring: 4px blur, primary color at 20% opacity
- Smooth transition: 200ms

---

### Table Example (Desktop)

```
┌─────────────────────────────────────────────────────────────┐
│  RANK    PLAYER              POSITION    TEAM    POINTS     │ ← Header (sticky, uppercase, small)
├─────────────────────────────────────────────────────────────┤
│  1       Christian McCaffrey  [RB]       SF      31.2       │ ← Row 1 (background)
│  2       CeeDee Lamb          [WR]       DAL     28.4       │ ← Row 2 (alternate bg)
│  3       Tyreek Hill          [WR]       MIA     27.9       │ ← Row 3 (background)
└─────────────────────────────────────────────────────────────┘
```

**Styling:**
- Header: #1C1C1E background, sticky
- Rows: Alternate between #0A0A0A and #1C1C1E
- Hover: #2C2C2E background
- Border: Separator color (rgba(84, 84, 88, 0.6))

---

## Color Palette Reference

### Primary Colors
- **iOS Blue**: #0A84FF (primary actions)
- **iOS Purple**: #BF5AF2 (secondary accent)
- **iOS Teal**: #5AC8FA (alternative accent)

### Status Colors
- **Green**: #30D158 (success)
- **Orange**: #FF9F0A (warning)
- **Red**: #FF453A (error/destructive)

### Backgrounds
- **Primary**: #0A0A0A (main background)
- **Card**: #1C1C1E (elevated surface 1)
- **Tertiary**: #2C2C2E (elevated surface 2)
- **Elevated**: #3A3A3C (elevated surface 3)

### Text
- **Primary**: #FFFFFF (white)
- **Secondary**: #8E8E93 (gray)
- **Tertiary**: #636366 (dark gray)
- **Placeholder**: #AEAEB2 (light gray)

### Borders
- **Primary**: #48484A (solid borders)
- **Separator**: rgba(84, 84, 88, 0.6) (divider lines)
- **Glass**: rgba(255, 255, 255, 0.1) (frosted glass border)

---

## Animation Examples

### Button Press
```
Normal state → Active state
scale(1) → scale(0.98)
Duration: 150ms
Easing: cubic-bezier(0.4, 0, 0.2, 1)
```

### Tab Switch
```
Inactive → Active
1. Background pill fades in (200ms)
2. Icon scales up to 110% (200ms)
3. Text weight changes to semibold
4. Color changes to primary
```

### Modal/Sheet Open
```
Bottom of screen → Visible
transform: translateY(100%) → translateY(0)
Duration: 300ms
Easing: cubic-bezier(0.4, 0, 0.2, 1)
```

### Card Hover
```
Normal → Hover
1. Shadow increases (sm → md)
2. Border opacity decreases (100% → 60%)
Duration: 200ms
```

---

## Accessibility Features

### Focus Indicators
```
┌─────────────────────────────────────────┐
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃  Focused Button                 ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│    ↑ 2px blue outline + 2px offset    │
└─────────────────────────────────────────┘
```

### Touch Targets
- All interactive elements: 44x44px minimum
- Buttons: 44px height, adequate width
- Tab bar items: 60px width minimum
- Table rows: 44px height minimum

### Color Contrast
- White on #0A0A0A: 20.5:1 ✓
- Secondary text on #0A0A0A: 4.8:1 ✓
- Blue on #0A0A0A: 6.2:1 ✓
- All meet WCAG AA standards

---

**This mockup description provides a complete visual reference for implementing the iOS dark theme design system.**
