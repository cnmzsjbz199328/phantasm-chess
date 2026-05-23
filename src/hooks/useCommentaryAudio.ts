import { useEffect, useRef, useCallback } from 'react';

export function useCommentaryAudio(
  themeId: string,
  isGameActive: boolean,
  isPaused: boolean,
  segments = 0,
  commentaryVol = 1.0,
  bgVol = 0.18,
  onCommentaryEnd?: () => void,
) {
  const commentaryRef = useRef<HTMLAudioElement | null>(null);
  const bgRef = useRef<HTMLAudioElement | null>(null);
  // Pre-warmed elements created during user gesture to bypass autoplay policy
  const preWarmComRef = useRef<HTMLAudioElement | null>(null);
  const preWarmBgRef = useRef<HTMLAudioElement | null>(null);
  // Refs so playSegment always reads the latest volume without re-creating the callback
  const commentaryVolRef = useRef(commentaryVol);
  const bgVolRef = useRef(bgVol);
  const onCommentaryEndRef = useRef(onCommentaryEnd);
  commentaryVolRef.current = commentaryVol;
  bgVolRef.current = bgVol;
  onCommentaryEndRef.current = onCommentaryEnd;

  // Tracks whether all commentary segments have finished — read by App.tsx interval
  const isCommentaryEndedRef = useRef(false);

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

  const segIndexRef = useRef(0);

  const playSegment = useCallback((index: number, total: number, theme: string) => {
    if (index >= total) {
      isCommentaryEndedRef.current = true;
      onCommentaryEndRef.current?.();
      return;
    }
    // Reuse pre-warmed element for the first segment to avoid autoplay block
    const audio = index === 0 && preWarmComRef.current
      ? preWarmComRef.current
      : new Audio(`/audio/${theme}/seg_${index + 1}.wav`);
    if (index === 0) preWarmComRef.current = null;
    audio.currentTime = 0;
    audio.volume = commentaryVolRef.current;
    commentaryRef.current = audio;
    audio.onended = () => playSegment(index + 1, total, theme);
    audio.play().catch(() => {});
  }, []);

  // Call this directly from a user-gesture handler (e.g. Play button click) before
  // the intro starts. It pre-creates and briefly plays the audio elements so that
  // the browser considers them "unlocked" for future play() calls on the same objects.
  const preWarmAudio = useCallback(() => {
    const segFile = segments > 0
      ? `/audio/${themeId}/seg_1.wav`
      : `/audio/${themeId}/commentary.mp3`;
    const com = new Audio(segFile);
    com.volume = 0;
    com.play()
      .then(() => { if (preWarmComRef.current === com) { com.pause(); com.currentTime = 0; } })
      .catch(() => {});
    preWarmComRef.current = com;

    const bg = new Audio(`/audio/${themeId}/background.mp3`);
    bg.loop = true;
    bg.volume = 0;
    bg.play()
      .then(() => { if (preWarmBgRef.current === bg) { bg.pause(); bg.currentTime = 0; } })
      .catch(() => {});
    preWarmBgRef.current = bg;
  }, [themeId, segments]);

  useEffect(() => {
    isCommentaryEndedRef.current = false;
    if (!isGameActive) {
      stopAll();
      return;
    }
    stopAll();

    if (segments > 0) {
      playSegment(0, segments, themeId);
    } else {
      // Reuse pre-warmed element if available
      const audio = preWarmComRef.current ?? new Audio(`/audio/${themeId}/commentary.mp3`);
      preWarmComRef.current = null;
      audio.currentTime = 0;
      audio.volume = commentaryVolRef.current;
      commentaryRef.current = audio;
      audio.onended = () => {
        isCommentaryEndedRef.current = true;
        onCommentaryEndRef.current?.();
      };
      audio.play().catch(() => {});
    }

    // Reuse pre-warmed bg element if available
    const bg = preWarmBgRef.current ?? new Audio(`/audio/${themeId}/background.mp3`);
    preWarmBgRef.current = null;
    bg.loop = true;
    bg.currentTime = 0;
    bg.volume = bgVolRef.current;
    bgRef.current = bg;
    bg.play().catch(() => {});

    return stopAll;
  }, [isGameActive, themeId, segments, stopAll, playSegment]);

  // Pause / resume without resetting playback position
  useEffect(() => {
    if (!isGameActive) return;
    if (isPaused) {
      commentaryRef.current?.pause();
      bgRef.current?.pause();
    } else {
      commentaryRef.current?.play().catch(() => {});
      bgRef.current?.play().catch(() => {});
    }
  }, [isPaused, isGameActive]);

  // Live volume updates — no audio restart needed
  useEffect(() => {
    if (commentaryRef.current) commentaryRef.current.volume = commentaryVol;
  }, [commentaryVol]);

  useEffect(() => {
    if (bgRef.current) bgRef.current.volume = bgVol;
  }, [bgVol]);

  useEffect(() => stopAll, [stopAll]);

  const fadeBgOut = useCallback((durationMs: number) => {
    const audio = bgRef.current;
    if (!audio) return;
    const startTime = performance.now();
    const tick = () => {
      if (bgRef.current !== audio) return;
      const t = Math.min((performance.now() - startTime) / durationMs, 1);
      // Use the live user volume so volume controls remain effective during fade
      audio.volume = bgVolRef.current * (1 - t);
      if (t < 1) requestAnimationFrame(tick);
      else { audio.pause(); bgRef.current = null; }
    };
    requestAnimationFrame(tick);
  }, []);

  return { fadeBgOut, isCommentaryEndedRef, preWarmAudio };
}
