---
name: decision--framer-over-css
description: "Why framer-motion was chosen over CSS animations for Focus Notes 2.0 physics effects"
metadata:
  type: decision
  tags: [framer-motion, animation, css, dependency]
---

# Decision: framer-motion vs CSS Animations

## Context
PRD requires spring animations (stiffness 300, damping 25), staggered sequences, exit animations, confetti particles, and drag follow effects. Two options: extend existing CSS keyframes or add framer-motion.

## Decision: framer-motion (~30KB gzipped)

## Rationale
| Requirement | CSS Only | framer-motion |
|-------------|----------|---------------|
| Spring physics | Not possible (only cubic-bezier) | `type: "spring"` with stiffness/damping |
| Exit animations | Requires JS to delay unmount | `AnimatePresence` handles lifecycle |
| Stagger children | Manual `animation-delay` calc | `staggerChildren: 0.15` |
| Layout animation | CSS `transition` on all properties | `layout` prop auto-animates position |
| Drag follow | N/A | `DragOverlay` + `whileDrag` |

CSS was sufficient for the v1.0 slide-in animation. But 4 of 5 animation requirements in v2.0 are impossible in pure CSS (spring physics, exit animations, layout reorder, stagger orchestration).

## Trade-off accepted
- +30KB gzipped bundle
- One new dependency to manage
- Worth it vs ~800 lines of custom JS animation infrastructure

## What stays CSS
- Button hover/active micro-interactions (too many elements for per-element framer-motion overhead)
- Color transitions (CSS `transition` is simpler and sufficient)
- Reduced motion media query (applies globally)
