import React, { useState } from 'react';
import { APP_CONFIG } from '../config/appConfig';
import { usePWAInstall } from '../hooks/usePWA';
import { BookOpen, Bookmark, Search, Settings, Home, Download, Moon, Sun, Menu, X, Clock, Calendar } from 'lucide-react';

export type NavView = 'home' | 'surahList' | 'reader' | 'bookmarks' | 'prayerTimes' | 'hijriCalendar' | 'search' | 'settings';

interface NavbarProps {
  currentView: NavView;
  onNavigate: (view: NavView, params?: any) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, isDark, onToggleTheme }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  const navItems = [
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'surahList', label: 'Daftar Surat', icon: BookOpen },
    { id: 'prayerTimes', label: 'Jadwal Salat', icon: Clock },
    { id: 'hijriCalendar', label: 'Kalender Hijriah', icon: Calendar },
    { id: 'bookmarks', label: 'Bookmark', icon: Bookmark },
    { id: 'search', label: 'Pencarian', icon: Search },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ] as const;

  const handleNavClick = (view: NavView) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  const handleInstallClick = () => {
    if (isInstallable) {
      install();
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b transition-colors duration-200 bg-[#064E3B] text-[#FFF8E7] border-[#047857]/40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand Identity */}
            <button
              onClick={() => handleNavClick('home')}
              className="flex items-center gap-3 group text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
              aria-label="Kembali ke Beranda Muslim Quran"
            >
              <div className="w-10 h-10 rounded-xl bg-[#022C22] border border-[#D4AF37]/50 flex items-center justify-center p-1.5 shadow-inner transition-transform group-hover:scale-105">
                <img src="/icon.svg" alt="Muslim Quran Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-tight tracking-wide text-[#FFF8E7] flex items-center gap-1.5">
                  {APP_CONFIG.appName}
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                </span>
                <span className="text-[11px] text-[#F5D782] tracking-normal font-medium hidden sm:inline-block">
                  {APP_CONFIG.tagline}
                </span>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1.5" aria-label="Navigasi Utama">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#047857] text-[#FFF8E7] shadow-xs'
                        : 'text-[#FFF8E7]/80 hover:text-[#FFF8E7] hover:bg-[#022C22]/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#D4AF37]' : 'text-current'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Actions: Theme Toggle, Install PWA, Mobile Menu */}
            <div className="flex items-center gap-2">
              {!isInstalled && (isInstallable || isIOS) && (
                <button
                  onClick={handleInstallClick}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37] text-[#022C22] hover:bg-[#F5D782] text-xs font-semibold shadow-xs transition cursor-pointer"
                  title="Install Aplikasi Muslim Quran"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install App</span>
                </button>
              )}

              <button
                onClick={onToggleTheme}
                aria-label={isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
                className="p-2 rounded-lg text-[#FFF8E7]/80 hover:text-[#FFF8E7] hover:bg-[#022C22]/60 transition cursor-pointer"
              >
                {isDark ? <Sun className="w-5 h-5 text-[#F5D782]" /> : <Moon className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Buka Menu"
                className="md:hidden p-2 rounded-lg text-[#FFF8E7]/80 hover:text-[#FFF8E7] hover:bg-[#022C22]/60 transition cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#047857]/40 bg-[#022C22] px-4 pt-3 pb-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                    isActive
                      ? 'bg-[#047857] text-[#FFF8E7]'
                      : 'text-[#FFF8E7]/80 hover:bg-[#064E3B] hover:text-[#FFF8E7]'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#D4AF37]' : 'text-current'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {!isInstalled && (isInstallable || isIOS) && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleInstallClick();
                }}
                className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#D4AF37] text-[#022C22] font-semibold text-sm shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Install Muslim Quran ke Layar Utama</span>
              </button>
            )}
          </div>
        )}
      </header>

      {/* iOS Install Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#FFF8E7] p-6 text-[#1F2937] shadow-2xl border border-[#D4AF37]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#064E3B] p-2 flex items-center justify-center">
                <img src="/icon.svg" alt="App Icon" className="w-full h-full" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#064E3B]">Install Muslim Quran</h3>
                <p className="text-xs text-gray-600">Panduan untuk iPhone / iPad</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-700 my-4 bg-white/80 p-3 rounded-xl border border-gray-200">
              <p className="flex items-start gap-2">
                <span className="font-bold text-[#064E3B]">1.</span>
                <span>Ketuk ikon <strong>Bagikan (Share)</strong> di bilah bawah Safari.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-bold text-[#064E3B]">2.</span>
                <span>Gulir ke bawah dan pilih <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-bold text-[#064E3B]">3.</span>
                <span>Buka aplikasi dari layar utama untuk pengalaman tanpa gangguan.</span>
              </p>
            </div>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full rounded-xl bg-[#064E3B] text-[#FFF8E7] py-2.5 text-sm font-semibold hover:bg-[#047857] transition cursor-pointer"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
