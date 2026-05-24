import { useState, useEffect, useRef } from 'react';
import type { SceneMeta } from '../types/SceneMeta';
import { SandParticleCanvas } from './SandParticleCanvas';

interface Props {
  meta: SceneMeta;
  onFinish: () => void;
}

export function IntroOverlay({ meta, onFinish }: Props) {
  const [pageIndex, setPageIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'done' | 'dissolving' | 'exiting'>('typing');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [sandRects, setSandRects] = useState<{ header: DOMRect | null; body: DOMRect | null } | null>(null);

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
    }, 1000);
    return () => clearTimeout(id);
  }, [phase, isLastPage]);

  useEffect(() => {
    if (phase !== 'exiting') return;
    setSandRects({
      header: headerRef.current?.getBoundingClientRect() ?? null,
      body: bodyRef.current?.getBoundingClientRect() ?? null,
    });
  }, [phase]);

  const skipAll = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase('exiting');
  };

  return (
    <>
      <div
        className={`intro-overlay${phase === 'exiting' ? ' exiting' : ''}`}
        onClick={skipAll}
      >
        <div className="intro-header" ref={headerRef}>
          <div className="intro-title">{meta.title}</div>
          {meta.subtitle && <div className="intro-subtitle">{meta.subtitle}</div>}
        </div>

        <div
          ref={bodyRef}
          key={pageIndex}
          className={`intro-body${(phase === 'dissolving' || phase === 'exiting') ? ' dissolving' : ''}`}
        >
          {currentText.slice(0, charIndex)}
          {phase === 'typing' && <span className="intro-cursor">▌</span>}
        </div>
      </div>

      {sandRects && (
        <SandParticleCanvas
          headerRect={sandRects.header}
          bodyRect={sandRects.body}
          onComplete={onFinish}
        />
      )}
    </>
  );
}
