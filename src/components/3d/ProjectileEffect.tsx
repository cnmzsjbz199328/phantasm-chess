import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Side, Vec3 } from "../../shared/types";
import { SIDE_COLORS } from "../../shared/pieceColors";

export interface ProjectileEffectProps {
  from: Vec3;
  to: Vec3;
  pieceType: string;
  pieceColor: Side;
  onArrive: () => void;
}

function getConfig(pieceType: string) {
  const t = pieceType.toLowerCase();
  if (t === "b") return { speed: 10, coreR: 0.10, haloR: 0.24, lightI: 4, arcH: 0.5 };
  if (t === "r") return { speed: 14, coreR: 0.15, haloR: 0.30, lightI: 6, arcH: 0.0 };
  if (t === "q") return { speed: 9,  coreR: 0.18, haloR: 0.38, lightI: 9, arcH: 0.2 };
  return               { speed: 10, coreR: 0.10, haloR: 0.24, lightI: 4, arcH: 0.3 };
}

export function ProjectileEffect({ from, to, pieceType, pieceColor, onArrive }: ProjectileEffectProps) {
  const groupRef    = useRef<THREE.Group>(null);
  const lightRef    = useRef<THREE.PointLight>(null);
  const arrived     = useRef(false);
  const elapsed     = useRef(0);
  const onArriveRef = useRef(onArrive);
  onArriveRef.current = onArrive;

  // All THREE objects created once at mount via useRef — never recreated in useFrame
  const startVec   = useRef(new THREE.Vector3(from[0], from[1] + 0.5, from[2]));
  const endVec     = useRef(new THREE.Vector3(to[0],   to[1]   + 0.4, to[2]));
  const scratchVec = useRef(new THREE.Vector3());
  const cfg        = useRef(getConfig(pieceType));
  const duration   = useRef(startVec.current.distanceTo(endVec.current) / cfg.current.speed);

  const { glow, accent } = SIDE_COLORS[pieceColor];
  const coreColor = useRef(new THREE.Color(glow).multiplyScalar(6));
  const haloColor = useRef(new THREE.Color(accent).multiplyScalar(3));

  useFrame((_, dt) => {
    if (arrived.current || !groupRef.current) return;
    elapsed.current = Math.min(elapsed.current + dt, duration.current);
    const p = elapsed.current / duration.current;

    scratchVec.current.lerpVectors(startVec.current, endVec.current, p);
    scratchVec.current.y += Math.sin(p * Math.PI) * cfg.current.arcH;
    groupRef.current.position.copy(scratchVec.current);

    if (lightRef.current) {
      lightRef.current.intensity = cfg.current.lightI * (0.8 + Math.sin(elapsed.current * 22) * 0.2);
    }

    if (p >= 1) {
      arrived.current = true;
      onArriveRef.current();
    }
  });

  return (
    <group ref={groupRef} position={[from[0], from[1] + 0.5, from[2]]}>
      <mesh>
        <sphereGeometry args={[cfg.current.coreR, 8, 8]} />
        <meshBasicMaterial color={coreColor.current} toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[cfg.current.haloR, 8, 8]} />
        <meshBasicMaterial color={haloColor.current} transparent opacity={0.35} depthWrite={false} toneMapped={false} />
      </mesh>
      <pointLight ref={lightRef} color={glow} intensity={cfg.current.lightI} distance={6} decay={2} />
    </group>
  );
}
