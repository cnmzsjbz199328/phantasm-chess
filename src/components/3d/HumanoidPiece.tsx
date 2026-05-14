import { forwardRef, useMemo, useRef, useImperativeHandle, useEffect } from "react";
import type { RefObject, MutableRefObject } from "react";
import type { ComponentType } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import "./Shaders";
import type { Side, PieceRig } from "../../shared/types";
import { SIDE_COLORS } from "../../shared/pieceColors";

interface HumanoidPieceProps {
  type: string;
  color: Side;
  dissolveRef?: MutableRefObject<number>;
  locomotion?: {
    active: boolean;
    intensity?: number;
    speed?: number;
  };
}

export const HumanoidPieceModel = forwardRef<PieceRig, HumanoidPieceProps>(
  function HumanoidPieceModel({ type, color, dissolveRef, locomotion }, ref) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftFootRef = useRef<THREE.Group>(null);
  const rightFootRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const weaponRef = useRef<THREE.Group>(null);
  const walkPhaseRef = useRef(0);
  const wasDissolving = useRef(false);
  const wasWalking    = useRef(false);
  const dissolveTargets = useRef<THREE.ShaderMaterial[]>([]);

  useEffect(() => {
    dissolveTargets.current = [];
    groupRef.current?.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.ShaderMaterial) {
        dissolveTargets.current.push(child.material as THREE.ShaderMaterial);
      }
    });
  }, [type]);

  useImperativeHandle(ref, () => ({
    body: bodyRef.current!,
    rightArm: rightArmRef.current,
    leftArm: leftArmRef.current,
    weapon: weaponRef.current,
  }), [type]);

  const cv = useMemo(() => {
    const { primary, secondary, accent, dark, glow } = SIDE_COLORS[color];
    return {
      pri:  new THREE.Color(primary),
      sec:  new THREE.Color(secondary),
      acc:  new THREE.Color(accent),
      dark: new THREE.Color(dark),
      glow: new THREE.Color(glow),
    };
  }, [color]);

  const DM = "dissolveMaterial" as unknown as ComponentType<Record<string, unknown>>;
  const m = (col: THREE.Color) => ({ uBaseColor: col, uColor: cv.glow });

  const resetLimb = (ref: RefObject<THREE.Group | null>, stiffness = 0.18) => {
    if (!ref.current) return;
    ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, 0, stiffness);
    ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, 0, stiffness);
    ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, 0, stiffness);
    ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, 0, stiffness);
  };

  useFrame((state, dt) => {
    if (!groupRef.current) return;
    const pieceType = type.toLowerCase();
    const canWalk = pieceType === "p" || pieceType === "k" || pieceType === "q" || pieceType === "b";
    const walkActive = Boolean(locomotion?.active && canWalk);
    const d = dissolveRef?.current ?? 0;
    const isDissolving = d > 0.001;

    if (!walkActive && !wasWalking.current && !isDissolving && !wasDissolving.current) return;

    const walkIntensity = locomotion?.intensity ?? 1;

    if (walkActive) {
      wasWalking.current = true;
      walkPhaseRef.current += dt * (locomotion?.speed ?? 12);
      const phase = walkPhaseRef.current;
      const swing = Math.sin(phase) * 0.34 * walkIntensity;
      const footLift = Math.max(0, Math.sin(phase)) * 0.08 * walkIntensity;
      const otherFootLift = Math.max(0, -Math.sin(phase)) * 0.08 * walkIntensity;
      const regalScale = pieceType === "k" ? 0.72 : pieceType === "q" ? 0.82 : 1;

      if (leftLegRef.current) leftLegRef.current.rotation.x = swing * regalScale;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing * regalScale;
      if (leftFootRef.current) {
        leftFootRef.current.rotation.x = -swing * 0.35;
        leftFootRef.current.position.y = footLift;
        leftFootRef.current.position.z = Math.max(0, Math.sin(phase)) * 0.04 * walkIntensity;
      }
      if (rightFootRef.current) {
        rightFootRef.current.rotation.x = swing * 0.35;
        rightFootRef.current.position.y = otherFootLift;
        rightFootRef.current.position.z = Math.max(0, -Math.sin(phase)) * 0.04 * walkIntensity;
      }
      if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.45 * regalScale;
      if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.45 * regalScale;
      if (bodyRef.current) {
        bodyRef.current.position.y = Math.abs(Math.sin(phase)) * 0.035 * walkIntensity;
        bodyRef.current.rotation.z = Math.sin(phase) * 0.025 * regalScale * walkIntensity;
      }
    } else if (wasWalking.current) {
      resetLimb(leftLegRef);
      resetLimb(rightLegRef);
      resetLimb(leftFootRef);
      resetLimb(rightFootRef);
      resetLimb(leftArmRef);
      resetLimb(rightArmRef);
      if (bodyRef.current) {
        bodyRef.current.position.y = THREE.MathUtils.lerp(bodyRef.current.position.y, 0, 0.18);
        bodyRef.current.rotation.z = THREE.MathUtils.lerp(bodyRef.current.rotation.z, 0, 0.18);
      }
      if (
        Math.abs(leftLegRef.current?.rotation.x ?? 0) < 0.002 &&
        Math.abs(rightLegRef.current?.rotation.x ?? 0) < 0.002 &&
        Math.abs(leftArmRef.current?.rotation.x ?? 0) < 0.002 &&
        Math.abs(bodyRef.current?.rotation.z ?? 0) < 0.001
      ) wasWalking.current = false;
    }

    if (!isDissolving && !wasDissolving.current) return;
    wasDissolving.current = isDissolving;
    const t = isDissolving ? state.clock.getElapsedTime() : 0;
    for (const mat of dissolveTargets.current) {
      if (isDissolving) mat.uniforms.uTime.value = t;
      mat.uniforms.uDissolve.value = d;
    }
  });

  // ── body helpers — lowercase functions, not React components (avoids remount on re-render) ──

  const sideRef = (x: number, left: RefObject<THREE.Group | null>, right: RefObject<THREE.Group | null>) => x < 0 ? left : right;
  const foot      = (x: number) => <group ref={sideRef(x, leftFootRef, rightFootRef)}><mesh position={[x, 0.06, 0.03]}><boxGeometry args={[0.14, 0.1, 0.22]} /><DM {...m(cv.dark)} /></mesh></group>;
  const leg       = (x: number) => <group ref={sideRef(x, leftLegRef, rightLegRef)}><mesh position={[x, 0.29, 0]}><boxGeometry args={[0.14, 0.36, 0.14]} /><DM {...m(cv.sec)} /></mesh></group>;
  const hips      = (w = 0.34)  => <mesh position={[0, 0.49, 0]}><boxGeometry args={[w, 0.12, 0.19]} /><DM {...m(cv.pri)} /></mesh>;
  const torso     = (w = 0.38, h = 0.38) => <mesh position={[0, 0.71, 0]}><boxGeometry args={[w, h, 0.22]} /><DM {...m(cv.sec)} /></mesh>;
  const pauldron  = (x: number) => <mesh position={[x, 0.85, 0]}><boxGeometry args={[0.14, 0.1, 0.2]} /><DM {...m(cv.pri)} /></mesh>;
  const upperArm  = (x: number) => <group ref={sideRef(x, leftArmRef, rightArmRef)}><mesh position={[x, 0.67, 0]}><boxGeometry args={[0.13, 0.28, 0.13]} /><DM {...m(cv.sec)} /></mesh></group>;
  const forearm   = (x: number) => <mesh position={[x, 0.47, 0]}><boxGeometry args={[0.11, 0.22, 0.11]} /><DM {...m(cv.sec)} /></mesh>;
  const hand      = (x: number) => <mesh position={[x, 0.34, 0.01]}><boxGeometry args={[0.1, 0.1, 0.13]} /><DM {...m(cv.acc)} /></mesh>;
  const neck      = (y = 0.95)  => <mesh position={[0, y, 0]}><cylinderGeometry args={[0.065, 0.075, 0.1, 8]} /><DM {...m(cv.sec)} /></mesh>;
  const head      = (y = 1.11)  => <mesh position={[0, y, 0]}><boxGeometry args={[0.24, 0.24, 0.22]} /><DM {...m(cv.sec)} /></mesh>;
  const royalBoot = (x: number) => <group ref={sideRef(x, leftFootRef, rightFootRef)}><mesh position={[x, 0.07, 0.08]}><boxGeometry args={[0.18, 0.12, 0.28]} /><DM {...m(cv.dark)} /></mesh></group>;
  const royalGreave = (x: number) => <group ref={sideRef(x, leftLegRef, rightLegRef)}><mesh position={[x, 0.3, 0.09]}><boxGeometry args={[0.16, 0.36, 0.08]} /><DM {...m(cv.pri)} /></mesh></group>;

  const fullBody = (torsoW = 0.38) => (
    <>
      {foot(-0.09)}{foot(0.09)}
      {leg(-0.09)}{leg(0.09)}
      {hips(torsoW - 0.04)}
      {torso(torsoW)}
      {pauldron(-0.27)}{pauldron(0.27)}
      {upperArm(-0.27)}{upperArm(0.27)}
      {forearm(-0.27)}{forearm(0.27)}
      {hand(-0.27)}{hand(0.27)}
      {neck()}{head()}
    </>
  );

  // ── pieces ────────────────────────────────────────────────────────────────────

  const renderPiece = () => {
    const t = type.toLowerCase();

    if (t === "p") return (
      <group>
        {fullBody()}
        <mesh position={[0, 1.28, 0]}><boxGeometry args={[0.28, 0.07, 0.28]} /><DM {...m(cv.pri)} /></mesh>
        <mesh position={[0, 1.22, 0.1]}><boxGeometry args={[0.2, 0.13, 0.04]} /><DM {...m(cv.pri)} /></mesh>
        <mesh position={[0, 0.73, 0.12]}><boxGeometry args={[0.22, 0.24, 0.02]} /><DM {...m(cv.pri)} /></mesh>
        <mesh position={[0, 0.53, 0.12]}><boxGeometry args={[0.32, 0.07, 0.02]} /><DM {...m(cv.acc)} /></mesh>
        <mesh position={[-0.36, 0.65, 0.1]}><boxGeometry args={[0.04, 0.34, 0.28]} /><DM {...m(cv.acc)} /></mesh>
        <group ref={weaponRef}>
          <mesh position={[0.31, 0.82, 0]}><cylinderGeometry args={[0.025, 0.025, 0.65, 6]} /><DM {...m(cv.acc)} /></mesh>
          <mesh position={[0.31, 1.17, 0]}><boxGeometry args={[0.05, 0.15, 0.03]} /><DM {...m(cv.pri)} /></mesh>
        </group>
      </group>
    );

    if (t === "k") return (
      <group>
        {fullBody(0.42)}
        {royalBoot(-0.11)}{royalBoot(0.11)}
        {royalGreave(-0.11)}{royalGreave(0.11)}
        <mesh position={[0, 0.82, -0.14]}><boxGeometry args={[0.52, 0.22, 0.04]} /><DM {...m(cv.dark)} /></mesh>
        <mesh position={[0, 0.73, 0.12]}><boxGeometry args={[0.3, 0.3, 0.02]} /><DM {...m(cv.pri)} /></mesh>
        <mesh position={[0, 0.54, 0.12]}><boxGeometry args={[0.4, 0.07, 0.02]} /><DM {...m(cv.acc)} /></mesh>
        <mesh position={[-0.31, 0.88, 0]}><boxGeometry args={[0.1, 0.06, 0.22]} /><DM {...m(cv.pri)} /></mesh>
        <mesh position={[0.31, 0.88, 0]}><boxGeometry args={[0.1, 0.06, 0.22]} /><DM {...m(cv.pri)} /></mesh>
        <mesh position={[0, 1.27, 0]}><cylinderGeometry args={[0.155, 0.165, 0.09, 12]} /><DM {...m(cv.acc)} /></mesh>
        {[-0.11, 0, 0.11].map((x, i) => (
          <mesh key={i} position={[x, 1.38, 0]}><boxGeometry args={[0.055, 0.13, 0.055]} /><DM {...m(cv.acc)} /></mesh>
        ))}
        <mesh position={[0, 1.49, 0]}><boxGeometry args={[0.04, 0.11, 0.04]} /><DM {...m(cv.acc)} /></mesh>
        <mesh position={[0, 1.53, 0]}><boxGeometry args={[0.15, 0.04, 0.04]} /><DM {...m(cv.acc)} /></mesh>
        <group ref={weaponRef}>
          <mesh position={[0.31, 0.72, 0]}><cylinderGeometry args={[0.025, 0.025, 0.66, 6]} /><DM {...m(cv.acc)} /></mesh>
          <mesh position={[0.31, 1.08, 0]}><sphereGeometry args={[0.065, 8, 8]} /><DM {...m(cv.glow)} /></mesh>
        </group>
      </group>
    );

    if (t === "q") return (
      <group>
        {royalBoot(-0.1)}{royalBoot(0.1)}
        {leg(-0.1)}{leg(0.1)}
        <mesh position={[-0.1, 0.3, 0.09]}><boxGeometry args={[0.12, 0.3, 0.06]} /><DM {...m(cv.pri)} /></mesh>
        <mesh position={[0.1, 0.3, 0.09]}><boxGeometry args={[0.12, 0.3, 0.06]} /><DM {...m(cv.pri)} /></mesh>
        <mesh position={[0, 0.48, 0]}><boxGeometry args={[0.34, 0.1, 0.18]} /><DM {...m(cv.pri)} /></mesh>
        <mesh position={[0, 0.59, 0]}><cylinderGeometry args={[0.18, 0.31, 0.16, 12]} /><DM {...m(cv.sec)} /></mesh>
        <mesh position={[0, 0.78, 0]}><boxGeometry args={[0.36, 0.3, 0.22]} /><DM {...m(cv.sec)} /></mesh>
        <mesh position={[0, 0.72, 0.12]}><boxGeometry args={[0.14, 0.42, 0.02]} /><DM {...m(cv.acc)} /></mesh>
        {pauldron(-0.24)}{pauldron(0.24)}
        <group ref={leftArmRef}>
          <mesh position={[-0.25, 0.65, 0]}><boxGeometry args={[0.12, 0.28, 0.12]} /><DM {...m(cv.sec)} /></mesh>
          <mesh position={[-0.25, 0.48, 0]}><boxGeometry args={[0.11, 0.2, 0.11]} /><DM {...m(cv.sec)} /></mesh>
          {hand(-0.25)}
          <mesh position={[-0.25, 0.36, 0]}><sphereGeometry args={[0.075, 8, 8]} /><DM {...m(cv.glow)} /></mesh>
        </group>
        <group ref={rightArmRef}>
          <mesh position={[0.25, 0.65, 0]}><boxGeometry args={[0.12, 0.28, 0.12]} /><DM {...m(cv.sec)} /></mesh>
          <mesh position={[0.25, 0.48, 0]}><boxGeometry args={[0.11, 0.2, 0.11]} /><DM {...m(cv.sec)} /></mesh>
          {hand(0.25)}
        </group>
        {neck(0.97)}{head(1.13)}
        <mesh position={[0, 1.29, 0]}><cylinderGeometry args={[0.15, 0.16, 0.08, 12]} /><DM {...m(cv.acc)} /></mesh>
        {Array.from({ length: 7 }, (_, i) => i * (360 / 7)).map((deg) => (
          <mesh key={deg} position={[Math.cos(deg * Math.PI / 180) * 0.13, 1.41, Math.sin(deg * Math.PI / 180) * 0.13]}>
            <boxGeometry args={[0.04, 0.13, 0.04]} /><DM {...m(cv.acc)} />
          </mesh>
        ))}
      </group>
    );

    if (t === "b") return (
      <group>
        {foot(-0.09)}{foot(0.09)}
        {leg(-0.09)}{leg(0.09)}
        {hips()}
        <mesh position={[0, 0.68, 0]}><boxGeometry args={[0.34, 0.3, 0.22]} /><DM {...m(cv.sec)} /></mesh>
        <mesh position={[0, 0.68, 0.12]}><boxGeometry args={[0.06, 0.28, 0.02]} /><DM {...m(cv.acc)} /></mesh>
        <mesh position={[0, 0.73, 0.12]}><boxGeometry args={[0.16, 0.05, 0.02]} /><DM {...m(cv.acc)} /></mesh>
        {pauldron(-0.23)}{pauldron(0.23)}
        <group ref={leftArmRef}>
          <mesh position={[-0.25, 0.63, 0]}><boxGeometry args={[0.14, 0.3, 0.15]} /><DM {...m(cv.sec)} /></mesh>
          {hand(-0.25)}
        </group>
        <group ref={rightArmRef}>
          <mesh position={[0.25, 0.63, 0]}><boxGeometry args={[0.14, 0.3, 0.15]} /><DM {...m(cv.sec)} /></mesh>
          {hand(0.25)}
        </group>
        {neck(0.88)}{head(1.03)}
        <mesh position={[0, 1.18, 0]}><cylinderGeometry args={[0.12, 0.14, 0.09, 8]} /><DM {...m(cv.pri)} /></mesh>
        <mesh position={[0, 1.34, 0]}><cylinderGeometry args={[0.02, 0.12, 0.3, 8]} /><DM {...m(cv.pri)} /></mesh>
        <mesh position={[0, 1.22, 0]}><boxGeometry args={[0.04, 0.22, 0.04]} /><DM {...m(cv.acc)} /></mesh>
        <group ref={weaponRef}>
          <mesh position={[0.29, 0.61, 0]}><cylinderGeometry args={[0.025, 0.025, 0.8, 6]} /><DM {...m(cv.acc)} /></mesh>
          <mesh position={[0.37, 1.03, 0]}><boxGeometry args={[0.04, 0.16, 0.04]} /><DM {...m(cv.acc)} /></mesh>
          <mesh position={[0.29, 1.1, 0]}><boxGeometry args={[0.16, 0.04, 0.04]} /><DM {...m(cv.acc)} /></mesh>
        </group>
      </group>
    );

    if (t === "r") return (
      <group>
        <mesh position={[-0.12, 0.07, 0.03]}><boxGeometry args={[0.2, 0.12, 0.28]} /><DM {...m(cv.dark)} /></mesh>
        <mesh position={[0.12, 0.07, 0.03]}><boxGeometry args={[0.2, 0.12, 0.28]} /><DM {...m(cv.dark)} /></mesh>
        <mesh position={[-0.12, 0.31, 0]}><boxGeometry args={[0.2, 0.4, 0.2]} /><DM {...m(cv.sec)} /></mesh>
        <mesh position={[0.12, 0.31, 0]}><boxGeometry args={[0.2, 0.4, 0.2]} /><DM {...m(cv.sec)} /></mesh>
        <mesh position={[0, 0.54, 0]}><boxGeometry args={[0.5, 0.14, 0.28]} /><DM {...m(cv.pri)} /></mesh>
        <mesh position={[0, 0.79, 0]}><boxGeometry args={[0.52, 0.46, 0.3]} /><DM {...m(cv.sec)} /></mesh>
        <mesh position={[0, 0.8, 0.16]}><boxGeometry args={[0.36, 0.28, 0.02]} /><DM {...m(cv.pri)} /></mesh>
        <mesh position={[-0.32, 0.96, 0]}><boxGeometry args={[0.16, 0.12, 0.3]} /><DM {...m(cv.pri)} /></mesh>
        <mesh position={[0.32, 0.96, 0]}><boxGeometry args={[0.16, 0.12, 0.3]} /><DM {...m(cv.pri)} /></mesh>
        <mesh position={[-0.38, 0.73, 0]}><boxGeometry args={[0.18, 0.38, 0.18]} /><DM {...m(cv.sec)} /></mesh>
        <mesh position={[0.38, 0.73, 0]}><boxGeometry args={[0.18, 0.38, 0.18]} /><DM {...m(cv.sec)} /></mesh>
        <mesh position={[-0.38, 0.49, 0]}><boxGeometry args={[0.17, 0.26, 0.17]} /><DM {...m(cv.sec)} /></mesh>
        <mesh position={[0.38, 0.49, 0]}><boxGeometry args={[0.17, 0.26, 0.17]} /><DM {...m(cv.sec)} /></mesh>
        <mesh position={[-0.38, 0.33, 0]}><boxGeometry args={[0.2, 0.16, 0.2]} /><DM {...m(cv.acc)} /></mesh>
        <mesh position={[0.38, 0.33, 0]}><boxGeometry args={[0.2, 0.16, 0.2]} /><DM {...m(cv.acc)} /></mesh>
        <mesh position={[0, 1.04, 0]}><cylinderGeometry args={[0.11, 0.13, 0.1, 8]} /><DM {...m(cv.sec)} /></mesh>
        <mesh position={[0, 1.19, 0]}><boxGeometry args={[0.32, 0.28, 0.28]} /><DM {...m(cv.sec)} /></mesh>
        {[-0.11, 0, 0.11].map((x, i) => (
          <mesh key={i} position={[x, 1.37, 0]}><boxGeometry args={[0.07, 0.11, 0.28]} /><DM {...m(cv.pri)} /></mesh>
        ))}
      </group>
    );

    if (t === "n") return (
      <group>
        <mesh position={[0, 0.28, 0]}><boxGeometry args={[0.3, 0.36, 0.7]} /><DM {...m(cv.sec)} /></mesh>
        {([-0.1, 0.1] as number[]).flatMap(x =>
          ([-0.26, 0.26] as number[]).map((z) => (
            <group key={`${x}_${z}`}>
              <mesh position={[x, 0.13, z]}><boxGeometry args={[0.12, 0.26, 0.12]} /><DM {...m(cv.sec)} /></mesh>
              <mesh position={[x, 0.02, z + (z > 0 ? 0.04 : -0.04)]}><boxGeometry args={[0.12, 0.06, 0.2]} /><DM {...m(cv.dark)} /></mesh>
            </group>
          ))
        )}
        <mesh position={[0, 0.5, 0.34]} rotation={[0.55, 0, 0]}><boxGeometry args={[0.22, 0.36, 0.2]} /><DM {...m(cv.sec)} /></mesh>
        <mesh position={[0, 0.66, 0.55]}><boxGeometry args={[0.2, 0.22, 0.32]} /><DM {...m(cv.sec)} /></mesh>
        <mesh position={[-0.07, 0.79, 0.48]}><boxGeometry args={[0.05, 0.1, 0.05]} /><DM {...m(cv.pri)} /></mesh>
        <mesh position={[0.07, 0.79, 0.48]}><boxGeometry args={[0.05, 0.1, 0.05]} /><DM {...m(cv.pri)} /></mesh>
        <mesh position={[0, 0.58, 0.7]}><boxGeometry args={[0.14, 0.12, 0.14]} /><DM {...m(cv.sec)} /></mesh>
        <mesh position={[0, 0.49, -0.02]}><boxGeometry args={[0.36, 0.1, 0.32]} /><DM {...m(cv.acc)} /></mesh>
        <mesh position={[0, 0.72, -0.04]}><boxGeometry args={[0.34, 0.34, 0.22]} /><DM {...m(cv.pri)} /></mesh>
        <mesh position={[-0.24, 0.7, -0.02]}><boxGeometry args={[0.12, 0.28, 0.12]} /><DM {...m(cv.sec)} /></mesh>
        <mesh position={[0.24, 0.7, -0.02]}><boxGeometry args={[0.12, 0.28, 0.12]} /><DM {...m(cv.sec)} /></mesh>
        <mesh position={[-0.24, 0.5, -0.02]}><boxGeometry args={[0.11, 0.2, 0.11]} /><DM {...m(cv.sec)} /></mesh>
        <mesh position={[0.24, 0.5, -0.02]}><boxGeometry args={[0.11, 0.2, 0.11]} /><DM {...m(cv.sec)} /></mesh>
        <mesh position={[-0.24, 0.38, 0]}><boxGeometry args={[0.1, 0.1, 0.12]} /><DM {...m(cv.acc)} /></mesh>
        <mesh position={[0.24, 0.38, 0]}><boxGeometry args={[0.1, 0.1, 0.12]} /><DM {...m(cv.acc)} /></mesh>
        <mesh position={[0, 0.96, -0.04]}><cylinderGeometry args={[0.065, 0.075, 0.1, 8]} /><DM {...m(cv.sec)} /></mesh>
        <mesh position={[0, 1.11, -0.04]}><boxGeometry args={[0.24, 0.24, 0.22]} /><DM {...m(cv.sec)} /></mesh>
        <mesh position={[0, 1.25, -0.04]}><boxGeometry args={[0.28, 0.07, 0.28]} /><DM {...m(cv.pri)} /></mesh>
        <mesh position={[0, 1.18, 0.08]}><boxGeometry args={[0.18, 0.1, 0.04]} /><DM {...m(cv.acc)} /></mesh>
        <mesh position={[0.28, 0.64, 0.18]} rotation={[0.52, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.72, 6]} /><DM {...m(cv.acc)} />
        </mesh>
        <mesh position={[0.28, 0.98, 0.52]}><boxGeometry args={[0.05, 0.15, 0.04]} /><DM {...m(cv.pri)} /></mesh>
      </group>
    );
  };

  return (
    <group ref={groupRef}>
      <group ref={bodyRef}>{renderPiece()}</group>
    </group>
  );
});
