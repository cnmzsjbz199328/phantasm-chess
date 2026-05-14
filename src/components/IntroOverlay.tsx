import { useState, useEffect, useRef } from 'react';
import type { SceneMeta } from '../types/SceneMeta';

interface Props {
  meta: SceneMeta;
  onFinish: () => void;
}

export function IntroOverlay({ meta, onFinish }: Props) {
  const [pageIndex, setPageIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'done' | 'dissolving' | 'exiting'>('typing');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      <div className="intro-title">{meta.title}</div>
      {meta.subtitle && <div className="intro-subtitle">{meta.subtitle}</div>}

      <div
        key={pageIndex}
        className={`intro-body${(phase === 'dissolving' || phase === 'exiting') ? ' dissolving' : ''}`}
      >
        {currentText.slice(0, charIndex)}
        {phase === 'typing' && <span className="intro-cursor">▌</span>}
      </div>

      <div className="intro-skip">点击任意处跳过</div>
    </div>
  );
}
