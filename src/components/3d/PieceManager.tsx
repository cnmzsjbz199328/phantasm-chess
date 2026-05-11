import { useCallback, useRef, useEffect, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import type { Move, Piece } from "chess.js";
import { VoxelPieceModel } from "./VoxelPiece";
import { AttackEffect } from "./AttackEffect";
import { indexToPosition } from "../../lib/utils";
import { playAttackAnimation } from "../../shared/attackAnimations";
import type { Side, AttackEffectProps } from "../../shared/types";

interface EffectInstance extends Omit<AttackEffectProps, "onComplete"> {
  id: string;
}

interface PieceManagerProps {
  boardState: (Piece | null)[][];
  lastMove: Move | null;
  isCapture: boolean;
}

export function PieceManager({ boardState, lastMove, isCapture }: PieceManagerProps) {
  const [effects, setEffects] = useState<EffectInstance[]>([]);

  const addEffect = useCallback((pos: [number, number, number], pieceType: string, pieceColor: Side) => {
    const id = crypto.randomUUID();
    setEffects(prev => [...prev, { id, position: pos, pieceType, pieceColor }]);
  }, []);

  const removeEffect = useCallback((id: string) => {
    setEffects(prev => prev.filter(e => e.id !== id));
  }, []);

  return (
    <group>
      {boardState.map((row, rIdx) =>
        row.map((cell, cIdx) => {
          if (!cell) return null;
          const square = String.fromCharCode(97 + cIdx) + (8 - rIdx);
          const [x, , z] = indexToPosition(cIdx, rIdx);
          const isAttacker = lastMove?.to === square && isCapture;
          const isJustMoved = lastMove?.to === square && !isCapture;

          return (
            <PieceWrapper
              key={`${cell.color}${cell.type}-${square}`}
              position={[x, 0, z]}
              type={cell.type}
              color={cell.color}
              isAttacking={isAttacker}
              isMoving={isJustMoved}
              onImpact={() => addEffect([x, 0, z], cell.type, cell.color)}
            />
          );
        })
      )}
      {effects.map(eff => (
        <AttackEffect
          key={eff.id}
          position={eff.position}
          pieceType={eff.pieceType}
          pieceColor={eff.pieceColor}
          onComplete={() => removeEffect(eff.id)}
        />
      ))}
    </group>
  );
}

interface PieceWrapperProps {
  position: [number, number, number];
  type: string;
  color: Side;
  isAttacking: boolean;
  isMoving: boolean;
  onImpact: () => void;
}

function PieceWrapper({ position, type, color, isAttacking, isMoving, onImpact }: PieceWrapperProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [dissolve, setDissolve] = useState(0);

  useEffect(() => {
    if (!groupRef.current) return;
    const group = groupRef.current;
    group.position.set(0, 0, 0);
    group.rotation.set(0, 0, 0);

    if (isAttacking) {
      const proxy = { val: 1 };
      setDissolve(1);
      gsap.to(proxy, {
        val: 0, duration: 0.5,
        onUpdate() { setDissolve(proxy.val); },
      });
      playAttackAnimation(type, group, onImpact);
    } else if (isMoving) {
      const proxy = { val: 1 };
      setDissolve(1);
      gsap.to(proxy, {
        val: 0, duration: 0.8, ease: "power2.out",
        onUpdate() { setDissolve(proxy.val); },
      });
      gsap.from(group.position, { x: "+=0.04", duration: 0.15, repeat: 3, yoyo: true });
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
