import React, { useState, useEffect } from 'react';
import {
  calculatePrayerTimes,
  CITY_PRESETS,
  DEFAULT_PRAYER_SETTINGS,
  requestDeviceLocation,
} from '../services/prayerTimeService';
import { LocationConfig, PrayerName, PrayerSettings, PrayerTimeItem } from '../types/prayerAndHijri';
import { useAzan } from '../context/AzanContext';
import { getHijriDate } from '../services/hijriService';
import {
  Clock,
  MapPin,
  Compass,
  Volume2,
  VolumeX,
  Play,
  Pause,
  AlertCircle,
  Navigation,
  Calendar,
  Check,
  ChevronDown,
  Search,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface PrayerTimesViewProps {
  onNavigateSettings?: () => void;
}

export const PrayerTimesView: React.FC<PrayerTimesViewProps> = ({ onNavigateSettings }) => {
  const [settings, setSettings] = useState<PrayerSettings>(() => {
    try {
      const saved = localStorage.getItem('mq_prayer_settings');
      return saved ? JSON.parse(saved) : DEFAULT_PRAYER_SETTINGS;
    } catch {
      return DEFAULT_PRAYER_SETTINGS;
    }
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Search cities modal
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');

  const { azanSettings, updateAzanSettings, playAzan, stopAzan, isAzanPlaying } = useAzan();

  // Save settings on update
  const handleUpdateSettings = (newSettings: Partial<PrayerSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('mq_prayer_settings', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Live timer tick every second for clock and countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { items, nextPrayer, currentPrayer, countdown } = calculatePrayerTimes(currentTime, settings);
  const hijriInfo = getHijriDate(currentTime);

  const handleUseGps = async () => {
    setIsGpsLoading(true);
    setGpsError(null);
    try {
      const loc = await requestDeviceLocation();
      handleUpdateSettings({ location: loc });
      setShowLocationPicker(false);
    } catch (err: any) {
      setGpsError(err.message || 'Gagal mendapatkan lokasi GPS.');
    } finally {
      setIsGpsLoading(false);
    }
  };

  const filteredCities = CITY_PRESETS.filter((c) =>
    c.name.toLowerCase().includes(citySearchQuery.toLowerCase())
  );

  const formatCountdown = (num: number) => num.toString().padStart(2, '0');

  const handleTogglePrayerAzan = (prayerKey: string) => {
    const key = prayerKey as keyof typeof azanSettings.prayers;
    if (azanSettings.prayers[key]) {
      const cur = azanSettings.prayers[key];
      updateAzanSettings({
        prayers: {
          ...azanSettings.prayers,
          [key]: { ...cur, enabled: !cur.enabled },
        },
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="rounded-3xl bg-[#064E3B] text-[#FFF8E7] p-6 sm:p-8 border border-[#047857] shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#022C22] text-[#F5D782] text-xs font-semibold border border-[#D4AF37]/30">
              <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{hijriInfo.formatted}</span>
              <span>•</span>
              <span className="text-gray-300">{hijriInfo.gregorianFormatted}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#FFF8E7] flex items-center gap-2.5">
              <span>Jadwal Waktu Salat</span>
              <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
            </h1>

            {/* Location Display & Change button */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <div className="flex items-center gap-1.5 font-medium text-[#F5D782]">
                <MapPin className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-sm font-bold text-white">{settings.location.name}</span>
                <span className="text-[11px] text-gray-300">({settings.location.timezone})</span>
              </div>
              <button
                onClick={() => setShowLocationPicker(true)}
                className="ml-2 px-2.5 py-1 rounded-lg bg-[#022C22] hover:bg-[#047857] text-[#D4AF37] border border-[#D4AF37]/40 text-xs font-semibold transition cursor-pointer"
              >
                Ganti Kota
              </button>
            </div>
          </div>

          {/* Next Prayer Countdown Spotlight Card */}
          {nextPrayer && (
            <div className="bg-[#022C22] border-2 border-[#D4AF37] rounded-2xl p-4 sm:p-5 text-center min-w-[240px] shadow-lg shrink-0">
              <span className="text-[11px] font-bold text-[#F5D782] tracking-wider uppercase block">
                Menuju Waktu {nextPrayer.nameIndo}
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#FFF8E7] tracking-tight py-1 font-mono">
                {formatCountdown(countdown.hours)}:{formatCountdown(countdown.minutes)}:
                {formatCountdown(countdown.seconds)}
              </div>
              <p className="text-xs text-[#F5D782] mt-0.5 font-semibold">
                Pukul {nextPrayer.time} WIB/Lokal
              </p>
            </div>
          )}
        </div>
      </div>

      {/* GPS Error Alert */}
      {gpsError && (
        <div className="p-3.5 rounded-xl bg-red-900/30 border border-red-700 text-red-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{gpsError}</span>
          </div>
          <button onClick={() => setGpsError(null)} className="underline cursor-pointer text-xs">
            Tutup
          </button>
        </div>
      )}

      {/* Prayer Times Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {items.map((item) => {
          const isObligatory = item.isObligatory;
          const isNext = item.isNext;
          const azanKey = item.id as keyof typeof azanSettings.prayers;
          const azanEnabled = azanSettings.prayers[azanKey]?.enabled ?? false;

          return (
            <div
              key={item.id}
              className={`rounded-2xl p-4 text-center transition-all flex flex-col justify-between border ${
                isNext
                  ? 'bg-[#064E3B] text-[#FFF8E7] border-[#D4AF37] ring-2 ring-[#D4AF37]/50 shadow-md transform sm:-translate-y-1'
                  : 'bg-white dark:bg-[#022C22] border-[#047857]/20 dark:border-[#047857]/40 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      isNext
                        ? 'text-[#F5D782]'
                        : isObligatory
                        ? 'text-[#047857] dark:text-[#F5D782]'
                        : 'text-gray-400'
                    }`}
                  >
                    {item.nameIndo}
                  </span>
                  {isNext && (
                    <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping"></span>
                  )}
                </div>

                <div className="font-quran text-lg my-0.5 text-gray-500 dark:text-gray-300">
                  {item.nameArabic}
                </div>

                <div
                  className={`text-2xl sm:text-3xl font-extrabold tracking-tight my-2 font-mono ${
                    isNext ? 'text-[#D4AF37]' : 'text-[#064E3B] dark:text-[#FFF8E7]'
                  }`}
                >
                  {item.time}
                </div>
              </div>

              {/* Azan Toggle per Prayer (for obligatory prayers only) */}
              {isObligatory && (
                <div className="pt-2 border-t border-gray-100 dark:border-[#047857]/30 flex items-center justify-center gap-1.5">
                  <button
                    onClick={() => handleTogglePrayerAzan(item.id)}
                    className={`text-[11px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer ${
                      azanEnabled
                        ? isNext
                          ? 'bg-[#D4AF37] text-[#022C22]'
                          : 'bg-[#064E3B] text-[#FFF8E7]'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                    }`}
                    title={azanEnabled ? 'Azan Aktif untuk waktu ini' : 'Azan Dinonaktifkan'}
                  >
                    {azanEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    <span>{azanEnabled ? 'Azan' : 'Bisu'}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Azan Controls & Method Notice Card */}
      <div className="rounded-2xl bg-white dark:bg-[#022C22] border border-[#047857]/20 dark:border-[#047857]/40 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-gray-100 dark:border-[#047857]/30">
          <div>
            <h3 className="font-bold text-sm text-[#064E3B] dark:text-[#FFF8E7] flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[#D4AF37]" />
              Pemutar Audio Azan & Panggilan Salat
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Audio azan otomatis diputar saat waktu salat tiba (jika tab aplikasi dibuka).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (isAzanPlaying) {
                  stopAzan();
                } else {
                  playAzan('dhuhr');
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#064E3B] text-[#FFF8E7] hover:bg-[#047857] text-xs font-bold transition cursor-pointer shadow-xs"
            >
              {isAzanPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isAzanPlaying ? 'Hentikan Azan' : 'Uji Putar Azan'}</span>
            </button>
          </div>
        </div>

        {/* Calculation Method and Religious Notice */}
        <div className="flex items-start gap-2.5 text-xs text-gray-600 dark:text-gray-300 leading-relaxed bg-[#FFF8E7] dark:bg-[#064E3B]/20 p-3 rounded-xl border border-[#D4AF37]/30">
          <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[#064E3B] dark:text-[#F5D782]">Metode Perhitungan: </span>
            <span>
              Standar Kementerian Agama RI / SIHAT (Subuh 20°, Isya 18°, Mazhab Asar Syafi&apos;i).
              Jadwal dapat bervariasi beberapa menit tergantung ketetapan hisab/rukyat otoritas setempat.
            </span>
          </div>
        </div>
      </div>

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#022C22] text-[#1F2937] dark:text-[#FFF8E7] p-6 shadow-2xl border border-[#D4AF37] max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#047857]/40 mb-3">
              <h3 className="font-bold text-base text-[#064E3B] dark:text-[#FFF8E7] flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#D4AF37]" />
                Pilih Kota / Lokasi Salat
              </h3>
              <button
                onClick={() => setShowLocationPicker(false)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-white text-sm font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>

            {/* GPS Auto Button */}
            <button
              onClick={handleUseGps}
              disabled={isGpsLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#064E3B] text-[#FFF8E7] hover:bg-[#047857] text-xs font-bold transition mb-3 cursor-pointer disabled:opacity-50"
            >
              <Navigation className="w-4 h-4 text-[#D4AF37]" />
              <span>{isGpsLoading ? 'Mendeteksi Lokasi...' : 'Gunakan Deteksi GPS Perangkat'}</span>
            </button>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={citySearchQuery}
                onChange={(e) => setCitySearchQuery(e.target.value)}
                placeholder="Cari nama kota atau provinsi... (cth: Surabaya, Medan)"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-[#047857]/40 bg-gray-50 dark:bg-[#064E3B]/30 outline-none focus:border-[#D4AF37]"
                autoFocus
              />
            </div>

            {/* City Presets List */}
            <div className="flex-1 overflow-y-auto space-y-1 divide-y divide-gray-100 dark:divide-[#047857]/20 pr-1 max-h-64">
              {filteredCities.map((city) => {
                const isSelected = settings.location.name === city.name;
                return (
                  <button
                    key={city.name}
                    onClick={() => {
                      handleUpdateSettings({ location: city });
                      setShowLocationPicker(false);
                    }}
                    className={`w-full p-2.5 text-left text-xs rounded-lg flex items-center justify-between transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#064E3B] text-[#FFF8E7] font-bold'
                        : 'hover:bg-gray-50 dark:hover:bg-[#064E3B]/20 text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    <div>
                      <span className="block font-semibold">{city.name}</span>
                      <span className="text-[10px] text-gray-400">
                        Zona: {city.timezone} ({city.latitude > 0 ? '+' : ''}{city.latitude}°, {city.longitude > 0 ? '+' : ''}{city.longitude}°)
                      </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#D4AF37]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
