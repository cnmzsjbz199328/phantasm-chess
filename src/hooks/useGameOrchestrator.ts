import { useState, useEffect, useRef, useCallback } from 'react';
import { useCommentaryAudio } from './useCommentaryAudio';
import type { AppPhase } from '../shared/AppPhase';
import type { useChessEngine } from './useChessEngine';
import type { SceneMeta } from '../shared/SceneMeta';

// ---------------------------------------------------------------------------
// iOS Audio Session unlock
// Keeps the AudioContext alive across the intro so iOS Safari doesn't revoke
// the audio session before HTMLAudioElement.play() is called from a setTimeout.
// ---------------------------------------------------------------------------
let _audioUnlockCtx: AudioContext | null = null;
function unlockAudioSession() {
  if (_audioUnlockCtx) return;
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    _audioUnlockCtx = new Ctx();
    const buf = _audioUnlockCtx.createBuffer(1, 1, 22050);
    const src = _audioUnlockCtx.createBufferSource();
    src.buffer = buf;
    src.connect(_audioUnlockCtx.destination);
    src.start(0);
    void _audioUnlockCtx.resume();
  } catch { /* best-effort */ }
}

export { COMMENTARY_LEVELS, BG_LEVELS } from '../shared/audioLevels';

type ChessEngine = ReturnType<typeof useChessEngine>;

interface OrchestratorParams {
  themeIdx: number;
  themeId: string;
  chess: ChessEngine;
  currentMeta: SceneMeta | null;
  commentaryVol: number;
  bgVol: number;
}

/**
 * Central game state-machine.
 *
 * Owns:
 *  - `appPhase` lifecycle (idle → countdown → intro → playing → … → outro)
 *  - `isPlaying` / `isAnimating` flags
 *  - Auto-play interval with `waitingForAudio` synchronisation gate
 *  - All phase-transition callbacks exposed to UI
 *  - Commentary audio lifecycle (delegates to `useCommentaryAudio`)
 */
export function useGameOrchestrator({
  themeIdx,
  themeId,
  chess,
  currentMeta,
  commentaryVol,
  bgVol,
}: OrchestratorParams) {
  const [appPhase, setAppPhase] = useState<AppPhase>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const outroTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable refs so fire-and-forget callbacks always read the latest values
  // without being recreated (avoids the stale-closure bug fixed previously).
  const chessRef = useRef(chess);
  chessRef.current = chess;
  const currentMetaRef = useRef(currentMeta);
  currentMetaRef.current = currentMeta;

  // Mirror appPhase in a ref so handleCommentaryEnd can read the live value
  // without capturing a stale closure AND without using a functional updater
  // (React requires updater fns to be pure — nextStep() is a side effect).
  const appPhaseRef = useRef<AppPhase>('idle');
  appPhaseRef.current = appPhase;

  // ── handleCommentaryEnd ──────────────────────────────────────────────────
  // Reads live phase through appPhaseRef (updated every render).
  // When commentary ends in 'waitingForAudio', we transition to 'finishing'
  // so the 20 s fallback useEffect runs its cleanup and cancels the timer —
  // preventing the double nextStep() that occurred when phase stayed unchanged.
  const handleCommentaryEnd = useCallback(() => {
    const phase = appPhaseRef.current;
    if (phase === 'waitingForAudio') {
      // Commentary outlasted the game — play the final move, then epilogue.
      chessRef.current.nextStep();
      setAppPhase('finishing'); // transition cancels the waitingForAudio 20 s fallback
      setTimeout(
        () => setAppPhase(currentMetaRef.current ? 'epilogue' : 'idle'),
        4500,
      );
    } else if (phase === 'finishing') {
      setAppPhase('epilogue');
    }
  }, []); // stable — all runtime state accessed through refs

  // ── Audio ────────────────────────────────────────────────────────────────
  const { fadeBgOut, isCommentaryEndedRef, preWarmAudio } = useCommentaryAudio(
    themeId,
    appPhase !== 'idle',
    appPhase === 'playing' ||
      appPhase === 'waitingForAudio' ||
      appPhase === 'finishing' ||
      appPhase === 'epilogue' ||
      appPhase === 'outro',
    // Pause audio only when user manually pauses during 'playing'; not during waitingForAudio
    !isPlaying && appPhase === 'playing',
    currentMeta?.commentarySegments ?? 0,
    commentaryVol,
    bgVol,
    handleCommentaryEnd,
  );

  // ── Fallback timeouts ────────────────────────────────────────────────────
  // Guard against onended never firing (network failure, browser quirk).
  //   finishing      → epilogue after 15 s (commentary shorter than game)
  //   waitingForAudio → play final move + epilogue after 20 s (commentary longer)
  useEffect(() => {
    if (appPhase === 'finishing') {
      const timer = setTimeout(() => setAppPhase('epilogue'), 15_000);
      return () => clearTimeout(timer);
    }
    if (appPhase === 'waitingForAudio') {
      const timer = setTimeout(() => {
        chessRef.current.nextStep();
        setTimeout(() => setAppPhase(currentMetaRef.current ? 'epilogue' : 'idle'), 4500);
      }, 20_000);
      return () => clearTimeout(timer);
    }
  }, [appPhase]);

  // ── Epilogue → outro ─────────────────────────────────────────────────────
  useEffect(() => {
    if (appPhase !== 'epilogue') return;
    const timer = setTimeout(() => setAppPhase('outro'), 5000);
    return () => clearTimeout(timer);
  }, [appPhase]);

  // ── Theme switch reset ───────────────────────────────────────────────────
  useEffect(() => {
    setIsPlaying(false);
    setAppPhase('idle');
  }, [themeIdx]);

  // ── Countdown ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (appPhase !== 'countdown') return;
    const timer = setTimeout(() => {
      if (currentMeta) {
        setAppPhase('intro');
      } else {
        setAppPhase('playing');
        setIsPlaying(true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [appPhase, currentMeta]);

  // ── Auto-play interval ───────────────────────────────────────────────────
  // chess/currentMeta are read through their stable refs so that unrelated
  // re-renders (e.g. volume slider, camera debug at 5 fps) don't reset the
  // 4500 ms timer. Only genuine playback-state changes restart the interval.
  // isCommentaryEndedRef is a stable ref — both are intentionally omitted.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        if (isAnimating) return;
        const c = chessRef.current;
        const meta = currentMetaRef.current;
        if (c.currentStep < c.history.length - 1) {
          // At the penultimate move and commentary is still running — hold here
          if (
            meta &&
            c.currentStep === c.history.length - 2 &&
            !isCommentaryEndedRef.current
          ) {
            setIsPlaying(false);
            setAppPhase('waitingForAudio');
            return;
          }
          c.nextStep();
        } else {
          setIsPlaying(false);
          setAppPhase(meta ? 'finishing' : 'idle');
        }
      }, 4500);
    }
    return () => clearInterval(interval);
  // chess/currentMeta/isCommentaryEndedRef accessed through stable refs — omitted intentionally
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, isAnimating]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const controlsLocked = isAnimating;

  const handlePrevStep = useCallback(() => {
    if (!chessRef.current) return;
    chessRef.current.prevStep();
  }, []);

  const handleNextStep = useCallback(() => {
    if (!chessRef.current) return;
    chessRef.current.nextStep();
  }, []);

  const handleSkip = useCallback((step: number) => {
    chessRef.current.goToStep(step);
  }, []);

  // handlePlayPause receives the current appPhase from the caller (App) so it
  // always operates on the live value — no closure capture needed.
  const handlePlayPause = useCallback((appPhaseCurrent: AppPhase) => {
    if (appPhaseCurrent === 'idle') {
      unlockAudioSession();
      chessRef.current.goToStep(0);
      preWarmAudio();
      setAppPhase('countdown');
    } else if (appPhaseCurrent === 'playing') {
      setIsPlaying(prev => {
        if (!prev && controlsLocked) return prev; // locked — ignore
        return !prev;
      });
    }
  }, [preWarmAudio, controlsLocked]);

  const handleIntroFinish = useCallback(() => {
    setAppPhase('playing');
    setIsPlaying(true);
  }, []);

  const handleOutroClose = useCallback(() => {
    // Delay idle reset to match the fade — setting idle immediately would kill
    // the BGM effect (isAudioActive = false) before the fade completes.
    fadeBgOut(2000);
    if (outroTimerRef.current) clearTimeout(outroTimerRef.current);
    outroTimerRef.current = setTimeout(() => {
      setAppPhase('idle');
      chessRef.current.goToStep(0);
    }, 2000);
  }, [fadeBgOut]);

  const playButtonDisabled =
    appPhase === 'countdown' ||
    appPhase === 'intro' ||
    appPhase === 'waitingForAudio' ||
    appPhase === 'finishing' ||
    appPhase === 'epilogue' ||
    appPhase === 'outro' ||
    (appPhase === 'playing' && !isPlaying && controlsLocked);

  return {
    appPhase,
    isPlaying,
    isAnimating,
    setIsAnimating,
    controlsLocked,
    playButtonDisabled,
    fadeBgOut,
    preWarmAudio,
    handlePlayPause,
    handleIntroFinish,
    handleOutroClose,
    handlePrevStep,
    handleNextStep,
    handleSkip,
  };
}
