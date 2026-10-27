import React, { useEffect, useState } from 'react';
import { Navbar, NavView } from './components/Navbar';
import { HomeView } from './views/HomeView';
import { SurahListView } from './views/SurahListView';
import { QuranReaderView } from './views/QuranReaderView';
import { BookmarksView } from './views/BookmarksView';
import { SearchView } from './views/SearchView';
import { SettingsView } from './views/SettingsView';
import { PrayerTimesView } from './views/PrayerTimesView';
import { HijriCalendarView } from './views/HijriCalendarView';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { AzanActiveBanner } from './components/AzanActiveBanner';
import { AudioProvider, useAudio } from './context/AudioContext';
import { AzanProvider } from './context/AzanContext';
import { SurahSummary, UserSettings } from './types/quran';
import { getSurahList } from './services/quranApi';
import { DEFAULT_SETTINGS, getUserSettings, saveUserSettings } from './services/storage';
import { initSearchIndex } from './services/searchIndexer';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from './hooks/usePWA';

function AppContent() {
  const isOnline = useOnlineStatus();
  const [currentView, setCurrentView] = useState<NavView>('home');
  const [activeSurahNumber, setActiveSurahNumber] = useState<number>(1);
  const [targetAyatNumber, setTargetAyatNumber] = useState<number | undefined>(undefined);

  const [surahs, setSurahs] = useState<SurahSummary[]>([]);
  const [isLoadingSurahs, setIsLoadingSurahs] = useState<boolean>(true);
  const [surahError, setSurahError] = useState<string | null>(null);

  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const { pause: pauseMurottal } = useAudio();

  // Load User Settings
  useEffect(() => {
    async function loadSettings() {
      const saved = await getUserSettings();
      setSettings(saved);
      applyTheme(saved.theme);
    }
    loadSettings();
  }, []);

  // Sync theme with HTML document
  const applyTheme = (theme: 'light' | 'dark') => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#022C22';
      document.body.style.color = '#FFF8E7';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#F8FAF7';
      document.body.style.color = '#1F2937';
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<UserSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await saveUserSettings(updated);
    if (newSettings.theme) {
      applyTheme(newSettings.theme);
    }
  };

  const handleResetSettings = async () => {
    setSettings(DEFAULT_SETTINGS);
    await saveUserSettings(DEFAULT_SETTINGS);
    applyTheme(DEFAULT_SETTINGS.theme);
  };

  const handleToggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    handleUpdateSettings({ theme: nextTheme });
  };

  // Load 114 Surahs
  const loadSurahs = async () => {
    setIsLoadingSurahs(true);
    setSurahError(null);
    try {
      const list = await getSurahList();
      setSurahs(list);
      initSearchIndex(list).catch(() => {});
    } catch (err: any) {
      setSurahError(err.message || 'Gagal memuat daftar surat');
    } finally {
      setIsLoadingSurahs(false);
    }
  };

  useEffect(() => {
    loadSurahs();
  }, []);

  // Navigation handlers
  const handleNavigate = (view: NavView) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenSurah = (surahNumber: number, ayatNumber?: number) => {
    setActiveSurahNumber(surahNumber);
    setTargetAyatNumber(ayatNumber);
    setCurrentView('reader');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AzanProvider onAzanStart={() => pauseMurottal()}>
      <div className="min-h-screen flex flex-col font-sans transition-colors duration-200">
        {/* Top Navigation Bar */}
        <Navbar
          currentView={currentView}
          onNavigate={handleNavigate}
          isDark={settings.theme === 'dark'}
          onToggleTheme={handleToggleTheme}
        />

        {/* Live Azan Active Sounding Banner & Modal */}
        <AzanActiveBanner />

        {/* Main View Container */}
        <main className="flex-1 w-full pb-20">
          {currentView === 'home' && (
            <HomeView
              surahs={surahs}
              onNavigate={handleNavigate}
              onOpenSurah={handleOpenSurah}
            />
          )}

          {currentView === 'surahList' && (
            <SurahListView
              surahs={surahs}
              isLoading={isLoadingSurahs}
              error={surahError}
              onRetry={loadSurahs}
              onSelectSurah={(num) => handleOpenSurah(num, 1)}
            />
          )}

          {currentView === 'reader' && (
            <QuranReaderView
              surahNumber={activeSurahNumber}
              initialAyatNumber={targetAyatNumber}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onNavigateSurah={(num, ayat) => handleOpenSurah(num, ayat)}
              onBack={() => handleNavigate('surahList')}
            />
          )}

          {currentView === 'prayerTimes' && (
            <PrayerTimesView onNavigateSettings={() => handleNavigate('settings')} />
          )}

          {currentView === 'hijriCalendar' && <HijriCalendarView />}

          {currentView === 'bookmarks' && (
            <BookmarksView
              onOpenAyat={(surahNum, ayatNum) => handleOpenSurah(surahNum, ayatNum)}
            />
          )}

          {currentView === 'search' && (
            <SearchView
              surahs={surahs}
              onOpenAyat={(surahNum, ayatNum) => handleOpenSurah(surahNum, ayatNum)}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onResetSettings={handleResetSettings}
            />
          )}
        </main>

        {/* Offline Toast if disconnected */}
        {!isOnline && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-24 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xl animate-in slide-in-from-bottom"
          >
            <WifiOff className="w-4 h-4" />
            <span>Mode Offline — Menampilkan data tersimpan</span>
          </div>
        )}

        {/* Persistent Audio Murottal Player Bar */}
        <AudioPlayerBar />
      </div>
    </AzanProvider>
  );
}

export default function App() {
  return (
    <AudioProvider>
      <AppContent />
    </AudioProvider>
  );
}
