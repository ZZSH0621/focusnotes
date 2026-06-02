import { CheckCircle2, Moon, Notebook, Sun } from "lucide-react";
import type { Theme, ViewMode } from "./types";

type AppHeaderProps = {
  theme: Theme;
  currentView: ViewMode;
  onToggleTheme: () => void;
  onSwitchView: (view: ViewMode) => void;
};

export default function AppHeader({ theme, currentView, onToggleTheme, onSwitchView }: AppHeaderProps) {
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
      {currentView === "tasks" && (
        <button
          className="notebook-toggle"
          type="button"
          onClick={() => onSwitchView("notebook")}
          title="打开笔记本"
        >
          <Notebook size={17} />
          笔记本
        </button>
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
