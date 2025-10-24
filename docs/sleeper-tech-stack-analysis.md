# Sleeper.com Tech Stack Analysis

**Analysis Date:** October 13, 2025

## Platform & Framework

### Next.js (React Framework)
Sleeper.com is built with **Next.js** using the **App Router** architecture.

**Evidence:**
- `_next/` directory structure in script URLs
- Script paths like `/_next/static/chunks/main-app-23ea224c665a333f.js`
- App Router pattern: `app/(marketing-layout)/page-*.js` and `app/(sports-layout)/layout-*.js`
- Next.js image optimization: `/_next/image?url=...&w=128&q=75`
- Server-side rendering with hydration patterns

### React (JavaScript Framework)
Built on **React 18+** (based on Next.js App Router requirements)

**Evidence:**
- Next.js App Router requires React 18+
- Modern React patterns in class naming: `__className_*`, `__variable_*`

## UI Component Library

### Radix UI (Headless UI Components)
Sleeper uses **Radix UI** primitives for accessible, unstyled components.

**Evidence:**
- Extensive use of `data-state` attributes (Radix signature)
- Radix-specific CSS class patterns in Tailwind styles
- CSS custom properties for theming that match Radix patterns

## Styling

### Tailwind CSS v4.1.7
Primary styling framework with custom design system.

**Evidence:**
- Inline stylesheet declaration: `/*! tailwindcss v4.1.7 | MIT License | https://tailwindcss.com */`
- `@layer` directives for properties, theme, base, components, utilities
- Utility-first class names: `flex`, `min-h-svh`, `sticky`, `top-0`, etc.
- CSS custom properties for theming: `--color-*`, `--spacing`, `--radius`

### Custom Design System
Sleeper has built a comprehensive design system on top of Tailwind.

**Key Features:**
- Custom color palette with dark mode: `--color-neutral-*`, `--color-brand`, `--color-bright`
- Custom spacing system: `--spacing: .25rem` (4px base)
- Custom component classes: `.focus-sleeper`, `.focus-sleeper-error`, `.focus-sleeper-full`
- Typography system: `--font-sans: "Inter"`, `--font-display: "Poppins"`, `--font-score: "Oswald"`
- Custom scrollbar styling with CSS variables

## Key Technical Details

### Fonts
- **Primary Font:** Inter (sans-serif)
- **Display Font:** Poppins (serif - used for headings)
- **Score Font:** Oswald (sans-serif - used for numerical displays)

### Dark Mode
- Native dark mode support with `dark-color-mode` class
- CSS custom properties for theme switching
- Extensive dark mode color palette (neutral-100 through neutral-1000)

### Custom Focus States
Custom focus management with branded cyan glow effect:
```css
.focus-sleeper:focus-visible {
  border-color: var(--color-bright);
  --tw-shadow: 0 0 6px var(--tw-shadow-color, #00fff9);
}
```

### Build Tool
**Webpack** (via Next.js) with chunk-based code splitting

**Evidence:**
- Numbered chunk files: `8979-*.js`, `8373-*.js`, etc.
- Route-based code splitting for app directory

### CDN
**Sleeper CDN** for static assets

**Evidence:**
- `https://sleepercdn.com/sleeper-web/_next/...` for Next.js bundles
- `https://sleepercdn.com/landing/web2026/...` for marketing assets

## Architecture Patterns

### App Router Layout Groups
- `(marketing-layout)` - Marketing pages
- `(sports-layout)` - Sports-related pages

### Responsive Design
- Mobile-first approach with `min-h-svh` (small viewport height)
- Responsive breakpoints: `lg:` (desktop), `sm:` (tablet)
- Touch-optimized with `max-scale=1, user-scalable=no`

### Performance Optimizations
- Preloading critical images with `<link rel="preload">`
- Image optimization with Next.js Image component
- Lazy loading with code splitting by route
- WebP images for modern browsers

## Comparison to Our Project

### Similarities
1. **Next.js App Router** - Both use Next.js 15+ with App Router
2. **Tailwind CSS** - Both use Tailwind as primary styling framework
3. **Dark Mode** - Both implement dark mode with CSS custom properties
4. **Radix UI** - Both use Radix UI for accessible components
5. **Mobile-First** - Both prioritize mobile experience
6. **TypeScript** - Implied by modern Next.js setup

### Differences
1. **Tailwind Version** - Sleeper uses v4.1.7, we use v4.x (with @tailwindcss/postcss)
2. **Font Stack** - Sleeper uses Inter/Poppins/Oswald, we use default font stack
3. **Custom Design System** - Sleeper has more extensive custom component library
4. **CDN Strategy** - Sleeper uses custom CDN, we use Vercel CDN
5. **Focus Styles** - Sleeper has branded cyan glow, we use standard Radix focus

## Key Takeaways

1. **Enterprise-Grade React Stack:** Sleeper uses a production-grade React/Next.js setup very similar to ours
2. **Component Library Choice:** Radix UI is the right choice - it's what industry leaders use
3. **Tailwind Mastery:** Sleeper demonstrates advanced Tailwind usage with extensive customization
4. **Performance Focus:** Heavy emphasis on image optimization, code splitting, and CDN delivery
5. **Design System Investment:** Sleeper has invested heavily in a custom design system on top of Tailwind

## Recommendations for Our Project

1. **Continue with Current Stack** - Our tech stack (Next.js 15 + Tailwind 4 + Radix UI) is validated
2. **Enhance Design System** - Consider building more custom component classes like `.focus-sleeper`
3. **Font Strategy** - Consider adding Inter font for consistency (it's free and professional)
4. **Custom Properties** - Expand use of CSS custom properties for theming
5. **Image Optimization** - Continue leveraging Next.js Image component
6. **Focus States** - Consider branded focus states for better UX
