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
  
  // Base Side Colors from Design Spec
  const sideColors = color === "w" ? {
    primary: "#00d2ff",   // Cyber Cyan
    secondary: "#c8d8e8", // Silver/Light Blue (Suit)
    accent: "#ffcc00",    // Gold (Weapon/Crown)
    dark: "#0a2540",      // Navy (Boots/Cape Back)
    glow: "#00f2ff"
  } : {
    primary: "#ff0055",   // Crimson
    secondary: "#2a1a2e", // Obsidian/Deep Purple
    accent: "#8e2de2",    // Purple (Weapon/Crown)
    dark: "#1a0510",      // Deepest Black
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
    const d = sideColors.dark;
    const gl = sideColors.glow;

    // Y Constants from spec (approximate for box/cylinder placement)
    // Feet: 0.06, Torso: 0.71, Head: 1.11, Crown/Top: 1.55

    if (t === 'k') { // THE MONARCH (KING)
      return (
        <group>
          {/* Feet & Legs */}
          <mesh position={[0.09, 0.15, 0]}><boxGeometry args={[0.18, 0.3, 0.18]} /><DissolveMat {...getMat(d)} /></mesh>
          <mesh position={[-0.09, 0.15, 0]}><boxGeometry args={[0.18, 0.3, 0.18]} /><DissolveMat {...getMat(d)} /></mesh>
          {/* Torso & Armor */}
          <mesh position={[0, 0.7, 0]}><boxGeometry args={[0.42, 0.45, 0.3]} /><DissolveMat {...getMat(s)} /></mesh>
          <mesh position={[0, 0.75, 0.05]}><boxGeometry args={[0.3, 0.3, 0.05]} /><DissolveMat {...getMat(p)} /></mesh> {/* Breastplate */}
          {/* Cape */}
          <mesh position={[0, 0.65, -0.18]}><boxGeometry args={[0.54, 0.7, 0.06]} /><DissolveMat {...getMat(d)} /></mesh>
          {/* Shoulders */}
          <mesh position={[0.27, 0.85, 0]}><boxGeometry args={[0.2, 0.15, 0.25]} /><DissolveMat {...getMat(p)} /></mesh>
          <mesh position={[-0.27, 0.85, 0]}><boxGeometry args={[0.2, 0.15, 0.25]} /><DissolveMat {...getMat(p)} /></mesh>
          {/* Head & Crown */}
          <mesh position={[0, 1.1, 0]}><boxGeometry args={[0.2, 0.2, 0.2]} /><DissolveMat {...getMat(s)} /></mesh>
          <mesh position={[0, 1.3, 0]}><cylinderGeometry args={[0.16, 0.16, 0.1, 16]} /><DissolveMat {...getMat(a)} /></mesh>
          <mesh position={[0, 1.45, 0]}><boxGeometry args={[0.1, 0.3, 0.04]} /><DissolveMat {...getMat(a)} /></mesh> 
          <mesh position={[0, 1.45, 0]} rotation={[0, 0, Math.PI/2]}><boxGeometry args={[0.1, 0.2, 0.04]} /><DissolveMat {...getMat(a)} /></mesh> {/* Cross */}
          {/* Scepter */}
          <group position={[0.35, 0.5, 0.2]}>
            <mesh><cylinderGeometry args={[0.02, 0.02, 0.8, 8]} /><DissolveMat {...getMat(a)} /></mesh>
            <mesh position={[0, 0.45, 0]}><sphereGeometry args={[0.08, 12, 12]} /><DissolveMat {...getMat(gl)} /></mesh>
          </group>
        </group>
      );
    }

    if (t === 'q') { // THE SOVEREIGN (QUEEN)
      return (
        <group>
          {/* Flowing Gown (Conical) */}
          <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.18, 0.44, 0.6, 16]} /><DissolveMat {...getMat(p)} /></mesh>
          {/* Slender Waist & Torso */}
          <mesh position={[0, 0.7, 0]}><cylinderGeometry args={[0.09, 0.18, 0.3, 12]} /><DissolveMat {...getMat(s)} /></mesh>
          <mesh position={[0, 0.8, 0.02]}><boxGeometry args={[0.05, 0.2, 0.02]} /><DissolveMat {...getMat(a)} /></mesh> {/* Vertical Deco */}
          {/* Arms (Floating/Ready) */}
          <mesh position={[0.27, 0.8, 0]}><boxGeometry args={[0.1, 0.25, 0.1]} /><DissolveMat {...getMat(s)} /></mesh>
          <mesh position={[-0.27, 0.8, 0]}><boxGeometry args={[0.1, 0.25, 0.1]} /><DissolveMat {...getMat(s)} /></mesh>
          {/* Energy Orb (Left Hand) */}
          <mesh position={[-0.35, 0.9, 0.2]}><sphereGeometry args={[0.075, 16, 16]} /><DissolveMat {...getMat(gl)} /></mesh>
          {/* Head & 7-Pointed Crown */}
          <mesh position={[0, 1.1, 0]}><boxGeometry args={[0.18, 0.18, 0.18]} /><DissolveMat {...getMat(s)} /></mesh>
          <group position={[0, 1.27, 0]}>
            <mesh><cylinderGeometry args={[0.15, 0.15, 0.1, 16]} /><DissolveMat {...getMat(a)} /></mesh>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <group key={i} rotation={[0, (i * Math.PI * 2) / 7, 0]}>
                <mesh position={[0.12, 0.15, 0]} rotation={[0, 0, -0.3]}>
                  <boxGeometry args={[0.03, 0.2, 0.03]} /><DissolveMat {...getMat(a)} />
                </mesh>
              </group>
            ))}
          </group>
        </group>
      );
    }

    if (t === 'n') { // THE HARBINGER (KNIGHT/MOUNTED)
      const horseRotate = color === 'w' ? Math.PI : 0;
      return (
        <group rotation={[0, horseRotate, 0]}>
          {/* Horse Body */}
          <mesh position={[0, 0.35, 0]}><boxGeometry args={[0.3, 0.36, 0.7]} /><DissolveMat {...getMat(s)} /></mesh>
          {/* Horse Legs */}
          {[[0.12, 0.15, 0.22], [-0.12, 0.15, 0.22], [0.12, 0.15, -0.22], [-0.12, 0.15, -0.22]].map((pos, i) => (
            <mesh key={i} position={pos as any}><boxGeometry args={[0.12, 0.26, 0.12]} /><DissolveMat {...getMat(s)} /></mesh>
          ))}
          {/* Horse Neck & Head */}
          <group position={[0, 0.55, 0.3]} rotation={[-0.55, 0, 0]}>
            <mesh position={[0, 0.25, 0]}><boxGeometry args={[0.2, 0.45, 0.2]} /><DissolveMat {...getMat(s)} /></mesh>
            <mesh position={[0, 0.5, 0.1]} rotation={[0.4, 0, 0]}><boxGeometry args={[0.22, 0.25, 0.35]} /><DissolveMat {...getMat(s)} /></mesh>
            <mesh position={[0.08, 0.65, 0]}><boxGeometry args={[0.04, 0.1, 0.04]} /><DissolveMat {...getMat(p)} /></mesh> {/* Ears */}
            <mesh position={[-0.08, 0.65, 0]}><boxGeometry args={[0.04, 0.1, 0.04]} /><DissolveMat {...getMat(p)} /></mesh>
          </group>
          {/* Rider (Knight) */}
          <group position={[0, 0.6, 0]}>
            <mesh position={[0, 0, 0]}><boxGeometry args={[0.35, 0.1, 0.3]} /><DissolveMat {...getMat(a)} /></mesh> {/* Saddle */}
            <mesh position={[0, 0.3, 0]}><boxGeometry args={[0.3, 0.4, 0.2]} /><DissolveMat {...getMat(p)} /></mesh> {/* Torso */}
            <mesh position={[0, 0.65, 0]}><boxGeometry args={[0.18, 0.18, 0.18]} /><DissolveMat {...getMat(s)} /></mesh> {/* Head */}
            <mesh position={[0, 0.75, 0.05]}><boxGeometry args={[0.2, 0.05, 0.15]} /><DissolveMat {...getMat(p)} /></mesh> {/* Helmet Brim */}
            <group position={[0.25, 0.3, 0.1]} rotation={[-0.52, 0, 0]}>
               <mesh><cylinderGeometry args={[0.015, 0.015, 0.72, 8]} /><DissolveMat {...getMat(a)} /></mesh>
               <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[0, 0.04, 0.15, 4]} /><DissolveMat {...getMat(a)} /></mesh>
            </group>
          </group>
        </group>
      );
    }

    if (t === 'b') { // THE CLERIC (BISHOP)
      return (
        <group>
          {/* Robe/Gown */}
          <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.15, 0.35, 0.5, 16]} /><DissolveMat {...getMat(p)} /></mesh>
          <mesh position={[0, 0.65, 0]}><cylinderGeometry args={[0.1, 0.15, 0.3, 12]} /><DissolveMat {...getMat(s)} /></mesh>
          {/* Vertical Cloth Detail */}
          <mesh position={[0, 0.5, 0.1]}><boxGeometry args={[0.06, 0.6, 0.02]} /><DissolveMat {...getMat(a)} /></mesh>
          <mesh position={[0, 0.65, 0.11]}><boxGeometry args={[0.15, 0.05, 0.02]} /><DissolveMat {...getMat(a)} /></mesh>
          {/* Arms (Clasped or Side) */}
          <mesh position={[0.25, 0.6, 0]}><boxGeometry args={[0.1, 0.35, 0.1]} /><DissolveMat {...getMat(s)} /></mesh>
          <mesh position={[-0.25, 0.6, 0]}><boxGeometry args={[0.1, 0.35, 0.1]} /><DissolveMat {...getMat(s)} /></mesh>
          {/* Scepter (L-Hook) */}
          <group position={[0.3, 0.6, 0.15]}>
            <mesh><cylinderGeometry args={[0.02, 0.02, 0.7, 8]} /><DissolveMat {...getMat(a)} /></mesh>
            <mesh position={[0.05, 0.35, 0]} rotation={[0, 0, Math.PI/2]}><cylinderGeometry args={[0.02, 0.02, 0.1, 8]} /><DissolveMat {...getMat(a)} /></mesh>
          </group>
          {/* Mitre Crown */}
          <mesh position={[0, 1.0, 0]}><boxGeometry args={[0.16, 0.16, 0.16]} /><DissolveMat {...getMat(s)} /></mesh>
          <mesh position={[0, 1.25, 0]}><cylinderGeometry args={[0, 0.16, 0.4, 4]} /><DissolveMat {...getMat(a)} /></mesh>
        </group>
      );
    }

    if (t === 'r') { // THE BASTION (ROOK)
      return (
        <group>
          {/* Heavy Legs */}
          <mesh position={[0.12, 0.2, 0]}><boxGeometry args={[0.2, 0.4, 0.2]} /><DissolveMat {...getMat(d)} /></mesh>
          <mesh position={[-0.12, 0.2, 0]}><boxGeometry args={[0.2, 0.4, 0.2]} /><DissolveMat {...getMat(d)} /></mesh>
          {/* Wide Torso */}
          <mesh position={[0, 0.7, 0]}><boxGeometry args={[0.52, 0.6, 0.4]} /><DissolveMat {...getMat(s)} /></mesh>
          <mesh position={[0, 0.75, 0.1]}><boxGeometry args={[0.35, 0.3, 0.05]} /><DissolveMat {...getMat(p)} /></mesh> {/* Chest Plate */}
          {/* Massive Arms & Fists */}
          <mesh position={[0.35, 0.7, 0]}><boxGeometry args={[0.18, 0.5, 0.2]} /><DissolveMat {...getMat(s)} /></mesh>
          <mesh position={[-0.35, 0.7, 0]}><boxGeometry args={[0.18, 0.5, 0.2]} /><DissolveMat {...getMat(s)} /></mesh>
          <mesh position={[0.35, 0.4, 0.1]}><boxGeometry args={[0.2, 0.16, 0.2]} /><DissolveMat {...getMat(a)} /></mesh> {/* Fist R */}
          <mesh position={[-0.35, 0.4, 0.1]}><boxGeometry args={[0.2, 0.16, 0.2]} /><DissolveMat {...getMat(a)} /></mesh> {/* Fist L */}
          {/* Shoulder Battlements */}
          <mesh position={[0.3, 1.0, 0]}><boxGeometry args={[0.25, 0.1, 0.3]} /><DissolveMat {...getMat(p)} /></mesh>
          <mesh position={[-0.3, 1.0, 0]}><boxGeometry args={[0.25, 0.1, 0.3]} /><DissolveMat {...getMat(p)} /></mesh>
          {/* Head & Fortress Helmet */}
          <mesh position={[0, 1.1, 0]}><boxGeometry args={[0.32, 0.28, 0.28]} /><DissolveMat {...getMat(s)} /></mesh>
          {[[-0.1, 1.25, 0.1], [0.1, 1.25, 0.1], [0, 1.25, -0.1]].map((pos, i) => (
            <mesh key={i} position={pos as any}><boxGeometry args={[0.08, 0.1, 0.08]} /><DissolveMat {...getMat(p)} /></mesh>
          ))}
        </group>
      );
    }

    if (t === 'p') { // THE INFANTRY (PAWN)
      return (
        <group>
          {/* Standard Legs */}
          <mesh position={[0.09, 0.15, 0]}><boxGeometry args={[0.15, 0.3, 0.15]} /><DissolveMat {...getMat(d)} /></mesh>
          <mesh position={[-0.09, 0.15, 0]}><boxGeometry args={[0.15, 0.3, 0.15]} /><DissolveMat {...getMat(d)} /></mesh>
          {/* Torso */}
          <mesh position={[0, 0.65, 0]}><boxGeometry args={[0.38, 0.4, 0.2]} /><DissolveMat {...getMat(s)} /></mesh>
          <mesh position={[0, 0.7, 0.08]}><boxGeometry args={[0.25, 0.25, 0.04]} /><DissolveMat {...getMat(p)} /></mesh> {/* Padding */}
          {/* Helmet & Mask */}
          <mesh position={[0, 1.0, 0]}><boxGeometry args={[0.2, 0.2, 0.2]} /><DissolveMat {...getMat(s)} /></mesh>
          <mesh position={[0, 1.1, 0.05]}><boxGeometry args={[0.22, 0.05, 0.15]} /><DissolveMat {...getMat(p)} /></mesh> {/* Visor */}
          <mesh position={[0, 0.95, 0.11]}><boxGeometry args={[0.05, 0.15, 0.02]} /><DissolveMat {...getMat(d)} /></mesh> {/* Mask Slit */}
          {/* Shield (Left) */}
          <mesh position={[-0.36, 0.6, 0.1]}><boxGeometry args={[0.04, 0.34, 0.28]} /><DissolveMat {...getMat(a)} /></mesh>
          {/* Spear (Right) */}
          <group position={[0.32, 0.6, 0.1]}>
             <mesh><cylinderGeometry args={[0.015, 0.015, 0.65, 8]} /><DissolveMat {...getMat(a)} /></mesh>
             <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[0, 0.03, 0.12, 4]} /><DissolveMat {...getMat(a)} /></mesh>
          </group>
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
