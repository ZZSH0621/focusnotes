---
name: decision--component-extraction
description: "Why Focus Notes 2.0 uses flat src/ with 17 files instead of nested folders or a component library"
metadata:
  type: decision
  tags: [architecture, react, project-structure]
---

# Decision: Flat src/ Directory (No Nested Folders)

## Context
App.tsx was 1343 lines. Need to extract components for 6 new features. Options: nested folders (`components/tasks/`, `features/timer/`) vs flat `src/`.

## Decision: Flat
All 17 source files in `src/`, no subdirectories (except `src-tauri/` for Rust).

## Rationale
1. **Current scale doesn't justify nesting**: 17 files is a small project. Nested folders at this scale add import path noise without organizational benefit.
2. **Single CSS file pairs with flat structure**: `styles.css` is one file with `/* -- Section -- */` comments. Matching file organization to CSS sections would create phantom structure.
3. **No barrel files needed**: Flat structure means `import X from "./X"` works everywhere. No `index.ts` re-exports to maintain.
4. **Easy to refactor later**: When file count exceeds ~30 or logical groupings emerge (e.g., "all timer files"), nesting can be introduced surgically.

## When to revisit
If the project grows beyond 30 source files or a clear domain boundary emerges (e.g., a separate "notebook" module with its own state).
