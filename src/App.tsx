/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment, Float, ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";
import { Board } from "./components/3d/Board";
import { PieceManager } from "./components/3d/PieceManager";
import { UIOverlay } from "./components/UIOverlay";
import { useChessEngine } from "./hooks/useChessEngine";

export default function App() {
  const chess = useChessEngine();
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        if (chess.currentStep < chess.history.length - 1) {
          chess.nextStep();
        } else {
          setIsPlaying(false);
        }
      }, 3000); // 3 seconds per move for cinematic feel
    }
    return () => clearInterval(interval);
  }, [isPlaying, chess]);

  return (
    <div className="h-screen w-screen bg-phantasm-bg flex overflow-hidden font-sans text-slate-200">
      {/* Left Navigation Rail */}
      <nav className="w-20 border-r border-white/10 flex flex-col items-center py-8 gap-10 bg-phantasm-rail z-20">
        <div className="w-10 h-10 bg-phantasm-accent rounded-lg flex items-center justify-center shadow-lg shadow-phantasm-accent/20">
          <div className="w-6 h-6 border-2 border-white rotate-45"></div>
        </div>
        <div className="flex flex-col gap-8 opacity-40">
          <div className="w-6 h-6 border-2 border-white rounded-sm"></div>
          <div className="w-6 h-6 border-2 border-white rounded-full"></div>
          <div className="w-6 h-6 border-t-2 border-l-2 border-white"></div>
          <div className="w-6 h-6 bg-white"></div>
        </div>
        <div className="mt-auto mb-4 opacity-20 text-[10px] uppercase tracking-widest rotate-180" style={{ writingMode: "vertical-rl" }}>
          PHANTASM_V1.0
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-white/10 flex items-center px-10 justify-between bg-phantasm-bg/50 backdrop-blur-md z-20">
          <div>
            <h1 className="text-2xl font-light tracking-[0.2em] uppercase text-white">
              幻影棋局 <span className="text-phantasm-accent-light font-bold">Phantasm Chess</span>
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">
              Cinematic Visualization & Tactical Analysis Engine
            </p>
          </div>
          <div className="flex gap-4">
            <div className="px-4 py-2 border border-white/10 rounded text-[11px] uppercase tracking-tighter bg-white/5">
              System: Active
            </div>
            <div className="px-4 py-2 border border-phantasm-accent/30 rounded text-[11px] uppercase tracking-tighter bg-phantasm-accent/10 text-phantasm-accent-light">
              Render: R3F / GLSL
            </div>
          </div>
        </header>

        {/* 3D Scene Viewport */}
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

              <color attach="background" args={["#0a0a0c"]} />
              <fog attach="fog" args={["#0a0a0c", 5, 20]} />

              {/* Lighting */}
              <ambientLight intensity={0.2} />
              <spotLight 
                position={[5, 10, 5]} 
                angle={0.15} 
                penumbra={1} 
                intensity={1.5} 
                castShadow 
                color="#6366f1"
              />
              <pointLight position={[-5, 5, -5]} intensity={1} color="#7000ff" />

              {/* Core Elements */}
              <group rotation={[-0.1, 0, 0]}>
                <Board />
                <PieceManager 
                  boardState={chess.boardState} 
                  lastMove={chess.lastMove} 
                  isCapture={chess.isCapture}
                />
              </group>

              <ContactShadows 
                position={[0, -0.1, 0]} 
                opacity={0.4} 
                scale={10} 
                blur={2} 
                far={1.5} 
              />

              <Environment preset="city" />

              {/* Cinematic Effects */}
              <EffectComposer enableNormalPass={false}>
                <Bloom 
                  luminanceThreshold={0.2} 
                  mipmapBlur 
                  intensity={1.2} 
                  radius={0.4} 
                />
                <Noise opacity={0.05} />
                <Vignette eskil={false} offset={0.1} darkness={0.8} />
              </EffectComposer>
            </Suspense>
          </Canvas>

          {/* UI Overlay */}
          <UIOverlay 
            matchInfo={chess.matchInfo}
            currentStep={chess.currentStep}
            totalSteps={chess.history.length}
            narrative={chess.narrative}
            history={chess.history}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            onNext={chess.nextStep}
            onPrev={chess.prevStep}
            onSkip={chess.goToStep}
          />
        </div>

        {/* Footer Status Bar */}
        <footer className="h-10 bg-phantasm-accent px-10 flex items-center justify-between text-[10px] uppercase tracking-widest font-bold text-white z-20">
          <span>Session Source: {chess.matchInfo.title}</span>
          <div className="flex gap-6">
            <span>Shaders: Active</span>
            <span>Step: {chess.currentStep + 1} / {chess.history.length}</span>
          </div>
        </footer>
      </main>

      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-phantasm-accent/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-phantasm-glow/5 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}
