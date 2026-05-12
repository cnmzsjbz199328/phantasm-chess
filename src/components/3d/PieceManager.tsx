import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import type { Move, Piece } from "chess.js";
import { HumanoidPieceModel } from "./HumanoidPiece";
import { AttackEffect } from "./AttackEffect";
import { algebraicToIndex, indexToPosition } from "../../lib/utils";
import { playAttackAnimation } from "../../shared/attackAnimations";
import type { Side, AttackEffectProps } from "../../shared/types";

type Vec3 = [number, number, number];

interface EffectInstance extends Omit<AttackEffectProps, "onComplete"> {
  id: string;
}

interface VisualPiece {
  id: string;
  square: string;
  type: string;
  color: Side;
  position: Vec3;
}

type PieceCommand =
  | { kind: "walk"; to: Vec3; promoteTo?: string }
  | { kind: "capture"; nearTo: Vec3; to: Vec3; promoteTo?: string }
  | { kind: "death" };

interface PieceManagerProps {
  boardState: (Piece | null)[][];
  lastMove: Move | null;
  currentStep: number;
  onAnimatingChange?: (isAnimating: boolean) => void;
}

function squareToPosition(square: string): Vec3 {
  const [col, row] = algebraicToIndex(square);
  return indexToPosition(col, row);
}

function boardToVisualPieces(boardState: (Piece | null)[][]): VisualPiece[] {
  return boardState.flatMap((row, rIdx) =>
    row.flatMap((cell, cIdx) => {
      if (!cell) return [];
      const square = String.fromCharCode(97 + cIdx) + (8 - rIdx);
      return [{
        id: `${cell.color}${cell.type}-${square}`,
        square,
        type: cell.type,
        color: cell.color,
        position: indexToPosition(cIdx, rIdx),
      }];
    })
  );
}

function getCaptureSquare(move: Move): string {
  if (move.flags.includes("e")) {
    return `${move.to[0]}${move.from[1]}`;
  }
  return move.to;
}

function getNearTarget(from: Vec3, to: Vec3): Vec3 {
  const direction = new THREE.Vector3(to[0] - from[0], 0, to[2] - from[2]).normalize();
  return [to[0] - direction.x * 0.45, 0, to[2] - direction.z * 0.45];
}

function getCastleRookSquares(move: Move): { from: string; to: string } | null {
  if (!move.flags.includes("k") && !move.flags.includes("q")) return null;
  const rank = move.color === "w" ? "1" : "8";
  return move.flags.includes("k")
    ? { from: `h${rank}`, to: `f${rank}` }
    : { from: `a${rank}`, to: `d${rank}` };
}

function getPromotionType(move: Move): string | undefined {
  return move.promotion || undefined;
}

export function PieceManager({ boardState, lastMove, currentStep, onAnimatingChange }: PieceManagerProps) {
  const boardPieces = useMemo(() => boardToVisualPieces(boardState), [boardState]);
  const [visualPieces, setVisualPieces] = useState<VisualPiece[]>(boardPieces);
  const [commands, setCommands] = useState<Record<string, PieceCommand>>({});
  const [effects, setEffects] = useState<EffectInstance[]>([]);
  const previousStepRef = useRef(currentStep);
  const visualPiecesRef = useRef(visualPieces);
  const boardPiecesRef = useRef(boardPieces);
  const pendingCompletionsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    visualPiecesRef.current = visualPieces;
  }, [visualPieces]);

  useEffect(() => {
    boardPiecesRef.current = boardPieces;
  }, [boardPieces]);

  const setAnimating = useCallback((isAnimating: boolean) => {
    onAnimatingChange?.(isAnimating);
  }, [onAnimatingChange]);

  const addEffect = useCallback((pos: Vec3, pieceType: string, pieceColor: Side) => {
    const id = crypto.randomUUID();
    setEffects(prev => [...prev, { id, position: pos, pieceType, pieceColor }]);
  }, []);

  const removeEffect = useCallback((id: string) => {
    setEffects(prev => prev.filter(e => e.id !== id));
  }, []);

  const finishAnimation = useCallback(() => {
    pendingCompletionsRef.current.clear();
    setCommands({});
    setVisualPieces(boardPiecesRef.current);
    setAnimating(false);
  }, [setAnimating]);

  const markComplete = useCallback((token: string) => {
    pendingCompletionsRef.current.delete(token);
    if (pendingCompletionsRef.current.size === 0) {
      finishAnimation();
    }
  }, [finishAnimation]);

  const startDeath = useCallback((pieceId: string) => {
    setCommands(prev => ({
      ...prev,
      [pieceId]: { kind: "death" },
    }));
  }, []);

  useEffect(() => {
    const previousStep = previousStepRef.current;
    previousStepRef.current = currentStep;

    const isForwardSingleStep = currentStep === previousStep + 1 && !!lastMove;
    if (!isForwardSingleStep || !lastMove) {
      pendingCompletionsRef.current.clear();
      setCommands({});
      setEffects([]);
      setVisualPieces(boardPieces);
      setAnimating(false);
      return;
    }

    const pieces = visualPiecesRef.current;
    const attacker = pieces.find(piece => piece.square === lastMove.from);
    if (!attacker) {
      setVisualPieces(boardPieces);
      setAnimating(false);
      return;
    }

    const nextCommands: Record<string, PieceCommand> = {};
    const pending = new Set<string>();
    const from = attacker.position;
    const to = squareToPosition(lastMove.to);
    const castleRookSquares = getCastleRookSquares(lastMove);

    if (castleRookSquares) {
      nextCommands[attacker.id] = { kind: "walk", to };
      pending.add(`walk:${attacker.id}`);

      const rook = pieces.find(piece => piece.square === castleRookSquares.from);
      if (rook) {
        nextCommands[rook.id] = {
          kind: "walk",
          to: squareToPosition(castleRookSquares.to),
        };
        pending.add(`walk:${rook.id}`);
      }
    } else if (lastMove.captured) {
      const victimSquare = getCaptureSquare(lastMove);
      const victim = pieces.find(piece => piece.square === victimSquare);
      nextCommands[attacker.id] = {
        kind: "capture",
        nearTo: getNearTarget(from, to),
        to,
        promoteTo: getPromotionType(lastMove),
      };
      pending.add(`capture:${attacker.id}`);
      if (victim) {
        pending.add(`death:${victim.id}`);
      }
    } else {
      nextCommands[attacker.id] = {
        kind: "walk",
        to,
        promoteTo: getPromotionType(lastMove),
      };
      pending.add(`walk:${attacker.id}`);
    }

    pendingCompletionsRef.current = pending;
    setCommands(nextCommands);
    setAnimating(pending.size > 0);
  }, [boardPieces, currentStep, lastMove, setAnimating]);

  return (
    <group>
      {visualPieces.map(piece => (
        <PieceWrapper
          key={piece.id}
          piece={piece}
          command={commands[piece.id]}
          onWalkComplete={() => markComplete(`walk:${piece.id}`)}
          onCaptureComplete={() => markComplete(`capture:${piece.id}`)}
          onDeathComplete={() => markComplete(`death:${piece.id}`)}
          onPromote={(position, promoteTo) => addEffect(position, promoteTo, piece.color)}
          onImpact={() => {
            addEffect(squareToPosition(lastMove?.to ?? piece.square), piece.type, piece.color);
            if (lastMove?.captured) {
              const victimSquare = getCaptureSquare(lastMove);
              const victim = visualPiecesRef.current.find(p => p.square === victimSquare);
              if (victim) startDeath(victim.id);
            }
          }}
        />
      ))}
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
  piece: VisualPiece;
  command?: PieceCommand;
  onWalkComplete: () => void;
  onCaptureComplete: () => void;
  onDeathComplete: () => void;
  onPromote: (position: Vec3, promoteTo: string) => void;
  onImpact: () => void;
}

function faceTarget(group: THREE.Group, target: Vec3) {
  const dx = target[0] - group.position.x;
  const dz = target[2] - group.position.z;
  if (Math.abs(dx) + Math.abs(dz) > 0.001) {
    group.rotation.y = Math.atan2(dx, dz);
  }
}

function getTravelProfile(pieceType: string, isCaptureApproach = false) {
  const t = pieceType.toLowerCase();
  const durationScale = isCaptureApproach ? 0.78 : 1;

  if (t === "n") return { duration: 0.48 * durationScale, lift: 0.62, sway: 0.08, ease: "power2.inOut" };
  if (t === "r") return { duration: 0.46 * durationScale, lift: 0.04, sway: 0.03, ease: "power3.out" };
  if (t === "b") return { duration: 0.42 * durationScale, lift: 0.18, sway: 0.05, ease: "sine.inOut" };
  if (t === "q") return { duration: 0.44 * durationScale, lift: 0.22, sway: 0.06, ease: "power2.inOut" };
  if (t === "k") return { duration: 0.48 * durationScale, lift: 0.1, sway: 0.025, ease: "power2.out" };
  return { duration: 0.34 * durationScale, lift: 0.1, sway: 0.04, ease: "power2.out" };
}

function playTravelAnimation(
  pieceType: string,
  group: THREE.Group,
  model: THREE.Group,
  to: Vec3,
  onComplete: () => void,
  isCaptureApproach = false,
) {
  const profile = getTravelProfile(pieceType, isCaptureApproach);
  const t = pieceType.toLowerCase();

  faceTarget(group, to);

  const tl = gsap.timeline({ onComplete });
  tl.to(group.position, {
    x: to[0],
    y: to[1],
    z: to[2],
    duration: profile.duration,
    ease: profile.ease,
  }, 0);

  if (t === "n") {
    tl.to(model.position, {
      y: profile.lift,
      duration: profile.duration * 0.5,
      ease: "power2.out",
      yoyo: true,
      repeat: 1,
    }, 0);
    tl.to(model.rotation, {
      x: -0.18,
      duration: profile.duration * 0.5,
      yoyo: true,
      repeat: 1,
      ease: "sine.inOut",
    }, 0);
  } else if (t === "r") {
    tl.to(model.position, {
      y: profile.lift,
      duration: profile.duration * 0.25,
      yoyo: true,
      repeat: 3,
      ease: "steps(1)",
    }, 0);
    tl.to(model.rotation, {
      x: 0.08,
      duration: profile.duration * 0.5,
      yoyo: true,
      repeat: 1,
      ease: "power1.inOut",
    }, 0);
  } else if (t === "b" || t === "q") {
    tl.to(model.position, {
      y: profile.lift,
      duration: profile.duration * 0.5,
      yoyo: true,
      repeat: 1,
      ease: "sine.inOut",
    }, 0);
    tl.to(model.rotation, {
      z: t === "q" ? 0.14 : 0.08,
      duration: profile.duration * 0.5,
      yoyo: true,
      repeat: 1,
      ease: "sine.inOut",
    }, 0);
  } else if (t === "k") {
    tl.to(model.position, {
      y: profile.lift,
      duration: profile.duration * 0.5,
      yoyo: true,
      repeat: 1,
      ease: "sine.inOut",
    }, 0);
    tl.to(model.rotation, {
      z: 0.05,
      duration: profile.duration * 0.5,
      yoyo: true,
      repeat: 1,
      ease: "power1.inOut",
    }, 0);
  } else {
    tl.to(model.position, {
      y: profile.lift,
      duration: profile.duration * 0.5,
      yoyo: true,
      repeat: 1,
      ease: "sine.inOut",
    }, 0);
    tl.to(model.rotation, {
      x: 0.1,
      duration: profile.duration * 0.5,
      yoyo: true,
      repeat: 1,
      ease: "sine.inOut",
    }, 0);
  }

  tl.to(model.rotation, {
    y: profile.sway,
    duration: profile.duration * 0.25,
    yoyo: true,
    repeat: 3,
    ease: "sine.inOut",
  }, 0);
}

function playPromotionPulse(
  model: THREE.Group,
  position: Vec3,
  promoteTo: string | undefined,
  onPromote: (position: Vec3, promoteTo: string) => void,
  onComplete: () => void,
) {
  if (!promoteTo) {
    onComplete();
    return;
  }

  gsap.timeline({ onComplete })
    .call(() => onPromote(position, promoteTo))
    .to(model.position, { y: 0.18, duration: 0.14, ease: "power2.out" }, 0)
    .to(model.scale, { x: 1.16, y: 1.16, z: 1.16, duration: 0.14, ease: "power2.out" }, 0)
    .to(model.position, { y: 0, duration: 0.18, ease: "power2.in" }, 0.14)
    .to(model.scale, { x: 1, y: 1, z: 1, duration: 0.18, ease: "power2.in" }, 0.14);
}

function PieceWrapper({
  piece,
  command,
  onWalkComplete,
  onCaptureComplete,
  onDeathComplete,
  onPromote,
  onImpact,
}: PieceWrapperProps) {
  const groupRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Group>(null);
  const [dissolve, setDissolve] = useState(0);
  const callbacksRef = useRef({ onWalkComplete, onCaptureComplete, onDeathComplete, onPromote, onImpact });
  callbacksRef.current = { onWalkComplete, onCaptureComplete, onDeathComplete, onPromote, onImpact };

  useEffect(() => {
    const group = groupRef.current;
    const model = modelRef.current;
    if (!group || !model) return;

    if (!command) {
      gsap.killTweensOf([group.position, group.rotation, model.position, model.rotation, model.scale]);
      group.position.set(...piece.position);
      group.rotation.set(0, 0, 0);
      model.position.set(0, 0, 0);
      model.rotation.set(0, 0, 0);
      model.scale.set(1, 1, 1);
      setDissolve(0);
      return;
    }

    gsap.killTweensOf([group.position, group.rotation, model.position, model.rotation, model.scale]);
    model.position.set(0, 0, 0);
    model.rotation.set(0, 0, 0);
    model.scale.set(1, 1, 1);
    setDissolve(0);

    if (command.kind === "walk") {
      group.position.set(...piece.position);
      playTravelAnimation(piece.type, group, model, command.to, () => {
        playPromotionPulse(
          model,
          command.to,
          command.promoteTo,
          callbacksRef.current.onPromote,
          callbacksRef.current.onWalkComplete,
        );
      });
      return;
    }

    if (command.kind === "capture") {
      group.position.set(...piece.position);
      playTravelAnimation(piece.type, group, model, command.nearTo, () => {
        playAttackAnimation(piece.type, model, () => callbacksRef.current.onImpact());
        gsap.to(group.position, {
          x: command.to[0],
          y: command.to[1],
          z: command.to[2],
          duration: 0.28,
          delay: 0.28,
          ease: "power2.out",
          onComplete: () => {
            playPromotionPulse(
              model,
              command.to,
              command.promoteTo,
              callbacksRef.current.onPromote,
              callbacksRef.current.onCaptureComplete,
            );
          },
        });
      }, true);
      return;
    }

    const proxy = { val: 0 };
    gsap.to(proxy, {
      val: 1,
      duration: 0.42,
      ease: "power2.in",
      onUpdate: () => setDissolve(proxy.val),
      onComplete: () => callbacksRef.current.onDeathComplete(),
    });
    gsap.to(model.position, { y: -0.25, duration: 0.42, ease: "power2.in" });
    gsap.to(model.scale, { x: 0.82, y: 0.72, z: 0.82, duration: 0.42, ease: "power2.in" });
  }, [command, piece.position, piece.type]);

  return (
    <group ref={groupRef} position={piece.position}>
      <group ref={modelRef}>
        <HumanoidPieceModel type={piece.type} color={piece.color} dissolve={dissolve} />
      </group>
    </group>
  );
}
