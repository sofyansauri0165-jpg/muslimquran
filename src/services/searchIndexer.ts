import { SearchMatch, SurahDetail, SurahSummary } from '../types/quran';
import { getSurahDetail, getSurahList } from './quranApi';
import { getCachedSurahDetail } from './storage';

export interface IndexStatus {
  totalSurahs: number;
  indexedSurahs: number;
  isIndexing: boolean;
  isFullyIndexed: boolean;
  error?: string;
}

// In-memory index of verses
let indexedVerses: {
  surahNumber: number;
  surahNameLatin: string;
  surahNameArabic: string;
  ayatNumber: number;
  teksArab: string;
  teksIndonesia: string;
  normalizedTranslation: string;
}[] = [];

let surahSummariesCache: SurahSummary[] = [];
let indexingListeners: ((status: IndexStatus) => void)[] = [];

let currentStatus: IndexStatus = {
  totalSurahs: 114,
  indexedSurahs: 0,
  isIndexing: false,
  isFullyIndexed: false,
};

function notifyStatus() {
  indexingListeners.forEach((listener) => listener({ ...currentStatus }));
}

export function subscribeIndexStatus(listener: (status: IndexStatus) => void) {
  indexingListeners.push(listener);
  listener({ ...currentStatus });
  return () => {
    indexingListeners = indexingListeners.filter((l) => l !== listener);
  };
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Add a surah's verses to search index
 */
export function addSurahToSearchIndex(surah: SurahDetail) {
  const existing = indexedVerses.some((v) => v.surahNumber === surah.nomor);
  if (!existing) {
    const verses = surah.ayat.map((a: { nomorAyat: number; teksArab: string; teksIndonesia: string }) => ({
      surahNumber: surah.nomor,
      surahNameLatin: surah.namaLatin,
      surahNameArabic: surah.nama,
      ayatNumber: a.nomorAyat,
      teksArab: a.teksArab,
      teksIndonesia: a.teksIndonesia,
      normalizedTranslation: normalizeText(a.teksIndonesia),
    }));
    indexedVerses.push(...verses);
  }

  // Update status count
  const uniqueSurahs = new Set(indexedVerses.map((v) => v.surahNumber)).size;
  currentStatus.indexedSurahs = uniqueSurahs;
  currentStatus.isFullyIndexed = uniqueSurahs >= 114;
  notifyStatus();
}

/**
 * Initialize search indexing. Checks cached surahs in IndexedDB first.
 */
export async function initSearchIndex(surahs?: SurahSummary[]): Promise<void> {
  if (surahs) {
    surahSummariesCache = surahs;
  } else if (surahSummariesCache.length === 0) {
    try {
      surahSummariesCache = await getSurahList();
    } catch {
      // offline or not loaded yet
    }
  }

  // Check which surahs are already in cached storage
  let loadedCount = 0;
  for (let i = 1; i <= 114; i++) {
    const cached = await getCachedSurahDetail(i);
    if (cached) {
      addSurahToSearchIndex(cached);
      loadedCount++;
    }
  }

  currentStatus.indexedSurahs = loadedCount;
  currentStatus.isFullyIndexed = loadedCount >= 114;
  notifyStatus();
}

/**
 * Download and index all 114 surahs on user demand.
 */
export async function downloadFullQuranIndex(onProgress?: (curr: number, total: number) => void): Promise<void> {
  if (currentStatus.isIndexing) return;

  currentStatus.isIndexing = true;
  notifyStatus();

  try {
    for (let i = 1; i <= 114; i++) {
      // Check if already indexed
      const already = indexedVerses.some((v) => v.surahNumber === i);
      if (!already) {
        try {
          const detail = await getSurahDetail(i);
          addSurahToSearchIndex(detail);
        } catch (e) {
          console.warn(`Surah ${i} index fetch skipped`, e);
        }
      }

      onProgress?.(i, 114);
      currentStatus.indexedSurahs = new Set(indexedVerses.map((v) => v.surahNumber)).size;
      notifyStatus();
    }

    currentStatus.isFullyIndexed = currentStatus.indexedSurahs >= 114;
  } catch (err: any) {
    currentStatus.error = err.message;
  } finally {
    currentStatus.isIndexing = false;
    notifyStatus();
  }
}

/**
 * Search across surahs and indexed verses.
 */
export function searchQuran(query: string, surahs: SurahSummary[]): SearchMatch[] {
  const cleanQuery = normalizeText(query);
  if (!cleanQuery) return [];

  const results: SearchMatch[] = [];
  const queryNum = parseInt(cleanQuery, 10);

  // 1. Match by Surah Number or Name
  surahs.forEach((surah) => {
    const nameMatch = normalizeText(surah.namaLatin).includes(cleanQuery);
    const meaningMatch = normalizeText(surah.arti).includes(cleanQuery);
    const numMatch = !isNaN(queryNum) && surah.nomor === queryNum;

    if (nameMatch || meaningMatch || numMatch) {
      results.push({
        surahNumber: surah.nomor,
        surahNameLatin: surah.namaLatin,
        surahNameArabic: surah.nama,
        ayatNumber: 1,
        teksArab: surah.nama,
        teksIndonesia: `Surah ke-${surah.nomor} • ${surah.arti} • ${surah.jumlahAyat} ayat`,
        matchedField: 'surah',
        highlightSnippet: surah.namaLatin + ' (' + surah.arti + ')',
      });
    }
  });

  // 2. Match across Indexed Verses (translation text and verse numbers)
  for (const v of indexedVerses) {
    if (results.length >= 60) break; // limit to 60 responsive matches

    // Translation keyword or phrase match
    if (v.normalizedTranslation.includes(cleanQuery)) {
      // Create a nice snippet with surrounding context
      const idx = v.normalizedTranslation.indexOf(cleanQuery);
      const start = Math.max(0, idx - 40);
      const end = Math.min(v.teksIndonesia.length, idx + cleanQuery.length + 60);
      const prefix = start > 0 ? '...' : '';
      const suffix = end < v.teksIndonesia.length ? '...' : '';
      const snippet = prefix + v.teksIndonesia.substring(start, end).trim() + suffix;

      results.push({
        surahNumber: v.surahNumber,
        surahNameLatin: v.surahNameLatin,
        surahNameArabic: v.surahNameArabic,
        ayatNumber: v.ayatNumber,
        teksArab: v.teksArab,
        teksIndonesia: v.teksIndonesia,
        matchedField: 'translation',
        highlightSnippet: snippet,
      });
    }
  }

  return results;
}
