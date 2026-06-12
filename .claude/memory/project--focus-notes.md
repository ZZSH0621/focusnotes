---
name: project--focus-notes
description: "Focus Notes 2.0 — full project map: tech stack, architecture decisions, file structure, and all 6 feature implementations"
metadata:
  type: project
  ai_priority: reusable
  ai_tags: [architecture-decision, copy-paste]
  tags: [react, tauri, framer-motion, dnd-kit, indexeddb, pomodoro]
---

# Focus Notes 2.0 — Project Knowledge Base

## Tech Stack
- React 18.3 + TypeScript 5.6 + Vite 5.4
- Tauri v2 (Rust shell for desktop)
- framer-motion ^11 (physics animations)
- @dnd-kit/core ^6 + sortable ^8 (drag-and-drop)
- lucide-react ^0.468 (icons)
- CSS custom properties (no framework)
- localStorage (tasks/themes) + IndexedDB (media + stats)
- No router, no state lib, no CSS-in-JS

## File Map (17 source files, flat src/)
```
src/
├── main.tsx                 # Entry: ErrorBoundary > TimerProvider > App
├── App.tsx                  # ~800 lines — orchestrator, all CRUD logic
├── types.ts                 # Shared: Task, Priority, createId(), formatDate()
├── AppHeader.tsx            # Header: theme, view tabs, stats toggle
├── LaunchScreen.tsx          # F1: staggered fade-in, 1.2s, click-to-skip
├── useReducedMotion.ts      # F2: prefers-reduced-motion gate
├── AnimatedTaskRow.tsx       # F2: spring card wrapper + Confetti trigger
├── Confetti.tsx              # F2: 16-particle burst on task complete
├── TaskKanbanView.tsx        # F3: DndContext + useDroppable columns
├── TimerContext.tsx           # F4: setInterval timer + Page Visibility
├── TimerBar.tsx              # F4: 3px progress bar in header
├── FocusTimer.tsx            # F4: floating panel + SVG ring + presets
├── statsDb.ts               # F5: IndexedDB "focus-notes-stats" / daily store
├── useStats.ts              # F5: hook for reading + incrementing stats
├── StatsPanel.tsx            # F5: slide-out panel with ring + trend bars
├── QuickCapture.tsx          # F6: floating input overlay + global shortcut
├── db.ts                    # Pre-existing: IndexedDB for media blobs
├── mediaStore.ts             # Pre-existing: media persistence layer
└── styles.css                # ~2600 lines, single file, custom properties
```

## Key Architecture Decisions
See: [[decision--component-extraction]], [[decision--framer-over-css]], [[decision--kanban-droppable]], [[decision--timer-context]], [[decision--indexeddb-stats]]

## All 6 Features
| # | Feature | Key Files | Pattern |
|---|---------|-----------|---------|
| 1 | Launch Screen | LaunchScreen.tsx | [[pattern--staggered-animation]] |
| 2 | Physics Animations | AnimatedTaskRow, Confetti, useReducedMotion | [[pattern--spring-animation]] |
| 3 | Kanban DnD | TaskKanbanView | [[pattern--kanban-dnd-kit]] |
| 4 | Focus Timer | TimerContext, TimerBar, FocusTimer | [[pattern--timer-context]] |
| 5 | Daily Stats | statsDb, useStats, StatsPanel | [[pattern--indexeddb-stats]] |
| 6 | Quick Capture | QuickCapture | [[pattern--global-shortcut]] |

## Git History
```
0028327 Feature 5: Daily progress statistics
0e43db9 Fix: kanban drag-and-drop between columns
2282cec Feature 6: Global quick capture
db753ac Feature 5: Daily progress stats
5404bfa Feature 4: Focus timer (Pomodoro)
6bcc2c0 Feature 3: Kanban drag-and-drop view
f478ab3 Phase 1: types extraction, launch screen, physics animations
cd577ad v1.0 baseline - Focus Notes initial version
```

## Rollback
`cd577ad` is the v1.0 baseline. `git checkout cd577ad` to return to pre-2.0 state.
