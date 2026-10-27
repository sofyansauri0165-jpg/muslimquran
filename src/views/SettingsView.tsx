import React, { useState } from 'react';
import { UserSettings } from '../types/quran';
import { APP_CONFIG, QARI_LIST, QariId } from '../config/appConfig';
import { usePWAInstall } from '../hooks/usePWA';
import { useAudio } from '../context/AudioContext';
import { useAzan, AZAN_AUDIO_OPTIONS } from '../context/AzanContext';
import {
  calculatePrayerTimes,
  CITY_PRESETS,
  DEFAULT_PRAYER_SETTINGS,
} from '../services/prayerTimeService';
import { CalculationMethodKey, PrayerSettings } from '../types/prayerAndHijri';
import {
  Settings as SettingsIcon,
  Type,
  Moon,
  Sun,
  Headphones,
  Target,
  Download,
  RotateCcw,
  Clock,
  Volume2,
  VolumeX,
  Bell,
  Calendar,
  Check,
  Play,
  Pause,
  MapPin,
  Sliders,
  ShieldAlert,
} from 'lucide-react';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onResetSettings: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetSettings,
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const { setSelectedQari } = useAudio();
  const {
    azanSettings,
    updateAzanSettings,
    playAzan,
    stopAzan,
    isAzanPlaying,
    testNotification,
    requestNotificationPermission,
    notificationPermission,
  } = useAzan();

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

  const handleUpdatePrayerSettings = (newSettings: Partial<PrayerSettings>) => {
    setPrayerSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('mq_prayer_settings', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleUpdateHijriAdjustment = (offset: number) => {
    setHijriAdjustment(offset);
    try {
      localStorage.setItem('mq_hijri_adjustment', offset.toString());
    } catch {
      // ignore
    }
  };

  const handleQariChange = (qariId: string) => {
    onUpdateSettings({ defaultQari: qariId });
    setSelectedQari(qariId as QariId);
  };

  const calculationMethods: { key: CalculationMethodKey; label: string }[] = [
    { key: 'Kemenag', label: 'Kementerian Agama RI / SIHAT (Subuh 20°, Isya 18°)' },
    { key: 'MuslimWorldLeague', label: 'Muslim World League (MWL - 18°/17°)' },
    { key: 'Egyptian', label: 'Egyptian General Authority of Survey (19.5°/17.5°)' },
    { key: 'UmmAlQura', label: 'Umm Al-Qura University, Makkah' },
    { key: 'Karachi', label: 'University of Islamic Sciences, Karachi (18°/18°)' },
    { key: 'NorthAmerica', label: 'ISNA / North America (15°/15°)' },
    { key: 'Dubai', label: 'Dubai / UAE Standard' },
  ];

  const sampleArabicText = 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#064E3B] dark:text-[#FFF8E7] flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-[#D4AF37]" />
          Pengaturan Terpadu Muslim Quran
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
          Sesuaikan pengalaman tilawah Al-Qur&apos;an, jadwal salat, audio azan otomatis, dan penyesuaian kalender Hijriah.
        </p>
      </div>

      <div className="space-y-5">
        {/* SECTION 1: JADWAL SALAT & LOKASI */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#022C22] border border-[#047857]/20 dark:border-[#047857]/40 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-[#047857]/30">
            <Clock className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="font-bold text-sm text-[#064E3B] dark:text-[#FFF8E7]">
              Jadwal Salat & Lokasi
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Location Selector */}
            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Lokasi / Kota Terpilih:
              </label>
              <select
                value={prayerSettings.location.name}
                onChange={(e) => {
                  const found = CITY_PRESETS.find((c) => c.name === e.target.value);
                  if (found) handleUpdatePrayerSettings({ location: found });
                }}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-[#047857] bg-gray-50 dark:bg-[#064E3B]/30 dark:text-white"
              >
                {CITY_PRESETS.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.timezone})
                  </option>
                ))}
              </select>
            </div>

            {/* Calculation Method */}
            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Metode Perhitungan Hisab:
              </label>
              <select
                value={prayerSettings.calculationMethod}
                onChange={(e) =>
                  handleUpdatePrayerSettings({
                    calculationMethod: e.target.value as CalculationMethodKey,
                  })
                }
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-[#047857] bg-gray-50 dark:bg-[#064E3B]/30 dark:text-white"
              >
                {calculationMethods.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Asr Madhab */}
            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Metode Waktu Asar:
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdatePrayerSettings({ asrMadhab: 'shafi' })}
                  className={`flex-1 py-2 rounded-xl font-semibold transition cursor-pointer ${
                    prayerSettings.asrMadhab === 'shafi'
                      ? 'bg-[#064E3B] text-[#FFF8E7]'
                      : 'bg-gray-100 dark:bg-[#064E3B]/20 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Syafi&apos;i / Maliki / Hanbali
                </button>
                <button
                  onClick={() => handleUpdatePrayerSettings({ asrMadhab: 'hanafi' })}
                  className={`flex-1 py-2 rounded-xl font-semibold transition cursor-pointer ${
                    prayerSettings.asrMadhab === 'hanafi'
                      ? 'bg-[#064E3B] text-[#FFF8E7]'
                      : 'bg-gray-100 dark:bg-[#064E3B]/20 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Hanafi (Bayangan 2x)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: AUDIO AZAN & NOTIFIKASI */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#022C22] border border-[#047857]/20 dark:border-[#047857]/40 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-[#047857]/30">
            <Volume2 className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="font-bold text-sm text-[#064E3B] dark:text-[#FFF8E7]">
              Audio Azan & Pengaturan Panggilan Salat
            </h2>
          </div>

          {/* Muazzin Voice Selector */}
          <div>
            <label className="font-semibold text-xs text-gray-700 dark:text-gray-300 block mb-2">
              Pilihan Audio Azan:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {AZAN_AUDIO_OPTIONS.map((opt) => {
                const isSelected = azanSettings.selectedAudioId === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => updateAzanSettings({ selectedAudioId: opt.id })}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-[#D4AF37] bg-emerald-50 dark:bg-[#064E3B] text-[#064E3B] dark:text-[#FFF8E7] font-bold'
                        : 'border-gray-200 dark:border-[#047857]/40 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">{opt.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#D4AF37]" />}
                    </div>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 block truncate">
                      {opt.muazzin}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Test Buttons & Volume */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-[#047857]/30 text-xs">
            {/* Audio Volume & Silent Mode */}
            <div className="space-y-2">
              <div className="flex items-center justify-between font-semibold">
                <span>Volume Azan: {Math.round(azanSettings.volume * 100)}%</span>
                <button
                  onClick={() => updateAzanSettings({ isSilentMode: !azanSettings.isSilentMode })}
                  className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 cursor-pointer ${
                    azanSettings.isSilentMode
                      ? 'bg-red-800 text-white font-bold'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {azanSettings.isSilentMode ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                  <span>{azanSettings.isSilentMode ? 'Mode Senyap Aktif' : 'Senyap'}</span>
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={azanSettings.volume}
                disabled={azanSettings.isSilentMode}
                onChange={(e) => updateAzanSettings({ volume: parseFloat(e.target.value) })}
                className="w-full accent-[#064E3B]"
              />
            </div>

            {/* Test Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={() => {
                  if (isAzanPlaying) stopAzan();
                  else playAzan('dhuhr');
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-[#064E3B] text-[#FFF8E7] hover:bg-[#047857] font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                {isAzanPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isAzanPlaying ? 'Hentikan Uji Azan' : 'Uji Audio Azan'}</span>
              </button>

              <button
                onClick={testNotification}
                className="flex-1 py-2 px-3 rounded-xl bg-[#022C22] text-[#FFF8E7] hover:bg-[#047857] border border-[#047857] font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Uji Notifikasi</span>
              </button>
            </div>
          </div>

          {/* Browser Limitation Notice (Honest Technical Boundary per Master Prompt) */}
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#064E3B]/20 border border-gray-200 dark:border-[#047857]/30 text-[11px] text-gray-600 dark:text-gray-300 space-y-1">
            <span className="font-bold text-[#064E3B] dark:text-[#F5D782] block flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-[#D4AF37]" />
              Catatan Penting Pemutaran Azan di Browser Web:
            </span>
            <p>
              Audio azan otomatis diputar saat aplikasi atau tab sedang terbuka. Sebagian browser mobile membatasi pemutaran audio di latar belakang jika perangkat terkunci atau tab ditutup guna menghemat daya.
            </p>
          </div>
        </div>

        {/* SECTION 3: KALENDER HIJRIAH */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#022C22] border border-[#047857]/20 dark:border-[#047857]/40 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-[#047857]/30">
            <Calendar className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="font-bold text-sm text-[#064E3B] dark:text-[#FFF8E7]">
              Pengaturan Kalender Hijriah
            </h2>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <span>Koreksi Tanggal Hijriah (Hasil Rukyatul Hilal):</span>
              <span className="text-[#047857] dark:text-[#D4AF37] font-bold">
                {hijriAdjustment > 0 ? `+${hijriAdjustment}` : hijriAdjustment} Hari
              </span>
            </div>
            <div className="flex gap-2">
              {[-2, -1, 0, 1, 2].map((off) => (
                <button
                  key={off}
                  onClick={() => handleUpdateHijriAdjustment(off)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    hijriAdjustment === off
                      ? 'bg-[#064E3B] text-[#FFF8E7]'
                      : 'bg-gray-100 dark:bg-[#064E3B]/20 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {off > 0 ? `+${off} Hari` : off === 0 ? 'Normal (0)' : `${off} Hari`}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
              Gunakan penyesuaian hari di atas bila pengumuman hisab/rukyat resmi Kemenag RI berbeda 1 hari dengan kalender astronomis global Umm al-Qura.
            </p>
          </div>
        </div>

        {/* SECTION 4: TAMPILAN BACAAN AL-QUR'AN */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#022C22] border border-[#047857]/20 dark:border-[#047857]/40 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-[#047857]/30">
            <Type className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="font-bold text-sm text-[#064E3B] dark:text-[#FFF8E7]">
              Ukuran Huruf Mushaf & Terjemahan
            </h2>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-gray-700 dark:text-gray-300">
              <span>Ukuran Font Arab</span>
              <span className="text-[#047857] dark:text-[#D4AF37] font-bold">
                {settings.arabicFontSize} px
              </span>
            </div>
            <input
              type="range"
              min="22"
              max="44"
              step="2"
              value={settings.arabicFontSize}
              onChange={(e) => onUpdateSettings({ arabicFontSize: parseInt(e.target.value, 10) })}
              className="w-full accent-[#064E3B]"
              aria-label="Ukuran Font Arab"
            />
          </div>

          {/* Live Preview Box */}
          <div className="rounded-xl p-4 bg-[#FFF8E7] dark:bg-[#064E3B]/40 border border-[#D4AF37]/50 text-center">
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">Pratinjau Teks Mushaf:</p>
            <p
              className="font-quran text-[#064E3B] dark:text-[#D4AF37] transition-all"
              style={{ fontSize: `${settings.arabicFontSize}px` }}
            >
              {sampleArabicText}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
            <label className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-[#064E3B]/20 cursor-pointer">
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                Transliterasi Latin
              </span>
              <input
                type="checkbox"
                checked={settings.showLatin}
                onChange={(e) => onUpdateSettings({ showLatin: e.target.checked })}
                className="w-4 h-4 accent-[#064E3B]"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-[#064E3B]/20 cursor-pointer">
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                Terjemahan Indonesia
              </span>
              <input
                type="checkbox"
                checked={settings.showTranslation}
                onChange={(e) => onUpdateSettings({ showTranslation: e.target.checked })}
                className="w-4 h-4 accent-[#064E3B]"
              />
            </label>
          </div>
        </div>

        {/* SECTION 5: TEMA & TARGET TILAWAH */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#022C22] border border-[#047857]/20 dark:border-[#047857]/40 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-[#047857]/30">
            <Moon className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="font-bold text-sm text-[#064E3B] dark:text-[#FFF8E7]">
              Tema & Target Tilawah Harian
            </h2>
          </div>

          {/* Theme Selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onUpdateSettings({ theme: 'light' })}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer transition ${
                settings.theme === 'light'
                  ? 'border-[#064E3B] bg-emerald-50 text-[#064E3B] ring-2 ring-[#064E3B]/30'
                  : 'border-gray-200 text-gray-600 dark:text-gray-300'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Mode Terang (Warm White)</span>
              {settings.theme === 'light' && <Check className="w-3.5 h-3.5 text-[#064E3B]" />}
            </button>

            <button
              onClick={() => onUpdateSettings({ theme: 'dark' })}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer transition ${
                settings.theme === 'dark'
                  ? 'border-[#D4AF37] bg-[#022C22] text-[#F5D782] ring-2 ring-[#D4AF37]/30'
                  : 'border-gray-200 text-gray-600 dark:text-gray-300'
              }`}
            >
              <Moon className="w-4 h-4 text-[#D4AF37]" />
              <span>Mode Gelap (Forest Green)</span>
              {settings.theme === 'dark' && <Check className="w-3.5 h-3.5 text-[#D4AF37]" />}
            </button>
          </div>

          {/* Target Tilawah */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center text-xs font-semibold text-gray-700 dark:text-gray-300">
              <span>Target Jumlah Ayat Per Hari:</span>
              <span className="text-[#047857] dark:text-[#D4AF37] font-bold">
                {settings.dailyGoalAyat} Ayat
              </span>
            </div>
            <div className="flex gap-2">
              {[5, 10, 20, 30, 50].map((goal) => (
                <button
                  key={goal}
                  onClick={() => onUpdateSettings({ dailyGoalAyat: goal })}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    settings.dailyGoalAyat === goal
                      ? 'bg-[#064E3B] text-[#FFF8E7] shadow-xs'
                      : 'bg-gray-100 dark:bg-[#064E3B]/30 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {goal} Ayat
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 6: PWA & RESET */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#022C22] border border-[#047857]/20 dark:border-[#047857]/40 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#064E3B] p-2 flex items-center justify-center">
              <img src="/icon.svg" alt="App Logo" className="w-full h-full" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#064E3B] dark:text-[#FFF8E7]">
                {APP_CONFIG.appName}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {APP_CONFIG.tagline} • v2.5 PWA (Al-Qur&apos;an, Salat, Azan, Hijriah)
              </p>
            </div>
          </div>

          {!isInstalled && isInstallable && (
            <button
              onClick={install}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#D4AF37] text-[#022C22] font-bold text-xs hover:bg-[#F5D782] transition shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Install Muslim Quran ke Perangkat</span>
            </button>
          )}

          <div className="pt-2 border-t border-gray-100 dark:border-[#047857]/30 flex justify-end">
            <button
              onClick={onResetSettings}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Kembalikan Seluruh Pengaturan ke Awal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
