export type Priority = "high" | "medium" | "low";
export type SortMode = "created-desc" | "created-asc" | "priority";
export type FilterMode = "all" | "active" | "completed" | "trash";
export type Theme = "light" | "dark";
export type ViewMode = "tasks" | "notebook";

export type NotebookPage = {
  id: string;
  title: string;
  content: string;
  images: string[];
  audio: string[];
  video: string[];
  createdAt: string;
};

export type Task = {
  id: string;
  title: string;
  note: string;
  priority: Priority;
  completed: boolean;
  createdAt: string;
  deletedAt?: string;
};

export const STORAGE_KEY = "focus-notes.tasks";
export const THEME_KEY = "focus-notes.theme";
export const NOTEBOOK_KEY = "focus-notes.notebook";

export const priorityMeta: Record<Priority, { label: string; rank: number }> = {
  high: { label: "高", rank: 3 },
  medium: { label: "中", rank: 2 },
  low: { label: "低", rank: 1 },
};

export const filters: Array<{ value: FilterMode; label: string }> = [
  { value: "all", label: "全部" },
  { value: "active", label: "进行中" },
  { value: "completed", label: "已完成" },
  { value: "trash", label: "回收站" },
];

export function createId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
