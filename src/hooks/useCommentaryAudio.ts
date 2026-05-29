import { useState, useEffect, useRef, useCallback } from 'react';

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
const COMMENTARY_DUCK = 0.3;

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
    const now = ctx.currentTime;
    // Cancel any in-flight ramp then anchor current value before scheduling new one.
    // Without this, a new ramp would be queued *after* an ongoing one and cause a jump.
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    if (rampMs > 0) {
      gainNode.gain.linearRampToValueAtTime(volume, now + rampMs / 1000);
    } else {
      gainNode.gain.setValueAtTime(volume, now);
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
) {
  const commentaryRef    = useRef<HTMLAudioElement | null>(null);
  const bgRef            = useRef<HTMLAudioElement | null>(null);
  // Pre-warmed elements created during a user gesture to bypass autoplay policy
  const preWarmComRef    = useRef<HTMLAudioElement | null>(null);
  const preWarmBgRef     = useRef<HTMLAudioElement | null>(null);
  // Theme that was active when preWarmAudio() was last called — guards
  // against reusing a pre-warm element for the wrong theme after a theme switch.
  const preWarmThemeRef  = useRef<string | null>(null);

  // Refs so callbacks always read the *latest* value without being re-created
  const commentaryVolRef      = useRef(commentaryVol);
  const bgVolRef              = useRef(bgVol);
  const isPausedRef           = useRef(isPaused);
  const isCommentaryActiveRef = useRef(isCommentaryActive);

  commentaryVolRef.current      = commentaryVol;
  bgVolRef.current              = bgVol;
  isPausedRef.current           = isPaused;
  isCommentaryActiveRef.current = isCommentaryActive;

  // Tracks whether all commentary segments have finished.
  // Exposed as React state (commentaryEnded) so useGameOrchestrator can
  // coordinate the waitingForAudio→finishing transition via useEffect without
  // relying on appPhaseRef, eliminating the React 18 concurrent-mode race.
  const isCommentaryEndedRef = useRef(false);
  const [commentaryEnded, setCommentaryEnded] = useState(false);

  // True only while audio is literally playing — used for BGM ducking so the
  // BGM restores to full volume the moment commentary ends (not at phase end).
  const [commentaryIsPlaying, setCommentaryIsPlaying] = useState(false);
  // Ref mirror of commentaryIsPlaying so non-reactive effects (bgVol slider)
  // can read the content-based state without causing stale-closure re-ducks.
  const commentaryIsPlayingRef = useRef(false);

  // Guards against restarting commentary when themeId changes while already
  // active (the "one-render-gap" race during theme switch).
  const wasCommentaryActiveRef = useRef(false);

  // Pending duck / unduck setTimeout handles — cancelled on direction reversal.
  const duckTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unduckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // True once a duck has actually been initiated — prevents a spurious unduck on mount.
  const wasDuckedRef   = useRef(false);

  const segIndexRef = useRef(0);

  const stopAll = useCallback(() => {
    if (duckTimerRef.current)   { clearTimeout(duckTimerRef.current);   duckTimerRef.current   = null; }
    if (unduckTimerRef.current) { clearTimeout(unduckTimerRef.current); unduckTimerRef.current = null; }
    wasDuckedRef.current = false;
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
  // identity never changes. setCommentaryIsPlaying is a stable useState setter.
  const playSegment = useCallback((index: number, total: number, theme: string) => {
    if (index >= total) {
      isCommentaryEndedRef.current = true;
      setCommentaryEnded(true); // React state — lets useGameOrchestrator react via useEffect
      commentaryIsPlayingRef.current = false;
      setCommentaryIsPlaying(false); // un-duck BGM now that commentary is done
      return;
    }
    // Reuse the pre-warmed element for segment 0 to avoid autoplay blocks
    const audio =
      index === 0 && preWarmComRef.current && preWarmThemeRef.current === theme
        ? preWarmComRef.current
        : new Audio(`/audio/${theme}/seg_${index + 1}.wav`);
    if (index === 0) preWarmComRef.current = null;

    audio.currentTime = 0;
    setAudioVolume(audio, commentaryVolRef.current);
    commentaryRef.current = audio;
    audio.onended = () => playSegment(index + 1, total, theme);
    if (!isPausedRef.current) {
      audio.play().catch(() => {});
    }
  }, []);

  // ── Pre-warm audio elements inside a user-gesture handler ────────────────
  const preWarmAudio = useCallback(() => {
    // Discard any previous pre-warm elements
    if (preWarmBgRef.current) { preWarmBgRef.current.pause(); preWarmBgRef.current = null; }
    if (preWarmComRef.current) { preWarmComRef.current.pause(); preWarmComRef.current = null; }

    preWarmThemeRef.current = themeId;

    // 1. Initialize / resume AudioContext synchronously within the gesture
    const ctx = getAudioCtx();
    if (ctx?.state === 'suspended') ctx.resume().catch(() => {});

    // 2. Unlock commentary audio (played silently then paused).
    //    setAudioVolume (GainNode-based) must be called before play() — iOS ignores .volume writes.
    const segFile =
      segments > 0
        ? `/audio/${themeId}/seg_1.wav`
        : `/audio/${themeId}/commentary.mp3`;
    const com = new Audio(segFile);
    preWarmComRef.current = com;
    setAudioVolume(com, 0); // wires GainNode at gain=0 synchronously before play

    // 3. Start background music at volume 0 via GainNode before play(), then ramp after unlock.
    const bg = new Audio(`/audio/${themeId}/background.mp3`);
    bg.loop = true;
    preWarmBgRef.current = bg;
    setAudioVolume(bg, 0); // wires GainNode at gain=0 synchronously before play
    bg.play().catch(() => {});

    Promise.resolve(com.play().catch(() => {})).then(() => {
      if (preWarmComRef.current === com) { com.pause(); com.currentTime = 0; }
      // GainNode already wired by setAudioVolume above — just ramp BGM to target level.
      const gainCtx = getAudioCtx();
      const gainNode = gainCtx ? gainNodeMap.get(bg) : undefined;
      if (gainNode && preWarmBgRef.current === bg) {
        gainNode.gain.cancelScheduledValues(gainCtx!.currentTime);
        gainNode.gain.setValueAtTime(0, gainCtx!.currentTime);
        gainNode.gain.linearRampToValueAtTime(bgVolRef.current, gainCtx!.currentTime + 0.08);
      }
    }).catch(() => {});
  }, [themeId, segments]);

  // ── Background music management ───────────────────────────────────────────
  useEffect(() => {
    if (!isAudioActive) {
      if (bgRef.current) {
        bgRef.current.pause();
        bgRef.current = null;
      }
      return;
    }

    // Theme changed while audio was active — stop old BGM and return without
    // starting the new theme's BGM.  The idle→active cycle for the new theme
    // (triggered when the user explicitly plays) will set it up correctly.
    if (
      bgRef.current &&
      bgRef.current.src &&
      !bgRef.current.src.includes(`/audio/${themeId}/`)
    ) {
      bgRef.current.pause();
      bgRef.current = null;
      return;
    }

    if (!bgRef.current) {
      // Only reuse the pre-warm element if it belongs to the current theme
      const preWarm = preWarmBgRef.current;
      const bg =
        preWarm && preWarmThemeRef.current === themeId
          ? preWarm
          : new Audio(`/audio/${themeId}/background.mp3`);
      preWarmBgRef.current = null;
      bg.loop = true;
      setAudioVolume(bg, bgVolRef.current);
      bgRef.current = bg;
      if (!isPausedRef.current) {
        bg.play().catch(() => {});
      }
    }
  }, [isAudioActive, themeId]); // isPaused deliberately omitted — use isPausedRef

  // ── Commentary playback management ────────────────────────────────────────
  useEffect(() => {
    // Track whether commentary was active at the START of this effect run.
    // Used to distinguish "fresh activation" from "themeId changed mid-active".
    const wasActive = wasCommentaryActiveRef.current;
    wasCommentaryActiveRef.current = isCommentaryActive;

    isCommentaryEndedRef.current = false;
    setCommentaryEnded(false);

    if (!isCommentaryActive) {
      commentaryIsPlayingRef.current = false;
      setCommentaryIsPlaying(false);
      return; // cleanup return below handles stopping
    }

    if (wasActive) {
      // themeId (or segments) changed while commentary was already running.
      // The cleanup from the previous effect run already stopped the old audio.
      // Do NOT restart here — wait for the state machine to cycle through idle
      // so the next activation is genuinely fresh.
      return;
    }

    // Fresh activation: start commentary for this theme.
    commentaryIsPlayingRef.current = true;
    setCommentaryIsPlaying(true);

    if (segments > 0) {
      playSegment(0, segments, themeId);
    } else {
      const audio =
        preWarmComRef.current && preWarmThemeRef.current === themeId
          ? preWarmComRef.current
          : new Audio(`/audio/${themeId}/commentary.mp3`);
      preWarmComRef.current = null;
      audio.currentTime = 0;
      setAudioVolume(audio, commentaryVolRef.current);
      commentaryRef.current = audio;
      audio.onended = () => {
        isCommentaryEndedRef.current = true;
        setCommentaryEnded(true);
        commentaryIsPlayingRef.current = false;
        setCommentaryIsPlaying(false);
      };
      if (!isPausedRef.current) {
        audio.play().catch(() => {});
      }
    }

    return () => {
      commentaryIsPlayingRef.current = false;
      setCommentaryIsPlaying(false);
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
      const effective = bgVol * (commentaryIsPlayingRef.current ? COMMENTARY_DUCK : 1);
      setAudioVolume(bgRef.current, effective);
    }
  }, [bgVol]);

  // ── BGM ducking — film-standard: pre-delay → slow fade → hold → post-delay → slow restore ──
  // Duck:   wait 3 s then ramp to 40 % over 5 s  (commentary is short — listener adjusts first)
  // Unduck: wait 3 s then ramp to 100 % over 3 s (slightly faster rise is less noticeable)
  // Keyed on commentaryIsPlaying (content-based) so the BGM restores the instant the last
  // segment ends rather than waiting for the phase machine to reach idle.
  useEffect(() => {
    const bg = bgRef.current;
    if (!bg) return;

    if (commentaryIsPlaying) {
      wasDuckedRef.current = true;
      if (unduckTimerRef.current) { clearTimeout(unduckTimerRef.current); unduckTimerRef.current = null; }
      duckTimerRef.current = setTimeout(() => {
        duckTimerRef.current = null;
        if (bgRef.current !== bg) return;
        setAudioVolume(bg, bgVolRef.current * COMMENTARY_DUCK, 5000);
      }, 3000);
    } else if (wasDuckedRef.current) {
      if (duckTimerRef.current) { clearTimeout(duckTimerRef.current); duckTimerRef.current = null; }
      unduckTimerRef.current = setTimeout(() => {
        unduckTimerRef.current = null;
        if (bgRef.current !== bg) return;
        setAudioVolume(bg, bgVolRef.current, 3000);
      }, 3000);
    }

    return () => {
      if (duckTimerRef.current)   { clearTimeout(duckTimerRef.current);   duckTimerRef.current   = null; }
      if (unduckTimerRef.current) { clearTimeout(unduckTimerRef.current); unduckTimerRef.current = null; }
    };
  }, [commentaryIsPlaying]);

  // Stop everything on unmount
  useEffect(() => stopAll, [stopAll]);

  // ── BGM fade-out (triggered at epilogue start) ────────────────────────────
  // Cancels any pending duck/unduck transition so they don't fight the fade.
  // Reads the *current* GainNode value as start point — correct whether BGM
  // is fully up, mid-duck ramp, or partially ducked.
  const fadeBgOut = useCallback((durationMs: number) => {
    if (duckTimerRef.current)   { clearTimeout(duckTimerRef.current);   duckTimerRef.current   = null; }
    if (unduckTimerRef.current) { clearTimeout(unduckTimerRef.current); unduckTimerRef.current = null; }

    const audio = bgRef.current;
    if (!audio) return;

    const ctx = getAudioCtx();
    const gainNode = gainNodeMap.get(audio);
    if (ctx && gainNode) {
      const now = ctx.currentTime;
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.linearRampToValueAtTime(0, now + durationMs / 1000);
      setTimeout(() => {
        if (bgRef.current === audio) { audio.pause(); bgRef.current = null; }
      }, durationMs);
    } else {
      // Fallback path (GainNode not yet wired — very early call)
      const startTime = performance.now();
      const startVol = bgVolRef.current;
      const tick = () => {
        if (bgRef.current !== audio) return;
        const t = Math.min((performance.now() - startTime) / durationMs, 1);
        setAudioVolume(audio, startVol * (1 - t));
        if (t < 1) requestAnimationFrame(tick);
        else { audio.pause(); bgRef.current = null; }
      };
      requestAnimationFrame(tick);
    }
  }, []);

  return { fadeBgOut, isCommentaryEndedRef, preWarmAudio, commentaryEnded };
}
