/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { VoxelPieceModel } from "./VoxelPiece";
import { algebraicToIndex, indexToPosition } from "../../lib/utils";
import gsap from "gsap";
import { Chess } from "chess.js";
import { AttackEffect } from "./AttackEffect";

interface EffectInstance {
  id: string;
  position: [number, number, number];
  type: string;
  color: string;
  accentColor: string;
}

export function PieceManager({ boardState, lastMove, isCapture }: { boardState: any[][], lastMove: any, isCapture: boolean }) {
  const [effects, setEffects] = useState<EffectInstance[]>([]);

  const addEffect = (pos: [number, number, number], type: string, color: string, accentColor: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setEffects(prev => [...prev, { id, position: pos, type, color, accentColor }]);
    setTimeout(() => {
      setEffects(prev => prev.filter(e => e.id !== id));
    }, 1500);
  };

  return (
    <group>
      {boardState.map((row, rIdx) => 
        row.map((cell, cIdx) => {
          if (!cell) return null;
          const square = String.fromCharCode(97 + cIdx) + (8 - rIdx);
          const [x, y, z] = indexToPosition(cIdx, rIdx);
          const isAttacker = lastMove && (lastMove.to === square) && isCapture;
          const isJustMoved = lastMove && (lastMove.to === square) && !isCapture;

          return (
            <PieceWrapper 
              key={cell.color + cell.type + square + (cell.id || "")} 
              position={[x, 0, z]} 
              type={cell.type} 
              color={cell.color}
              isAttacking={isAttacker}
              isMoving={isJustMoved}
              onImpact={() => {
                // Determine effect colors based on specimen table
                const sideColors = cell.color === "w" ? {
                  glow: "#00f2ff",
                  accent: "#ffcc00"
                } : {
                  glow: "#ff0055",
                  accent: "#8e2de2"
                };
                // Impact happens at piece position (which is the 'to' square)
                addEffect([x, 0, z], cell.type, sideColors.glow, sideColors.accent);
              }}
            />
          );
        })
      )}
      {effects.map(effect => (
        <AttackEffect 
          key={effect.id}
          position={effect.position}
          type={effect.type}
          color={effect.color}
          accentColor={effect.accentColor}
        />
      ))}
    </group>
  );
}

function PieceWrapper({ position, type, color, isAttacking, isMoving, onImpact }: any) {
  const groupRef = useRef<THREE.Group>(null);
  const [dissolve, setDissolve] = useState(0);

  useEffect(() => {
    if (!groupRef.current) return;
    gsap.killTweensOf(groupRef.current.position);
    gsap.killTweensOf(groupRef.current.rotation);
    groupRef.current.position.set(0, 0, 0);
    groupRef.current.rotation.set(0, 0, 0);

    if (isAttacking) {
      const tl = gsap.timeline();
      
      // Initial move-in dissolve
      setDissolve(1);
      tl.to({ val: 1 }, {
        val: 0,
        duration: 0.5,
        onUpdate: function() { setDissolve(this.targets()[0].val); }
      });

      // Piece-specific attack animations from Section 5 of Spec
      switch (type.toLowerCase()) {
        case 'p': // Pawn: Sharp jab
          tl.to(groupRef.current.rotation, { x: -0.28, duration: 0.11, ease: "power2.in" })
            .to(groupRef.current.rotation, { x: 0.48, duration: 0.1, ease: "power4.in", onStart: onImpact })
            .to(groupRef.current.position, { z: 0.6, duration: 0.1, ease: "power4.in" }, "<")
            .to(groupRef.current.position, { z: 0, duration: 0.3, ease: "power2.out" })
            .to(groupRef.current.rotation, { x: 0, duration: 0.28, ease: "power2.out" }, "<");
          break;
        case 'n': // Knight: Rushing Charge
          tl.to(groupRef.current.rotation, { x: -0.22, duration: 0.14, ease: "power2.out" })
            .to(groupRef.current.position, { z: 1.1, duration: 0.19, ease: "power4.in", onStart: onImpact })
            .to(groupRef.current.rotation, { x: 0.18, duration: 0.19, ease: "power4.in" }, "<")
            .to(groupRef.current.position, { z: 0, duration: 0.42, ease: "power2.out" })
            .to(groupRef.current.rotation, { x: 0, duration: 0.28, ease: "power2.out" }, "<");
          break;
        case 'b': // Bishop: Cleric Beam
          tl.to(groupRef.current.rotation, { z: -0.22, duration: 0.2, ease: "power1.in" })
            .to(groupRef.current.rotation, { z: 0.08, duration: 0.09, ease: "power4.in", onStart: onImpact })
            .to(groupRef.current.rotation, { z: 0, duration: 0.35, ease: "power2.out" });
          break;
        case 'r': // Rook: Earth Shatter
          tl.to(groupRef.current.position, { y: 0.45, duration: 0.2, ease: "power2.out" })
            .to(groupRef.current.position, { y: 0, duration: 0.11, ease: "power4.in", onStart: onImpact })
            .to(groupRef.current.rotation, { x: 0.1, duration: 0.1, yoyo: true, repeat: 2, ease: "elastic.out(1.2, 0.4)" });
          break;
        case 'q': // Queen: Sovereign Burst
          tl.to(groupRef.current.rotation, { y: 0.32, duration: 0.16, ease: "power1.in" })
            .to(groupRef.current.rotation, { y: -0.12, z: 0.18, duration: 0.11, ease: "power4.in", onStart: onImpact })
            .to(groupRef.current.rotation, { y: 0, z: 0, duration: 0.38, ease: "power2.out" });
          break;
        case 'k': // King: Royal Sweep
          tl.to(groupRef.current.rotation, { z: 0.28, duration: 0.2, ease: "power1.in" })
            .to(groupRef.current.rotation, { z: -0.38, y: 0.22, duration: 0.16, ease: "power3.in", onStart: onImpact })
            .to(groupRef.current.rotation, { z: 0, y: 0, duration: 0.38, ease: "power2.out" });
          break;
      }
    } else if (isMoving) {
      setDissolve(1);
      gsap.to({ val: 1 }, {
        val: 0,
        duration: 0.8,
        ease: "power2.out",
        onUpdate: function() { setDissolve(this.targets()[0].val); }
      });
      gsap.from(groupRef.current.position, { 
        x: "+=0.04",
        duration: 0.15,
        repeat: 3,
        yoyo: true
      });
    }
  }, [isAttacking, isMoving, type, onImpact]);

  return (
    <group position={position}>
      <group ref={groupRef}>
        <VoxelPieceModel type={type} color={color} dissolve={dissolve} />
      </group>
    </group>
  );
}
