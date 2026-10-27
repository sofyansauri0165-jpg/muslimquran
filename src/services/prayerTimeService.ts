import {
  Coordinates,
  CalculationMethod,
  PrayerTimes,
  Madhab,
  CalculationParameters,
} from 'adhan';
import {
  CalculationMethodKey,
  LocationConfig,
  PrayerName,
  PrayerSettings,
  PrayerTimeItem,
} from '../types/prayerAndHijri';

// Default major cities presets (focusing on Indonesia and major Islamic centers)
export const CITY_PRESETS: LocationConfig[] = [
  { name: 'DKI Jakarta', latitude: -6.2088, longitude: 106.8456, timezone: 'Asia/Jakarta' },
  { name: 'Surabaya, Jawa Timur', latitude: -7.2575, longitude: 112.7521, timezone: 'Asia/Jakarta' },
  { name: 'Bandung, Jawa Barat', latitude: -6.9175, longitude: 107.6191, timezone: 'Asia/Jakarta' },
  { name: 'Medan, Sumatera Utara', latitude: 3.5952, longitude: 98.6722, timezone: 'Asia/Jakarta' },
  { name: 'Semarang, Jawa Tengah', latitude: -6.9667, longitude: 110.4167, timezone: 'Asia/Jakarta' },
  { name: 'Makassar, Sulawesi Selatan', latitude: -5.1477, longitude: 119.4327, timezone: 'Asia/Makassar' },
  { name: 'Palembang, Sumatera Selatan', latitude: -2.9761, longitude: 104.7754, timezone: 'Asia/Jakarta' },
  { name: 'Yogyakarta, D.I. Yogyakarta', latitude: -7.7956, longitude: 110.3695, timezone: 'Asia/Jakarta' },
  { name: 'Banda Aceh, Aceh', latitude: 5.5483, longitude: 95.3238, timezone: 'Asia/Jakarta' },
  { name: 'Padang, Sumatera Barat', latitude: -0.9471, longitude: 100.4172, timezone: 'Asia/Jakarta' },
  { name: 'Pekanbaru, Riau', latitude: 0.5071, longitude: 101.4478, timezone: 'Asia/Jakarta' },
  { name: 'Bandar Lampung, Lampung', latitude: -5.4297, longitude: 105.2625, timezone: 'Asia/Jakarta' },
  { name: 'Denpasar, Bali', latitude: -8.6705, longitude: 115.2126, timezone: 'Asia/Makassar' },
  { name: 'Banjarmasin, Kalsel', latitude: -3.3194, longitude: 114.5908, timezone: 'Asia/Makassar' },
  { name: 'Balikpapan, Kaltim', latitude: -1.2379, longitude: 116.8289, timezone: 'Asia/Makassar' },
  { name: 'Pontianak, Kalbar', latitude: -0.0263, longitude: 109.3425, timezone: 'Asia/Pontianak' },
  { name: 'Mataram, NTB', latitude: -8.5833, longitude: 116.1167, timezone: 'Asia/Makassar' },
  { name: 'Kupang, NTT', latitude: -10.1772, longitude: 123.607, timezone: 'Asia/Makassar' },
  { name: 'Manado, Sulawesi Utara', latitude: 1.4748, longitude: 124.8421, timezone: 'Asia/Makassar' },
  { name: 'Ambon, Maluku', latitude: -3.6547, longitude: 128.1906, timezone: 'Asia/Jayapura' },
  { name: 'Jayapura, Papua', latitude: -2.5337, longitude: 140.7181, timezone: 'Asia/Jayapura' },
  { name: 'Makkah Al-Mukarramah', latitude: 21.4225, longitude: 39.8262, timezone: 'Asia/Riyadh' },
  { name: 'Madinah Al-Munawwarah', latitude: 24.5247, longitude: 39.5692, timezone: 'Asia/Riyadh' },
  { name: 'Kuala Lumpur, Malaysia', latitude: 3.139, longitude: 101.6869, timezone: 'Asia/Kuala_Lumpur' },
  { name: 'Singapore', latitude: 1.3521, longitude: 103.8198, timezone: 'Asia/Singapore' },
];

export const DEFAULT_PRAYER_SETTINGS: PrayerSettings = {
  location: CITY_PRESETS[0], // Jakarta default
  calculationMethod: 'Kemenag',
  asrMadhab: 'shafi',
  minuteAdjustments: {
    imsak: 0,
    fajr: 0,
    sunrise: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
  },
};

function getAdhanParameters(method: CalculationMethodKey, madhab: 'shafi' | 'hanafi'): CalculationParameters {
  let params: CalculationParameters;

  switch (method) {
    case 'Kemenag':
    case 'Singapore':
      // Kemenag RI / Singapore standard: Fajr 20 deg, Isha 18 deg
      params = CalculationMethod.Singapore();
      break;
    case 'MuslimWorldLeague':
      params = CalculationMethod.MuslimWorldLeague();
      break;
    case 'Egyptian':
      params = CalculationMethod.Egyptian();
      break;
    case 'UmmAlQura':
      params = CalculationMethod.UmmAlQura();
      break;
    case 'Karachi':
      params = CalculationMethod.Karachi();
      break;
    case 'NorthAmerica':
      params = CalculationMethod.NorthAmerica();
      break;
    case 'Dubai':
      params = CalculationMethod.Dubai();
      break;
    default:
      params = CalculationMethod.Singapore();
  }

  params.madhab = madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  return params;
}

function formatTime24(date: Date, timezone?: string): string {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone || undefined,
    }).format(date);
  } catch {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }
}

/**
 * Calculate full prayer times for a given date, location and settings.
 */
export function calculatePrayerTimes(
  targetDate: Date,
  settings: PrayerSettings = DEFAULT_PRAYER_SETTINGS
): {
  items: PrayerTimeItem[];
  nextPrayer: PrayerTimeItem | null;
  currentPrayer: PrayerTimeItem | null;
  countdown: { hours: number; minutes: number; seconds: number; totalSeconds: number };
} {
  const coordinates = new Coordinates(settings.location.latitude, settings.location.longitude);
  const params = getAdhanParameters(settings.calculationMethod, settings.asrMadhab);

  const adhanPT = new PrayerTimes(coordinates, targetDate, params);

  // Apply minute adjustments
  const applyAdj = (d: Date, mins: number) => new Date(d.getTime() + mins * 60 * 1000);

  const fajrDate = applyAdj(adhanPT.fajr, settings.minuteAdjustments.fajr);
  const sunriseDate = applyAdj(adhanPT.sunrise, settings.minuteAdjustments.sunrise);
  const dhuhrDate = applyAdj(adhanPT.dhuhr, settings.minuteAdjustments.dhuhr);
  const asrDate = applyAdj(adhanPT.asr, settings.minuteAdjustments.asr);
  const maghribDate = applyAdj(adhanPT.maghrib, settings.minuteAdjustments.maghrib);
  const ishaDate = applyAdj(adhanPT.isha, settings.minuteAdjustments.isha);

  // Imsak is traditionally 10 minutes before Fajr in Indonesia
  const imsakDate = applyAdj(fajrDate, -10 + settings.minuteAdjustments.imsak);

  const tz = settings.location.timezone;

  const rawItems: {
    id: PrayerName;
    nameIndo: string;
    nameArabic: string;
    date: Date;
    isObligatory: boolean;
  }[] = [
    { id: 'imsak', nameIndo: 'Imsak', nameArabic: 'الإمساك', date: imsakDate, isObligatory: false },
    { id: 'fajr', nameIndo: 'Subuh', nameArabic: 'الفجر', date: fajrDate, isObligatory: true },
    { id: 'sunrise', nameIndo: 'Terbit (Syuruq)', nameArabic: 'الشروق', date: sunriseDate, isObligatory: false },
    { id: 'dhuhr', nameIndo: 'Zuhur', nameArabic: 'الظهر', date: dhuhrDate, isObligatory: true },
    { id: 'asr', nameIndo: 'Asar', nameArabic: 'العصر', date: asrDate, isObligatory: true },
    { id: 'maghrib', nameIndo: 'Magrib', nameArabic: 'المغرب', date: maghribDate, isObligatory: true },
    { id: 'isha', nameIndo: 'Isya', nameArabic: 'العشاء', date: ishaDate, isObligatory: true },
  ];

  const now = new Date();

  // Determine current & next prayer (focusing on the 5 obligatory prayers + imsak)
  let nextPrayerRaw: typeof rawItems[0] | null = null;
  let currentPrayerRaw: typeof rawItems[0] | null = null;

  for (let i = 0; i < rawItems.length; i++) {
    const item = rawItems[i];
    if (now < item.date) {
      nextPrayerRaw = item;
      currentPrayerRaw = i > 0 ? rawItems[i - 1] : rawItems[rawItems.length - 1];
      break;
    }
  }

  // If passed Isha today, next is tomorrow's Imsak / Subuh
  if (!nextPrayerRaw) {
    const tomorrow = new Date(targetDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowPT = new PrayerTimes(coordinates, tomorrow, params);
    const tomorrowFajr = applyAdj(tomorrowPT.fajr, settings.minuteAdjustments.fajr);
    const tomorrowImsak = applyAdj(tomorrowFajr, -10 + settings.minuteAdjustments.imsak);

    nextPrayerRaw = {
      id: 'fajr',
      nameIndo: 'Subuh (Besok)',
      nameArabic: 'الفجر',
      date: tomorrowFajr,
      isObligatory: true,
    };
    currentPrayerRaw = rawItems.find((r) => r.id === 'isha') || null;
  }

  // Calculate countdown
  let diffSec = nextPrayerRaw ? Math.max(0, Math.floor((nextPrayerRaw.date.getTime() - now.getTime()) / 1000)) : 0;
  const hours = Math.floor(diffSec / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;

  const items: PrayerTimeItem[] = rawItems.map((item) => ({
    ...item,
    time: formatTime24(item.date, tz),
    isNext: nextPrayerRaw?.id === item.id,
    isCurrent: currentPrayerRaw?.id === item.id,
  }));

  const nextPrayerItem: PrayerTimeItem | null = nextPrayerRaw
    ? {
        ...nextPrayerRaw,
        time: formatTime24(nextPrayerRaw.date, tz),
        isNext: true,
        isCurrent: false,
      }
    : null;

  const currentPrayerItem: PrayerTimeItem | null = currentPrayerRaw
    ? {
        ...currentPrayerRaw,
        time: formatTime24(currentPrayerRaw.date, tz),
        isNext: false,
        isCurrent: true,
      }
    : null;

  return {
    items,
    nextPrayer: nextPrayerItem,
    currentPrayer: currentPrayerItem,
    countdown: { hours, minutes, seconds, totalSeconds: diffSec },
  };
}

/**
 * Request device location via Geolocation API with explicit explanation
 */
export async function requestDeviceLocation(): Promise<LocationConfig> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation API tidak didukung pada browser ini.');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lng = Number(pos.coords.longitude.toFixed(4));
        // Approximate timezone from browser
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta';

        resolve({
          name: 'Lokasi Perangkat (GPS)',
          latitude: lat,
          longitude: lng,
          timezone,
          isCustomGps: true,
        });
      },
      (err) => {
        let msg = 'Izin lokasi ditolak atau tidak dapat diakses.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Izin lokasi ditolak oleh pengguna. Silakan pilih kota secara manual dari daftar.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Permintaan lokasi memakan waktu terlalu lama. Silakan pilih kota secara manual.';
        }
        reject(new Error(msg));
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  });
}
