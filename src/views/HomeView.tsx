import React, { useEffect, useState } from 'react';
import { APP_CONFIG } from '../config/appConfig';
import { LastRead, SurahSummary } from '../types/quran';
import { getLastRead, getTodayTilawahProgress, DailyTilawahProgress, getUserSettings } from '../services/storage';
import { calculatePrayerTimes, DEFAULT_PRAYER_SETTINGS } from '../services/prayerTimeService';
import { getHijriDate } from '../services/hijriService';
import { PrayerSettings } from '../types/prayerAndHijri';
import {
  BookOpen,
  Bookmark,
  Search,
  Headphones,
  ArrowRight,
  Flame,
  CheckCircle2,
  Calendar,
  Sparkles,
  WifiOff,
  Clock,
  MapPin,
} from 'lucide-react';
import { NavView } from '../components/Navbar';
import { useOnlineStatus } from '../hooks/usePWA';

interface HomeViewProps {
  surahs: SurahSummary[];
  onNavigate: (view: NavView, params?: any) => void;
  onOpenSurah: (surahNumber: number, targetAyat?: number) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ surahs, onNavigate, onOpenSurah }) => {
  const isOnline = useOnlineStatus();
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [progress, setProgress] = useState<DailyTilawahProgress | null>(null);
  const [dailyGoal, setDailyGoal] = useState<number>(10);
  const [now, setNow] = useState(new Date());

  const [prayerSettings, setPrayerSettings] = useState<PrayerSettings>(() => {
    try {
      const saved = localStorage.getItem('mq_prayer_settings');
      return saved ? JSON.parse(saved) : DEFAULT_PRAYER_SETTINGS;
    } catch {
      return DEFAULT_PRAYER_SETTINGS;
    }
  });

  const [hijriAdjustment, setHijriAdjustment] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('mq_hijri_adjustment');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    async function loadData() {
      const lr = await getLastRead();
      setLastRead(lr);

      const prog = await getTodayTilawahProgress();
      setProgress(prog);

      const settings = await getUserSettings();
      setDailyGoal(settings.dailyGoalAyat || 10);
    }
    loadData();

    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hijriDateInfo = getHijriDate(now, hijriAdjustment);
  const { items, nextPrayer, countdown } = calculatePrayerTimes(now, prayerSettings);

  const quickSurahs = [
    { num: 1, name: 'Al-Fatihah', arti: 'Pembukaan', ayat: 7 },
    { num: 18, name: 'Al-Kahf', arti: 'Gua', ayat: 110 },
    { num: 36, name: 'Yasin', arti: 'Ya Sin', ayat: 83 },
    { num: 55, name: 'Ar-Rahman', arti: 'Yang Maha Pengasih', ayat: 78 },
    { num: 67, name: 'Al-Mulk', arti: 'Kerajaan', ayat: 30 },
    { num: 112, name: 'Al-Ikhlas', arti: 'Kemurnian Keesaan', ayat: 4 },
  ];

  const readCount = progress?.readCount || 0;
  const percentage = Math.min(100, Math.round((readCount / dailyGoal) * 100));

  const formatCountdown = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Network Status Banner if Offline */}
      {!isOnline && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-amber-900/40 border border-amber-600/50 text-amber-200 text-xs">
          <WifiOff className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            Mode Offline aktif — Anda tetap dapat membaca surah dan melihat jadwal salat yang tersimpan.
          </span>
        </div>
      )}

      {/* Hero Greeting Section with Live Hijri Date */}
      <div className="rounded-3xl bg-[#064E3B] text-[#FFF8E7] p-6 sm:p-8 border border-[#047857]/50 shadow-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#022C22] text-[#F5D782] text-xs font-semibold border border-[#D4AF37]/40">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Assalamu&apos;alaikum Warahmatullahi Wabarakatuh</span>
              </span>

              {/* Hijri Date Badge */}
              <button
                onClick={() => onNavigate('hijriCalendar')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#022C22] text-white text-xs font-semibold border border-[#047857] hover:border-[#D4AF37] transition cursor-pointer"
                title="Buka Kalender Hijriah"
              >
                <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{hijriDateInfo.formatted}</span>
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#FFF8E7]">
              {APP_CONFIG.appName}
            </h1>
            <p className="text-xs sm:text-sm text-[#F5D782]/90 leading-relaxed">
              {APP_CONFIG.tagline}. Al-Qur&apos;an digital dengan teks Arab akurat, audio murottal 6 qari, jadwal 5 waktu salat dengan azan, dan kalender Hijriah.
            </p>
          </div>

          {/* Quick CTA to Surah list */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => onNavigate('surahList')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#D4AF37] text-[#022C22] font-bold text-sm hover:bg-[#F5D782] transition shadow-md cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Buka Daftar Surat</span>
            </button>
            <button
              onClick={() => onNavigate('prayerTimes')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#022C22] text-[#FFF8E7] font-semibold text-sm hover:bg-[#047857] border border-[#047857] transition cursor-pointer"
            >
              <Clock className="w-4 h-4 text-[#D4AF37]" />
              <span>Jadwal Salat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Widget Jadwal Salat Harian di Beranda */}
      <div className="rounded-2xl bg-white dark:bg-[#022C22] border border-[#047857]/20 dark:border-[#047857]/40 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#D4AF37]" />
            <div>
              <h2 className="font-bold text-sm sm:text-base text-[#064E3B] dark:text-[#FFF8E7]">
                Jadwal Salat Hari Ini ({prayerSettings.location.name})
              </h2>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                {hijriDateInfo.gregorianFormatted}
              </span>
            </div>
          </div>

          {nextPrayer && (
            <div className="flex items-center gap-2 bg-[#064E3B] text-[#FFF8E7] px-3 py-1.5 rounded-xl text-xs font-semibold">
              <span className="text-[#F5D782]">{nextPrayer.nameIndo}:</span>
              <span className="font-mono text-sm font-bold text-[#D4AF37]">
                {formatCountdown(countdown.hours)}:{formatCountdown(countdown.minutes)}:{formatCountdown(countdown.seconds)}
              </span>
            </div>
          )}
        </div>

        {/* 5 Waktu Salat + Imsak + Syuruq Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`p-2.5 rounded-xl text-center border transition ${
                item.isNext
                  ? 'bg-[#064E3B] text-[#FFF8E7] border-[#D4AF37] ring-2 ring-[#D4AF37]/40 shadow-xs'
                  : 'bg-gray-50 dark:bg-[#064E3B]/20 border-gray-100 dark:border-[#047857]/30'
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-wider block ${
                  item.isNext ? 'text-[#F5D782]' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {item.nameIndo}
              </span>
              <span
                className={`text-lg font-bold font-mono my-0.5 block ${
                  item.isNext ? 'text-[#D4AF37]' : 'text-[#064E3B] dark:text-[#FFF8E7]'
                }`}
              >
                {item.time}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100 dark:border-[#047857]/30 text-xs">
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            Kemenag RI / SIHAT • Audio Azan Otomatis
          </span>
          <button
            onClick={() => onNavigate('prayerTimes')}
            className="text-xs font-semibold text-[#047857] dark:text-[#F5D782] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Selengkapnya</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tilawah Progress & Last Read Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Lanjut Membaca */}
        <div className="rounded-2xl bg-white dark:bg-[#022C22] border border-[#047857]/20 dark:border-[#047857]/40 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-bold tracking-wider text-[#047857] dark:text-[#F5D782] flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#D4AF37]" />
                Posisi Terakhir Dibaca
              </span>
              {lastRead && (
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  Tersimpan otomatis
                </span>
              )}
            </div>

            {lastRead ? (
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-[#064E3B] dark:text-[#FFF8E7]">
                      {lastRead.surahNameLatin}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      Surat ke-{lastRead.surahNumber} • Ayat ke-{lastRead.ayatNumber} dari {lastRead.totalAyat} ayat
                    </p>
                  </div>
                  <span className="font-quran text-2xl text-[#064E3B] dark:text-[#D4AF37]">
                    {lastRead.surahNameArabic}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-2">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Belum ada posisi bacaan yang tersimpan. Mulai tilawah sekarang dari Surah Al-Fatihah.
                </p>
              </div>
            )}
          </div>

          <div className="pt-5 mt-4 border-t border-gray-100 dark:border-[#047857]/30">
            {lastRead ? (
              <button
                onClick={() => onOpenSurah(lastRead.surahNumber, lastRead.ayatNumber)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#064E3B] text-[#FFF8E7] hover:bg-[#047857] font-semibold text-sm transition cursor-pointer"
              >
                <span>Lanjutkan Bacaan (Ayat {lastRead.ayatNumber})</span>
                <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
              </button>
            ) : (
              <button
                onClick={() => onOpenSurah(1, 1)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#064E3B] text-[#FFF8E7] hover:bg-[#047857] font-semibold text-sm transition cursor-pointer"
              >
                <span>Mulai Membaca Surah Pertama</span>
                <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Progres & Target Tilawah Hari Ini */}
        <div className="rounded-2xl bg-white dark:bg-[#022C22] border border-[#047857]/20 dark:border-[#047857]/40 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-bold tracking-wider text-[#047857] dark:text-[#F5D782] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                Target Tilawah Hari Ini
              </span>
              <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-[#D4AF37] bg-amber-50 dark:bg-[#064E3B] px-2 py-0.5 rounded-full">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>Streak {progress?.streak || 1} Hari</span>
              </div>
            </div>

            <div className="flex items-baseline justify-between mt-2 mb-2">
              <span className="text-2xl font-extrabold text-[#064E3B] dark:text-[#FFF8E7]">
                {readCount} <span className="text-sm font-medium text-gray-500 dark:text-gray-400">/ {dailyGoal} Ayat</span>
              </span>
              <span className="text-sm font-bold text-[#047857] dark:text-[#D4AF37]">
                {percentage}% Tercapai
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 dark:bg-[#064E3B] h-3 rounded-full overflow-hidden">
              <div
                className="bg-[#D4AF37] h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {percentage >= 100
                ? 'Alhamdulillah, target tilawah hari ini telah tercapai!'
                : `Masih tersisa ${Math.max(0, dailyGoal - readCount)} ayat untuk memenuhi target harian Anda.`}
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-gray-100 dark:border-[#047857]/30 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Dapat disesuaikan di menu Pengaturan
            </span>
            <button
              onClick={() => onNavigate('settings')}
              className="text-xs font-semibold text-[#064E3B] dark:text-[#F5D782] hover:underline cursor-pointer"
            >
              Ubah Target
            </button>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div>
        <h2 className="text-lg font-bold text-[#064E3B] dark:text-[#FFF8E7] mb-4 flex items-center gap-2">
          <span>Akses Cepat Fitur Utama</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => onNavigate('surahList')}
            className="p-4 rounded-2xl bg-white dark:bg-[#022C22] border border-[#047857]/20 dark:border-[#047857]/40 hover:border-[#D4AF37] text-left transition group cursor-pointer shadow-xs"
          >
            <div className="w-9 h-9 rounded-xl bg-[#064E3B] text-[#D4AF37] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-[#064E3B] dark:text-[#FFF8E7]">Daftar Surat</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">114 surat</p>
          </button>

          <button
            onClick={() => onNavigate('prayerTimes')}
            className="p-4 rounded-2xl bg-white dark:bg-[#022C22] border border-[#047857]/20 dark:border-[#047857]/40 hover:border-[#D4AF37] text-left transition group cursor-pointer shadow-xs"
          >
            <div className="w-9 h-9 rounded-xl bg-[#064E3B] text-[#D4AF37] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-[#064E3B] dark:text-[#FFF8E7]">Jadwal Salat</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">5 waktu & azan</p>
          </button>

          <button
            onClick={() => onNavigate('hijriCalendar')}
            className="p-4 rounded-2xl bg-white dark:bg-[#022C22] border border-[#047857]/20 dark:border-[#047857]/40 hover:border-[#D4AF37] text-left transition group cursor-pointer shadow-xs"
          >
            <div className="w-9 h-9 rounded-xl bg-[#064E3B] text-[#D4AF37] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-[#064E3B] dark:text-[#FFF8E7]">Kalender Hijriah</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Umm al-Qura</p>
          </button>

          <button
            onClick={() => onNavigate('bookmarks')}
            className="p-4 rounded-2xl bg-white dark:bg-[#022C22] border border-[#047857]/20 dark:border-[#047857]/40 hover:border-[#D4AF37] text-left transition group cursor-pointer shadow-xs"
          >
            <div className="w-9 h-9 rounded-xl bg-[#064E3B] text-[#D4AF37] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Bookmark className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-[#064E3B] dark:text-[#FFF8E7]">Bookmark</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Ayat & catatan</p>
          </button>

          <button
            onClick={() => onNavigate('search')}
            className="p-4 rounded-2xl bg-white dark:bg-[#022C22] border border-[#047857]/20 dark:border-[#047857]/40 hover:border-[#D4AF37] text-left transition group cursor-pointer shadow-xs"
          >
            <div className="w-9 h-9 rounded-xl bg-[#064E3B] text-[#D4AF37] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Search className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-[#064E3B] dark:text-[#FFF8E7]">Pencarian</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Cari terjemahan</p>
          </button>

          <button
            onClick={() => onOpenSurah(1, 1)}
            className="p-4 rounded-2xl bg-white dark:bg-[#022C22] border border-[#047857]/20 dark:border-[#047857]/40 hover:border-[#D4AF37] text-left transition group cursor-pointer shadow-xs"
          >
            <div className="w-9 h-9 rounded-xl bg-[#064E3B] text-[#D4AF37] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Headphones className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-[#064E3B] dark:text-[#FFF8E7]">Murottal</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">6 Qari bersuara</p>
          </button>
        </div>
      </div>

      {/* Surah Sering Dibaca */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#064E3B] dark:text-[#FFF8E7]">
            Surat Sering Dibaca
          </h2>
          <button
            onClick={() => onNavigate('surahList')}
            className="text-xs font-semibold text-[#047857] dark:text-[#F5D782] hover:underline flex items-center gap-1 cursor-pointer"
          >
            Lihat Semua 114 Surat <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickSurahs.map((qs) => (
            <button
              key={qs.num}
              onClick={() => onOpenSurah(qs.num)}
              className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#022C22] border border-[#047857]/20 dark:border-[#047857]/40 hover:border-[#D4AF37] transition text-left cursor-pointer group shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#064E3B] text-[#D4AF37] flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-[#047857]">
                  {qs.num}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#064E3B] dark:text-[#FFF8E7]">
                    {qs.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {qs.arti} • {qs.ayat} Ayat
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#D4AF37] transition-transform group-hover:translate-x-1" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
