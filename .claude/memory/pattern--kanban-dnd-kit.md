---
name: pattern--kanban-dnd-kit
description: "Reusable pattern: @dnd-kit cross-column drag-and-drop with useDroppable columns, PointerSensor 5px threshold, and rectIntersection collision"
metadata:
  type: pattern
  ai_priority: fragile
  ai_tags: [gotcha, copy-paste]
  tags: [dnd-kit, drag-and-drop, kanban, react]
---

# Pattern: Cross-Column Kanban Drag-and-Drop with @dnd-kit

## When to reuse
Any UI where items need to be dragged between distinct zones (columns, categories, statuses).

## Critical gotcha (the bug we hit)
**Columns MUST use `useDroppable`** — without it, empty columns and gaps between cards have no drop target. The system can't detect where you're dropping.

## Architecture

### Component tree
```
TaskKanbanView (DndContext + sensors + collisionDetection)
├── Column "active" (useDroppable id="column-active")
│   └── SortableContext (verticalListSortingStrategy)
│       └── SortableCard[] (useSortable per task)
└── Column "completed" (useDroppable id="column-completed")
    └── SortableContext
        └── SortableCard[]
DragOverlay (renders a clone of dragged card)
```

### Sensor: 5px threshold prevents accidental drag
```tsx
useSensor(PointerSensor, {
  activationConstraint: { distance: 5 },
})
```

### Collision: rectIntersection (not closestCenter)
`closestCenter` only detects other sortable items. `rectIntersection` also detects droppable zones, so dropping on empty column space works.

### Column ID resolution (getColumnFromId helper)
```tsx
function getColumnFromId(id, activeIds, completedIds) {
  if (id.startsWith("column-")) return id === "column-active" ? "active" : "completed";
  if (activeIds.includes(id)) return "active";
  if (completedIds.includes(id)) return "completed";
  return null;
}
```
Handles three id types: droppable column IDs, sortable item IDs in active, sortable item IDs in completed.

### DragEnd logic
```tsx
const sourceCol = getColumnFromId(draggedId, ...);
const targetCol = getColumnFromId(overId, ...);
if (sourceCol && targetCol && sourceCol !== targetCol) {
  onToggleComplete(draggedId); // cross-column = toggle status
}
```

### DragOverlay: card follow effect
`DragOverlay` renders a styled clone of the dragged card. The original card gets `opacity: 0.4` via `isDragging` from `useSortable`.

### Column highlight
Dual-source: `isOver` from parent's dragOver handler + `isDroppableOver` from `useDroppable`. Union of both controls the `drop-target` CSS class.

## Files
- `src/TaskKanbanView.tsx`
- `src/styles.css` (`.kanban-*` selectors)

## Dependencies
- `@dnd-kit/core` ^6 — DndContext, PointerSensor, useDroppable, DragOverlay
- `@dnd-kit/sortable` ^8 — SortableContext, useSortable
- `@dnd-kit/utilities` ^3 — CSS.Transform.toString
