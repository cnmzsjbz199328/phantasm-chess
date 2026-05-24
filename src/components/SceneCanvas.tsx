import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Environment, Stats } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useContext } from 'react';
import { Board } from './3d/Board';
import { PieceManager } from './3d/PieceManager';
import { WorldStage } from './3d/WorldStage';
import { CinematicCamera } from './3d/CinematicCamera';
import { UIOverlay } from './UIOverlay';
import { ThemeContext } from '../shared/ThemeContext';
import type { AppPhase, CamKeyframe, CamData } from '../types/AppPhase';
import type { useChessEngine } from '../hooks/useChessEngine';

const SHOW_STATS = new URLSearchParams(window.location.search).has('stats');

type ChessEngine = ReturnType<typeof useChessEngine>;

interface SceneCanvasProps {
  appPhase: AppPhase;
  isPlaying: boolean;
  chess: ChessEngine;
  setIsAnimating: (v: boolean) => void;
  onSkip: (step: number) => void;
  // Camera recording (developer tool)
  isCameraRecording: boolean;
  cameraRecordingRef: { current: CamKeyframe[] };
  recordingStartRef: { current: number };
  onCameraData: ((d: CamData) => void) | null;
}

/**
 * Wraps the R3F `<Canvas>` and all its 3D content.  UIOverlay is included
 * here because it is visually part of the scene (absolutely positioned on top
 * of the canvas, not in the page flow).
 */
export function SceneCanvas({
  appPhase, isPlaying,
  chess, setIsAnimating, onSkip,
  isCameraRecording, cameraRecordingRef, recordingStartRef, onCameraData,
}: SceneCanvasProps) {
  const theme = useContext(ThemeContext);
  const rotateSpeed = appPhase === 'epilogue' || appPhase === 'outro' ? 0.2 : 0.5;

  return (
    <div className="flex-1 relative z-10">
      <Canvas shadows dpr={[1, 2]} frameloop={appPhase === 'outro' ? 'never' : 'always'}>
        {SHOW_STATS && <Stats />}
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 10.4, 17.1]} fov={40} />

          <CinematicCamera
            isPlaying={isPlaying}
            rotateSpeed={rotateSpeed}
            isRecording={isCameraRecording}
            recordingRef={cameraRecordingRef}
            recordingStartRef={recordingStartRef}
            onCameraData={onCameraData}
            appPhase={appPhase}
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
        onSkip={onSkip}
      />
    </div>
  );
}
