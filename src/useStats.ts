import { useEffect, useState, useCallback } from "react";
import { getTodayStats, getHistory, incrementStat, type DailyStats } from "./statsDb";

export function useStats() {
  const [todayStats, setTodayStats] = useState<DailyStats | null>(null);
  const [history, setHistory] = useState<DailyStats[]>([]);

  const refresh = useCallback(async () => {
    try {
      const [today, hist] = await Promise.all([
        getTodayStats(),
        getHistory(7),
      ]);
      setTodayStats(today);
      setHistory(hist);
    } catch (err) {
      console.error("[Stats] Failed to load:", err);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const recordTaskCreated = useCallback(() => {
    incrementStat("totalTasksCreated").then(refresh).catch(console.error);
  }, [refresh]);

  const recordTaskCompleted = useCallback(() => {
    incrementStat("completedTasks").then(refresh).catch(console.error);
  }, [refresh]);

  const recordTaskUncompleted = useCallback(() => {
    incrementStat("completedTasks", -1).then(refresh).catch(console.error);
  }, [refresh]);

  const recordTomato = useCallback((focusMinutes: number) => {
    Promise.all([
      incrementStat("tomatoes"),
      incrementStat("focusMinutes", focusMinutes),
    ]).then(refresh).catch(console.error);
  }, [refresh]);

  return {
    todayStats,
    history,
    isLoading: !todayStats,
    refresh,
    recordTaskCreated,
    recordTaskCompleted,
    recordTaskUncompleted,
    recordTomato,
  };
}
