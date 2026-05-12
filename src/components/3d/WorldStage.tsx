import { Sparkles } from "@react-three/drei";
import { useTheme } from "../../shared/ThemeContext";
import { ThemeAtmosphere } from "./ThemeAtmosphere";

// Shared ground Y — board pedestal bottom is also at this value.
export const WORLD_GROUND_Y = -0.7;
const G = WORLD_GROUND_Y;

// ─── ground ───────────────────────────────────────────────────────────────────

function Ground({
  groundColor,
  courtyardColor,
  courtyardEmi,
}: {
  groundColor: string;
  courtyardColor: string;
  courtyardEmi: string;
}) {
  return (
    <>
      <mesh position={[0, G, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color={groundColor} roughness={0.97} metalness={0.03} />
      </mesh>
      {/* 1 mm above bedrock to avoid z-fight */}
      <mesh position={[0, G + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[22, 22]} />
        <meshStandardMaterial
          color={courtyardColor}
          roughness={0.93}
          metalness={0.07}
          emissive={courtyardEmi}
          emissiveIntensity={0.12}
        />
      </mesh>
    </>
  );
}

// ─── battlement wall ──────────────────────────────────────────────────────────

function BattlementWall({
  position,
  rotation = [0, 0, 0] as [number, number, number],
  width,
  stone,
  stoneEmi,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  width: number;
  stone: string;
  stoneEmi: string;
}) {
  const baseH   = 1.1;
  const merlonH = 0.6;
  const merlonW = 0.55;
  const gap     = 0.45;
  const depth   = 0.5;
  const count   = Math.floor(width / (merlonW + gap));
  const startX  = -(count * (merlonW + gap) - gap) / 2;

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, baseH / 2, 0]}>
        <boxGeometry args={[width, baseH, depth]} />
        <meshStandardMaterial color={stone} emissive={stoneEmi} emissiveIntensity={0.15} roughness={0.95} metalness={0.1} />
      </mesh>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} position={[startX + i * (merlonW + gap) + merlonW / 2, baseH + merlonH / 2, 0]}>
          <boxGeometry args={[merlonW, merlonH, depth]} />
          <meshStandardMaterial color={stone} emissive={stoneEmi} emissiveIntensity={0.1} roughness={0.95} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

// ─── corner post ──────────────────────────────────────────────────────────────

function CornerPost({ x, z, stone, stoneEmi }: { x: number; z: number; stone: string; stoneEmi: string }) {
  const postH = 1.9;
  return (
    <mesh position={[x, G + postH / 2, z]}>
      <boxGeometry args={[0.7, postH, 0.7]} />
      <meshStandardMaterial color={stone} emissive={stoneEmi} emissiveIntensity={0.2} roughness={0.92} metalness={0.12} />
    </mesh>
  );
}

// ─── torch ────────────────────────────────────────────────────────────────────

function Torch({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.03, 0.04, 0.55, 6]} />
        <meshStandardMaterial color="#2a1408" roughness={0.9} />
      </mesh>
      <mesh position={[0.08, 0.18, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[0.04, 0.2, 0.04]} />
        <meshStandardMaterial color="#2a1408" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.09, 0.12, 0.09]} />
        <meshStandardMaterial color="#ff6010" emissive="#ff5000" emissiveIntensity={4} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0.45, 0]} color="#ff7020" intensity={1.5} distance={6} decay={2} />
      <Sparkles count={10} scale={[0.2, 0.4, 0.2]} size={1.0} speed={0.6} color="#ffaa30" opacity={0.85} position={[0, 0.5, 0]} />
    </group>
  );
}

// ─── export ───────────────────────────────────────────────────────────────────

export function WorldStage() {
  const { world } = useTheme();
  const { ground, courtyard, stoneEmissive, stone } = world;

  return (
    <group>
      <Ground groundColor={ground} courtyardColor={courtyard} courtyardEmi={stoneEmissive} />

      <BattlementWall position={[0,   G, -11]} width={22} stone={stone} stoneEmi={stoneEmissive} />
      <BattlementWall position={[0,   G,  11]} rotation={[0, Math.PI, 0]}      width={22} stone={stone} stoneEmi={stoneEmissive} />
      <BattlementWall position={[-11, G,   0]} rotation={[0,  Math.PI / 2, 0]} width={22} stone={stone} stoneEmi={stoneEmissive} />
      <BattlementWall position={[11,  G,   0]} rotation={[0, -Math.PI / 2, 0]} width={22} stone={stone} stoneEmi={stoneEmissive} />

      <CornerPost x={-11} z={-11} stone={stone} stoneEmi={stoneEmissive} />
      <CornerPost x={ 11} z={-11} stone={stone} stoneEmi={stoneEmissive} />
      <CornerPost x={-11} z={ 11} stone={stone} stoneEmi={stoneEmissive} />
      <CornerPost x={ 11} z={ 11} stone={stone} stoneEmi={stoneEmissive} />

      <Torch position={[-10.5, G + 0.9, -10.5]} />
      <Torch position={[ 10.5, G + 0.9, -10.5]} />
      <Torch position={[-10.5, G + 0.9,  10.5]} />
      <Torch position={[ 10.5, G + 0.9,  10.5]} />

      <ThemeAtmosphere />
    </group>
  );
}
