/**
 * Global application phase — drives all major state transitions.
 *
 * Lifecycle:
 *   idle → countdown → intro? → playing → waitingForAudio? → finishing → epilogue → outro → idle
 *
 *   waitingForAudio: game reached penultimate move while commentary is still playing;
 *                    waits for onCommentaryEnd before advancing to the final move.
 */
export type AppPhase =
  | 'idle'
  | 'countdown'
  | 'intro'
  | 'playing'
  | 'waitingForAudio'
  | 'finishing'
  | 'epilogue'
  | 'outro';

/** Single keyframe captured during camera path recording (developer tool). */
export interface CamKeyframe {
  t: number;        // ms from recording start
  azimuth: number;  // radians
  polar: number;    // radians
  distance: number;
}

/** Live camera telemetry forwarded to the debug panel. */
export interface CamData {
  azimuthDeg: number;
  polarDeg: number;
  distance: number;
  x: number;
  y: number;
  z: number;
}
