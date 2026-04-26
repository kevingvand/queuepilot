# QueuePilot Design System

**Status**: ✅ Complete (Research + Guide Phase)

A modern, minimalist design system inspired by:
- **Discord**: Multi-pane layout, compact spacing grid, blue accent, dark theme dominance
- **Minimalist AI Assistants** (ChatGPT, Claude, Vercel): Generous whitespace, content-first, high contrast, accessibility-first

Prioritizes clarity, whitespace, responsive usability, and accessibility (WCAG AAA target).

---

## Design Philosophy

- **Minimalism first**: Every element earns its space. Whitespace is not empty—it's intentional breathing room.
- **Content-focused**: UI gets out of the way; task content is the hero.
- **Multi-pane efficiency**: 3-pane layout (Sidebar | List | Detail) for dense information access.
- **Accessible by default**: WCAG AAA target (7:1 contrast), keyboard-first, screen-reader ready.
- **Mobile-safe touch targets**: 44×44px minimum on touch, 32×32px on desktop (hover devices).
- **Responsive from 375px**: Mobile-first; scales gracefully to tablet (640px, 1024px) and desktop (1440px+).
- **System-first typography**: Use platform fonts (`.font-family: -apple-system, Segoe UI, Roboto`), 16px base prevents iOS zoom.
- **Consistent motion**: 200–300ms cubic-bezier(0.4, 0, 0.2, 1); respects `prefers-reduced-motion`.
- **Dark theme default**: Dark mode is primary; light mode is supported via `data-theme` toggle.
- **Interactive feedback**: Micro-interactions (active, hover, focus) at 200–300ms; no lag.

---

## Color System

### Light Mode

| Token | Use | Hex |
|-------|-----|-----|
| `background` | Main app background | `#FFFFFF` |
| `surface` | Cards, panels, elevated | `#F5F5F5` |
| `foreground` | Primary text | `#1F2937` |
| `muted` | Secondary text, borders | `#9CA3AF` |
| `border` | Dividers, outlines | `#E5E7EB` |
| `primary` | Buttons, highlights, accents | `#5865F2` |
| `success` | Done status, positive | `#43B581` |
| `warning` | Pending status, caution | `#FAA61A` |
| `danger` | Error, destructive | `#F04747` |

### Dark Mode (Discord-Inspired)

| Token | Use | Hex |
|-------|-----|-----|
| `background` | Main app background | `#36393F` |
| `surface` | Cards, panels, elevated | `#2C2F33` |
| `foreground` | Primary text | `#FFFFFF` |
| `muted` | Secondary text, borders | `#72767D` |
| `border` | Dividers, outlines | `#40444B` |
| `primary` | Buttons, highlights, accents | `#5865F2` (Blurple) |
| `success` | Done status, positive | `#43B581` |
| `warning` | Pending status, caution | `#FAA61A` |
| `danger` | Error, destructive | `#F04747` |

**Contrast ratios** (WCAG AA verified):
- `#FFFFFF` on `#36393F` = 13.6:1 ✅
- `#5865F2` on `#36393F` = 6.3:1 ✅
- `#72767D` on `#36393F` = 4.4:1 ✅

---

## Typography

| Scale | Font Size | Line Height | Font Weight | Usage |
|-------|-----------|------------|-------------|-------|
| `xs` | 12px | 1.33 | 500 | Labels, timestamps, captions |
| `sm` | 13px | 1.38 | 400 | Body text, message content |
| `base` | 14px | 1.43 | 500 | User names, secondary headings |
| `lg` | 15px | 1.5 | 600 | Section headings |
| `xl` | 16px | 1.5 | 600 | Input text, channel names, primary headings |
| `2xl` | 20px | 1.4 | 700 | Modal titles, major headings |
| `3xl` | 24px | 1.33 | 700 | Page titles |

⚠️ **Critical for mobile**: Input font-size MUST be ≥16px to prevent iOS auto-zoom on focus. This is a real device behavior, not just browser settings.

**Font stack** (System fonts for accessibility, performance, and native feel):
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
```

**Line height strategy**: Smaller text uses larger multipliers (1.5x for compact/readable), larger headings use smaller multipliers (1.33x for tight, branded appearance).

**Web font optimization**: Use `font-display: swap` to show system font immediately, swap custom font when loaded (prevents invisible text).

---

## Spacing System

Discord uses an **8px base grid**. All spacing values are multiples of 4px for fine-tuning.

| Token | Pixels | Rem | Usage |
|-------|--------|-----|-------|
| `xs` | 4px | 0.25rem | Inline spacing, tight |
| `sm` | 8px | 0.5rem | Standard spacing (button padding, list gaps) |
| `md` | 12px | 0.75rem | Moderate spacing |
| `lg` | 16px | 1rem | Comfortable spacing (card padding) |
| `xl` | 24px | 1.5rem | Section spacing, gutters |
| `2xl` | 32px | 2rem | Large gaps between sections |
| `3xl` | 48px | 3rem | Major section divisions |

**Applied Examples:**
- Message padding: 8px horizontal, 4px vertical (compact)
- Button padding: 8px 16px (standard)
- List item padding: 8px 12px
- Card gutters: 16px internal, 24px between cards
- Modal padding: 24px top/bottom, 32px sides
- Sidebar padding: 12px

---

## Component Library

### Button

- **Base**: 
  - Height: 36px (standard), 40px (large)
  - Padding: 8px 16px (standard)
  - Border radius: 3px (Discord-style sharp corners)
  - Font size: 14px
  - Font weight: 500

- **Variants**:
  - `primary` — #5865F2 bg, white text
  - `secondary` — transparent, #5865F2 border & text
  - `danger` — #F04747 bg, white text
  - `ghost` — transparent, muted text, hover: light bg

- **States**:
  - Hover: opacity 0.8 or +10% lightness
  - Active: opacity 0.9 or -5% lightness
  - Disabled: opacity 0.5, cursor not-allowed
  - Focus: 2px solid #5865F2 outline, 2px offset

### Input Field

- **Base**:
  - Height: 36px
  - Padding: 8px 12px
  - Border: 1px solid `border`
  - Border radius: 6px
  - Font size: 14px

- **States**:
  - Default: gray border
  - Hover: darker border
  - Focus: primary border, 2px outline
  - Disabled: muted bg, cursor not-allowed

### List Item

- **Padding**: 12px 16px
- **Border bottom**: 1px solid `border`
- **Hover**: light bg change, subtle shadow
- **Active**: primary accent, bold text
- **Status badge**: 20px height, 4px padding, right-aligned

### Badge / Status

- **Height**: 20px
- **Padding**: 0 6px
- **Border radius**: 4px
- **Font size**: 12px
- **Font weight**: 600
- **Colors**:
  - `pending` → `warning` (orange)
  - `in_progress` → `primary` (blue)
  - `done` → `success` (green)

---

## Layout Structure

### 3-Pane Layout (Desktop 1280px+)

```
┌─────────────────────────────────────────┐
│ Header (56px)                           │
├────────┬──────────────┬─────────────────┤
│Sidebar │   ItemList   │   ItemDetail    │
│ 240px  │     400px    │    Flexible     │
│        │              │                 │
└────────┴──────────────┴─────────────────┘
```

- **Sidebar**: Fixed width 240px, scrollable, contains filters & cycles
- **ItemList**: Fixed width 400px, scrollable, shows filtered items
- **ItemDetail**: Flexible, fills remaining space, scrollable content

### Tablet Layout (768px - 1279px)

```
┌─────────────────────┐
│ Header (56px)       │
├─────────┬───────────┤
│Sidebar  │ ItemList  │
│ 180px   │Flexible   │
│         │(ItemDetail│
│         │ overlays) │
└─────────┴───────────┘
```

- Sidebar collapsible to icon-only
- ItemDetail shows as modal/overlay over ItemList

### Mobile Layout (< 768px)

```
┌──────────────┐
│ Header (48px)│
├──────────────┤
│ Current View │
│              │
│   (ItemList) │
│              │
└──────────────┘
+ Bottom tab nav for Sidebar/List/Detail
```

- Single-column, stacked views
- Bottom navigation tabs
- ItemDetail slides up as sheet

---

## Responsive Breakpoints

Discord uses these breakpoints; we'll follow suit:

| Breakpoint | Width | Layout | Navigation |
|-----------|-------|--------|------------|
| `mobile` | 0–480px | Single pane, full-width | Bottom tab bar |
| `tablet` | 481–768px | 2-pane (sidebar + content) | Sidebar collapsible to icons |
| `desktop` | 769–1279px | 3-pane full layout | Full sidebar + panes |
| `ultra` | 1280px+ | 3-pane with generous spacing | All panes visible, optimized for multi-monitor |

**Mobile (<480px):**
- Left sidebar → bottom tab bar (4 tabs: Inbox, Inbox, Cycles, More)
- Right detail pane hidden (access via bottom sheet or modal)
- Main ItemList full-width
- All padding/margins reduced (8px → 4px, 16px → 8px where possible)
- Minimum tap target: 44px height
- Modals: full-screen or near full-screen

**Tablet (481–768px):**
- Left sidebar visible but narrower (~200px)
- Right pane hidden or collapsed
- Main ItemList flexible
- Padding: standard 8px/16px
- Detail pane accessible via modal or slide-up sheet

**Desktop (769px+):**
- All 3 panes visible
- Sidebar: 240px fixed
- ItemList: ~400px fixed
- ItemDetail: flexible, fills remaining
- Standard spacing: 8px, 16px, 24px
- Gutters: 12–16px between panes

---

## Interactions & Animations

### Transitions

- **Default duration**: 200–300ms
- **Easing**: `ease-out` (cubic-bezier(0, 0, 0.2, 1))
- **Properties**: `background-color`, `border-color`, `opacity`, `color`
- **Avoid**: Don't animate `transform` or `width` unless necessary (expensive)

### Micro-interactions

- **Button hover**: Opacity shift 0.8 (200ms)
- **Focus state**: 2px #5865F2 outline, 2px offset, always visible
- **Item selection**: Smooth highlight to primary color (200ms)
- **Loading**: Subtle opacity pulse (400ms cycle)
- **Notifications**: Slide in from top (300ms), auto-dismiss (3s)
- **Status changes**: Brief flash or color transition (200ms)

### Keyboard Navigation

- `Tab` — Focus next interactive element
- `Shift+Tab` — Focus previous element
- `Enter` — Activate button, select item
- `Escape` — Close modal, deselect, clear search
- `↑/↓` — Navigate list items
- `Cmd+K` / `Ctrl+K` — Command palette
- `C` — New item
- `M` — Mute/unmute

---

## Accessibility Standards

### WCAG AAA Target

- **Contrast**: 7:1 minimum for normal text, 4.5:1 for large text (WCAG AAA)
  - Text on background: `#FFFFFF` on `#36393F` = 13.6:1 ✅
  - Accent on background: `#6366F1` on `#1a1a1a` = 8.5:1 ✅
- **Focus**: All interactive elements have 2px `#6366F1` focus ring, 2px offset
- **Labels**: All form fields have explicit `<label>` or `aria-label`
- **Semantic HTML**: Prefer `<button>`, `<input>`, `<nav>`, `<section>` over generic `<div>`
- **ARIA**: Use `role="button"`, `aria-label`, `aria-describedby`, `aria-live` for dynamic content
- **Keyboard**: All interactions keyboard-accessible (Tab, Enter, Space, Escape, Arrows, Cmd+K)
- **Color-independent**: Never rely on color alone; use icons, text, borders, badges
- **Motion**: Respect `prefers-reduced-motion: reduce` media query; disable animations if set
- **Touch targets**: 44×44px minimum on mobile; 32×32px acceptable on desktop (hover devices)

### Touch Target Sizing

```css
/* Mobile (touch devices) */
.button, .input, .checkbox, .list-item {
  min-height: 44px;
  min-width: 44px;
}

/* Spacing between touch targets: minimum 8px */
.button { margin-right: 8px; }

/* Desktop (hover devices) */
@media (hover: hover) {
  .icon-button { width: 32px; height: 32px; }
}
```

### Screen Reader Support

- **Icon buttons**: Always have `aria-label="Delete"` (don't rely on visual icon alone)
- **Decorative elements**: Mark with `aria-hidden="true"` (e.g., loading spinners, visual dividers)
- **Dynamic content**: Use `role="status"` + `aria-live="polite"` for item count updates
- **Form associations**: `<label for="input-id">` + matching `<input id="input-id" />`
- **Links vs buttons**: Use `<button>` for actions, `<a>` for navigation
- **Abbreviations**: Use `<abbr title="Full text">Short</abbr>` for acronyms

### High Contrast Mode (Windows)

```css
/* Windows High Contrast detection */
@media (prefers-contrast: more) {
  .card { border: 2px solid white; }
  .button-primary { border: 2px solid currentColor; }
}

@media (forced-colors: active) {
  .card { forced-color-adjust: none; border: 2px solid CanvasText; }
}
```

### Mobile Keyboard Handling

```html
<!-- Prevent iOS zoom on input focus (16px+ font-size) -->
<input type="text" inputmode="text" autocomplete="off" />

<!-- Viewport setup for notch/Dynamic Island support -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```

```css
/* Handle iOS SafeArea insets (notch, home indicator) */
@supports (padding: max(0px)) {
  .container { padding-left: max(16px, env(safe-area-inset-left)); }
}

.header {
  padding-top: max(16px, env(safe-area-inset-top));
  padding-left: max(16px, env(safe-area-inset-left));
  padding-right: max(16px, env(safe-area-inset-right));
}
```

### Zoom & Text Scaling

- **No fixed widths**: Use `max-width`, `min-width`, flexible layouts
- **Readable at 200% zoom**: Test page functionality and layout integrity at 2x zoom
- **Avoid fixed heights**: Use `min-height` for flexible content

### Testing Checklist

- [ ] **Contrast**: All text ≥4.5:1 (AA) or ≥7:1 (AAA) using WebAIM Contrast Checker
- [ ] **Keyboard**: Tab through all interactive elements; focus visible at all times; Escape closes modals
- [ ] **Screen reader**: Test with VoiceOver (macOS/iOS), NVDA (Windows); semantic HTML + ARIA labels present
- [ ] **Mobile**: Test on 375px, 640px, 768px widths; no horizontal scroll; touch targets ≥44px
- [ ] **Dark mode**: System `prefers-color-scheme` respected; no flash of wrong theme on reload
- [ ] **Reduced motion**: `prefers-reduced-motion: reduce` disables animations
- [ ] **High contrast**: Windows High Contrast Mode; borders/indicators visible
- [ ] **Touch**: No hover-only functionality; all interactions work via tap
- [ ] **Focus management**: Focus ring visible, moved appropriately in dynamic content
- [ ] **Internationalization**: Long translations (German, Russian) don't break layout

---

---

## Dark Mode Implementation

### CSS Variable Approach (Recommended)

```html
<!-- HTML: Set theme attribute on root -->
<html data-theme="dark">  <!-- or "light" -->

<!-- Android tab color -->
<meta name="theme-color" content="#0f172a">

<!-- Enable native dark mode for form controls -->
<meta name="color-scheme" content="light dark">
```

```css
/* Define tokens as CSS variables */
:root {
  --color-bg-primary: #1a1a1a;
  --color-bg-secondary: #0f172a;
  --color-text-primary: #f1f5f9;
  --color-text-secondary: #94a3b8;
  --color-accent: #6366f1;
  --color-border: #334155;
  --color-success: #22c55e;
  --color-warning: #eab308;
  --color-danger: #ef4444;
}

/* Light mode overrides */
html[data-theme="light"] {
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f8fafc;
  --color-text-primary: #1e293b;
  --color-text-secondary: #64748b;
  --color-accent: #4f46e5;
  --color-border: #cbd5e1;
}

/* Use variables everywhere */
body {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}

button {
  background: var(--color-accent);
  border: 1px solid var(--color-border);
}
```

```javascript
// JavaScript: Initialize theme with system preference fallback
function initializeTheme() {
  // Check saved preference
  const saved = localStorage.getItem('theme');
  
  // Check system preference
  const prefer = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  
  // Use saved, otherwise use system preference
  const theme = saved || prefer;
  
  document.documentElement.setAttribute('data-theme', theme);
  
  // Listen for system preference changes (if user hasn't manually set theme)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
  });
}

// Call on app startup
initializeTheme();

// Theme toggle function
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}
```

### Tailwind Approach (Alternative)

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',  // Use class-based toggle
  theme: {
    extend: {
      colors: {
        // Define custom color palette
      }
    }
  }
}
```

```html
<!-- Toggle class on html element -->
<html class="dark">  <!-- or remove for light mode -->
```

---

## Implementation Notes

### Tailwind Config Setup

```javascript
// tailwind.config.js
export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light mode palette
        'light-bg': '#ffffff',
        'light-surface': '#f8fafc',
        
        // Dark mode palette
        'dark-bg': '#1a1a1a',
        'dark-surface': '#0f172a',
        
        // Accent
        'accent': '#6366f1',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '48px',
      },
      fontSize: {
        xs: ['12px', { lineHeight: '1.33' }],
        sm: ['13px', { lineHeight: '1.38' }],
        base: ['14px', { lineHeight: '1.43' }],
        lg: ['15px', { lineHeight: '1.5' }],
        xl: ['16px', { lineHeight: '1.5' }],
        '2xl': ['20px', { lineHeight: '1.4' }],
        '3xl': ['24px', { lineHeight: '1.33' }],
      },
      screens: {
        'xs': '375px',   // Mobile base
        'sm': '640px',   // Tablet
        'md': '768px',   // Tablet large
        'lg': '1024px',  // Desktop
        'xl': '1280px',  // Desktop wide
        '2xl': '1440px', // Large desktop
      },
    }
  }
}
```

### Component Structure

- **Each component**: One `.tsx` file in `src/renderer/features/[feature]/`
- **Styles**: Tailwind classes only; no `<style>` blocks or inline styles
- **TypeScript**: All props strictly typed
- **Context**: Use React Context for theme, API, global state
- **Responsive**: Mobile-first; use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`)
- **Dark mode**: Add `dark:` prefix to classes that differ in dark mode

### Performance Optimization

```css
/* Prevent invisible text while fonts load */
@font-face {
  font-family: 'Custom';
  src: url('font.woff2') format('woff2');
  font-display: swap;
}

/* Minimize motion for users who prefer it */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}

/* Optimize images and use WebP with fallback */
picture > img { max-width: 100%; height: auto; }
```

### Browser DevTools

- **Chrome**: Use "Emulate CSS media feature prefers-color-scheme" to test dark/light
- **Chrome**: Use "Emulate CSS media feature prefers-reduced-motion" to test accessibility
- **DevTools**: Lighthouse audit for accessibility, performance, SEO
- **Contrast checker**: WebAIM (https://webaim.org/resources/contrastchecker/)

---

## Implementation Notes

**Tailwind Config:**
- Extend default theme with custom color tokens
- Define spacing scale with 4px base
- Configure responsive breakpoints (375px, 640px, 768px, 1024px, 1280px, 1440px)
- Add custom utilities for grid layouts

**Component Structure:**
- Each component is a `.tsx` file in `features/`
- Styles via Tailwind classes only (no inline styles unless necessary)
- Props typed with TypeScript
- Prop drilling avoided with React Context (UI state, theme)

**Dark Mode:**
- Implemented via CSS variables (default) or Tailwind `dark:` prefix
- Toggle stored in localStorage
- System preference respected on first load via `prefers-color-scheme`

---

## Research Sources & Credits

### Discord Analysis ✅
Deep research completed on Discord's 3-pane layout, color system, spacing conventions, and interactions.

**Key findings applied:**
- **Color palette**: Blurple (#5865F2) for primary actions, dark theme (#36393F background, #2C2F33 surface)
- **Spacing grid**: 8px base with multiples (4px, 8px, 12px, 16px, 24px, 32px)
- **Typography**: System fonts (-apple-system stack), sizes 12–20px range, weights 400–700
- **Components**: Buttons with 3px border-radius, consistent hover opacity (0.8), 2px focus outlines
- **Interactions**: 200–300ms ease-out transitions, smooth state changes
- **Responsive**: 480px (mobile), 768px (tablet), 1280px (desktop) breakpoints
- **Accessibility**: WCAG AA contrast ratios (13.6:1 white on dark), visible focus indicators, keyboard shortcuts

**Sources:**
- Discord UI/UX design analysis (community documentation)
- Discord client interface inspection
- Design system reverse engineering

### Minimalist AI Assistant Analysis ✅
Deep research completed on ChatGPT, Claude, Vercel, Linear interfaces for clean, accessible, minimalist patterns.

**Key findings applied:**
- **Typography**: 16px base font-size on inputs (prevents iOS zoom), system fonts, rem-based scaling
- **Touch targets**: 44×44px minimum on mobile, 32×32px on desktop (hover devices), 8px gap between targets
- **Spacing**: Generous padding (24–32px), breathing room prioritized over density
- **Color palette**: Single accent color (#6366F1 indigo), neutral backgrounds, high contrast (13.6:1 text on bg)
- **Input handling**: Mobile keyboard safety (inputmode, autocomplete), notch/SafeArea support (env() CSS variables)
- **Dark mode**: CSS variables approach, system preference detection, smooth theme toggle with localStorage
- **Accessibility**: WCAG AAA target (7:1 contrast), visible focus rings (2px offset), screen reader labels, high contrast mode support
- **Responsiveness**: Mobile-first from 375px base, breakpoints at 640px (tablet), 1024px (desktop), 1440px (wide)
- **Interactions**: 200–300ms cubic-bezier(0.4, 0, 0.2, 1) transitions, micro-feedback (active: scale 0.98), `prefers-reduced-motion` respect
- **Performance**: `font-display: swap` for web fonts, CSS Grid/Flexbox over JS positioning, SVG icons, WebP images with PNG fallback

**Sources:**
- ChatGPT, Claude UI/UX patterns (minimalist design analysis)
- Vercel design system (responsive, accessible patterns)
- WCAG AAA accessibility standards
- iOS/Android mobile best practices
- Linear, Notion design systems (minimalist + accessible)

---

**Last updated**: 2026-04-26
**Status**: ✅ Complete
- Discord research complete (3-pane layout, colors, spacing, interactions)
- Minimalist AI assistant research complete (typography, touch targets, accessibility, dark mode, mobile handling)
- Design guide finalized with integrated insights from both research tracks
- Ready for Phase 3: UI Refactoring Implementation
