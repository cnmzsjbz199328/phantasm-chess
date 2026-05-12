import { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useTheme } from "../../shared/ThemeContext";
import { WORLD_GROUND_Y } from "./WorldStage";

const SQUARE_GEO = new THREE.PlaneGeometry(1, 1);
const ROTATION = new THREE.Euler(-Math.PI / 2, 0, 0);
const ROTATION_Q = new THREE.Quaternion().setFromEuler(ROTATION);
const SCALE_ONE = new THREE.Vector3(1, 1, 1);

export function Board() {
  const darkRef  = useRef<THREE.InstancedMesh>(null);
  const lightRef = useRef<THREE.InstancedMesh>(null);
  const theme = useTheme();

  const darkMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: theme.board.dark,
    metalness: 0.4,
    roughness: 0.5,
    emissive: theme.board.darkEmissive,
    emissiveIntensity: theme.board.emissiveIntensity,
  }), [theme]);

  const lightMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: theme.board.light,
    metalness: 0.4,
    roughness: 0.5,
    emissive: theme.board.lightEmissive,
    emissiveIntensity: theme.board.emissiveIntensity,
  }), [theme]);

  useEffect(() => { if (darkRef.current)  darkRef.current.material  = darkMat;  return () => darkMat.dispose();  }, [darkMat]);
  useEffect(() => { if (lightRef.current) lightRef.current.material = lightMat; return () => lightMat.dispose(); }, [lightMat]);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    dummy.quaternion.copy(ROTATION_Q);
    dummy.scale.copy(SCALE_ONE);

    let darkIdx = 0;
    let lightIdx = 0;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        dummy.position.set(col - 3.5, -0.05, row - 3.5);
        dummy.updateMatrix();
        const isDark = (row + col) % 2 === 1;
        if (isDark) {
          darkRef.current?.setMatrixAt(darkIdx++, dummy.matrix);
        } else {
          lightRef.current?.setMatrixAt(lightIdx++, dummy.matrix);
        }
      }
    }

    if (darkRef.current)  darkRef.current.instanceMatrix.needsUpdate  = true;
    if (lightRef.current) lightRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <group>
      <instancedMesh ref={darkRef}  args={[SQUARE_GEO, darkMat,  32]} />
      <instancedMesh ref={lightRef} args={[SQUARE_GEO, lightMat, 32]} />

      <gridHelper args={[8, 8, theme.board.gridMain, theme.board.gridSub]} position={[0, 0.001, 0]} />

      {/* Stone pedestal — top at y=-0.1 (board frame), bottom at WORLD_GROUND_Y (-0.7) */}
      <mesh position={[0, (WORLD_GROUND_Y - 0.1) / 2, 0]}>
        <boxGeometry args={[9.8, -0.1 - WORLD_GROUND_Y, 9.8]} />
        <meshStandardMaterial
          color={theme.board.frame}
          metalness={0.5}
          roughness={0.45}
          emissive={theme.board.darkEmissive}
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  );
}
