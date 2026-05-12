import { useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { rng } from "../src/shared/rng";

const GROUND_TOP = -3;

// ─── terrain ──────────────────────────────────────────────────────────────────

function VoxelTerrain() {
  const ref = useRef<THREE.InstancedMesh>(null);

  const cubes = useMemo(() => {
    const out: [number, number, number, number][] = [];
    const HALF = 20;
    for (let gz = -HALF; gz < HALF; gz++) {
      for (let gx = -HALF; gx < HALF; gx++) {
        const r    = rng(gx + 0.5, gz + 0.5);
        const dist = Math.max(Math.abs(gx), Math.abs(gz));
        if (dist > 17 && rng(gx * 2, gz * 3) > 0.45) continue;

        let sy = 1;
        if (dist >= 7) {
          if      (r > 0.94) sy = 9;
          else if (r > 0.87) sy = 5;
          else if (r > 0.73) sy = 3;
          else if (r > 0.55) sy = 2;
        }
        out.push([gx + 0.5, GROUND_TOP - sy / 2, gz + 0.5, sy]);
      }
    }
    return out;
  }, []);

  const geo = useMemo(() => new THREE.BoxGeometry(0.92, 1, 0.92), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#091523", roughness: 0.92, metalness: 0.12,
    emissive: "#000a14", emissiveIntensity: 0.25,
  }), []);

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    cubes.forEach(([x, y, z, sy], i) => {
      dummy.position.set(x, y, z);
      dummy.scale.set(1, sy, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [cubes]);

  return <instancedMesh ref={ref} args={[geo, mat, cubes.length]} />;
}

// ─── glow accents ─────────────────────────────────────────────────────────────

function GlowAccents() {
  const cRef = useRef<THREE.InstancedMesh>(null);
  const rRef = useRef<THREE.InstancedMesh>(null);

  const geo  = useMemo(() => new THREE.BoxGeometry(0.35, 0.35, 0.35), []);
  const cMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#001520", emissive: "#00d2ff", emissiveIntensity: 4, toneMapped: false,
  }), []);
  const rMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#1a0008", emissive: "#ff0055", emissiveIntensity: 4, toneMapped: false,
  }), []);

  const [cyan, red] = useMemo(() => {
    const c: [number, number, number][] = [];
    const r: [number, number, number][] = [];
    for (let i = 0; i < 90; i++) {
      const ang    = rng(i * 4.13) * Math.PI * 2;
      const d      = 8 + rng(i, i * 2) * 12;
      const stackH = rng(i * 5, i) * 5;
      const pos: [number, number, number] = [
        Math.cos(ang) * d,
        GROUND_TOP + stackH + 0.2,
        Math.sin(ang) * d,
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
      <instancedMesh ref={rRef} args={[geo, rMat, red.length]}  />
    </>
  );
}

// ─── background tower ─────────────────────────────────────────────────────────

function Tower({ x, z, height, width = 2, winColor = "cyan" }: {
  x: number; z: number; height: number; width?: number; winColor?: "cyan" | "red";
}) {
  const half      = width / 2;
  const topY      = GROUND_TOP + height;
  const centerY   = GROUND_TOP + height / 2;
  const emissive  = winColor === "cyan" ? "#00d2ff" : "#ff0055";
  const emBase    = winColor === "cyan" ? "#001020" : "#1a0008";

  const merlonCount = Math.max(1, Math.floor(width * 1.5));
  const merlonStep  = width / (merlonCount + 1);

  const cornerDX: [number, number][] = [
    [ half - 0.25,  half - 0.25],
    [ half - 0.25, -(half - 0.25)],
    [-(half - 0.25),  half - 0.25],
    [-(half - 0.25), -(half - 0.25)],
  ];

  return (
    <group>
      {/* body */}
      <mesh position={[x, centerY, z]}>
        <boxGeometry args={[width, height, width]} />
        <meshStandardMaterial
          color="#0c1c2e" roughness={0.88} metalness={0.2}
          emissive="#000c1a" emissiveIntensity={0.2}
        />
      </mesh>

      {/* corner pillars */}
      {cornerDX.map(([dx, dz], i) => (
        <mesh key={i} position={[x + dx, topY + 0.4, z + dz]}>
          <boxGeometry args={[0.5, 0.8, 0.5]} />
          <meshStandardMaterial color="#0a1828" roughness={0.9} />
        </mesh>
      ))}

      {/* merlons – front face */}
      {Array.from({ length: merlonCount }).map((_, i) => (
        <mesh key={i} position={[x - half + (i + 1) * merlonStep, topY + 0.3, z - half]}>
          <boxGeometry args={[merlonStep * 0.65, 0.65, 0.5]} />
          <meshStandardMaterial color="#0a1828" roughness={0.9} />
        </mesh>
      ))}

      {/* window slits */}
      {([0.28, 0.55, 0.8] as const).map((t, i) =>
        rng(x + i * 13.7, z + i * 9.1) > 0.35 ? (
          <mesh key={i} position={[x + half + 0.01, GROUND_TOP + height * t, z]}>
            <boxGeometry args={[0.06, 0.45, 0.22]} />
            <meshStandardMaterial
              color={emBase} emissive={emissive}
              emissiveIntensity={3} toneMapped={false}
            />
          </mesh>
        ) : null
      )}
    </group>
  );
}

// ─── floating voxel chunk ─────────────────────────────────────────────────────

function FloatingChunk({ x, y, z, seed }: { x: number; y: number; z: number; seed: number }) {
  const ref = useRef<THREE.Group>(null);

  const blocks = useMemo(() => {
    const out: [number, number, number][] = [];
    for (let dy = -1; dy <= 2; dy++)
      for (let dz = -1; dz <= 1; dz++)
        for (let dx = -1; dx <= 1; dx++)
          if (rng(dx + seed * 5, dz + dy * 3 + seed) > 0.38)
            out.push([dx, dy, dz]);
    return out;
  }, [seed]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * 0.25 + seed * 2.7;
    ref.current.position.y  = y + Math.sin(t) * 0.4;
    ref.current.rotation.y  = clock.getElapsedTime() * 0.07 + seed;
  });

  const glowColor = seed % 2 === 0 ? "#00d2ff" : "#ff0055";
  const glowBase  = seed % 2 === 0 ? "#001428" : "#1a0010";

  return (
    <group ref={ref} position={[x, y, z]}>
      {blocks.map(([dx, dy, dz], i) => (
        <mesh key={i} position={[dx * 0.72, dy * 0.72, dz * 0.72]}>
          <boxGeometry args={[0.68, 0.68, 0.68]} />
          <meshStandardMaterial
            color="#0e2040" roughness={0.82} metalness={0.25}
            emissive="#001424" emissiveIntensity={0.3}
          />
        </mesh>
      ))}
      {/* glowing orb underneath */}
      <mesh position={[0, -1.1, 0]}>
        <boxGeometry args={[0.22, 0.22, 0.22]} />
        <meshStandardMaterial
          color={glowBase} emissive={glowColor}
          emissiveIntensity={5} toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// ─── export ───────────────────────────────────────────────────────────────────

export function VoxelWorld() {
  return (
    <group>
      <VoxelTerrain />
      <GlowAccents />

      <Tower x={-14} z={-8}  height={14} width={3} winColor="cyan" />
      <Tower x={-9}  z={-11} height={20} width={2} winColor="red"  />
      <Tower x={-3}  z={-13} height={10} width={4} winColor="cyan" />
      <Tower x={3}   z={-12} height={16} width={2} winColor="cyan" />
      <Tower x={8}   z={-10} height={12} width={3} winColor="red"  />
      <Tower x={14}  z={-8}  height={18} width={2} winColor="cyan" />
      <Tower x={17}  z={-9}  height={8}  width={3} winColor="red"  />
      <Tower x={-18} z={-6}  height={7}  width={4} winColor="cyan" />

      <FloatingChunk x={-9}  y={3} z={-4} seed={0} />
      <FloatingChunk x={8}   y={5} z={-6} seed={1} />
      <FloatingChunk x={-2}  y={7} z={-9} seed={2} />
      <FloatingChunk x={12}  y={4} z={-3} seed={3} />
      <FloatingChunk x={-13} y={4} z={-5} seed={4} />
    </group>
  );
}
