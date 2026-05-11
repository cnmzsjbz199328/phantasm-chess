import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { playAttackAnimation } from "../src/shared/attackAnimations";
import { SIDE_COLORS } from "../src/shared/pieceColors";
import "../src/components/3d/Shaders";

interface HumanoidPieceProps {
  type: string;
  color: "w" | "b";
  dissolve?: number;
  attackTrigger?: number;
  onImpact?: () => void;
}

export function HumanoidPieceModel({
  type, color, dissolve = 0, attackTrigger = 0, onImpact,
}: HumanoidPieceProps) {
  const groupRef = useRef<THREE.Group>(null);

  const { primary: pri, secondary: sec, accent: acc, dark, glow } = SIDE_COLORS[color];
  const c = { pri, sec, acc, dark, glow };

  const DM = "dissolveMaterial" as any;
  const m = (hex: string) => ({
    uBaseColor: new THREE.Color(hex),
    uColor: new THREE.Color(c.glow),
    transparent: true,
  });

  // ── attack animation ──────────────────────────────────────────────────────

  useEffect(() => {
    if (attackTrigger === 0 || !groupRef.current) return;
    playAttackAnimation(type, groupRef.current, () => onImpact?.());
  }, [attackTrigger]);

  // ── shader uniforms ───────────────────────────────────────────────────────

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.traverse((child: THREE.Object3D) => {
      const mat = (child as THREE.Mesh).material as any;
      if (mat?.type === "ShaderMaterial") {
        mat.uniforms.uTime.value = state.clock.getElapsedTime();
        mat.uniforms.uDissolve.value = dissolve;
      }
    });
  });

  // ── shared body parts ─────────────────────────────────────────────────────

  const Foot = ({ x }: { x: number }) => (
    <mesh position={[x, 0.06, 0.03]}><boxGeometry args={[0.14, 0.1, 0.22]} /><DM {...m(c.dark)} /></mesh>
  );
  const Leg = ({ x }: { x: number }) => (
    <mesh position={[x, 0.29, 0]}><boxGeometry args={[0.14, 0.36, 0.14]} /><DM {...m(c.sec)} /></mesh>
  );
  const Hips = ({ w = 0.34 }: { w?: number }) => (
    <mesh position={[0, 0.49, 0]}><boxGeometry args={[w, 0.12, 0.19]} /><DM {...m(c.pri)} /></mesh>
  );
  const Torso = ({ w = 0.38, h = 0.38 }: { w?: number; h?: number }) => (
    <mesh position={[0, 0.71, 0]}><boxGeometry args={[w, h, 0.22]} /><DM {...m(c.sec)} /></mesh>
  );
  const Pauldron = ({ x }: { x: number }) => (
    <mesh position={[x, 0.85, 0]}><boxGeometry args={[0.14, 0.1, 0.2]} /><DM {...m(c.pri)} /></mesh>
  );
  const UpperArm = ({ x }: { x: number }) => (
    <mesh position={[x, 0.67, 0]}><boxGeometry args={[0.13, 0.28, 0.13]} /><DM {...m(c.sec)} /></mesh>
  );
  const Forearm = ({ x }: { x: number }) => (
    <mesh position={[x, 0.47, 0]}><boxGeometry args={[0.11, 0.22, 0.11]} /><DM {...m(c.sec)} /></mesh>
  );
  const Hand = ({ x }: { x: number }) => (
    <mesh position={[x, 0.34, 0.01]}><boxGeometry args={[0.1, 0.1, 0.13]} /><DM {...m(c.acc)} /></mesh>
  );
  const Neck = ({ y = 0.95 }: { y?: number }) => (
    <mesh position={[0, y, 0]}><cylinderGeometry args={[0.065, 0.075, 0.1, 8]} /><DM {...m(c.sec)} /></mesh>
  );
  const Head = ({ y = 1.11 }: { y?: number }) => (
    <mesh position={[0, y, 0]}><boxGeometry args={[0.24, 0.24, 0.22]} /><DM {...m(c.sec)} /></mesh>
  );

  const FullBody = ({ torsoW = 0.38 }: { torsoW?: number }) => (
    <>
      <Foot x={-0.09} /><Foot x={0.09} />
      <Leg x={-0.09} /><Leg x={0.09} />
      <Hips w={torsoW - 0.04} />
      <Torso w={torsoW} />
      <Pauldron x={-0.27} /><Pauldron x={0.27} />
      <UpperArm x={-0.27} /><UpperArm x={0.27} />
      <Forearm x={-0.27} /><Forearm x={0.27} />
      <Hand x={-0.27} /><Hand x={0.27} />
      <Neck /><Head />
    </>
  );

  // ── pieces ────────────────────────────────────────────────────────────────

  const renderPiece = () => {
    const t = type.toLowerCase();

    if (t === "p") return (
      <group>
        <FullBody />
        <mesh position={[0, 1.28, 0]}><boxGeometry args={[0.28, 0.07, 0.28]} /><DM {...m(c.pri)} /></mesh>
        <mesh position={[0, 1.22, 0.1]}><boxGeometry args={[0.2, 0.13, 0.04]} /><DM {...m(c.pri)} /></mesh>
        <mesh position={[0, 0.73, 0.12]}><boxGeometry args={[0.22, 0.24, 0.02]} /><DM {...m(c.pri)} /></mesh>
        <mesh position={[0, 0.53, 0.12]}><boxGeometry args={[0.32, 0.07, 0.02]} /><DM {...m(c.acc)} /></mesh>
        <mesh position={[-0.36, 0.65, 0.1]}><boxGeometry args={[0.04, 0.34, 0.28]} /><DM {...m(c.acc)} /></mesh>
        <mesh position={[0.31, 0.82, 0]}><cylinderGeometry args={[0.025, 0.025, 0.65, 6]} /><DM {...m(c.acc)} /></mesh>
        <mesh position={[0.31, 1.17, 0]}><boxGeometry args={[0.05, 0.15, 0.03]} /><DM {...m(c.pri)} /></mesh>
      </group>
    );

    if (t === "k") return (
      <group>
        <FullBody torsoW={0.42} />
        <mesh position={[0, 0.65, -0.15]}><boxGeometry args={[0.54, 0.7, 0.04]} /><DM {...m(c.dark)} /></mesh>
        <mesh position={[0, 0.73, 0.12]}><boxGeometry args={[0.3, 0.3, 0.02]} /><DM {...m(c.pri)} /></mesh>
        <mesh position={[0, 0.54, 0.12]}><boxGeometry args={[0.4, 0.07, 0.02]} /><DM {...m(c.acc)} /></mesh>
        <mesh position={[-0.31, 0.88, 0]}><boxGeometry args={[0.1, 0.06, 0.22]} /><DM {...m(c.pri)} /></mesh>
        <mesh position={[0.31, 0.88, 0]}><boxGeometry args={[0.1, 0.06, 0.22]} /><DM {...m(c.pri)} /></mesh>
        <mesh position={[0, 1.27, 0]}><cylinderGeometry args={[0.155, 0.165, 0.09, 12]} /><DM {...m(c.acc)} /></mesh>
        {[-0.11, 0, 0.11].map((x, i) => (
          <mesh key={i} position={[x, 1.38, 0]}><boxGeometry args={[0.055, 0.13, 0.055]} /><DM {...m(c.acc)} /></mesh>
        ))}
        <mesh position={[0, 1.49, 0]}><boxGeometry args={[0.04, 0.11, 0.04]} /><DM {...m(c.acc)} /></mesh>
        <mesh position={[0, 1.53, 0]}><boxGeometry args={[0.15, 0.04, 0.04]} /><DM {...m(c.acc)} /></mesh>
        <mesh position={[0.31, 0.72, 0]}><cylinderGeometry args={[0.025, 0.025, 0.66, 6]} /><DM {...m(c.acc)} /></mesh>
        <mesh position={[0.31, 1.08, 0]}><sphereGeometry args={[0.065, 8, 8]} /><DM {...m(c.glow)} /></mesh>
      </group>
    );

    if (t === "q") return (
      <group>
        <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[0.4, 0.44, 0.1, 12]} /><DM {...m(c.dark)} /></mesh>
        <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.33, 0.4, 0.5, 12]} /><DM {...m(c.pri)} /></mesh>
        <mesh position={[0, 0.59, 0]}><cylinderGeometry args={[0.18, 0.31, 0.16, 12]} /><DM {...m(c.sec)} /></mesh>
        <mesh position={[0, 0.78, 0]}><boxGeometry args={[0.36, 0.3, 0.22]} /><DM {...m(c.sec)} /></mesh>
        <mesh position={[0, 0.72, 0.12]}><boxGeometry args={[0.14, 0.42, 0.02]} /><DM {...m(c.acc)} /></mesh>
        <Pauldron x={-0.24} /><Pauldron x={0.24} />
        <mesh position={[-0.25, 0.65, 0]}><boxGeometry args={[0.12, 0.28, 0.12]} /><DM {...m(c.sec)} /></mesh>
        <mesh position={[0.25, 0.65, 0]}><boxGeometry args={[0.12, 0.28, 0.12]} /><DM {...m(c.sec)} /></mesh>
        <mesh position={[-0.25, 0.48, 0]}><boxGeometry args={[0.11, 0.2, 0.11]} /><DM {...m(c.sec)} /></mesh>
        <mesh position={[0.25, 0.48, 0]}><boxGeometry args={[0.11, 0.2, 0.11]} /><DM {...m(c.sec)} /></mesh>
        <Hand x={-0.25} /><Hand x={0.25} />
        <mesh position={[-0.25, 0.36, 0]}><sphereGeometry args={[0.075, 8, 8]} /><DM {...m(c.glow)} /></mesh>
        <Neck y={0.97} /><Head y={1.13} />
        <mesh position={[0, 1.29, 0]}><cylinderGeometry args={[0.15, 0.16, 0.08, 12]} /><DM {...m(c.acc)} /></mesh>
        {Array.from({ length: 7 }, (_, i) => i * (360 / 7)).map((deg) => (
          <mesh key={deg} position={[Math.cos(deg * Math.PI / 180) * 0.13, 1.41, Math.sin(deg * Math.PI / 180) * 0.13]}>
            <boxGeometry args={[0.04, 0.13, 0.04]} /><DM {...m(c.acc)} />
          </mesh>
        ))}
      </group>
    );

    if (t === "b") return (
      <group>
        <mesh position={[0, 0.04, 0]}><cylinderGeometry args={[0.32, 0.35, 0.08, 10]} /><DM {...m(c.pri)} /></mesh>
        <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.26, 0.32, 0.42, 10]} /><DM {...m(c.sec)} /></mesh>
        <mesh position={[0, 0.49, 0]}><cylinderGeometry args={[0.17, 0.25, 0.12, 10]} /><DM {...m(c.pri)} /></mesh>
        <mesh position={[0, 0.68, 0]}><boxGeometry args={[0.34, 0.3, 0.22]} /><DM {...m(c.sec)} /></mesh>
        <mesh position={[0, 0.68, 0.12]}><boxGeometry args={[0.06, 0.28, 0.02]} /><DM {...m(c.acc)} /></mesh>
        <mesh position={[0, 0.73, 0.12]}><boxGeometry args={[0.16, 0.05, 0.02]} /><DM {...m(c.acc)} /></mesh>
        <Pauldron x={-0.23} /><Pauldron x={0.23} />
        <mesh position={[-0.25, 0.63, 0]}><boxGeometry args={[0.14, 0.3, 0.15]} /><DM {...m(c.sec)} /></mesh>
        <mesh position={[0.25, 0.63, 0]}><boxGeometry args={[0.14, 0.3, 0.15]} /><DM {...m(c.sec)} /></mesh>
        <Hand x={-0.25} /><Hand x={0.25} />
        <Neck y={0.88} /><Head y={1.03} />
        <mesh position={[0, 1.18, 0]}><cylinderGeometry args={[0.12, 0.14, 0.09, 8]} /><DM {...m(c.pri)} /></mesh>
        <mesh position={[0, 1.34, 0]}><cylinderGeometry args={[0.02, 0.12, 0.3, 8]} /><DM {...m(c.pri)} /></mesh>
        <mesh position={[0, 1.22, 0]}><boxGeometry args={[0.04, 0.22, 0.04]} /><DM {...m(c.acc)} /></mesh>
        <mesh position={[0.29, 0.61, 0]}><cylinderGeometry args={[0.025, 0.025, 0.8, 6]} /><DM {...m(c.acc)} /></mesh>
        <mesh position={[0.37, 1.03, 0]}><boxGeometry args={[0.04, 0.16, 0.04]} /><DM {...m(c.acc)} /></mesh>
        <mesh position={[0.29, 1.1, 0]}><boxGeometry args={[0.16, 0.04, 0.04]} /><DM {...m(c.acc)} /></mesh>
      </group>
    );

    if (t === "r") return (
      <group>
        <mesh position={[-0.12, 0.07, 0.03]}><boxGeometry args={[0.2, 0.12, 0.28]} /><DM {...m(c.dark)} /></mesh>
        <mesh position={[0.12, 0.07, 0.03]}><boxGeometry args={[0.2, 0.12, 0.28]} /><DM {...m(c.dark)} /></mesh>
        <mesh position={[-0.12, 0.31, 0]}><boxGeometry args={[0.2, 0.4, 0.2]} /><DM {...m(c.sec)} /></mesh>
        <mesh position={[0.12, 0.31, 0]}><boxGeometry args={[0.2, 0.4, 0.2]} /><DM {...m(c.sec)} /></mesh>
        <mesh position={[0, 0.54, 0]}><boxGeometry args={[0.5, 0.14, 0.28]} /><DM {...m(c.pri)} /></mesh>
        <mesh position={[0, 0.79, 0]}><boxGeometry args={[0.52, 0.46, 0.3]} /><DM {...m(c.sec)} /></mesh>
        <mesh position={[0, 0.8, 0.16]}><boxGeometry args={[0.36, 0.28, 0.02]} /><DM {...m(c.pri)} /></mesh>
        <mesh position={[-0.32, 0.96, 0]}><boxGeometry args={[0.16, 0.12, 0.3]} /><DM {...m(c.pri)} /></mesh>
        <mesh position={[0.32, 0.96, 0]}><boxGeometry args={[0.16, 0.12, 0.3]} /><DM {...m(c.pri)} /></mesh>
        <mesh position={[-0.38, 0.73, 0]}><boxGeometry args={[0.18, 0.38, 0.18]} /><DM {...m(c.sec)} /></mesh>
        <mesh position={[0.38, 0.73, 0]}><boxGeometry args={[0.18, 0.38, 0.18]} /><DM {...m(c.sec)} /></mesh>
        <mesh position={[-0.38, 0.49, 0]}><boxGeometry args={[0.17, 0.26, 0.17]} /><DM {...m(c.sec)} /></mesh>
        <mesh position={[0.38, 0.49, 0]}><boxGeometry args={[0.17, 0.26, 0.17]} /><DM {...m(c.sec)} /></mesh>
        <mesh position={[-0.38, 0.33, 0]}><boxGeometry args={[0.2, 0.16, 0.2]} /><DM {...m(c.acc)} /></mesh>
        <mesh position={[0.38, 0.33, 0]}><boxGeometry args={[0.2, 0.16, 0.2]} /><DM {...m(c.acc)} /></mesh>
        <mesh position={[0, 1.04, 0]}><cylinderGeometry args={[0.11, 0.13, 0.1, 8]} /><DM {...m(c.sec)} /></mesh>
        <mesh position={[0, 1.19, 0]}><boxGeometry args={[0.32, 0.28, 0.28]} /><DM {...m(c.sec)} /></mesh>
        {[-0.11, 0, 0.11].map((x, i) => (
          <mesh key={i} position={[x, 1.37, 0]}><boxGeometry args={[0.07, 0.11, 0.28]} /><DM {...m(c.pri)} /></mesh>
        ))}
      </group>
    );

    if (t === "n") return (
      <group>
        <mesh position={[0, 0.28, 0]}><boxGeometry args={[0.3, 0.36, 0.7]} /><DM {...m(c.sec)} /></mesh>
        {([-0.1, 0.1] as number[]).flatMap(x =>
          ([-0.26, 0.26] as number[]).map((z) => (
            <group key={`${x}_${z}`}>
              <mesh position={[x, 0.13, z]}><boxGeometry args={[0.12, 0.26, 0.12]} /><DM {...m(c.sec)} /></mesh>
              <mesh position={[x, 0.02, z + (z > 0 ? 0.04 : -0.04)]}><boxGeometry args={[0.12, 0.06, 0.2]} /><DM {...m(c.dark)} /></mesh>
            </group>
          ))
        )}
        <mesh position={[0, 0.5, 0.34]} rotation={[0.55, 0, 0]}><boxGeometry args={[0.22, 0.36, 0.2]} /><DM {...m(c.sec)} /></mesh>
        <mesh position={[0, 0.66, 0.55]}><boxGeometry args={[0.2, 0.22, 0.32]} /><DM {...m(c.sec)} /></mesh>
        <mesh position={[-0.07, 0.79, 0.48]}><boxGeometry args={[0.05, 0.1, 0.05]} /><DM {...m(c.pri)} /></mesh>
        <mesh position={[0.07, 0.79, 0.48]}><boxGeometry args={[0.05, 0.1, 0.05]} /><DM {...m(c.pri)} /></mesh>
        <mesh position={[0, 0.58, 0.7]}><boxGeometry args={[0.14, 0.12, 0.14]} /><DM {...m(c.sec)} /></mesh>
        <mesh position={[0, 0.49, -0.02]}><boxGeometry args={[0.36, 0.1, 0.32]} /><DM {...m(c.acc)} /></mesh>
        <mesh position={[0, 0.72, -0.04]}><boxGeometry args={[0.34, 0.34, 0.22]} /><DM {...m(c.pri)} /></mesh>
        <mesh position={[-0.24, 0.7, -0.02]}><boxGeometry args={[0.12, 0.28, 0.12]} /><DM {...m(c.sec)} /></mesh>
        <mesh position={[0.24, 0.7, -0.02]}><boxGeometry args={[0.12, 0.28, 0.12]} /><DM {...m(c.sec)} /></mesh>
        <mesh position={[-0.24, 0.5, -0.02]}><boxGeometry args={[0.11, 0.2, 0.11]} /><DM {...m(c.sec)} /></mesh>
        <mesh position={[0.24, 0.5, -0.02]}><boxGeometry args={[0.11, 0.2, 0.11]} /><DM {...m(c.sec)} /></mesh>
        <mesh position={[-0.24, 0.38, 0]}><boxGeometry args={[0.1, 0.1, 0.12]} /><DM {...m(c.acc)} /></mesh>
        <mesh position={[0.24, 0.38, 0]}><boxGeometry args={[0.1, 0.1, 0.12]} /><DM {...m(c.acc)} /></mesh>
        <mesh position={[0, 0.96, -0.04]}><cylinderGeometry args={[0.065, 0.075, 0.1, 8]} /><DM {...m(c.sec)} /></mesh>
        <mesh position={[0, 1.11, -0.04]}><boxGeometry args={[0.24, 0.24, 0.22]} /><DM {...m(c.sec)} /></mesh>
        <mesh position={[0, 1.25, -0.04]}><boxGeometry args={[0.28, 0.07, 0.28]} /><DM {...m(c.pri)} /></mesh>
        <mesh position={[0, 1.18, 0.08]}><boxGeometry args={[0.18, 0.1, 0.04]} /><DM {...m(c.acc)} /></mesh>
        <mesh position={[0.28, 0.64, 0.18]} rotation={[0.52, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.72, 6]} /><DM {...m(c.acc)} />
        </mesh>
        <mesh position={[0.28, 0.98, 0.52]}><boxGeometry args={[0.05, 0.15, 0.04]} /><DM {...m(c.pri)} /></mesh>
      </group>
    );

    return null;
  };

  return <group ref={groupRef}>{renderPiece()}</group>;
}
