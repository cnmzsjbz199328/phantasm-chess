/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef } from "react";
import * as THREE from "three";

export function Board() {
  const squares = [];

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const isDark = (i + j) % 2 === 1;
      squares.push(
        <Square 
          key={`${i}-${j}`} 
          position={[i - 3.5, -0.05, j - 3.5] as any} 
          isDark={isDark} 
        />
      );
    }
  }

  return (
    <group>
      {squares}
      {/* Outer frame */}
      <mesh position={[0, -0.1, 0] as any} rotation={[-Math.PI / 2, 0, 0] as any}>
        <planeGeometry args={[9, 9]} />
        <meshStandardMaterial color="#050510" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Cinematic grid lines */}
      <gridHelper args={[8, 8, "#333", "#111"]} position={[0, 0.001, 0] as any} />
    </group>
  );
}

function Square({ isDark, position }: { isDark: boolean; position: any }) {
  const color = isDark ? "#0a0a1a" : "#1a1a2a";
  
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0] as any}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial 
        color={color} 
        metalness={0.5} 
        roughness={0.3} 
        emissive={isDark ? "#000" : "#001122"}
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}
