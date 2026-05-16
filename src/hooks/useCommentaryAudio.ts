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
  const segIndexRef = useRef(0);
  // Refs so playSegment always reads the latest volume without re-creating the callback
  const commentaryVolRef = useRef(commentaryVol);
  const bgVolRef = useRef(bgVol);
  const onCommentaryEndRef = useRef(onCommentaryEnd);
  commentaryVolRef.current = commentaryVol;
  bgVolRef.current = bgVol;
  onCommentaryEndRef.current = onCommentaryEnd;

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
    if (index >= total) {
      onCommentaryEndRef.current?.();
      return;
    }
    const audio = new Audio(`/audio/${theme}/seg_${index + 1}.wav`);
    audio.volume = commentaryVolRef.current;
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
      audio.volume = commentaryVolRef.current;
      commentaryRef.current = audio;
      audio.onended = () => onCommentaryEndRef.current?.();
      audio.play().catch(() => {});
    }

    const bg = new Audio(`/audio/${themeId}/background.mp3`);
    bg.loop = true;
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
}
