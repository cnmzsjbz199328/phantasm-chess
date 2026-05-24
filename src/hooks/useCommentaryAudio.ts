import { useEffect, useRef, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Web Audio API helpers — iOS Safari doesn't honour HTMLAudioElement.volume,
// so we route every element through a GainNode instead.
// A single AudioContext is shared across all audio elements for efficiency.
// ---------------------------------------------------------------------------

let globalAudioCtx: AudioContext | null = null;
const gainNodeMap = new WeakMap<HTMLAudioElement, GainNode>();
// Prevent AudioContext leak across Vite HMR reloads (browsers cap instances ~6 per origin)
const _hmr = (import.meta as unknown as { hot?: { dispose: (fn: () => void) => void } }).hot;
if (_hmr) _hmr.dispose(() => { globalAudioCtx?.close(); globalAudioCtx = null; });

/** BGM volume multiplier applied while commentary is audible (0–1). */
const COMMENTARY_DUCK = 0.28;

/** Returns (creating if needed) the singleton AudioContext. */
function getAudioCtx(): AudioContext | null {
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!globalAudioCtx) globalAudioCtx = new Ctx();
  return globalAudioCtx;
}

// IMPORTANT: createMediaElementSource may only be called once per element — WeakMap enforces this.
// rampMs > 0 smoothly transitions the GainNode instead of snapping (duck/unduck).
function setAudioVolume(audio: HTMLAudioElement, volume: number, rampMs = 0) {
  try { audio.volume = volume; } catch { /* read-only on iOS */ }

  const ctx = getAudioCtx();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    let gainNode = gainNodeMap.get(audio);
    if (!gainNode) {
      gainNode = ctx.createGain();
      const source = ctx.createMediaElementSource(audio);
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      gainNodeMap.set(audio, gainNode);
    }
    if (rampMs > 0) {
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + rampMs / 1000);
    } else {
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    }
  } catch (e) {
    console.warn('Web Audio API volume control failed:', e);
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCommentaryAudio(
  themeId: string,
  /** BGM plays whenever this is true (all phases except 'idle'). */
  isAudioActive: boolean,
  /** Commentary plays only during gameplay / ending phases. */
  isCommentaryActive: boolean,
  /** True when the user manually pauses during the 'playing' phase. */
  isPaused: boolean,
  segments = 0,
  commentaryVol = 1.0,
  bgVol = 0.18,
  onCommentaryEnd?: () => void,
) {
  const commentaryRef    = useRef<HTMLAudioElement | null>(null);
  const bgRef            = useRef<HTMLAudioElement | null>(null);
  // Pre-warmed elements created during a user gesture to bypass autoplay policy
  const preWarmComRef    = useRef<HTMLAudioElement | null>(null);
  const preWarmBgRef     = useRef<HTMLAudioElement | null>(null);

  // Refs so callbacks always read the *latest* value without being re-created
  const commentaryVolRef      = useRef(commentaryVol);
  const bgVolRef              = useRef(bgVol);
  const onCommentaryEndRef    = useRef(onCommentaryEnd);
  const isPausedRef           = useRef(isPaused);
  const isCommentaryActiveRef = useRef(isCommentaryActive);

  commentaryVolRef.current      = commentaryVol;
  bgVolRef.current              = bgVol;
  onCommentaryEndRef.current    = onCommentaryEnd;
  isPausedRef.current           = isPaused;
  isCommentaryActiveRef.current = isCommentaryActive;

  // Tracks whether all commentary segments have finished — read by App.tsx interval
  const isCommentaryEndedRef = useRef(false);

  // Declared before stopAll so the reference is valid inside the callback
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

  // ── Commentary segment sequencer ─────────────────────────────────────────
  // Zero dependencies: reads all runtime state through refs so the callback
  // identity never changes. This prevents stale `onended` closures that would
  // ignore pause state or restart playback unexpectedly.
  const playSegment = useCallback((index: number, total: number, theme: string) => {
    if (index >= total) {
      isCommentaryEndedRef.current = true;
      onCommentaryEndRef.current?.();
      return;
    }
    // Reuse the pre-warmed element for segment 0 to avoid autoplay blocks
    const audio =
      index === 0 && preWarmComRef.current
        ? preWarmComRef.current
        : new Audio(`/audio/${theme}/seg_${index + 1}.wav`);
    if (index === 0) preWarmComRef.current = null;

    audio.currentTime = 0;
    setAudioVolume(audio, commentaryVolRef.current);
    commentaryRef.current = audio;
    // onended always calls the *current* playSegment via closure — safe because
    // playSegment has no deps and therefore never changes identity.
    audio.onended = () => playSegment(index + 1, total, theme);
    if (!isPausedRef.current) {
      audio.play().catch(() => {});
    }
  }, []);

  // ── Pre-warm audio elements inside a user-gesture handler ────────────────
  // Creates and briefly plays/pauses the audio elements so browsers consider
  // them "unlocked". The BGM element is stored for the BGM effect to reuse,
  // avoiding a second createMediaElementSource call on the same object.
  const preWarmAudio = useCallback(() => {
    // 1. Initialize / resume AudioContext synchronously within the gesture
    const ctx = getAudioCtx();
    if (ctx?.state === 'suspended') ctx.resume().catch(() => {});

    // 2. Unlock commentary audio (played silently then paused)
    const segFile =
      segments > 0
        ? `/audio/${themeId}/seg_1.wav`
        : `/audio/${themeId}/commentary.mp3`;
    const com = new Audio(segFile);
    com.volume = 0;
    com.play()
      .then(() => {
        if (preWarmComRef.current === com) { com.pause(); com.currentTime = 0; }
      })
      .catch(() => {});
    preWarmComRef.current = com;

    // 3. Start background music immediately at the correct volume.
    //    AudioContext was already created and resumed above (within the user
    //    gesture), so when the BGM effect calls setAudioVolume later the
    //    context will be in 'running' state and the GainNode will be audible.
    //    We do NOT call setAudioVolume here: calling createMediaElementSource
    //    on iOS while another unlocked element (com) is mid-play can cause
    //    that element to unexpectedly start outputting audio at full volume.
    //    We also intentionally do NOT pause after play() — the BGM should keep
    //    playing through the countdown and intro phases without interruption.
    const bg = new Audio(`/audio/${themeId}/background.mp3`);
    bg.loop = true;
    try { bg.volume = bgVolRef.current; } catch { /* read-only on iOS — GainNode will control it */ }
    bg.play().catch(() => {});
    preWarmBgRef.current = bg;
  }, [themeId, segments]);

  // ── Background music management ───────────────────────────────────────────
  // isPaused is intentionally excluded from deps — read via isPausedRef to
  // prevent the effect from re-running (and potentially re-creating BGM) on
  // every pause/resume toggle.
  useEffect(() => {
    if (!isAudioActive) {
      if (bgRef.current) {
        bgRef.current.pause();
        bgRef.current = null;
      }
      return;
    }

    // If the theme changed, replace the existing BGM
    if (
      bgRef.current &&
      bgRef.current.src &&
      !bgRef.current.src.includes(`/audio/${themeId}/`)
    ) {
      bgRef.current.pause();
      bgRef.current = null;
    }

    if (!bgRef.current) {
      // Reuse the pre-warmed element if available (same object, already unlocked)
      const bg = preWarmBgRef.current ?? new Audio(`/audio/${themeId}/background.mp3`);
      preWarmBgRef.current = null;
      bg.loop = true;
      // setAudioVolume connects the element to the Web Audio graph (once only)
      setAudioVolume(bg, bgVolRef.current);
      bgRef.current = bg;
      if (!isPausedRef.current) {
        bg.play().catch(() => {});
      }
    }
  }, [isAudioActive, themeId]); // isPaused deliberately omitted — use isPausedRef

  // ── Commentary playback management ────────────────────────────────────────
  // isPaused omitted via ref; cleanup return stops the onended chain on dep change,
  // preventing orphaned audio when the user switches to another match.
  useEffect(() => {
    isCommentaryEndedRef.current = false;

    if (!isCommentaryActive) {
      return; // cleanup return below handles stopping
    }

    if (segments > 0) {
      playSegment(0, segments, themeId);
    } else {
      const audio =
        preWarmComRef.current ?? new Audio(`/audio/${themeId}/commentary.mp3`);
      preWarmComRef.current = null;
      audio.currentTime = 0;
      setAudioVolume(audio, commentaryVolRef.current);
      commentaryRef.current = audio;
      audio.onended = () => {
        isCommentaryEndedRef.current = true;
        onCommentaryEndRef.current?.();
      };
      if (!isPausedRef.current) {
        audio.play().catch(() => {});
      }
    }

    return () => {
      if (commentaryRef.current) {
        commentaryRef.current.onended = null;
        commentaryRef.current.pause();
        commentaryRef.current = null;
      }
      segIndexRef.current = 0;
    };
  }, [isCommentaryActive, themeId, segments, playSegment]); // isPaused deliberately omitted

  // ── Pause / resume without resetting playback position ───────────────────
  useEffect(() => {
    if (isPaused) {
      commentaryRef.current?.pause();
      bgRef.current?.pause();
    } else {
      if (isCommentaryActive) {
        commentaryRef.current?.play().catch(() => {});
      }
      if (isAudioActive) {
        bgRef.current?.play().catch(() => {});
      }
    }
  }, [isPaused, isCommentaryActive, isAudioActive]);

  // ── Live volume updates — no audio restart needed ─────────────────────────
  useEffect(() => {
    if (commentaryRef.current) setAudioVolume(commentaryRef.current, commentaryVol);
  }, [commentaryVol]);

  useEffect(() => {
    if (bgRef.current) {
      // Respect the duck state when user adjusts the slider mid-playback.
      const effective = bgVol * (isCommentaryActiveRef.current ? COMMENTARY_DUCK : 1);
      setAudioVolume(bgRef.current, effective);
    }
  }, [bgVol]);

  // ── BGM ducking — lower under commentary, restore after ──────────────────
  // Uses a 600 ms ramp so the transition isn't jarring.
  useEffect(() => {
    if (!bgRef.current) return;
    const target = bgVolRef.current * (isCommentaryActive ? COMMENTARY_DUCK : 1);
    setAudioVolume(bgRef.current, target, 600);
  }, [isCommentaryActive]);

  // Stop everything on unmount
  useEffect(() => stopAll, [stopAll]);

  // ── BGM fade-out (used during epilogue) ───────────────────────────────────
  const fadeBgOut = useCallback((durationMs: number) => {
    const audio = bgRef.current;
    if (!audio) return;
    const startTime = performance.now();
    const tick = () => {
      if (bgRef.current !== audio) return;
      const t = Math.min((performance.now() - startTime) / durationMs, 1);
      // Read live user volume so the volume control stays effective during fade
      setAudioVolume(audio, bgVolRef.current * (1 - t));
      if (t < 1) requestAnimationFrame(tick);
      else { audio.pause(); bgRef.current = null; }
    };
    requestAnimationFrame(tick);
  }, []);

  return { fadeBgOut, isCommentaryEndedRef, preWarmAudio };
}
