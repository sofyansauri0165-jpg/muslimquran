import { HijriDateInfo, IslamicHoliday } from '../types/prayerAndHijri';

export const HIJRI_MONTHS = [
  'Muharram',
  'Safar',
  'Rabiulawal',
  'Rabiulakhir',
  'Jumadilawal',
  'Jumadilakhir',
  'Rajab',
  'Sya\'ban',
  'Ramadan',
  'Syawal',
  'Zulkaidah',
  'Zulhijah',
];

export const ISLAMIC_HOLIDAYS: IslamicHoliday[] = [
  { hijriMonth: 1, hijriDay: 1, name: 'Tahun Baru Islam (1 Muharram)', description: 'Awal tahun kalender Hijriah.', isImportant: true },
  { hijriMonth: 1, hijriDay: 10, name: 'Hari Asyura (10 Muharram)', description: 'Hari berpuasa sunnah Asyura yang mulia.', isImportant: true },
  { hijriMonth: 3, hijriDay: 12, name: 'Maulid Nabi Muhammad SAW', description: 'Peringatan kelahiran junjungan Nabi Muhammad SAW.', isImportant: true },
  { hijriMonth: 7, hijriDay: 27, name: 'Isra Mi\'raj', description: 'Perjalanan agung Rasulullah SAW dan perintah salat lima waktu.', isImportant: true },
  { hijriMonth: 8, hijriDay: 15, name: 'Malam Nisfu Sya\'ban', description: 'Malam penuh ampunan dan doa.', isImportant: false },
  { hijriMonth: 9, hijriDay: 1, name: 'Awal Puasa Ramadan', description: 'Hari pertama ibadah puasa wajib di bulan suci Ramadan.', isImportant: true },
  { hijriMonth: 9, hijriDay: 17, name: 'Nuzulul Qur\'an', description: 'Peringatan malam pertama kali diturunkannya wahyu Al-Qur\'an.', isImportant: true },
  { hijriMonth: 10, hijriDay: 1, name: 'Hari Raya Idulfitri 1 Syawal', description: 'Hari kemenangan umat Islam setelah sebulan penuh berpuasa.', isImportant: true },
  { hijriMonth: 10, hijriDay: 2, name: 'Hari Raya Idulfitri (Hari Ke-2)', description: 'Hari kedua perayaan Idulfitri.', isImportant: false },
  { hijriMonth: 12, hijriDay: 9, name: 'Hari Arafah (9 Zulhijah)', description: 'Puncak ibadah haji (Wukuf di Arafah) & puasa sunnah Arafah.', isImportant: true },
  { hijriMonth: 12, hijriDay: 10, name: 'Hari Raya Iduladha (10 Zulhijah)', description: 'Hari Raya Kurban mengenang keteladanan Nabi Ibrahim AS.', isImportant: true },
  { hijriMonth: 12, hijriDay: 11, name: 'Hari Tasyrik Pertama (11 Zulhijah)', description: 'Hari penyembelihan hewan kurban dan berzikir.', isImportant: false },
  { hijriMonth: 12, hijriDay: 12, name: 'Hari Tasyrik Kedua (12 Zulhijah)', description: 'Hari tasyrik kedua (larangan berpuasa).', isImportant: false },
  { hijriMonth: 12, hijriDay: 13, name: 'Hari Tasyrik Ketiga (13 Zulhijah)', description: 'Hari penutupan penyembelihan hewan kurban.', isImportant: false },
];

/**
 * Get accurate Hijri date information using Intl Islamic Umm al-Qura calendar
 * with optional manual day adjustment (-2 to +2 days).
 */
export function getHijriDate(date: Date = new Date(), adjustmentDays: number = 0): HijriDateInfo {
  // Apply day adjustment
  const adjustedDate = new Date(date);
  if (adjustmentDays !== 0) {
    adjustedDate.setDate(adjustedDate.getDate() + adjustmentDays);
  }

  // Indonesian day names
  const dayName = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(date);
  const gregorianFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);

  try {
    const formatter = new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const parts = formatter.formatToParts(adjustedDate);
    let day = 1;
    let monthName = 'Ramadan';
    let year = 1448;

    for (const p of parts) {
      if (p.type === 'day') day = parseInt(p.value, 10) || 1;
      if (p.type === 'month') monthName = p.value;
      if (p.type === 'year') year = parseInt(p.value, 10) || 1448;
    }

    // Map month name to index 1-12
    const cleanMonth = monthName.toLowerCase().replace(/[^a-z]/g, '');
    let monthIndex = HIJRI_MONTHS.findIndex((m) =>
      cleanMonth.includes(m.toLowerCase().replace(/[^a-z]/g, '').slice(0, 4))
    );
    if (monthIndex === -1) {
      monthIndex = 8; // fallback Ramadan
    }
    const standardMonthName = HIJRI_MONTHS[monthIndex];

    const formatted = `${day} ${standardMonthName} ${year} H`;

    return {
      day,
      monthIndex: monthIndex + 1,
      monthName: standardMonthName,
      year,
      dayName,
      formatted,
      gregorianFormatted,
      adjustmentDays,
    };
  } catch {
    // Fallback if Intl calendar fails
    return {
      day: 16,
      monthIndex: 5,
      monthName: 'Jumadilawal',
      year: 1448,
      dayName,
      formatted: `16 Jumadilawal 1448 H`,
      gregorianFormatted,
      adjustmentDays,
    };
  }
}

export interface HijriCalendarDay {
  gregorianDate: Date;
  hijriDay: number;
  hijriMonth: number;
  hijriYear: number;
  isToday: boolean;
  holiday?: IslamicHoliday;
}

/**
 * Generate calendar days for a 35-day grid centered on the given date
 */
export function getHijriCalendarMonth(
  centerDate: Date,
  adjustmentDays: number = 0
): {
  days: HijriCalendarDay[];
  currentHijriInfo: HijriDateInfo;
} {
  const currentHijriInfo = getHijriDate(centerDate, adjustmentDays);

  const startOfMonth = new Date(centerDate.getFullYear(), centerDate.getMonth(), 1);
  const startDayOfWeek = startOfMonth.getDay(); // 0 is Sunday

  // Move back to Sunday of the first week
  const startDate = new Date(startOfMonth);
  startDate.setDate(startDate.getDate() - startDayOfWeek);

  const days: HijriCalendarDay[] = [];
  const todayStr = new Date().toDateString();

  for (let i = 0; i < 35; i++) {
    const curDate = new Date(startDate);
    curDate.setDate(startDate.getDate() + i);

    const hInfo = getHijriDate(curDate, adjustmentDays);
    const holiday = ISLAMIC_HOLIDAYS.find(
      (h) => h.hijriMonth === hInfo.monthIndex && h.hijriDay === hInfo.day
    );

    days.push({
      gregorianDate: curDate,
      hijriDay: hInfo.day,
      hijriMonth: hInfo.monthIndex,
      hijriYear: hInfo.year,
      isToday: curDate.toDateString() === todayStr,
      holiday,
    });
  }

  return { days, currentHijriInfo };
}
