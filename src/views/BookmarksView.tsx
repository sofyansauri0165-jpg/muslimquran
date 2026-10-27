import React, { useEffect, useState } from 'react';
import { Bookmark, ReadingHistoryItem } from '../types/quran';
import {
  getBookmarks,
  removeBookmark,
  updateBookmarkNote,
  getReadingHistory,
  clearReadingHistory,
} from '../services/storage';
import {
  Bookmark as BookmarkIcon,
  Trash2,
  ExternalLink,
  Edit3,
  Clock,
  History,
  Check,
  X,
  BookOpen,
} from 'lucide-react';

interface BookmarksViewProps {
  onOpenAyat: (surahNumber: number, ayatNumber: number) => void;
}

export const BookmarksView: React.FC<BookmarksViewProps> = ({ onOpenAyat }) => {
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'history'>('bookmarks');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const bms = await getBookmarks();
    setBookmarks(bms);
    const hist = await getReadingHistory();
    setHistory(hist);
  }

  const handleDeleteBookmark = async (id: string) => {
    await removeBookmark(id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleStartEditNote = (bm: Bookmark) => {
    setEditingId(bm.id);
    setEditingNoteText(bm.note || '');
  };

  const handleSaveNote = async (id: string) => {
    await updateBookmarkNote(id, editingNoteText.trim());
    setBookmarks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, note: editingNoteText.trim() || undefined } : b))
    );
    setEditingId(null);
  };

  const handleClearHistory = async () => {
    if (window.confirm('Bersihkan seluruh riwayat membaca?')) {
      await clearReadingHistory();
      setHistory([]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#064E3B] dark:text-[#FFF8E7] flex items-center gap-2">
          <BookmarkIcon className="w-6 h-6 text-[#D4AF37]" />
          Bookmark & Riwayat Tilawah
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
          Koleksi ayat yang Anda tandai, catatan tadabbur pribadi, dan jejak riwayat tilawah.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#047857]/20 pb-2">
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'bookmarks'
              ? 'bg-[#064E3B] text-[#FFF8E7] shadow-xs'
              : 'text-gray-600 dark:text-gray-300 hover:bg-[#064E3B]/10'
          }`}
        >
          <BookmarkIcon className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Ayat Ditandai ({bookmarks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'history'
              ? 'bg-[#064E3B] text-[#FFF8E7] shadow-xs'
              : 'text-gray-600 dark:text-gray-300 hover:bg-[#064E3B]/10'
          }`}
        >
          <History className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Riwayat Bacaan ({history.length})</span>
        </button>
      </div>

      {/* TAB 1: BOOKMARKS */}
      {activeTab === 'bookmarks' && (
        <div className="space-y-4">
          {bookmarks.length === 0 ? (
            <div className="rounded-2xl p-10 bg-white dark:bg-[#022C22] border border-[#047857]/20 text-center space-y-3">
              <BookmarkIcon className="w-8 h-8 text-gray-400 mx-auto" />
              <h3 className="text-base font-bold text-gray-700 dark:text-gray-200">Belum Ada Bookmark</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                Saat membaca surat, Anda dapat menekan ikon bookmark pada setiap ayat untuk menyimpannya di sini beserta catatan pribadi.
              </p>
            </div>
          ) : (
            bookmarks.map((bm) => (
              <div
                key={bm.id}
                className="rounded-2xl p-5 bg-white dark:bg-[#022C22] border border-[#047857]/20 dark:border-[#047857]/40 hover:border-[#D4AF37] transition shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-[#064E3B] text-[#D4AF37] font-bold text-xs flex items-center justify-center">
                      {bm.surahNumber}:{bm.ayatNumber}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-[#064E3B] dark:text-[#FFF8E7]">
                        QS. {bm.surahNameLatin} ({bm.ayatNumber})
                      </h4>
                      <span className="text-[10px] text-gray-400">
                        {new Date(bm.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenAyat(bm.surahNumber, bm.ayatNumber)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#064E3B] text-[#FFF8E7] hover:bg-[#047857] text-xs font-semibold cursor-pointer"
                    >
                      <span>Buka Ayat</span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
                    </button>
                    <button
                      onClick={() => handleDeleteBookmark(bm.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 cursor-pointer"
                      title="Hapus Bookmark"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Arabic snippet */}
                <p className="font-quran text-xl text-[#064E3B] dark:text-[#D4AF37] text-right">
                  {bm.teksArab}
                </p>

                {/* Translation */}
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed italic">
                  &quot;{bm.teksIndonesia}&quot;
                </p>

                {/* Personal Note */}
                <div className="pt-2 border-t border-gray-100 dark:border-[#047857]/30">
                  {editingId === bm.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingNoteText}
                        onChange={(e) => setEditingNoteText(e.target.value)}
                        placeholder="Tulis catatan tadabbur..."
                        rows={2}
                        className="w-full p-2 text-xs rounded-lg border border-[#D4AF37] bg-gray-50 dark:bg-[#064E3B]/40 dark:text-white"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700"
                        >
                          Batal
                        </button>
                        <button
                          onClick={() => handleSaveNote(bm.id)}
                          className="px-3 py-1 bg-[#064E3B] text-[#FFF8E7] text-xs font-semibold rounded-lg"
                        >
                          Simpan
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs">
                        <span className="font-semibold text-[#047857] dark:text-[#F5D782]">Catatan: </span>
                        <span className="text-gray-600 dark:text-gray-300">
                          {bm.note || 'Belum ada catatan pribadi.'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleStartEditNote(bm)}
                        className="text-xs text-[#064E3B] dark:text-[#D4AF37] hover:underline flex items-center gap-1 shrink-0"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{bm.note ? 'Ubah' : 'Tambah Catatan'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {history.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={handleClearHistory}
                className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Bersihkan Riwayat</span>
              </button>
            </div>
          )}

          {history.length === 0 ? (
            <div className="rounded-2xl p-10 bg-white dark:bg-[#022C22] border border-[#047857]/20 text-center space-y-3">
              <History className="w-8 h-8 text-gray-400 mx-auto" />
              <h3 className="text-base font-bold text-gray-700 dark:text-gray-200">Belum Ada Riwayat</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                Riwayat bacaan akan dicatat secara otomatis ketika Anda membuka surat dan membaca ayat.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-[#047857]/30 rounded-2xl bg-white dark:bg-[#022C22] border border-[#047857]/20 overflow-hidden">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onOpenAyat(item.surahNumber, item.ayatNumber)}
                  className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#064E3B]/20 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#064E3B] text-[#D4AF37] font-bold text-xs flex items-center justify-center">
                      {item.surahNumber}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#064E3B] dark:text-[#FFF8E7]">
                        {item.surahNameLatin}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Ayat ke-{item.ayatNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {new Date(item.timestamp).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
