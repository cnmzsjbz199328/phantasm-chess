import { useState, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";
import { Board } from "./components/3d/Board";
import { PieceManager } from "./components/3d/PieceManager";
import { UIOverlay } from "./components/UIOverlay";
import { useChessEngine } from "./hooks/useChessEngine";
import { Shield, Play, Pause, SkipBack, SkipForward } from "lucide-react";

export default function App() {
  const chess = useChessEngine();
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        if (chess.currentStep < chess.history.length - 1) {
          chess.nextStep();
        } else {
          setIsPlaying(false);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, chess]);

  return (
    <div className="h-screen w-screen bg-phantasm-bg flex flex-col overflow-hidden font-sans text-slate-200">
      {/* Header */}
      <header className="h-14 shrink-0 border-b border-white/5 flex items-center px-8 justify-between bg-phantasm-bg/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-3">
          <Shield className="text-phantasm-accent-light" size={20} />
          <h1 className="text-lg font-light tracking-[0.2em] uppercase text-white">
            幻影棋局 <span className="text-phantasm-accent-light font-bold">Phantasm Chess</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={chess.prevStep}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-all active:scale-95"
          >
            <SkipBack size={16} className="text-slate-300" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-2 bg-phantasm-accent hover:bg-phantasm-accent-light rounded-lg transition-all active:scale-95 border border-white/10"
          >
            {isPlaying ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" />}
          </button>
          <button
            onClick={chess.nextStep}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-all active:scale-95"
          >
            <SkipForward size={16} className="text-slate-300" />
          </button>
          <span className="text-lg font-mono tabular-nums text-white ml-2">
            {String(chess.currentStep + 1).padStart(2, "0")}
            <span className="text-phantasm-accent-light opacity-50 text-base"> / {chess.history.length}</span>
          </span>
        </div>
      </header>

      {/* 3D Scene — fills all remaining space */}
      <div className="flex-1 relative">
        <Canvas shadows dpr={[1, 2]}>
          <Suspense fallback={null}>
            <PerspectiveCamera makeDefault position={[0, 8, 10]} fov={40} />
            <OrbitControls
              enablePan={false}
              maxPolarAngle={Math.PI / 2.1}
              minDistance={5}
              maxDistance={15}
              autoRotate={!isPlaying}
              autoRotateSpeed={0.5}
            />

            <color attach="background" args={["#020912"]} />
            <fog attach="fog" args={["#020912", 20, 40]} />

            <ambientLight intensity={0.4} />
            <spotLight
              position={[10, 15, 10]}
              angle={0.25}
              penumbra={1}
              intensity={0.8}
              castShadow
              color="#1a6080"
            />
            <pointLight position={[-10, 10, -10]} intensity={0.6} color="#801030" />

            <group rotation={[-0.1, 0, 0]}>
              <Board />
              <PieceManager
                boardState={chess.boardState}
                lastMove={chess.lastMove}
                isCapture={chess.isCapture}
              />
            </group>

            <ContactShadows position={[0, -0.1, 0]} opacity={0.4} scale={10} blur={2} far={1.5} />
            <Environment preset="city" />

            <EffectComposer enableNormalPass={false}>
              <Bloom luminanceThreshold={0.5} mipmapBlur intensity={0.4} radius={0.3} />
              <Noise opacity={0.05} />
              <Vignette eskil={false} offset={0.1} darkness={0.8} />
            </EffectComposer>
          </Suspense>
        </Canvas>

        <UIOverlay
          narrative={chess.narrative}
          currentStep={chess.currentStep}
          history={chess.history}
          onSkip={chess.goToStep}
        />
      </div>

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-phantasm-accent/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-phantasm-glow/5 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}
