# Radix UI & Tailwind CSS Specialist Agent - Quick Reference

**Agent ID:** `radix-ui-specialist`
**Location:** `.claude/agents/radix-ui-specialist.md`

## Overview

The Radix UI & Tailwind CSS Specialist is an elite UI agent that combines deep expertise in:
- **Radix UI Primitives** - All 25+ accessible component primitives
- **Tailwind CSS v4** - Modern utility-first styling with advanced patterns
- **Accessibility** - WCAG 2.1 Level AA compliance
- **Responsive Design** - Mobile-first approach with touch optimization
- **Design Systems** - CSS custom properties and design tokens

## When to Use This Agent

### Automatic Triggers (Per CLAUDE.md)
This agent is **automatically invoked** for all UI-related work:
> "Every time a UI task is worked or UI is changed ensure that the radix agent reviews and approves the changes or suggests and makes adjustments to improve as needed."

### Manual Invocation Examples
```
"Have the Radix UI specialist review the dialog component"
"Ask the UI specialist to implement a mobile-friendly dropdown"
"Get the Radix specialist to optimize our button styling"
"Have the Tailwind specialist review dark mode implementation"
```

## Core Capabilities

### Radix UI Expertise
- ✅ All 25+ primitives (Dialog, Select, Dropdown, Popover, Tabs, etc.)
- ✅ Accessibility compliance (ARIA, keyboard nav, screen readers)
- ✅ Component composition with `asChild` pattern
- ✅ Controlled vs uncontrolled patterns
- ✅ Portal management for overlays
- ✅ Data attribute styling integration

### Tailwind CSS Expertise
- ✅ Tailwind v4 features (@layer, CSS variables, container queries)
- ✅ Utility-first architecture
- ✅ Design system integration with CSS custom properties
- ✅ Advanced patterns (group/peer, arbitrary values, data attributes)
- ✅ Dark mode strategies (class-based, media query)
- ✅ Responsive design (mobile-first breakpoints)
- ✅ Animation & transitions
- ✅ Performance optimization

### Design System Patterns
- ✅ CSS custom properties for theming
- ✅ Design tokens (spacing, colors, typography)
- ✅ Component library architecture
- ✅ Dark mode implementation
- ✅ Responsive patterns
- ✅ Touch target optimization (≥44px iOS, ≥48px Android)

## Agent Review Checklist

When the agent reviews UI components, it checks:

### Radix Checklist
- [ ] All required accessibility props present
- [ ] Portal used for overlays
- [ ] `asChild` used correctly
- [ ] Keyboard navigation works
- [ ] Data attributes used for styling

### Tailwind Checklist
- [ ] Mobile-first responsive design
- [ ] Dark mode variants included
- [ ] Focus states defined (focus-visible:ring-2)
- [ ] Touch target sizing (min-h-11 / min-h-12)
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Animations respect prefers-reduced-motion

### Performance Checklist
- [ ] No dynamic class generation
- [ ] Reusable patterns extracted
- [ ] Minimal @apply usage
- [ ] Lazy loading for heavy components

## Example Code Patterns

### Responsive Dialog (Mobile Bottom Sheet)
```typescript
<Dialog.Portal>
  <Dialog.Overlay className="
    fixed inset-0 z-50
    bg-black/50 dark:bg-black/70
    backdrop-blur-sm
    data-[state=open]:animate-fade-in
  " />
  <Dialog.Content className="
    fixed bottom-0 left-0 right-0
    sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
    sm:w-auto sm:max-w-md
    rounded-t-xl sm:rounded-xl
    max-h-[90vh] sm:max-h-[85vh]
    bg-white dark:bg-neutral-900
    data-[state=open]:animate-slide-up
    sm:data-[state=open]:animate-scale-in
  ">
    <Dialog.Title className="text-lg font-semibold">Title</Dialog.Title>
    <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400">
      Description
    </Dialog.Description>
  </Dialog.Content>
</Dialog.Portal>
```

### Data Attribute Styling
```typescript
<Select.Trigger className="
  px-4 py-2 rounded-lg
  bg-white dark:bg-neutral-900
  border border-gray-200 dark:border-neutral-800
  data-[state=open]:border-blue-500
  data-[state=open]:ring-2
  data-[state=open]:ring-blue-500
  data-[disabled]:opacity-50
  data-[disabled]:cursor-not-allowed
  focus-visible:ring-2 focus-visible:ring-blue-500
">
```

### Group Hover Effects
```typescript
<div className="group hover:bg-gray-100 dark:hover:bg-neutral-800">
  <Icon className="
    text-gray-400 dark:text-gray-600
    group-hover:text-blue-500 dark:group-hover:text-blue-400
    group-hover:scale-110
    transition-all
  " />
  <span className="group-hover:underline">Label</span>
</div>
```

## Best Practices Enforced

### Tailwind Class Organization
```typescript
<div className="
  // Layout
  flex items-center justify-between gap-4
  w-full max-w-md mx-auto
  p-4 sm:p-6

  // Appearance
  bg-white dark:bg-neutral-900
  border border-gray-200 dark:border-neutral-800
  rounded-lg shadow-sm

  // Typography
  text-base font-medium text-gray-900 dark:text-white

  // Interaction
  hover:shadow-md hover:border-blue-300
  focus-visible:ring-2 focus-visible:ring-blue-500
  transition-all duration-200

  // State
  data-[state=open]:shadow-lg
  data-[disabled]:opacity-50
">
```

## Anti-Patterns to Avoid

1. ❌ **Nested Interactive Elements** - Use `asChild` instead
2. ❌ **Manual State Classes** - Use Radix data attributes
3. ❌ **Dynamic Template Literals** - Breaks Tailwind: `className={\`text-${color}\`}`
4. ❌ **Missing Portal** - Overlays need Portal for z-index
5. ❌ **Missing Dark Mode** - Always include dark: variants
6. ❌ **Poor Focus States** - Must have focus-visible styles
7. ❌ **Small Touch Targets** - Minimum 44x44px (iOS) or 48x48px (Android)

## Resources Referenced

The agent references these authoritative sources:

### Radix UI
- [Radix UI Official Docs](https://www.radix-ui.com/primitives/docs/overview/introduction)
- [Radix UI GitHub](https://github.com/radix-ui/primitives)
- [Radix Icons](https://www.radix-ui.com/icons)

### Tailwind CSS
- [Tailwind CSS Official Docs](https://tailwindcss.com/docs)
- [Tailwind v4 Migration Guide](https://tailwindcss.com/docs/v4-beta)
- [Tailwind UI Components](https://tailwindui.com)
- [Tailwind Play](https://play.tailwindcss.com)

### Accessibility
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Real-World Examples
- **Sleeper.com** - Production example using Radix + Tailwind v4.1.7
- **shadcn/ui** - Component patterns library
- **Vercel Design System** - Modern design tokens

## Usage Tips

1. **Always involve for UI changes** - Per CLAUDE.md protocol
2. **Provide context** - Share what component you're building
3. **Ask for reviews** - Get feedback on existing implementations
4. **Request patterns** - Ask for specific design patterns
5. **Check accessibility** - Have agent verify WCAG compliance
6. **Optimize performance** - Get Tailwind optimization suggestions

## Example Requests

### Implementation
- "Implement a mobile-friendly dropdown menu with Radix + Tailwind"
- "Create a responsive dialog that becomes a bottom sheet on mobile"
- "Build a searchable select component with dark mode support"

### Review
- "Review the dialog component for accessibility issues"
- "Check if the button styling follows Tailwind best practices"
- "Validate the responsive breakpoints in this component"

### Optimization
- "Optimize the Tailwind classes in this component"
- "Improve the dark mode implementation"
- "Make this component more accessible for keyboard users"

### Patterns
- "Show me the best pattern for a mobile drawer"
- "What's the right way to style Radix data attributes with Tailwind?"
- "How should I organize Tailwind classes for maintainability?"

---

**Remember:** This agent is your go-to expert for all UI-related work. It ensures production-ready, accessible, and performant components using industry best practices from platforms like Sleeper.com.
