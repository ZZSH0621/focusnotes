---
name: pattern--timer-context
description: "Reusable pattern: React Context countdown timer with setInterval, Page Visibility API background correction, and completion detection via useEffect"
metadata:
  type: pattern
  tags: [react, context, timer, setinterval, visibility-api]
---

# Pattern: App-Wide Countdown Timer via React Context

## When to reuse
Any React app needing a single timer that survives view switches, renders in multiple locations (progress bar + control panel), and corrects for background tab time.

## Architecture

### State shape (TimerContext)
```tsx
{ isRunning, isPaused, remainingSeconds, durationSeconds,
  associatedTaskId, progress, start, pause, resume, abandon }
```

### Provider wraps entire app (main.tsx)
```
ErrorBoundary > TimerProvider > App
```
All descendants access via `useTimer()` hook.

### Core loop: setInterval + cleanup in useEffect
```tsx
useEffect(() => {
  if (isRunning && !isPaused) {
    intervalRef.current = setInterval(() => {
      setRemainingSeconds(prev => prev <= 1 ? 0 : prev - 1);
    }, 1000);
  } else {
    clearTimer();
  }
  return clearTimer;
}, [isRunning, isPaused]);
```

### Completion detection (separate useEffect)
```tsx
useEffect(() => {
  if (isRunning && remainingSeconds <= 0) {
    clearTimer();
    setIsRunning(false);
    setIsPaused(false);
  }
}, [isRunning, remainingSeconds]);
```
Then `useOnTimerComplete(callback)` hook detects the running→stopped transition:
```tsx
// wasRunning && !isRunning && remainingSeconds === 0 → fire callback
```

### Page Visibility API correction
```tsx
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    hiddenAtRef.current = Date.now();        // record hide time
  } else if (hiddenAtRef.current && isRunning && !isPaused) {
    const elapsed = Math.floor((Date.now() - hiddenAtRef.current) / 1000);
    setRemainingSeconds(prev => Math.max(0, prev - elapsed));  // deduct
  }
});
```
No Service Worker needed — simple timestamp diff on return.

### Duration clamping
```tsx
const dur = Math.max(60, Math.min(3600, durationSec)); // 1-60 min range
```

## Files
- `src/TimerContext.tsx` — state + provider + hooks
- `src/TimerBar.tsx` — 3px progress bar (uses `progress: 0..1`)
- `src/FocusTimer.tsx` — floating panel with presets + SVG ring + controls

## Integration points in App.tsx
- `useOnTimerComplete(() => stats.recordTomato(timer.durationSeconds / 60))` — records stats on finish
- Timer persists across task/notebook/kanban view switches
- Focus overlay (`pointer-events: none`) dims app during active focus
