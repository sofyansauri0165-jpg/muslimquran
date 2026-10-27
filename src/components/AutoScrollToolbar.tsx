import React, { useState } from 'react';
import { Play, Pause, Square, ArrowDown } from 'lucide-react';
import { ScrollState } from '../hooks/useAutoScroll';

interface AutoScrollToolbarProps {
  scrollState: ScrollState;
  speed: number;
  onSpeedChange: (speed: number) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export const AutoScrollToolbar: React.FC<AutoScrollToolbarProps> = ({
  scrollState,
  speed,
  onSpeedChange,
  onStart,
  onPause,
  onResume,
  onStop,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const speeds = [1, 2, 3, 4, 5];

  const isRunning = scrollState === 'running';
  const isPaused = scrollState === 'paused';
  const isActive = isRunning || isPaused;

  return (
    <aside
      className="fixed bottom-20 right-4 z-30 flex flex-col items-end gap-2"
      aria-label="Kontrol Gulir Otomatis"
    >
      {/* Expanded Control Box */}
      {isOpen && (
        <div className="bg-[#022C22] text-[#FFF8E7] border border-[#D4AF37] rounded-2xl p-3 shadow-2xl flex flex-col gap-3 min-w-[200px] animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-[#047857] pb-1.5">
            <span className="text-xs font-bold text-[#F5D782] flex items-center gap-1.5">
              <ArrowDown className="w-3.5 h-3.5 text-[#D4AF37]" />
              Auto-Scroll Surat
            </span>
            <span
              className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ${
                isRunning
                  ? 'bg-emerald-600 text-white'
                  : isPaused
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              {isRunning ? 'Berjalan' : isPaused ? 'Jeda' : 'Siap'}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-2">
            {!isRunning ? (
              <button
                onClick={isPaused ? onResume : onStart}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#D4AF37] text-[#022C22] font-bold text-xs hover:bg-[#F5D782] transition cursor-pointer shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isPaused ? 'Lanjutkan' : 'Mulai'}</span>
              </button>
            ) : (
              <button
                onClick={onPause}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500 text-[#022C22] font-bold text-xs hover:bg-amber-400 transition cursor-pointer shadow-xs"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Jeda</span>
              </button>
            )}

            {isActive && (
              <button
                onClick={onStop}
                className="flex items-center justify-center p-2 rounded-xl bg-red-800 text-white hover:bg-red-700 transition cursor-pointer shadow-xs"
                title="Hentikan Auto-Scroll"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            )}
          </div>

          {/* Speed Selector */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-[#F5D782] mb-1">
              <span>Kecepatan Gulir:</span>
              <span className="font-bold">{speed}x</span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {speeds.map((s) => (
                <button
                  key={s}
                  onClick={() => onSpeedChange(s)}
                  className={`py-1 rounded text-xs font-semibold transition cursor-pointer ${
                    speed === s
                      ? 'bg-[#047857] text-[#FFF8E7] border border-[#D4AF37]'
                      : 'bg-[#064E3B] text-[#FFF8E7]/70 hover:text-white'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full font-semibold text-xs shadow-xl transition-all cursor-pointer ${
          isActive
            ? 'bg-[#D4AF37] text-[#022C22] ring-4 ring-[#D4AF37]/30 animate-pulse'
            : 'bg-[#064E3B] text-[#FFF8E7] border border-[#D4AF37]/60 hover:bg-[#047857]'
        }`}
        title="Buka Kontrol Auto-Scroll"
        aria-label="Buka Kontrol Auto-Scroll"
      >
        <ArrowDown className={`w-4 h-4 ${isActive ? 'animate-bounce' : ''}`} />
        <span>Auto-Scroll</span>
        {isActive && <span className="w-2 h-2 rounded-full bg-[#022C22]"></span>}
      </button>
    </aside>
  );
};
