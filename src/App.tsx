import { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment, Stats } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { Suspense } from "react";
import { Board } from "./components/3d/Board";
import { PieceManager } from "./components/3d/PieceManager";
import { WorldStage } from "./components/3d/WorldStage";
import { UIOverlay } from "./components/UIOverlay";
import { IntroOverlay } from "./components/IntroOverlay";
import { OutroOverlay } from "./components/OutroOverlay";
import { useChessEngine } from "./hooks/useChessEngine";
import { useCommentaryAudio } from "./hooks/useCommentaryAudio";
import { Shield, Play, Pause, SkipBack, SkipForward, VolumeX, Volume, Volume1, Volume2, Maximize2, Minimize2 } from "lucide-react";
import { THEMES } from "./shared/themes";
import { THEME_MATCH_MAP } from "./data/matches";
import { THEME_META_MAP } from "./data/matchMeta";
import { ThemeContext } from "./shared/ThemeContext";
import { cn } from "./lib/utils";

type AppPhase = 'idle' | 'intro' | 'playing' | 'waitingForAudio' | 'finishing' | 'epilogue' | 'outro';

const SHOW_STATS = new URLSearchParams(window.location.search).has('stats');

// Keeps the AudioContext alive across the intro so iOS Safari doesn't revoke
// the audio session before HTMLAudioElement.play() is called from a setTimeout.
let _audioUnlockCtx: AudioContext | null = null;
function unlockAudioSession() {
  if (_audioUnlockCtx) return;
  try {
    const Ctx = (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
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

function CinematicCamera({ isPlaying, rotateSpeed }: { isPlaying: boolean; rotateSpeed: number }) {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!controlsRef.current) return;
      const controls = controlsRef.current;
      const rotateStep = 0.15;
      const angleStep  = 0.08;
      switch (e.key) {
        case "ArrowLeft":
          controls.setAzimuthalAngle(controls.getAzimuthalAngle() + rotateStep);
          break;
        case "ArrowRight":
          controls.setAzimuthalAngle(controls.getAzimuthalAngle() - rotateStep);
          break;
        case "ArrowUp":
          controls.setPolarAngle(Math.max(controls.minPolarAngle, controls.getPolarAngle() - angleStep));
          break;
        case "ArrowDown":
          controls.setPolarAngle(Math.min(controls.maxPolarAngle, controls.getPolarAngle() + angleStep));
          break;
        default:
          return;
      }
      controls.update();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableDamping
      dampingFactor={0.1}
      maxPolarAngle={Math.PI / 2.1}
      minDistance={5}
      maxDistance={15}
      autoRotate={!isPlaying}
      autoRotateSpeed={rotateSpeed}
    />
  );
}

const COMMENTARY_LEVELS = [0, 0.4, 0.7, 1.0] as const;
const BG_LEVELS = [0, 0.1, 0.18, 0.35] as const;
const VOLUME_ICONS = [VolumeX, Volume, Volume1, Volume2] as const;

function ChessTitle({ appPhase, currentStep, totalSteps }: {
  appPhase: AppPhase;
  currentStep: number;
  totalSteps: number;
}) {
  const frontRef = useRef<HTMLSpanElement>(null);
  const backRef  = useRef<HTMLSpanElement>(null);
  const faceRef  = useRef<'chess' | 'counter'>('chess');

  useEffect(() => {
    gsap.set(backRef.current, {
      opacity: 0, rotateX: 90,
      transformPerspective: 250, transformOrigin: "center top",
    });
  }, []);

  useEffect(() => {
    const wantCounter = appPhase !== 'idle';
    if (wantCounter && faceRef.current === 'chess') {
      faceRef.current = 'counter';
      gsap.killTweensOf([frontRef.current, backRef.current]);
      gsap.to(frontRef.current, {
        opacity: 0, rotateX: -90,
        transformPerspective: 250, transformOrigin: "center bottom",
        duration: 0.22, ease: "power2.in",
        onComplete: () => gsap.to(backRef.current, {
          opacity: 1, rotateX: 0, duration: 0.22, ease: "power2.out",
        }),
      });
    } else if (!wantCounter && faceRef.current === 'counter') {
      faceRef.current = 'chess';
      gsap.killTweensOf([frontRef.current, backRef.current]);
      gsap.to(backRef.current, {
        opacity: 0, rotateX: 90, duration: 0.22, ease: "power2.in",
        onComplete: () => gsap.to(frontRef.current, {
          opacity: 1, rotateX: 0,
          transformPerspective: 250, transformOrigin: "center bottom",
          duration: 0.22, ease: "power2.out",
        }),
      });
    }
  }, [appPhase]);

  useEffect(() => {
    if (faceRef.current === 'counter' && backRef.current) {
      gsap.fromTo(backRef.current, { y: -4 }, { y: 0, duration: 0.18, ease: "power2.out" });
    }
  }, [currentStep]);

  const stepStr = String(currentStep + 1).padStart(2, "0");

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

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [themeIdx, setThemeIdx] = useState(0);
  const [appPhase, setAppPhase] = useState<AppPhase>('idle');
  const [commentaryLvlIdx, setCommentaryLvlIdx] = useState(3);
  const [bgLvlIdx, setBgLvlIdx] = useState(2);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const headerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const theme = THEMES[themeIdx];
  const matchData = THEME_MATCH_MAP[theme.id];
  const chess = useChessEngine(matchData);
  const currentMeta = THEME_META_MAP[theme.id] ?? null;
  const commentaryVol = COMMENTARY_LEVELS[commentaryLvlIdx];
  const bgVol = BG_LEVELS[bgLvlIdx];
  const handleCommentaryEnd = useCallback(() => {
    if (appPhase === 'waitingForAudio') {
      // Commentary outlasted the game — play the final move now, then go to epilogue
      chess.nextStep();
      setTimeout(() => setAppPhase(currentMeta ? 'epilogue' : 'idle'), 4500);
    } else {
      setAppPhase(prev => prev === 'finishing' ? 'epilogue' : prev);
    }
  }, [appPhase, chess, currentMeta]);

  const { fadeBgOut, isCommentaryEndedRef } = useCommentaryAudio(
    theme.id,
    appPhase === 'playing' || appPhase === 'waitingForAudio' || appPhase === 'finishing' || appPhase === 'epilogue' || appPhase === 'outro',
    // Only pause audio when the user manually pauses during playback, not when waiting at penultimate
    !isPlaying && appPhase === 'playing',
    currentMeta?.commentarySegments ?? 0,
    commentaryVol,
    bgVol,
    handleCommentaryEnd,
  );

  // Fallback: if audio fails to fire onended, advance to epilogue after 15 s
  useEffect(() => {
    if (appPhase !== 'finishing') return;
    const timer = setTimeout(() => setAppPhase('epilogue'), 15_000);
    return () => clearTimeout(timer);
  }, [appPhase]);

  // Epilogue: fade BGM over 8 s (5 s here + 3 s into outro), then enter outro
  useEffect(() => {
    if (appPhase !== 'epilogue') return;
    fadeBgOut(8000);
    const timer = setTimeout(() => setAppPhase('outro'), 5000);
    return () => clearTimeout(timer);
  }, [appPhase, fadeBgOut]);

  useEffect(() => {
    const onFsChange = () => {
      const entering = !!document.fullscreenElement;
      setIsFullscreen(entering);
      if (entering) {
        headerTimerRef.current = setTimeout(() => setHeaderVisible(false), 2000);
      } else {
        if (headerTimerRef.current) clearTimeout(headerTimerRef.current);
        setHeaderVisible(true);
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      if (headerTimerRef.current) clearTimeout(headerTimerRef.current);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const showHeader = useCallback(() => {
    if (headerTimerRef.current) clearTimeout(headerTimerRef.current);
    setHeaderVisible(true);
  }, []);

  const scheduleHideHeader = useCallback(() => {
    if (headerTimerRef.current) clearTimeout(headerTimerRef.current);
    headerTimerRef.current = setTimeout(() => setHeaderVisible(false), 1500);
  }, []);

  useEffect(() => {
    setIsPlaying(false);
    setAppPhase('idle');
  }, [themeIdx]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        if (isAnimating) return;
        if (chess.currentStep < chess.history.length - 1) {
          // At the penultimate move and commentary is still running — hold here
          if (
            currentMeta &&
            chess.currentStep === chess.history.length - 2 &&
            !isCommentaryEndedRef.current
          ) {
            setIsPlaying(false);
            setAppPhase('waitingForAudio');
            return;
          }
          chess.nextStep();
        } else {
          setIsPlaying(false);
          setAppPhase(currentMeta ? 'finishing' : 'idle');
        }
      }, 4500);
    }
    return () => clearInterval(interval);
  // isCommentaryEndedRef is a stable ref object — intentionally omitted from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, isAnimating, chess, currentMeta]);

  const controlsLocked = isAnimating;
  const handlePrevStep = () => {
    if (!controlsLocked) chess.prevStep();
  };
  const handleNextStep = () => {
    if (!controlsLocked) chess.nextStep();
  };
  const handlePlayPause = () => {
    if (appPhase === 'idle') {
      unlockAudioSession();
      chess.goToStep(0);
      if (currentMeta) {
        setAppPhase('intro');
      } else {
        setAppPhase('playing');
        setIsPlaying(true);
      }
    } else if (appPhase === 'playing') {
      if (isPlaying || !controlsLocked) setIsPlaying(!isPlaying);
    }
  };
  const handleIntroFinish = useCallback(() => {
    setAppPhase('playing');
    setIsPlaying(true);
  }, []);
  const handleOutroClose = useCallback(() => {
    setAppPhase('idle');
    chess.goToStep(0);
  }, [chess]);
  const handleSkip = (step: number) => {
    if (!controlsLocked) chess.goToStep(step);
  };

  const playButtonDisabled =
    appPhase === 'intro' ||
    appPhase === 'waitingForAudio' ||
    appPhase === 'finishing' ||
    appPhase === 'epilogue' ||
    appPhase === 'outro' ||
    (appPhase === 'playing' && !isPlaying && controlsLocked);

  return (
    <ThemeContext.Provider value={theme}>
      <div className="relative h-screen w-screen bg-phantasm-bg flex flex-col overflow-hidden font-sans text-slate-200">
        <div
          className="absolute inset-0 transition-[background] duration-700"
          style={{ background: theme.backdrop }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.22)_64%,rgba(0,0,0,0.62)_100%)] pointer-events-none" />

        {/* Header */}
        <header
          className={cn(
            "shrink-0 border-b border-white/5 bg-phantasm-bg/80 backdrop-blur-xl z-20 transition-[opacity,transform] duration-300",
            isFullscreen && "absolute top-0 left-0 right-0 z-30",
            isFullscreen && !headerVisible && "opacity-0 -translate-y-full pointer-events-none"
          )}
          onMouseEnter={isFullscreen ? showHeader : undefined}
          onMouseLeave={isFullscreen ? scheduleHideHeader : undefined}
        >
          {/* Primary row */}
          <div className="flex items-center justify-between px-3 sm:px-8 h-12 sm:h-14">
            <div className="flex items-center gap-2 sm:gap-3">
              <Shield className="text-phantasm-accent-light shrink-0" size={18} />
              <ChessTitle appPhase={appPhase} currentStep={chess.currentStep} totalSteps={chess.history.length} />

              {/* Scene switcher */}
              <div className="flex items-center gap-1 sm:gap-1.5 sm:ml-4 sm:pl-4 sm:border-l sm:border-white/10">
                {THEMES.map((t, i) => (
                  <button
                    key={t.id}
                    onClick={() => setThemeIdx(i)}
                    title={t.nameCN}
                    className={cn(
                      "group flex h-7 sm:h-8 items-center gap-1.5 sm:gap-2 rounded-md border px-1.5 sm:px-2 text-xs transition-all duration-300",
                      i === themeIdx
                        ? "border-white/15 bg-white/10 text-white"
                        : "border-transparent bg-transparent text-white/45 hover:bg-white/5 hover:text-white/80"
                    )}
                  >
                    <span
                      className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full shadow-[0_0_12px_currentColor] shrink-0"
                      style={{ backgroundColor: t.dot, color: t.dot }}
                    />
                    <span className={cn("hidden max-w-24 truncate", i === themeIdx ? "md:inline" : "lg:inline")}>
                      {t.nameEN}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3">
              <button
                onClick={handlePrevStep}
                disabled={controlsLocked}
                className={cn(
                  "p-1.5 sm:p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-all active:scale-95",
                  controlsLocked && "cursor-not-allowed opacity-45 hover:bg-white/5 active:scale-100"
                )}
              >
                <SkipBack size={15} className="text-slate-300" />
              </button>
              <button
                onClick={handlePlayPause}
                disabled={playButtonDisabled}
                className={cn(
                  "px-3 sm:px-4 py-1.5 sm:py-2 bg-phantasm-accent hover:bg-phantasm-accent-light rounded-lg transition-all active:scale-95 border border-white/10",
                  playButtonDisabled && "cursor-not-allowed opacity-60 hover:bg-phantasm-accent active:scale-100"
                )}
              >
                {isPlaying ? <Pause size={15} fill="white" /> : <Play size={15} fill="white" />}
              </button>
              <button
                onClick={handleNextStep}
                disabled={controlsLocked}
                className={cn(
                  "p-1.5 sm:p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-all active:scale-95",
                  controlsLocked && "cursor-not-allowed opacity-45 hover:bg-white/5 active:scale-100"
                )}
              >
                <SkipForward size={15} className="text-slate-300" />
              </button>
              {/* Fullscreen toggle */}
              <div className="flex items-center pl-1.5 sm:pl-3 border-l border-white/10">
                <button
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "退出全屏" : "全屏"}
                  className="p-1.5 sm:p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-all active:scale-95"
                >
                  {isFullscreen
                    ? <Minimize2 size={15} className="text-slate-300" />
                    : <Maximize2 size={15} className="text-slate-300" />}
                </button>
              </div>

              {/* Volume controls — desktop only */}
              <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-white/10">
                <button
                  onClick={() => setCommentaryLvlIdx(i => (i + 1) % COMMENTARY_LEVELS.length)}
                  title={`解说音量 ${Math.round(commentaryVol * 100)}%`}
                  className="flex items-center gap-1 px-2 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-all active:scale-95"
                >
                  {(() => { const Icon = VOLUME_ICONS[commentaryLvlIdx]; return <Icon size={14} className="text-slate-300" />; })()}
                  <span className="text-[10px] text-slate-400 leading-none">解</span>
                </button>
                <button
                  onClick={() => setBgLvlIdx(i => (i + 1) % BG_LEVELS.length)}
                  title={`背景音量 ${Math.round(bgVol * 100)}%`}
                  className="flex items-center gap-1 px-2 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-all active:scale-95"
                >
                  {(() => { const Icon = VOLUME_ICONS[bgLvlIdx]; return <Icon size={14} className="text-slate-300" />; })()}
                  <span className="text-[10px] text-slate-400 leading-none">背</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile volume strip */}
          <div className="sm:hidden flex items-center justify-end gap-2 px-3 pb-2">
            <button
              onClick={() => setCommentaryLvlIdx(i => (i + 1) % COMMENTARY_LEVELS.length)}
              title={`解说音量 ${Math.round(commentaryVol * 100)}%`}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-all active:scale-95 text-[10px] text-slate-400"
            >
              {(() => { const Icon = VOLUME_ICONS[commentaryLvlIdx]; return <Icon size={12} className="text-slate-300" />; })()}
              解说
            </button>
            <button
              onClick={() => setBgLvlIdx(i => (i + 1) % BG_LEVELS.length)}
              title={`背景音量 ${Math.round(bgVol * 100)}%`}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-all active:scale-95 text-[10px] text-slate-400"
            >
              {(() => { const Icon = VOLUME_ICONS[bgLvlIdx]; return <Icon size={12} className="text-slate-300" />; })()}
              背景
            </button>
          </div>
        </header>

        {/* Fullscreen: top hit-zone triggers header reveal on hover */}
        {isFullscreen && !headerVisible && (
          <div
            className="absolute top-0 left-0 right-0 h-16 z-20 pointer-events-auto"
            onMouseEnter={showHeader}
          />
        )}

        {/* Fullscreen: persistent exit button while header is hidden */}
        {isFullscreen && !headerVisible && (
          <button
            onClick={toggleFullscreen}
            title="退出全屏"
            className="absolute top-3 right-3 z-30 p-1.5 rounded-lg bg-black/20 hover:bg-black/50 border border-white/10 transition-all opacity-30 hover:opacity-90 active:scale-95"
          >
            <Minimize2 size={13} className="text-white" />
          </button>
        )}

        {/* 3D Scene */}
        <div className="flex-1 relative z-10">
          <Canvas shadows dpr={[1, 2]} frameloop={appPhase === 'outro' ? 'never' : 'always'}>
            {SHOW_STATS && <Stats />}
            <Suspense fallback={null}>
              <PerspectiveCamera makeDefault position={[0, 8, 10]} fov={40} />
              
              <CinematicCamera
                isPlaying={isPlaying}
                rotateSpeed={appPhase === 'epilogue' || appPhase === 'outro' ? 0.2 : 0.5}
              />

              <color attach="background" args={[theme.background]} />
              <fog attach="fog" args={[theme.fogColor, theme.fogNear, theme.fogFar]} />

              <ambientLight intensity={theme.ambientIntensity} />
              <spotLight
                position={[10, 15, 10]}
                angle={0.25}
                penumbra={1}
                intensity={theme.spotIntensity}
                castShadow
                color={theme.spotColor}
              />
              <pointLight position={[-10, 10, -10]} intensity={theme.pointIntensity} color={theme.pointColor} />

              <WorldStage />

              <group>
                <Board />
                <PieceManager
                  boardState={chess.boardState}
                  lastMove={chess.lastMove}
                  currentStep={chess.currentStep}
                  history={chess.history}
                  onAnimatingChange={setIsAnimating}
                />
              </group>

              <Environment preset="city" />

              <EffectComposer enableNormalPass={false}>
                <Bloom
                  luminanceThreshold={theme.bloomThreshold}
                  mipmapBlur
                  intensity={theme.bloomIntensity}
                  radius={theme.bloomRadius}
                />
                <Vignette eskil={false} offset={0.1} darkness={0.8} />
              </EffectComposer>
            </Suspense>
          </Canvas>

          <UIOverlay
            narrative={chess.narrative}
            currentStep={chess.currentStep}
            history={chess.history}
            onSkip={handleSkip}
          />
        </div>

        {appPhase === 'intro' && currentMeta && (
          <IntroOverlay meta={currentMeta} onFinish={handleIntroFinish} />
        )}
        {appPhase === 'outro' && currentMeta && (
          <OutroOverlay meta={currentMeta} onClose={handleOutroClose} />
        )}

        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-phantasm-accent/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-phantasm-glow/5 blur-[120px] rounded-full" />
        </div>
      </div>
    </ThemeContext.Provider>
  );
}
