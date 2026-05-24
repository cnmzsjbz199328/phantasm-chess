import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Animated 3-2-1 countdown shown immediately after the user hits Play,
 * giving time for a screen recording to start before the game begins.
 */
export function CountdownOverlay() {
  const [count, setCount] = useState(3);
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const timers = [
      setTimeout(() => setCount(2), 1000),
      setTimeout(() => setCount(1), 2000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (!spanRef.current) return;
    gsap.fromTo(
      spanRef.current,
      { scale: 1.5, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.4)' },
    );
  }, [count]);

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
      <span
        ref={spanRef}
        className="text-[20vmin] font-black tabular-nums select-none text-white"
        style={{ textShadow: '0 0 80px rgba(255,255,255,0.5), 0 0 160px rgba(255,255,255,0.2)' }}
      >
        {count}
      </span>
    </div>
  );
}
