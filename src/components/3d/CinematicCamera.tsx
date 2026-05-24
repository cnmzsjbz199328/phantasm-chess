import { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { AppPhase, CamKeyframe, CamData } from '../../shared/AppPhase';

// ── Cinematic camera constants (values from recorded path data) ──────────────
const CINEMATIC_POLAR       = 58.85 * (Math.PI / 180); // polar from recording
const CINEMATIC_DIST        = 15;                       // "just right" distance
const CINEMATIC_DIST_START  = 20;                       // opening wide shot
const FAST_HALF_TURN_S      = 180 / 40;                 // 4.5 s at ~40°/s (recorded)
const FAST_PAUSE_S          = 30;
const SLOW_HALF_TURN_S      = 30;                       // 6°/s → 180° in 30 s
const SLOW_PAUSE_S          = 30;

interface CinematicCameraProps {
  isPlaying: boolean;
  rotateSpeed: number;
  isRecording: boolean;
  recordingRef: { current: CamKeyframe[] };
  recordingStartRef: { current: number };
  onCameraData: ((d: CamData) => void) | null;
  appPhase: AppPhase;
}

/**
 * R3F component that drives the OrbitControls with a GSAP-animated cinematic
 * sweep. Users can take manual control; the camera hands back to cinematic
 * mode after 30 s of inactivity.
 */
export function CinematicCamera({
  isPlaying, rotateSpeed,
  isRecording, recordingRef, recordingStartRef, onCameraData,
  appPhase,
}: CinematicCameraProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const lastRecMs   = useRef(0);
  const lastDispMs  = useRef(0);

  // Proxy object that GSAP animates; useFrame reads it every tick
  const camProxy  = useRef({ azimuth: 0, polar: CINEMATIC_POLAR, distance: CINEMATIC_DIST_START });
  const cinematic = useRef(false);
  const pullInRef = useRef<gsap.core.Tween | null>(null);
  const cycleRef  = useRef<gsap.core.Timeline | null>(null);

  // Tracks live camera distance for restoring after manual takeover
  const currentDistRef       = useRef(CINEMATIC_DIST_START);
  // Stable ref so setTimeout callbacks always see the latest value
  const isCinematicActiveRef = useRef(false);
  // runCycle stored in ref so the 30 s restore timer can call it
  const runCycleRef          = useRef<(() => void) | null>(null);
  const manualTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Active during normal gameplay phases only (not idle / intro / outro)
  const isCinematicActive =
    appPhase === 'playing' || appPhase === 'waitingForAudio' || appPhase === 'finishing';
  isCinematicActiveRef.current = isCinematicActive;

  // ── manual takeover: user grabbed camera during cinematic ─────────────────
  const handleManualTakeover = useCallback(() => {
    if (!isCinematicActiveRef.current) return;
    cinematic.current = false;
    pullInRef.current?.kill();
    cycleRef.current?.kill();
    pullInRef.current = cycleRef.current = null;

    if (manualTimerRef.current) clearTimeout(manualTimerRef.current);
    manualTimerRef.current = setTimeout(() => {
      if (!isCinematicActiveRef.current || !controlsRef.current) return;
      camProxy.current.azimuth  = controlsRef.current.getAzimuthalAngle();
      camProxy.current.polar    = controlsRef.current.getPolarAngle();
      camProxy.current.distance = currentDistRef.current;
      cinematic.current = true;
      runCycleRef.current?.();
    }, 30_000);
  }, []);

  // Attach OrbitControls 'start' event so mouse drag and scroll trigger takeover
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.addEventListener('start', handleManualTakeover);
    return () => controls.removeEventListener('start', handleManualTakeover);
  }, [handleManualTakeover]);

  // ── keyboard nudge — triggers manual takeover then hands off to OrbitControls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!controlsRef.current) return;
      const c = controlsRef.current;
      const rs = 0.15, as = 0.08;
      switch (e.key) {
        case 'ArrowLeft':  c.setAzimuthalAngle(c.getAzimuthalAngle() + rs); break;
        case 'ArrowRight': c.setAzimuthalAngle(c.getAzimuthalAngle() - rs); break;
        case 'ArrowUp':    c.setPolarAngle(Math.max(c.minPolarAngle, c.getPolarAngle() - as)); break;
        case 'ArrowDown':  c.setPolarAngle(Math.min(c.maxPolarAngle, c.getPolarAngle() + as)); break;
        default: return;
      }
      c.update();
      handleManualTakeover();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleManualTakeover]);

  // Attach robust direct touch/pointer event listeners to release camera lock on Safari / touch devices
  useEffect(() => {
    const handleDown = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (target && target.tagName === 'CANVAS') {
        handleManualTakeover();
      }
    };
    window.addEventListener('pointerdown', handleDown, { passive: true });
    window.addEventListener('touchstart', handleDown, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', handleDown);
      window.removeEventListener('touchstart', handleDown);
    };
  }, [handleManualTakeover]);

  // ── cinematic choreography ────────────────────────────────────────────────
  useEffect(() => {
    const stop = () => {
      cinematic.current = false;
      pullInRef.current?.kill();
      cycleRef.current?.kill();
      pullInRef.current = cycleRef.current = null;
      if (manualTimerRef.current) { clearTimeout(manualTimerRef.current); manualTimerRef.current = null; }
    };

    if (!isCinematicActive) { stop(); return; }
    if (!controlsRef.current) return;

    cinematic.current = true;
    camProxy.current.azimuth  = controlsRef.current.getAzimuthalAngle();
    camProxy.current.polar    = controlsRef.current.getPolarAngle();
    camProxy.current.distance = CINEMATIC_DIST_START;

    function runCycle() {
      if (!cinematic.current) return;
      const base = camProxy.current.azimuth;
      const tl = gsap.timeline({ onComplete: runCycle });
      cycleRef.current = tl;
      tl
        .to(camProxy.current, { azimuth: base + Math.PI, duration: FAST_HALF_TURN_S, ease: 'power2.inOut' })
        .to({}, { duration: FAST_PAUSE_S })
        .to(camProxy.current, { azimuth: base + 2 * Math.PI, duration: SLOW_HALF_TURN_S, ease: 'none' })
        .to({}, { duration: SLOW_PAUSE_S });
    }
    runCycleRef.current = runCycle;

    pullInRef.current = gsap.to(camProxy.current, {
      distance: CINEMATIC_DIST,
      polar:    CINEMATIC_POLAR,
      duration: 8,
      ease: 'power2.inOut',
      onComplete: runCycle,
    });

    return stop;
  }, [isCinematicActive]);

  // ── per-frame update — priority 1 runs after OrbitControls ───────────────
  useFrame(({ clock, camera }) => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    const nowMs = clock.getElapsedTime() * 1000;

    const az   = cinematic.current ? camProxy.current.azimuth   : controls.getAzimuthalAngle();
    const pol  = cinematic.current ? camProxy.current.polar      : controls.getPolarAngle();
    const dist = cinematic.current ? camProxy.current.distance   : camera.position.distanceTo(controls.target);

    currentDistRef.current = dist;

    if (cinematic.current) {
      camera.position.set(
        dist * Math.sin(pol) * Math.sin(az),
        dist * Math.cos(pol),
        dist * Math.sin(pol) * Math.cos(az),
      );
      camera.lookAt(controls.target);
      camera.updateMatrixWorld();
    }

    // Record at 10 fps
    if (isRecording && nowMs - lastRecMs.current >= 100) {
      lastRecMs.current = nowMs;
      recordingRef.current.push({ t: performance.now() - recordingStartRef.current, azimuth: az, polar: pol, distance: dist });
    }

    // Debug display at 5 fps
    if (onCameraData && nowMs - lastDispMs.current >= 200) {
      lastDispMs.current = nowMs;
      onCameraData({ azimuthDeg: az * (180 / Math.PI), polarDeg: pol * (180 / Math.PI), distance: dist,
        x: camera.position.x, y: camera.position.y, z: camera.position.z });
    }
  }, 1);

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={true}
      enablePan={false}
      enableDamping
      dampingFactor={0.1}
      maxPolarAngle={Math.PI / 2.1}
      minDistance={5}
      maxDistance={20}
      autoRotate={!isPlaying && !isCinematicActive}
      autoRotateSpeed={rotateSpeed}
    />
  );
}
