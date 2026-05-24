import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Manages browser fullscreen state and the auto-hide behaviour of the header
 * overlay during fullscreen playback.
 */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const headerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onFsChange = () => {
      const entering = !!document.fullscreenElement;
      setIsFullscreen(entering);
      if (entering) {
        headerTimerRef.current = setTimeout(() => setHeaderVisible(false), 2000);
      } else {
        if (headerTimerRef.current) clearTimeout(headerTimerRef.current);
        setHeaderVisible(true);
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      if (headerTimerRef.current) clearTimeout(headerTimerRef.current);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const showHeader = useCallback(() => {
    if (headerTimerRef.current) clearTimeout(headerTimerRef.current);
    setHeaderVisible(true);
  }, []);

  const scheduleHideHeader = useCallback(() => {
    if (headerTimerRef.current) clearTimeout(headerTimerRef.current);
    headerTimerRef.current = setTimeout(() => setHeaderVisible(false), 1500);
  }, []);

  return { isFullscreen, headerVisible, toggleFullscreen, showHeader, scheduleHideHeader };
}
