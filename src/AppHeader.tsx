import { BarChart3, CheckCircle2, LayoutList, Columns3, Moon, Notebook, Sun } from "lucide-react";
import type { Theme, ViewMode } from "./types";

type AppHeaderProps = {
  theme: Theme;
  currentView: ViewMode;
  taskViewMode: "list" | "kanban";
  onChangeTaskViewMode: (mode: "list" | "kanban") => void;
  onToggleTheme: () => void;
  onSwitchView: (view: ViewMode) => void;
  onOpenStats: () => void;
};

export default function AppHeader({
  theme,
  currentView,
  taskViewMode,
  onChangeTaskViewMode,
  onToggleTheme,
  onSwitchView,
  onOpenStats,
}: AppHeaderProps) {
  return (
    <div className="header-bar">
      <button
        className="theme-toggle"
        type="button"
        onClick={onToggleTheme}
        title={theme === "light" ? "切换到深色模式" : "切换到浅色模式"}
      >
        {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
        {theme === "light" ? "深色模式" : "浅色模式"}
      </button>
      <button
        className="stats-toggle"
        type="button"
        onClick={onOpenStats}
        title="每日统计"
      >
        <BarChart3 size={17} />
      </button>
      {currentView === "tasks" && (
        <>
          <div className="view-tabs">
            <button
              className={`view-tab ${taskViewMode === "list" ? "is-active" : ""}`}
              type="button"
              onClick={() => onChangeTaskViewMode("list")}
              title="列表视图"
            >
              <LayoutList size={15} />
              列表
            </button>
            <button
              className={`view-tab ${taskViewMode === "kanban" ? "is-active" : ""}`}
              type="button"
              onClick={() => onChangeTaskViewMode("kanban")}
              title="看板视图"
            >
              <Columns3 size={15} />
              看板
            </button>
          </div>
          <button
            className="notebook-toggle"
            type="button"
            onClick={() => onSwitchView("notebook")}
            title="打开笔记本"
          >
            <Notebook size={17} />
            笔记本
          </button>
        </>
      )}
      {currentView === "notebook" && (
        <button
          className="notebook-toggle"
          type="button"
          onClick={() => onSwitchView("tasks")}
          title="返回任务清单"
        >
          <CheckCircle2 size={17} />
          任务清单
        </button>
      )}
    </div>
  );
}
