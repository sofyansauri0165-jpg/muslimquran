import { APP_CONFIG } from '../config/appConfig';
import { SurahDetail, SurahSummary, SurahTafsir } from '../types/quran';
import {
  getCachedSurahDetail,
  getCachedSurahList,
  getCachedTafsir,
  saveCachedSurahDetail,
  saveCachedSurahList,
  saveCachedTafsir,
} from './storage';

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

const TIMEOUT_MS = 12000;

async function fetchWithTimeoutAndRetry<T>(url: string, retries = 1): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const json: ApiResponse<T> = await response.json();
      if (json.code !== 200 || !json.data) {
        throw new Error(json.message || 'Respon API tidak valid');
      }

      return json.data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      const isLastAttempt = attempt === retries;

      if (isLastAttempt) {
        if (error.name === 'AbortError') {
          throw new Error('Permintaan API memakan waktu terlalu lama (timeout). Silakan periksa koneksi internet Anda.');
        }
        throw new Error(error.message || 'Gagal memuat data dari server.');
      }

      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  throw new Error('Gagal menghubungi server setelah beberapa percobaan.');
}

/**
 * Fetch all 114 surahs. Uses IndexedDB cache when offline or as immediate fallback.
 */
export async function getSurahList(): Promise<SurahSummary[]> {
  try {
    const data = await fetchWithTimeoutAndRetry<SurahSummary[]>(`${APP_CONFIG.apiBaseUrl}/surat`);
    await saveCachedSurahList(data);
    return data;
  } catch (networkError) {
    const cached = await getCachedSurahList();
    if (cached && cached.length > 0) {
      return cached;
    }
    throw networkError;
  }
}

/**
 * Fetch specific surah detail with all ayats, translations, and audio URLs.
 */
export async function getSurahDetail(nomor: number): Promise<SurahDetail> {
  try {
    const data = await fetchWithTimeoutAndRetry<SurahDetail>(`${APP_CONFIG.apiBaseUrl}/surat/${nomor}`);
    await saveCachedSurahDetail(data);
    return data;
  } catch (networkError) {
    const cached = await getCachedSurahDetail(nomor);
    if (cached) {
      return cached;
    }
    throw networkError;
  }
}

/**
 * Fetch tafsir for a specific surah.
 */
export async function getSurahTafsir(nomor: number): Promise<SurahTafsir> {
  try {
    const data = await fetchWithTimeoutAndRetry<SurahTafsir>(`${APP_CONFIG.apiBaseUrl}/tafsir/${nomor}`);
    await saveCachedTafsir(data);
    return data;
  } catch (networkError) {
    const cached = await getCachedTafsir(nomor);
    if (cached) {
      return cached;
    }
    throw networkError;
  }
}
