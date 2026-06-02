import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
export type TimerState = {
  isRunning: boolean;
  isPaused: boolean;
  remainingSeconds: number;
  durationSeconds: number;
  associatedTaskId: string | null;
  progress: number; // 0..1
};

type TimerActions = {
  start: (durationSec: number, taskId?: string) => void;
  pause: () => void;
  resume: () => void;
  abandon: () => void;
};

type TimerContextValue = TimerState & TimerActions;

/* ------------------------------------------------------------------ */
/* Context                                                             */
/* ------------------------------------------------------------------ */
const TimerContext = createContext<TimerContextValue | null>(null);

const DEFAULT_DURATION = 25 * 60; // 25 minutes

export function TimerProvider({ children }: { children: ReactNode }) {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(DEFAULT_DURATION);
  const [durationSeconds, setDurationSeconds] = useState(DEFAULT_DURATION);
  const [associatedTaskId, setAssociatedTaskId] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hiddenAtRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Manage the countdown interval
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            // Timer completed — the "running → stopped" transition is detected below
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [isRunning, isPaused, clearTimer]);

  // Detect completion: when remaining hits 0 while running, stop the timer
  useEffect(() => {
    if (isRunning && remainingSeconds <= 0) {
      clearTimer();
      setIsRunning(false);
      setIsPaused(false);
    }
  }, [isRunning, remainingSeconds, clearTimer]);

  // Page Visibility API — correct timer when returning to tab
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
      } else if (hiddenAtRef.current && isRunning && !isPaused) {
        const elapsed = Math.floor((Date.now() - hiddenAtRef.current) / 1000);
        if (elapsed > 0) {
          setRemainingSeconds((prev) => Math.max(0, prev - elapsed));
        }
        hiddenAtRef.current = null;
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [isRunning, isPaused]);

  const progress =
    durationSeconds > 0
      ? Math.max(0, Math.min(1, remainingSeconds / durationSeconds))
      : 0;

  const start = useCallback(
    (durationSec: number, taskId?: string) => {
      clearTimer();
      const dur = Math.max(60, Math.min(3600, durationSec));
      setDurationSeconds(dur);
      setRemainingSeconds(dur);
      setAssociatedTaskId(taskId ?? null);
      setIsPaused(false);
      setIsRunning(true);
      hiddenAtRef.current = null;
    },
    [clearTimer]
  );

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => {
    setIsPaused(false);
    hiddenAtRef.current = null;
  }, []);

  const abandon = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    setIsPaused(false);
    setRemainingSeconds(durationSeconds);
    setAssociatedTaskId(null);
  }, [clearTimer, durationSeconds]);

  const value: TimerContextValue = {
    isRunning,
    isPaused,
    remainingSeconds,
    durationSeconds,
    associatedTaskId,
    progress,
    start,
    pause,
    resume,
    abandon,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */
export function useTimer(): TimerContextValue {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used within TimerProvider");
  return ctx;
}

/**
 * Calls `callback` once when the timer transitions from running→completed.
 * Use this to record stats, show notifications, etc.
 */
export function useOnTimerComplete(callback: () => void) {
  const { isRunning, remainingSeconds } = useTimer();
  const wasRunningRef = useRef(isRunning);

  useEffect(() => {
    const wasRunning = wasRunningRef.current;
    wasRunningRef.current = isRunning;

    // Transition: was running → now stopped AND remaining is 0 = completed
    if (wasRunning && !isRunning && remainingSeconds === 0) {
      callback();
    }
  }, [isRunning, remainingSeconds, callback]);
}
