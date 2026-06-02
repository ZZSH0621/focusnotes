---
name: pattern--spring-animation
description: "Reusable pattern: framer-motion spring animations for task CRUD, confetti on complete, micro-interactions, and reduced-motion gating"
metadata:
  type: pattern
  tags: [framer-motion, animation, accessibility, css]
---

# Pattern: Task Card Physics Animation with framer-motion

## When to reuse
Any React list where items need spring-based enter/exit transitions, completion effects, and accessibility gating.

## Core mechanism

### 1. Spring enter/exit (AnimatedTaskRow.tsx)
```tsx
const springTransition = {
  type: "spring", stiffness: 300, damping: 25, mass: 0.8
};

<motion.article
  layout                          // auto-animate position changes
  initial={{ opacity: 0, x: -80, scale: 0.95 }}
  animate={{ opacity: 1, x: 0, scale: 1 }}
  exit={{ opacity: 0, x: 200, scale: 0.9, transition: exitSpring }}
  transition={springTransition}
>
```
- `layout` prop is key: handles reordering without manual position calculation
- `AnimatePresence mode="popLayout"` on parent: waits for exit animation before removing
- New items get different `initial` (further offset) vs existing (subtle)

### 2. Confetti burst (Confetti.tsx)
- 16 particles, 4px each, absolute positioned at complete button coordinates
- Random x/y/rotation/scale via `useState` + `useCallback` generation
- `AnimatePresence` auto-unmounts after 800ms
- Gated behind `useReducedMotion()` — returns null if user prefers reduced motion

### 3. Micro-interactions (CSS, not framer-motion)
- Button hover/active: CSS `transition: transform 120ms` + `:active { scale(0.97) }`
- Priority badge: `transition: background-color 200ms, color 200ms`
- Complete button: `transition: transform 150ms` + `:active { scale(0.9) }`
- **Why CSS not framer-motion for these**: hundreds of elements, framer-motion per-element overhead not worth it

### 4. Reduced motion gate (useReducedMotion.ts)
```tsx
const shouldReduce = useReducedMotion();
// uses framer-motion's built-in useReducedMotion() + raw matchMedia fallback
// all animation components check this first — return static element if true
```
CSS backup: `@media (prefers-reduced-motion: reduce)` sets all `animation-duration: 0.01ms !important`

## Files
- `src/AnimatedTaskRow.tsx`
- `src/Confetti.tsx`
- `src/useReducedMotion.ts`
- `src/styles.css` (reduced-motion media query + micro-interaction CSS)

## Key numbers
- Spring: stiffness=300, damping=25, mass=0.8
- Exit spring: stiffness=250, damping=22, mass=0.6
- New task marker: cleared after 1500ms timeout
- Confetti: 16 particles, 550+random*350ms duration, 800ms cleanup timeout
