import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, CheckCircle2, Clock3, TrendingUp, X } from "lucide-react";
import { useStats } from "./useStats";
import { useReducedMotion } from "./useReducedMotion";
import type { DailyStats } from "./statsDb";

type StatsPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function StatsPanel({ isOpen, onClose }: StatsPanelProps) {
  const { todayStats, history, isLoading } = useStats();
  const shouldReduce = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="stats-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            className="stats-panel"
            initial={shouldReduce ? {} : { x: "100%" }}
            animate={{ x: 0 }}
            exit={shouldReduce ? {} : { x: "100%" }}
            transition={shouldReduce ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="stats-panel-header">
              <h2>
                <BarChart3 size={20} />
                每日统计
              </h2>
              <button className="icon-button" type="button" onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            {isLoading || !todayStats ? (
              <div className="stats-loading">加载中...</div>
            ) : (
              <div className="stats-content">
                {/* Date */}
                <p className="stats-date">{todayStats.date}</p>

                {/* Completion ring */}
                <StatsRing today={todayStats} />

                {/* Detail cards */}
                <div className="stats-cards">
                  <StatCard
                    icon={<CheckCircle2 size={18} />}
                    label="完成任务"
                    value={todayStats.completedTasks}
                    sub={`共创建 ${todayStats.totalTasksCreated} 个`}
                  />
                  <StatCard
                    icon={<Clock3 size={18} />}
                    label="专注时长"
                    value={`${Math.floor(todayStats.focusMinutes / 60)}h ${todayStats.focusMinutes % 60}m`}
                    sub={`${todayStats.tomatoes} 个番茄`}
                  />
                </div>

                {/* 7-day trend */}
                {history.length > 0 && (
                  <div className="stats-trend">
                    <h4>
                      <TrendingUp size={16} />
                      7 天趋势
                    </h4>
                    <div className="trend-bars">
                      {history.map((day) => {
                        const rate =
                          day.totalTasksCreated > 0
                            ? Math.round((day.completedTasks / day.totalTasksCreated) * 100)
                            : 0;
                        return (
                          <div key={day.date} className="trend-bar-item" title={day.date}>
                            <div
                              className="trend-bar-fill"
                              style={{ height: `${Math.max(4, rate)}%` }}
                            />
                            <span className="trend-bar-label">
                              {day.date.slice(5)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* Completion Ring                                                     */
/* ------------------------------------------------------------------ */
function StatsRing({ today }: { today: DailyStats }) {
  const circumference = 2 * Math.PI * 46;
  const rate =
    today.totalTasksCreated > 0
      ? Math.min(1, today.completedTasks / today.totalTasksCreated)
      : 0;
  const offset = circumference * (1 - rate);

  return (
    <div className="stats-ring-container">
      <svg viewBox="0 0 120 120" className="stats-ring">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-accent)" />
            <stop offset="100%" stopColor="var(--color-priority-low)" />
          </linearGradient>
        </defs>
        <circle
          cx="60" cy="60" r="46"
          fill="none"
          stroke="var(--color-border-light)"
          strokeWidth="8"
        />
        <circle
          cx="60" cy="60" r="46"
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset 500ms ease" }}
        />
      </svg>
      <div className="stats-ring-center">
        <span className="ring-rate">{Math.round(rate * 100)}%</span>
        <span className="ring-sub">完成率</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stat Card                                                           */
/* ------------------------------------------------------------------ */
function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-body">
        <span className="stat-card-label">{label}</span>
        <span className="stat-card-value">{value}</span>
        <span className="stat-card-sub">{sub}</span>
      </div>
    </div>
  );
}
