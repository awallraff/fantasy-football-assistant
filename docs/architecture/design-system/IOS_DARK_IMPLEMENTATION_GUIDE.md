# iOS Dark Theme - Implementation Guide
## Step-by-Step Code Implementation

---

## Phase 1: Foundation Setup

### Step 1: Update globals.css

Replace the existing dark mode colors with iOS-inspired tokens:

```css
/* C:\Users\Adamw\Documents\FantasySports\Fantasy_assistant\fantasy-football-assistant\app\globals.css */

@import 'tailwindcss';
@import 'tw-animate-css';

@custom-variant dark (&:is(.dark *));

:root {
  /* Light mode stays the same */
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.985 0 0);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --radius: 0.75rem;

  /* Chart colors */
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
}

.dark {
  /* iOS Dark Mode Color System */

  /* Base Backgrounds */
  --background: 10 10 10;           /* #0A0A0A - Primary background */
  --background-elevated: 28 28 30;  /* #1C1C1E - Cards, elevated surfaces */
  --background-tertiary: 44 44 46;  /* #2C2C2E - Elevated level 2 */
  --background-pure-black: 0 0 0;   /* #000000 - Pure black for special use */

  /* Text Colors */
  --foreground: 255 255 255;        /* #FFFFFF - Primary text */
  --text-secondary: 142 142 147;    /* #8E8E93 - Secondary text */
  --text-tertiary: 99 99 102;       /* #636366 - Tertiary text */

  /* Card & Popover */
  --card: 28 28 30;                 /* #1C1C1E */
  --card-foreground: 255 255 255;
  --popover: 44 44 46;              /* #2C2C2E */
  --popover-foreground: 255 255 255;

  /* Primary (iOS Blue) */
  --primary: 10 132 255;            /* #0A84FF - iOS Blue */
  --primary-hover: 64 156 255;      /* #409CFF */
  --primary-pressed: 0 87 217;      /* #0057D9 */
  --primary-foreground: 255 255 255;

  /* Secondary (iOS Purple) */
  --secondary: 191 90 242;          /* #BF5AF2 */
  --secondary-foreground: 255 255 255;

  /* Muted */
  --muted: 44 44 46;                /* #2C2C2E */
  --muted-foreground: 142 142 147;  /* #8E8E93 */

  /* Accent (iOS Teal) */
  --accent: 90 200 250;             /* #5AC8FA */
  --accent-foreground: 255 255 255;

  /* Destructive (iOS Red) */
  --destructive: 255 69 58;         /* #FF453A */
  --destructive-foreground: 255 255 255;

  /* Success (iOS Green) */
  --success: 48 209 88;             /* #30D158 */
  --success-foreground: 255 255 255;

  /* Warning (iOS Orange) */
  --warning: 255 159 10;            /* #FF9F0A */
  --warning-foreground: 255 255 255;

  /* Borders & Separators */
  --border: 72 72 74;               /* #48484A */
  --separator: 84 84 88;            /* #545458 with 0.6 opacity */
  --input: 58 58 60;                /* #3A3A3C */
  --ring: 10 132 255;               /* iOS Blue for focus rings */

  /* Chart Colors (iOS System) */
  --chart-1: 10 132 255;            /* Blue */
  --chart-2: 48 209 88;             /* Green */
  --chart-3: 255 159 10;            /* Orange */
  --chart-4: 191 90 242;            /* Purple */
  --chart-5: 90 200 250;            /* Teal */

  /* Position Colors */
  --position-qb: 255 69 58;         /* Red */
  --position-rb: 90 200 250;        /* Teal */
  --position-wr: 10 132 255;        /* Blue */
  --position-te: 255 159 10;        /* Orange */
  --position-k: 191 90 242;         /* Purple */
  --position-def: 48 209 88;        /* Green */
}

/* iOS-style shadows for dark mode */
.dark {
  --shadow-sm: 0 2px 4px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2);
  --shadow-md: 0 4px 8px 0 rgba(0, 0, 0, 0.3), 0 2px 4px 0 rgba(0, 0, 0, 0.2);
  --shadow-lg: 0 8px 16px 0 rgba(0, 0, 0, 0.3), 0 4px 8px 0 rgba(0, 0, 0, 0.2);
  --shadow-xl: 0 16px 32px 0 rgba(0, 0, 0, 0.4), 0 8px 16px 0 rgba(0, 0, 0, 0.3);
}

@theme inline {
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);

  /* Map to Tailwind color system */
  --color-background: rgb(var(--background));
  --color-background-elevated: rgb(var(--background-elevated));
  --color-background-tertiary: rgb(var(--background-tertiary));
  --color-foreground: rgb(var(--foreground));
  --color-card: rgb(var(--card));
  --color-card-foreground: rgb(var(--card-foreground));
  --color-popover: rgb(var(--popover));
  --color-popover-foreground: rgb(var(--popover-foreground));
  --color-primary: rgb(var(--primary));
  --color-primary-foreground: rgb(var(--primary-foreground));
  --color-secondary: rgb(var(--secondary));
  --color-secondary-foreground: rgb(var(--secondary-foreground));
  --color-muted: rgb(var(--muted));
  --color-muted-foreground: rgb(var(--muted-foreground));
  --color-accent: rgb(var(--accent));
  --color-accent-foreground: rgb(var(--accent-foreground));
  --color-destructive: rgb(var(--destructive));
  --color-destructive-foreground: rgb(var(--destructive-foreground));
  --color-border: rgb(var(--border));
  --color-input: rgb(var(--input));
  --color-ring: rgb(var(--ring));
  --color-chart-1: rgb(var(--chart-1));
  --color-chart-2: rgb(var(--chart-2));
  --color-chart-3: rgb(var(--chart-3));
  --color-chart-4: rgb(var(--chart-4));
  --color-chart-5: rgb(var(--chart-5));

  /* Border radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: 24px;
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground antialiased;
  }
}

/* iOS-specific utility classes */
@layer utilities {
  /* Glass morphism */
  .glass-ios {
    background: rgba(28, 28, 30, 0.72);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* Touch target size */
  .touch-target {
    min-width: 44px;
    min-height: 44px;
  }

  /* iOS Typography */
  .text-ios-large-title {
    font-size: 34px;
    font-weight: 700;
    line-height: 41px;
    letter-spacing: 0.37px;
  }

  .text-ios-title-1 {
    font-size: 28px;
    font-weight: 700;
    line-height: 34px;
    letter-spacing: 0.36px;
  }

  .text-ios-title-2 {
    font-size: 22px;
    font-weight: 700;
    line-height: 28px;
    letter-spacing: 0.35px;
  }

  .text-ios-title-3 {
    font-size: 20px;
    font-weight: 600;
    line-height: 25px;
    letter-spacing: 0.38px;
  }

  .text-ios-headline {
    font-size: 17px;
    font-weight: 600;
    line-height: 22px;
    letter-spacing: -0.41px;
  }

  .text-ios-body {
    font-size: 17px;
    font-weight: 400;
    line-height: 22px;
    letter-spacing: -0.41px;
  }

  .text-ios-callout {
    font-size: 16px;
    font-weight: 400;
    line-height: 21px;
    letter-spacing: -0.32px;
  }

  .text-ios-subheadline {
    font-size: 15px;
    font-weight: 400;
    line-height: 20px;
    letter-spacing: -0.24px;
  }

  .text-ios-footnote {
    font-size: 13px;
    font-weight: 400;
    line-height: 18px;
    letter-spacing: -0.08px;
  }

  .text-ios-caption {
    font-size: 12px;
    font-weight: 400;
    line-height: 16px;
  }

  /* Safe area support */
  .safe-area-inset-top {
    padding-top: env(safe-area-inset-top, 0);
  }

  .safe-area-inset-bottom {
    padding-bottom: env(safe-area-inset-bottom, 0);
  }

  .safe-area-inset-left {
    padding-left: env(safe-area-inset-left, 0);
  }

  .safe-area-inset-right {
    padding-right: env(safe-area-inset-right, 0);
  }
}
```

### Step 2: Update Tailwind Config

```javascript
// C:\Users\Adamw\Documents\FantasySports\Fantasy_assistant\fantasy-football-assistant\tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    "*.{js,ts,jsx,tsx,mdx}"
  ],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        'background-elevated': 'rgb(var(--background-elevated) / <alpha-value>)',
        'background-tertiary': 'rgb(var(--background-tertiary) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        'text-secondary': 'rgb(var(--text-secondary) / <alpha-value>)',
        'text-tertiary': 'rgb(var(--text-tertiary) / <alpha-value>)',

        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
          hover: 'rgb(var(--primary-hover) / <alpha-value>)',
          pressed: 'rgb(var(--primary-pressed) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
          foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'rgb(var(--destructive) / <alpha-value>)',
          foreground: 'rgb(var(--destructive-foreground) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--success) / <alpha-value>)',
          foreground: 'rgb(var(--success-foreground) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--warning) / <alpha-value>)',
          foreground: 'rgb(var(--warning-foreground) / <alpha-value>)',
        },
        border: 'rgb(var(--border) / <alpha-value>)',
        separator: 'rgb(var(--separator) / 0.6)',
        input: 'rgb(var(--input) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',
        card: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'rgb(var(--popover) / <alpha-value>)',
          foreground: 'rgb(var(--popover-foreground) / <alpha-value>)',
        },
        chart: {
          1: 'rgb(var(--chart-1) / <alpha-value>)',
          2: 'rgb(var(--chart-2) / <alpha-value>)',
          3: 'rgb(var(--chart-3) / <alpha-value>)',
          4: 'rgb(var(--chart-4) / <alpha-value>)',
          5: 'rgb(var(--chart-5) / <alpha-value>)',
        },
        position: {
          qb: 'rgb(var(--position-qb) / <alpha-value>)',
          rb: 'rgb(var(--position-rb) / <alpha-value>)',
          wr: 'rgb(var(--position-wr) / <alpha-value>)',
          te: 'rgb(var(--position-te) / <alpha-value>)',
          k: 'rgb(var(--position-k) / <alpha-value>)',
          def: 'rgb(var(--position-def) / <alpha-value>)',
        },
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
      },
      boxShadow: {
        'sm': '0 2px 4px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
        'md': '0 4px 8px 0 rgba(0, 0, 0, 0.3), 0 2px 4px 0 rgba(0, 0, 0, 0.2)',
        'lg': '0 8px 16px 0 rgba(0, 0, 0, 0.3), 0 4px 8px 0 rgba(0, 0, 0, 0.2)',
        'xl': '0 16px 32px 0 rgba(0, 0, 0, 0.4), 0 8px 16px 0 rgba(0, 0, 0, 0.3)',
        'glow-primary': '0 0 20px rgba(10, 132, 255, 0.3)',
        'glow-success': '0 0 20px rgba(48, 209, 88, 0.3)',
        'glow-error': '0 0 20px rgba(255, 69, 58, 0.3)',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top, 0px)',
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
        'safe-left': 'env(safe-area-inset-left, 0px)',
        'safe-right': 'env(safe-area-inset-right, 0px)',
      },
      transitionTimingFunction: {
        'ios': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'ios-in': 'cubic-bezier(0.42, 0, 1, 1)',
        'ios-out': 'cubic-bezier(0, 0, 0.58, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'scale-bounce': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '50%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'press': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.98)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-bounce': 'scale-bounce 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'press': 'press 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

---

## Phase 2: iOS Bottom Tab Bar Navigation

### Step 1: Create Bottom Tab Bar Component

```tsx
// C:\Users\Adamw\Documents\FantasySports\Fantasy_assistant\fantasy-football-assistant\components\ios-bottom-tab-bar.tsx

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  TrendingUp,
  ArrowLeftRight,
  Home,
  MoreHorizontal,
  Users,
} from "lucide-react"

const tabs = [
  { name: "Home", href: "/", icon: Home },
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Rankings", href: "/rankings", icon: TrendingUp },
  { name: "Rookie", href: "/rookie-draft", icon: Users },
  { name: "More", href: "/more", icon: MoreHorizontal },
]

export function IOSBottomTabBar() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-ios border-t border-white/10"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex justify-around items-center px-2 pt-2 pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = pathname === tab.href

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                "relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 touch-target",
                "active:scale-95",
                isActive ? "text-primary" : "text-text-secondary"
              )}
            >
              {/* Active indicator background pill */}
              {isActive && (
                <div className="absolute inset-0 bg-primary/15 rounded-xl" />
              )}

              {/* Icon */}
              <Icon
                className={cn(
                  "relative w-6 h-6 transition-transform duration-200",
                  isActive && "scale-110"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />

              {/* Label */}
              <span className={cn(
                "relative text-ios-caption font-medium transition-all duration-200",
                isActive && "font-semibold"
              )}>
                {tab.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

### Step 2: Create Desktop Side Navigation

```tsx
// C:\Users\Adamw\Documents\FantasySports\Fantasy_assistant\fantasy-football-assistant\components\ios-desktop-nav.tsx

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  TrendingUp,
  ArrowLeftRight,
  Target,
  Home,
  Database,
  Users,
  Settings,
} from "lucide-react"

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Rankings", href: "/rankings", icon: TrendingUp },
  { name: "Rookie Draft", href: "/rookie-draft", icon: Users },
  { name: "Trade Analysis", href: "/trades", icon: ArrowLeftRight },
  { name: "Recommendations", href: "/recommendations", icon: Target },
  { name: "NFL Data", href: "/nfl-data", icon: Database },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function IOSDesktopNav() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-ios-headline font-bold">Fantasy</h1>
            <p className="text-ios-caption text-text-secondary">Analytics</p>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                "hover:bg-background-tertiary active:scale-98",
                isActive
                  ? "bg-primary text-white shadow-md"
                  : "text-foreground"
              )}
            >
              <Icon
                className="w-5 h-5"
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={cn(
                "text-ios-body",
                isActive && "font-semibold"
              )}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="px-4 py-3 bg-background-elevated rounded-xl">
          <p className="text-ios-caption text-text-secondary">
            v1.0.0 - iOS Dark
          </p>
        </div>
      </div>
    </aside>
  )
}
```

### Step 3: Update Root Layout

```tsx
// Update C:\Users\Adamw\Documents\FantasySports\Fantasy_assistant\fantasy-football-assistant\app\layout.tsx

import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "@/app/globals.css"
import { IOSBottomTabBar } from "@/components/ios-bottom-tab-bar"
import { IOSDesktopNav } from "@/components/ios-desktop-nav"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { PlayerDataProvider } from "@/contexts/player-data-context"
import { ProjectionsProvider } from "@/contexts/projections-context"

export const metadata: Metadata = {
  title: "Fantasy Football Analytics",
  description: "Advanced fantasy football analytics with Sleeper integration",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-geist-sans: ${GeistSans.variable};
  --font-geist-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body className="dark">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <PlayerDataProvider>
            <ProjectionsProvider>
              {/* Desktop Navigation */}
              <IOSDesktopNav />

              {/* Main Content */}
              <main className="md:ml-64 pb-20 md:pb-0 min-h-screen">
                {children}
              </main>

              {/* Mobile Bottom Tab Bar */}
              <IOSBottomTabBar />

              <Toaster />
            </ProjectionsProvider>
          </PlayerDataProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

---

## Phase 3: Update Core Components

### Card Component (iOS Style)

```tsx
// Update C:\Users\Adamw\Documents\FantasySports\Fantasy_assistant\fantasy-football-assistant\components\ui\card.tsx

import * as React from "react"
import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-border shadow-md",
        "transition-all duration-200",
        "hover:shadow-lg hover:border-border/60",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 py-6 has-data-[slot=card-action]:grid-cols-[1fr_auto]",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold text-ios-title-3", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-text-secondary text-ios-subheadline", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6 pb-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center px-6 pb-6 border-t border-border/40 pt-6",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
```

### Button Component (iOS Style)

```tsx
// Update C:\Users\Adamw\Documents\FantasySports\Fantasy_assistant\fantasy-football-assistant\components\ui\button.tsx

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-ios-headline font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-target active:scale-98",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-white shadow-sm hover:bg-primary-hover hover:shadow-md active:bg-primary-pressed active:shadow-sm",
        secondary:
          "bg-transparent text-primary border border-border hover:bg-primary/10 active:bg-primary/20",
        destructive:
          "bg-destructive text-white shadow-sm hover:bg-destructive/90 hover:shadow-md active:bg-destructive/80 active:shadow-sm",
        outline:
          "border border-border bg-transparent hover:bg-background-elevated active:bg-background-tertiary",
        ghost:
          "hover:bg-background-elevated active:bg-background-tertiary",
        link:
          "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-10 px-4 text-ios-subheadline",
        md: "h-12 px-6",
        lg: "h-14 px-8 text-ios-headline",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

---

## Phase 4: Update Dashboard Page

```tsx
// Update the background and layout
// Find lines 139 and 234 in dashboard page.tsx

// Line 139 - Update background gradient
<div className="min-h-screen bg-background">

// Line 234 - Update background gradient
<div className="min-h-screen bg-background">
```

---

## Implementation Checklist

### Priority 1 - Foundation (Do First)
- [ ] Update globals.css with iOS dark colors
- [ ] Update tailwind.config.js with new theme
- [ ] Test build with `npm run build`
- [ ] Verify dark mode is working

### Priority 2 - Navigation (Critical)
- [ ] Create IOSBottomTabBar component
- [ ] Create IOSDesktopNav component
- [ ] Update layout.tsx to use new navigation
- [ ] Test navigation on mobile (375px, 430px)
- [ ] Test navigation on desktop

### Priority 3 - Core Components
- [ ] Update Card component
- [ ] Update Button component
- [ ] Update Tabs component (next file)
- [ ] Update Input component
- [ ] Update Table component

### Priority 4 - Page Updates
- [ ] Update Dashboard page backgrounds
- [ ] Update Rankings page
- [ ] Update Trades page
- [ ] Update Rookie Draft page
- [ ] Create Settings/More page

### Priority 5 - Polish
- [ ] Add micro-animations
- [ ] Test touch interactions
- [ ] Accessibility audit
- [ ] Performance optimization

---

**Next Steps:**
1. Start with Priority 1 (Foundation)
2. Test thoroughly after each phase
3. Use mobile device or browser DevTools for testing
4. See TABS_INPUT_IMPLEMENTATION.md for remaining components
