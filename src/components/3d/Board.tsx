import { useRef, useEffect } from "react";
import * as THREE from "three";

const SQUARE_GEO = new THREE.PlaneGeometry(1, 1);
const DARK_MAT  = new THREE.MeshStandardMaterial({ color: "#080810", metalness: 0.4, roughness: 0.5, emissive: "#000000", emissiveIntensity: 0.1 });
const LIGHT_MAT = new THREE.MeshStandardMaterial({ color: "#111120", metalness: 0.4, roughness: 0.5, emissive: "#000810", emissiveIntensity: 0.1 });

const ROTATION = new THREE.Euler(-Math.PI / 2, 0, 0);
const ROTATION_Q = new THREE.Quaternion().setFromEuler(ROTATION);
const SCALE_ONE = new THREE.Vector3(1, 1, 1);

export function Board() {
  const darkRef  = useRef<THREE.InstancedMesh>(null);
  const lightRef = useRef<THREE.InstancedMesh>(null);

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
      <instancedMesh ref={darkRef}  args={[SQUARE_GEO, DARK_MAT,  32]} />
      <instancedMesh ref={lightRef} args={[SQUARE_GEO, LIGHT_MAT, 32]} />

      {/* Outer frame */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9, 9]} />
        <meshStandardMaterial color="#050510" metalness={0.8} roughness={0.2} />
      </mesh>

      <gridHelper args={[8, 8, "#333", "#111"]} position={[0, 0.001, 0]} />
    </group>
  );
}
