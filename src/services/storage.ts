import { Bookmark, LastRead, ReadingHistoryItem, SurahDetail, SurahSummary, SurahTafsir, UserSettings } from '../types/quran';

const DB_NAME = 'MuslimQuranDB';
const DB_VERSION = 1;

export const DEFAULT_SETTINGS: UserSettings = {
  arabicFontSize: 28,
  showLatin: true,
  showTranslation: true,
  theme: 'light',
  defaultQari: '05', // Misyari Rasyid Al-Afasi
  dailyGoalAyat: 10,
  autoScrollSpeed: 2,
};

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not available'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('bookmarks')) {
        db.createObjectStore('bookmarks', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('history')) {
        db.createObjectStore('history', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('surahs')) {
        db.createObjectStore('surahs', { keyPath: 'nomor' });
      }
      if (!db.objectStoreNames.contains('tafsir')) {
        db.createObjectStore('tafsir', { keyPath: 'nomor' });
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

// Helper generic store actions
async function getStoreData<T>(storeName: string): Promise<T[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch {
    const fallback = localStorage.getItem(`mq_${storeName}`);
    return fallback ? JSON.parse(fallback) : [];
  }
}

async function putStoreItem<T>(storeName: string, item: T): Promise<void> {
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Fallback sync
  }
}

async function deleteStoreItem(storeName: string, key: IDBValidKey): Promise<void> {
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Fallback sync
  }
}

// Meta item helper
async function getMeta<T>(key: string, defaultVal: T): Promise<T> {
  try {
    const db = await getDB();
    const item = await new Promise<{ key: string; value: T } | undefined>((resolve, reject) => {
      const tx = db.transaction('meta', 'readonly');
      const store = tx.objectStore('meta');
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (item && item.value !== undefined) return item.value;
  } catch {
    // try localStorage fallback
  }

  const local = localStorage.getItem(`mq_meta_${key}`);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      return defaultVal;
    }
  }
  return defaultVal;
}

async function setMeta<T>(key: string, value: T): Promise<void> {
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('meta', 'readwrite');
      const store = tx.objectStore('meta');
      const req = store.put({ key, value });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // fallback
  }
  try {
    localStorage.setItem(`mq_meta_${key}`, JSON.stringify(value));
  } catch {
    // ignore
  }
}

// BOOKMARKS
export async function getBookmarks(): Promise<Bookmark[]> {
  const items = await getStoreData<Bookmark>('bookmarks');
  return items.sort((a, b) => b.createdAt - a.createdAt);
}

export async function addBookmark(bookmark: Bookmark): Promise<void> {
  await putStoreItem('bookmarks', bookmark);
  try {
    const current = await getBookmarks();
    localStorage.setItem('mq_bookmarks', JSON.stringify(current));
  } catch {
    // ignore
  }
}

export async function removeBookmark(id: string): Promise<void> {
  await deleteStoreItem('bookmarks', id);
  try {
    const current = await getBookmarks();
    localStorage.setItem('mq_bookmarks', JSON.stringify(current.filter((b) => b.id !== id)));
  } catch {
    // ignore
  }
}

export async function updateBookmarkNote(id: string, note: string): Promise<void> {
  try {
    const db = await getDB();
    const item = await new Promise<Bookmark | undefined>((resolve, reject) => {
      const tx = db.transaction('bookmarks', 'readonly');
      const req = tx.objectStore('bookmarks').get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (item) {
      item.note = note;
      await putStoreItem('bookmarks', item);
    }
  } catch {
    // ignore
  }
}

// LAST READ
export async function getLastRead(): Promise<LastRead | null> {
  return await getMeta<LastRead | null>('lastRead', null);
}

export async function saveLastRead(lastRead: LastRead): Promise<void> {
  await setMeta('lastRead', lastRead);
}

// READING HISTORY
export async function getReadingHistory(): Promise<ReadingHistoryItem[]> {
  const items = await getStoreData<ReadingHistoryItem>('history');
  return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
}

export async function addReadingHistory(item: ReadingHistoryItem): Promise<void> {
  await putStoreItem('history', item);
}

export async function clearReadingHistory(): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction('history', 'readwrite');
    tx.objectStore('history').clear();
  } catch {
    localStorage.removeItem('mq_history');
  }
}

// SETTINGS
export async function getUserSettings(): Promise<UserSettings> {
  return await getMeta<UserSettings>('userSettings', DEFAULT_SETTINGS);
}

export async function saveUserSettings(settings: UserSettings): Promise<void> {
  await setMeta('userSettings', settings);
}

// TILAWAH PROGRESS (AYATS READ TODAY)
export interface DailyTilawahProgress {
  date: string; // YYYY-MM-DD
  readCount: number;
  streak: number;
  lastReadAyats: { surah: number; ayat: number }[];
}

export async function getTodayTilawahProgress(): Promise<DailyTilawahProgress> {
  const today = new Date().toISOString().slice(0, 10);
  const data = await getMeta<DailyTilawahProgress>('tilawah_' + today, {
    date: today,
    readCount: 0,
    streak: 1,
    lastReadAyats: [],
  });
  return data;
}

export async function incrementTilawahAyat(surah: number, ayat: number): Promise<DailyTilawahProgress> {
  const today = new Date().toISOString().slice(0, 10);
  const current = await getTodayTilawahProgress();
  const exists = current.lastReadAyats.some((item) => item.surah === surah && item.ayat === ayat);
  if (!exists) {
    current.readCount += 1;
    current.lastReadAyats.push({ surah, ayat });
    if (current.lastReadAyats.length > 100) {
      current.lastReadAyats.shift();
    }
    await setMeta('tilawah_' + today, current);
  }
  return current;
}

// CACHE SURAHS AND TAFSIR
export async function getCachedSurahList(): Promise<SurahSummary[] | null> {
  return await getMeta<SurahSummary[] | null>('allSurahs', null);
}

export async function saveCachedSurahList(list: SurahSummary[]): Promise<void> {
  await setMeta('allSurahs', list);
}

export async function getCachedSurahDetail(nomor: number): Promise<SurahDetail | null> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('surahs', 'readonly');
      const req = tx.objectStore('surahs').get(nomor);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    const local = localStorage.getItem(`mq_surah_${nomor}`);
    return local ? JSON.parse(local) : null;
  }
}

export async function saveCachedSurahDetail(surah: SurahDetail): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction('surahs', 'readwrite');
    tx.objectStore('surahs').put(surah);
  } catch {
    try {
      localStorage.setItem(`mq_surah_${surah.nomor}`, JSON.stringify(surah));
    } catch {
      // ignore
    }
  }
}

export async function getCachedTafsir(nomor: number): Promise<SurahTafsir | null> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('tafsir', 'readonly');
      const req = tx.objectStore('tafsir').get(nomor);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function saveCachedTafsir(tafsir: SurahTafsir): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction('tafsir', 'readwrite');
    tx.objectStore('tafsir').put(tafsir);
  } catch {
    // ignore
  }
}
