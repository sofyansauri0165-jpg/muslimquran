import React, { useState, useEffect } from 'react';
import { SearchMatch, SurahSummary } from '../types/quran';
import {
  downloadFullQuranIndex,
  IndexStatus,
  searchQuran,
  subscribeIndexStatus,
} from '../services/searchIndexer';
import { Search, BookOpen, ExternalLink, DownloadCloud, CheckCircle, Loader2 } from 'lucide-react';

interface SearchViewProps {
  surahs: SurahSummary[];
  onOpenAyat: (surahNumber: number, ayatNumber: number) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ surahs, onOpenAyat }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchMatch[]>([]);
  const [status, setStatus] = useState<IndexStatus>({
    totalSurahs: 114,
    indexedSurahs: 0,
    isIndexing: false,
    isFullyIndexed: false,
  });
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeIndexStatus((st) => {
      setStatus(st);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const matches = searchQuran(query, surahs);
    setResults(matches);
  }, [query, surahs, status.indexedSurahs]);

  const handleDownloadIndex = async () => {
    await downloadFullQuranIndex((curr, total) => {
      setDownloadProgress(Math.round((curr / total) * 100));
    });
  };

  const sampleSearches = ['Sabar', 'Shalat', 'Sedekah', 'Syukur', 'Ikhlas', 'Surga', 'Yasin', '36'];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#064E3B] dark:text-[#FFF8E7] flex items-center gap-2">
          <Search className="w-6 h-6 text-[#D4AF37]" />
          Pencarian Global Al-Qur&apos;an
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
          Cari ayat berdasarkan nama surat, nomor surat, kata kunci dalam terjemahan bahasa Indonesia, atau frasa makna.
        </p>
      </div>

      {/* Index Status & Download Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#022C22] border border-[#047857]/20 dark:border-[#047857]/40 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#064E3B] dark:text-[#F5D782]">
                Status Indeks Pencarian:
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-[#047857] text-[#064E3B] dark:text-[#FFF8E7] font-semibold">
                {status.indexedSurahs} dari 114 Surat Terindeks
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {status.isFullyIndexed
                ? 'Seluruh 114 surat telah terindeks secara lengkap di memori perangkat Anda.'
                : 'Pencarian saat ini mencakup seluruh nama surat serta ayat-ayat surat yang telah dibuka.'}
            </p>
          </div>

          {!status.isFullyIndexed && (
            <button
              onClick={handleDownloadIndex}
              disabled={status.isIndexing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#064E3B] text-[#FFF8E7] hover:bg-[#047857] text-xs font-semibold disabled:opacity-50 transition cursor-pointer shrink-0"
            >
              {status.isIndexing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengindeks ({downloadProgress}%)...</span>
                </>
              ) : (
                <>
                  <DownloadCloud className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Unduh Indeks Lengkap</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Indexing Progress Bar */}
        {status.isIndexing && (
          <div className="w-full bg-gray-100 dark:bg-[#064E3B] h-1.5 rounded-full overflow-hidden mt-3">
            <div
              className="bg-[#D4AF37] h-full transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            ></div>
          </div>
        )}
      </div>

      {/* Main Search Input */}
      <div className="relative">
        <Search className="w-5 h-5 text-[#064E3B] dark:text-[#D4AF37] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ketik kata terjemahan, nama surat, atau topik (cth: sabar, shalat, rezeki, 18)..."
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white dark:bg-[#022C22] text-[#1F2937] dark:text-[#FFF8E7] text-sm sm:text-base border-2 border-[#047857]/30 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none shadow-sm transition"
          aria-label="Cari kata kunci dalam Al-Qur'an"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-white"
          >
            Hapus
          </button>
        )}
      </div>

      {/* Quick Search Suggestions */}
      {!query && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            Contoh Kata Kunci Populer:
          </p>
          <div className="flex flex-wrap gap-2">
            {sampleSearches.map((s) => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white dark:bg-[#022C22] border border-[#047857]/20 text-[#064E3B] dark:text-[#F5D782] hover:border-[#D4AF37] transition cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results Header */}
      {query && (
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
          <span>
            Ditemukan <strong>{results.length}</strong> hasil untuk &quot;{query}&quot;
          </span>
        </div>
      )}

      {/* Results List */}
      <div className="space-y-3">
        {results.map((match, idx) => (
          <div
            key={idx}
            onClick={() => onOpenAyat(match.surahNumber, match.ayatNumber)}
            className="p-5 rounded-2xl bg-white dark:bg-[#022C22] border border-[#047857]/20 dark:border-[#047857]/40 hover:border-[#D4AF37] transition cursor-pointer shadow-xs space-y-2.5 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[#064E3B] text-[#D4AF37] font-bold text-xs flex items-center justify-center shrink-0">
                  {match.surahNumber}:{match.ayatNumber}
                </span>
                <span className="font-bold text-sm text-[#064E3B] dark:text-[#FFF8E7] group-hover:text-[#047857] dark:group-hover:text-[#F5D782]">
                  QS. {match.surahNameLatin} ({match.surahNameArabic}) : Ayat {match.ayatNumber}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-[#047857] dark:text-[#D4AF37] flex items-center gap-1 group-hover:underline">
                <span>Buka</span>
                <ExternalLink className="w-3 h-3" />
              </span>
            </div>

            {/* Arabic snippet */}
            <p className="font-quran text-lg text-[#064E3B] dark:text-[#D4AF37] text-right">
              {match.teksArab}
            </p>

            {/* Translation match */}
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              &quot;{match.highlightSnippet}&quot;
            </p>
          </div>
        ))}

        {query && results.length === 0 && (
          <div className="rounded-2xl p-10 bg-white dark:bg-[#022C22] border border-[#047857]/20 text-center space-y-2">
            <Search className="w-8 h-8 text-gray-400 mx-auto" />
            <h3 className="text-base font-bold text-gray-700 dark:text-gray-200">
              Tidak Ditemukan Hasil
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              Tidak ada ayat atau nama surat yang cocok dengan kata kunci &quot;{query}&quot;. Cobalah kata dasar lain atau periksa ejaan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
