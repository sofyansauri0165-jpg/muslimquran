import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AzanAudioOption, AzanSettings, PrayerName } from '../types/prayerAndHijri';
import { calculatePrayerTimes, DEFAULT_PRAYER_SETTINGS } from '../services/prayerTimeService';

export const AZAN_AUDIO_OPTIONS: AzanAudioOption[] = [
  {
    id: 'standard',
    name: 'Azan Klasik Penuh',
    muazzin: 'Aaqib Azeez (Suara Merdu & Khusyuk)',
    url: '/audio/adhan-standard.mp3',
    duration: 86,
  },
  {
    id: 'makkah',
    name: 'Azan Makkah Al-Mukarramah',
    muazzin: 'Muazin Masjidil Haram Makkah',
    url: '/audio/adhan-makkah.ogg',
    duration: 180,
  },
  {
    id: 'short',
    name: 'Azan Nada Notifikasi',
    muazzin: 'Takbir & Panggilan Salat Ringkas',
    url: '/audio/adhan-short.ogg',
    duration: 30,
  },
];

export const DEFAULT_AZAN_SETTINGS: AzanSettings = {
  selectedAudioId: 'standard',
  volume: 0.9,
  isSilentMode: false,
  enableNotification: false,
  prayers: {
    fajr: { enabled: true, audioEnabled: true },
    dhuhr: { enabled: true, audioEnabled: true },
    asr: { enabled: true, audioEnabled: true },
    maghrib: { enabled: true, audioEnabled: true },
    isha: { enabled: true, audioEnabled: true },
  },
};

interface AzanContextType {
  isAzanPlaying: boolean;
  activeAzanPrayer: PrayerName | null;
  azanSettings: AzanSettings;
  updateAzanSettings: (newSettings: Partial<AzanSettings>) => void;
  playAzan: (prayerName?: PrayerName, audioId?: string) => void;
  stopAzan: () => void;
  testNotification: () => void;
  requestNotificationPermission: () => Promise<boolean>;
  notificationPermission: NotificationPermission;
  showAutoplayBanner: boolean;
  dismissAutoplayBanner: () => void;
}

const AzanContext = createContext<AzanContextType | undefined>(undefined);

export const AzanProvider: React.FC<{
  children: React.ReactNode;
  onAzanStart?: () => void; // Used to pause Murottal if playing
}> = ({ children, onAzanStart }) => {
  const azanAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isAzanPlaying, setIsAzanPlaying] = useState(false);
  const [activeAzanPrayer, setActiveAzanPrayer] = useState<PrayerName | null>(null);
  const [azanSettings, setAzanSettings] = useState<AzanSettings>(() => {
    try {
      const saved = localStorage.getItem('mq_azan_settings');
      return saved ? JSON.parse(saved) : DEFAULT_AZAN_SETTINGS;
    } catch {
      return DEFAULT_AZAN_SETTINGS;
    }
  });

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });

  const [showAutoplayBanner, setShowAutoplayBanner] = useState(false);
  const lastTriggeredKeyRef = useRef<string>('');

  // Initialize Audio element
  useEffect(() => {
    const audio = new Audio();
    azanAudioRef.current = audio;
    audio.preload = 'auto';

    const handleEnded = () => {
      setIsAzanPlaying(false);
      setActiveAzanPrayer(null);
    };

    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('ended', handleEnded);
      audio.src = '';
    };
  }, []);

  const updateAzanSettings = (newSettings: Partial<AzanSettings>) => {
    setAzanSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('mq_azan_settings', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const playAzan = (prayerName?: PrayerName, audioId?: string) => {
    if (azanSettings.isSilentMode) return;

    onAzanStart?.(); // notify to pause murottal

    const targetAudioId = audioId || azanSettings.selectedAudioId;
    const audioOpt = AZAN_AUDIO_OPTIONS.find((a) => a.id === targetAudioId) || AZAN_AUDIO_OPTIONS[0];

    if (azanAudioRef.current) {
      azanAudioRef.current.src = audioOpt.url;
      azanAudioRef.current.volume = azanSettings.volume;
      azanAudioRef.current
        .play()
        .then(() => {
          setIsAzanPlaying(true);
          setActiveAzanPrayer(prayerName || 'dhuhr');
          setShowAutoplayBanner(false);
        })
        .catch((err) => {
          console.warn('Autoplay prevented by browser:', err);
          // If browser blocked autoplay, show unblock banner
          setShowAutoplayBanner(true);
        });
    }
  };

  const stopAzan = () => {
    if (azanAudioRef.current) {
      azanAudioRef.current.pause();
      azanAudioRef.current.currentTime = 0;
    }
    setIsAzanPlaying(false);
    setActiveAzanPrayer(null);
    setShowAutoplayBanner(false);
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Browser ini tidak mendukung Web Notifications.');
      return false;
    }
    const perm = await Notification.requestPermission();
    setNotificationPermission(perm);
    const granted = perm === 'granted';
    updateAzanSettings({ enableNotification: granted });
    return granted;
  };

  const testNotification = () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Muslim Quran — Uji Notifikasi Azan', {
        body: 'Alhamdulillah! Notifikasi waktu salat berfungsi dengan baik.',
        icon: '/icon.svg',
      });
    } else {
      requestNotificationPermission().then((granted) => {
        if (granted) {
          new Notification('Muslim Quran — Uji Notifikasi Azan', {
            body: 'Notifikasi berhasil diaktifkan.',
            icon: '/icon.svg',
          });
        }
      });
    }
  };

  // Live monitor for prayer times every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      // Load current prayer settings from local storage or default
      let pSettings = DEFAULT_PRAYER_SETTINGS;
      try {
        const saved = localStorage.getItem('mq_prayer_settings');
        if (saved) pSettings = JSON.parse(saved);
      } catch {
        // default
      }

      const { items } = calculatePrayerTimes(new Date(), pSettings);
      const now = new Date();
      const nowHours = now.getHours();
      const nowMins = now.getMinutes();
      const nowTimeStr = `${nowHours.toString().padStart(2, '0')}:${nowMins.toString().padStart(2, '0')}`;
      const todayDateStr = now.toISOString().slice(0, 10);

      const obligatoryKeys: (keyof typeof azanSettings.prayers)[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

      for (const pKey of obligatoryKeys) {
        const item = items.find((i) => i.id === pKey);
        if (!item) continue;

        if (item.time === nowTimeStr) {
          const triggerKey = `${todayDateStr}_${pKey}`;
          if (lastTriggeredKeyRef.current !== triggerKey) {
            lastTriggeredKeyRef.current = triggerKey;

            const prayerCfg = azanSettings.prayers[pKey];
            if (prayerCfg && prayerCfg.enabled) {
              // 1. Dispatch Notification
              if (azanSettings.enableNotification && typeof window !== 'undefined' && 'Notification' in window) {
                if (Notification.permission === 'granted') {
                  new Notification(`Waktu Salat ${item.nameIndo} Telah Tiba`, {
                    body: `Saatnya menunaikan salat ${item.nameIndo} untuk wilayah ${pSettings.location.name}. Hayya 'alas-salah.`,
                    icon: '/icon.svg',
                  });
                }
              }

              // 2. Play Audio if enabled and not silent
              if (prayerCfg.audioEnabled && !azanSettings.isSilentMode) {
                playAzan(pKey as PrayerName);
              }
            }
          }
        }
      }
    }, 10000);

    return () => clearInterval(timer);
  }, [azanSettings]);

  return (
    <AzanContext.Provider
      value={{
        isAzanPlaying,
        activeAzanPrayer,
        azanSettings,
        updateAzanSettings,
        playAzan,
        stopAzan,
        testNotification,
        requestNotificationPermission,
        notificationPermission,
        showAutoplayBanner,
        dismissAutoplayBanner: () => setShowAutoplayBanner(false),
      }}
    >
      {children}
    </AzanContext.Provider>
  );
};

export function useAzan() {
  const context = useContext(AzanContext);
  if (!context) {
    throw new Error('useAzan must be used within an AzanProvider');
  }
  return context;
}
