import { motion } from "framer-motion";
import { useTimer } from "./TimerContext";
import { useReducedMotion } from "./useReducedMotion";

export default function TimerBar() {
  const { isRunning, isPaused, progress, durationSeconds, remainingSeconds } = useTimer();
  const shouldReduce = useReducedMotion();

  if (!isRunning && !isPaused) return null;
  if (remainingSeconds <= 0 && !isRunning) return null;

  const pct = Math.round(progress * 100);
  const fillPct = 100 - pct; // bar shrinks from left to right

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeLabel = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="timer-bar">
      <motion.div
        className={`timer-bar-fill ${isPaused ? "is-paused" : "is-running"}`}
        style={{ width: `${fillPct}%` }}
        animate={{ width: `${fillPct}%` }}
        transition={shouldReduce ? { duration: 0 } : { type: "spring", stiffness: 100, damping: 20 }}
      />
      <span className="timer-bar-label">{timeLabel}</span>
    </div>
  );
}
