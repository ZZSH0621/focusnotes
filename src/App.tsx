import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Circle,
  Clock3,
  Download,
  MessageSquareText,
  Music,
  Notebook,
  PencilLine,
  Plus,
  RotateCcw,
  Save,
  Trash,
  Trash2,
  ImageIcon,
  Video,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { storeMediaFile, resolveMediaUrlSync, hydrateMediaRefs, deleteMediaRef } from "./mediaStore";
import type { Priority, SortMode, FilterMode, Theme, NotebookPage, Task, ViewMode } from "./types";
import { STORAGE_KEY, THEME_KEY, NOTEBOOK_KEY, priorityMeta, filters, createId, formatDate } from "./types";
import AppHeader from "./AppHeader";
import LaunchScreen from "./LaunchScreen";
import AnimatedTaskRow from "./AnimatedTaskRow";
import TaskKanbanView from "./TaskKanbanView";
import TimerBar from "./TimerBar";
import FocusTimer from "./FocusTimer";
import StatsPanel from "./StatsPanel";
import QuickCapture from "./QuickCapture";
import { useStats } from "./useStats";
import { useOnTimerComplete, useTimer } from "./TimerContext";

console.log('[App] Starting Focus Notes...');

// 全局崩溃兜底：React 树之外也能看到错误
let crashOverlay: HTMLDivElement | null = null;
function showCrashOverlay(msg: string) {
  try {
    if (crashOverlay) return;
    crashOverlay = document.createElement('div');
    crashOverlay.style.cssText = 'position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:#1e1c19;color:#e0dcd5;font-family:monospace;padding:40px;';
    crashOverlay.innerHTML = `<div style="max-width:520px;text-align:center"><h2 style="color:#d4695a">💥 捕获到崩溃</h2><pre style="background:#2a2823;padding:16px;border-radius:8px;color:#d4695a;white-space:pre-wrap;word-break:break-all;font-size:13px">${msg}</pre><p style="color:#6b655c;margin-top:16px">打开开发者工具(F12)查看完整堆栈</p></div>`;
    document.body.appendChild(crashOverlay);
  } catch {}
}

window.addEventListener('error', (event) => {
  const msg = event.error?.message || event.message || '未知错误';
  const stack = event.error?.stack || '';
  console.error('[Global Error]', event.error, event.filename, event.lineno, event.colno);
  showCrashOverlay(msg + '\n' + (stack.split('\n').slice(0, 3).join('\n') || ''));
});

window.addEventListener('unhandledrejection', (event) => {
  const msg = event.reason?.message || String(event.reason);
  const stack = event.reason?.stack || '';
  console.error('[Unhandled Rejection]', event.reason);
  showCrashOverlay('Promise 未捕获: ' + msg + '\n' + (stack.split('\n').slice(0, 3).join('\n') || ''));
});

function getSystemTheme(): Theme {
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

function loadTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return getSystemTheme();
}

function loadNotebook(): NotebookPage[] {
  const raw = localStorage.getItem(NOTEBOOK_KEY);
  if (!raw) {
    return [
      {
        id: createId(),
        title: "欢迎使用笔记本",
        content: "这是你的私人笔记本，在这里记录想法、灵感和笔记。\n\n点击右上角的 + 按钮创建新页面，或者选择左侧的页面列表切换。",
        images: [],
        audio: [],
        video: [],
        createdAt: new Date().toISOString(),
      },
    ];
  }

  try {
    const value = JSON.parse(raw);
    const pages = Array.isArray(value) ? value.map(page => ({ ...page, images: page.images || [], audio: page.audio || [], video: page.video || [] })) : [];
    console.log('[Notebook] Loaded pages:', pages.length, 'videos:', pages.reduce((acc, p) => acc + (p.video?.length || 0), 0));
    return pages;
  } catch (error) {
    console.error('[Notebook] Failed to load:', error);
    return [];
  }
}


function loadTasks(): Task[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function App() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [title, setTitle] = useState("");
  const [draftNote, setDraftNote] = useState("");
  const [priority, setPriority] = useState<Priority>("high");
  const [sortMode, setSortMode] = useState<SortMode>("created-desc");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [showComposerNote, setShowComposerNote] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [pendingPermanentDeleteId, setPendingPermanentDeleteId] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(loadTheme);
  const [exportMessage, setExportMessage] = useState<string>("");
  
  // 启动动画
  const [showLaunch, setShowLaunch] = useState(true);

  // 笔记本相关状态
  const [currentView, setCurrentView] = useState<ViewMode>("tasks");
  const [taskViewMode, setTaskViewMode] = useState<"list" | "kanban">("list");
  const [showStats, setShowStats] = useState(false);
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);

  // Stats recording
  const stats = useStats();
  const timer = useTimer();

  // Record tomato on timer complete
  useOnTimerComplete(() => {
    const focusMin = Math.round(timer.durationSeconds / 60);
    stats.recordTomato(focusMin);
  });
  const [notebookPages, setNotebookPages] = useState<NotebookPage[]>(loadNotebook);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [pageContentDraft, setPageContentDraft] = useState<Record<string, string>>({});
  const [pageTitleDraft, setPageTitleDraft] = useState<Record<string, string>>({});
  const [pageImagesDraft, setPageImagesDraft] = useState<Record<string, string[]>>({});
  const [pageAudioDraft, setPageAudioDraft] = useState<Record<string, string[]>>({});
  const [pageVideoDraft, setPageVideoDraft] = useState<Record<string, string[]>>({});
  const [isMuted, setIsMuted] = useState(false);

  // 跟踪新创建的任务 ID，用于触发入场动画
  const newTaskIds = useRef<Set<string>>(new Set());

  // 媒体缓存：mediaId → blob URL，避免把大文件存进 state/localStorage
  const mediaUrlCache = useRef<Record<string, string>>({});
  // 缓存版本号：IndexedDB 异步加载完成后递增触发重渲染
  const [, setMediaCacheVersion] = useState(0);

  // 从 IndexedDB / 文件系统加载当前页面所有媒体的 URL
  async function hydrateMediaForPage(page: NotebookPage) {
    const allMediaRefs = [
      ...(page.images || []),
      ...(page.audio || []),
      ...(page.video || []),
    ];
    const hasNew = await hydrateMediaRefs(allMediaRefs, mediaUrlCache.current);
    if (hasNew) {
      setMediaCacheVersion((v) => v + 1);
    }
  }

  // 通用解析函数：把 mediaRef 统一转成可用的 URL（同步，需先 hydrate）
  function resolveMediaUrl(ref: string): string {
    return resolveMediaUrlSync(ref, mediaUrlCache.current);
  }

  // 安全获取当前页面，防止越界崩溃
  const currentPage = notebookPages[currentPageIndex] ?? null;

  // 启动动画自动结束（1.2s 后）
  useEffect(() => {
    if (!showLaunch) return;
    const timer = setTimeout(() => setShowLaunch(false), 1200);
    return () => clearTimeout(timer);
  }, [showLaunch]);

  // 全局快捷键注册（Tauri 桌面端）
  useEffect(() => {
    const tauriWindow = window as unknown as { __TAURI__?: unknown };
    if (!tauriWindow.__TAURI__) return;
    const shortcut = "CommandOrControl+Shift+N";
    import("@tauri-apps/plugin-global-shortcut")
      .then(({ register }) =>
        register(shortcut, () => setIsCaptureOpen(true))
      )
      .catch((err) => console.warn("[QuickCapture] 快捷键注册失败:", err));
    return () => {
      import("@tauri-apps/plugin-global-shortcut")
        .then(({ unregister }) => unregister(shortcut))
        .catch(() => {});
    };
  }, []);

  // 快速捕捉提交
  function handleQuickAdd(title: string, priority: Priority) {
    const newTask: Task = {
      id: createId(),
      title: title.trim(),
      note: "",
      priority,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    newTaskIds.current.add(newTask.id);
    persist([newTask, ...tasks]);
    stats.recordTaskCreated();
    setTimeout(() => newTaskIds.current.delete(newTask.id), 1500);
  }

  // 切换笔记本页面时预加载媒体
  useEffect(() => {
    const page = notebookPages[currentPageIndex];
    if (page) {
      hydrateMediaForPage(page);
    }
  }, [currentPageIndex]);

  useEffect(() => {
    if (exportMessage) {
      const timer = setTimeout(() => setExportMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [exportMessage]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(NOTEBOOK_KEY, JSON.stringify(notebookPages));
  }, [notebookPages]);

  function toggleTheme() {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  }

  // 笔记本操作函数
  function persistNotebook(nextPages: NotebookPage[]) {
    setNotebookPages(nextPages);
  }

  function addNotebookPage() {
    const newPage: NotebookPage = {
      id: createId(),
      title: "新建页面",
      content: "",
      images: [],
      audio: [],
      video: [],
      createdAt: new Date().toISOString(),
    };
    persistNotebook([...notebookPages, newPage]);
    setCurrentPageIndex(notebookPages.length);
    setEditingPageId(newPage.id);
    setPageTitleDraft((drafts) => ({ ...drafts, [newPage.id]: "新建页面" }));
    setPageContentDraft((drafts) => ({ ...drafts, [newPage.id]: "" }));
    setPageImagesDraft((drafts) => ({ ...drafts, [newPage.id]: [] }));
    setPageAudioDraft((drafts) => ({ ...drafts, [newPage.id]: [] }));
    setPageVideoDraft((drafts) => ({ ...drafts, [newPage.id]: [] }));
  }

  function deleteNotebookPage(pageId: string) {
    if (notebookPages.length <= 1) {
      return;
    }
    // 清理该页面的所有媒体文件
    const pageToDelete = notebookPages.find((p) => p.id === pageId);
    if (pageToDelete) {
      const allMediaIds = [
        ...(pageToDelete.images || []),
        ...(pageToDelete.audio || []),
        ...(pageToDelete.video || []),
      ];
      for (const ref of allMediaIds) {
        if (!ref.startsWith("data:") && !ref.startsWith("blob:")) {
          deleteMediaRef(ref).catch((err) => console.error("Failed to delete media:", err));
        }
        if (mediaUrlCache.current[ref]) {
          URL.revokeObjectURL(mediaUrlCache.current[ref]);
          delete mediaUrlCache.current[ref];
        }
      }
    }
    const newPages = notebookPages.filter((page) => page.id !== pageId);
    persistNotebook(newPages);
    if (currentPageIndex >= newPages.length) {
      setCurrentPageIndex(newPages.length - 1);
    }
  }

  async function startEditingPage(page: NotebookPage) {
    // 编辑前先 hydrate 媒体，确保已有图片/视频能正确显示
    await hydrateMediaForPage(page);
    setEditingPageId(page.id);
    setPageTitleDraft((drafts) => ({ ...drafts, [page.id]: page.title }));
    setPageContentDraft((drafts) => ({ ...drafts, [page.id]: page.content }));
    setPageImagesDraft((drafts) => ({ ...drafts, [page.id]: page.images || [] }));
    setPageAudioDraft((drafts) => ({ ...drafts, [page.id]: page.audio || [] }));
    setPageVideoDraft((drafts) => ({ ...drafts, [page.id]: page.video || [] }));
  }

  async function savePage(pageId: string) {
    // 找出被移除的媒体，从 IndexedDB 清理
    const oldPage = notebookPages.find((p) => p.id === pageId);
    const newImages = pageImagesDraft[pageId] || [];
    const newAudio = pageAudioDraft[pageId] || [];
    const newVideo = pageVideoDraft[pageId] || [];
    if (oldPage) {
      const oldSet = new Set([
        ...(oldPage.images || []),
        ...(oldPage.audio || []),
        ...(oldPage.video || []),
      ]);
      const newSet = new Set([...newImages, ...newAudio, ...newVideo]);
      for (const ref of oldSet) {
        if (!newSet.has(ref) && !ref.startsWith("data:") && !ref.startsWith("blob:")) {
          deleteMediaRef(ref).catch((err) => console.error("Failed to delete media from IndexedDB:", err));
        }
      }
    }
    const updatedPage: NotebookPage = {
      ...oldPage!,
      title: pageTitleDraft[pageId]?.trim() || "未命名",
      content: pageContentDraft[pageId]?.trim() || "",
      images: newImages,
      audio: newAudio,
      video: newVideo,
    };
    persistNotebook(
      notebookPages.map((page) =>
        page.id === pageId ? updatedPage : page
      )
    );
    // 保存后立即 hydrate 媒体缓存，防止 src="" 导致黑屏
    await hydrateMediaForPage(updatedPage);
    setEditingPageId(null);
  }

  function handleImageUpload(pageId: string, event: React.ChangeEvent<HTMLInputElement>) {
    try {
      console.log('[Upload] handleImageUpload called, pageId:', pageId);
      const files = event.target.files;
      if (!files) { console.log('[Upload] No files'); return; }
      console.log('[Upload] File count:', files.length);
      Array.from(files).forEach((file, idx) => {
        try {
          console.log(`[Upload] Processing file ${idx}: ${file.name}, size: ${file.size}, type: ${file.type}`);
          const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
          console.log('[Upload] Generated id:', id);
          const blobUrl = URL.createObjectURL(file);
          console.log('[Upload] Blob URL created:', blobUrl.substring(0, 50) + '...');
          mediaUrlCache.current[id] = blobUrl;
          setPageImagesDraft((drafts) => ({ ...drafts, [pageId]: [...(drafts[pageId] || []), id] }));
          console.log('[Upload] State updated');
          storeMediaFile(file, id).catch((err) => console.error("Failed to store image:", err));
        } catch (innerErr) {
          console.error('[Upload] Inner error for file:', file.name, innerErr);
          showCrashOverlay('图片上传错误: ' + (innerErr instanceof Error ? innerErr.message : String(innerErr)));
        }
      });
      console.log('[Upload] handleImageUpload complete');
    } catch (err) {
      console.error('[Upload] handleImageUpload crashed:', err);
      showCrashOverlay('图片上传崩溃: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  function removeImage(pageId: string, imageIndex: number) {
    setPageImagesDraft((drafts) => {
      const list = drafts[pageId] || [];
      const removed = list[imageIndex];
      // 只撤销 blob URL，IndexedDB 删除推迟到保存时
      if (removed && mediaUrlCache.current[removed]) {
        URL.revokeObjectURL(mediaUrlCache.current[removed]);
        delete mediaUrlCache.current[removed];
      }
      return {
        ...drafts,
        [pageId]: list.filter((_, idx) => idx !== imageIndex),
      };
    });
  }

  function handleAudioUpload(pageId: string, event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const blobUrl = URL.createObjectURL(file);
      mediaUrlCache.current[id] = blobUrl;
      setPageAudioDraft((drafts) => ({ ...drafts, [pageId]: [...(drafts[pageId] || []), id] }));
      storeMediaFile(file, id).catch((err) => console.error("Failed to store audio:", err));
    });
  }

  function removeAudio(pageId: string, audioIndex: number) {
    setPageAudioDraft((drafts) => {
      const list = drafts[pageId] || [];
      const removed = list[audioIndex];
      if (removed && mediaUrlCache.current[removed]) {
        URL.revokeObjectURL(mediaUrlCache.current[removed]);
        delete mediaUrlCache.current[removed];
      }
      return {
        ...drafts,
        [pageId]: list.filter((_, idx) => idx !== audioIndex),
      };
    });
  }

  function handleVideoUpload(pageId: string, event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      // 1. 立即显示：blob URL 零延迟
      const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const blobUrl = URL.createObjectURL(file);
      mediaUrlCache.current[id] = blobUrl;
      setPageVideoDraft((drafts) => ({ ...drafts, [pageId]: [...(drafts[pageId] || []), id] }));
      // 2. 持久化到 IndexedDB（等写入完成才能安全关闭 app）
      storeMediaFile(file, id).then(() => {
        console.log('[Video] IndexedDB 写入完成, ID:', id);
      }).catch((err) => {
        console.error('[Video] IndexedDB 写入失败:', err);
      });
    });
  }

  function removeVideo(pageId: string, videoIndex: number) {
    setPageVideoDraft((drafts) => {
      const list = drafts[pageId] || [];
      const removed = list[videoIndex];
      if (removed && mediaUrlCache.current[removed]) {
        URL.revokeObjectURL(mediaUrlCache.current[removed]);
        delete mediaUrlCache.current[removed];
      }
      return {
        ...drafts,
        [pageId]: list.filter((_, idx) => idx !== videoIndex),
      };
    });
  }

  function goToPrevPage() {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  }

  function goToNextPage() {
    if (currentPageIndex < notebookPages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  }

  function persist(nextTasks: Task[]) {
    setTasks(nextTasks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTasks));
  }

  function handleAddTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    const newTask: Task = {
      id: createId(),
      title: trimmedTitle,
      note: draftNote.trim(),
      priority,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    newTaskIds.current.add(newTask.id);
    persist([newTask, ...tasks]);
    setTitle("");
    setDraftNote("");
    stats.recordTaskCreated();
    // clean up new-task marker after animation
    setTimeout(() => newTaskIds.current.delete(newTask.id), 1500);
  }

  function updateTask(id: string, updater: (task: Task) => Task) {
    persist(tasks.map((task) => (task.id === id ? updater(task) : task)));
  }

  function toggleComplete(id: string) {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      if (task.completed) {
        stats.recordTaskUncompleted();
      } else {
        stats.recordTaskCompleted();
      }
    }
    updateTask(id, (task) => ({ ...task, completed: !task.completed }));
  }

  function deleteTask(id: string) {
    updateTask(id, (task) => ({ ...task, deletedAt: new Date().toISOString() }));
    setEditingId((current) => (current === id ? null : current));
    setExpandedNotes((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function clearCompleted() {
    persist(
      tasks.map((task) =>
        task.completed && !task.deletedAt ? { ...task, deletedAt: new Date().toISOString() } : task,
      ),
    );
    setEditingId(null);
    setExpandedNotes((current) => {
      const next = { ...current };
      for (const task of tasks) {
        if (task.completed) {
          delete next[task.id];
        }
      }
      return next;
    });
  }

  function restoreTask(id: string) {
    updateTask(id, (task) => {
      const { deletedAt, ...restored } = task;
      return restored;
    });
  }

  function permanentlyDeleteTask(id: string) {
    persist(tasks.filter((task) => task.id !== id));
    setPendingPermanentDeleteId(null);
    setExpandedNotes((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function startEditing(task: Task) {
    setEditingId(task.id);
    setNoteDrafts((drafts) => ({ ...drafts, [task.id]: task.note }));
  }

  function saveNote(id: string) {
    updateTask(id, (task) => ({ ...task, note: noteDrafts[id]?.trim() ?? "" }));
    setEditingId(null);
  }

  function toggleNoteExpanded(id: string) {
    setExpandedNotes((current) => ({ ...current, [id]: !current[id] }));
  }

  function expandAllNotes() {
    setExpandedNotes(
      tasks.reduce<Record<string, boolean>>((next, task) => {
        if (task.note) {
          next[task.id] = true;
        }
        return next;
      }, {}),
    );
  }

  function collapseAllNotes() {
    setExpandedNotes({});
  }

  async function saveFile(content: string, filename: string) {
    console.log("[导出日志] saveFile 函数开始执行");
    console.log("[导出日志] 文件名:", filename);
    console.log("[导出日志] 内容长度:", content.length);

    const showMessage = (msg: string) => {
      console.log("[导出日志] 消息:", msg);
      setExportMessage(msg);
    };

    try {
      showMessage(" 正在准备导出...");

      console.log("[导出日志] 检查Tauri环境...");
      const isTauri = (window as unknown as { __TAURI__?: unknown }).__TAURI__ !== undefined;
      console.log("[导出日志] 是否在Tauri环境:", isTauri);

      if (!isTauri) {
        showMessage("  仅支持在桌面端导出");
        return;
      }

      // 动态加载 Tauri 模块（只在导出时，不影响视频上传等核心流程）
      const [{ save: saveDialog }, { writeTextFile: writeFile }] = await Promise.all([
        import("@tauri-apps/plugin-dialog"),
        import("@tauri-apps/plugin-fs"),
      ]);

      console.log("[导出日志] 尝试打开保存对话框...");
      showMessage(" 打开文件保存对话框...");

      const filePath = await saveDialog({
        title: "导出 Markdown",
        defaultPath: filename,
        filters: [{ name: "Markdown Files", extensions: ["md"] }],
      });

      console.log("[导出日志] 文件路径:", filePath);

      if (!filePath) {
        showMessage(" 用户取消了保存");
        console.log("[导出日志] 用户取消保存");
        return;
      }

      showMessage(" 正在保存文件到: " + filePath);
      console.log("[导出日志] 开始写入文件...");

      await writeFile(filePath, content);

      showMessage(" 保存成功！文件已保存到: " + filePath);
      console.log("[导出日志] 文件保存成功");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const stackTrace = error instanceof Error ? error.stack : "无堆栈信息";
      showMessage(" 保存失败！错误: " + errorMsg);
      console.error("[导出日志] 保存失败:", errorMsg);
      console.error("[导出日志] 堆栈信息:", stackTrace);
    }
  }

  async function exportToMarkdown() {
    const allTasks = tasks;
    const liveTasks = allTasks.filter((t) => !t.deletedAt);
    const trashTasks = allTasks.filter((t) => t.deletedAt);
    const activeCount = liveTasks.filter((t) => !t.completed).length;
    const completedCount = liveTasks.filter((t) => t.completed).length;

    const priorityLabels: Record<Priority, string> = {
      high: "🔴 高",
      medium: "🟡 中",
      low: "🟢 低",
    };

    const now = new Date().toLocaleString('zh-CN');

    let mdContent = `#  Focus Notes 任务笔记\n\n`;
    mdContent += `> **导出时间**：${now}\n\n`;

    mdContent += `##  统计摘要\n\n`;
    mdContent += `| 项目 | 数量 |\n`;
    mdContent += `| --- | ---: |\n`;
    mdContent += `| 📝 任务总数 | **${allTasks.length}** |\n`;
    mdContent += `| 🔄 未完成 | **${activeCount}** |\n`;
    mdContent += `| ✅ 已完成 | **${completedCount}** |\n`;
    mdContent += `| 🗑️ 已删除 | **${trashTasks.length}** |\n\n`;
    mdContent += `---\n\n`;

    // === 进行中的任务 ===
    const activeTasks = liveTasks.filter((t) => !t.completed);
    if (activeTasks.length > 0) {
      mdContent += `## 🔄 进行中任务\n\n`;
      mdContent += `> 💡 *以下任务正在进行中，需要持续关注*\n\n`;
      activeTasks.forEach((task, index) => {
        mdContent += `### ${index + 1}. <u>${task.title}</u>\n\n`;
        mdContent += `| 属性 | 值 |\n`;
        mdContent += `| --- | --- |\n`;
        mdContent += `| **优先级** | ${priorityLabels[task.priority]} |\n`;
        mdContent += `| **状态** | 🔄 *进行中* |\n`;
        mdContent += `| **创建时间** | 📅 ${formatDate(task.createdAt)} |\n`;
        if (task.note) {
          mdContent += `\n####  笔记内容\n\n`;
          mdContent += `> ${task.note.split('\n').map(l => '> ' + l).join('\n')}\n`;
        }
        mdContent += `\n\n---\n\n`;
      });
    }

    // === 已完成的任务 ===
    const doneTasks = liveTasks.filter((t) => t.completed);
    if (doneTasks.length > 0) {
      mdContent += `## ✅ 已完成任务\n\n`;
      mdContent += `>  *以下任务已圆满完成*\n\n`;
      doneTasks.forEach((task, index) => {
        mdContent += `### ${index + 1}. ~~${task.title}~~\n\n`;
        mdContent += `| 属性 | 值 |\n`;
        mdContent += `| --- | --- |\n`;
        mdContent += `| **优先级** | ${priorityLabels[task.priority]} |\n`;
        mdContent += `| **状态** | ✅ *已完成* |\n`;
        mdContent += `| **创建时间** | 📅 ${formatDate(task.createdAt)} |\n`;
        if (task.note) {
          mdContent += `\n#### 📝 笔记内容\n\n`;
          mdContent += `> ${task.note.split('\n').map(l => '> ' + l).join('\n')}\n`;
        }
        mdContent += `\n\n---\n\n`;
      });
    }

    // === 回收站 ===
    if (trashTasks.length > 0) {
      mdContent += `## ️ 回收站\n\n`;
      mdContent += `> *以下任务已删除，可恢复或永久删除*\n\n`;
      trashTasks.forEach((task, index) => {
        mdContent += `### ${index + 1}. *${task.title}*\n\n`;
        mdContent += `| 属性 | 值 |\n`;
        mdContent += `| --- | --- |\n`;
        mdContent += `| **优先级** | ${priorityLabels[task.priority]} |\n`;
        mdContent += `| **创建时间** | 📅 ${formatDate(task.createdAt)} |\n`;
        mdContent += `| **删除时间** |  ${formatDate(task.deletedAt!)} |\n`;
        if (task.note) {
          mdContent += `\n####  笔记内容\n\n`;
          mdContent += `> ${task.note.split('\n').map(l => '> ' + l).join('\n')}\n`;
        }
        mdContent += `\n\n---\n\n`;
      });
    }

    // 文档尾部
    mdContent += `\n> ---\n`;
    mdContent += `> *📝 本文档由 **Focus Notes** 自动生成于 ${now}*\n`;

    const filename = `focus-notes-${new Date().toISOString().split('T')[0]}.md`;
    await saveFile(mdContent, filename);
  }

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filterMode === "trash") {
        return Boolean(task.deletedAt);
      }
      if (task.deletedAt) {
        return false;
      }
      if (filterMode === "active") {
        return !task.completed;
      }
      if (filterMode === "completed") {
        return task.completed;
      }
      return true;
    });
  }, [filterMode, tasks]);

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      if (sortMode === "priority") {
        const priorityDelta = priorityMeta[b.priority].rank - priorityMeta[a.priority].rank;
        if (priorityDelta !== 0) {
          return priorityDelta;
        }
      }

      const createdDelta = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return sortMode === "created-asc" ? -createdDelta : createdDelta;
    });
  }, [filteredTasks, sortMode]);

  const liveTasks = tasks.filter((task) => !task.deletedAt);
  const activeCount = liveTasks.filter((task) => !task.completed).length;
  const completedCount = liveTasks.length - activeCount;
  const trashCount = tasks.length - liveTasks.length;
  const noteTasks = filteredTasks.filter((task) => task.note);
  const allNotesExpanded = noteTasks.length > 0 && noteTasks.every((task) => expandedNotes[task.id]);

  return (
    <>
      {showLaunch && <LaunchScreen onComplete={() => setShowLaunch(false)} />}
      <main className="app-shell" style={{ visibility: showLaunch ? "hidden" : "visible" }}>
        <AppHeader
          theme={theme}
          currentView={currentView}
          taskViewMode={taskViewMode}
          onChangeTaskViewMode={setTaskViewMode}
          onToggleTheme={toggleTheme}
          onSwitchView={setCurrentView}
          onOpenStats={() => setShowStats(true)}
        />
        <TimerBar />
        <FocusTimer />
        <StatsPanel isOpen={showStats} onClose={() => setShowStats(false)} />
        <QuickCapture
          isOpen={isCaptureOpen}
          onClose={() => setIsCaptureOpen(false)}
          onAdd={handleQuickAdd}
        />
      {currentView === "tasks" && taskViewMode === "kanban" && (
        <section className="task-board">
          <TaskKanbanView
            tasks={filteredTasks}
            onToggleComplete={toggleComplete}
          />
        </section>
      )}
      {currentView === "tasks" && taskViewMode === "list" && (<section className="task-board">
        <form className="quick-add" onSubmit={handleAddTask}>
          <div className="quick-input-row">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="记下你需要做的事..."
              aria-label="任务名称"
            />
            <button className="add-button" type="submit" title="添加任务" aria-label="添加任务">
              <Plus size={28} />
            </button>
          </div>

          <div className="composer-note-row">
            <button
              className="text-button"
              type="button"
              aria-expanded={showComposerNote}
              onClick={() => setShowComposerNote((current) => !current)}
            >
              <MessageSquareText size={17} />
              {showComposerNote ? "隐藏笔记输入" : "添加任务笔记"}
            </button>
            <span>{draftNote ? "已写入笔记" : "可选"}</span>
          </div>

          {showComposerNote ? (
            <textarea
              value={draftNote}
              onChange={(event) => setDraftNote(event.target.value)}
              placeholder="写下上下文、目标或下一步..."
              rows={3}
            />
          ) : null}

          <div className="priority-tabs" aria-label="任务强度">
            {(Object.keys(priorityMeta) as Priority[]).map((level) => (
              <button
                className={`priority-tab priority-${level} ${priority === level ? "is-selected" : ""}`}
                key={level}
                type="button"
                onClick={() => setPriority(level)}
              >
                <span />
                {priorityMeta[level].label}
              </button>
            ))}
          </div>
        </form>

        <div className="board-divider" />

        <div className="toolbar">
          <div className="filter-tabs">
            {filters.map((filter) => (
              <button
                className={filterMode === filter.value ? "is-active" : ""}
                key={filter.value}
                type="button"
                onClick={() => setFilterMode(filter.value)}
              >
                {filter.label}
                {filter.value === "trash" && trashCount > 0 ? <span>{trashCount}</span> : null}
              </button>
            ))}
          </div>

          <div className="toolbar-actions">
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
              <option value="created-desc">最新创建</option>
              <option value="created-asc">最早创建</option>
              <option value="priority">强度排序</option>
            </select>
            <button
              className="outline-button"
              type="button"
              disabled={noteTasks.length === 0}
              onClick={allNotesExpanded ? collapseAllNotes : expandAllNotes}
            >
              {allNotesExpanded ? <ChevronsDownUp size={17} /> : <ChevronsUpDown size={17} />}
              {allNotesExpanded ? "全部隐藏" : "全部展开"}
            </button>
            <button
              className="outline-button"
              type="button"
              title="导出为Markdown"
              onClick={exportToMarkdown}
            >
              <Download size={17} />
              导出MD
            </button>
          </div>
        </div>

        {exportMessage && (
          <div className="export-message" role="status" aria-live="polite">
            {exportMessage}
          </div>
        )}

        <div className="list-summary">
          <span>{filterMode === "trash" ? `${trashCount} 个已删除` : `${activeCount} 个未完成`}</span>
          {filterMode !== "trash" && completedCount > 0 ? (
            <button className="clear-button" type="button" onClick={clearCompleted}>
              移入回收站（{completedCount}）
            </button>
          ) : null}
        </div>

        <div className="task-list" aria-label="任务清单">
          {sortedTasks.length === 0 ? (
            <div className="empty-state">
              <p>还没有任务。先写下一件正在推进的事。</p>
            </div>
          ) : (
            sortedTasks.map((task, index) => {
              const isExpanded = Boolean(expandedNotes[task.id]);

              const isInTrash = Boolean(task.deletedAt);

              return (
                <AnimatedTaskRow
                  key={task.id}
                  taskId={task.id}
                  isCompleted={task.completed}
                  isDeleted={isInTrash}
                  isNew={newTaskIds.current.has(task.id)}
                >
                  <span className={`priority-dot priority-${task.priority}`} aria-hidden="true" />

                  <button
                    className="complete-button"
                    type="button"
                    title={task.completed ? "标记为未完成" : "标记为已完成"}
                    onClick={() => toggleComplete(task.id)}
                  >
                    {task.completed ? <CheckCircle2 size={27} /> : <Circle size={27} />}
                  </button>

                  <div className="task-content">
                    <div className="task-line">
                      <h3>{task.title}</h3>
                      <span className={`priority-label priority-${task.priority}`}>{priorityMeta[task.priority].label}</span>
                    </div>

                    <div className="task-meta">
                      <Clock3 size={14} />
                      <span>{isInTrash && task.deletedAt ? `删除于 ${formatDate(task.deletedAt)}` : formatDate(task.createdAt)}</span>
                    </div>

                    {editingId === task.id ? (
                      <div className="note-editor">
                        <textarea
                          value={noteDrafts[task.id] ?? ""}
                          onChange={(event) =>
                            setNoteDrafts((drafts) => ({ ...drafts, [task.id]: event.target.value }))
                          }
                          rows={4}
                          autoFocus
                        />
                        <button className="save-button" type="button" onClick={() => saveNote(task.id)}>
                          <Save size={16} />
                          保存
                        </button>
                      </div>
                    ) : task.note ? (
                      <div className="note-preview">
                        <button
                          className="note-toggle"
                          type="button"
                          title={isExpanded ? "收起笔记" : "展开笔记"}
                          aria-label={isExpanded ? "收起笔记" : "展开笔记"}
                          aria-expanded={isExpanded}
                          onClick={() => toggleNoteExpanded(task.id)}
                        >
                          {isExpanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
                        </button>
                        <p className={`task-note ${isExpanded ? "is-expanded" : "is-collapsed"}`}>{task.note}</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="task-actions">
                    {isInTrash ? (
                      <>
                        <button className="restore-button" type="button" onClick={() => restoreTask(task.id)}>
                          <RotateCcw size={17} />
                          恢复
                        </button>
                        <button
                          className="icon-button danger"
                          type="button"
                          title="永久删除"
                          onClick={() => setPendingPermanentDeleteId(task.id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    ) : (
                      <>
                        <select
                          aria-label="修改强度"
                          value={task.priority}
                          onChange={(event) =>
                            updateTask(task.id, (current) => ({ ...current, priority: event.target.value as Priority }))
                          }
                        >
                          <option value="high">高</option>
                          <option value="medium">中</option>
                          <option value="low">低</option>
                        </select>
                        <button className="icon-button" type="button" title="编辑笔记" onClick={() => startEditing(task)}>
                          <MessageSquareText size={18} />
                        </button>
                        <button
                          className="icon-button"
                          type="button"
                          title="重命名任务"
                          onClick={() => {
                            const nextTitle = window.prompt("修改任务名称", task.title)?.trim();
                            if (nextTitle) {
                              updateTask(task.id, (current) => ({ ...current, title: nextTitle }));
                            }
                          }}
                        >
                          <PencilLine size={18} />
                        </button>
                        <button className="icon-button danger" type="button" title="移入回收站" onClick={() => deleteTask(task.id)}>
                          <Trash size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </AnimatedTaskRow>
              );
            })
          )}
        </div>

        {pendingPermanentDeleteId ? (
          <div className="modal-backdrop" role="presentation">
            <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
              <h2 id="delete-dialog-title">确定永久删除吗？</h2>
              <p>永久删除后无法从回收站恢复。</p>
              <div className="dialog-actions">
                <button className="outline-button" type="button" onClick={() => setPendingPermanentDeleteId(null)}>
                  取消
                </button>
                <button
                  className="danger-button"
                  type="button"
                  onClick={() => permanentlyDeleteTask(pendingPermanentDeleteId)}
                >
                  永久删除
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
  )}

      {/* 笔记本页面 */}
      {currentView === "notebook" && (
        <section className="notebook-board">
          <div className="notebook-header">
            <h2 className="notebook-title">
              <Notebook size={22} />
              我的笔记本
            </h2>
            <div className="notebook-header-actions">
              <button
                className="add-page-button"
                type="button"
                onClick={addNotebookPage}
                title="添加新页面"
              >
                <Plus size={18} />
                新建页面
              </button>
            </div>
          </div>

          <div className="notebook-content">
            {/* 左侧页面列表 */}
            <div className="page-sidebar">
              <div className="page-list">
                {notebookPages.map((page, index) => (
                  <button
                    key={page.id}
                    className={`page-item ${index === currentPageIndex ? "is-active" : ""}`}
                    type="button"
                    onClick={() => {
                      setCurrentPageIndex(index);
                      setEditingPageId(null);
                    }}
                  >
                    <span className="page-number">{index + 1}</span>
                    <span className="page-title">{page.title}</span>
                    {index === currentPageIndex && notebookPages.length > 1 && (
                      <button
                        className="delete-page-btn"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotebookPage(page.id);
                        }}
                        title="删除页面"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 右侧翻书区域 */}
            <div className="book-area">
              <div className="book-controls">
                <button
                  className="nav-button prev"
                  type="button"
                  onClick={goToPrevPage}
                  disabled={currentPageIndex === 0}
                  title="上一页"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="page-indicator">
                  {currentPageIndex + 1} / {notebookPages.length}
                </span>
                <button
                  className="nav-button next"
                  type="button"
                  onClick={goToNextPage}
                  disabled={currentPageIndex === notebookPages.length - 1}
                  title="下一页"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="book-container">
                {currentPage && (
                  <div className="book-page-wrapper" key={currentPageIndex}>
                    <div className={`book-page ${editingPageId === currentPage.id ? "is-editing" : ""}`}>
                      <div className="page-curl" />
                      {editingPageId === currentPage.id ? (
                        <>
                          <input
                            className="page-title-input"
                            type="text"
                            value={pageTitleDraft[currentPage.id] || ""}
                            onChange={(e) =>
                              setPageTitleDraft((drafts) => ({
                                ...drafts,
                                [currentPage.id]: e.target.value,
                              }))
                            }
                            placeholder="页面标题"
                            autoFocus
                          />
                          <textarea
                            className="page-content-input"
                            value={pageContentDraft[currentPage.id] || ""}
                            onChange={(e) =>
                              setPageContentDraft((drafts) => ({
                                ...drafts,
                                [currentPage.id]: e.target.value,
                              }))
                            }
                            placeholder="开始记录你的想法..."
                            rows={12}
                          />
                          <div className="page-images">
                            {(pageImagesDraft[currentPage.id] || []).map((img, idx) => (
                              <div key={idx} className="page-image-item">
                                <img src={resolveMediaUrl(img)} alt={`图片 ${idx + 1}`} />
                                <button
                                  type="button"
                                  className="remove-image-btn"
                                  onClick={() => removeImage(currentPage.id, idx)}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                            <label className="add-image-btn">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => handleImageUpload(currentPage.id, e)}
                                style={{ display: "none" }}
                              />
                              <ImageIcon size={20} />
                              添加图片
                            </label>
                          </div>
                          <div className="page-audio">
                            {(pageAudioDraft[currentPage.id] || []).map((audio, idx) => (
                              <div key={idx} className="page-audio-item">
                                <audio controls src={resolveMediaUrl(audio)} preload="none" />
                                <button
                                  type="button"
                                  className="remove-audio-btn"
                                  onClick={() => removeAudio(currentPage.id, idx)}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                            <label className="add-audio-btn">
                              <input
                                type="file"
                                accept="audio/*"
                                multiple
                                onChange={(e) => handleAudioUpload(currentPage.id, e)}
                                style={{ display: "none" }}
                              />
                              <Music size={20} />
                              添加音频
                            </label>
                          </div>
                          <div className="page-video">
                            {(pageVideoDraft[currentPage.id] || []).map((video, idx) => (
                              <div key={idx} className="page-video-item">
                                <video controls src={resolveMediaUrl(video)} muted={isMuted} playsInline preload="none" width="100%" style={{ maxWidth: 320, borderRadius: 8, background: "#000" }} />
                                <button
                                  type="button"
                                  className="remove-video-btn"
                                  onClick={() => removeVideo(currentPage.id, idx)}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                            <label className="add-video-btn">
                              <input
                                type="file"
                                accept="video/*"
                                multiple
                                onChange={(e) => handleVideoUpload(currentPage.id, e)}
                                style={{ display: "none" }}
                              />
                              <Video size={20} />
                              添加视频
                            </label>
                          </div>
                          <div className="page-actions">
                            <button
                              className="mute-btn"
                              type="button"
                              onClick={() => setIsMuted(!isMuted)}
                              title={isMuted ? "开启声音" : "静音"}
                            >
                              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            </button>
                            <button
                              className="save-page-btn"
                              type="button"
                              onClick={() => savePage(currentPage.id)}
                            >
                              <Save size={16} />
                              保存
                            </button>
                            <button
                              className="cancel-edit-btn"
                              type="button"
                              onClick={() => setEditingPageId(null)}
                            >
                              <X size={16} />
                              取消
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <h3 className="page-heading">{currentPage.title}</h3>
                          <div
                            className="page-body"
                            onClick={() => startEditingPage(currentPage)}
                          >
                            {currentPage.content || (
                              <p className="empty-hint">点击此处编辑...</p>
                            )}
                          </div>
                          {currentPage.images && currentPage.images.length > 0 && (
                            <div className="page-images-display">
                              {currentPage.images.map((img, idx) => (
                                <img key={idx} src={resolveMediaUrl(img)} alt={`图片 ${idx + 1}`} />
                              ))}
                            </div>
                          )}
                          {currentPage.audio && currentPage.audio.length > 0 && (
                            <div className="page-audio-display">
                              {currentPage.audio.map((audio, idx) => (
                                <audio key={idx} controls src={resolveMediaUrl(audio)} muted={isMuted} />
                              ))}
                            </div>
                          )}
                          {currentPage.video && currentPage.video.length > 0 && (
                            <div className="page-video-display">
                              {currentPage.video.map((video, idx) => (
                                <video controls src={resolveMediaUrl(video)} muted={isMuted} playsInline preload="none" width="100%" style={{ maxWidth: 320, borderRadius: 8, background: "#000" }} />
                              ))}
                            </div>
                          )}
                          <button
                            className="edit-page-btn"
                            type="button"
                            onClick={() => startEditingPage(currentPage)}
                          >
                            <PencilLine size={16} />
                            编辑
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
    </>
  );
}

export default App;
