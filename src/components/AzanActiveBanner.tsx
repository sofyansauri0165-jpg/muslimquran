import React from 'react';
import { useAzan, AZAN_AUDIO_OPTIONS } from '../context/AzanContext';
import { Bell, Volume2, Square, AlertCircle, Play } from 'lucide-react';

export const AzanActiveBanner: React.FC = () => {
  const {
    isAzanPlaying,
    activeAzanPrayer,
    stopAzan,
    showAutoplayBanner,
    playAzan,
    dismissAutoplayBanner,
    azanSettings,
  } = useAzan();

  const prayerNamesMap: Record<string, string> = {
    fajr: 'Subuh',
    dhuhr: 'Zuhur',
    asr: 'Asar',
    maghrib: 'Magrib',
    isha: 'Isya',
    imsak: 'Imsak',
  };

  const activeName = activeAzanPrayer ? prayerNamesMap[activeAzanPrayer] || activeAzanPrayer : 'Waktu Salat';
  const selectedAudio = AZAN_AUDIO_OPTIONS.find((a) => a.id === azanSettings.selectedAudioId) || AZAN_AUDIO_OPTIONS[0];

  return (
    <>
      {/* 1. Autoplay Blocked Warning Modal (User must click to allow sound) */}
      {showAutoplayBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#FFF8E7] text-[#1F2937] p-5 border-2 border-[#D4AF37] shadow-2xl space-y-3">
            <div className="flex items-center gap-2.5 text-[#064E3B]">
              <AlertCircle className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="font-bold text-sm">Waktu Salat Telah Tiba</h3>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">
              Browser membatasi pemutaran audio otomatis sebelum interaksi. Ketuk tombol di bawah untuk mendengarkan kumandang azan.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => playAzan(activeAzanPrayer || undefined)}
                className="flex-1 py-2 px-3 rounded-xl bg-[#064E3B] text-[#FFF8E7] text-xs font-bold hover:bg-[#047857] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Putar Azan</span>
              </button>
              <button
                onClick={dismissAutoplayBanner}
                className="py-2 px-3 rounded-xl border border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                Abaikan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Floating Live Azan Sounding Banner */}
      {isAzanPlaying && (
        <aside
          role="alert"
          aria-live="assertive"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md rounded-2xl bg-[#022C22] text-[#FFF8E7] border-2 border-[#D4AF37] shadow-2xl p-4 animate-in slide-in-from-top-4 duration-300"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#064E3B] border border-[#D4AF37] flex items-center justify-center shrink-0">
                <Volume2 className="w-5 h-5 text-[#D4AF37] animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-[#D4AF37] tracking-wide uppercase">
                    Sedang Mengumandangkan Azan
                  </span>
                </div>
                <h4 className="font-bold text-sm text-[#FFF8E7] truncate">
                  Waktu Salat {activeName}
                </h4>
                <p className="text-[11px] text-[#F5D782] truncate">
                  {selectedAudio.name}
                </p>
              </div>
            </div>

            <button
              onClick={stopAzan}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-800 text-white hover:bg-red-700 text-xs font-bold transition shrink-0 cursor-pointer shadow-xs"
              title="Hentikan Azan"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Hentikan</span>
            </button>
          </div>
        </aside>
      )}
    </>
  );
};
