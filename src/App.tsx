import { useState } from 'react';
import { Minimize2 } from 'lucide-react';
import { THEMES } from './shared/themes';
import { THEME_MATCH_MAP } from './data/matches';
import { THEME_META_MAP } from './data/matchMeta';
import { ThemeContext } from './shared/ThemeContext';
import { useChessEngine } from './hooks/useChessEngine';
import { useGameOrchestrator, COMMENTARY_LEVELS, BG_LEVELS } from './hooks/useGameOrchestrator';
import { useFullscreen } from './hooks/useFullscreen';
import { useCameraRecording } from './hooks/useCameraRecording';
import { AppHeader } from './components/AppHeader';
import { SceneCanvas } from './components/SceneCanvas';
import { CountdownOverlay } from './components/CountdownOverlay';
import { IntroOverlay } from './components/IntroOverlay';
import { OutroOverlay } from './components/OutroOverlay';
import { CameraDebugPanel } from './components/CameraDebugPanel';
import type { CamData } from './shared/AppPhase';

const SHOW_CAMERA_DEBUG = new URLSearchParams(window.location.search).has('camera');

export default function App() {
  const [themeIdx, setThemeIdx] = useState(0);
  const [commentaryLvlIdx, setCommentaryLvlIdx] = useState(3);
  const [bgLvlIdx, setBgLvlIdx] = useState(3);

  const theme = THEMES[themeIdx];
  const matchData = THEME_MATCH_MAP[theme.id];
  const chess = useChessEngine(matchData);
  const currentMeta = THEME_META_MAP[theme.id] ?? null;
  const commentaryVol = COMMENTARY_LEVELS[commentaryLvlIdx];
  const bgVol = BG_LEVELS[bgLvlIdx];

  const {
    appPhase, isPlaying, isAnimating, setIsAnimating,
    controlsLocked, playButtonDisabled,
    handlePlayPause, handleIntroFinish, handleOutroClose,
    handlePrevStep, handleNextStep, handleSkip,
  } = useGameOrchestrator({ themeIdx, themeId: theme.id, chess, currentMeta, commentaryVol, bgVol });

  const {
    isFullscreen, headerVisible,
    toggleFullscreen, showHeader, scheduleHideHeader,
  } = useFullscreen();

  // Camera debug tool (enabled via ?camera=1)
  const [cameraData, setCameraData] = useState<CamData | null>(null);
  const {
    isCameraRecording, cameraRecordingRef, recordingStartRef,
    handleStartRecording, handleStopRecording, handleDownloadRecording,
  } = useCameraRecording();

  return (
    <ThemeContext.Provider value={theme}>
      <div className="relative h-screen w-screen bg-phantasm-bg flex flex-col overflow-hidden font-sans text-slate-200">
        {/* Background */}
        <div
          className="absolute inset-0 transition-[background] duration-700"
          style={{ background: theme.backdrop }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.22)_64%,rgba(0,0,0,0.62)_100%)] pointer-events-none" />

        <AppHeader
          appPhase={appPhase}
          currentStep={chess.currentStep}
          totalSteps={chess.history.length}
          themeIdx={themeIdx}
          onThemeChange={setThemeIdx}
          isPlaying={isPlaying}
          controlsLocked={controlsLocked}
          playButtonDisabled={playButtonDisabled}
          isFullscreen={isFullscreen}
          headerVisible={headerVisible}
          showHeader={showHeader}
          scheduleHideHeader={scheduleHideHeader}
          toggleFullscreen={toggleFullscreen}
          commentaryLvlIdx={commentaryLvlIdx}
          onCommentaryLvlChange={setCommentaryLvlIdx}
          bgLvlIdx={bgLvlIdx}
          onBgLvlChange={setBgLvlIdx}
          commentaryVol={commentaryVol}
          bgVol={bgVol}
          onPrevStep={handlePrevStep}
          onNextStep={handleNextStep}
          onPlayPause={() => handlePlayPause(appPhase)}
        />

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
            title="Exit Fullscreen"
            className="absolute top-3 right-3 z-30 p-1.5 rounded-lg bg-black/20 hover:bg-black/50 border border-white/10 transition-all opacity-30 hover:opacity-90 active:scale-95"
          >
            <Minimize2 size={13} className="text-white" />
          </button>
        )}

        <SceneCanvas
          appPhase={appPhase}
          isPlaying={isPlaying}
          chess={chess}
          setIsAnimating={setIsAnimating}
          onSkip={handleSkip}
          isCameraRecording={isCameraRecording}
          cameraRecordingRef={cameraRecordingRef}
          recordingStartRef={recordingStartRef}
          onCameraData={SHOW_CAMERA_DEBUG ? setCameraData : null}
        />

        {/* Phase overlays */}
        {appPhase === 'countdown' && <CountdownOverlay />}
        {appPhase === 'intro' && currentMeta && (
          <IntroOverlay meta={currentMeta} onFinish={handleIntroFinish} />
        )}
        {appPhase === 'outro' && currentMeta && (
          <OutroOverlay meta={currentMeta} onClose={handleOutroClose} />
        )}

        {/* Camera debug panel */}
        {SHOW_CAMERA_DEBUG && cameraData && (
          <CameraDebugPanel
            cameraData={cameraData}
            isCameraRecording={isCameraRecording}
            recordingPointCount={cameraRecordingRef.current.length}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onDownloadRecording={handleDownloadRecording}
          />
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
