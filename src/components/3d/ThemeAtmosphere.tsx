import { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useTheme } from "../../shared/ThemeContext";
import { rng } from "../../shared/rng";
import { WORLD_GROUND_Y as G } from "./WorldStage";
import type { WorldTheme } from "../../shared/themes";

// ─── module-level position seeds (deterministic) ──────────────────────────────

const INNER_POS = [
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

const OUTER_POS = Array.from({ length: 22 }, (_, i) => {
  const angle = rng(i * 6.11) * Math.PI * 2;
  const dist  = 13 + rng(i, i * 2) * 8;
  return { x: Math.cos(angle) * dist, z: Math.sin(angle) * dist, seed: i + 30 };
});

const ALL_VEG_POS = [...INNER_POS, ...OUTER_POS];

const TOWER_DEF = [
  { x: -14, z:  -3, h:  8, w: 1.8, gi: 1 },
  { x:  14, z:   2, h:  7, w: 1.8, gi: 0 },
  { x:  -3, z: -15, h: 10, w: 2.0, gi: 0 },
  { x:   5, z: -14, h:  6, w: 1.5, gi: 1 },
  { x: -22, z: -18, h: 14, w: 2.5, gi: 0 },
  { x: -12, z: -26, h: 20, w: 2.0, gi: 1 },
  { x:   8, z: -23, h: 16, w: 2.0, gi: 0 },
  { x:  18, z: -17, h: 12, w: 3.0, gi: 1 },
  { x:  24, z:  -6, h: 18, w: 2.0, gi: 0 },
  { x: -26, z:   2, h:  9, w: 3.5, gi: 1 },
  { x: -20, z:  16, h: 15, w: 2.0, gi: 0 },
] as const;

// ─── Tower (shared by all themes) ─────────────────────────────────────────────

function Tower({
  x, z, height, width = 2.5, glowColor, stone, heightScale = 1, widthScale = 1,
}: {
  x: number; z: number; height: number; width?: number;
  glowColor: string; stone: string;
  heightScale?: number; widthScale?: number;
}) {
  const h   = height * heightScale;
  const w   = width  * widthScale;
  const topY       = G + h;
  const centerY    = G + h / 2;
  const merlonCount = Math.max(2, Math.floor(w * 1.2));

  return (
    <group>
      <mesh position={[x, centerY, z]}>
        <boxGeometry args={[w, h, w]} />
        <meshStandardMaterial color={stone} roughness={0.9} metalness={0.15} emissive="#010204" emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[x + w / 2 + 0.01, G + h * 0.65, z]}>
        <boxGeometry args={[0.05, 0.5, 0.28]} />
        <meshStandardMaterial color="#000" emissive={glowColor} emissiveIntensity={3} toneMapped={false} />
      </mesh>
      {Array.from({ length: merlonCount }).map((_, i) => {
        const step = w / (merlonCount + 1);
        return (
          <mesh key={i} position={[x - w / 2 + (i + 1) * step, topY + 0.2, z - w / 2]}>
            <boxGeometry args={[step * 0.6, 0.4, 0.35]} />
            <meshStandardMaterial color={stone} roughness={0.95} />
          </mesh>
        );
      })}
    </group>
  );
}

function Towers({ world, heightScale = 1, widthScale = 1 }: { world: WorldTheme; heightScale?: number; widthScale?: number }) {
  return (
    <>
      {TOWER_DEF.map(({ x, z, h, w, gi }, idx) => (
        <Tower
          key={idx} x={x} z={z} height={h} width={w}
          glowColor={gi === 0 ? world.glowA : world.glowB}
          stone={world.stone}
          heightScale={heightScale} widthScale={widthScale}
        />
      ))}
    </>
  );
}

// ─── Tree (abyss + jade themes) ───────────────────────────────────────────────

function Tree({ x, z, trunkColor, foliageColor, foliageEmi, seed }: {
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
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[tw, h, tw]} />
        <meshStandardMaterial color={trunkColor} roughness={0.96} metalness={0.04} />
      </mesh>
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

// ─── abyss ────────────────────────────────────────────────────────────────────
// Tall void-pillar terrain; 25% blocks float above ground. Cyan + crimson crystal accents.

function AbyssTerrain({ color, emi }: { color: string; emi: string }) {
  const ref = useRef<THREE.InstancedMesh>(null);

  const blocks = useMemo(() => {
    return Array.from({ length: 240 }, (_, i) => {
      const angle  = rng(i * 7.3) * Math.PI * 2;
      const dist   = 12 + rng(i, i * 3) * 26;
      const sx     = 0.4 + rng(i * 2) * 1.5;
      const sy     = 1.5 + rng(i * 3, i) * 7.0;
      const sz     = 0.4 + rng(i * 5) * 1.5;
      const floatY = rng(i * 13, i * 5) > 0.75 ? rng(i * 17) * 3.0 : 0;
      return {
        x: Math.cos(angle) * dist, z: Math.sin(angle) * dist,
        y: G + sy / 2 + floatY, sx, sy, sz,
        ry: rng(i * 11) * Math.PI * 2,
      };
    });
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
  }, [blocks, geo, mat]);

  return <instancedMesh ref={ref} args={[geo, mat, blocks.length]} />;
}

function AbyssGlowAccents({ glowA, glowB }: { glowA: string; glowB: string }) {
  const aRef = useRef<THREE.InstancedMesh>(null);
  const bRef = useRef<THREE.InstancedMesh>(null);

  const geo  = useMemo(() => new THREE.BoxGeometry(0.3, 0.3, 0.3), []);
  const aMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#000", emissive: glowA, emissiveIntensity: 3.5, toneMapped: false }),
    [glowA]
  );
  const bMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#000", emissive: glowB, emissiveIntensity: 3.5, toneMapped: false }),
    [glowB]
  );

  useEffect(() => () => aMat.dispose(), [aMat]);
  useEffect(() => () => bMat.dispose(), [bMat]);

  const [ptA, ptB] = useMemo(() => {
    const a: [number, number, number][] = [];
    const b: [number, number, number][] = [];
    for (let i = 0; i < 80; i++) {
      const angle  = rng(i * 4.13) * Math.PI * 2;
      const dist   = 13 + rng(i, i * 2) * 22;
      const blockH = 1.5 + rng(i * 3, i * 1.2) * 7.0;
      const floatY = rng(i * 13, i * 5) > 0.75 ? rng(i * 17) * 3.0 : 0;
      const pos: [number, number, number] = [
        Math.cos(angle) * dist,
        G + blockH + 0.18 + floatY,
        Math.sin(angle) * dist,
      ];
      if (rng(i * 11, i * 7) > 0.5) a.push(pos);
      else b.push(pos);
    }
    return [a, b] as const;
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
    apply(aRef.current, ptA);
    apply(bRef.current, ptB);
  }, [ptA, ptB, geo, aMat, bMat]);

  return (
    <>
      <instancedMesh ref={aRef} args={[geo, aMat, ptA.length]} />
      <instancedMesh ref={bRef} args={[geo, bMat, ptB.length]} />
    </>
  );
}

function AbyssAtmosphere({ world }: { world: WorldTheme }) {
  return (
    <group>
      <AbyssTerrain color={world.terrain} emi={world.terrainEmissive} />
      <AbyssGlowAccents glowA={world.glowA} glowB={world.glowB} />
      {ALL_VEG_POS.map(({ x, z, seed }) => (
        <Tree key={seed} x={x} z={z} trunkColor={world.treeTrunk} foliageColor={world.treeFoliage} foliageEmi={world.glowA} seed={seed} />
      ))}
      <Towers world={world} />
    </group>
  );
}

// ─── molten ───────────────────────────────────────────────────────────────────
// Flat scorched rock slabs; glowing lava cracks at ground level; charred stumps; squat forge towers.

function MoltenTerrain({ color, emi }: { color: string; emi: string }) {
  const ref = useRef<THREE.InstancedMesh>(null);

  const blocks = useMemo(() => {
    return Array.from({ length: 240 }, (_, i) => {
      const angle = rng(i * 7.3) * Math.PI * 2;
      const dist  = 12 + rng(i, i * 3) * 26;
      const sx    = 1.2 + rng(i * 2) * 3.5;
      const sy    = 0.25 + rng(i * 3, i) * 1.0;
      const sz    = 1.2 + rng(i * 5) * 3.5;
      return {
        x: Math.cos(angle) * dist, z: Math.sin(angle) * dist,
        y: G + sy / 2, sx, sy, sz,
        ry: rng(i * 11) * Math.PI * 2,
      };
    });
  }, []);

  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color, roughness: 0.98, metalness: 0.06, emissive: emi, emissiveIntensity: 0.25 }),
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
  }, [blocks, geo, mat]);

  return <instancedMesh ref={ref} args={[geo, mat, blocks.length]} />;
}

function LavaCracks({ glowA }: { glowA: string }) {
  const ref = useRef<THREE.InstancedMesh>(null);

  const cracks = useMemo(() => {
    return Array.from({ length: 80 }, (_, i) => {
      const angle = rng(i * 3.71) * Math.PI * 2;
      const dist  = 11 + rng(i, i * 2) * 28;
      return {
        x: Math.cos(angle) * dist, z: Math.sin(angle) * dist,
        sx: 0.06 + rng(i * 7) * 0.08,
        sz: 1.5  + rng(i * 5) * 5.0,
        ry: rng(i * 13) * Math.PI,
      };
    });
  }, []);

  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#000", emissive: glowA, emissiveIntensity: 5.0, toneMapped: false }),
    [glowA]
  );

  useEffect(() => () => mat.dispose(), [mat]);

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    cracks.forEach(({ x, z, sx, sz, ry }, i) => {
      dummy.position.set(x, G + 0.006, z);
      dummy.scale.set(sx, 0.01, sz);
      dummy.rotation.set(0, ry, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [cracks, geo, mat]);

  return <instancedMesh ref={ref} args={[geo, mat, cracks.length]} />;
}

function CharredStump({ x, z, seed, color }: { x: number; z: number; seed: number; color: string }) {
  const h    = 0.5 + rng(seed, 1) * 0.9;
  const tw   = 0.15 + rng(seed, 2) * 0.09;
  const ry   = rng(seed, 3) * Math.PI * 2;
  const nubX = (rng(seed, 9) - 0.5) * 0.12;
  const nubH = 0.12 + rng(seed, 10) * 0.22;

  return (
    <group position={[x, G, z]} rotation={[0, ry, 0]}>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[tw, h, tw]} />
        <meshStandardMaterial color={color} roughness={0.99} metalness={0.02} />
      </mesh>
      <mesh position={[nubX, h + nubH / 2, 0]}>
        <boxGeometry args={[tw * 0.55, nubH, tw * 0.55]} />
        <meshStandardMaterial color={color} roughness={0.99} />
      </mesh>
    </group>
  );
}

function MoltenAtmosphere({ world }: { world: WorldTheme }) {
  return (
    <group>
      <MoltenTerrain color={world.terrain} emi={world.terrainEmissive} />
      <LavaCracks glowA={world.glowA} />
      {ALL_VEG_POS.map(({ x, z, seed }) => (
        <CharredStump key={seed} x={x} z={z} seed={seed} color={world.treeTrunk} />
      ))}
      <Towers world={world} heightScale={0.7} widthScale={1.4} />
    </group>
  );
}

// ─── frost ────────────────────────────────────────────────────────────────────
// Ice-spike terrain (ConeGeometry); tall thin frost crystal accents; crystalline tree forms.

function IceSpikeTerrain({ glowA }: { glowA: string }) {
  const ref = useRef<THREE.InstancedMesh>(null);

  const spikes = useMemo(() => {
    return Array.from({ length: 220 }, (_, i) => {
      const angle = rng(i * 7.3) * Math.PI * 2;
      const dist  = 11 + rng(i, i * 3) * 28;
      return {
        x: Math.cos(angle) * dist, z: Math.sin(angle) * dist,
        r: 0.1 + rng(i * 2) * 0.25,
        h: 1.5 + rng(i * 3, i) * 7.0,
        ry:   rng(i * 11) * Math.PI * 2,
        tilt: (rng(i * 19) - 0.5) * 0.3,
      };
    });
  }, []);

  const geo = useMemo(() => new THREE.ConeGeometry(1, 1, 6), []);
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#8cc8ee", emissive: glowA, emissiveIntensity: 0.4, roughness: 0.1, metalness: 0.7 }),
    [glowA]
  );

  useEffect(() => () => mat.dispose(), [mat]);

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    spikes.forEach(({ x, z, r, h, ry, tilt }, i) => {
      dummy.position.set(x, G + h / 2, z);
      dummy.scale.set(r, h, r);
      dummy.rotation.set(tilt, ry, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [spikes, geo, mat]);

  return <instancedMesh ref={ref} args={[geo, mat, spikes.length]} />;
}

function FrostCrystalAccents({ glowA, glowB }: { glowA: string; glowB: string }) {
  type CrystalPt = { x: number; y: number; z: number; sx: number; sy: number; ry: number };
  const aRef = useRef<THREE.InstancedMesh>(null);
  const bRef = useRef<THREE.InstancedMesh>(null);

  const geo  = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const aMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#aaddff", emissive: glowA, emissiveIntensity: 4.0, toneMapped: false, roughness: 0.05, metalness: 0.8 }),
    [glowA]
  );
  const bMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#ddeeff", emissive: glowB, emissiveIntensity: 2.5, toneMapped: false, roughness: 0.05, metalness: 0.8 }),
    [glowB]
  );

  useEffect(() => () => aMat.dispose(), [aMat]);
  useEffect(() => () => bMat.dispose(), [bMat]);

  const [ptA, ptB] = useMemo(() => {
    const a: CrystalPt[] = [];
    const b: CrystalPt[] = [];
    for (let i = 0; i < 90; i++) {
      const angle = rng(i * 4.13) * Math.PI * 2;
      const dist  = 12 + rng(i, i * 2) * 24;
      const sy    = 1.0 + rng(i * 3) * 4.5;
      const item: CrystalPt = {
        x: Math.cos(angle) * dist, z: Math.sin(angle) * dist,
        y: G + sy / 2, sx: 0.1 + rng(i * 7) * 0.18, sy,
        ry: rng(i * 11) * Math.PI * 2,
      };
      if (rng(i * 17) > 0.5) a.push(item);
      else b.push(item);
    }
    return [a, b] as const;
  }, []);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    const apply = (mesh: THREE.InstancedMesh | null, pts: CrystalPt[]) => {
      if (!mesh) return;
      pts.forEach(({ x, y, z, sx, sy, ry }, i) => {
        dummy.position.set(x, y, z);
        dummy.scale.set(sx, sy, sx);
        dummy.rotation.set(0, ry, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    };
    apply(aRef.current, ptA);
    apply(bRef.current, ptB);
  }, [ptA, ptB, geo, aMat, bMat]);

  return (
    <>
      <instancedMesh ref={aRef} args={[geo, aMat, ptA.length]} />
      <instancedMesh ref={bRef} args={[geo, bMat, ptB.length]} />
    </>
  );
}

function IceCrystalTree({ x, z, seed, glowA }: { x: number; z: number; seed: number; glowA: string }) {
  const h      = 1.0 + rng(seed, 1) * 1.2;
  const ry     = rng(seed, 3) * Math.PI * 2;
  const spires = useMemo(
    () => Array.from({ length: 3 + Math.floor(rng(seed, 20) * 3) }, (_, j) => ({
      ox: (rng(seed, j * 3 + 50) - 0.5) * 0.5,
      oz: (rng(seed, j * 3 + 51) - 0.5) * 0.5,
      sh: 0.4 + rng(seed, j * 3 + 52) * 0.8,
      ry2: rng(seed, j + 60) * Math.PI,
    })),
    [seed]
  );

  return (
    <group position={[x, G, z]} rotation={[0, ry, 0]}>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[0.1, h, 0.1]} />
        <meshStandardMaterial color="#c8e8ff" roughness={0.05} metalness={0.8} />
      </mesh>
      {spires.map(({ ox, oz, sh, ry2 }, j) => (
        <mesh key={j} position={[ox, h + sh / 2, oz]} rotation={[0, ry2, 0]}>
          <boxGeometry args={[0.09, sh, 0.09]} />
          <meshStandardMaterial color="#aaddff" emissive={glowA} emissiveIntensity={2.0} roughness={0.05} metalness={0.85} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function FrostAtmosphere({ world }: { world: WorldTheme }) {
  return (
    <group>
      <IceSpikeTerrain glowA={world.glowA} />
      <FrostCrystalAccents glowA={world.glowA} glowB={world.glowB} />
      {ALL_VEG_POS.map(({ x, z, seed }) => (
        <IceCrystalTree key={seed} x={x} z={z} seed={seed} glowA={world.glowA} />
      ))}
      <Towers world={world} />
    </group>
  );
}

// ─── jade ─────────────────────────────────────────────────────────────────────
// Medium rubble terrain; tall jade crystal cluster accents; vine-wrapped columns; standard towers.

function JadeTerrain({ color, emi }: { color: string; emi: string }) {
  const ref = useRef<THREE.InstancedMesh>(null);

  const blocks = useMemo(() => {
    return Array.from({ length: 220 }, (_, i) => {
      const angle = rng(i * 7.3) * Math.PI * 2;
      const dist  = 12 + rng(i, i * 3) * 26;
      const sx    = 0.6 + rng(i * 2) * 2.2;
      const sy    = 0.5 + rng(i * 3, i) * 2.8;
      const sz    = 0.6 + rng(i * 5) * 2.2;
      return {
        x: Math.cos(angle) * dist, z: Math.sin(angle) * dist,
        y: G + sy / 2, sx, sy, sz,
        ry: rng(i * 11) * Math.PI * 2,
      };
    });
  }, []);

  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0.18, emissive: emi, emissiveIntensity: 0.3 }),
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
  }, [blocks, geo, mat]);

  return <instancedMesh ref={ref} args={[geo, mat, blocks.length]} />;
}

function JadeCrystalClusters({ glowA, glowB }: { glowA: string; glowB: string }) {
  type CrystalPt = { x: number; y: number; z: number; sx: number; sy: number; ry: number; rx: number };
  const aRef = useRef<THREE.InstancedMesh>(null);
  const bRef = useRef<THREE.InstancedMesh>(null);

  const geo  = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const aMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#004428", emissive: glowA, emissiveIntensity: 5.0, toneMapped: false }),
    [glowA]
  );
  const bMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#220044", emissive: glowB, emissiveIntensity: 4.5, toneMapped: false }),
    [glowB]
  );

  useEffect(() => () => aMat.dispose(), [aMat]);
  useEffect(() => () => bMat.dispose(), [bMat]);

  const [ptA, ptB] = useMemo(() => {
    const a: CrystalPt[] = [];
    const b: CrystalPt[] = [];
    for (let ci = 0; ci < 40; ci++) {
      const cAngle = rng(ci * 4.13) * Math.PI * 2;
      const cDist  = 12 + rng(ci, ci * 2) * 24;
      const cx     = Math.cos(cAngle) * cDist;
      const cz     = Math.sin(cAngle) * cDist;
      const count  = 3 + Math.floor(rng(ci * 7) * 3);
      for (let j = 0; j < count; j++) {
        const ox  = (rng(ci * 3 + j * 17) - 0.5) * 1.2;
        const oz  = (rng(ci * 5 + j * 19) - 0.5) * 1.2;
        const sy  = 0.8 + rng(ci * 7 + j * 11) * 3.5;
        const item: CrystalPt = {
          x: cx + ox, z: cz + oz, y: G + sy / 2,
          sx: 0.08 + rng(ci * 11 + j) * 0.14, sy,
          ry: rng(ci * 13 + j * 7) * Math.PI * 2,
          rx: (rng(ci + j * 13) - 0.5) * 0.4,
        };
        if (rng(ci * 2 + j) > 0.35) a.push(item);
        else b.push(item);
      }
    }
    return [a, b] as const;
  }, []);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    const apply = (mesh: THREE.InstancedMesh | null, pts: CrystalPt[]) => {
      if (!mesh) return;
      pts.forEach(({ x, y, z, sx, sy, ry, rx }, i) => {
        dummy.position.set(x, y, z);
        dummy.scale.set(sx, sy, sx);
        dummy.rotation.set(rx, ry, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    };
    apply(aRef.current, ptA);
    apply(bRef.current, ptB);
  }, [ptA, ptB, geo, aMat, bMat]);

  return (
    <>
      <instancedMesh ref={aRef} args={[geo, aMat, ptA.length]} />
      <instancedMesh ref={bRef} args={[geo, bMat, ptB.length]} />
    </>
  );
}

function VineColumn({ x, z, seed, color, emi }: { x: number; z: number; seed: number; color: string; emi: string }) {
  const totalH   = 1.5 + rng(seed, 1) * 2.5;
  const segments = 5 + Math.floor(rng(seed, 2) * 4);
  const segH     = totalH / segments;
  const ry       = rng(seed, 3) * Math.PI * 2;

  return (
    <group position={[x, G, z]} rotation={[0, ry, 0]}>
      {Array.from({ length: segments }, (_, j) => {
        const ox = (rng(seed, j * 3 + 20) - 0.5) * 0.22;
        const oz = (rng(seed, j * 3 + 21) - 0.5) * 0.22;
        const sw = 0.18 + rng(seed, j + 30) * 0.12;
        return (
          <mesh key={j} position={[ox, j * segH + segH / 2, oz]}>
            <boxGeometry args={[sw, segH * 0.88, sw]} />
            <meshStandardMaterial color={color} emissive={emi} emissiveIntensity={0.5} roughness={0.94} metalness={0.1} />
          </mesh>
        );
      })}
    </group>
  );
}

function JadeAtmosphere({ world }: { world: WorldTheme }) {
  return (
    <group>
      <JadeTerrain color={world.terrain} emi={world.terrainEmissive} />
      <JadeCrystalClusters glowA={world.glowA} glowB={world.glowB} />
      {ALL_VEG_POS.map(({ x, z, seed }) => (
        <VineColumn key={seed} x={x} z={z} seed={seed} color={world.treeTrunk} emi={world.glowA} />
      ))}
      <Towers world={world} />
    </group>
  );
}

// ─── arena ────────────────────────────────────────────────────────────────────
// Dusty rubble terrain; broken columns; golden banners.

function ArenaTerrain({ color, emi }: { color: string; emi: string }) {
  const ref = useRef<THREE.InstancedMesh>(null);

  const blocks = useMemo(() => {
    return Array.from({ length: 180 }, (_, i) => {
      const angle = rng(i * 7.3) * Math.PI * 2;
      const dist  = 13 + rng(i, i * 3) * 25;
      const sx    = 0.5 + rng(i * 2) * 2.0;
      const sy    = 0.2 + rng(i * 3, i) * 1.5;
      const sz    = 0.5 + rng(i * 5) * 2.0;
      return {
        x: Math.cos(angle) * dist, z: Math.sin(angle) * dist,
        y: G + sy / 2, sx, sy, sz,
        ry: rng(i * 11) * Math.PI * 2,
        rx: (rng(i * 13) - 0.5) * 0.3,
      };
    });
  }, []);

  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color, roughness: 0.95, metalness: 0.05, emissive: emi, emissiveIntensity: 0.1 }),
    [color, emi]
  );

  useEffect(() => () => geo.dispose(), [geo]);
  useEffect(() => () => mat.dispose(), [mat]);

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    blocks.forEach(({ x, y, z, sx, sy, sz, ry, rx }, i) => {
      dummy.position.set(x, y, z);
      dummy.scale.set(sx, sy, sz);
      dummy.rotation.set(rx, ry, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [blocks, geo, mat]);

  return <instancedMesh ref={ref} args={[geo, mat, blocks.length]} />;
}

function ArenaBanner({ x, z, color, seed }: { x: number; z: number; color: string; seed: number }) {
  const h = 4.5;
  const ry = rng(seed, 1) * Math.PI * 2;
  return (
    <group position={[x, G, z]} rotation={[0, ry, 0]}>
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[0.06, 0.06, h, 8]} />
        <meshStandardMaterial color="#3d2b1f" roughness={0.9} />
      </mesh>
      <mesh position={[0.45, h - 0.8, 0]}>
        <boxGeometry args={[0.9, 1.5, 0.05]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0.45, h - 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 1.1, 8]} />
        <meshStandardMaterial color="#3d2b1f" />
      </mesh>
    </group>
  );
}

function ArenaAtmosphere({ world }: { world: WorldTheme }) {
  const bannerPos = [
    { x: -15, z: -15 }, { x: 15, z: -15 }, { x: -15, z: 15 }, { x: 15, z: 15 },
    { x: 0, z: -18 }, { x: 0, z: 18 }, { x: -18, z: 0 }, { x: 18, z: 0 },
  ];

  return (
    <group>
      <ArenaTerrain color={world.terrain} emi={world.terrainEmissive} />
      {bannerPos.map((pos, i) => (
        <ArenaBanner key={i} x={pos.x} z={pos.z} color="#b22222" seed={i + 100} />
      ))}
      <Towers world={world} heightScale={1.2} widthScale={0.8} />
    </group>
  );
}

// ─── export ───────────────────────────────────────────────────────────────────

export function ThemeAtmosphere() {
  const { world } = useTheme();
  switch (world.variant) {
    case "molten": return <MoltenAtmosphere world={world} />;
    case "frost":  return <FrostAtmosphere  world={world} />;
    case "jade":   return <JadeAtmosphere   world={world} />;
    case "arena":  return <ArenaAtmosphere  world={world} />;
    default:       return <AbyssAtmosphere  world={world} />;
  }
}
