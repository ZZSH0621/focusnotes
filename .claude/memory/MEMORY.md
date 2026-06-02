# Focus Notes — AI Memory Index

> **How I read this:** Each session starts here. Priority labels tell me what to load first.
> **Media:** Screenshots/diagrams referenced in entries live in `../../media/memory/` (gitignored).

## ⚠️ Fragile — read before touching related code
*These will break silently if forgotten.*

- [Tauri Video Black Screen Fix](tauri-video-black-screen-fix.md) — `gotcha` `blocking-bug` — WebView2 + Tauri SDK static import causes black screen
- [Kanban DnD Pattern](pattern--kanban-dnd-kit.md) — `gotcha` `copy-paste` — Columns MUST use `useDroppable` or drag silently fails

## ♻️ Reusable — patterns transferable to other projects
*High signal-to-noise. Lift these directly.*

- [Spring Animation Pattern](pattern--spring-animation.md) — `copy-paste` `architecture-decision` — framer-motion spring + confetti + reduced motion
- [Timer Context Pattern](pattern--timer-context.md) — `copy-paste` `architecture-decision` — setInterval + Page Visibility + completion detection
- [IndexedDB Stats Pattern](pattern--indexeddb-stats.md) — `copy-paste` — Separate DB, date-keyed, transaction upsert
- [Focus Notes Project Map](project--focus-notes.md) — `architecture-decision` `copy-paste` — Tech stack, file map, git history, all 6 features
- [AI Memory System Design](system--ai-memory-design.md) — `architecture-decision` — The design of this memory system itself

## 📍 Contextual — this project only
*Good to know, not essential.*

- [Decision: Flat src/](decision--component-extraction.md) — Why no nested folders at 17 files
- [Decision: framer-motion](decision--framer-over-css.md) — Why framer-motion over CSS for physics
- [Session: 2026-06-02 v2.0 Build](session--2026-06-02-v2.md) — 9 commits, 11 new files, full implementation log
- [Netlify Deployment](deployment-netlify.md) — Web deploy URL and credentials
