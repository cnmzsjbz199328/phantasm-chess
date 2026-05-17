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
      {/* 1 cm above bedrock to avoid z-fight on low-precision depth buffers (iOS) */}
      <mesh position={[0, G + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
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

// ─── arena architecture ──────────────────────────────────────────────────────

function CircularArches({ radius, height, count, stone }: { radius: number; height: number; count: number; stone: string }) {
  const archW = (2 * Math.PI * radius) / count;
  const pillarW = 0.5;
  const archH = height * 0.7;

  return (
    <group>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        return (
          <group key={i} position={[x, G, z]} rotation={[0, -angle, 0]}>
            {/* Left Pillar */}
            <mesh position={[-archW / 2 + pillarW / 2, height / 2, 0]}>
              <boxGeometry args={[pillarW, height, 0.8]} />
              <meshStandardMaterial color={stone} roughness={0.9} />
            </mesh>
            {/* Arch Top Connector */}
            <mesh position={[0, archH + (height - archH) / 2, 0]}>
              <boxGeometry args={[archW, height - archH, 0.8]} />
              <meshStandardMaterial color={stone} roughness={0.9} />
            </mesh>
            {/* Decorative Arch Curve */}
            <mesh position={[0, archH, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[archW / 2 - 0.1, archW / 2 - 0.1, 0.8, 12, 1, false, 0, Math.PI]} />
              <meshStandardMaterial color={stone} roughness={0.9} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function ArenaPodium({ stone }: { stone: string }) {
  const podiumH = 1.8;
  const radius = 10.8;
  return (
    <group>
      {/* High wall between gladiators and audience */}
      <mesh position={[0, G + podiumH / 2, 0]}>
        <cylinderGeometry args={[radius, radius, podiumH, 64, 1, true]} />
        <meshStandardMaterial color={stone} roughness={0.9} side={2} />
      </mesh>
      {/* Top cap of the podium wall */}
      <mesh position={[0, G + podiumH, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.2, radius + 0.2, 64]} />
        <meshStandardMaterial color={stone} roughness={0.8} />
      </mesh>
    </group>
  );
}

function TierSubstructure({ stone }: { stone: string }) {
  const innerR = 10.8;
  const outerR = 18.5;
  const height = 4.0;
  return (
    <mesh position={[0, G + height / 2, 0]}>
      <cylinderGeometry args={[outerR, innerR, height, 64, 1, true]} />
      <meshStandardMaterial color={stone} roughness={1} side={2} />
    </mesh>
  );
}

function SpectatorTiers({ stone }: { stone: string }) {
  const tierCount = 8;
  const podiumH = 1.8;
  const baseR = 11.2;
  const stepR = 0.9;
  const stepH = 0.4;

  return (
    <group>
      {Array.from({ length: tierCount }).map((_, tidx) => {
        const r = baseR + tidx * stepR;
        const h = podiumH + tidx * stepH;
        const count = Math.floor(r * 5);
        return (
          <group key={tidx}>
            {Array.from({ length: count }).map((_, i) => {
              const angle = (i / count) * Math.PI * 2;
              
              // Exit Gap
              const exitWidth = 0.4;
              if (Math.abs(angle - Math.PI / 2) < exitWidth) return null;

              return (
                <mesh
                  key={i}
                  position={[Math.cos(angle) * r, G + h + stepH / 2, Math.sin(angle) * r]}
                  rotation={[0, -angle, 0]}
                >
                  <boxGeometry args={[1.5, stepH, 1.1]} />
                  <meshStandardMaterial color={stone} roughness={1} />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

function GrandExit({ stone }: { stone: string }) {
  const width = 6;
  const height = 3.5;
  const depth = 8;
  const posZ = 14;

  return (
    <group position={[0, G, posZ]}>
      {/* Left Wall of Tunnel */}
      <mesh position={[-width / 2, height / 2, 0]}>
        <boxGeometry args={[0.8, height, depth]} />
        <meshStandardMaterial color={stone} />
      </mesh>
      {/* Right Wall of Tunnel */}
      <mesh position={[width / 2, height / 2, 0]}>
        <boxGeometry args={[0.8, height, depth]} />
        <meshStandardMaterial color={stone} />
      </mesh>
      {/* Arch Roof of Tunnel */}
      <mesh position={[0, height, 0]}>
        <boxGeometry args={[width, 0.6, depth]} />
        <meshStandardMaterial color={stone} />
      </mesh>

      {/* Iron Gate (Portcullis) */}
      <group position={[0, 0, -depth / 2 + 0.5]}>
        {/* Vertical Bars */}
        {Array.from({ length: 9 }).map((_, i) => (
          <mesh key={`v-${i}`} position={[-2.4 + i * 0.6, height / 2, 0]}>
            <cylinderGeometry args={[0.04, 0.04, height]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
        {/* Horizontal Bars */}
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={`h-${i}`} position={[0, 0.5 + i * 0.7, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 5.4]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function ImperialBox({ stone }: { stone: string }) {
  const podiumH = 1.8;
  const posZ = 11.5;
  const width = 6;

  return (
    <group position={[0, G + podiumH, posZ]}>
      {/* VIP Podium */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[width, 1.2, 3.5]} />
        <meshStandardMaterial color={stone} roughness={0.8} />
      </mesh>
      {/* Columns */}
      <mesh position={[-2.2, 2.2, 1]}>
        <cylinderGeometry args={[0.12, 0.12, 3]} />
        <meshStandardMaterial color={stone} />
      </mesh>
      <mesh position={[2.2, 2.2, 1]}>
        <cylinderGeometry args={[0.12, 0.12, 3]} />
        <meshStandardMaterial color={stone} />
      </mesh>
      {/* Royal Canopy */}
      <mesh position={[0, 3.8, 1]}>
        <boxGeometry args={[width + 0.6, 0.25, 2.8]} />
        <meshStandardMaterial color="#800000" />
      </mesh>
      {/* Banners */}
      <mesh position={[0, 0.5, -1.8]}>
        <boxGeometry args={[4, 2, 0.1]} />
        <meshStandardMaterial color="#b22222" emissive="#330000" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

// ─── export ───────────────────────────────────────────────────────────────────

export function WorldStage() {
  const { world } = useTheme();
  const { ground, courtyard, stoneEmissive, stone, variant } = world;

  const isArena = variant === "arena";

  return (
    <group>
      <Ground groundColor={ground} courtyardColor={courtyard} courtyardEmi={stoneEmissive} />

      {isArena ? (
        <group>
          <ArenaPodium stone={stone} />
          <TierSubstructure stone={stone} />
          <SpectatorTiers stone={stone} />
          <GrandExit stone={stone} />
          <ImperialBox stone={stone} />

          <CircularArches radius={19} height={4.5} count={40} stone={stone} />
          <group position={[0, 4.5, 0]}>
            <CircularArches radius={19.5} height={4.0} count={40} stone={stone} />
          </group>
          <group position={[0, 8.5, 0]}>
            <CircularArches radius={20} height={3.5} count={40} stone={stone} />
          </group>

          <Torch position={[-9, G + 1.2, -9]} />
          <Torch position={[9, G + 1.2, -9]} />
          <Torch position={[-9, G + 1.2, 9]} />
          <Torch position={[9, G + 1.2, 9]} />
        </group>
      ) : (
        <>
          <BattlementWall position={[0, G, -11]} width={22} stone={stone} stoneEmi={stoneEmissive} />
          <BattlementWall position={[0, G, 11]} rotation={[0, Math.PI, 0]} width={22} stone={stone} stoneEmi={stoneEmissive} />
          <BattlementWall position={[-11, G, 0]} rotation={[0, Math.PI / 2, 0]} width={22} stone={stone} stoneEmi={stoneEmissive} />
          <BattlementWall position={[11, G, 0]} rotation={[0, -Math.PI / 2, 0]} width={22} stone={stone} stoneEmi={stoneEmissive} />

          <CornerPost x={-11} z={-11} stone={stone} stoneEmi={stoneEmissive} />
          <CornerPost x={11} z={-11} stone={stone} stoneEmi={stoneEmissive} />
          <CornerPost x={-11} z={11} stone={stone} stoneEmi={stoneEmissive} />
          <CornerPost x={11} z={11} stone={stone} stoneEmi={stoneEmissive} />

          <Torch position={[-10.5, G + 0.9, -10.5]} />
          <Torch position={[10.5, G + 0.9, -10.5]} />
          <Torch position={[-10.5, G + 0.9, 10.5]} />
          <Torch position={[10.5, G + 0.9, 10.5]} />
        </>
      )}

      <ThemeAtmosphere />
    </group>
  );
}
