import { useState, useRef, useCallback } from 'react';
import type { CamKeyframe } from '../shared/AppPhase';

/**
 * Developer tool: records camera path keyframes that can be downloaded as JSON
 * for offline analysis or baking into cinematic constants.
 *
 * Enabled when the URL contains `?camera=1`.
 */
export function useCameraRecording() {
  const [isCameraRecording, setIsCameraRecording] = useState(false);
  const cameraRecordingRef = useRef<CamKeyframe[]>([]);
  const recordingStartRef = useRef(0);

  const handleStartRecording = useCallback(() => {
    cameraRecordingRef.current = [];
    recordingStartRef.current = performance.now();
    setIsCameraRecording(true);
  }, []);

  const handleStopRecording = useCallback(() => setIsCameraRecording(false), []);

  const handleDownloadRecording = useCallback(() => {
    const payload = JSON.stringify(
      {
        recordedAt: new Date().toISOString(),
        note: 'azimuth/polar in radians; t in ms from recording start',
        samples: cameraRecordingRef.current,
      },
      null,
      2,
    );
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([payload], { type: 'application/json' })),
      download: `camera-path-${Date.now()}.json`,
    });
    a.click();
    URL.revokeObjectURL(a.href);
  }, []);

  return {
    isCameraRecording,
    cameraRecordingRef,
    recordingStartRef,
    handleStartRecording,
    handleStopRecording,
    handleDownloadRecording,
  };
}
