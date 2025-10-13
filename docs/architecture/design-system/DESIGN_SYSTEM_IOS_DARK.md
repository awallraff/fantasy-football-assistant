# iOS Dark Theme Design System
## Fantasy Football Assistant - Complete Design Specification

---

## 1. Design Philosophy

**Core Principles:**
- **iOS Native Feel**: Replicate iOS dark mode aesthetic with precision
- **Mobile-First**: Optimized for iPhone 16 Pro Max (430px) and iPhone SE (375px)
- **Haptic-Friendly**: Touch targets minimum 44x44px with generous padding
- **Premium & Modern**: Clean, sophisticated, and professional
- **Accessibility**: WCAG 2.1 AA compliant with high contrast ratios

---

## 2. Color System

### Base Colors (iOS Dark Mode Palette)

```css
/* Deep Backgrounds */
--ios-black: #000000;           /* Pure black for OLED */
--ios-gray-900: #0A0A0A;        /* Primary background */
--ios-gray-800: #1C1C1E;        /* Elevated surface 1 */
--ios-gray-700: #2C2C2E;        /* Elevated surface 2 */
--ios-gray-600: #3A3A3C;        /* Elevated surface 3 */
--ios-gray-500: #48484A;        /* Separator/border */
--ios-gray-400: #636366;        /* Tertiary label */
--ios-gray-300: #8E8E93;        /* Secondary label */
--ios-gray-200: #AEAEB2;        /* Placeholder text */
--ios-gray-100: #C7C7CC;        /* Quaternary label */
--ios-white: #FFFFFF;           /* Primary text */

/* iOS System Colors (Dark Mode) */
--ios-blue: #0A84FF;            /* Primary action color */
--ios-blue-dark: #0057D9;       /* Pressed state */
--ios-blue-light: #409CFF;      /* Hover state */

--ios-purple: #BF5AF2;          /* Secondary accent */
--ios-purple-dark: #9234C2;     /* Pressed state */
--ios-purple-light: #CC79F7;    /* Hover state */

--ios-teal: #5AC8FA;            /* Alternative accent */
--ios-teal-dark: #31A8D4;       /* Pressed state */
--ios-teal-light: #77D4FC;      /* Hover state */

--ios-green: #30D158;           /* Success/positive */
--ios-green-dark: #23A341;      /* Pressed state */
--ios-green-light: #52D96E;     /* Hover state */

--ios-orange: #FF9F0A;          /* Warning */
--ios-orange-dark: #CC7F00;     /* Pressed state */
--ios-orange-light: #FFB23F;    /* Hover state */

--ios-red: #FF453A;             /* Destructive/error */
--ios-red-dark: #D93731;        /* Pressed state */
--ios-red-light: #FF6B62;       /* Hover state */

--ios-pink: #FF375F;            /* Alternative destructive */
--ios-yellow: #FFD60A;          /* Attention */
--ios-indigo: #5E5CE6;          /* Alternative primary */
```

### Semantic Color Tokens

```css
/* Backgrounds */
--background-primary: var(--ios-gray-900);
--background-secondary: var(--ios-gray-800);
--background-tertiary: var(--ios-gray-700);
--background-elevated: var(--ios-gray-600);
--background-pure-black: var(--ios-black);

/* Text */
--text-primary: var(--ios-white);
--text-secondary: var(--ios-gray-300);
--text-tertiary: var(--ios-gray-400);
--text-quaternary: var(--ios-gray-100);

/* Borders & Separators */
--border-primary: var(--ios-gray-500);
--border-secondary: var(--ios-gray-600);
--separator: rgba(84, 84, 88, 0.6);

/* Interactive */
--interactive-primary: var(--ios-blue);
--interactive-primary-hover: var(--ios-blue-light);
--interactive-primary-pressed: var(--ios-blue-dark);
--interactive-secondary: var(--ios-purple);
--interactive-tertiary: var(--ios-teal);

/* Status Colors */
--status-success: var(--ios-green);
--status-warning: var(--ios-orange);
--status-error: var(--ios-red);
--status-info: var(--ios-blue);

/* Overlays */
--overlay-dark: rgba(0, 0, 0, 0.5);
--overlay-light: rgba(0, 0, 0, 0.3);
--glass-background: rgba(28, 28, 30, 0.72);
--glass-border: rgba(255, 255, 255, 0.1);
```

### Position-Specific Colors

```css
/* Fantasy Football Position Colors (Dark Mode Optimized) */
--position-qb: #FF453A;      /* Red */
--position-rb: #5AC8FA;      /* Teal */
--position-wr: #0A84FF;      /* Blue */
--position-te: #FF9F0A;      /* Orange */
--position-k: #BF5AF2;       /* Purple */
--position-def: #30D158;     /* Green */
--position-flex: #FFD60A;    /* Yellow */
```

---

## 3. Typography System

### Font Stack
```css
/* Primary: Geist Sans (already in use) */
--font-primary: 'Geist Sans', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;

/* Mono: Geist Mono (for numbers/stats) */
--font-mono: 'Geist Mono', 'SF Mono', Menlo, monospace;

/* System fallback for true iOS feel */
--font-ios: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;
```

### Type Scale (iOS Inspired)

```css
/* Large Titles - iOS Style */
--text-large-title: 34px;      /* Font size */
--text-large-title-weight: 700; /* Bold */
--text-large-title-line: 41px;  /* Line height */
--text-large-title-tracking: 0.37px; /* Letter spacing */

/* Titles */
--text-title-1: 28px;
--text-title-1-weight: 700;
--text-title-1-line: 34px;
--text-title-1-tracking: 0.36px;

--text-title-2: 22px;
--text-title-2-weight: 700;
--text-title-2-line: 28px;
--text-title-2-tracking: 0.35px;

--text-title-3: 20px;
--text-title-3-weight: 600;
--text-title-3-line: 25px;
--text-title-3-tracking: 0.38px;

/* Headlines */
--text-headline: 17px;
--text-headline-weight: 600;
--text-headline-line: 22px;
--text-headline-tracking: -0.41px;

/* Body */
--text-body: 17px;
--text-body-weight: 400;
--text-body-line: 22px;
--text-body-tracking: -0.41px;

/* Callout */
--text-callout: 16px;
--text-callout-weight: 400;
--text-callout-line: 21px;
--text-callout-tracking: -0.32px;

/* Subheadline */
--text-subheadline: 15px;
--text-subheadline-weight: 400;
--text-subheadline-line: 20px;
--text-subheadline-tracking: -0.24px;

/* Footnote */
--text-footnote: 13px;
--text-footnote-weight: 400;
--text-footnote-line: 18px;
--text-footnote-tracking: -0.08px;

/* Caption */
--text-caption-1: 12px;
--text-caption-1-weight: 400;
--text-caption-1-line: 16px;
--text-caption-1-tracking: 0px;

--text-caption-2: 11px;
--text-caption-2-weight: 400;
--text-caption-2-line: 13px;
--text-caption-2-tracking: 0.06px;
```

### Tailwind Typography Classes

```css
/* To be added to Tailwind config */
.text-ios-large-title { font-size: 34px; font-weight: 700; line-height: 41px; letter-spacing: 0.37px; }
.text-ios-title-1 { font-size: 28px; font-weight: 700; line-height: 34px; letter-spacing: 0.36px; }
.text-ios-title-2 { font-size: 22px; font-weight: 700; line-height: 28px; letter-spacing: 0.35px; }
.text-ios-title-3 { font-size: 20px; font-weight: 600; line-height: 25px; letter-spacing: 0.38px; }
.text-ios-headline { font-size: 17px; font-weight: 600; line-height: 22px; letter-spacing: -0.41px; }
.text-ios-body { font-size: 17px; font-weight: 400; line-height: 22px; letter-spacing: -0.41px; }
.text-ios-callout { font-size: 16px; font-weight: 400; line-height: 21px; letter-spacing: -0.32px; }
.text-ios-subheadline { font-size: 15px; font-weight: 400; line-height: 20px; letter-spacing: -0.24px; }
.text-ios-footnote { font-size: 13px; font-weight: 400; line-height: 18px; letter-spacing: -0.08px; }
.text-ios-caption { font-size: 12px; font-weight: 400; line-height: 16px; }
```

---

## 4. Spacing & Layout

### iOS Spacing System

```css
/* Spacing scale (aligned with iOS 8pt grid) */
--space-1: 4px;    /* 0.5 units */
--space-2: 8px;    /* 1 unit */
--space-3: 12px;   /* 1.5 units */
--space-4: 16px;   /* 2 units - standard padding */
--space-5: 20px;   /* 2.5 units */
--space-6: 24px;   /* 3 units */
--space-8: 32px;   /* 4 units */
--space-10: 40px;  /* 5 units */
--space-12: 48px;  /* 6 units */
--space-16: 64px;  /* 8 units */
--space-20: 80px;  /* 10 units */

/* Safe area insets (for mobile) */
--safe-area-top: env(safe-area-inset-top, 0px);
--safe-area-bottom: env(safe-area-inset-bottom, 0px);
--safe-area-left: env(safe-area-inset-left, 0px);
--safe-area-right: env(safe-area-inset-right, 0px);
```

### Border Radius

```css
/* iOS Corner Radius System */
--radius-xs: 4px;    /* Small elements */
--radius-sm: 8px;    /* Buttons, badges */
--radius-md: 12px;   /* Cards, inputs */
--radius-lg: 16px;   /* Large cards */
--radius-xl: 20px;   /* Modal sheets */
--radius-2xl: 24px;  /* Full-screen modals */
--radius-full: 9999px; /* Circles, pills */
```

### Shadows & Elevation

```css
/* iOS-style shadows (subtle, realistic) */
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
--shadow-sm: 0 2px 4px 0 rgba(0, 0, 0, 0.3),
             0 1px 2px 0 rgba(0, 0, 0, 0.2);
--shadow-md: 0 4px 8px 0 rgba(0, 0, 0, 0.3),
             0 2px 4px 0 rgba(0, 0, 0, 0.2);
--shadow-lg: 0 8px 16px 0 rgba(0, 0, 0, 0.3),
             0 4px 8px 0 rgba(0, 0, 0, 0.2);
--shadow-xl: 0 16px 32px 0 rgba(0, 0, 0, 0.4),
             0 8px 16px 0 rgba(0, 0, 0, 0.3);

/* Glow effects for interactive elements */
--glow-primary: 0 0 20px rgba(10, 132, 255, 0.3);
--glow-success: 0 0 20px rgba(48, 209, 88, 0.3);
--glow-error: 0 0 20px rgba(255, 69, 58, 0.3);
```

---

## 5. Component Design Patterns

### Cards (iOS Style)

**Standard Card:**
```css
background: var(--background-secondary);
border: 1px solid var(--border-primary);
border-radius: var(--radius-lg);
padding: var(--space-4);
box-shadow: var(--shadow-sm);
```

**Elevated Card (pressed/active):**
```css
background: var(--background-tertiary);
border: 1px solid var(--border-secondary);
border-radius: var(--radius-lg);
padding: var(--space-4);
box-shadow: var(--shadow-md);
```

**Glass Morphism Card:**
```css
background: var(--glass-background);
border: 1px solid var(--glass-border);
border-radius: var(--radius-lg);
padding: var(--space-4);
backdrop-filter: blur(20px) saturate(180%);
-webkit-backdrop-filter: blur(20px) saturate(180%);
```

### Buttons

**Primary Button (iOS Style):**
```css
background: var(--interactive-primary);
color: var(--ios-white);
border-radius: var(--radius-sm);
padding: var(--space-3) var(--space-6);
font-size: var(--text-headline);
font-weight: 600;
min-height: 44px;
box-shadow: var(--shadow-sm);
transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);

/* Hover */
background: var(--interactive-primary-hover);
box-shadow: var(--shadow-md);

/* Active/Pressed */
background: var(--interactive-primary-pressed);
transform: scale(0.98);
box-shadow: var(--shadow-xs);
```

**Secondary Button (Ghost):**
```css
background: transparent;
color: var(--interactive-primary);
border: 1px solid var(--border-primary);
border-radius: var(--radius-sm);
padding: var(--space-3) var(--space-6);
min-height: 44px;

/* Hover */
background: rgba(10, 132, 255, 0.1);

/* Active */
background: rgba(10, 132, 255, 0.2);
```

**Destructive Button:**
```css
background: var(--status-error);
color: var(--ios-white);
/* Same structure as primary */
```

### Tabs (iOS Segmented Control)

```css
/* Container */
background: var(--background-tertiary);
border-radius: var(--radius-sm);
padding: 2px;
display: flex;
gap: 2px;

/* Individual Tab */
background: transparent;
color: var(--text-secondary);
padding: var(--space-2) var(--space-4);
border-radius: calc(var(--radius-sm) - 2px);
min-height: 44px;
transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);

/* Active Tab */
background: var(--background-elevated);
color: var(--text-primary);
box-shadow: var(--shadow-sm);
```

### Inputs

```css
background: var(--background-tertiary);
border: 1px solid var(--border-primary);
border-radius: var(--radius-md);
padding: var(--space-3) var(--space-4);
color: var(--text-primary);
font-size: var(--text-body);
min-height: 44px;

/* Focus */
border-color: var(--interactive-primary);
box-shadow: 0 0 0 4px rgba(10, 132, 255, 0.1);
outline: none;

/* Placeholder */
color: var(--text-tertiary);
```

### Tables (Dark Rows)

```css
/* Table Header */
background: var(--background-secondary);
color: var(--text-secondary);
font-size: var(--text-footnote);
font-weight: 600;
text-transform: uppercase;
letter-spacing: 0.5px;
padding: var(--space-3) var(--space-4);

/* Table Row */
background: var(--background-primary);
border-bottom: 1px solid var(--separator);
padding: var(--space-4);

/* Alternate Row */
background: var(--background-secondary);

/* Hover */
background: var(--background-tertiary);
```

### Modals (iOS Sheet Style)

```css
background: var(--background-secondary);
border-radius: var(--radius-xl) var(--radius-xl) 0 0;
padding: var(--space-6);
box-shadow: var(--shadow-xl);
position: fixed;
bottom: 0;
left: 0;
right: 0;
max-height: 90vh;

/* Drag Handle */
width: 36px;
height: 5px;
background: var(--ios-gray-500);
border-radius: var(--radius-full);
margin: 0 auto var(--space-4);
```

---

## 6. Navigation Design

### Bottom Tab Bar (Mobile)

**Container:**
```css
position: fixed;
bottom: 0;
left: 0;
right: 0;
background: var(--glass-background);
backdrop-filter: blur(20px) saturate(180%);
border-top: 1px solid var(--glass-border);
padding: var(--space-2) var(--safe-area-left)
         calc(var(--space-2) + var(--safe-area-bottom))
         var(--safe-area-right);
display: flex;
justify-content: space-around;
align-items: center;
height: calc(64px + var(--safe-area-bottom));
z-index: 1000;
```

**Tab Item:**
```css
display: flex;
flex-direction: column;
align-items: center;
gap: var(--space-1);
color: var(--text-tertiary);
min-width: 60px;
padding: var(--space-2);
transition: all 200ms ease;

/* Active State */
color: var(--interactive-primary);

/* Icon */
width: 24px;
height: 24px;

/* Label */
font-size: var(--text-caption-2);
font-weight: 500;
```

**Active Indicator (Background Pill):**
```css
background: rgba(10, 132, 255, 0.15);
border-radius: var(--radius-full);
position: absolute;
inset: 0;
```

### Floating Action Button (FAB)

```css
position: fixed;
bottom: calc(80px + var(--safe-area-bottom));
right: var(--space-4);
width: 56px;
height: 56px;
background: var(--interactive-primary);
border-radius: var(--radius-full);
box-shadow: var(--shadow-lg);
display: flex;
align-items: center;
justify-content: center;
color: var(--ios-white);
transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);

/* Hover */
transform: scale(1.05);
box-shadow: var(--shadow-xl), var(--glow-primary);

/* Active */
transform: scale(0.95);
```

---

## 7. Accessibility Specifications

### Contrast Ratios (WCAG AA Compliant)

```
Text on Backgrounds:
- White (#FFFFFF) on Gray 900 (#0A0A0A): 20.5:1 ✓
- Gray 300 (#8E8E93) on Gray 900: 4.8:1 ✓
- Gray 400 (#636366) on Gray 900: 3.2:1 ✓ (large text only)
- Blue (#0A84FF) on Gray 900: 6.2:1 ✓
- Red (#FF453A) on Gray 900: 5.8:1 ✓

Interactive Elements:
- Minimum 44x44px touch targets
- 3:1 contrast for UI components
- 4.5:1 contrast for text content
```

### Focus States

```css
/* Keyboard focus indicator */
outline: 2px solid var(--interactive-primary);
outline-offset: 2px;
border-radius: var(--radius-sm);

/* Alternative - glow style */
box-shadow: 0 0 0 4px rgba(10, 132, 255, 0.3);
```

---

## 8. Animation & Transitions

### iOS Standard Timing Functions

```css
/* Ease curves */
--ease-ios: cubic-bezier(0.4, 0, 0.2, 1);
--ease-ios-in: cubic-bezier(0.42, 0, 1, 1);
--ease-ios-out: cubic-bezier(0, 0, 0.58, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);

/* Durations */
--duration-instant: 100ms;
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
--duration-slower: 400ms;
```

### Common Animations

```css
/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide up (for modals) */
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

/* Scale bounce */
@keyframes scaleBounce {
  0% { transform: scale(0.9); opacity: 0; }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); opacity: 1; }
}

/* Press feedback */
@keyframes press {
  0% { transform: scale(1); }
  50% { transform: scale(0.98); }
  100% { transform: scale(1); }
}
```

---

## 9. Responsive Breakpoints

```css
/* Mobile-first approach */
--mobile-sm: 375px;   /* iPhone SE */
--mobile-md: 390px;   /* iPhone 12/13/14 */
--mobile-lg: 430px;   /* iPhone 16 Pro Max */
--tablet-sm: 768px;   /* iPad Mini */
--tablet-lg: 1024px;  /* iPad Pro */
--desktop: 1280px;    /* Desktop */
--desktop-lg: 1536px; /* Large desktop */
```

---

## 10. Fantasy Football Specific Components

### Player Card (Dark iOS Style)

```css
background: var(--background-secondary);
border: 1px solid var(--border-primary);
border-radius: var(--radius-lg);
padding: var(--space-4);
display: grid;
grid-template-columns: auto 1fr auto;
gap: var(--space-3);
align-items: center;
min-height: 72px;

/* Position Badge */
background: var(--position-{position});
color: var(--ios-white);
font-size: var(--text-caption-1);
font-weight: 700;
padding: var(--space-1) var(--space-2);
border-radius: var(--radius-xs);
text-transform: uppercase;

/* Stats */
font-family: var(--font-mono);
color: var(--text-secondary);
font-size: var(--text-subheadline);
```

### League Card

```css
background: var(--background-secondary);
border: 1px solid var(--border-primary);
border-radius: var(--radius-xl);
padding: var(--space-6);
box-shadow: var(--shadow-md);

/* Header gradient accent */
background: linear-gradient(135deg,
  var(--background-secondary) 0%,
  rgba(10, 132, 255, 0.05) 100%
);

/* League Avatar/Icon */
width: 64px;
height: 64px;
border-radius: var(--radius-lg);
background: var(--background-elevated);
border: 2px solid var(--border-secondary);
```

### Stats Card (Glass Style)

```css
background: var(--glass-background);
backdrop-filter: blur(20px) saturate(180%);
border: 1px solid var(--glass-border);
border-radius: var(--radius-lg);
padding: var(--space-4);

/* Value */
font-size: var(--text-title-1);
font-weight: 700;
font-family: var(--font-mono);
color: var(--text-primary);

/* Label */
font-size: var(--text-caption-1);
font-weight: 600;
color: var(--text-tertiary);
text-transform: uppercase;
letter-spacing: 0.5px;
```

---

## 11. Dark Mode Best Practices

1. **Never use pure black (#000000) for main backgrounds** - use #0A0A0A
2. **Use elevated surfaces** for layers (gray-800 → gray-700 → gray-600)
3. **Reduce white text opacity** to 85-90% for less eye strain
4. **Increase shadow intensity** in dark mode
5. **Use colored tints** on surfaces for visual interest
6. **Test on OLED screens** for true black burn-in
7. **Ensure 3:1 contrast minimum** for all UI elements

---

## 12. Implementation Checklist

### Phase 1: Foundation
- [ ] Update globals.css with iOS dark color tokens
- [ ] Update Tailwind config with custom colors
- [ ] Add iOS typography classes
- [ ] Configure spacing system
- [ ] Set up shadow/elevation utilities

### Phase 2: Component Library
- [ ] Redesign Card component
- [ ] Redesign Button component
- [ ] Redesign Tabs component (segmented control)
- [ ] Redesign Input component
- [ ] Redesign Table component
- [ ] Redesign Modal/Sheet component

### Phase 3: Navigation
- [ ] Create iOS bottom tab bar component
- [ ] Update mobile navigation
- [ ] Add floating action buttons
- [ ] Implement page transitions

### Phase 4: Page Updates
- [ ] Dashboard redesign
- [ ] Rankings page redesign
- [ ] Trades page redesign
- [ ] Rookie Draft page redesign
- [ ] Settings/More page creation

### Phase 5: Polish
- [ ] Add micro-interactions
- [ ] Implement haptic feedback classes
- [ ] Optimize animations
- [ ] Accessibility audit
- [ ] Mobile testing (375px, 430px)

---

**Next Steps:**
See `IOS_DARK_IMPLEMENTATION_GUIDE.md` for detailed code implementation.
