import { useEffect, useRef } from 'react';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  color: string;
  opacity: number;
  decay: number;
}

const SAND_COLORS = [
  '#e8c87a', '#d4b070', '#c8a060', '#dcc080',
  '#b89058', '#e0c068', '#d4a850', '#c89048',
];

interface Props {
  headerRect: DOMRect | null;
  bodyRect: DOMRect | null;
  onComplete: () => void;
}

export function SandParticleCanvas({ headerRect, bodyRect, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) { onCompleteRef.current(); return; }
    const ctx = canvas.getContext('2d');
    if (!ctx) { onCompleteRef.current(); return; }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const rects = [headerRect, bodyRect].filter(Boolean) as DOMRect[];
    if (rects.length === 0) { onCompleteRef.current(); return; }

    const totalArea = rects.reduce((s, r) => s + r.width * r.height, 0);
    const TOTAL = 800;
    const particles: Particle[] = [];

    for (const rect of rects) {
      const count = Math.round(TOTAL * (rect.width * rect.height) / Math.max(totalArea, 1));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: rect.left + Math.random() * rect.width,
          y: rect.top + Math.random() * rect.height,
          vx: Math.random() * 1.6 + 0.3,
          vy: -(Math.random() * 0.9 + 0.05),
          size: Math.random() * 2.0 + 0.4,
          color: SAND_COLORS[Math.floor(Math.random() * SAND_COLORS.length)],
          opacity: Math.random() * 0.5 + 0.5,
          decay: Math.random() * 0.006 + 0.003,
        });
      }
    }

    const startTime = performance.now();
    let frameId: number;
    let completed = false;

    const tick = () => {
      const elapsed = performance.now() - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = 0;
      for (const p of particles) {
        if (p.opacity <= 0) continue;
        alive++;
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // wind turbulence varies per particle position
        const turbulence = Math.sin(elapsed * 0.004 + p.x * 0.014) * 0.14;
        p.x += p.vx + turbulence;
        p.y += p.vy + (elapsed / 1800) * 0.018; // subtle gravity over time
        p.opacity -= p.decay;
      }

      if (!completed && (alive === 0 || elapsed > 2500)) {
        completed = true;
        onCompleteRef.current();
        return;
      }
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [headerRect, bodyRect]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 110, pointerEvents: 'none' }}
    />
  );
}
