---
name: tauri-video-black-screen-fix
description: "Tauri WebView2 video upload causes black screen — diagnosis steps, attempted fixes, root causes, and final working solution"
metadata: 
  node_type: memory
  type: project
  ai_priority: fragile
  ai_tags: [gotcha, blocking-bug]
  originSessionId: d40dfc8a-7eaa-4510-a19c-34266ac7ff42
---

# Tauri 桌面端插入视频导致黑屏 — 完整排查与修复

## 现象
Focus Notes (Tauri + React) 桌面端在笔记本中插入视频后整个窗口黑屏。网页端 (Chrome) 正常。

## 排查过程（按时间顺序）

### 第 1 轮：base64 内存爆炸
**假设**：`FileReader.readAsDataURL()` 把整个视频读成 base64 字符串放进 React state/localStorage，大文件撑爆内存。
**修复**：
- 用 `URL.createObjectURL(file)` 替代 base64（轻量引用，不复制数据）
- 用 **IndexedDB** 存储媒体 Blob（容量 GB 级，localStorage 只有 5-10MB）
- 创建 `src/db.ts`（IndexedDB CRUD）+ `src/mediaStore.ts`（统一接口）
**结果**：网页端 ✅ 修复，桌面端仍然黑屏。

### 第 2 轮：Tauri 文件系统写入
**假设**：IndexedDB 在 WebView2 中处理大文件有问题，改用 Rust 文件系统。
**修复**：
- `src-tauri/src/lib.rs` 添加 `copy_media_file` Rust 命令（`std::fs::copy`）
- `mediaStore.ts` 添加 `pickVideoInTauri()`：原生对话框 → Rust 复制 → `convertFileSrc`
- 视频上传 UI 在 Tauri 下用按钮 + 原生对话框，绕开 `<input type="file">`
**结果**：仍然黑屏。且 `F:\AI\TraeCC\media\` 目录不存在导致 Rust 侧失败。

### 第 3 轮：诊断隔离
**关键发现**：创建 `public/debug-video.html`（纯 HTML，无 React，无 Tauri import），在 Tauri WebView2 中加载该页面 → **全部测试通过，视频播放正常**。

这证明了：
- WebView2 本身能正常处理 blob URL 视频 ✅
- 问题出在 React 应用加载了 Tauri SDK 之后 ⚠️

### 第 4 轮：Tauri 静态 import 是根因
**假设**：`App.tsx` 顶部的三个 Tauri 静态 import 在 WebView2 中初始化 IPC 桥时，与视频元素创建产生冲突，导致渲染进程崩溃。

```typescript
// 问题代码 — 静态 import（应用启动时就加载）
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
```

**修复**：移除静态 import，改为在导出 Markdown 时动态加载：
```typescript
// 只在需要时加载
const [{ save: saveDialog }, { writeTextFile: writeFile }] = await Promise.all([
  import("@tauri-apps/plugin-dialog"),
  import("@tauri-apps/plugin-fs"),
]);
```
**结果**：桌面端视频插入 ✅ 成功，不再黑屏。

### 第 5 轮：视频持久化丢失
**现象**：视频能加载，但关闭 app 重开后视频无法播放。
**原因**：调试时 `handleVideoUpload` 被 `alert()` 覆盖，`storeMediaFile()` 调用被删除。
**修复**：恢复 `storeMediaFile(file, id)` 调用（后台写入 IndexedDB）。
**结果**：✅ 完全修复。

## 最终架构

```
src/
├── db.ts          → IndexedDB CRUD 底层（WebView2 + Chrome 通用）
├── mediaStore.ts  → storeMediaFile / resolveMediaUrlSync / hydrateMediaRefs / deleteMediaRef
└── App.tsx        → 只调 mediaStore，不碰 Tauri SDK

视频上传流程：
  选文件 → URL.createObjectURL(立即显示) → storeMediaFile(后台IndexedDB) → 保存页面(localStorage)
```

## 关键教训

1. **WebView2 ≠ Chrome**：同样的 IndexedDB/Blob API 行为一致，但第三方 SDK 初始化可能触发 WebView2 特定 bug
2. **Tauri SDK 静态 import 在 WebView2 中有风险**：放到动态 import 里，用到才加载
3. **隔离诊断是王道**：纯 HTML 诊断页能快速区分"代码问题"还是"运行时问题"
4. **视频元素加 `preload="none"`**：防止自动读取元数据触发 GPU 进程崩溃
5. **加 `--disable-accelerated-video-decode`**：在 `tauri.conf.json` 的 `additionalBrowserArgs` 中禁用 GPU 视频解码，提高稳定性
6. **release 版 ≠ dev 版**：用户桌面快捷方式可能指向 `target/release/focus-notes.exe`（旧代码），需要 `npx tauri build` 重新编译

## 相关文件
- [[deployment-netlify]] — 网页端部署
