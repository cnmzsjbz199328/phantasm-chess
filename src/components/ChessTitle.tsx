import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import type { AppPhase } from '../shared/AppPhase';

interface ChessTitleProps {
  appPhase: AppPhase;
  currentStep: number;
  totalSteps: number;
}

/**
 * Header title that flip-animates between "CHESS" and the current move counter
 * once a game is in progress.
 */
export function ChessTitle({ appPhase, currentStep, totalSteps }: ChessTitleProps) {
  const frontRef = useRef<HTMLSpanElement>(null);
  const backRef  = useRef<HTMLSpanElement>(null);
  const faceRef  = useRef<'chess' | 'counter'>('chess');

  useEffect(() => {
    gsap.set(backRef.current, {
      opacity: 0, rotateX: 90,
      transformPerspective: 250, transformOrigin: 'center top',
    });
  }, []);

  useEffect(() => {
    const wantCounter = appPhase !== 'idle' && appPhase !== 'countdown';
    if (wantCounter && faceRef.current === 'chess') {
      faceRef.current = 'counter';
      gsap.killTweensOf([frontRef.current, backRef.current]);
      gsap.to(frontRef.current, {
        opacity: 0, rotateX: -90,
        transformPerspective: 250, transformOrigin: 'center bottom',
        duration: 0.22, ease: 'power2.in',
        onComplete: () => gsap.to(backRef.current, {
          opacity: 1, rotateX: 0, duration: 0.22, ease: 'power2.out',
        }),
      });
    } else if (!wantCounter && faceRef.current === 'counter') {
      faceRef.current = 'chess';
      gsap.killTweensOf([frontRef.current, backRef.current]);
      gsap.to(backRef.current, {
        opacity: 0, rotateX: 90, duration: 0.22, ease: 'power2.in',
        onComplete: () => gsap.to(frontRef.current, {
          opacity: 1, rotateX: 0,
          transformPerspective: 250, transformOrigin: 'center bottom',
          duration: 0.22, ease: 'power2.out',
        }),
      });
    }
  }, [appPhase]);

  useEffect(() => {
    if (faceRef.current === 'counter' && backRef.current) {
      gsap.fromTo(backRef.current, { y: -4 }, { y: 0, duration: 0.18, ease: 'power2.out' });
    }
  }, [currentStep]);

  const stepStr = String(currentStep + 1).padStart(2, '0');

  return (
    <div className="relative">
      <span
        ref={frontRef}
        className="flex items-center text-lg font-bold tracking-[0.2em] uppercase text-phantasm-accent-light whitespace-nowrap"
      >
        CHESS
      </span>
      <span
        ref={backRef}
        className="absolute inset-0 flex items-center text-lg font-bold font-mono tabular-nums tracking-[0.15em] text-phantasm-accent-light whitespace-nowrap"
      >
        {stepStr}
        <span className="text-white/40 text-sm font-light tracking-normal"> /{totalSteps}</span>
      </span>
    </div>
  );
}
