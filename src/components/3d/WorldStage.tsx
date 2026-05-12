import { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { Sparkles } from "@react-three/drei";
import { useTheme } from "../../shared/ThemeContext";
import { rng } from "../../shared/rng";

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
      {/* Bedrock — 100×100, no gaps ever */}
      <mesh position={[0, G, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color={groundColor} roughness={0.97} metalness={0.03} />
      </mesh>

      {/* Courtyard paving — 1 mm above bedrock to avoid z-fight */}
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
  const baseH    = 1.1;
  const merlonH  = 0.6;
  const merlonW  = 0.55;
  const gap      = 0.45;
  const depth    = 0.5;
  const count    = Math.floor(width / (merlonW + gap));
  const startX   = -(count * (merlonW + gap) - gap) / 2;

  return (
    <group position={position} rotation={rotation}>
      {/* Wall base — bottom flush with group Y (= ground) */}
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

// ─── corner post ─────────────────────────────────────────────────────────────

function CornerPost({
  x,
  z,
  stone,
  stoneEmi,
}: {
  x: number;
  z: number;
  stone: string;
  stoneEmi: string;
}) {
  const postH = 1.9;
  return (
    <mesh position={[x, G + postH / 2, z]}>
      <boxGeometry args={[0.7, postH, 0.7]} />
      <meshStandardMaterial color={stone} emissive={stoneEmi} emissiveIntensity={0.2} roughness={0.92} metalness={0.12} />
    </mesh>
  );
}

// ─── torch (fire stays fire across all themes) ────────────────────────────────

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

// ─── outer terrain — rocks and rubble, all sitting on ground ─────────────────

function OuterTerrain({
  color,
  emi,
}: {
  color: string;
  emi: string;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);

  const blocks = useMemo(() => {
    const out: { x: number; y: number; z: number; sx: number; sy: number; sz: number; ry: number }[] = [];
    for (let i = 0; i < 240; i++) {
      const angle = rng(i * 7.3) * Math.PI * 2;
      const dist  = 12 + rng(i, i * 3) * 26;
      const sx    = 0.5 + rng(i * 2) * 2.0;
      const sy    = 0.4 + rng(i * 3, i) * 5.5;
      const sz    = 0.5 + rng(i * 5) * 2.0;
      out.push({
        x:  Math.cos(angle) * dist,
        y:  G + sy / 2,
        z:  Math.sin(angle) * dist,
        sx, sy, sz,
        ry: rng(i * 11) * Math.PI * 2,
      });
    }
    return out;
  }, []);

  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color, roughness: 0.93, metalness: 0.12, emissive: emi, emissiveIntensity: 0.2 }),
    [color, emi]
  );

  useEffect(() => () => mat.dispose(), [mat]);

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    blocks.forEach(({ x, y, z, sx, sy, sz, ry }, i) => {
      dummy.position.set(x, y, z);
      dummy.scale.set(sx, sy, sz);
      dummy.rotation.set(0, ry, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [blocks]);

  return <instancedMesh ref={ref} args={[geo, mat, blocks.length]} />;
}

// ─── glow accents on outer terrain ───────────────────────────────────────────

function OuterGlowAccents({ glowA, glowB }: { glowA: string; glowB: string }) {
  const cRef = useRef<THREE.InstancedMesh>(null);
  const rRef = useRef<THREE.InstancedMesh>(null);

  const geo  = useMemo(() => new THREE.BoxGeometry(0.3, 0.3, 0.3), []);
  const cMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#000", emissive: glowA, emissiveIntensity: 3.5, toneMapped: false }),
    [glowA]
  );
  const rMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#000", emissive: glowB, emissiveIntensity: 3.5, toneMapped: false }),
    [glowB]
  );

  useEffect(() => () => cMat.dispose(), [cMat]);
  useEffect(() => () => rMat.dispose(), [rMat]);

  const [cyan, red] = useMemo(() => {
    const c: [number, number, number][] = [];
    const r: [number, number, number][] = [];
    for (let i = 0; i < 80; i++) {
      const angle  = rng(i * 4.13) * Math.PI * 2;
      const dist   = 13 + rng(i, i * 2) * 22;
      const blockH = 0.4 + rng(i * 3, i * 1.2) * 5.5;
      const pos: [number, number, number] = [
        Math.cos(angle) * dist,
        G + blockH + 0.18,
        Math.sin(angle) * dist,
      ];
      if (rng(i * 11, i * 7) > 0.5) c.push(pos);
      else r.push(pos);
    }
    return [c, r] as const;
  }, []);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    const apply = (mesh: THREE.InstancedMesh | null, pts: [number, number, number][]) => {
      if (!mesh) return;
      pts.forEach(([x, y, z], i) => {
        dummy.position.set(x, y, z);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    };
    apply(cRef.current, cyan);
    apply(rRef.current, red);
  }, [cyan, red]);

  return (
    <>
      <instancedMesh ref={cRef} args={[geo, cMat, cyan.length]} />
      <instancedMesh ref={rRef} args={[geo, rMat, red.length]} />
    </>
  );
}

// ─── distant towers standing on the ground ────────────────────────────────────

function Tower({
  x,
  z,
  height,
  width = 2.5,
  glowColor,
  stone,
}: {
  x: number;
  z: number;
  height: number;
  width?: number;
  glowColor: string;
  stone: string;
}) {
  const topY    = G + height;
  const centerY = G + height / 2;
  const merlonCount = Math.max(2, Math.floor(width * 1.2));

  return (
    <group>
      <mesh position={[x, centerY, z]}>
        <boxGeometry args={[width, height, width]} />
        <meshStandardMaterial color={stone} roughness={0.9} metalness={0.15} emissive="#010204" emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[x + width / 2 + 0.01, G + height * 0.65, z]}>
        <boxGeometry args={[0.05, 0.5, 0.28]} />
        <meshStandardMaterial color="#000" emissive={glowColor} emissiveIntensity={3} toneMapped={false} />
      </mesh>
      {Array.from({ length: merlonCount }).map((_, i) => {
        const step = width / (merlonCount + 1);
        return (
          <mesh key={i} position={[x - width / 2 + (i + 1) * step, topY + 0.2, z - width / 2]}>
            <boxGeometry args={[step * 0.6, 0.4, 0.35]} />
            <meshStandardMaterial color={stone} roughness={0.95} />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── fantasy tree ─────────────────────────────────────────────────────────────

function Tree({
  x, z, trunkColor, foliageColor, foliageEmi, seed,
}: {
  x: number; z: number;
  trunkColor: string; foliageColor: string; foliageEmi: string;
  seed: number;
}) {
  const h   = 1.3 + rng(seed, 1) * 1.1;
  const tw  = 0.13 + rng(seed, 2) * 0.05;
  const ry  = rng(seed, 3) * Math.PI * 2;
  const ox2 = (rng(seed, 5) - 0.5) * 0.18;
  const oz2 = (rng(seed, 6) - 0.5) * 0.18;
  const ox3 = (rng(seed, 7) - 0.5) * 0.12;
  const oz3 = (rng(seed, 8) - 0.5) * 0.12;

  return (
    <group position={[x, G, z]} rotation={[0, ry, 0]}>
      {/* Trunk */}
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[tw, h, tw]} />
        <meshStandardMaterial color={trunkColor} roughness={0.96} metalness={0.04} />
      </mesh>
      {/* Canopy — 3 layers, progressively narrower and brighter */}
      <mesh position={[0, h + 0.30, 0]}>
        <boxGeometry args={[0.80, 0.56, 0.80]} />
        <meshStandardMaterial color={foliageColor} emissive={foliageEmi} emissiveIntensity={0.65} roughness={0.88} />
      </mesh>
      <mesh position={[ox2, h + 0.72, oz2]}>
        <boxGeometry args={[0.56, 0.48, 0.56]} />
        <meshStandardMaterial color={foliageColor} emissive={foliageEmi} emissiveIntensity={0.88} roughness={0.88} />
      </mesh>
      <mesh position={[ox3, h + 1.07, oz3]}>
        <boxGeometry args={[0.32, 0.34, 0.32]} />
        <meshStandardMaterial color={foliageColor} emissive={foliageEmi} emissiveIntensity={1.15} roughness={0.88} />
      </mesh>
    </group>
  );
}

// ─── export ───────────────────────────────────────────────────────────────────

// Inner tree positions — inside the battlement ring (radius 6-10), away from board
const INNER_TREES = [
  { x: -4,   z: -7,   seed: 10 },
  { x:  0.5, z: -8.5, seed: 11 },
  { x:  4,   z: -7.5, seed: 12 },
  { x: -8.5, z: -2,   seed: 13 },
  { x: -9,   z:  4,   seed: 14 },
  { x:  8.5, z:  1,   seed: 15 },
  { x:  9,   z: -3.5, seed: 16 },
  { x: -7,   z:  8,   seed: 17 },
  { x:  7,   z:  8.5, seed: 18 },
];

export function WorldStage() {
  const { world } = useTheme();
  const {
    ground, courtyard, stoneEmissive, stone,
    terrain, terrainEmissive, glowA, glowB,
    treeTrunk, treeFoliage,
  } = world;

  // Outer trees — just past the battlement ring, radius 13-20
  const outerTrees = useMemo(() => {
    const out: { x: number; z: number; seed: number }[] = [];
    for (let i = 0; i < 22; i++) {
      const angle = rng(i * 6.11) * Math.PI * 2;
      const dist  = 13 + rng(i, i * 2) * 8;
      out.push({ x: Math.cos(angle) * dist, z: Math.sin(angle) * dist, seed: i + 30 });
    }
    return out;
  }, []);

  // Near towers (radius ~14, clearly visible) + distant towers (atmosphere/depth)
  const towers: { x: number; z: number; h: number; w: number; i: number }[] = [
    { x: -14, z:  -3, h:  8, w: 1.8, i: 1 },
    { x:  14, z:   2, h:  7, w: 1.8, i: 0 },
    { x:  -3, z: -15, h: 10, w: 2.0, i: 0 },
    { x:   5, z: -14, h:  6, w: 1.5, i: 1 },
    { x: -22, z: -18, h: 14, w: 2.5, i: 0 },
    { x: -12, z: -26, h: 20, w: 2.0, i: 1 },
    { x:   8, z: -23, h: 16, w: 2.0, i: 0 },
    { x:  18, z: -17, h: 12, w: 3.0, i: 1 },
    { x:  24, z:  -6, h: 18, w: 2.0, i: 0 },
    { x: -26, z:   2, h:  9, w: 3.5, i: 1 },
    { x: -20, z:  16, h: 15, w: 2.0, i: 0 },
  ];

  return (
    <group>
      <Ground groundColor={ground} courtyardColor={courtyard} courtyardEmi={stoneEmissive} />

      {/* 4-sided battlement ring — all sitting on G */}
      <BattlementWall position={[0,   G, -11]} width={22} stone={stone} stoneEmi={stoneEmissive} />
      <BattlementWall position={[0,   G,  11]} rotation={[0, Math.PI, 0]}      width={22} stone={stone} stoneEmi={stoneEmissive} />
      <BattlementWall position={[-11, G,   0]} rotation={[0,  Math.PI / 2, 0]} width={22} stone={stone} stoneEmi={stoneEmissive} />
      <BattlementWall position={[11,  G,   0]} rotation={[0, -Math.PI / 2, 0]} width={22} stone={stone} stoneEmi={stoneEmissive} />

      {/* Corner posts */}
      <CornerPost x={-11} z={-11} stone={stone} stoneEmi={stoneEmissive} />
      <CornerPost x={ 11} z={-11} stone={stone} stoneEmi={stoneEmissive} />
      <CornerPost x={-11} z={ 11} stone={stone} stoneEmi={stoneEmissive} />
      <CornerPost x={ 11} z={ 11} stone={stone} stoneEmi={stoneEmissive} />

      {/* Torches mounted on corner posts */}
      <Torch position={[-10.5, G + 0.9, -10.5]} />
      <Torch position={[ 10.5, G + 0.9, -10.5]} />
      <Torch position={[-10.5, G + 0.9,  10.5]} />
      <Torch position={[ 10.5, G + 0.9,  10.5]} />

      {/* Inner courtyard trees — grounded in the courtyard between board and walls */}
      {INNER_TREES.map(({ x, z, seed }) => (
        <Tree key={seed} x={x} z={z} trunkColor={treeTrunk} foliageColor={treeFoliage} foliageEmi={glowA} seed={seed} />
      ))}

      {/* Outer terrain rubble */}
      <OuterTerrain color={terrain} emi={terrainEmissive} />
      <OuterGlowAccents glowA={glowA} glowB={glowB} />

      {/* Outer forest ring — just beyond the battlements */}
      {outerTrees.map(({ x, z, seed }) => (
        <Tree key={seed} x={x} z={z} trunkColor={treeTrunk} foliageColor={treeFoliage} foliageEmi={glowA} seed={seed} />
      ))}

      {/* Near + distant towers */}
      {towers.map(({ x, z, h, w, i }, idx) => (
        <Tower
          key={idx}
          x={x} z={z}
          height={h} width={w}
          glowColor={i === 0 ? glowA : glowB}
          stone={stone}
        />
      ))}
    </group>
  );
}
