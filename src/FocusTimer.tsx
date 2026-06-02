import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock3, Pause, Play, Square, Timer, X } from "lucide-react";
import { useTimer } from "./TimerContext";
import { useReducedMotion } from "./useReducedMotion";

const PRESETS = [15, 25, 30, 45, 60];

export default function FocusTimer() {
  const {
    isRunning,
    isPaused,
    remainingSeconds,
    durationSeconds,
    progress,
    start,
    pause,
    resume,
    abandon,
  } = useTimer();

  const shouldReduce = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [customDuration, setCustomDuration] = useState(25);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const display = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const totalMin = Math.round(durationSeconds / 60);

  function handleStart() {
    start(customDuration * 60);
    setIsOpen(false);
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        className={`focus-timer-trigger ${isRunning ? "is-active" : ""}`}
        type="button"
        title={isRunning ? `专注中 — ${display}` : "开启专注计时"}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Timer size={18} />
        {isRunning && <span className="trigger-time">{display}</span>}
      </button>

      {/* Timer panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="focus-timer-panel"
            initial={shouldReduce ? {} : { opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduce ? {} : { opacity: 0, y: -8, scale: 0.95 }}
            transition={shouldReduce ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="timer-panel-header">
              <h3>
                <Clock3 size={18} />
                专注计时
              </h3>
              <button
                className="icon-button"
                type="button"
                onClick={() => setIsOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            {isRunning ? (
              <div className="timer-running">
                <div className="timer-display">{display}</div>
                <div className="timer-progress-ring">
                  <svg viewBox="0 0 100 100" className="progress-ring">
                    <circle
                      className="ring-bg"
                      cx="50" cy="50" r="42"
                      fill="none"
                      stroke="var(--color-border-light)"
                      strokeWidth="6"
                    />
                    <circle
                      className="ring-fill"
                      cx="50" cy="50" r="42"
                      fill="none"
                      stroke="var(--color-accent)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      strokeDashoffset={`${2 * Math.PI * 42 * progress}`}
                      transform="rotate(-90 50 50)"
                      style={{ transition: "stroke-dashoffset 300ms ease" }}
                    />
                  </svg>
                  <div className="ring-label">共 {totalMin} 分钟</div>
                </div>
                <div className="timer-actions">
                  {isPaused ? (
                    <button className="timer-btn resume" type="button" onClick={resume}>
                      <Play size={18} /> 继续
                    </button>
                  ) : (
                    <button className="timer-btn pause" type="button" onClick={pause}>
                      <Pause size={18} /> 暂停
                    </button>
                  )}
                  <button className="timer-btn abandon" type="button" onClick={abandon}>
                    <Square size={18} /> 放弃
                  </button>
                </div>
              </div>
            ) : (
              <div className="timer-setup">
                <label className="timer-duration-label">选择时长（分钟）</label>
                <div className="timer-presets">
                  {PRESETS.map((min) => (
                    <button
                      key={min}
                      className={`preset-btn ${customDuration === min ? "is-active" : ""}`}
                      type="button"
                      onClick={() => setCustomDuration(min)}
                    >
                      {min}
                    </button>
                  ))}
                </div>
                <button className="timer-btn start" type="button" onClick={handleStart}>
                  <Play size={18} /> 开始专注
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Focus overlay — dims everything except the timer bar */}
      <AnimatePresence>
        {isRunning && !isPaused && (
          <motion.div
            className="focus-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
