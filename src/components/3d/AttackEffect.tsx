import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AttackEffectProps } from "../../shared/types";
import { SIDE_COLORS } from "../../shared/pieceColors";

// ── module-level geometry singletons (never disposed) ─────────────────────────

const BOARD_Y      = 0.01;
const STRIP_T      = 0.07;
const STRIP_INSET  = 0.5 - STRIP_T / 2;
const STRIP_GEO_H  = new THREE.PlaneGeometry(1, STRIP_T);
const STRIP_GEO_V  = new THREE.PlaneGeometry(STRIP_T, 1);
const STRIP_ROT: [number, number, number] = [-Math.PI / 2, 0, 0];
const SWEEP_GEO    = new THREE.PlaneGeometry(0.88, 0.28);
const FILL_GEO     = new THREE.PlaneGeometry(1, 1);

// ── SquareFill: full 1×1 plane that briefly floods the square with color ──────

interface SquareFillProps {
  color: string;
  dur?: number;
  delay?: number;
  brightness?: number;
}

function SquareFill({ color, dur = 0.3, delay = 0, brightness = 5 }: SquareFillProps) {
  const t           = useRef(-delay);
  const brightColor = useMemo(() => new THREE.Color(color).multiplyScalar(brightness), [color, brightness]);

  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({
      color:      brightColor,
      transparent: true,
      opacity:    0,
      depthWrite: false,
      side:       THREE.DoubleSide,
      blending:   THREE.AdditiveBlending,
      toneMapped: false,
    }),
    [brightColor],
  );
  useEffect(() => () => mat.dispose(), [mat]);

  useFrame((_, dt) => {
    t.current += dt;
    if (t.current <= 0) return;
    mat.opacity = Math.sin(Math.min(t.current / dur, 1) * Math.PI) * 0.8;
  });

  return <mesh geometry={FILL_GEO} material={mat} rotation={STRIP_ROT} position={[0, BOARD_Y, 0]} />;
}

// ── BorderFlash: 4-strip square border; size > 1 forms concentric rings ───────
// scale=[size, 1, size] expands only X/Z so BOARD_Y stays in world space.

interface BorderFlashProps {
  color: string;
  dur?: number;
  delay?: number;
  size?: number;
  brightness?: number;
}

function BorderFlash({ color, dur = 0.45, delay = 0, size = 1, brightness = 4 }: BorderFlashProps) {
  const t           = useRef(-delay);
  const brightColor = useMemo(() => new THREE.Color(color).multiplyScalar(brightness), [color, brightness]);

  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({
      color:      brightColor,
      transparent: true,
      opacity:    0,
      depthWrite: false,
      side:       THREE.DoubleSide,
      blending:   THREE.AdditiveBlending,
      toneMapped: false,
    }),
    [brightColor],
  );
  useEffect(() => () => mat.dispose(), [mat]);

  useFrame((_, dt) => {
    t.current += dt;
    if (t.current <= 0) return;
    mat.opacity = Math.sin(Math.min(t.current / dur, 1) * Math.PI) * 0.9;
  });

  return (
    <group scale={[size, 1, size]}>
      <mesh geometry={STRIP_GEO_H} material={mat} rotation={STRIP_ROT} position={[0,            BOARD_Y, -STRIP_INSET]} />
      <mesh geometry={STRIP_GEO_H} material={mat} rotation={STRIP_ROT} position={[0,            BOARD_Y,  STRIP_INSET]} />
      <mesh geometry={STRIP_GEO_V} material={mat} rotation={STRIP_ROT} position={[-STRIP_INSET, BOARD_Y,  0           ]} />
      <mesh geometry={STRIP_GEO_V} material={mat} rotation={STRIP_ROT} position={[ STRIP_INSET, BOARD_Y,  0           ]} />
    </group>
  );
}

// ── BishopRisingEffect: square border frame that rises up through the piece ───

interface BishopRisingProps {
  color: string;
  dur?: number;
}

function BishopRisingEffect({ color, dur = 0.65 }: BishopRisingProps) {
  const groupRef    = useRef<THREE.Group>(null);
  const t           = useRef(0);
  const brightColor = useMemo(() => new THREE.Color(color).multiplyScalar(4), [color]);

  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({
      color:      brightColor,
      transparent: true,
      opacity:    0,
      depthWrite: false,
      side:       THREE.DoubleSide,
      blending:   THREE.AdditiveBlending,
      toneMapped: false,
    }),
    [brightColor],
  );
  useEffect(() => () => mat.dispose(), [mat]);

  useFrame((_, dt) => {
    t.current += dt;
    if (!groupRef.current) return;
    const p = Math.min(t.current / dur, 1);
    groupRef.current.position.y = p * 2.2;
    mat.opacity = Math.sin(p * Math.PI) * 0.85;
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={STRIP_GEO_H} material={mat} rotation={STRIP_ROT} position={[0,            0, -STRIP_INSET]} />
      <mesh geometry={STRIP_GEO_H} material={mat} rotation={STRIP_ROT} position={[0,            0,  STRIP_INSET]} />
      <mesh geometry={STRIP_GEO_V} material={mat} rotation={STRIP_ROT} position={[-STRIP_INSET, 0,  0           ]} />
      <mesh geometry={STRIP_GEO_V} material={mat} rotation={STRIP_ROT} position={[ STRIP_INSET, 0,  0           ]} />
      <mesh geometry={SWEEP_GEO}   material={mat} rotation={STRIP_ROT} />
    </group>
  );
}

// ── per-piece compositions ────────────────────────────────────────────────────

function PawnEffect({ glow, acc }: { glow: string; acc: string }) {
  return (
    <>
      <SquareFill  color={acc}  dur={0.22} brightness={5} />
      <BorderFlash color={glow} dur={0.45} size={1} />
    </>
  );
}

function KnightEffect({ glow, acc }: { glow: string; acc: string }) {
  return (
    <>
      <SquareFill  color={glow} dur={0.28} brightness={7} />
      <SquareFill  color={acc}  dur={0.18} brightness={4} delay={0.08} />
      <BorderFlash color={glow} dur={0.50} size={1} />
      <BorderFlash color={acc}  dur={0.42} size={2} delay={0.10} />
    </>
  );
}

function BishopEffect({ glow, acc }: { glow: string; acc: string }) {
  return (
    <>
      <SquareFill        color={glow} dur={0.25} brightness={6} />
      <BishopRisingEffect color={acc} dur={0.65} />
      <BorderFlash       color={acc}  dur={0.55} size={1} />
    </>
  );
}

function RookEffect({ glow, acc }: { glow: string; acc: string }) {
  return (
    <>
      <SquareFill  color={glow} dur={0.30} brightness={8} />
      <BorderFlash color={glow} dur={0.55} size={1} delay={0}    brightness={6} />
      <BorderFlash color={acc}  dur={0.48} size={2} delay={0.08} brightness={4} />
      <BorderFlash color={glow} dur={0.40} size={3} delay={0.16} brightness={3} />
    </>
  );
}

function QueenEffect({ glow, acc }: { glow: string; acc: string }) {
  return (
    <>
      <SquareFill  color={glow} dur={0.35} brightness={10} />
      <BorderFlash color={glow} dur={0.60} size={1}   delay={0}    brightness={7} />
      <BorderFlash color={acc}  dur={0.52} size={1.8} delay={0.07} brightness={5} />
      <BorderFlash color={glow} dur={0.44} size={2.6} delay={0.14} brightness={4} />
      <BorderFlash color={acc}  dur={0.36} size={3.4} delay={0.21} brightness={3} />
    </>
  );
}

function KingEffect({ glow, acc }: { glow: string; acc: string }) {
  return (
    <>
      <SquareFill  color={acc}  dur={0.32} brightness={8} />
      <BorderFlash color={acc}  dur={0.55} size={1} />
      <BorderFlash color={glow} dur={0.45} size={2} delay={0.12} />
    </>
  );
}

const EFFECT_DURATION = 0.75;

// ── main export ───────────────────────────────────────────────────────────────

export function AttackEffect({ pieceType, pieceColor, position, onComplete }: AttackEffectProps) {
  const elapsed = useRef(0);
  const done    = useRef(false);

  useFrame((_, dt) => {
    elapsed.current += dt;
    if (!done.current && elapsed.current > EFFECT_DURATION) {
      done.current = true;
      onComplete();
    }
  });

  const { glow, accent: acc } = SIDE_COLORS[pieceColor];
  const t = pieceType.toLowerCase();

  return (
    <group position={position}>
      {t === "p" && <PawnEffect   glow={glow} acc={acc} />}
      {t === "n" && <KnightEffect glow={glow} acc={acc} />}
      {t === "b" && <BishopEffect glow={glow} acc={acc} />}
      {t === "r" && <RookEffect   glow={glow} acc={acc} />}
      {t === "q" && <QueenEffect  glow={glow} acc={acc} />}
      {t === "k" && <KingEffect   glow={glow} acc={acc} />}
    </group>
  );
}
