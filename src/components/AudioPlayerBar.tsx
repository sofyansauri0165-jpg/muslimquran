import React, { useState } from 'react';
import { useAudio } from '../context/AudioContext';
import { QARI_LIST, QariId } from '../config/appConfig';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  ChevronUp,
  ChevronDown,
  Loader2,
  AlertCircle,
} from 'lucide-react';

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const AudioPlayerBar: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    isBuffering,
    audioMode,
    selectedQari,
    duration,
    currentTime,
    volume,
    playbackRate,
    error,
    togglePlayPause,
    seek,
    setVolume,
    setPlaybackRate,
    setSelectedQari,
    stop,
    playNextAyat,
    playPrevAyat,
  } = useAudio();

  const [isExpanded, setIsExpanded] = useState(false);
  const [prevVolume, setPrevVolume] = useState(1);

  if (!currentTrack) return null;

  const toggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume || 1);
    }
  };

  const speedOptions = [0.75, 1, 1.25, 1.5];

  const currentQariName = QARI_LIST.find((q) => q.id === selectedQari)?.name || 'Misyari Rasyid Al-Afasi';

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#022C22] text-[#FFF8E7] border-t-2 border-[#D4AF37] shadow-2xl transition-all"
      role="region"
      aria-label="Pemutar Audio Murottal"
    >
      {/* Error alert if any */}
      {error && (
        <div className="bg-red-900/90 text-red-100 text-xs px-4 py-2 flex items-center justify-between border-b border-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-300" />
            <span>{error}</span>
          </div>
          <button onClick={stop} className="underline font-semibold hover:text-white cursor-pointer ml-3">
            Tutup
          </button>
        </div>
      )}

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Track Information */}
          <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-initial">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#064E3B] border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
              {isBuffering ? (
                <Loader2 className="w-5 h-5 text-[#D4AF37] animate-spin" />
              ) : (
                <span className="font-bold text-xs sm:text-sm text-[#D4AF37]">
                  {currentTrack.ayatNumber ? `v.${currentTrack.ayatNumber}` : 'Full'}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-[#FFF8E7] truncate">
                  {currentTrack.surahNameLatin}
                </span>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#047857] text-[#F5D782] font-semibold shrink-0">
                  {audioMode === 'fullSurah' ? 'Surah Penuh' : `Ayat ${currentTrack.ayatNumber} / ${currentTrack.totalAyat}`}
                </span>
              </div>
              <p className="text-xs text-[#F5D782] truncate flex items-center gap-1">
                <span>Qari:</span>
                <span className="font-medium text-[#FFF8E7]/90">{currentQariName}</span>
              </p>
            </div>
          </div>

          {/* Center: Playback Controls & Progress (Desktop & Tablet) */}
          <div className="flex flex-col items-center gap-1 flex-1 max-w-xl mx-2 hidden md:flex">
            <div className="flex items-center gap-4">
              {audioMode === 'perAyat' && (
                <button
                  onClick={playPrevAyat}
                  disabled={!currentTrack.ayatNumber || currentTrack.ayatNumber <= 1}
                  className="p-1.5 rounded-full text-[#FFF8E7]/80 hover:text-white hover:bg-[#064E3B] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                  title="Ayat Sebelumnya"
                  aria-label="Ayat Sebelumnya"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={togglePlayPause}
                className="w-10 h-10 rounded-full bg-[#D4AF37] text-[#022C22] flex items-center justify-center hover:bg-[#F5D782] transition shadow-md cursor-pointer"
                aria-label={isPlaying ? 'Jeda Audio' : 'Putar Audio'}
              >
                {isBuffering ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              {audioMode === 'perAyat' && (
                <button
                  onClick={playNextAyat}
                  disabled={!currentTrack.ayatNumber || currentTrack.ayatNumber >= currentTrack.totalAyat}
                  className="p-1.5 rounded-full text-[#FFF8E7]/80 hover:text-white hover:bg-[#064E3B] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                  title="Ayat Selanjutnya"
                  aria-label="Ayat Selanjutnya"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Seek Bar */}
            <div className="w-full flex items-center gap-2 text-[11px] text-[#FFF8E7]/70">
              <span className="w-10 text-right tabular-nums">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seek(parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-[#064E3B] rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                aria-label="Posisi Audio"
              />
              <span className="w-10 tabular-nums">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Quick Controls & Mobile Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Play/Pause Button */}
            <div className="flex items-center gap-1 md:hidden">
              {audioMode === 'perAyat' && (
                <button
                  onClick={playPrevAyat}
                  disabled={!currentTrack.ayatNumber || currentTrack.ayatNumber <= 1}
                  className="p-1.5 text-[#FFF8E7]/80 disabled:opacity-30"
                  aria-label="Ayat Sebelumnya"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={togglePlayPause}
                className="w-9 h-9 rounded-full bg-[#D4AF37] text-[#022C22] flex items-center justify-center hover:bg-[#F5D782] cursor-pointer"
                aria-label={isPlaying ? 'Jeda' : 'Putar'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>
              {audioMode === 'perAyat' && (
                <button
                  onClick={playNextAyat}
                  disabled={!currentTrack.ayatNumber || currentTrack.ayatNumber >= currentTrack.totalAyat}
                  className="p-1.5 text-[#FFF8E7]/80 disabled:opacity-30"
                  aria-label="Ayat Selanjutnya"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Speed Selector (Desktop) */}
            <div className="hidden lg:flex items-center gap-1 border border-[#047857] rounded-lg p-0.5 bg-[#064E3B]">
              {speedOptions.map((sp) => (
                <button
                  key={sp}
                  onClick={() => setPlaybackRate(sp)}
                  className={`px-1.5 py-0.5 text-[11px] rounded font-medium transition cursor-pointer ${
                    playbackRate === sp ? 'bg-[#D4AF37] text-[#022C22]' : 'text-[#FFF8E7]/80 hover:text-white'
                  }`}
                >
                  {sp}x
                </button>
              ))}
            </div>

            {/* Qari Selector Dropdown */}
            <select
              value={selectedQari}
              onChange={(e) => setSelectedQari(e.target.value as QariId)}
              className="hidden sm:inline-block bg-[#064E3B] text-[#FFF8E7] text-xs rounded-lg px-2 py-1.5 border border-[#047857] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] cursor-pointer"
              title="Pilih Qari"
            >
              {QARI_LIST.map((q) => (
                <option key={q.id} value={q.id} className="bg-[#022C22] text-[#FFF8E7]">
                  {q.name}
                </option>
              ))}
            </select>

            {/* Volume (Desktop) */}
            <div className="hidden xl:flex items-center gap-1.5">
              <button
                onClick={toggleMute}
                className="text-[#FFF8E7]/80 hover:text-white cursor-pointer"
                title={volume === 0 ? 'Bunyikan' : 'Bisukan'}
              >
                {volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16 h-1 bg-[#064E3B] rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                aria-label="Volume Audio"
              />
            </div>

            {/* Mobile Expand details */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="md:hidden p-1.5 text-[#FFF8E7]/80 hover:text-white cursor-pointer"
              title="Buka Pengaturan Audio"
            >
              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>

            {/* Stop / Close button */}
            <button
              onClick={stop}
              className="p-1.5 rounded-lg text-[#FFF8E7]/60 hover:text-white hover:bg-red-900/60 transition cursor-pointer"
              title="Hentikan & Tutup Pemutar"
              aria-label="Tutup Pemutar Audio"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Seek slider in main bar */}
        <div className="md:hidden mt-2 flex items-center gap-2 text-[10px] text-[#FFF8E7]/70">
          <span className="w-8 text-right tabular-nums">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={(e) => seek(parseFloat(e.target.value))}
            className="flex-1 h-1 bg-[#064E3B] rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
            aria-label="Posisi Audio Mobile"
          />
          <span className="w-8 tabular-nums">{formatTime(duration)}</span>
        </div>

        {/* Expanded Drawer on Mobile */}
        {isExpanded && (
          <div className="md:hidden mt-3 pt-3 border-t border-[#047857]/40 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Qari selector */}
            <div className="w-full">
              <label className="text-[11px] text-[#F5D782] block mb-1">Pilihan Qari:</label>
              <select
                value={selectedQari}
                onChange={(e) => setSelectedQari(e.target.value as QariId)}
                className="w-full bg-[#064E3B] text-[#FFF8E7] text-xs rounded-lg px-2.5 py-1.5 border border-[#047857]"
              >
                {QARI_LIST.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Speed Options */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#F5D782]">Kecepatan:</span>
              <div className="flex items-center gap-1 bg-[#064E3B] p-0.5 rounded-lg">
                {speedOptions.map((sp) => (
                  <button
                    key={sp}
                    onClick={() => setPlaybackRate(sp)}
                    className={`px-2 py-0.5 rounded text-[11px] ${
                      playbackRate === sp ? 'bg-[#D4AF37] text-[#022C22] font-bold' : 'text-[#FFF8E7]'
                    }`}
                  >
                    {sp}x
                  </button>
                ))}
              </div>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button onClick={toggleMute} className="text-[#FFF8E7]">
                {volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 h-1 bg-[#064E3B] rounded appearance-none accent-[#D4AF37]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
