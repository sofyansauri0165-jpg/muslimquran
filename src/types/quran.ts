export interface SurahSummary {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
  tempatTurun: 'Mekah' | 'Madinah' | string;
  arti: string;
  deskripsi: string;
  audioFull: Record<string, string>;
}

export interface Ayat {
  nomorAyat: number;
  teksArab: string;
  teksLatin: string;
  teksIndonesia: string;
  audio: Record<string, string>;
}

export interface SurahNav {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
}

export interface SurahDetail {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
  tempatTurun: string;
  arti: string;
  deskripsi: string;
  audioFull: Record<string, string>;
  ayat: Ayat[];
  suratSelanjutnya: SurahNav | false;
  suratSebelumnya: SurahNav | false;
}

export interface TafsirAyat {
  ayat: number;
  teks: string;
}

export interface SurahTafsir {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
  tempatTurun: string;
  arti: string;
  deskripsi: string;
  tafsir: TafsirAyat[];
  suratSelanjutnya?: SurahNav | false;
  suratSebelumnya?: SurahNav | false;
}

export interface Bookmark {
  id: string;
  surahNumber: number;
  surahNameLatin: string;
  surahNameArabic: string;
  ayatNumber: number;
  teksArab: string;
  teksIndonesia: string;
  note?: string;
  createdAt: number;
}

export interface ReadingHistoryItem {
  id: string;
  surahNumber: number;
  surahNameLatin: string;
  ayatNumber: number;
  timestamp: number;
}

export interface LastRead {
  surahNumber: number;
  surahNameLatin: string;
  surahNameArabic: string;
  ayatNumber: number;
  totalAyat: number;
  updatedAt: number;
}

export interface UserSettings {
  arabicFontSize: number;
  showLatin: boolean;
  showTranslation: boolean;
  theme: 'light' | 'dark';
  defaultQari: string;
  dailyGoalAyat: number;
  autoScrollSpeed: number;
}

export interface SearchMatch {
  surahNumber: number;
  surahNameLatin: string;
  surahNameArabic: string;
  ayatNumber: number;
  teksArab: string;
  teksIndonesia: string;
  matchedField: 'surah' | 'translation' | 'ayat';
  highlightSnippet: string;
}
