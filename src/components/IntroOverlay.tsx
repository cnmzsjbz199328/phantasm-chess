import { useState, useEffect, useRef } from 'react';
import type { SceneMeta } from '../types/SceneMeta';

interface Props {
  meta: SceneMeta;
  onFinish: () => void;
}

const INTRO_MUSIC_VOL = 0.7;

export function IntroOverlay({ meta, onFinish }: Props) {
  const [pageIndex, setPageIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'done' | 'dissolving' | 'exiting'>('typing');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const introMusicRef = useRef<HTMLAudioElement | null>(null);
  const isFadingOutRef = useRef(false);

  // Intro music: fade in on mount, fade out when exiting
  useEffect(() => {
    const audio = new Audio('/audio/Intro.mp3');
    audio.loop = true;
    audio.volume = 0;
    audio.play().catch(() => {});
    introMusicRef.current = audio;
    isFadingOutRef.current = false;

    const fadeDuration = 1500;
    const startTime = performance.now();
    const fadeIn = () => {
      if (isFadingOutRef.current || introMusicRef.current !== audio) return;
      const t = Math.min((performance.now() - startTime) / fadeDuration, 1);
      audio.volume = INTRO_MUSIC_VOL * t;
      if (t < 1) requestAnimationFrame(fadeIn);
    };
    requestAnimationFrame(fadeIn);

    return () => { audio.pause(); introMusicRef.current = null; };
  }, []);

  useEffect(() => {
    if (phase !== 'exiting') return;
    const audio = introMusicRef.current;
    if (!audio) return;
    isFadingOutRef.current = true;
    const startVol = audio.volume;
    const fadeDuration = 1400;
    const startTime = performance.now();
    let frameId: number;
    const fadeOut = () => {
      const t = Math.min((performance.now() - startTime) / fadeDuration, 1);
      audio.volume = startVol * (1 - t);
      if (t < 1) frameId = requestAnimationFrame(fadeOut);
      else { audio.pause(); introMusicRef.current = null; }
    };
    frameId = requestAnimationFrame(fadeOut);
    return () => cancelAnimationFrame(frameId);
  }, [phase]);

  const pages = meta.description;
  const currentText = pages[pageIndex] ?? '';
  const isLastPage = pageIndex >= pages.length - 1;

  useEffect(() => {
    setCharIndex(0);
    setPhase('typing');
    intervalRef.current = setInterval(() => {
      setCharIndex(prev => {
        if (prev >= currentText.length) {
          clearInterval(intervalRef.current!);
          setPhase('done');
          return prev;
        }
        return prev + 1;
      });
    }, 40);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [pageIndex, currentText]);

  useEffect(() => {
    if (phase !== 'done') return;
    const id = setTimeout(() => setPhase('dissolving'), 1000);
    return () => clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'dissolving') return;
    const id = setTimeout(() => {
      if (isLastPage) setPhase('exiting');
      else setPageIndex(p => p + 1);
    }, 600);
    return () => clearTimeout(id);
  }, [phase, isLastPage]);

  useEffect(() => {
    if (phase !== 'exiting') return;
    const id = setTimeout(onFinish, 1500);
    return () => clearTimeout(id);
  }, [phase, onFinish]);

  const skipAll = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase('exiting');
  };

  return (
    <div
      className={`intro-overlay${phase === 'exiting' ? ' exiting' : ''}`}
      onClick={skipAll}
    >
      <div className="intro-header">
        <div className="intro-title">{meta.title}</div>
        {meta.subtitle && <div className="intro-subtitle">{meta.subtitle}</div>}
      </div>

      <div
        key={pageIndex}
        className={`intro-body${(phase === 'dissolving' || phase === 'exiting') ? ' dissolving' : ''}`}
      >
        {currentText.slice(0, charIndex)}
        {phase === 'typing' && <span className="intro-cursor">▌</span>}
      </div>

    </div>
  );
}
