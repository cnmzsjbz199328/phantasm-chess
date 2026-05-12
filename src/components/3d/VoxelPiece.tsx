import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import "./Shaders";
import type { Side } from "../../shared/types";
import { SIDE_COLORS } from "../../shared/pieceColors";

interface PieceModelProps {
  type: string;
  color: Side;
  dissolve?: number;
}

export function VoxelPieceModel({ type, color, dissolve = 0 }: PieceModelProps) {
  const meshRef = useRef<THREE.Group>(null);
  const c = SIDE_COLORS[color];

  const DissolveMat = "dissolveMaterial" as any;

  const getMat = (hex: string) => ({
    uBaseColor: new THREE.Color(hex),
    uColor: new THREE.Color(c.glow),
  });

  const renderPiece = () => {
    const t = type.toLowerCase();
    const { primary: p, secondary: s, accent: a, dark: d, glow: gl } = c;

    if (t === "k") {
      return (
        <group>
          <mesh position={[0.09, 0.15, 0]}><boxGeometry args={[0.18, 0.3, 0.18]} /><DissolveMat {...getMat(d)} /></mesh>
          <mesh position={[-0.09, 0.15, 0]}><boxGeometry args={[0.18, 0.3, 0.18]} /><DissolveMat {...getMat(d)} /></mesh>
          <mesh position={[0, 0.7, 0]}><boxGeometry args={[0.42, 0.45, 0.3]} /><DissolveMat {...getMat(s)} /></mesh>
          <mesh position={[0, 0.75, 0.05]}><boxGeometry args={[0.3, 0.3, 0.05]} /><DissolveMat {...getMat(p)} /></mesh>
          <mesh position={[0, 0.65, -0.18]}><boxGeometry args={[0.54, 0.7, 0.06]} /><DissolveMat {...getMat(d)} /></mesh>
          <mesh position={[0.27, 0.85, 0]}><boxGeometry args={[0.2, 0.15, 0.25]} /><DissolveMat {...getMat(p)} /></mesh>
          <mesh position={[-0.27, 0.85, 0]}><boxGeometry args={[0.2, 0.15, 0.25]} /><DissolveMat {...getMat(p)} /></mesh>
          <mesh position={[0, 1.1, 0]}><boxGeometry args={[0.2, 0.2, 0.2]} /><DissolveMat {...getMat(s)} /></mesh>
          <mesh position={[0, 1.3, 0]}><cylinderGeometry args={[0.16, 0.16, 0.1, 16]} /><DissolveMat {...getMat(a)} /></mesh>
          <mesh position={[0, 1.45, 0]}><boxGeometry args={[0.1, 0.3, 0.04]} /><DissolveMat {...getMat(a)} /></mesh>
          <mesh position={[0, 1.45, 0]} rotation={[0, 0, Math.PI / 2]}><boxGeometry args={[0.1, 0.2, 0.04]} /><DissolveMat {...getMat(a)} /></mesh>
          <group position={[0.35, 0.5, 0.2]}>
            <mesh><cylinderGeometry args={[0.02, 0.02, 0.8, 8]} /><DissolveMat {...getMat(a)} /></mesh>
            <mesh position={[0, 0.45, 0]}><sphereGeometry args={[0.08, 12, 12]} /><DissolveMat {...getMat(gl)} /></mesh>
          </group>
        </group>
      );
    }

    if (t === "q") {
      return (
        <group>
          <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.18, 0.44, 0.6, 16]} /><DissolveMat {...getMat(p)} /></mesh>
          <mesh position={[0, 0.7, 0]}><cylinderGeometry args={[0.09, 0.18, 0.3, 12]} /><DissolveMat {...getMat(s)} /></mesh>
          <mesh position={[0, 0.8, 0.02]}><boxGeometry args={[0.05, 0.2, 0.02]} /><DissolveMat {...getMat(a)} /></mesh>
          <mesh position={[0.27, 0.8, 0]}><boxGeometry args={[0.1, 0.25, 0.1]} /><DissolveMat {...getMat(s)} /></mesh>
          <mesh position={[-0.27, 0.8, 0]}><boxGeometry args={[0.1, 0.25, 0.1]} /><DissolveMat {...getMat(s)} /></mesh>
          <mesh position={[-0.35, 0.9, 0.2]}><sphereGeometry args={[0.075, 16, 16]} /><DissolveMat {...getMat(gl)} /></mesh>
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

    if (t === "n") {
      const horseRotate = color === "w" ? Math.PI : 0;
      return (
        <group rotation={[0, horseRotate, 0]}>
          <mesh position={[0, 0.35, 0]}><boxGeometry args={[0.3, 0.36, 0.7]} /><DissolveMat {...getMat(s)} /></mesh>
          {([[0.12, 0.15, 0.22], [-0.12, 0.15, 0.22], [0.12, 0.15, -0.22], [-0.12, 0.15, -0.22]] as [number,number,number][]).map((pos, i) => (
            <mesh key={i} position={pos}><boxGeometry args={[0.12, 0.26, 0.12]} /><DissolveMat {...getMat(s)} /></mesh>
          ))}
          <group position={[0, 0.55, 0.3]} rotation={[-0.55, 0, 0]}>
            <mesh position={[0, 0.25, 0]}><boxGeometry args={[0.2, 0.45, 0.2]} /><DissolveMat {...getMat(s)} /></mesh>
            <mesh position={[0, 0.5, 0.1]} rotation={[0.4, 0, 0]}><boxGeometry args={[0.22, 0.25, 0.35]} /><DissolveMat {...getMat(s)} /></mesh>
            <mesh position={[0.08, 0.65, 0]}><boxGeometry args={[0.04, 0.1, 0.04]} /><DissolveMat {...getMat(p)} /></mesh>
            <mesh position={[-0.08, 0.65, 0]}><boxGeometry args={[0.04, 0.1, 0.04]} /><DissolveMat {...getMat(p)} /></mesh>
          </group>
          <group position={[0, 0.6, 0]}>
            <mesh position={[0, 0, 0]}><boxGeometry args={[0.35, 0.1, 0.3]} /><DissolveMat {...getMat(a)} /></mesh>
            <mesh position={[0, 0.3, 0]}><boxGeometry args={[0.3, 0.4, 0.2]} /><DissolveMat {...getMat(p)} /></mesh>
            <mesh position={[0, 0.65, 0]}><boxGeometry args={[0.18, 0.18, 0.18]} /><DissolveMat {...getMat(s)} /></mesh>
            <mesh position={[0, 0.75, 0.05]}><boxGeometry args={[0.2, 0.05, 0.15]} /><DissolveMat {...getMat(p)} /></mesh>
            <group position={[0.25, 0.3, 0.1]} rotation={[-0.52, 0, 0]}>
              <mesh><cylinderGeometry args={[0.015, 0.015, 0.72, 8]} /><DissolveMat {...getMat(a)} /></mesh>
              <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[0, 0.04, 0.15, 4]} /><DissolveMat {...getMat(a)} /></mesh>
            </group>
          </group>
        </group>
      );
    }

    if (t === "b") {
      return (
        <group>
          <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.15, 0.35, 0.5, 16]} /><DissolveMat {...getMat(p)} /></mesh>
          <mesh position={[0, 0.65, 0]}><cylinderGeometry args={[0.1, 0.15, 0.3, 12]} /><DissolveMat {...getMat(s)} /></mesh>
          <mesh position={[0, 0.5, 0.1]}><boxGeometry args={[0.06, 0.6, 0.02]} /><DissolveMat {...getMat(a)} /></mesh>
          <mesh position={[0, 0.65, 0.11]}><boxGeometry args={[0.15, 0.05, 0.02]} /><DissolveMat {...getMat(a)} /></mesh>
          <mesh position={[0.25, 0.6, 0]}><boxGeometry args={[0.1, 0.35, 0.1]} /><DissolveMat {...getMat(s)} /></mesh>
          <mesh position={[-0.25, 0.6, 0]}><boxGeometry args={[0.1, 0.35, 0.1]} /><DissolveMat {...getMat(s)} /></mesh>
          <group position={[0.3, 0.6, 0.15]}>
            <mesh><cylinderGeometry args={[0.02, 0.02, 0.7, 8]} /><DissolveMat {...getMat(a)} /></mesh>
            <mesh position={[0.05, 0.35, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.02, 0.02, 0.1, 8]} /><DissolveMat {...getMat(a)} /></mesh>
          </group>
          <mesh position={[0, 1.0, 0]}><boxGeometry args={[0.16, 0.16, 0.16]} /><DissolveMat {...getMat(s)} /></mesh>
          <mesh position={[0, 1.25, 0]}><cylinderGeometry args={[0, 0.16, 0.4, 4]} /><DissolveMat {...getMat(a)} /></mesh>
        </group>
      );
    }

    if (t === "r") {
      return (
        <group>
          <mesh position={[0.12, 0.2, 0]}><boxGeometry args={[0.2, 0.4, 0.2]} /><DissolveMat {...getMat(d)} /></mesh>
          <mesh position={[-0.12, 0.2, 0]}><boxGeometry args={[0.2, 0.4, 0.2]} /><DissolveMat {...getMat(d)} /></mesh>
          <mesh position={[0, 0.7, 0]}><boxGeometry args={[0.52, 0.6, 0.4]} /><DissolveMat {...getMat(s)} /></mesh>
          <mesh position={[0, 0.75, 0.1]}><boxGeometry args={[0.35, 0.3, 0.05]} /><DissolveMat {...getMat(p)} /></mesh>
          <mesh position={[0.35, 0.7, 0]}><boxGeometry args={[0.18, 0.5, 0.2]} /><DissolveMat {...getMat(s)} /></mesh>
          <mesh position={[-0.35, 0.7, 0]}><boxGeometry args={[0.18, 0.5, 0.2]} /><DissolveMat {...getMat(s)} /></mesh>
          <mesh position={[0.35, 0.4, 0.1]}><boxGeometry args={[0.2, 0.16, 0.2]} /><DissolveMat {...getMat(a)} /></mesh>
          <mesh position={[-0.35, 0.4, 0.1]}><boxGeometry args={[0.2, 0.16, 0.2]} /><DissolveMat {...getMat(a)} /></mesh>
          <mesh position={[0.3, 1.0, 0]}><boxGeometry args={[0.25, 0.1, 0.3]} /><DissolveMat {...getMat(p)} /></mesh>
          <mesh position={[-0.3, 1.0, 0]}><boxGeometry args={[0.25, 0.1, 0.3]} /><DissolveMat {...getMat(p)} /></mesh>
          <mesh position={[0, 1.1, 0]}><boxGeometry args={[0.32, 0.28, 0.28]} /><DissolveMat {...getMat(s)} /></mesh>
          {([[-0.1, 1.25, 0.1], [0.1, 1.25, 0.1], [0, 1.25, -0.1]] as [number,number,number][]).map((pos, i) => (
            <mesh key={i} position={pos}><boxGeometry args={[0.08, 0.1, 0.08]} /><DissolveMat {...getMat(p)} /></mesh>
          ))}
        </group>
      );
    }

    if (t === "p") {
      return (
        <group>
          <mesh position={[0.09, 0.15, 0]}><boxGeometry args={[0.15, 0.3, 0.15]} /><DissolveMat {...getMat(d)} /></mesh>
          <mesh position={[-0.09, 0.15, 0]}><boxGeometry args={[0.15, 0.3, 0.15]} /><DissolveMat {...getMat(d)} /></mesh>
          <mesh position={[0, 0.65, 0]}><boxGeometry args={[0.38, 0.4, 0.2]} /><DissolveMat {...getMat(s)} /></mesh>
          <mesh position={[0, 0.7, 0.08]}><boxGeometry args={[0.25, 0.25, 0.04]} /><DissolveMat {...getMat(p)} /></mesh>
          <mesh position={[0, 1.0, 0]}><boxGeometry args={[0.2, 0.2, 0.2]} /><DissolveMat {...getMat(s)} /></mesh>
          <mesh position={[0, 1.1, 0.05]}><boxGeometry args={[0.22, 0.05, 0.15]} /><DissolveMat {...getMat(p)} /></mesh>
          <mesh position={[0, 0.95, 0.11]}><boxGeometry args={[0.05, 0.15, 0.02]} /><DissolveMat {...getMat(d)} /></mesh>
          <mesh position={[-0.36, 0.6, 0.1]}><boxGeometry args={[0.04, 0.34, 0.28]} /><DissolveMat {...getMat(a)} /></mesh>
          <group position={[0.32, 0.6, 0.1]}>
            <mesh><cylinderGeometry args={[0.015, 0.015, 0.65, 8]} /><DissolveMat {...getMat(a)} /></mesh>
            <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[0, 0.03, 0.12, 4]} /><DissolveMat {...getMat(a)} /></mesh>
          </group>
        </group>
      );
    }
  };

  const wasDissolving = useRef(false);

  useFrame((state) => {
    if (!meshRef.current) return;
    const isDissolving = dissolve > 0.001;
    if (!isDissolving && !wasDissolving.current) return;
    wasDissolving.current = isDissolving;

    const t = isDissolving ? state.clock.getElapsedTime() : 0;
    meshRef.current.traverse((child: THREE.Object3D) => {
      const mat = (child as THREE.Mesh).material as any;
      if (mat?.type === "ShaderMaterial") {
        if (isDissolving) mat.uniforms.uTime.value = t;
        mat.uniforms.uDissolve.value = dissolve;
      }
    });
  });

  return <group ref={meshRef}>{renderPiece()}</group>;
}
