---
name: pattern--indexeddb-stats
description: "Reusable pattern: separate IndexedDB database for daily statistics, date-keyed with transaction-based read-modify-write upsert"
metadata:
  type: pattern
  ai_priority: reusable
  ai_tags: [copy-paste]
  tags: [indexeddb, statistics, persistence, typescript]
---

# Pattern: Daily Stats in Separate IndexedDB with Transaction Upsert

## When to reuse
Any app that needs daily-aggregated counters decoupled from main data lifecycle (tasks, settings). Stats survive data resets and have different retention policies.

## Design decisions

### Separate database (not separate store)
```
DB: "focus-notes-stats"    ← stats only, survives localStorage clear
DB: "focus-notes-media"    ← pre-existing, media blobs
```
**Why not same DB, different store?** Different lifecycle. Stats accumulate forever. Media is tied to notebook pages.

### Key: YYYY-MM-DD (local timezone)
```tsx
function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}
```
`keyPath: "date"` in object store creation.

### Schema
```tsx
type DailyStats = {
  date: string;           // "YYYY-MM-DD"
  completedTasks: number;
  totalTasksCreated: number;
  tomatoes: number;
  focusMinutes: number;
};
```

### Transaction-based upsert (read → modify → write in one tx)
```tsx
const tx = db.transaction(STORE_NAME, "readwrite");
const store = tx.objectStore(STORE_NAME);
const getReq = store.get(key);
getReq.onsuccess = () => {
  const existing = getReq.result ?? emptyStats(key);
  existing[field] += amount;
  store.put(existing);
};
```
Single transaction prevents race conditions between read and write.

### Fire-and-forget writes
Stats writes never block UI. Errors are logged but not surfaced:
```tsx
incrementStat("completedTasks").then(refresh).catch(console.error);
```

### History query: reverse cursor → reverse result
```tsx
const cursorReq = store.openCursor(null, "prev"); // newest first
// collect up to `days` entries
// result.reverse() → chronological order
```

## Files
- `src/statsDb.ts` — openStatsDB, getTodayStats, incrementStat, getHistory
- `src/useStats.ts` — React hook: todayStats, history, recordTaskCreated/Completed/Uncompleted/Tomato
- `src/StatsPanel.tsx` — SVG gradient ring + stat cards + 7-day trend bars

## Pattern matches existing code
`statsDb.ts` follows the same openDB → transaction pattern as the pre-existing `db.ts` (media IndexedDB). Same promise wrapping, same error handling idiom.
