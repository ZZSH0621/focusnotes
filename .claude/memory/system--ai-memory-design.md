---
name: system--ai-memory-design
description: "The design rationale and usage guide for Focus Notes' AI-native memory system — priority labels, multimodal storage, and indexing strategy"
metadata:
  type: reference
  ai_priority: reusable
  ai_tags: [architecture-decision]
  tags: [memory, ai-native, multimodal, knowledge-management]
---

# AI Memory System Design

## Why this exists
Human task managers (like Focus Notes) optimize for: urgency, deadlines, visual scanning.
AI knowledge systems optimize for: **reuse frequency, fragility, searchability, decision weight**.

Same data shape, different taxonomy.

## AI Priority Labels (replacing human 高/中/低)

| Label | Meaning | When to use |
|-------|---------|-------------|
| **fragile** | This will break silently if forgotten. Read before touching related code. | Blocking bugs, non-obvious gotchas, environment-specific quirks |
| **reusable** | This pattern applies across projects. High signal-to-noise. | Animation patterns, API patterns, architectural decisions |
| **contextual** | Only relevant within this project. | Session logs, deployment URLs, one-off configs |

## AI Tags (search dimensions beyond priority)

| Tag | Meaning |
|-----|---------|
| `gotcha` | Non-obvious pitfall that cost significant debugging time |
| `blocking-bug` | Showstopper — blocked progress until resolved |
| `architecture-decision` | A tradeoff was made here with explicit rationale |
| `copy-paste` | This code pattern can be lifted directly into new contexts |
| `visual-required` | This entry has or needs accompanying screenshots/images |

## Multimodal Storage

Images, screenshots, and diagrams referenced in memory files live in:
```
media/memory/    ← gitignored (don't bloat repo with binaries)
```

Memory files reference them via relative paths:
```markdown
![Kanban drop target highlighting](../../media/memory/kanban-drop-highlight.png)
```

I (Claude) can read PNG/JPG files via the Read tool, so visual context is accessible.

For screen recordings (bugs, interactions), store as MP4 in `media/memory/` and reference similarly.

## Index Format (MEMORY.md)

The index now groups entries by AI priority:

```markdown
## ⚠️ Fragile — read before touching related code
- [Tauri Video Black Screen Fix](tauri-video-black-screen-fix.md) — gotcha, blocking-bug
- [Kanban DnD Pattern](pattern--kanban-dnd-kit.md) — gotcha, copy-paste

## ♻️ Reusable — cross-project patterns
- [Spring Animation](pattern--spring-animation.md) — copy-paste
- [Timer Context](pattern--timer-context.md) — copy-paste, architecture-decision
- [IndexedDB Stats](pattern--indexeddb-stats.md) — copy-paste
- [Project Map](project--focus-notes.md) — architecture-decision

## 📍 Contextual — this project only
- [Flat src/ Decision](decision--component-extraction.md)
- [framer-motion Decision](decision--framer-over-css.md)
- [Session 2026-06-02](session--2026-06-02-v2.md)
- [Netlify Deployment](deployment-netlify.md)
```

## File naming convention
```
{type}--{slug}.md

type: project | pattern | decision | session | reference | system
slug: kebab-case, descriptive
```

Examples:
- `project--focus-notes.md`
- `pattern--kanban-dnd-kit.md`
- `decision--framer-over-css.md`
- `session--2026-06-02-v2.md`
