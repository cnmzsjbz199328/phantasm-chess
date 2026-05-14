import { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Stars, Sparkles } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { Suspense } from "react";
import { Board } from "./components/3d/Board";
import { PieceManager } from "./components/3d/PieceManager";
import { WorldStage } from "./components/3d/WorldStage";
import { UIOverlay } from "./components/UIOverlay";
import { useChessEngine } from "./hooks/useChessEngine";
import { Shield, Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { THEMES } from "./shared/themes";
import { THEME_MATCH_MAP } from "./data/matches";
import { ThemeContext } from "./shared/ThemeContext";
import { cn } from "./lib/utils";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

// Custom component to bridge arrow keys and OrbitControls
function CameraController({ isPlaying }: { isPlaying: boolean }) {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!controlsRef.current) return;
      const controls = controlsRef.current;
      const rotateStep = 0.15;
      const angleStep = 0.08;

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
      enableDamping={true}
      dampingFactor={0.1}
      maxPolarAngle={Math.PI / 2.1}
      minDistance={5}
      maxDistance={15}
      autoRotate={!isPlaying}
      autoRotateSpeed={0.5}
    />
  );
}

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [themeIdx, setThemeIdx] = useState(0);
  const theme = THEMES[themeIdx];
  const chess = useChessEngine(THEME_MATCH_MAP[theme.id]);

  useEffect(() => {
    setIsPlaying(false);
  }, [themeIdx]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        if (isAnimating) return;
        if (chess.currentStep < chess.history.length - 1) {
          chess.nextStep();
        } else {
          setIsPlaying(false);
        }
      }, 4500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isAnimating, chess]);

  const controlsLocked = isAnimating;
  const handlePrevStep = () => {
    if (!controlsLocked) chess.prevStep();
  };
  const handleNextStep = () => {
    if (!controlsLocked) chess.nextStep();
  };
  const handlePlayPause = () => {
    if (isPlaying || !controlsLocked) setIsPlaying(!isPlaying);
  };
  const handleSkip = (step: number) => {
    if (!controlsLocked) chess.goToStep(step);
  };

  return (
    <ThemeContext.Provider value={theme}>
      <div className="relative h-screen w-screen bg-phantasm-bg flex flex-col overflow-hidden font-sans text-slate-200">
        <div
          className="absolute inset-0 transition-[background] duration-700"
          style={{ background: theme.backdrop }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.22)_64%,rgba(0,0,0,0.62)_100%)] pointer-events-none" />

        {/* Header */}
        <header className="h-14 shrink-0 border-b border-white/5 flex items-center px-8 justify-between bg-phantasm-bg/80 backdrop-blur-xl z-20">
          <div className="flex items-center gap-3">
            <Shield className="text-phantasm-accent-light" size={20} />
            <h1 className="text-lg font-light tracking-[0.2em] uppercase text-white">
              <span className="text-phantasm-accent-light font-bold">Phantasm Chess</span>
            </h1>

            {/* Scene switcher */}
            <div className="flex items-center gap-1.5 ml-4 pl-4 border-l border-white/10">
              {THEMES.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => setThemeIdx(i)}
                  title={`${t.nameCN} - ${t.nameEN}`}
                  className={cn(
                    "group flex h-8 items-center gap-2 rounded-md border px-2 text-xs transition-all duration-300",
                    i === themeIdx
                      ? "border-white/15 bg-white/10 text-white"
                      : "border-transparent bg-transparent text-white/45 hover:bg-white/5 hover:text-white/80"
                  )}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full shadow-[0_0_12px_currentColor]"
                    style={{ backgroundColor: t.dot, color: t.dot }}
                  />
                  <span className={cn("hidden max-w-24 truncate sm:inline", i === themeIdx ? "inline" : "lg:inline")}>
                    {t.nameCN}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevStep}
              disabled={controlsLocked}
              className={cn(
                "p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-all active:scale-95",
                controlsLocked && "cursor-not-allowed opacity-45 hover:bg-white/5 active:scale-100"
              )}
            >
              <SkipBack size={16} className="text-slate-300" />
            </button>
            <button
              onClick={handlePlayPause}
              disabled={!isPlaying && controlsLocked}
              className={cn(
                "px-4 py-2 bg-phantasm-accent hover:bg-phantasm-accent-light rounded-lg transition-all active:scale-95 border border-white/10",
                !isPlaying && controlsLocked && "cursor-not-allowed opacity-60 hover:bg-phantasm-accent active:scale-100"
              )}
            >
              {isPlaying ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" />}
            </button>
            <button
              onClick={handleNextStep}
              disabled={controlsLocked}
              className={cn(
                "p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-all active:scale-95",
                controlsLocked && "cursor-not-allowed opacity-45 hover:bg-white/5 active:scale-100"
              )}
            >
              <SkipForward size={16} className="text-slate-300" />
            </button>
            <span className="text-lg font-mono tabular-nums text-white ml-2">
              {String(chess.currentStep + 1).padStart(2, "0")}
              <span className="text-phantasm-accent-light opacity-50 text-base"> / {chess.history.length}</span>
            </span>
          </div>
        </header>

        {/* 3D Scene */}
        <div className="flex-1 relative z-10">
          <Canvas shadows dpr={[1, 2]}>
            <Suspense fallback={null}>
              <PerspectiveCamera makeDefault position={[0, 8, 10]} fov={40} />
              
              <CameraController isPlaying={isPlaying} />

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

              <Stars
                radius={90}
                depth={60}
                count={theme.starsCount}
                factor={1.2}
                saturation={theme.starsSaturation}
                fade
                speed={theme.starsSpeed}
              />
              {theme.sparkles.map((s, i) => (
                <Sparkles
                  key={i}
                  count={s.count}
                  scale={s.scale}
                  size={s.size}
                  speed={s.speed}
                  color={s.color}
                  opacity={s.opacity}
                  position={[0, s.posY, 0]}
                />
              ))}

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

              <ContactShadows position={[0, -0.049, 0]} opacity={0.4} scale={10} blur={2} far={1.5} />
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

        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-phantasm-accent/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-phantasm-glow/5 blur-[120px] rounded-full" />
        </div>
      </div>
    </ThemeContext.Provider>
  );
}
