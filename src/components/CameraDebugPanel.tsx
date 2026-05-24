import type { CamData } from '../shared/AppPhase';

interface CameraDebugPanelProps {
  cameraData: CamData;
  isCameraRecording: boolean;
  recordingPointCount: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onDownloadRecording: () => void;
}

/**
 * Developer overlay showing live camera telemetry and recording controls.
 * Rendered only when the URL contains `?camera=1`.
 */
export function CameraDebugPanel({
  cameraData,
  isCameraRecording,
  recordingPointCount,
  onStartRecording,
  onStopRecording,
  onDownloadRecording,
}: CameraDebugPanelProps) {
  return (
    <div className="absolute top-16 right-3 sm:right-8 z-30 min-w-52 rounded-xl border border-white/10 bg-black/60 backdrop-blur-md p-3 text-[11px] font-mono text-white/80 space-y-1">
      <div className="text-white/40 text-[10px] uppercase tracking-widest mb-1.5">Camera Debug</div>
      <div className="flex gap-3">
        <span>Az <span className="text-cyan-300">{cameraData.azimuthDeg.toFixed(1)}°</span></span>
        <span>Pol <span className="text-cyan-300">{cameraData.polarDeg.toFixed(1)}°</span></span>
        <span>D <span className="text-cyan-300">{cameraData.distance.toFixed(2)}</span></span>
      </div>
      <div className="text-white/50">
        ({cameraData.x.toFixed(2)}&nbsp;{cameraData.y.toFixed(2)}&nbsp;{cameraData.z.toFixed(2)})
      </div>
      <div className="flex items-center gap-2 pt-1 border-t border-white/10">
        {!isCameraRecording ? (
          <button
            onClick={onStartRecording}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 text-red-300 transition-all"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
            REC
          </button>
        ) : (
          <button
            onClick={onStopRecording}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/40 border border-red-500/50 text-red-200 transition-all"
          >
            <span className="w-1.5 h-1.5 rounded-sm bg-red-300 inline-block" />
            STOP&nbsp;
            <span className="tabular-nums text-red-300">{recordingPointCount}</span>
          </button>
        )}
        <button
          onClick={onDownloadRecording}
          disabled={recordingPointCount === 0}
          className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/15 border border-white/10 transition-all disabled:opacity-30"
        >
          ↓ JSON
        </button>
        {recordingPointCount > 0 && !isCameraRecording && (
          <span className="text-white/40 tabular-nums">{recordingPointCount} pts</span>
        )}
      </div>
    </div>
  );
}
