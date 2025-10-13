# Manual Testing Checklist - iOS Dark Theme Dashboard Redesign

## Test Environment Setup

**Required:**
- Chrome DevTools (or Safari Technology Preview for iOS simulation)
- Device viewport: 375px x 667px (iPhone SE)
- Test both Light Mode and Dark Mode
- Clear browser cache before testing

**How to Test:**
1. Open Chrome DevTools (F12)
2. Toggle Device Toolbar (Ctrl+Shift+M / Cmd+Shift+M)
3. Select "iPhone SE" or set custom viewport to 375px width
4. Toggle dark mode: DevTools > Rendering > Emulate CSS prefers-color-scheme

---

## Phase 1: Visual Design Verification (375px Mobile Viewport)

### 1.1 Background Gradients

**Dashboard Page (League Selection View)**
- [ ] **Light Mode**: Verify gradient from blue-50 to indigo-100 is visible
- [ ] **Dark Mode**: Verify gradient from pure black to elevated background with subtle fade
- [ ] **Transition**: Toggle between modes - gradient should smoothly transition
- [ ] **No Layout Shift**: Background change doesn't cause content jump

**Dashboard Page (Selected League View)**
- [ ] **Light Mode**: Same blue gradient as league selection view
- [ ] **Dark Mode**: Same dark gradient with proper depth
- [ ] **Safe Area**: Top/bottom safe areas visible on notched device simulation

### 1.2 Card Styling (League Cards)

**League Card Component**
- [ ] **Background**: Cards have `background-elevated` (#1C1C1E in dark mode)
- [ ] **Shadow**: iOS-style `shadow-md` visible (not harsh, subtle elevation)
- [ ] **Border Radius**: Cards have 16px rounded corners (`rounded-lg`)
- [ ] **Border**: Subtle border with `border-border/50` opacity
- [ ] **Hover Effect**: Card shadow increases to `shadow-lg` on hover (desktop only)
- [ ] **Transition**: Smooth 200ms transition on hover

**Card Content**
- [ ] **Title**: League name uses `text-ios-title-3` (20px, semibold)
- [ ] **Description**: "X teams • YYYY season" uses `text-ios-subheadline` (15px)
- [ ] **Text Colors**:
  - League name: `text-foreground` (white in dark mode)
  - Metadata: `text-text-secondary` (#8E8E93 in dark mode)
- [ ] **Badge**: Status badge (in_season/pre_season) has proper contrast

### 1.3 League Header Component

**Header Layout**
- [ ] **Back Button**:
  - Height ≥44px (touch target)
  - Has `shadow-sm` and `bg-background-elevated`
  - Text truncates to "Back" on mobile, "Back to Leagues" on desktop
- [ ] **League Name**:
  - Uses `text-ios-title-2` (22px) on mobile
  - Uses `text-ios-title-1` (28px) on desktop
  - Truncates if too long (no overflow)
- [ ] **Metadata**: "X teams • YYYY season" uses appropriate iOS text size
- [ ] **Year Selector**: Dropdown has elevated background and shadow
- [ ] **Refresh Button**: ≥44px height, shadow-sm, elevated background

**Spacing**
- [ ] **Gap**: Header elements have `gap-compact-md` (12px) between them
- [ ] **Bottom Margin**: `mb-compact-xl` (24px) below header
- [ ] **Responsive**: Stacks vertically on mobile, horizontal on desktop

### 1.4 Tabs Component

**Tabs Styling**
- [ ] **Background**: TabsList has `bg-background-elevated`
- [ ] **Shadow**: iOS `shadow-md` elevation visible
- [ ] **Border Radius**: `rounded-lg` (16px corners)
- [ ] **Height**: Minimum 44px tall (touch target)
- [ ] **Grid**: 4 columns (Overview, Teams, Standings, Activity)

**Tab Triggers**
- [ ] **Touch Target**: Each tab is ≥44px tall
- [ ] **Icons**: Lucide icons (BarChart3, Users, Trophy, Activity) visible
- [ ] **Text**: Labels visible on desktop, hidden on mobile (icon-only)
- [ ] **Active State**: Selected tab has proper highlight/indicator
- [ ] **Gap**: Icon and text have `gap-2` spacing

### 1.5 Typography Consistency

**Text Sizes**
- [ ] **Title 1** (28px, bold): Main page headings
- [ ] **Title 2** (22px, bold): Section headers (mobile league name)
- [ ] **Title 3** (20px, semibold): Card titles, sub-section headers
- [ ] **Body** (17px, regular): Button labels, body text
- [ ] **Subheadline** (15px, regular): Secondary metadata
- [ ] **Footnote** (13px, regular): Small metadata (mobile only)

**Text Colors**
- [ ] **Primary**: `text-foreground` (#FFFFFF in dark mode) - main headings
- [ ] **Secondary**: `text-text-secondary` (#8E8E93) - metadata, descriptions
- [ ] **Tertiary**: `text-text-tertiary` (#636366) - lowest hierarchy text

### 1.6 Spacing System (8px Grid)

**Padding/Margins**
- [ ] **compact-xs** (4px): Minimal gaps (if used)
- [ ] **compact-sm** (8px): Card content spacing, tight gaps
- [ ] **compact-md** (12px): Element gaps, comfortable spacing
- [ ] **compact-lg** (16px): Page padding (mobile)
- [ ] **compact-xl** (24px): Page padding (desktop), section margins

**Verify Spacing**
- [ ] No hardcoded pixel values in spacing (all use compact utilities)
- [ ] Consistent gaps between elements (no visual inconsistencies)
- [ ] Proper breathing room - not too cramped, not too spacious

---

## Phase 2: Touch Target Verification (Mobile)

### 2.1 Button Sizing

**All Interactive Elements**
- [ ] **Back Button**: ≥44px height ✅
- [ ] **Refresh Button**: ≥44px height ✅
- [ ] **Delete League Button**: 44px x 44px (square icon button) ✅
- [ ] **View Analytics Button**: ≥44px height ✅
- [ ] **Tab Triggers**: ≥44px height ✅
- [ ] **Year Selector**: ≥44px height ✅
- [ ] **League Selector**: ≥44px height ✅

### 2.2 Touch Target Testing

**How to Test:**
1. Use Chrome DevTools touch simulation (mobile toolbar)
2. Tap each button - should be easy to hit without precision
3. No accidental clicks on adjacent elements
4. Buttons have sufficient padding/spacing

**Verify:**
- [ ] All buttons feel "tappable" (not cramped)
- [ ] No overlapping touch targets
- [ ] Icons centered within touch targets
- [ ] Hover states work on desktop (not affecting mobile)

---

## Phase 3: Dark Mode Functionality

### 3.1 Theme Toggle

**Toggle Dark Mode**
- [ ] Open DevTools > Rendering > Emulate CSS prefers-color-scheme: dark
- [ ] Page immediately switches to dark mode
- [ ] All components update colors correctly
- [ ] No flash of unstyled content (FOUC)

### 3.2 Dark Mode Color Verification

**Background Layers**
- [ ] **Primary Background**: Pure black (#0A0A0A) with gradient fade
- [ ] **Elevated Background**: #1C1C1E for cards
- [ ] **Tertiary Background**: #2C2C2E for elevated level 2 (if used)

**Text Colors**
- [ ] **Primary Text**: White (#FFFFFF)
- [ ] **Secondary Text**: iOS gray (#8E8E93)
- [ ] **Tertiary Text**: Darker gray (#636366)
- [ ] **Separator**: Subtle line color (not harsh white)

**Shadows in Dark Mode**
- [ ] **shadow-sm**: Subtle shadow visible on buttons
- [ ] **shadow-md**: Medium shadow visible on cards (not black blob)
- [ ] **shadow-lg**: Hover state shadow visible but not overwhelming

### 3.3 Contrast & Readability

**Light Mode**
- [ ] All text is readable against light backgrounds
- [ ] Links/buttons have sufficient contrast (WCAG AA minimum)
- [ ] Icons are clearly visible

**Dark Mode**
- [ ] All text is readable against dark backgrounds
- [ ] No "burning" white text (comfortable reading)
- [ ] Shadows don't create harsh black blocks
- [ ] Icons maintain visibility

**WCAG Contrast Ratio** (use Chrome DevTools or WebAIM Contrast Checker):
- [ ] Body text: ≥4.5:1 contrast ratio
- [ ] Large text (≥18px): ≥3:1 contrast ratio
- [ ] Interactive elements: ≥3:1 contrast ratio

---

## Phase 4: Responsive Design (Breakpoints)

### 4.1 Mobile (375px - Default Test Size)

**Layout**
- [ ] Single column grid (grid-cols-1)
- [ ] Full-width cards
- [ ] Page padding: `px-compact-lg` (16px)
- [ ] Vertical spacing: `py-compact-lg` (16px)
- [ ] Tabs show icon-only (no text labels)
- [ ] Header stacks vertically

**Safe Areas**
- [ ] Top safe area inset applied (notch area)
- [ ] Bottom safe area inset applied (home indicator)
- [ ] Content not cut off by notch/home indicator

### 4.2 Tablet (768px - md breakpoint)

**How to Test:**
1. Resize viewport to 768px width in DevTools
2. Verify layout changes at breakpoint

**Layout Changes**
- [ ] Grid becomes 2 columns (grid-cols-2)
- [ ] Page padding increases: `px-compact-xl` (24px)
- [ ] Vertical spacing increases: `py-compact-xl` (24px)
- [ ] Tabs show icons + text labels
- [ ] Header becomes horizontal flex layout
- [ ] Back button text changes to "Back to Leagues"

### 4.3 Desktop (1024px - lg breakpoint)

**How to Test:**
1. Resize viewport to 1024px+ width in DevTools

**Layout Changes**
- [ ] Grid becomes 3 columns (grid-cols-3)
- [ ] League name uses `text-ios-title-1` (28px)
- [ ] More generous spacing throughout
- [ ] Hover effects visible (shadows, transitions)
- [ ] All text labels visible (no truncation)

### 4.4 No Horizontal Scroll

**All Viewports**
- [ ] **375px**: No horizontal scroll bar at any page
- [ ] **768px**: No horizontal scroll bar
- [ ] **1024px+**: No horizontal scroll bar
- [ ] All content fits within viewport width
- [ ] Text truncates properly (ellipsis) when too long

---

## Phase 5: Animation & Transitions

### 5.1 Smooth Transitions

**Card Hover (Desktop Only)**
- [ ] Shadow increases from `shadow-md` to `shadow-lg`
- [ ] Transition duration: 200ms
- [ ] Transition easing: ease-in-out (feels smooth, not jerky)
- [ ] No layout shift on hover

**Button Interactions**
- [ ] Refresh button loading spinner animates smoothly
- [ ] Button state changes are instant (no lag)
- [ ] Disabled state has reduced opacity

**Theme Toggle**
- [ ] Dark mode transition is smooth (not jarring)
- [ ] Colors fade in gradually (if supported)
- [ ] No flickering during transition

### 5.2 Loading States

**Data Loading**
- [ ] Loading skeleton displays correctly
- [ ] Spinner animation is smooth (60fps)
- [ ] No layout shift when data loads
- [ ] Loading states use iOS-style spinners/animations

---

## Phase 6: iOS-Specific Features

### 6.1 Safe Area Insets (iOS Notched Devices)

**How to Test:**
1. DevTools > Device Toolbar > iPhone 14 Pro (or similar notched device)
2. Enable "Show device frame" to see notch

**Verify:**
- [ ] Content doesn't overlap with notch at top
- [ ] Content doesn't overlap with home indicator at bottom
- [ ] `safe-area-inset-top` class applied to main container
- [ ] `safe-area-inset-bottom` class applied to main container
- [ ] Proper padding compensates for notch/home indicator

### 6.2 iOS Shadow System

**Shadow Appearance**
- [ ] **shadow-sm**: Subtle, barely visible elevation (buttons)
- [ ] **shadow-md**: Clear elevation without harshness (cards)
- [ ] **shadow-lg**: Enhanced depth on hover (card hover)
- [ ] Shadows match iOS design (not harsh drop shadows)

**Dark Mode Shadows**
- [ ] Shadows still visible in dark mode (not invisible)
- [ ] Shadows use proper alpha/opacity for dark backgrounds
- [ ] No "double shadow" effect (elevation still feels natural)

---

## Phase 7: Regression Testing

### 7.1 Existing Features Still Work

**League Connection**
- [ ] Can connect to league via username
- [ ] User data loads correctly
- [ ] No errors in console during load

**League Selection**
- [ ] Can view list of leagues
- [ ] Can click "View Analytics" button
- [ ] League details load correctly
- [ ] Year selector works (loads leagues for selected year)

**Dashboard Tabs**
- [ ] **Overview Tab**: League overview loads
- [ ] **Teams Tab**: All team rosters display
- [ ] **Standings Tab**: Standings table loads
- [ ] **Activity Tab**: Recent activity loads

**Navigation**
- [ ] "Back to Leagues" button returns to league list
- [ ] Refresh button reloads league data
- [ ] League switcher (year/league selectors) work
- [ ] Tab navigation works (keyboard accessible)

### 7.2 Data Integrity

**Player Data**
- [ ] Player names display correctly
- [ ] Player positions are accurate
- [ ] Team rosters show all players
- [ ] No missing data or "undefined" values

**Trade History** (from previous fix)
- [ ] Trade history shows correct owner names (not roster IDs)
- [ ] Transaction participants are properly mapped
- [ ] All trade details are accurate

**Rankings Page**
- [ ] Rankings load correctly
- [ ] Position filters work
- [ ] Player cards display properly
- [ ] NFL data shows correctly

### 7.3 No New Console Errors

**Browser Console**
- [ ] No new TypeScript errors
- [ ] No new React warnings
- [ ] No accessibility warnings
- [ ] Only pre-existing warnings (if any)

---

## Phase 8: Performance Verification

### 8.1 Page Load Performance

**Metrics to Check** (Chrome DevTools > Lighthouse):
- [ ] **First Contentful Paint (FCP)**: < 1.8s
- [ ] **Largest Contentful Paint (LCP)**: < 2.5s
- [ ] **Time to Interactive (TTI)**: < 3.8s
- [ ] **Cumulative Layout Shift (CLS)**: < 0.1
- [ ] **Total Blocking Time (TBT)**: < 300ms

### 8.2 No Performance Degradation

**Compare Before/After**
- [ ] Initial page load time is similar (no increase)
- [ ] Player data cache loads quickly (<100ms from IndexedDB)
- [ ] Trade evaluation completes in <2s
- [ ] No memory leaks during navigation (check DevTools > Memory)

### 8.3 CSS Bundle Size

**Verify**
- [ ] Tailwind utilities are optimized (production build)
- [ ] No duplicate CSS classes
- [ ] CSS file size is reasonable (<100kb gzipped)
- [ ] Unused classes purged by Tailwind

---

## Phase 9: Accessibility (a11y)

### 9.1 Keyboard Navigation

**Tab Through Page**
- [ ] Can tab to all interactive elements
- [ ] Tab order is logical (top to bottom, left to right)
- [ ] Focus indicators are visible (outline/ring)
- [ ] Can activate buttons with Enter/Space
- [ ] Can navigate tabs with arrow keys (if supported)

### 9.2 Screen Reader Testing

**How to Test:**
1. Enable screen reader (Windows: Narrator, Mac: VoiceOver)
2. Navigate through dashboard page

**Verify:**
- [ ] Page landmarks are announced (main, nav, etc.)
- [ ] Headings are properly structured (h1, h2, h3)
- [ ] Buttons have descriptive labels
- [ ] Images have alt text (if applicable)
- [ ] Form inputs have associated labels

### 9.3 ARIA Attributes

**Verify (in DevTools > Elements)**
- [ ] Tabs have proper ARIA attributes (role="tablist", aria-selected)
- [ ] Buttons have aria-label for icon-only buttons
- [ ] Loading states have aria-busy or aria-live
- [ ] Disabled buttons have aria-disabled

---

## Phase 10: Cross-Browser Testing

### 10.1 Chrome/Edge (Chromium)

- [ ] All features work correctly
- [ ] Gradients render properly
- [ ] Shadows display correctly
- [ ] Dark mode works
- [ ] Safe area insets respected (if using iOS user agent)

### 10.2 Safari (iOS Simulation)

**How to Test:**
1. Use Safari Technology Preview or real iOS device
2. Test on iPhone SE (375px viewport)

**Verify:**
- [ ] Safe area insets work correctly
- [ ] Notch doesn't overlap content
- [ ] Home indicator has proper spacing
- [ ] Touch targets feel natural
- [ ] Scrolling is smooth (no lag)
- [ ] Dark mode toggle works (Settings > Safari > appearance)

### 10.3 Firefox

- [ ] Gradients render correctly
- [ ] Shadows appear as expected
- [ ] Dark mode works (Settings > Theme)
- [ ] Layout is consistent with Chrome

---

## Summary Checklist

**Before Marking Test Complete:**
- [ ] All Phase 1-10 items checked
- [ ] Unit tests pass (`npm run test:unit`)
- [ ] Build succeeds (`npm run build`)
- [ ] No new console errors
- [ ] No regressions in existing features
- [ ] Dark mode works perfectly
- [ ] Mobile-first design verified (375px)
- [ ] Touch targets ≥44px
- [ ] Accessibility requirements met
- [ ] Performance metrics acceptable

---

## Known Issues / Notes

**Pre-existing Issues (Not Introduced by This Change):**
- ESLint warnings for unused variables (already present)
- No issues introduced by iOS dark theme redesign

**Post-Testing Notes:**
- [Add any observations or issues found during manual testing]
- [Note any browser-specific quirks]
- [Document any accessibility improvements needed]

---

## Test Completion Sign-Off

**Tested By:** _________________
**Date:** _________________
**Test Environment:** _________________
**Result:** PASS / FAIL / PARTIAL

**Notes:**
_______________________________________________________
_______________________________________________________
_______________________________________________________
