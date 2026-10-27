export type PrayerName = 'imsak' | 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerTimeItem {
  id: PrayerName;
  nameIndo: string;
  nameArabic: string;
  time: string; // HH:mm format
  date: Date;
  isNext: boolean;
  isCurrent: boolean;
  isObligatory: boolean; // false for imsak & sunrise
}

export interface LocationConfig {
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isCustomGps?: boolean;
}

export type CalculationMethodKey =
  | 'Kemenag'
  | 'MuslimWorldLeague'
  | 'Egyptian'
  | 'UmmAlQura'
  | 'Karachi'
  | 'NorthAmerica'
  | 'Dubai'
  | 'Singapore';

export interface PrayerSettings {
  location: LocationConfig;
  calculationMethod: CalculationMethodKey;
  asrMadhab: 'shafi' | 'hanafi';
  minuteAdjustments: {
    imsak: number;
    fajr: number;
    sunrise: number;
    dhuhr: number;
    asr: number;
    maghrib: number;
    isha: number;
  };
}

export interface AzanAudioOption {
  id: string;
  name: string;
  muazzin: string;
  url: string;
  duration: number; // in seconds
}

export interface AzanSettings {
  selectedAudioId: string;
  volume: number; // 0.0 to 1.0
  isSilentMode: boolean;
  enableNotification: boolean;
  prayers: {
    fajr: { enabled: boolean; audioEnabled: boolean };
    dhuhr: { enabled: boolean; audioEnabled: boolean };
    asr: { enabled: boolean; audioEnabled: boolean };
    maghrib: { enabled: boolean; audioEnabled: boolean };
    isha: { enabled: boolean; audioEnabled: boolean };
  };
}

export interface HijriDateInfo {
  day: number;
  monthIndex: number; // 1-12
  monthName: string;
  year: number;
  dayName: string;
  formatted: string; // e.g. "16 Jumadilawal 1448 H"
  gregorianFormatted: string; // e.g. "Selasa, 27 Oktober 2026"
  adjustmentDays: number;
}

export interface IslamicHoliday {
  hijriDay: number;
  hijriMonth: number;
  name: string;
  description: string;
  isImportant: boolean;
}
