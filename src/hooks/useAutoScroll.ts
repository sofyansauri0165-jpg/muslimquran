import { useEffect, useRef, useState, useCallback } from 'react';

export type ScrollState = 'stopped' | 'running' | 'paused';

interface UseAutoScrollOptions {
  onEnd?: () => void;
}

export function useAutoScroll(options?: UseAutoScrollOptions) {
  const [scrollState, setScrollState] = useState<ScrollState>('stopped');
  const [speed, setSpeed] = useState<number>(2); // 1 = slow, 2 = normal, 3 = fast, 4 = faster, 5 = max

  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const speedRef = useRef<number>(speed);
  speedRef.current = speed;

  const stateRef = useRef<ScrollState>(scrollState);
  stateRef.current = scrollState;

  const stop = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    lastTimeRef.current = null;
    setScrollState('stopped');
  }, []);

  const pause = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    lastTimeRef.current = null;
    setScrollState('paused');
  }, []);

  const scrollLoop = useCallback((timestamp: number) => {
    if (stateRef.current !== 'running') return;

    if (lastTimeRef.current === null) {
      lastTimeRef.current = timestamp;
    }

    const elapsed = timestamp - lastTimeRef.current;

    // Base speed in pixels per second: speed 1=25px/s, 2=50px/s, 3=85px/s, 4=130px/s, 5=190px/s
    const speedMap: Record<number, number> = {
      1: 28,
      2: 55,
      3: 90,
      4: 135,
      5: 190,
    };

    const pxPerSec = speedMap[speedRef.current] || 55;
    const deltaY = (pxPerSec * elapsed) / 1000;

    if (deltaY >= 0.5) {
      window.scrollBy({ top: deltaY, left: 0, behavior: 'auto' });
      lastTimeRef.current = timestamp;

      // Check if reached bottom
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 10;
      if (atBottom) {
        stop();
        options?.onEnd?.();
        return;
      }
    }

    animFrameRef.current = requestAnimationFrame(scrollLoop);
  }, [options, stop]);

  const start = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
    }
    lastTimeRef.current = null;
    setScrollState('running');
    stateRef.current = 'running';
    animFrameRef.current = requestAnimationFrame(scrollLoop);
  }, [scrollLoop]);

  const resume = useCallback(() => {
    start();
  }, [start]);

  // Handle visibility change (tab backgrounding)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && stateRef.current === 'running') {
        pause();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pause]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return {
    scrollState,
    speed,
    setSpeed,
    start,
    pause,
    resume,
    stop,
  };
}
