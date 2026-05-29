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

  const outroTimerRef               = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commentaryEndTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waitingFallbackInnerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable refs so fire-and-forget callbacks always read the latest values
  // without being recreated (avoids the stale-closure bug fixed previously).
  const chessRef = useRef(chess);
  chessRef.current = chess;
  const currentMetaRef = useRef(currentMeta);
  currentMetaRef.current = currentMeta;

  // ── Audio ────────────────────────────────────────────────────────────────
  const { fadeBgOut, isCommentaryEndedRef, preWarmAudio, commentaryEnded } = useCommentaryAudio(
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
  );

  // ── Commentary-end coordination ──────────────────────────────────────────
  // commentaryEnded is React state (not a ref), so this effect is guaranteed
  // to fire AFTER both appPhase and commentaryEnded are committed — eliminating
  // the React 18 concurrent-mode race where onended fired before appPhaseRef
  // was updated, causing handleCommentaryEnd to read a stale phase value.
  useEffect(() => {
    if (!commentaryEnded) return;
    if (appPhase === 'waitingForAudio') {
      // Commentary outlasted the game — play the final move, then epilogue.
      chessRef.current.nextStep();
      setAppPhase('finishing'); // transition cancels the waitingForAudio 20 s fallback
      if (commentaryEndTimerRef.current) clearTimeout(commentaryEndTimerRef.current);
      commentaryEndTimerRef.current = setTimeout(() => {
        commentaryEndTimerRef.current = null;
        setAppPhase(currentMetaRef.current ? 'epilogue' : 'idle');
      }, 4500);
    } else if (appPhase === 'finishing' && !commentaryEndTimerRef.current) {
      // Commentary ended while already in finishing (e.g., game reached final
      // step before commentary ended). Only fire if the 4500 ms timer started
      // by the waitingForAudio branch above is not already pending.
      setAppPhase('epilogue');
    }
  }, [appPhase, commentaryEnded]);

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
        if (waitingFallbackInnerTimerRef.current) clearTimeout(waitingFallbackInnerTimerRef.current);
        waitingFallbackInnerTimerRef.current = setTimeout(() => {
          waitingFallbackInnerTimerRef.current = null;
          setAppPhase(currentMetaRef.current ? 'epilogue' : 'idle');
        }, 4500);
      }, 20_000);
      return () => clearTimeout(timer);
    }
  }, [appPhase]);

  // ── Epilogue → outro ─────────────────────────────────────────────────────
  // Fade BGM over the full epilogue window (5 s) so music is silent by the
  // time the outro overlay appears — matches film convention.
  useEffect(() => {
    if (appPhase !== 'epilogue') return;
    fadeBgOut(5000);
    const timer = setTimeout(() => setAppPhase('outro'), 5000);
    return () => clearTimeout(timer);
  }, [appPhase, fadeBgOut]);

  // ── Theme switch reset ───────────────────────────────────────────────────
  useEffect(() => {
    if (commentaryEndTimerRef.current) { clearTimeout(commentaryEndTimerRef.current); commentaryEndTimerRef.current = null; }
    if (waitingFallbackInnerTimerRef.current) { clearTimeout(waitingFallbackInnerTimerRef.current); waitingFallbackInnerTimerRef.current = null; }
    if (outroTimerRef.current) { clearTimeout(outroTimerRef.current); outroTimerRef.current = null; }
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
  // chess.currentStep (a primitive) is the only chess dep — it changes only
  // when a step actually advances, so the 4500 ms timer resets per step
  // without being disrupted by unrelated re-renders (volume slider, camera
  // debug at 5 fps, etc.).  currentMeta is stable (static lookup) and is read
  // via ref; isCommentaryEndedRef is an intentionally stable ref — both omitted.
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
  // currentMeta/isCommentaryEndedRef accessed through stable refs — omitted intentionally
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, isAnimating, chess.currentStep]);

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
    // BGM was already faded to zero during the epilogue phase — just reset state.
    if (outroTimerRef.current) clearTimeout(outroTimerRef.current);
    outroTimerRef.current = setTimeout(() => {
      setAppPhase('idle');
      chessRef.current.goToStep(0);
    }, 300);
  }, []);

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
