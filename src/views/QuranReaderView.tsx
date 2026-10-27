import React, { useEffect, useState, useRef } from 'react';
import { Ayat, Bookmark, SurahDetail, SurahTafsir, UserSettings } from '../types/quran';
import { getSurahDetail, getSurahTafsir } from '../services/quranApi';
import {
  addBookmark,
  getBookmarks,
  removeBookmark,
  saveLastRead,
  incrementTilawahAyat,
  addReadingHistory,
} from '../services/storage';
import { useAudio } from '../context/AudioContext';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { AutoScrollToolbar } from '../components/AutoScrollToolbar';
import {
  BookOpen,
  Bookmark as BookmarkIcon,
  BookmarkCheck,
  Play,
  Pause,
  Copy,
  Share2,
  ChevronLeft,
  ChevronRight,
  Info,
  Sliders,
  Check,
  Headphones,
  ScrollText,
  X,
  AlertCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';

interface QuranReaderViewProps {
  surahNumber: number;
  initialAyatNumber?: number;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onNavigateSurah: (num: number, ayatNum?: number) => void;
  onBack: () => void;
}

export const QuranReaderView: React.FC<QuranReaderViewProps> = ({
  surahNumber,
  initialAyatNumber,
  settings,
  onUpdateSettings,
  onNavigateSurah,
  onBack,
}) => {
  const [surah, setSurah] = useState<SurahDetail | null>(null);
  const [tafsirData, setTafsirData] = useState<SurahTafsir | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [copiedAyat, setCopiedAyat] = useState<number | null>(null);

  // Modals & Panels
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [activeTafsirAyat, setActiveTafsirAyat] = useState<number | null>(null);
  const [noteModalAyat, setNoteModalAyat] = useState<Ayat | null>(null);
  const [personalNoteText, setPersonalNoteText] = useState('');

  // Audio Context
  const { currentTrack, isPlaying, playAyat, playSurahFull, pause, resume, selectedQari } = useAudio();

  // Auto Scroll Hook
  const { scrollState, speed, setSpeed, start, pause: pauseScroll, resume: resumeScroll, stop } = useAutoScroll();

  const ayatRefs = useRef<Record<number, HTMLElement | null>>({});

  // Load Surah & Bookmarks
  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const detail = await getSurahDetail(surahNumber);
        if (!isMounted) return;
        setSurah(detail);

        // Fetch tafsir in background
        getSurahTafsir(surahNumber)
          .then((t) => {
            if (isMounted) setTafsirData(t);
          })
          .catch(() => {});

        // Load Bookmarks
        const bms = await getBookmarks();
        if (isMounted) setBookmarks(bms);

        // Record initial last read position
        const targetAyat = initialAyatNumber || 1;
        await saveLastRead({
          surahNumber: detail.nomor,
          surahNameLatin: detail.namaLatin,
          surahNameArabic: detail.nama,
          ayatNumber: targetAyat,
          totalAyat: detail.jumlahAyat,
          updatedAt: Date.now(),
        });

        // Record Reading history
        await addReadingHistory({
          id: `${detail.nomor}-${targetAyat}-${Date.now()}`,
          surahNumber: detail.nomor,
          surahNameLatin: detail.namaLatin,
          ayatNumber: targetAyat,
          timestamp: Date.now(),
        });
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Gagal memuat detail surat.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
      stop(); // stop auto-scroll on change or unmount
    };
  }, [surahNumber]);

  // Scroll to initial ayat if provided
  useEffect(() => {
    if (!loading && initialAyatNumber && ayatRefs.current[initialAyatNumber]) {
      setTimeout(() => {
        ayatRefs.current[initialAyatNumber]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [loading, initialAyatNumber]);

  // Check if verse is bookmarked
  const isBookmarked = (ayatNumber: number) => {
    return bookmarks.some((b) => b.surahNumber === surahNumber && b.ayatNumber === ayatNumber);
  };

  const handleToggleBookmark = async (ayat: Ayat) => {
    if (!surah) return;
    const existing = bookmarks.find((b) => b.surahNumber === surah.nomor && b.ayatNumber === ayat.nomorAyat);

    if (existing) {
      await removeBookmark(existing.id);
      setBookmarks((prev) => prev.filter((b) => b.id !== existing.id));
    } else {
      // Open note modal to allow optional personal note
      setPersonalNoteText('');
      setNoteModalAyat(ayat);
    }
  };

  const handleSaveBookmarkWithNote = async () => {
    if (!surah || !noteModalAyat) return;
    const newBm: Bookmark = {
      id: `${surah.nomor}_${noteModalAyat.nomorAyat}`,
      surahNumber: surah.nomor,
      surahNameLatin: surah.namaLatin,
      surahNameArabic: surah.nama,
      ayatNumber: noteModalAyat.nomorAyat,
      teksArab: noteModalAyat.teksArab,
      teksIndonesia: noteModalAyat.teksIndonesia,
      note: personalNoteText.trim() || undefined,
      createdAt: Date.now(),
    };
    await addBookmark(newBm);
    setBookmarks((prev) => [newBm, ...prev]);
    setNoteModalAyat(null);
  };

  // Copy verse text
  const handleCopyAyat = (ayat: Ayat) => {
    if (!surah) return;
    const textToCopy = `${ayat.teksArab}\n\n"${ayat.teksIndonesia}"\n\n(QS. ${surah.namaLatin} [${surah.nomor}]: ${ayat.nomorAyat}) — Muslim Quran`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedAyat(ayat.nomorAyat);
    setTimeout(() => setCopiedAyat(null), 2000);
  };

  // Share verse
  const handleShareAyat = (ayat: Ayat) => {
    if (!surah) return;
    const shareData = {
      title: `QS. ${surah.namaLatin} Ayat ${ayat.nomorAyat} — Muslim Quran`,
      text: `${ayat.teksArab}\n\n"${ayat.teksIndonesia}"\n\n(QS. ${surah.namaLatin}: ${ayat.nomorAyat})`,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      handleCopyAyat(ayat);
    }
  };

  // On reading ayat click: update progress & last read
  const handleAyatVisible = async (ayatNumber: number) => {
    if (!surah) return;
    await saveLastRead({
      surahNumber: surah.nomor,
      surahNameLatin: surah.namaLatin,
      surahNameArabic: surah.nama,
      ayatNumber,
      totalAyat: surah.jumlahAyat,
      updatedAt: Date.now(),
    });
    await incrementTilawahAyat(surah.nomor, ayatNumber);
  };

  const isCurrentAudioAyat = (ayatNumber: number) => {
    return (
      currentTrack?.surahNumber === surahNumber &&
      currentTrack.ayatNumber === ayatNumber &&
      isPlaying
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <Loader2 className="w-10 h-10 text-[#064E3B] dark:text-[#D4AF37] animate-spin mx-auto" />
        <p className="text-sm font-semibold text-[#064E3B] dark:text-[#FFF8E7]">
          Memuat teks suci Al-Qur&apos;an...
        </p>
      </div>
    );
  }

  if (error || !surah) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
        <h2 className="text-lg font-bold text-red-800 dark:text-red-200">Gagal Membuka Surat</h2>
        <p className="text-sm text-red-600 dark:text-red-300">{error || 'Surat tidak ditemukan.'}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-800 text-xs font-semibold"
          >
            Kembali
          </button>
          <button
            onClick={() => onNavigateSurah(surahNumber)}
            className="px-4 py-2 rounded-xl bg-[#064E3B] text-[#FFF8E7] text-xs font-semibold"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-36 animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-2 border-b border-[#047857]/20 pb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#022C22] text-[#064E3B] dark:text-[#FFF8E7] border border-[#047857]/20 hover:bg-[#064E3B]/10 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Daftar Surat</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Jump to Verse selector */}
          <select
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (val && ayatRefs.current[val]) {
                ayatRefs.current[val]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                handleAyatVisible(val);
              }
            }}
            className="bg-white dark:bg-[#022C22] text-xs text-[#064E3B] dark:text-[#FFF8E7] border border-[#047857]/30 rounded-xl px-2.5 py-1.5 focus:ring-1 focus:ring-[#D4AF37] cursor-pointer"
            aria-label="Pilih nomor ayat"
          >
            <option value="">Lompat ke Ayat...</option>
            {surah.ayat.map((a) => (
              <option key={a.nomorAyat} value={a.nomorAyat}>
                Ayat {a.nomorAyat}
              </option>
            ))}
          </select>

          {/* Reader Display Settings */}
          <button
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className="p-2 rounded-xl bg-white dark:bg-[#022C22] text-[#064E3B] dark:text-[#FFF8E7] border border-[#047857]/20 hover:border-[#D4AF37] cursor-pointer"
            title="Pengaturan Tampilan Baca"
            aria-label="Pengaturan Tampilan Baca"
          >
            <Sliders className="w-4 h-4 text-[#D4AF37]" />
          </button>
        </div>
      </div>

      {/* Reader Settings Drawer */}
      {showSettingsDrawer && (
        <div className="p-4 rounded-2xl bg-white dark:bg-[#022C22] border border-[#D4AF37] shadow-lg space-y-4 animate-in slide-in-from-top duration-150">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#047857]/40 pb-2">
            <span className="text-xs font-bold text-[#064E3B] dark:text-[#F5D782]">Pengaturan Membaca</span>
            <button
              onClick={() => setShowSettingsDrawer(false)}
              className="text-gray-400 hover:text-gray-700 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Arabic font size */}
            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Ukuran Teks Arab: <span className="text-[#047857] dark:text-[#D4AF37]">{settings.arabicFontSize}px</span>
              </label>
              <input
                type="range"
                min="22"
                max="44"
                step="2"
                value={settings.arabicFontSize}
                onChange={(e) => onUpdateSettings({ arabicFontSize: parseInt(e.target.value, 10) })}
                className="w-full accent-[#064E3B]"
              />
            </div>

            {/* Toggle Latin */}
            <div className="flex items-center justify-between sm:justify-start sm:gap-3">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Transliterasi Latin</label>
              <input
                type="checkbox"
                checked={settings.showLatin}
                onChange={(e) => onUpdateSettings({ showLatin: e.target.checked })}
                className="w-4 h-4 accent-[#064E3B] cursor-pointer"
              />
            </div>

            {/* Toggle Translation */}
            <div className="flex items-center justify-between sm:justify-start sm:gap-3">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Terjemahan Indonesia</label>
              <input
                type="checkbox"
                checked={settings.showTranslation}
                onChange={(e) => onUpdateSettings({ showTranslation: e.target.checked })}
                className="w-4 h-4 accent-[#064E3B] cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Surah Banner Card */}
      <div className="rounded-3xl bg-[#064E3B] text-[#FFF8E7] p-6 sm:p-8 text-center relative overflow-hidden border border-[#047857] shadow-md">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#022C22] text-[#F5D782] text-xs font-semibold border border-[#D4AF37]/30">
            <span>Surat ke-{surah.nomor}</span>
            <span>•</span>
            <span>{surah.tempatTurun}</span>
            <span>•</span>
            <span>{surah.jumlahAyat} Ayat</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#FFF8E7] tracking-tight">
            {surah.namaLatin}
          </h1>

          <p className="font-quran text-4xl sm:text-5xl text-[#D4AF37] py-2">
            {surah.nama}
          </p>

          <p className="text-sm text-[#F5D782] font-medium">
            Arti: &quot;{surah.arti}&quot;
          </p>

          {/* Action buttons inside header */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
            {/* Play Full Surah Audio */}
            {surah.audioFull && (
              <button
                onClick={() => {
                  const url = surah.audioFull[selectedQari] || Object.values(surah.audioFull)[0];
                  if (url) {
                    playSurahFull(surah.nomor, surah.namaLatin, url, surah.jumlahAyat);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4AF37] text-[#022C22] font-bold text-xs hover:bg-[#F5D782] transition shadow-xs cursor-pointer"
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>Putar Murottal Surat Lengkap</span>
              </button>
            )}

            {/* Surah Description Modal Toggle */}
            <button
              onClick={() => setShowInfoModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#022C22] text-[#FFF8E7] text-xs font-semibold hover:bg-[#047857] border border-[#047857] transition cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Deskripsi Surat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bismillah Card (Display for all surahs except Surah 9 At-Taubah, and note that in Al-Fatihah it is Ayat 1) */}
      {surah.nomor !== 9 && surah.nomor !== 1 && (
        <div className="rounded-2xl bg-[#FFF8E7] dark:bg-[#022C22] border border-[#D4AF37]/50 p-6 text-center shadow-xs">
          <p className="font-quran text-3xl sm:text-4xl text-[#064E3B] dark:text-[#D4AF37]">
            بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
            Dengan nama Allah Yang Maha Pengasih lagi Maha Penyayang
          </p>
        </div>
      )}

      {/* Verses List */}
      <div className="space-y-4">
        {surah.ayat.map((ayat) => {
          const bookmarked = isBookmarked(ayat.nomorAyat);
          const isAudioActive = isCurrentAudioAyat(ayat.nomorAyat);

          return (
            <article
              key={ayat.nomorAyat}
              ref={(el) => {
                ayatRefs.current[ayat.nomorAyat] = el;
              }}
              onClick={() => handleAyatVisible(ayat.nomorAyat)}
              className={`rounded-2xl p-5 sm:p-6 transition-all duration-200 border ${
                isAudioActive
                  ? 'bg-[#FFF8E7] dark:bg-[#064E3B]/80 border-[#D4AF37] ring-2 ring-[#D4AF37]/50 shadow-md'
                  : 'bg-white dark:bg-[#022C22] border-[#047857]/20 dark:border-[#047857]/40 hover:border-[#D4AF37]/60 shadow-xs'
              }`}
            >
              {/* Verse Action Bar & Ayat Number */}
              <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-gray-100 dark:border-[#047857]/30">
                {/* Number Badge */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs ${
                      isAudioActive
                        ? 'bg-[#D4AF37] text-[#022C22]'
                        : 'bg-[#064E3B] text-[#D4AF37]'
                    }`}
                  >
                    {surah.nomor}:{ayat.nomorAyat}
                  </div>
                  {bookmarked && (
                    <span className="text-[11px] font-semibold text-[#047857] dark:text-[#F5D782] flex items-center gap-1">
                      <BookmarkCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Bookmark</span>
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {/* Play Verse Audio */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isAudioActive) {
                        pause();
                      } else {
                        playAyat(surah.nomor, surah.namaLatin, ayat, surah.ayat);
                      }
                    }}
                    className={`p-2 rounded-xl transition cursor-pointer ${
                      isAudioActive
                        ? 'bg-[#D4AF37] text-[#022C22]'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-[#064E3B]/10 dark:hover:bg-[#047857]/30'
                    }`}
                    title={isAudioActive ? 'Jeda Audio' : 'Putar Audio Ayat'}
                    aria-label={`Putar audio ayat ${ayat.nomorAyat}`}
                  >
                    {isAudioActive ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4" />}
                  </button>

                  {/* Bookmark with optional note */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleBookmark(ayat);
                    }}
                    className={`p-2 rounded-xl transition cursor-pointer ${
                      bookmarked
                        ? 'text-[#D4AF37]'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-[#064E3B]/10 dark:hover:bg-[#047857]/30'
                    }`}
                    title={bookmarked ? 'Hapus Bookmark' : 'Tambah Bookmark & Catatan'}
                    aria-label={`Bookmark ayat ${ayat.nomorAyat}`}
                  >
                    {bookmarked ? (
                      <BookmarkCheck className="w-4 h-4 fill-current" />
                    ) : (
                      <BookmarkIcon className="w-4 h-4" />
                    )}
                  </button>

                  {/* Tafsir modal for this verse */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTafsirAyat(ayat.nomorAyat);
                    }}
                    className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-[#064E3B]/10 dark:hover:bg-[#047857]/30 transition cursor-pointer"
                    title="Lihat Tafsir Ayat Ini"
                    aria-label={`Lihat tafsir ayat ${ayat.nomorAyat}`}
                  >
                    <ScrollText className="w-4 h-4 text-[#047857] dark:text-[#D4AF37]" />
                  </button>

                  {/* Copy */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyAyat(ayat);
                    }}
                    className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-[#064E3B]/10 dark:hover:bg-[#047857]/30 transition cursor-pointer"
                    title="Salin Ayat & Terjemahan"
                    aria-label={`Salin ayat ${ayat.nomorAyat}`}
                  >
                    {copiedAyat === ayat.nomorAyat ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  {/* Share */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShareAyat(ayat);
                    }}
                    className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-[#064E3B]/10 dark:hover:bg-[#047857]/30 transition cursor-pointer"
                    title="Bagikan Ayat"
                    aria-label={`Bagikan ayat ${ayat.nomorAyat}`}
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Arabic Verse Text with Full Harakat */}
              <div
                className="font-quran text-[#064E3B] dark:text-[#FFF8E7] mb-4 selection:bg-[#D4AF37]/40"
                style={{ fontSize: `${settings.arabicFontSize}px` }}
              >
                {ayat.teksArab}
              </div>

              {/* Transliteration (Latin) */}
              {settings.showLatin && ayat.teksLatin && (
                <p className="text-xs sm:text-sm text-[#047857] dark:text-[#F5D782] font-medium leading-relaxed mb-2.5">
                  {ayat.teksLatin}
                </p>
              )}

              {/* Indonesian Translation */}
              {settings.showTranslation && (
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {ayat.teksIndonesia}
                </p>
              )}
            </article>
          );
        })}
      </div>

      {/* Surah Navigation Footer */}
      <div className="flex items-center justify-between gap-4 pt-6 border-t border-[#047857]/20">
        {surah.suratSebelumnya ? (
          <button
            onClick={() => onNavigateSurah((surah.suratSebelumnya as any).nomor)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#022C22] border border-[#047857]/30 text-xs font-semibold hover:border-[#D4AF37] text-[#064E3B] dark:text-[#FFF8E7] cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <div className="text-left">
              <span className="block text-[10px] text-gray-500">Surat Sebelumnya</span>
              <span>{(surah.suratSebelumnya as any).namaLatin}</span>
            </div>
          </button>
        ) : (
          <div></div>
        )}

        {surah.suratSelanjutnya ? (
          <button
            onClick={() => onNavigateSurah((surah.suratSelanjutnya as any).nomor)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#022C22] border border-[#047857]/30 text-xs font-semibold hover:border-[#D4AF37] text-[#064E3B] dark:text-[#FFF8E7] cursor-pointer"
          >
            <div className="text-right">
              <span className="block text-[10px] text-gray-500">Surat Selanjutnya</span>
              <span>{(surah.suratSelanjutnya as any).namaLatin}</span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div></div>
        )}
      </div>

      {/* Auto-scroll floating toolbar */}
      <AutoScrollToolbar
        scrollState={scrollState}
        speed={speed}
        onSpeedChange={setSpeed}
        onStart={start}
        onPause={pauseScroll}
        onResume={resumeScroll}
        onStop={stop}
      />

      {/* Surah Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#022C22] text-[#1F2937] dark:text-[#FFF8E7] p-6 shadow-2xl border border-[#D4AF37] max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#047857]/40 mb-4">
              <h3 className="font-bold text-base text-[#064E3B] dark:text-[#FFF8E7] flex items-center gap-2">
                <Info className="w-5 h-5 text-[#D4AF37]" />
                Deskripsi Surat {surah.namaLatin}
              </h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed prose prose-sm dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: surah.deskripsi }}
            />

            <button
              onClick={() => setShowInfoModal(false)}
              className="mt-6 w-full py-2.5 rounded-xl bg-[#064E3B] text-[#FFF8E7] font-semibold text-xs hover:bg-[#047857] transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Per-Verse Tafsir Modal */}
      {activeTafsirAyat !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#022C22] text-[#1F2937] dark:text-[#FFF8E7] p-6 shadow-2xl border border-[#D4AF37] max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#047857]/40 mb-4">
              <div>
                <h3 className="font-bold text-base text-[#064E3B] dark:text-[#FFF8E7] flex items-center gap-2">
                  <ScrollText className="w-5 h-5 text-[#D4AF37]" />
                  Tafsir QS. {surah.namaLatin}: Ayat {activeTafsirAyat}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Sumber: Tafsir Ringkas Kementerian Agama RI (Kemenag)
                </p>
              </div>
              <button
                onClick={() => setActiveTafsirAyat(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tafsir Content */}
            {tafsirData ? (
              (() => {
                const match = tafsirData.tafsir.find((t) => t.ayat === activeTafsirAyat);
                if (match) {
                  return (
                    <div className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-line space-y-3">
                      {match.teks}
                    </div>
                  );
                }
                return (
                  <p className="text-sm text-gray-500 py-6 text-center">
                    Tafsir untuk ayat ini belum tersedia dari sumber data.
                  </p>
                );
              })()
            ) : (
              <div className="py-8 text-center space-y-2">
                <Loader2 className="w-6 h-6 text-[#047857] animate-spin mx-auto" />
                <p className="text-xs text-gray-500">Memuat data tafsir dari server...</p>
              </div>
            )}

            <button
              onClick={() => setActiveTafsirAyat(null)}
              className="mt-6 w-full py-2.5 rounded-xl bg-[#064E3B] text-[#FFF8E7] font-semibold text-xs hover:bg-[#047857] transition cursor-pointer"
            >
              Tutup Tafsir
            </button>
          </div>
        </div>
      )}

      {/* Bookmark with Personal Note Modal */}
      {noteModalAyat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#022C22] text-[#1F2937] dark:text-[#FFF8E7] p-6 shadow-2xl border border-[#D4AF37]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#047857]/40 mb-3">
              <h3 className="font-bold text-sm text-[#064E3B] dark:text-[#FFF8E7] flex items-center gap-2">
                <BookmarkIcon className="w-4 h-4 text-[#D4AF37]" />
                Simpan Bookmark (Ayat {noteModalAyat.nomorAyat})
              </h3>
              <button
                onClick={() => setNoteModalAyat(null)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
              &quot;{noteModalAyat.teksIndonesia}&quot;
            </p>

            <div className="space-y-1.5 mb-4">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Catatan Pribadi (Opsional):
              </label>
              <textarea
                value={personalNoteText}
                onChange={(e) => setPersonalNoteText(e.target.value)}
                placeholder="Tuliskan renungan, tadabbur, atau pengingat untuk ayat ini..."
                rows={3}
                className="w-full p-2.5 rounded-xl text-xs bg-gray-50 dark:bg-[#064E3B]/40 border border-gray-200 dark:border-[#047857] focus:ring-1 focus:ring-[#D4AF37] outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setNoteModalAyat(null)}
                className="px-4 py-2 rounded-xl text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveBookmarkWithNote}
                className="px-5 py-2 rounded-xl text-xs bg-[#064E3B] text-[#FFF8E7] hover:bg-[#047857] font-semibold cursor-pointer shadow-xs"
              >
                Simpan Bookmark
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
