import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AttackEffectProps } from "../../shared/types";
import { SIDE_COLORS } from "../../shared/pieceColors";

// ── primitives ────────────────────────────────────────────────────────────────

interface ExpandingRingProps {
  color: string;
  y?: number;
  delay?: number;
  maxR?: number;
  speed?: number;
  thick?: number;
}

function ExpandingRing({ color, y = 0, delay = 0, maxR = 2, speed = 3, thick = 0.045 }: ExpandingRingProps) {
  const ref = useRef<THREE.Mesh>(null);
  const t = useRef(-delay);
  useFrame((_, dt) => {
    t.current += dt;
    if (t.current <= 0 || !ref.current) return;
    const r = Math.min(t.current * speed, maxR);
    ref.current.scale.setScalar(r);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - r / maxR);
  });
  return (
    <mesh ref={ref} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.001}>
      <ringGeometry args={[1, 1 + thick, 48]} />
      <meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

interface FlashSphereProps {
  color: string;
  r?: number;
  dur?: number;
}

function FlashSphere({ color, r = 0.3, dur = 0.28 }: FlashSphereProps) {
  const ref = useRef<THREE.Mesh>(null);
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt;
    if (!ref.current) return;
    const p = t.current / dur;
    (ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - p);
    ref.current.scale.setScalar(1 + p * 2.5);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[r, 10, 10]} />
      <meshBasicMaterial color={color} transparent opacity={1} depthWrite={false} />
    </mesh>
  );
}

interface LightPillarProps {
  color: string;
  h?: number;
  dur?: number;
}

function LightPillar({ color, h = 4, dur = 0.6 }: LightPillarProps) {
  const ref = useRef<THREE.Mesh>(null);
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt;
    if (!ref.current) return;
    const p = t.current / dur;
    (ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, Math.sin(p * Math.PI) * 0.8);
    const s = 0.5 + Math.sin(p * Math.PI) * 1.1;
    ref.current.scale.x = s;
    ref.current.scale.z = s;
  });
  return (
    <mesh ref={ref} position={[0, h / 2, 0]}>
      <cylinderGeometry args={[0.12, 0.35, h, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

type BurstMode = "sphere" | "forward" | "radial" | "up";

interface ParticleBurstProps {
  color: string;
  count?: number;
  speed?: number;
  mode?: BurstMode;
  dur?: number;
  size?: number;
  grav?: number;
}

function ParticleBurst({ color, count = 30, speed = 2.5, mode = "sphere", dur = 0.7, size = 0.07, grav = 3 }: ParticleBurstProps) {
  const { geo, vel } = useMemo(() => {
    const positions = new Float32Array(count * 3).fill(0);
    const velocities = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      if (mode === "sphere") {
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        const r = speed * (0.5 + Math.random() * 0.5);
        velocities[i * 3]     = Math.sin(ph) * Math.cos(th) * r;
        velocities[i * 3 + 1] = Math.cos(ph) * r;
        velocities[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * r;
      } else if (mode === "forward") {
        velocities[i * 3]     = (Math.random() - 0.5) * speed * 0.45;
        velocities[i * 3 + 1] = (Math.random() - 0.1) * speed * 0.25;
        velocities[i * 3 + 2] = (Math.random() * 0.6 + 0.4) * speed;
      } else if (mode === "radial") {
        const a = Math.random() * Math.PI * 2;
        const r = speed * (0.4 + Math.random() * 0.6);
        velocities[i * 3]     = Math.cos(a) * r;
        velocities[i * 3 + 1] = Math.random() * speed * 0.35;
        velocities[i * 3 + 2] = Math.sin(a) * r;
      } else {
        const a = Math.random() * Math.PI * 2;
        velocities[i * 3]     = Math.cos(a) * speed * 0.4;
        velocities[i * 3 + 1] = speed * (0.6 + Math.random() * 0.4);
        velocities[i * 3 + 2] = Math.sin(a) * speed * 0.4;
      }
    }
    const geometry = new THREE.BufferGeometry();
    const attr = new THREE.BufferAttribute(positions, 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute("position", attr);
    return { geo: geometry, vel: velocities };
  }, [count, speed, mode]);

  useEffect(() => () => geo.dispose(), [geo]);

  const ref = useRef<THREE.Points>(null);
  const t = useRef(0);

  useFrame((_, dt) => {
    t.current += dt;
    if (!ref.current) return;
    const arr = geo.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3]     += vel[i * 3]     * dt;
      arr[i * 3 + 1] += vel[i * 3 + 1] * dt - grav * dt * t.current;
      arr[i * 3 + 2] += vel[i * 3 + 2] * dt;
    }
    geo.attributes.position.needsUpdate = true;
    (ref.current.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - t.current / dur);
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={size} color={color} transparent opacity={1} sizeAttenuation depthWrite={false} />
    </points>
  );
}

// ── per-piece compositions ────────────────────────────────────────────────────

function PawnEffect({ glow, acc }: { glow: string; acc: string }) {
  return (
    <>
      <FlashSphere color={glow} r={0.22} dur={0.22} />
      <ParticleBurst color={acc}     count={38} speed={3.2} mode="forward" dur={0.65} size={0.065} grav={4.5} />
      <ParticleBurst color="#ffffff" count={14} speed={2.0} mode="forward" dur={0.38} size={0.04}  grav={3.0} />
      <FlashSphere   color={acc}     r={0.14}   dur={0.18} />
    </>
  );
}

function KnightEffect({ glow, acc }: { glow: string; acc: string }) {
  return (
    <>
      <FlashSphere   color={glow} r={0.22} />
      <ParticleBurst color={glow} count={48} speed={3.8} mode="radial" dur={0.72} size={0.08} grav={5.5} />
      <ExpandingRing color={glow} y={-1.4} maxR={2.8} speed={4.2} delay={0}   thick={0.06} />
      <ExpandingRing color={acc}  y={-1.4} maxR={1.8} speed={3.2} delay={0.1} thick={0.04} />
      <FlashSphere   color={acc}  r={0.32} dur={0.25} />
    </>
  );
}

function BishopEffect({ glow, acc }: { glow: string; acc: string }) {
  return (
    <>
      <FlashSphere   color={glow} r={0.22} />
      <LightPillar   color={acc}  h={4.5}  dur={0.65} />
      <ParticleBurst color={acc}  count={30} speed={2.0} mode="up" dur={0.85} size={0.07} grav={1.5} />
      <ExpandingRing color={acc}  maxR={1.6} speed={2.8} thick={0.035} />
      <FlashSphere   color="#fff" r={0.28}   dur={0.22} />
    </>
  );
}

function RookEffect({ glow, acc }: { glow: string; acc: string }) {
  return (
    <>
      <FlashSphere   color={glow} r={0.22} />
      <ExpandingRing color={glow} y={-1.4} maxR={3.3} speed={4.8} delay={0}    thick={0.07} />
      <ExpandingRing color={acc}  y={-1.4} maxR={2.2} speed={3.6} delay={0.1}  thick={0.05} />
      <ExpandingRing color={glow} y={-1.4} maxR={1.2} speed={2.6} delay={0.22} thick={0.04} />
      <ParticleBurst color={acc}  count={34} speed={2.8} mode="radial" dur={0.65} size={0.1} grav={6.5} />
      <FlashSphere   color="#fff" r={0.42}   dur={0.2} />
    </>
  );
}

function QueenEffect({ glow, acc }: { glow: string; acc: string }) {
  return (
    <>
      <FlashSphere   color={glow} r={0.22} />
      <ExpandingRing color={glow} maxR={3.0} speed={3.5} delay={0}    thick={0.05} />
      <ExpandingRing color={acc}  maxR={2.1} speed={2.8} delay={0.08} thick={0.04} />
      <ExpandingRing color={glow} maxR={1.3} speed={2.2} delay={0.16} thick={0.035} />
      <ParticleBurst color={glow} count={55} speed={3.2} mode="sphere" dur={0.9} size={0.07} grav={0.8} />
      <FlashSphere   color={glow} r={0.5}    dur={0.32} />
    </>
  );
}

function KingEffect({ glow, acc }: { glow: string; acc: string }) {
  return (
    <>
      <FlashSphere   color={glow} r={0.22} />
      <ExpandingRing color={acc}  maxR={2.6} speed={3.2} delay={0}    thick={0.055} />
      <ExpandingRing color={glow} maxR={1.7} speed={2.6} delay={0.12} thick={0.04} />
      <ParticleBurst color={acc}  count={44} speed={2.8} mode="radial" dur={0.78} size={0.09} grav={3.5} />
      <FlashSphere   color={acc}  r={0.55}   dur={0.38} />
    </>
  );
}

const EFFECT_DURATION = 1.15;

// ── main export ───────────────────────────────────────────────────────────────

export function AttackEffect({ pieceType, pieceColor, position, onComplete }: AttackEffectProps) {
  const elapsed = useRef(0);
  const done = useRef(false);

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
