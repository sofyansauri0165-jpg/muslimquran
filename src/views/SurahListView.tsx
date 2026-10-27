import React, { useState, useMemo } from 'react';
import { SurahSummary } from '../types/quran';
import { Search, MapPin, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';

interface SurahListViewProps {
  surahs: SurahSummary[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelectSurah: (surahNumber: number) => void;
}

export const SurahListView: React.FC<SurahListViewProps> = ({
  surahs,
  isLoading,
  error,
  onRetry,
  onSelectSurah,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'Mekah' | 'Madinah'>('all');

  const filteredSurahs = useMemo(() => {
    return surahs.filter((surah) => {
      const matchFilter =
        filterType === 'all' ||
        (filterType === 'Mekah' && surah.tempatTurun.toLowerCase() === 'mekah') ||
        (filterType === 'Madinah' && surah.tempatTurun.toLowerCase() === 'madinah');

      if (!matchFilter) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const numMatch = surah.nomor.toString() === q;
      const nameMatch = surah.namaLatin.toLowerCase().includes(q);
      const meaningMatch = surah.arti.toLowerCase().includes(q);

      return numMatch || nameMatch || meaningMatch;
    });
  }, [surahs, searchQuery, filterType]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#047857]/20 dark:border-[#047857]/40">
        <div>
          <h1 className="text-2xl font-bold text-[#064E3B] dark:text-[#FFF8E7] flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#D4AF37]" />
            Daftar 114 Surat Al-Qur&apos;an
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
            Cari berdasarkan nama latin, nomor surat, atau arti surat dalam bahasa Indonesia.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#064E3B] dark:text-[#F5D782] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari surat atau arti... (cth: Yasin, 36)"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#022C22] text-[#1F2937] dark:text-[#FFF8E7] text-sm border border-[#047857]/30 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition"
            aria-label="Cari surat Al-Qur'an"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              Hapus
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-xl font-semibold transition cursor-pointer ${
            filterType === 'all'
              ? 'bg-[#064E3B] text-[#FFF8E7] shadow-xs'
              : 'bg-white dark:bg-[#022C22] text-gray-700 dark:text-gray-300 hover:bg-[#064E3B]/10 border border-[#047857]/20'
          }`}
        >
          Semua ({surahs.length})
        </button>
        <button
          onClick={() => setFilterType('Mekah')}
          className={`px-4 py-2 rounded-xl font-semibold transition cursor-pointer ${
            filterType === 'Mekah'
              ? 'bg-[#064E3B] text-[#FFF8E7] shadow-xs'
              : 'bg-white dark:bg-[#022C22] text-gray-700 dark:text-gray-300 hover:bg-[#064E3B]/10 border border-[#047857]/20'
          }`}
        >
          Makkiyyah ({surahs.filter((s) => s.tempatTurun.toLowerCase() === 'mekah').length})
        </button>
        <button
          onClick={() => setFilterType('Madinah')}
          className={`px-4 py-2 rounded-xl font-semibold transition cursor-pointer ${
            filterType === 'Madinah'
              ? 'bg-[#064E3B] text-[#FFF8E7] shadow-xs'
              : 'bg-white dark:bg-[#022C22] text-gray-700 dark:text-gray-300 hover:bg-[#064E3B]/10 border border-[#047857]/20'
          }`}
        >
          Madaniyyah ({surahs.filter((s) => s.tempatTurun.toLowerCase() === 'madinah').length})
        </button>
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-gray-200 dark:bg-[#022C22]/80 border border-gray-100 dark:border-gray-800"></div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="rounded-2xl p-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
          <h3 className="text-base font-bold text-red-800 dark:text-red-200">Gagal Memuat Daftar Surat</h3>
          <p className="text-xs text-red-600 dark:text-red-300 max-w-md mx-auto">{error}</p>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#064E3B] text-[#FFF8E7] text-xs font-semibold hover:bg-[#047857] transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Coba Lagi</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredSurahs.length === 0 && (
        <div className="rounded-2xl p-10 bg-white dark:bg-[#022C22] border border-[#047857]/20 text-center space-y-3">
          <Search className="w-8 h-8 text-gray-400 mx-auto" />
          <h3 className="text-base font-bold text-gray-700 dark:text-gray-200">Surat Tidak Ditemukan</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Tidak ada surat yang sesuai dengan kata kunci &quot;{searchQuery}&quot;. Silakan coba nama lain atau nomor surat.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterType('all');
            }}
            className="text-xs font-semibold text-[#047857] dark:text-[#F5D782] underline cursor-pointer"
          >
            Reset Pencarian
          </button>
        </div>
      )}

      {/* Surah Grid */}
      {!isLoading && !error && filteredSurahs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredSurahs.map((surah) => (
            <button
              key={surah.nomor}
              onClick={() => onSelectSurah(surah.nomor)}
              className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#022C22] border border-[#047857]/20 dark:border-[#047857]/40 hover:border-[#D4AF37] transition text-left cursor-pointer group shadow-xs focus:ring-2 focus:ring-[#D4AF37] outline-none"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Number Badge */}
                <div className="w-10 h-10 rounded-xl bg-[#064E3B] text-[#D4AF37] group-hover:bg-[#047857] flex items-center justify-center font-bold text-sm shrink-0 transition-colors shadow-xs">
                  {surah.nomor}
                </div>

                {/* Details */}
                <div className="min-w-0">
                  <h3 className="font-bold text-sm sm:text-base text-[#064E3B] dark:text-[#FFF8E7] truncate group-hover:text-[#047857] dark:group-hover:text-[#F5D782]">
                    {surah.namaLatin}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    <span className="truncate">{surah.arti}</span>
                    <span>•</span>
                    <span className="shrink-0">{surah.jumlahAyat} ayat</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-[#047857] dark:text-[#F5D782] font-medium mt-1">
                    <MapPin className="w-3 h-3" />
                    <span>{surah.tempatTurun}</span>
                  </div>
                </div>
              </div>

              {/* Arabic Name */}
              <div className="font-quran text-2xl text-[#064E3B] dark:text-[#D4AF37] pl-2 shrink-0">
                {surah.nama}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
