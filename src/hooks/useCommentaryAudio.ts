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
  // Theme that was active when preWarmAudio() was last called — guards
  // against reusing a pre-warm element for the wrong theme after a theme switch.
  const preWarmThemeRef  = useRef<string | null>(null);

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

  // Tracks whether all commentary segments have finished — read by the interval
  const isCommentaryEndedRef = useRef(false);

  // True only while audio is literally playing — used for BGM ducking so the
  // BGM restores to full volume the moment commentary ends (not at phase end).
  const [commentaryIsPlaying, setCommentaryIsPlaying] = useState(false);

  // Guards against restarting commentary when themeId changes while already
  // active (the "one-render-gap" race during theme switch).
  const wasCommentaryActiveRef = useRef(false);

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
  // identity never changes. setCommentaryIsPlaying is a stable useState setter.
  const playSegment = useCallback((index: number, total: number, theme: string) => {
    if (index >= total) {
      isCommentaryEndedRef.current = true;
      setCommentaryIsPlaying(false); // un-duck BGM now that commentary is done
      onCommentaryEndRef.current?.();
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

    // 2. Unlock commentary audio (played silently then paused)
    const segFile =
      segments > 0
        ? `/audio/${themeId}/seg_1.wav`
        : `/audio/${themeId}/commentary.mp3`;
    const com = new Audio(segFile);
    com.volume = 0;
    preWarmComRef.current = com;

    // 3. Start background music at volume 0, wire GainNode after com settles.
    const bg = new Audio(`/audio/${themeId}/background.mp3`);
    bg.loop = true;
    try { bg.volume = 0; } catch { /* read-only on iOS — GainNode will control it */ }
    bg.play().catch(() => {});
    preWarmBgRef.current = bg;

    Promise.resolve(com.play().catch(() => {})).then(() => {
      if (preWarmComRef.current === com) { com.pause(); com.currentTime = 0; }
      const gainCtx = getAudioCtx();
      if (gainCtx && preWarmBgRef.current === bg) {
        try {
          let gainNode = gainNodeMap.get(bg);
          if (!gainNode) {
            gainNode = gainCtx.createGain();
            const src = gainCtx.createMediaElementSource(bg);
            src.connect(gainNode);
            gainNode.connect(gainCtx.destination);
            gainNodeMap.set(bg, gainNode);
          }
          gainNode.gain.setValueAtTime(0, gainCtx.currentTime);
          gainNode.gain.linearRampToValueAtTime(bgVolRef.current, gainCtx.currentTime + 0.08);
        } catch (e) {
          console.warn('BGM GainNode setup failed:', e);
        }
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

    if (!isCommentaryActive) {
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
        setCommentaryIsPlaying(false);
        onCommentaryEndRef.current?.();
      };
      if (!isPausedRef.current) {
        audio.play().catch(() => {});
      }
    }

    return () => {
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
      const effective = bgVol * (isCommentaryActiveRef.current ? COMMENTARY_DUCK : 1);
      setAudioVolume(bgRef.current, effective);
    }
  }, [bgVol]);

  // ── BGM ducking — lower while commentary is literally playing, restore after ──
  // Keyed on commentaryIsPlaying (content-based) rather than isCommentaryActive
  // (phase-based) so the BGM un-ducks the moment the last segment ends instead
  // of waiting for the phase to return to idle.
  useEffect(() => {
    if (!bgRef.current) return;
    const target = bgVolRef.current * (commentaryIsPlaying ? COMMENTARY_DUCK : 1);
    setAudioVolume(bgRef.current, target, 600);
  }, [commentaryIsPlaying]);

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
      setAudioVolume(audio, bgVolRef.current * (1 - t));
      if (t < 1) requestAnimationFrame(tick);
      else { audio.pause(); bgRef.current = null; }
    };
    requestAnimationFrame(tick);
  }, []);

  return { fadeBgOut, isCommentaryEndedRef, preWarmAudio };
}
