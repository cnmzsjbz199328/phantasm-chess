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

interface PieceInstance {
  id: string;
  type: string;
  color: "w" | "b";
  square: string;
  isCaptured: boolean;
}

export function PieceManager({ boardState, lastMove, isCapture }: { boardState: any[][], lastMove: any, isCapture: boolean }) {
  // We track the previous board to identify captured pieces for "death" animations
  const [prevBoard, setPrevBoard] = useState<any[][] | null>(null);
  
  useEffect(() => {
    setPrevBoard(boardState);
  }, [boardState]);

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
            />
          );
        })
      )}
    </group>
  );
}

function PieceWrapper({ position, type, color, isAttacking, isMoving }: any) {
  const groupRef = useRef<THREE.Group>(null);
  const [dissolve, setDissolve] = useState(0);

  useEffect(() => {
    if (!groupRef.current) return;

    if (isAttacking) {
      const tl = gsap.timeline();
      
      // Initial move-in dissolve
      setDissolve(1);
      tl.to({ val: 1 }, {
        val: 0,
        duration: 0.5,
        onUpdate: function() { setDissolve(this.targets()[0].val); }
      });

      // Piece-specific attack animations
      switch (type.toLowerCase()) {
        case 'p': // Pawn: Sharp jab
          tl.to(groupRef.current.position, { y: 0.5, duration: 0.1, ease: "power2.out" })
            .to(groupRef.current.position, { y: 0, duration: 0.3, ease: "bounce.out" });
          break;
        case 'n': // Knight: High jump arc
          tl.to(groupRef.current.position, { 
            y: 0.8, 
            duration: 0.4, 
            ease: "power2.out" 
          })
          .to(groupRef.current.rotation, { 
            x: Math.PI * 2, 
            duration: 0.4, 
            ease: "none" 
          }, "<")
          .to(groupRef.current.position, { 
            y: 0, 
            duration: 0.2, 
            ease: "power4.in" 
          });
          break;
        case 'b': // Bishop: Spiral dash
          tl.to(groupRef.current.rotation, { 
            y: Math.PI * 4, 
            duration: 0.6, 
            ease: "power2.inOut" 
          })
          .to(groupRef.current.position, { 
            y: 0.8, 
            duration: 0.3, 
            yoyo: true, 
            repeat: 1 
          }, "<");
          break;
        case 'r': // Rook: Heavy tremor
          tl.to(groupRef.current.position, { 
            x: "+=0.1", 
            duration: 0.05, 
            repeat: 5, 
            yoyo: true 
          })
          .to(groupRef.current.position, { 
            y: 1, 
            duration: 0.2 
          })
          .to(groupRef.current.position, { 
            y: 0, 
            duration: 0.1, 
            ease: "power4.in" 
          });
          break;
        case 'q': // Queen: Divine ascent
          tl.to(groupRef.current.position, { 
            y: 1.5, 
            duration: 0.8, 
            ease: "back.out(1.7)" 
          })
          .to(groupRef.current.rotation, { 
            y: Math.PI * 6, 
            duration: 1.2, 
            ease: "none" 
          }, 0)
          .to(groupRef.current.position, { 
            y: 0, 
            duration: 0.3, 
            ease: "power4.in" 
          });
          break;
        case 'k': // King: Royal shockwave
          tl.to(groupRef.current.scale, { 
            x: 1.5, y: 1.5, z: 1.5, 
            duration: 0.4, 
            ease: "power2.out" 
          })
          .to(groupRef.current.scale, { 
            x: 1, y: 1, z: 1, 
            duration: 0.2, 
            ease: "expo.in" 
          });
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
      // Small horizontal shake instead of vertical drop
      gsap.from(groupRef.current.position, { 
        x: "+=0.05",
        duration: 0.2,
        repeat: 2,
        yoyo: true
      });
    }
  }, [isAttacking, isMoving, type]);

  return (
    <group ref={groupRef} position={position}>
      <VoxelPieceModel type={type} color={color} dissolve={dissolve} />
    </group>
  );
}
