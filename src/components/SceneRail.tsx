import { useCallback, useEffect, useRef, useState } from 'react';
import { THEMES } from '../shared/themes';
import { cn } from '../lib/utils';

/**
 * Looping, position-revealing scene selector.
 *
 * A single set of scene chips (one DOM node each — never duplicated) is laid out
 * in a row and positioned with a CSS transform. As it scrolls, chips that leave
 * one edge are recycled to the other edge, giving an endless loop with no
 * simultaneous duplicates. Only the chips currently in the left focus zone (the
 * first `focusN`) expand to reveal their name; the selected scene is shown by its
 * highlight box, not by a label.
 *
 * When all chips fit (e.g. desktop), looping/drag are disabled and the rail is
 * a static row. Position + focus are written straight to the DOM inside the
 * drag/inertia loop — no per-frame React state (project convention).
 */
interface SceneRailProps {
  themeIdx: number;
  onThemeChange: (idx: number) => void;
}

export function SceneRail({ themeIdx, onThemeChange }: SceneRailProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const posRef = useRef(0);          // track translateX, in px (any value; kept bounded by recycling)
  const gapRef = useRef(0);          // flex column-gap, px
  const focusNRef = useRef(3);
  const loopRef = useRef(false);     // content overflows → looping/drag enabled

  const drag = useRef({ active: false, startX: 0, startPos: 0, moved: false, lastX: 0, lastT: 0, v: 0 });
  const inertiaRef = useRef(0);

  const [looping, setLooping] = useState(false); // drives fade/cursor (re-renders only on resize)

  // Recycle chips that have fully left one edge to the opposite edge.
  // `allowRightWrap=false` keeps the right→front wrap from "yanking" a chip we
  // are deliberately scrolling toward the front (used during promote).
  const recycle = useCallback((allowRightWrap = true) => {
    const vp = viewportRef.current;
    const track = trackRef.current;
    if (!vp || !track || !loopRef.current) return;
    const vw = vp.clientWidth;
    const gap = gapRef.current;
    let guard = THEMES.length * 2;
    while (guard-- > 0) {
      const first = track.firstElementChild as HTMLElement | null;
      if (!first || first.offsetLeft + first.offsetWidth + posRef.current >= 0) break;
      const w = first.offsetWidth + gap;
      track.appendChild(first);
      posRef.current += w;
    }
    if (!allowRightWrap) return;
    guard = THEMES.length * 2;
    while (guard-- > 0) {
      const last = track.lastElementChild as HTMLElement | null;
      if (!last || last.offsetLeft + posRef.current <= vw) break;
      const w = last.offsetWidth + gap;
      track.insertBefore(last, track.firstElementChild);
      posRef.current -= w;
    }
  }, []);

  const updateLabels = useCallback(() => {
    const vp = viewportRef.current;
    const track = trackRef.current;
    if (!vp || !track) return;
    const vw = vp.clientWidth;
    const items = Array.from(track.children) as HTMLElement[];
    const visible = items
      .map((el) => ({ el, left: el.offsetLeft + posRef.current }))
      .filter((m) => m.left + m.el.offsetWidth > 0 && m.left < vw)
      .sort((a, b) => a.left - b.left);
    // The front `focusN` positions reveal their label (purely positional —
    // selection is shown by the chip's highlight box, not by a label).
    const focused = new Set(visible.slice(0, focusNRef.current).map((m) => m.el));
    items.forEach((el) => {
      const next = focused.has(el) ? 'on' : 'off';
      if (el.dataset.focused !== next) el.dataset.focused = next;
    });
  }, []);

  const render = useCallback((allowRightWrap = true) => {
    const track = trackRef.current;
    if (!track) return;
    recycle(allowRightWrap);
    track.style.transform = `translateX(${posRef.current}px)`;
    updateLabels();
  }, [recycle, updateLabels]);

  // Detect overflow → loop on/off; reset position when it fits.
  const measure = useCallback(() => {
    const vp = viewportRef.current;
    const track = trackRef.current;
    if (!vp || !track) return;
    gapRef.current = parseFloat(getComputedStyle(track).columnGap) || 0;
    const overflow = track.offsetWidth > vp.clientWidth + 1;
    loopRef.current = overflow;
    setLooping(overflow);
    if (!overflow) posRef.current = 0;
    render();
  }, [render]);

  // Responsive focus count + initial/overflow measurement.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const onChange = () => { focusNRef.current = mq.matches ? 3 : 2; measure(); };
    onChange();
    const onResize = () => measure();
    mq.addEventListener('change', onChange);
    window.addEventListener('resize', onResize);
    // Re-measure once layout/fonts settle.
    const id = requestAnimationFrame(measure);
    return () => {
      mq.removeEventListener('change', onChange);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(id);
      cancelAnimationFrame(inertiaRef.current);
    };
  }, [measure]);

  // Wheel scrolling (needs non-passive listener to preventDefault).
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const onWheel = (e: WheelEvent) => {
      if (!loopRef.current) return;
      e.preventDefault();
      cancelAnimationFrame(inertiaRef.current);
      posRef.current -= Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      render();
    };
    vp.addEventListener('wheel', onWheel, { passive: false });
    return () => vp.removeEventListener('wheel', onWheel);
  }, [render]);

  // Drag via window listeners (no pointer capture, so chip clicks still fire).
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d.active) return;
      const dx = e.clientX - d.startX;
      if (Math.abs(dx) > 4) d.moved = true;
      posRef.current = d.startPos + dx;
      const now = performance.now();
      const dt = now - d.lastT;
      if (dt > 0) d.v = (e.clientX - d.lastX) / dt; // px/ms
      d.lastX = e.clientX; d.lastT = now;
      render();
    };
    const onUp = () => {
      const d = drag.current;
      if (!d.active) return;
      d.active = false;
      let v = d.v * 16; // px/frame
      const step = () => {
        if (Math.abs(v) < 0.3) return;
        posRef.current += v;
        v *= 0.92;
        render();
        inertiaRef.current = requestAnimationFrame(step);
      };
      if (Math.abs(v) >= 0.3) inertiaRef.current = requestAnimationFrame(step);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [render]);

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current.moved = false; // reset every press so a plain tap always clicks
    if (!loopRef.current) return;
    cancelAnimationFrame(inertiaRef.current);
    const d = drag.current;
    d.active = true;
    d.startX = e.clientX; d.startPos = posRef.current;
    d.lastX = e.clientX; d.lastT = performance.now(); d.v = 0;
  };

  // Smoothly scroll a chip to the front (left edge). Recycling keeps the ring
  // filled from the right as it moves, so the front three become
  // [clicked, next, next].
  const promoteToFront = useCallback((el: HTMLElement) => {
    if (!loopRef.current) return;
    cancelAnimationFrame(inertiaRef.current);
    const step = () => {
      const left = el.offsetLeft + posRef.current;
      if (left <= 1) { posRef.current -= left; render(false); return; }
      posRef.current -= Math.max(3, left * 0.25);
      render(false); // left-only recycle so the target isn't yanked back
      inertiaRef.current = requestAnimationFrame(step);
    };
    inertiaRef.current = requestAnimationFrame(step);
  }, [render]);

  const onChipClick = (i: number, el: HTMLElement) => {
    if (drag.current.moved) return; // ignore the click that ends a drag
    onThemeChange(i);
    promoteToFront(el);
  };

  return (
    <div className="min-w-0 flex-1 max-w-65 sm:ml-4 sm:pl-4 sm:border-l sm:border-white/10">
      <div
        ref={viewportRef}
        onPointerDown={onPointerDown}
        className={cn('relative overflow-hidden select-none', looping && 'scene-rail-fade cursor-grab active:cursor-grabbing')}
        style={{ touchAction: 'pan-y' }}
      >
        <div ref={trackRef} className="flex w-max items-center gap-1 sm:gap-1.5 will-change-transform">
          {THEMES.map((t, i) => (
            <button
              key={t.id}
              data-idx={i}
              data-focused="off"
              onClick={(e) => onChipClick(i, e.currentTarget)}
              title={t.nameCN}
              className={cn(
                'group flex h-7 sm:h-8 shrink-0 items-center rounded-md border px-1.5 sm:px-2 text-xs transition-[background,border,color] duration-300',
                i === themeIdx
                  ? 'border-white/15 bg-white/10 text-white'
                  : 'border-transparent bg-transparent text-white/45 hover:bg-white/5 hover:text-white/80',
              )}
            >
              <span
                className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full shadow-[0_0_12px_currentColor] shrink-0"
                style={{ backgroundColor: t.dot, color: t.dot }}
              />
              <span className="inline-block max-w-0 overflow-hidden truncate whitespace-nowrap opacity-0 transition-all duration-300 group-data-[focused=on]:ml-1.5 group-data-[focused=on]:max-w-24 group-data-[focused=on]:opacity-100">
                {t.nameEN}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
