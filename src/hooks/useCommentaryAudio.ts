import { useEffect, useRef, useCallback } from 'react';

export function useCommentaryAudio(themeId: string, isGameActive: boolean, segments = 0) {
  const commentaryRef = useRef<HTMLAudioElement | null>(null);
  const bgRef = useRef<HTMLAudioElement | null>(null);
  const segIndexRef = useRef(0);

  const stopAll = useCallback(() => {
    if (commentaryRef.current) {
      commentaryRef.current.onended = null;
      commentaryRef.current.pause();
      commentaryRef.current = null;
    }
    if (bgRef.current) {
      bgRef.current.pause();
      bgRef.current = null;
    }
    segIndexRef.current = 0;
  }, []);

  const playSegment = useCallback((index: number, total: number, theme: string) => {
    if (index >= total) return;
    const audio = new Audio(`/audio/${theme}/seg_${index + 1}.wav`);
    commentaryRef.current = audio;
    audio.onended = () => playSegment(index + 1, total, theme);
    audio.play().catch(() => {});
  }, []);

  useEffect(() => {
    if (!isGameActive) {
      stopAll();
      return;
    }
    stopAll();

    if (segments > 0) {
      playSegment(0, segments, themeId);
    } else {
      const audio = new Audio(`/audio/${themeId}/commentary.mp3`);
      commentaryRef.current = audio;
      audio.play().catch(() => {});
    }

    const bg = new Audio(`/audio/${themeId}/background.mp3`);
    bg.loop = true;
    bg.volume = 0.18;
    bgRef.current = bg;
    bg.play().catch(() => {});

    return stopAll;
  }, [isGameActive, themeId, segments, stopAll, playSegment]);

  useEffect(() => stopAll, [stopAll]);
}
