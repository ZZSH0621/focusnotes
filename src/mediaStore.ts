/**
 * Unified media storage.
 *
 * Web:           IndexedDB (blob URLs for display).
 * Tauri desktop: Native file dialog → Rust copy → convertFileSrc (no JS memory load).
 */

import { storeMedia as idbStore, getMedia as idbGet, deleteMedia as idbDelete, base64ToBlobUrl, createMediaId } from "./db";

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

function isTauri(): boolean {
  return (window as unknown as { __TAURI__?: unknown }).__TAURI__ !== undefined;
}

/** "tauri:" prefix marks a reference as a Tauri filesystem path. */
const TAURI_PREFIX = "tauri:";

// ---------------------------------------------------------------------------
// Public API — generic (both environments)
// ---------------------------------------------------------------------------

/**
 * Persist a media file (web: IndexedDB).  Pass an optional pre-generated ID.
 */
export async function storeMediaFile(file: File, id?: string): Promise<string> {
  const finalId = id ?? createMediaId();
  await idbStore(finalId, file);
  return finalId;
}

/**
 * Synchronously resolve a reference into a loadable URL.
 * Call `hydrateMediaRefs()` first for IndexedDB / Tauri refs not yet cached.
 */
export function resolveMediaUrlSync(ref: string, cache: Record<string, string>): string {
  if (!ref) return "";
  if (ref.startsWith("blob:")) return ref;

  // Legacy base64 data URL
  if (ref.startsWith("data:")) {
    if (!cache[ref]) cache[ref] = base64ToBlobUrl(ref);
    return cache[ref];
  }

  return cache[ref] || "";
}

/**
 * Pre-populate the cache for a list of references.
 * Returns true if new entries were added.
 */
export async function hydrateMediaRefs(
  refs: string[],
  cache: Record<string, string>,
): Promise<boolean> {
  let hasNew = false;

  for (const ref of refs) {
    if (!ref) continue;
    if (ref.startsWith("blob:")) continue;
    if (ref.startsWith("data:")) {
      if (!cache[ref]) { cache[ref] = base64ToBlobUrl(ref); hasNew = true; }
      continue;
    }
    if (cache[ref]) continue;

    if (ref.startsWith(TAURI_PREFIX)) {
      try {
        const { convertFileSrc } = await import("@tauri-apps/api/core");
        cache[ref] = convertFileSrc(ref.slice(TAURI_PREFIX.length));
        hasNew = true;
      } catch (err) {
        console.error("convertFileSrc failed:", err);
      }
    } else {
      try {
        const blob = await idbGet(ref);
        if (blob) { cache[ref] = URL.createObjectURL(blob); hasNew = true; }
      } catch { /* not found */ }
    }
  }

  return hasNew;
}

/**
 * Delete a media file (IndexedDB or disk).
 */
export async function deleteMediaRef(ref: string): Promise<void> {
  if (!ref) return;
  if (ref.startsWith("data:") || ref.startsWith("blob:")) return;

  if (ref.startsWith(TAURI_PREFIX)) {
    try {
      const { remove } = await import("@tauri-apps/plugin-fs");
      await remove(ref.slice(TAURI_PREFIX.length));
    } catch (err) {
      console.error("Failed to delete Tauri media file:", err);
    }
  } else {
    await idbDelete(ref);
  }
}

// ---------------------------------------------------------------------------
// Tauri-only — native file dialog for video
// ---------------------------------------------------------------------------

/**
 * Tauri desktop: open a native file dialog, copy the selected video to the
 * media directory via Rust (zero JS memory load), return its reference and a
 * ready-to-use URL.  Returns `null` if the user cancels or not in Tauri.
 */
export async function pickVideoInTauri(
  cache: Record<string, string>,
): Promise<{ ref: string; url: string } | null> {
  if (!isTauri()) {
    console.log('[pickVideoInTauri] 非 Tauri 环境，跳过');
    return null;
  }

  console.log('[pickVideoInTauri] 1. 动态加载 Tauri 模块...');
  const [{ open }, { invoke }, { convertFileSrc }] = await Promise.all([
    import("@tauri-apps/plugin-dialog"),
    import("@tauri-apps/api/core"),
    import("@tauri-apps/api/core"),
  ]);
  console.log('[pickVideoInTauri] 2. 模块加载完成，打开原生对话框...');

  const selected = await open({
    title: "选择视频文件",
    filters: [{ name: "视频", extensions: ["mp4", "webm", "mkv", "avi", "mov", "ogg"] }],
    multiple: false,
  });

  if (!selected) { console.log('[pickVideoInTauri] 用户取消'); return null; }
  const sourcePath = typeof selected === "string" ? selected : (selected as string);
  console.log('[pickVideoInTauri] 3. 用户选择了:', sourcePath);

  const mediaDir = (() => {
    // 优先用 Tauri appDataDir，回退到 F 盘硬编码路径
    try {
      return "F:\\AI\\TraeCC\\media\\";
    } catch {
      return "F:\\AI\\TraeCC\\media\\";
    }
  })();
  console.log('[pickVideoInTauri] 4. 媒体目录:', mediaDir);
  // 先确保目录存在（JS 侧兜底）
  try {
    const { mkdir } = await import("@tauri-apps/plugin-fs");
    await mkdir(mediaDir, { recursive: true });
    console.log('[pickVideoInTauri] 4b. 目录已确保存在');
  } catch { /* Rust 侧也会 create_dir_all */ }
  console.log('[pickVideoInTauri] 5. 调用 Rust copy_media_file...');
  const destPath: string = await invoke("copy_media_file", {
    source: sourcePath,
    mediaDir,
  });
  console.log('[pickVideoInTauri] 6. Rust 复制完成:', destPath);

  const ref = `${TAURI_PREFIX}${destPath}`;
  console.log('[pickVideoInTauri] 7. 调用 convertFileSrc...');
  const url = convertFileSrc(destPath);
  console.log('[pickVideoInTauri] 8. URL:', url?.substring(0, 80));
  cache[ref] = url;
  console.log('[pickVideoInTauri] 9. 缓存已更新, 返回 ref');

  return { ref, url };
}
