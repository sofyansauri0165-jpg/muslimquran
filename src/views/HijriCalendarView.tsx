import React, { useState } from 'react';
import {
  getHijriCalendarMonth,
  getHijriDate,
  ISLAMIC_HOLIDAYS,
} from '../services/hijriService';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  Sliders,
  Check,
} from 'lucide-react';

export const HijriCalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [adjustmentDays, setAdjustmentDays] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('mq_hijri_adjustment');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const handleUpdateAdjustment = (offset: number) => {
    setAdjustmentDays(offset);
    try {
      localStorage.setItem('mq_hijri_adjustment', offset.toString());
    } catch {
      // ignore
    }
  };

  const { days, currentHijriInfo } = getHijriCalendarMonth(currentDate, adjustmentDays);

  const prevMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const nextMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const resetToToday = () => {
    setCurrentDate(new Date());
  };

  const weekDayHeaders = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const masehiMonthYear = new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(currentDate);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="rounded-3xl bg-[#064E3B] text-[#FFF8E7] p-6 sm:p-8 border border-[#047857] shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#022C22] text-[#F5D782] text-xs font-semibold border border-[#D4AF37]/30 mb-2">
            <CalendarIcon className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Kalender Islam Umm al-Qura</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#FFF8E7]">
            {currentHijriInfo.formatted}
          </h1>
          <p className="text-xs sm:text-sm text-[#F5D782] mt-0.5">
            Masehi: {currentHijriInfo.gregorianFormatted}
          </p>
        </div>

        {/* Day adjustment selector */}
        <div className="bg-[#022C22] border border-[#D4AF37]/50 rounded-2xl p-3 shrink-0">
          <span className="text-[11px] text-[#F5D782] font-semibold block mb-1.5">
            Koreksi Tanggal Hijriah:
          </span>
          <div className="flex items-center gap-1 text-xs">
            {[-2, -1, 0, 1, 2].map((off) => (
              <button
                key={off}
                onClick={() => handleUpdateAdjustment(off)}
                className={`w-7 h-7 rounded-lg font-bold transition cursor-pointer ${
                  adjustmentDays === off
                    ? 'bg-[#D4AF37] text-[#022C22]'
                    : 'bg-[#064E3B] text-[#FFF8E7] hover:bg-[#047857]'
                }`}
                title={`Koreksi ${off > 0 ? '+' : ''}${off} hari`}
              >
                {off > 0 ? `+${off}` : off}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="flex items-center justify-between bg-white dark:bg-[#022C22] p-3 rounded-2xl border border-[#047857]/20 dark:border-[#047857]/40 shadow-xs">
        <button
          onClick={prevMonth}
          className="p-2 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-[#064E3B]/10 cursor-pointer"
          aria-label="Bulan Sebelumnya"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h2 className="text-base sm:text-lg font-bold text-[#064E3B] dark:text-[#FFF8E7]">
            {currentHijriInfo.monthName} {currentHijriInfo.year} H
          </h2>
          <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {masehiMonthYear} M
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={resetToToday}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-gray-100 dark:bg-[#064E3B] text-[#064E3B] dark:text-[#FFF8E7] hover:bg-gray-200 cursor-pointer"
          >
            Hari Ini
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-[#064E3B]/10 cursor-pointer"
            aria-label="Bulan Selanjutnya"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Month Grid */}
      <div className="rounded-2xl bg-white dark:bg-[#022C22] border border-[#047857]/20 dark:border-[#047857]/40 p-4 sm:p-6 shadow-xs">
        {/* Week Day Header */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-[#047857] dark:text-[#F5D782] border-b border-gray-100 dark:border-[#047857]/30 pb-2">
          {weekDayHeaders.map((h, i) => (
            <div key={i} className={i === 5 ? 'text-emerald-700 dark:text-emerald-400' : ''}>
              {h} {i === 5 ? '(Jum\'at)' : ''}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((d, index) => {
            const hasHoliday = !!d.holiday;
            return (
              <div
                key={index}
                className={`min-h-[64px] sm:min-h-[76px] p-2 rounded-xl flex flex-col justify-between transition border ${
                  d.isToday
                    ? 'bg-[#064E3B] text-[#FFF8E7] border-[#D4AF37] ring-2 ring-[#D4AF37]/50 shadow-md font-bold'
                    : hasHoliday
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/60'
                    : 'bg-gray-50 dark:bg-[#064E3B]/20 border-transparent hover:border-gray-300 dark:hover:border-[#047857]'
                }`}
              >
                <div className="flex items-center justify-between">
                  {/* Hijri day (Primary prominence) */}
                  <span
                    className={`text-base sm:text-lg font-bold font-mono ${
                      d.isToday
                        ? 'text-[#D4AF37]'
                        : hasHoliday
                        ? 'text-amber-800 dark:text-[#D4AF37]'
                        : 'text-[#064E3B] dark:text-[#FFF8E7]'
                    }`}
                  >
                    {d.hijriDay}
                  </span>

                  {/* Gregorian day (Secondary) */}
                  <span
                    className={`text-[10px] ${
                      d.isToday ? 'text-gray-300' : 'text-gray-400 dark:text-gray-400'
                    }`}
                  >
                    {d.gregorianDate.getDate()}
                  </span>
                </div>

                {/* Holiday pill if any */}
                {hasHoliday && (
                  <span
                    className={`text-[9px] sm:text-[10px] truncate rounded px-1 py-0.5 font-semibold ${
                      d.isToday
                        ? 'bg-[#D4AF37] text-[#022C22]'
                        : 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100'
                    }`}
                    title={d.holiday?.name}
                  >
                    {d.holiday?.name.split('(')[0]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Islamic Holidays List */}
      <div className="rounded-2xl bg-white dark:bg-[#022C22] border border-[#047857]/20 dark:border-[#047857]/40 p-5 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-[#064E3B] dark:text-[#FFF8E7] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          Hari-Hari Penting & Hari Besar Islam (Tahun 1448 H)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {ISLAMIC_HOLIDAYS.map((h, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-gray-50 dark:bg-[#064E3B]/20 border border-gray-100 dark:border-[#047857]/30 flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-[#064E3B] text-[#D4AF37] font-bold text-xs flex items-center justify-center shrink-0">
                {h.hijriDay}
              </div>
              <div className="min-w-0">
                <span className="font-bold text-[#064E3B] dark:text-[#FFF8E7] block truncate">
                  {h.name}
                </span>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {h.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
