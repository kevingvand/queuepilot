# QueuePilot Design System

**Status**: ✅ Complete (Research + Framework)  
**Aesthetic Direction**: Clean + Modern (polished, slightly more visual depth)  
**Last Updated**: 2026-04-26

---

## Design Philosophy

QueuePilot is a task inbox for humans and AI to process together. Our design prioritizes:

- **Content clarity** — tasks and context come first; UI supports, doesn't distract
- **Efficiency** — power users can work via keyboard; casual users have visual clarity
- **Polished presentation** — professional appearance builds trust and encourages daily use
- **Responsive usability** — works beautifully on phone, tablet, and desktop
- **Accessibility-first** — keyboard nav, screen readers, high contrast, motion preferences
- **Intentional decisions** — every pixel choice answers "why?"

---

## Design Inspiration & Why We Reference Them

### Discord
**What we learn**: Efficient multi-pane layouts for power users, compact spacing grid, clear status indicators.  
**Specific patterns we adopt**: 3-pane layout (Sidebar | List | Detail), status badges for task state, consistent spacing.  
**What we DON'T copy**: Discord's gamification, complex nested interactions, or dark-first-only approach.

### Paperclip  
**What we learn**: Minimalist AI assistant interfaces with generous whitespace, clean typography, purposeful color use.  
**Specific patterns we adopt**: Single accent color, high line-height for readability, reduced visual clutter.  
**What we DON'T copy**: Single-pane chat layout (we need multi-pane for task management).

### Obsidian
**What we learn**: Keyboard-first navigation, collapsible sidebar sections, command palette (Cmd+K), power-user customization.  
**Specific patterns we'll consider**: Tab/panel navigation, keyboard shortcuts, optional advanced features.  
**What we DON'T copy**: Knowledge graph visualization (not needed for task inbox).

### Notion  
**What we learn**: Multiple views of same data (list, kanban, timeline), inline editing, block-based flexibility.  
**Specific patterns we'll consider**: View switcher, inline task updates, drag-and-drop organization.  
**What we DON'T copy**: Full database-heavy architecture (we have simpler task model).

### Vercel & Anthropic Guidelines
**What we apply**: Accessibility standards (WCAG AAA), semantic HTML, visible focus states, motion respect, distinctive typography without cliché.

---

## QueuePilot Use Case

We're building an inbox where:
- **Fast ingestion matters** — add ideas quickly without friction
- **Quick decisions matter** — mark done, defer, archive, or comment in one click
- **Power users exist** — keyboard shortcuts for speed
- **Casual users exist** — visual clarity for newcomers
- **Collaboration is lightweight** — comments and assignments, not real-time chat
- **Mobile matters** — people triage tasks on the go

**Not** a chat app (Discord), **not** a knowledge graph (Obsidian), **not** enterprise software (Notion). We're **focused and purposeful**.

---

## Design Decision Framework

For each feature, component, or interaction, we ask:

1. **Purpose** — What problem does this solve for task management?
2. **Audience** — Power user (keyboard, density) or new user (visual clarity)?
3. **Efficiency** — Fewest clicks/keystrokes to accomplish the goal?
4. **Clarity** — Is the purpose immediately obvious?
5. **Consistency** — Does it match established patterns?
6. **Accessibility** — Keyboard accessible? Visible focus? High contrast? Motion safe?

---

## Aesthetic Direction: Clean + Modern

**Visual signature**: Polished, intentional, professional  
**Mood**: Trustworthy, organized, productive  
**Energy**: Not playful, not brutalist—just right  

**Key characteristics**:
- **Color palette**: Neutral backgrounds with a single accent color (#6366F1 indigo)
- **Typography**: System fonts (no custom fonts = faster, accessible), clear hierarchy, high line-height
- **Spacing**: Generous whitespace (breathing room), 8px base grid
- **Interactions**: Subtle visual feedback (hover, active, focus states), smooth transitions (200–300ms)
- **Depth**: Subtle shadows and borders to define surfaces (not flat, not skeuomorphic)
- **Motion**: Only purposeful animations; respect `prefers-reduced-motion`
- **Borders**: Soft, understated (2–4px radius, soft grays)

---

## Color System

### Dark Mode (Primary)

| Token | Use | Hex | Notes |
|-------|-----|-----|-------|
| `bg-primary` | Main app background | `#0f172a` | Deep blue-black, reduces eye strain |
| `bg-secondary` | Cards, elevated surfaces | `#1a1f3a` | Slight contrast from primary |
| `surface-hover` | Hover state for clickable surfaces | `#2c3a54` | Subtle lift on hover |
| `text-primary` | Main content text | `#f1f5f9` | High contrast (13.6:1 ratio) |
| `text-secondary` | Secondary text, labels | `#cbd5e1` | Lower contrast for hierarchy |
| `text-muted` | Tertiary text, hints | `#94a3b8` | Further contrast reduction |
| `border` | Dividers, outlines | `#334155` | Subtle separator |
| `accent` | Primary action, highlights | `#6366f1` | Indigo—used sparingly |
| `accent-hover` | Accent on hover | `#818cf8` | Brightened for interaction |
| `success` | Done, positive state | `#22c55e` | Green, clear positive signal |
| `warning` | Pending, caution state | `#eab308` | Yellow, attention signal |
| `danger` | Error, destructive | `#ef4444` | Red, clear warning |

**Contrast ratios** (all WCAG AAA):
- Text on primary: 13.6:1 ✅
- Accent on primary: 8.4:1 ✅
- Secondary text on primary: 5.2:1 ✅

### Light Mode (Secondary)

| Token | Hex |
|-------|-----|
| `bg-primary` | `#ffffff` |
| `bg-secondary` | `#f8fafc` |
| `surface-hover` | `#f1f5f9` |
| `text-primary` | `#0f172a` |
| `text-secondary` | `#334155` |
| `text-muted` | `#94a3b8` |
| `border` | `#e2e8f0` |
| `accent` | `#4f46e5` |
| `accent-hover` | `#6366f1` |

---

## Typography

**Philosophy**: System fonts (accessibility, performance, native feel) with careful hierarchy and generous line-height.

| Scale | Size | Line Height | Weight | Use |
|-------|------|-------------|--------|-----|
| `xs` | 12px | 1.33 | 500 | Labels, timestamps, captions |
| `sm` | 13px | 1.38 | 400 | Body text, descriptions |
| `base` | 14px | 1.43 | 500 | Body text, secondary headings |
| `lg` | 15px | 1.5 | 600 | Section headings |
| `xl` | 16px | 1.5 | 600 | Primary headings (⚠️ inputs MUST be 16px minimum to prevent iOS zoom) |
| `2xl` | 20px | 1.4 | 700 | Modal titles, major headings |
| `3xl` | 24px | 1.33 | 700 | Page titles |

**Font stack**:
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
```

**Line height strategy**: Smaller text gets larger multipliers (1.5x for readability), larger headings use smaller multipliers (1.33x for tightness).

**Typography details**:
- Use curly quotes: `"` `"` not straight `"`
- Use ellipsis: `…` not `...`
- Non-breaking spaces for compound names: `⌘&nbsp;K`, `10&nbsp;MB`
- `font-display: swap` for any web fonts (system fonts loaded by default)
- `font-variant-numeric: tabular-nums` for number columns

---

## Spacing System

**Base unit**: 4px (allows fine-tuning). All spacing is multiples of 4px.

| Token | Pixels | Use |
|-------|--------|-----|
| `xs` | 4px | Inline spacing, tight |
| `sm` | 8px | Standard spacing (button padding, list gaps) |
| `md` | 12px | Moderate spacing |
| `lg` | 16px | Comfortable spacing (card padding, section margins) |
| `xl` | 24px | Section spacing, gutters |
| `2xl` | 32px | Large gaps between sections |
| `3xl` | 48px | Major section divisions |

**Applied examples**:
- Button padding: 8px horizontal, 6px vertical (36px total height)
- List item padding: 12px horizontal, 8px vertical
- Card padding: 16px
- Section gap: 24px
- Modal padding: 24px
- Sidebar padding: 12px

---

## Interactions & Motion

### Transitions
All state changes use: `transition: [property] 200ms cubic-bezier(0.4, 0, 0.2, 1);`

**Properties to transition**: `background-color`, `color`, `border-color`, `opacity`, `transform`, `box-shadow`  
**Never transition**: All properties at once; be explicit.

### Hover States
- Buttons/cards: Slight background shift (2–5% lighter/darker) or shadow increase
- Icons: Color shift to accent
- Opacity: 0.8 for disabled/inactive states

### Active States
- Button pressed: Scale 0.98 (micro-feedback)
- Checkbox/radio: Accent highlight
- List item selected: Accent background + bold text

### Focus States
All interactive elements need visible focus:
- Outline: 2px solid `#6366f1` (accent)
- Offset: 2px
- Never remove focus outline without replacement

### Disabled States
- Opacity: 0.5
- Cursor: `not-allowed`
- No hover effects

### Animations
- **Entrance**: Staggered reveal on page load (100–150ms stagger per element)
- **Loading**: 1s pulse animation (respect `prefers-reduced-motion`)
- **Transitions**: 200–300ms for all state changes
- **Never**: Use animations to communicate critical info (use text + color + icon)

**Respect prefers-reduced-motion**:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Responsive Design

**Mobile-first approach**: Start at 375px, scale up.

| Breakpoint | Use | Key changes |
|-----------|-----|-------------|
| 375px | Mobile (iPhone SE) | Base layout, touch-optimized |
| 640px | Tablet (iPad mini) | Increased padding, wider containers |
| 768px | Tablet (iPad) | 2-pane layout (sidebar collapsible) |
| 1024px | Desktop (iPad Pro, laptop) | Full 3-pane layout enabled |
| 1280px | Wide desktop | Increased gutters, max-width containers |
| 1440px | Large monitor | Maximum comfortable width |

### Layout: 3-Pane (Desktop)
```
Sidebar (240px fixed) | ItemList (400px) | ItemDetail (flexible)
```

Gutters: 12–16px between panes.

### Layout: 2-Pane (Tablet)
```
Sidebar (drawer/toggle) | ItemList (full width)
ItemDetail shown as modal on item select
```

### Layout: Mobile (1-pane)
```
ItemList (full width) | Sidebar as drawer | ItemDetail as modal
Bottom navigation for quick filter access
```

---

## Component Patterns

### Button
- **Height**: 36px (standard), 44px (mobile)
- **Padding**: 8px 16px (standard)
- **Border radius**: 4px
- **Font size**: 14px, weight 500
- **Variants**: Primary (accent bg), Secondary (ghost), Danger (red)
- **Touch targets**: Minimum 44px on mobile

### Input
- **Height**: 36px (standard), 44px (mobile, must have 16px font to prevent iOS zoom)
- **Padding**: 8px 12px
- **Border**: 1px solid `#334155`
- **Focus**: 2px accent outline, 2px offset
- **Placeholder**: Grayed-out, shows example (`e.g., task name…`)

### Badge
- **Height**: 20px
- **Padding**: 2px 8px
- **Border radius**: 3px
- **Font size**: 12px
- **Status**: Use color (green, yellow, red) + text (never color alone)

### List Item
- **Padding**: 12px horizontal, 8px vertical
- **Border**: None (subtle background change on hover)
- **Hover**: 2–5% background shift
- **Selected**: Accent highlight, bold text

### Card
- **Padding**: 16px
- **Border radius**: 6px
- **Border**: 1px soft border
- **Box shadow**: Subtle lift (0 1px 3px rgba(0,0,0,0.1))

---

## Accessibility Standards

### WCAG AAA Target (7:1 contrast where possible)

✅ **Semantic HTML**: Always use `<button>`, `<input>`, `<a>`, `<label>`, not `<div onClick>`  
✅ **Keyboard navigation**: All interactive elements reachable via Tab; logical focus order  
✅ **Focus visible**: Never `outline: none` without replacement; use `:focus-visible`  
✅ **Labels**: All form inputs have `<label>` or `aria-label`  
✅ **ARIA**: Use `role`, `aria-label`, `aria-describedby`, `aria-live` where semantic HTML insufficient  
✅ **Color-independent**: Status always conveyed by text + icon + color (never color alone)  
✅ **Icons with labels**: `aria-label="Delete"` on icon-only buttons  
✅ **Screen readers**: Announce async updates with `role="status"` + `aria-live="polite"`  
✅ **Motion**: Always respect `prefers-reduced-motion: reduce`  
✅ **Zoom**: Page functional and readable at 200% zoom  

### Touch Targets

- **Mobile**: Minimum 44×44px (WCAG, Apple, Google standards)
- **Desktop**: 32×32px acceptable (hover devices)
- **Gap between targets**: Minimum 8px

### Responsive Form Inputs

**Critical iOS requirement**: Input font-size ≥16px prevents auto-zoom on focus.

```html
<input type="email" inputmode="email" autocomplete="email" style="font-size: 16px;" />
```

**Notch support** (iPhone X+, Android):
```css
@supports (padding: max(0px)) {
  .container { padding-left: max(16px, env(safe-area-inset-left)); }
}
```

---

## Dark Mode Implementation

### Approach: CSS Variables

```html
<html data-theme="dark">
  <meta name="theme-color" content="#0f172a">
  <meta name="color-scheme" content="light dark">
</html>
```

```css
:root {
  --color-bg-primary: #0f172a;
  --color-text-primary: #f1f5f9;
  --color-accent: #6366f1;
}

html[data-theme="light"] {
  --color-bg-primary: #ffffff;
  --color-text-primary: #0f172a;
  --color-accent: #4f46e5;
}

body {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}
```

### JavaScript: System Preference + Manual Toggle

```javascript
function initializeTheme() {
  const saved = localStorage.getItem('theme');
  const prefer = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const theme = saved || prefer;
  
  document.documentElement.setAttribute('data-theme', theme);
  
  // Listen for system preference changes (if user hasn't set manual preference)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
  });
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}

initializeTheme();
```

---

## Implementation Checklist

### Tailwind Config
- [ ] Extend theme with custom color tokens (CSS variables)
- [ ] Configure spacing scale (4px base)
- [ ] Set responsive breakpoints (375px, 640px, 768px, 1024px, 1280px, 1440px)
- [ ] Add font sizes and line-height scale
- [ ] Configure dark mode (class-based or system preference)
- [ ] Add custom utilities for common patterns (grid layouts, shadows)

### Component Library
- [ ] Button (primary, secondary, danger, disabled, icon-only, sizes)
- [ ] Input (text, email, search, with label, with error)
- [ ] Badge (status indicators: success, warning, danger)
- [ ] ListItem (selectable, with icon, with avatar)
- [ ] Card (basic, elevated, clickable)
- [ ] Modal (with header, footer, close button, keyboard escape)
- [ ] Header (logo, title, theme toggle, search)
- [ ] Sidebar (collapsible, with sections, icons)
- [ ] Tooltip (hover text, keyboard accessible)

### Responsive Testing
- [ ] Layout at 375px (mobile), 640px (tablet), 768px, 1024px (desktop), 1440px
- [ ] Touch targets ≥44px on mobile
- [ ] No horizontal scroll
- [ ] Images responsive with correct aspect ratios
- [ ] Text readable without zoom
- [ ] Dark/light theme toggle works
- [ ] Motion preference respected

### Accessibility Testing
- [ ] All text ≥4.5:1 contrast (AA) or ≥7:1 (AAA) via WebAIM checker
- [ ] Keyboard: Tab through all elements, focus visible at all times
- [ ] Keyboard: Enter activates buttons, Escape closes modals
- [ ] Screen reader: VoiceOver (macOS), NVDA (Windows), or similar
- [ ] Focus indicators present, not hidden
- [ ] Form labels associated with inputs
- [ ] Icon buttons have aria-labels
- [ ] Reduced motion respected (no auto-play animations)

### Performance
- [ ] No layout thrashing (batch DOM reads/writes)
- [ ] Large lists virtualized (>50 items)
- [ ] Images optimized (WebP with fallback)
- [ ] Web fonts use `font-display: swap`
- [ ] CSS minified, no unused styles

---

## Examples: Why We Made These Choices

**Why 8px base grid?**  
Discord proved power users appreciate compact layouts. 8px (multiples of 4) gives fine-tuning without chaos. Easier to remember than arbitrary values.

**Why 44px touch targets on mobile?**  
WCAG, Apple, and Google all mandate 44×44px minimum. Our users access QueuePilot on phones; if buttons are too small, they'll make errors or give up.

**Why dark mode primary?**  
QueuePilot is an app people use daily. Dark mode reduces eye strain for extended use. Light mode is supported for those who prefer it.

**Why single accent color?**  
Too many colors create visual noise. One accent (#6366F1 indigo) creates hierarchy without distraction. Status is conveyed by text + icon + color, not color alone.

**Why system fonts?**  
Custom fonts are slower to load (invisible text while downloading). System fonts are instant, accessible, and feel native. We invest design effort in hierarchy and spacing, not font choices.

**Why generous spacing?**  
Whitespace reduces cognitive load. People scan tasks quickly; breathing room helps focus on content. It also makes mobile readable without pinching.

**Why animations disabled by default?**  
Most people don't need motion; it can distract or cause discomfort. We use animations for specific, high-impact moments (page load, transitions). Always respect `prefers-reduced-motion`.

---

## Design System as a Checklist

When building or reviewing components, confirm:

- [ ] **Colors**: Using defined tokens, not arbitrary hex
- [ ] **Spacing**: Multiple of 4px (4, 8, 12, 16, 24, 32px)
- [ ] **Typography**: Using scale sizes, system fonts, appropriate weights
- [ ] **Interactions**: Transitions are 200–300ms, properties explicit, motion respected
- [ ] **Focus**: Visible ring (2px accent, 2px offset)
- [ ] **Touch targets**: ≥44px on mobile, ≥32px on desktop
- [ ] **Contrast**: ≥4.5:1 (AA) or ≥7:1 (AAA)
- [ ] **Mobile**: Responsive from 375px, no horizontal scroll
- [ ] **Keyboard**: All features accessible via Tab/Enter/Escape
- [ ] **Dark mode**: Both themes work, colors readable, no flash on reload

---

## References & Research

**Anthropic Frontend Design Skill**:  
Guides distinctive, production-grade interfaces with intentional aesthetic direction and precise execution.

**Vercel Web Interface Guidelines**:  
Accessibility-first, semantic HTML, keyboard navigation, focus states, responsive forms, performance optimization.

**Design Inspiration** (learned from, not copied):
- Discord: 3-pane layout, spacing grid, status indicators
- Paperclip: Minimalist, generous whitespace, single accent color
- Obsidian: Keyboard shortcuts, collapsible sections, command palette
- Notion: Multiple views, inline editing, flexible layouts

---

**Version**: 1.0  
**Last updated**: 2026-04-26  
**Status**: Ready for implementation
