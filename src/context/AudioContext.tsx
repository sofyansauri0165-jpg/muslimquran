import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { QARI_LIST, QariId } from '../config/appConfig';
import { Ayat } from '../types/quran';

export type AudioMode = 'fullSurah' | 'perAyat';

export interface AudioTrackInfo {
  surahNumber: number;
  surahNameLatin: string;
  ayatNumber?: number; // undefined if full surah
  totalAyat: number;
  allAyats?: Ayat[];
}

interface AudioContextType {
  isPlaying: boolean;
  isBuffering: boolean;
  currentTrack: AudioTrackInfo | null;
  audioMode: AudioMode;
  selectedQari: QariId;
  duration: number;
  currentTime: number;
  volume: number;
  playbackRate: number;
  error: string | null;
  playSurahFull: (surahNumber: number, surahNameLatin: string, audioUrl: string, totalAyat: number) => void;
  playAyat: (surahNumber: number, surahNameLatin: string, ayat: Ayat, allAyats: Ayat[]) => void;
  pause: () => void;
  resume: () => void;
  togglePlayPause: () => void;
  seek: (seconds: number) => void;
  setVolume: (val: number) => void;
  setPlaybackRate: (val: number) => void;
  setSelectedQari: (qari: QariId) => void;
  stop: () => void;
  playNextAyat: () => void;
  playPrevAyat: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<AudioTrackInfo | null>(null);
  const [audioMode, setAudioMode] = useState<AudioMode>('perAyat');
  const [selectedQari, setSelectedQariState] = useState<QariId>('05'); // Default Misyari Rasyid
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    audio.preload = 'metadata';

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsBuffering(false);
    };
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    const handleError = () => {
      setIsBuffering(false);
      setIsPlaying(false);
      setError('Gagal memuat audio murottal dari server. Silakan coba lagi nanti.');
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('error', handleError);

    return () => {
      audio.pause();
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('error', handleError);
      audio.src = '';
    };
  }, []);

  // Continuous ayat playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (audioMode === 'perAyat' && currentTrack?.allAyats && currentTrack.ayatNumber) {
        const nextAyat = currentTrack.allAyats.find((a) => a.nomorAyat === currentTrack.ayatNumber! + 1);
        if (nextAyat) {
          playAyat(currentTrack.surahNumber, currentTrack.surahNameLatin, nextAyat, currentTrack.allAyats);
          return;
        }
      }
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [audioMode, currentTrack, selectedQari]);

  const setSelectedQari = (qari: QariId) => {
    setSelectedQariState(qari);
    if (currentTrack && audioMode === 'perAyat' && currentTrack.allAyats && currentTrack.ayatNumber) {
      const currentAyat = currentTrack.allAyats.find((a) => a.nomorAyat === currentTrack.ayatNumber);
      if (currentAyat && currentAyat.audio && currentAyat.audio[qari]) {
        if (audioRef.current) {
          const wasPlaying = isPlaying;
          audioRef.current.src = currentAyat.audio[qari];
          if (wasPlaying) {
            audioRef.current.play().catch(console.warn);
          }
        }
      }
    }
  };

  const playSurahFull = (surahNumber: number, surahNameLatin: string, audioUrl: string, totalAyat: number) => {
    if (!audioRef.current) return;
    setError(null);
    setAudioMode('fullSurah');
    setCurrentTrack({
      surahNumber,
      surahNameLatin,
      totalAyat,
    });
    audioRef.current.src = audioUrl;
    audioRef.current.playbackRate = playbackRate;
    audioRef.current.volume = volume;
    audioRef.current.play().catch((err) => {
      setError('Tidak dapat memutar audio: ' + err.message);
    });
  };

  const playAyat = (surahNumber: number, surahNameLatin: string, ayat: Ayat, allAyats: Ayat[]) => {
    if (!audioRef.current) return;
    setError(null);
    const audioUrl = ayat.audio?.[selectedQari] || Object.values(ayat.audio || {})[0];

    if (!audioUrl) {
      setError('Audio untuk ayat ini belum tersedia.');
      return;
    }

    setAudioMode('perAyat');
    setCurrentTrack({
      surahNumber,
      surahNameLatin,
      ayatNumber: ayat.nomorAyat,
      totalAyat: allAyats.length,
      allAyats,
    });

    audioRef.current.src = audioUrl;
    audioRef.current.playbackRate = playbackRate;
    audioRef.current.volume = volume;
    audioRef.current.play().catch((err) => {
      setError('Tidak dapat memutar audio: ' + err.message);
    });
  };

  const pause = () => {
    audioRef.current?.pause();
  };

  const resume = () => {
    audioRef.current?.play().catch(console.warn);
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const seek = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  };

  const setVolume = (val: number) => {
    setVolumeState(val);
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, val));
    }
  };

  const setPlaybackRate = (val: number) => {
    setPlaybackRateState(val);
    if (audioRef.current) {
      audioRef.current.playbackRate = val;
    }
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
    }
    setIsPlaying(false);
    setCurrentTrack(null);
  };

  const playNextAyat = () => {
    if (currentTrack?.allAyats && currentTrack.ayatNumber) {
      const next = currentTrack.allAyats.find((a) => a.nomorAyat === currentTrack.ayatNumber! + 1);
      if (next) {
        playAyat(currentTrack.surahNumber, currentTrack.surahNameLatin, next, currentTrack.allAyats);
      }
    }
  };

  const playPrevAyat = () => {
    if (currentTrack?.allAyats && currentTrack.ayatNumber && currentTrack.ayatNumber > 1) {
      const prev = currentTrack.allAyats.find((a) => a.nomorAyat === currentTrack.ayatNumber! - 1);
      if (prev) {
        playAyat(currentTrack.surahNumber, currentTrack.surahNameLatin, prev, currentTrack.allAyats);
      }
    }
  };

  return (
    <AudioContext.Provider
      value={{
        isPlaying,
        isBuffering,
        currentTrack,
        audioMode,
        selectedQari,
        duration,
        currentTime,
        volume,
        playbackRate,
        error,
        playSurahFull,
        playAyat,
        pause,
        resume,
        togglePlayPause,
        seek,
        setVolume,
        setPlaybackRate,
        setSelectedQari,
        stop,
        playNextAyat,
        playPrevAyat,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
