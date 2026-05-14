import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { Sparkles } from "@react-three/drei";
import type { Vec3 } from "../../shared/types";

// ── geometry helpers ──────────────────────────────────────────────────────────

function makeHexagram(r: number): THREE.BufferGeometry {
  const verts: number[] = [];
  for (let tri = 0; tri < 2; tri++) {
    for (let i = 0; i < 3; i++) {
      const a1 = ((tri * 60 + i * 120) * Math.PI) / 180;
      const a2 = ((tri * 60 + (i + 1) * 120) * Math.PI) / 180;
      verts.push(Math.cos(a1) * r, Math.sin(a1) * r, 0);
      verts.push(Math.cos(a2) * r, Math.sin(a2) * r, 0);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  return geo;
}

function makeTicks(outerR: number, innerR: number, count: number): THREE.BufferGeometry {
  const verts: number[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    verts.push(Math.cos(a) * innerR, Math.sin(a) * innerR, 0);
    verts.push(Math.cos(a) * outerR, Math.sin(a) * outerR, 0);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  return geo;
}

// ── module-level singletons ───────────────────────────────────────────────────
// Geometries are shared across all MagicCircle and DormantCircle instances.
// They are never disposed — they live for the entire app lifetime.

const SHARED_GEOS = {
  outerRing: new THREE.RingGeometry(0.43, 0.50, 64),
  midRing:   new THREE.RingGeometry(0.30, 0.36, 56),
  innerRing: new THREE.RingGeometry(0.16, 0.21, 40),
  hexagram:  makeHexagram(0.38),
  ticks:     makeTicks(0.47, 0.42, 8),
  core:      new THREE.CircleGeometry(0.09, 32),
};

// Dormant materials are also singletons – all idle circles of the same side share one material.
const DORMANT_MATS = {
  w: {
    ring: new THREE.MeshBasicMaterial({ color: "#2a1500", transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }),
    line: new THREE.LineBasicMaterial({ color: "#3d2000", transparent: true, opacity: 0.13 }),
  },
  b: {
    ring: new THREE.MeshBasicMaterial({ color: "#080820", transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }),
    line: new THREE.LineBasicMaterial({ color: "#0d0d33", transparent: true, opacity: 0.13 }),
  },
};

// ── palette ───────────────────────────────────────────────────────────────────

const PALETTE = {
  w: {
    dormantEmissive: "#1a0e00",
    activeEmissive:  "#ff8800",
    lineColor:       "#c8922a",
    lightColor:      "#ff9922" as THREE.ColorRepresentation,
    sparkleColor:    "#ffcc66",
  },
  b: {
    dormantEmissive: "#080820",
    activeEmissive:  "#3355ff",
    lineColor:       "#5577ee",
    lightColor:      "#4455ff" as THREE.ColorRepresentation,
    sparkleColor:    "#99aaff",
  },
};

// ── DormantCircle – always-visible carved runes at each bench slot ────────────

export function DormantCircle({ position, side }: { position: Vec3; side: "w" | "b" }) {
  return (
    <group position={position}>
      <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <mesh geometry={SHARED_GEOS.outerRing} material={DORMANT_MATS[side].ring} />
        <lineSegments geometry={SHARED_GEOS.hexagram} material={DORMANT_MATS[side].line} />
        <mesh geometry={SHARED_GEOS.innerRing} material={DORMANT_MATS[side].ring} />
      </group>
    </group>
  );
}

// ── MagicCircle – activating circle rendered on top when a piece is benched ──

interface MagicCircleProps {
  position: Vec3;
  side: "w" | "b";
  onReady: () => void;
  dimming?: boolean;
}

export function MagicCircle({ position, side, onReady, dimming }: MagicCircleProps) {
  const outerRingRef = useRef<THREE.Mesh>(null);
  const midRingRef   = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const lightRef     = useRef<THREE.PointLight>(null);
  const [showSparkles, setShowSparkles] = useState(false);
  const rotSpeed = useRef({ outer: 0, mid: 0, inner: 0 });
  const palette  = PALETTE[side];

  // Per-instance materials only (geometries are shared singletons above)
  const mats = useMemo(() => {
    const de = new THREE.Color(palette.dormantEmissive);
    const ringMat = (opacity: number) =>
      new THREE.MeshStandardMaterial({
        color: "#080808",
        emissive: de.clone(),
        emissiveIntensity: 0.5,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
    return {
      outer: ringMat(0.75),
      mid:   ringMat(0.65),
      inner: ringMat(0.55),
      core:  new THREE.MeshStandardMaterial({
        color: "#080808",
        emissive: de.clone(),
        emissiveIntensity: 0.7,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      hex:   new THREE.LineBasicMaterial({
        color: new THREE.Color(palette.dormantEmissive).multiplyScalar(4),
        transparent: true,
        opacity: 0.3,
      }),
      ticks: new THREE.LineBasicMaterial({
        color: new THREE.Color(palette.dormantEmissive).multiplyScalar(3),
        transparent: true,
        opacity: 0.2,
      }),
    };
  }, [side]);

  useEffect(() => () => {
    Object.values(mats).forEach(m => (m as THREE.Material).dispose());
  }, [mats]);

  // Activation animation on mount
  useEffect(() => {
    const ae = new THREE.Color(palette.activeEmissive);
    const lc = new THREE.Color(palette.lineColor);

    mats.outer.emissive.copy(ae);
    mats.mid.emissive.copy(ae);
    mats.inner.emissive.copy(ae);
    mats.core.emissive.copy(ae);
    mats.hex.color.copy(lc);
    mats.ticks.color.copy(lc);

    const lightProxy = { intensity: 0 };
    const tl = gsap.timeline({
      onComplete: () => { setShowSparkles(true); onReady(); },
    });

    tl.to([mats.outer, mats.mid], { emissiveIntensity: 2.8, duration: 0.9, ease: "power2.in" }, 0);
    tl.to(mats.inner,             { emissiveIntensity: 3.2, duration: 0.9, ease: "power2.in" }, 0.05);
    tl.to(mats.core,              { emissiveIntensity: 5.5, opacity: 0.9, duration: 0.7, ease: "power2.in" }, 0.15);
    tl.to([mats.hex, mats.ticks], { opacity: 0.85, duration: 0.7, ease: "power2.in" }, 0);
    tl.to(rotSpeed.current, { outer: 0.75, mid: -0.55, inner: 1.05, duration: 1.1, ease: "power2.in" }, 0.2);
    tl.to(lightProxy, {
      intensity: 4.5,
      duration: 1.2,
      ease: "power2.in",
      onUpdate: () => { if (lightRef.current) lightRef.current.intensity = lightProxy.intensity; },
    }, 0.3);
    tl.to([mats.outer, mats.mid, mats.inner, mats.core], { emissiveIntensity: 8.0, duration: 0.3, ease: "power3.out" }, 1.1);

    return () => { tl.kill(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dimming animation
  useEffect(() => {
    if (!dimming) return;
    const lightProxy = { intensity: lightRef.current?.intensity ?? 0 };
    const tl = gsap.timeline();
    tl.to(rotSpeed.current, { outer: 0, mid: 0, inner: 0, duration: 1.4, ease: "power2.in" }, 0);
    tl.to([mats.outer, mats.mid, mats.inner, mats.core], { emissiveIntensity: 0.4, opacity: 0.12, duration: 1.2, ease: "power2.out" }, 0);
    tl.to([mats.hex, mats.ticks], { opacity: 0.06, duration: 1.0, ease: "power2.out" }, 0);
    tl.to(lightProxy, {
      intensity: 0,
      duration: 1.0,
      ease: "power2.out",
      onUpdate: () => { if (lightRef.current) lightRef.current.intensity = lightProxy.intensity; },
    }, 0);
    tl.call(() => setShowSparkles(false), [], 0.3);
    return () => { tl.kill(); };
  }, [dimming, mats]);

  useFrame((_, delta) => {
    if (outerRingRef.current) outerRingRef.current.rotation.z += rotSpeed.current.outer * delta;
    if (midRingRef.current)   midRingRef.current.rotation.z   += rotSpeed.current.mid   * delta;
    if (innerRingRef.current) innerRingRef.current.rotation.z += rotSpeed.current.inner * delta;
  });

  return (
    <group position={position}>
      {/* Flat geometry – inside this rotated group, local Z = world Y, so rotation.z spins rings in place */}
      <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <mesh ref={outerRingRef} geometry={SHARED_GEOS.outerRing} material={mats.outer} />
        <lineSegments              geometry={SHARED_GEOS.ticks}    material={mats.ticks} />
        <mesh ref={midRingRef}   geometry={SHARED_GEOS.midRing}   material={mats.mid}   />
        <lineSegments              geometry={SHARED_GEOS.hexagram} material={mats.hex}   />
        <mesh ref={innerRingRef} geometry={SHARED_GEOS.innerRing} material={mats.inner} />
        <mesh                    geometry={SHARED_GEOS.core}      material={mats.core}  />
      </group>

      <pointLight ref={lightRef} color={palette.lightColor} intensity={0} distance={3.5} position={[0, 0.7, 0]} />

      {showSparkles && (
        <Sparkles
          count={18}
          scale={[1.1, 0.9, 1.1]}
          size={2.2}
          speed={0.3}
          color={palette.sparkleColor}
          opacity={0.75}
          position={[0, 0.25, 0]}
        />
      )}
    </group>
  );
}
