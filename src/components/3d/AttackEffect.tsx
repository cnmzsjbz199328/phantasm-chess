/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";

interface EffectProps {
  position: [number, number, number];
  color: string;
  accentColor: string;
  type: string;
}

export function AttackEffect({ position, color, accentColor, type }: EffectProps) {
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    // Auto-remove effect after duration
    const timeout = setTimeout(() => {
      if (groupRef.current) {
        groupRef.current.visible = false;
      }
    }, 1200);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <group ref={groupRef} position={position}>
      {type === 'p' && <PawnEffect color={color} accentColor={accentColor} />}
      {type === 'n' && <KnightEffect color={color} accentColor={accentColor} />}
      {type === 'b' && <BishopEffect color={color} accentColor={accentColor} />}
      {type === 'r' && <RookEffect color={color} accentColor={accentColor} />}
      {type === 'q' && <QueenEffect color={color} accentColor={accentColor} />}
      {type === 'k' && <KingEffect color={color} accentColor={accentColor} />}
    </group>
  );
}

function FlashSphere({ color, r = 0.22, dur = 0.25 }: { color: string, r?: number, dur?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useEffect(() => {
    if (!ref.current) return;
    gsap.to(ref.current.scale, { x: 3.5, y: 3.5, z: 3.5, duration: dur, ease: "power2.out" });
    gsap.to(ref.current.material, { opacity: 0, duration: dur, ease: "power2.out" });
  }, [dur]);
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[r, 16, 16]} />
      <meshBasicMaterial color={color} transparent />
    </mesh>
  );
}

function ExpandingRing({ color, y = 0, maxR = 2.0, speed = 3.0, delay = 0, thick = 0.05 }: any) {
  const ref = useRef<THREE.Mesh>(null);
  const dur = maxR / speed;
  useEffect(() => {
    if (!ref.current) return;
    ref.current.scale.set(0.01, 0.01, 0.01);
    gsap.to(ref.current.scale, { x: maxR, y: maxR, z: 1, duration: dur, delay, ease: "power1.out" });
    gsap.to(ref.current.material, { opacity: 0, duration: dur, delay, ease: "power1.out" });
  }, [dur, delay, maxR]);
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
      <ringGeometry args={[1 - thick, 1, 32]} />
      <meshBasicMaterial color={color} transparent />
    </mesh>
  );
}

function LightPillar({ color, h = 4.5, dur = 0.65 }: any) {
  const ref = useRef<THREE.Mesh>(null);
  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current.material, { opacity: 0 }, { opacity: 1, duration: dur / 2, yoyo: true, repeat: 1, ease: "sine.inOut" });
    gsap.to(ref.current.scale, { x: 1.2, z: 1.2, duration: dur, yoyo: true, repeat: 1, ease: "sine.inOut" });
  }, [dur]);
  return (
    <mesh ref={ref} position={[0, h / 2 - 1.4, 0]}>
      <cylinderGeometry args={[0.12, 0.35, h, 16]} />
      <meshBasicMaterial color={color} transparent />
    </mesh>
  );
}

function ParticleBurst({ color, count = 20, speed = 3, mode = 'sphere', grav = 4, dur = 1 }: any) {
  const pointsRef = useRef<THREE.Points>(null);
  const particles = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        let vx, vy, vz;
        if (mode === 'forward') {
            vx = (Math.random() - 0.5) * speed * 0.5;
            vy = (Math.random() - 0.5) * speed * 0.5;
            vz = Math.random() * speed;
        } else if (mode === 'radial') {
            const angle = Math.random() * Math.PI * 2;
            vx = Math.cos(angle) * speed;
            vy = Math.random() * 0.5 * speed;
            vz = Math.sin(angle) * speed;
        } else if (mode === 'up') {
            vx = (Math.random() - 0.5) * speed * 0.5;
            vy = Math.random() * speed;
            vz = (Math.random() - 0.5) * speed * 0.5;
        } else {
            const phi = Math.acos(2 * Math.random() - 1);
            const theta = 2 * Math.PI * Math.random();
            vx = Math.sin(phi) * Math.cos(theta) * speed;
            vy = Math.sin(phi) * Math.sin(theta) * speed;
            vz = Math.cos(phi) * speed;
        }
        vel[i * 3] = vx;
        vel[i * 3 + 1] = vy;
        vel[i * 3 + 2] = vz;
    }
    return { pos, vel };
  }, [count, speed, mode]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const posArr = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      particles.vel[i * 3 + 1] -= grav * delta;
      posArr[i * 3] += particles.vel[i * 3] * delta;
      posArr[i * 3 + 1] += particles.vel[i * 3 + 1] * delta;
      posArr[i * 3 + 2] += particles.vel[i * 3 + 2] * delta;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    (pointsRef.current.material as THREE.PointsMaterial).opacity -= delta / dur;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={particles.pos} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.05} transparent />
    </points>
  );
}

// Composition Components
const PawnEffect = ({ color, accentColor }: any) => (
  <>
    <FlashSphere color={color} r={0.22} dur={0.22} />
    <ParticleBurst color={accentColor} count={38} mode="forward" speed={3.2} grav={4.5} />
    <ParticleBurst color="#ffffff" count={14} mode="forward" speed={2.0} grav={3.0} />
  </>
);

const KnightEffect = ({ color, accentColor }: any) => (
  <>
    <FlashSphere color={color} r={0.22} />
    <ParticleBurst color={color} count={48} mode="radial" speed={3.8} grav={5.5} />
    <ExpandingRing color={color} y={-1.4} maxR={2.8} speed={4.2} />
    <ExpandingRing color={accentColor} y={-1.4} maxR={1.8} speed={3.2} delay={0.1} />
  </>
);

const BishopEffect = ({ color, accentColor }: any) => (
  <>
    <FlashSphere color={color} r={0.22} />
    <LightPillar color={accentColor} h={4.5} dur={0.65} />
    <ParticleBurst color={accentColor} count={30} mode="up" speed={2.0} grav={1.5} />
    <ExpandingRing color={accentColor} maxR={1.6} speed={2.8} />
  </>
);

const RookEffect = ({ color, accentColor }: any) => (
  <>
    <FlashSphere color={color} r={0.22} />
    <ExpandingRing color={color} y={-1.4} maxR={3.3} speed={4.8} delay={0} />
    <ExpandingRing color={accentColor} y={-1.4} maxR={2.2} speed={3.6} delay={0.1} />
    <ExpandingRing color={color} y={-1.4} maxR={1.2} speed={2.6} delay={0.22} />
    <ParticleBurst color={accentColor} count={34} mode="radial" speed={2.8} grav={6.5} />
  </>
);

const QueenEffect = ({ color, accentColor }: any) => (
  <>
    <FlashSphere color={color} r={0.22} />
    <ExpandingRing color={color} maxR={3.0} speed={3.5} delay={0} />
    <ExpandingRing color={accentColor} maxR={2.1} speed={2.8} delay={0.08} />
    <ExpandingRing color={color} maxR={1.3} speed={2.2} delay={0.16} />
    <ParticleBurst color={color} count={55} mode="sphere" speed={3.2} grav={0.8} />
    <FlashSphere color={color} r={0.5} />
  </>
);

const KingEffect = ({ color, accentColor }: any) => (
  <>
    <FlashSphere color={color} r={0.22} />
    <ExpandingRing color={accentColor} maxR={2.6} speed={3.2} delay={0} />
    <ExpandingRing color={color} maxR={1.7} speed={2.6} delay={0.12} />
    <ParticleBurst color={accentColor} count={44} mode="radial" speed={2.8} grav={3.5} />
    <FlashSphere color={accentColor} r={0.55} />
  </>
);
