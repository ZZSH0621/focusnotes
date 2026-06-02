/**
 * Daily statistics storage using IndexedDB.
 * Separate from task data — survives localStorage clears.
 *
 * Pattern matches the existing db.ts (openDB → transaction → store).
 */

const DB_NAME = "focus-notes-stats";
const DB_VERSION = 1;
const STORE_NAME = "daily";

export type DailyStats = {
  date: string; // "YYYY-MM-DD"
  completedTasks: number;
  totalTasksCreated: number;
  tomatoes: number;
  focusMinutes: number;
};

function openStatsDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "date" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function todayKey(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function emptyStats(date: string): DailyStats {
  return {
    date,
    completedTasks: 0,
    totalTasksCreated: 0,
    tomatoes: 0,
    focusMinutes: 0,
  };
}

export async function getTodayStats(): Promise<DailyStats> {
  const key = todayKey();
  const db = await openStatsDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => {
      db.close();
      resolve((req.result as DailyStats) ?? emptyStats(key));
    };
    req.onerror = () => {
      db.close();
      resolve(emptyStats(key));
    };
  });
}

export async function incrementStat(field: keyof Omit<DailyStats, "date">, amount = 1): Promise<void> {
  const key = todayKey();
  const db = await openStatsDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(key);
    getReq.onsuccess = () => {
      const existing = (getReq.result as DailyStats) ?? emptyStats(key);
      existing[field] = (existing[field] || 0) + amount;
      store.put(existing);
    };
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getHistory(days: number): Promise<DailyStats[]> {
  const db = await openStatsDB();
  return new Promise((resolve) => {
    const result: DailyStats[] = [];
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const cursorReq = store.openCursor(null, "prev"); // newest first
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (cursor && result.length < days) {
        result.push(cursor.value as DailyStats);
        cursor.continue();
      } else {
        db.close();
        resolve(result.reverse()); // chronological
      }
    };
    cursorReq.onerror = () => { db.close(); resolve(result); };
  });
}
