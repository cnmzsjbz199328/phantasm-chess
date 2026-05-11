/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import "./Shaders";

interface PieceModelProps {
  type: string;
  color: "w" | "b";
  dissolve?: number;
}

export function VoxelPieceModel({ type, color, dissolve = 0 }: PieceModelProps) {
  const meshRef = useRef<THREE.Group>(null);
  
  // Base Side Colors
  const sideColors = color === "w" ? {
    primary: "#00d2ff",   // Cyan
    secondary: "#e0f2fe", // Silver/Light Blue
    accent: "#ffcc00",    // Gold
    glow: "#00f2ff"
  } : {
    primary: "#ff0055",   // Crimson
    secondary: "#1a1a1a", // Obsidian
    accent: "#8e2de2",    // Purple
    glow: "#ff0055"
  };

  const DissolveMat = "dissolveMaterial" as any;

  // Helper to create material props with specific color
  const getMat = (hex: string) => ({
    uBaseColor: new THREE.Color(hex),
    uColor: new THREE.Color(sideColors.glow),
    transparent: true,
  });

  const renderPiece = () => {
    const t = type.toLowerCase();
    const p = sideColors.primary;
    const s = sideColors.secondary;
    const a = sideColors.accent;

    if (t === 'k') { // THE MONARCH (KING)
      return (
        <group>
          <mesh position={[0, 0.15, 0]}><boxGeometry args={[0.5, 0.3, 0.3]} /><DissolveMat {...getMat(s)} /></mesh>
          <mesh position={[0, 0.5, 0]}><boxGeometry args={[0.45, 0.4, 0.25]} /><DissolveMat {...getMat(p)} /></mesh>
          <mesh position={[0, 0.6, -0.15]}><boxGeometry args={[0.55, 0.5, 0.05]} /><DissolveMat {...getMat(color === 'w' ? '#334155' : '#450a0a')} /></mesh>
          <mesh position={[0.25, 0.65, 0]}><boxGeometry args={[0.15, 0.1, 0.3]} /><DissolveMat {...getMat(a)} /></mesh>
          <mesh position={[-0.25, 0.65, 0]}><boxGeometry args={[0.15, 0.1, 0.3]} /><DissolveMat {...getMat(a)} /></mesh>
          <mesh position={[0, 0.85, 0]}><cylinderGeometry args={[0.15, 0.15, 0.22, 12]} /><DissolveMat {...getMat("#fde047")} /></mesh>
          <mesh position={[0, 1.0, 0]}><cylinderGeometry args={[0.25, 0.2, 0.1, 16]} /><DissolveMat {...getMat(a)} /></mesh>
          <mesh position={[0, 1.15, 0]}><boxGeometry args={[0.06, 0.3, 0.06]} /><DissolveMat {...getMat(a)} /></mesh>
          <mesh position={[0, 1.25, 0]}><boxGeometry args={[0.2, 0.06, 0.06]} /><DissolveMat {...getMat(a)} /></mesh>
        </group>
      );
    }

    if (t === 'q') { // THE SOVEREIGN (QUEEN)
      return (
        <group>
          <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.25, 0.45, 0.5, 16]} /><DissolveMat {...getMat(p)} /></mesh>
          <mesh position={[0, 0.65, 0]}><boxGeometry args={[0.35, 0.35, 0.2]} /><DissolveMat {...getMat(s)} /></mesh>
          <mesh position={[0, 0.95, 0]}><cylinderGeometry args={[0.14, 0.14, 0.2, 12]} /><DissolveMat {...getMat("#fde047")} /></mesh>
          <mesh position={[0, 1.1, 0]}><cylinderGeometry args={[0.28, 0.2, 0.15, 16]} /><DissolveMat {...getMat(a)} /></mesh>
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <mesh key={deg} position={[Math.cos(deg * Math.PI / 180) * 0.22, 1.25, Math.sin(deg * Math.PI / 180) * 0.22]} rotation={[0, -deg * Math.PI / 180, 0.2]}>
              <boxGeometry args={[0.06, 0.25, 0.04]} /><DissolveMat {...getMat(a)} />
            </mesh>
          ))}
          <mesh position={[0, 1.4, 0]}><sphereGeometry args={[0.05, 8, 8]} /><DissolveMat {...getMat(sideColors.glow)} /></mesh>
        </group>
      );
    }

    if (t === 'n') { // THE HARBINGER (KNIGHT)
      const horseRotate = color === 'w' ? Math.PI : 0;
      return (
        <group rotation={[0, horseRotate, 0]}>
          <mesh position={[0, 0.15, 0]}><boxGeometry args={[0.1, 0.3, 0.1]} /><DissolveMat {...getMat(s)} /></mesh>
          <mesh position={[0.15, 0.15, 0.1]}><boxGeometry args={[0.1, 0.3, 0.1]} /><DissolveMat {...getMat(s)} /></mesh>
          <mesh position={[-0.15, 0.15, 0.1]}><boxGeometry args={[0.1, 0.3, 0.1]} /><DissolveMat {...getMat(s)} /></mesh>
          <mesh position={[0, 0.45, 0]}><boxGeometry args={[0.4, 0.35, 0.7]} /><DissolveMat {...getMat(p)} /></mesh>
          <mesh position={[0, 0.75, 0.3]} rotation={[-0.4, 0, 0]}><boxGeometry args={[0.25, 0.5, 0.25]} /><DissolveMat {...getMat(p)} /></mesh>
          <mesh position={[0, 1.05, 0.45]} rotation={[0.1, 0, 0]}><boxGeometry args={[0.28, 0.3, 0.5]} /><DissolveMat {...getMat(s)} /></mesh>
          <mesh position={[0, 1.0, 0.7]}><boxGeometry args={[0.2, 0.2, 0.15]} /><DissolveMat {...getMat(a)} /></mesh>
        </group>
      );
    }

    if (t === 'b') { // THE CLERIC (BISHOP)
      return (
        <group>
          <mesh position={[0, 0.35, 0]}><cylinderGeometry args={[0.15, 0.3, 0.7, 12]} /><DissolveMat {...getMat(p)} /></mesh>
          <mesh position={[0, 0.5, 0]}><boxGeometry args={[0.4, 0.5, 0.22]} /><DissolveMat {...getMat(s)} /></mesh>
          <mesh position={[0, 0.85, 0]}><cylinderGeometry args={[0.14, 0.14, 0.2, 12]} /><DissolveMat {...getMat("#fde047")} /></mesh>
          <group position={[0, 1.15, 0]}>
            <mesh position={[0, 0, 0.06]} rotation={[-0.2, 0, 0]}><boxGeometry args={[0.22, 0.45, 0.04]} /><DissolveMat {...getMat(a)} /></mesh>
            <mesh position={[0, 0, -0.06]} rotation={[0.2, 0, 0]}><boxGeometry args={[0.22, 0.45, 0.04]} /><DissolveMat {...getMat(a)} /></mesh>
            <mesh position={[0, 0.3, 0]}><sphereGeometry args={[0.06, 8, 8]} /><DissolveMat {...getMat(sideColors.glow)} /></mesh>
          </group>
        </group>
      );
    }

    if (t === 'r') { // THE BASTION (ROOK)
      return (
        <group>
          <mesh position={[0, 0.05, 0]}><boxGeometry args={[0.75, 0.1, 0.75]} /><DissolveMat {...getMat(a)} /></mesh>
          <mesh position={[0, 0.45, 0]}><boxGeometry args={[0.6, 0.7, 0.6]} /><DissolveMat {...getMat(color === 'w' ? '#94a3b8' : '#334155')} /></mesh>
          <mesh position={[0, 0.8, 0]}><boxGeometry args={[0.7, 0.1, 0.7]} /><DissolveMat {...getMat(p)} /></mesh>
          {[[-0.25, 0.95, -0.25], [0.25, 0.95, -0.25], [-0.25, 0.95, 0.25], [0.25, 0.95, 0.25]].map((pos, i) => (
            <mesh key={i} position={pos as any}><boxGeometry args={[0.15, 0.2, 0.15]} /><DissolveMat {...getMat(a)} /></mesh>
          ))}
        </group>
      );
    }

    if (t === 'p') { // THE INFANTRY (PAWN)
      return (
        <group>
          <mesh position={[0.15, 0.05, 0]}><boxGeometry args={[0.2, 0.1, 0.2]} /><DissolveMat {...getMat(s)} /></mesh>
          <mesh position={[-0.15, 0.05, 0]}><boxGeometry args={[0.2, 0.1, 0.2]} /><DissolveMat {...getMat(s)} /></mesh>
          <mesh position={[0, 0.3, 0]}><boxGeometry args={[0.4, 0.4, 0.25]} /><DissolveMat {...getMat(p)} /></mesh>
          <mesh position={[0, 0.6, 0]}><cylinderGeometry args={[0.14, 0.14, 0.2, 12]} /><DissolveMat {...getMat("#fde047")} /></mesh>
          <mesh position={[0, 0.75, 0]}><cylinderGeometry args={[0.2, 0.22, 0.1, 16]} /><DissolveMat {...getMat(a)} /></mesh>
          <mesh position={[0.28, 0.3, 0.1]} rotation={[0, 0.2, 0]}><boxGeometry args={[0.2, 0.35, 0.05]} /><DissolveMat {...getMat(a)} /></mesh>
        </group>
      );
    }
  };

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.traverse((child: any) => {
        if (child.material && child.material.type === 'ShaderMaterial') {
          child.material.uniforms.uTime.value = state.clock.getElapsedTime();
          child.material.uniforms.uDissolve.value = dissolve;
        }
      });
    }
  });

  return (
    <group ref={meshRef}>
      {renderPiece()}
    </group>
  );
}
