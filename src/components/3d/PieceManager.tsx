import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import type { Move, Piece } from "chess.js";
import { HumanoidPieceModel } from "./HumanoidPiece";
import { AttackEffect } from "./AttackEffect";
import { ProjectileEffect } from "./ProjectileEffect";
import { algebraicToIndex, indexToPosition } from "../../lib/utils";
import { getBenchSlot } from "../../shared/benchSlots";
import { playAttackAnimation } from "../../shared/attackAnimations";
import { playTravelAnimation, playPromotionPulse, playDeathAnimation, playGetUpAnimation } from "../../shared/pieceAnimations";
import { SIDE_COLORS } from "../../shared/pieceColors";
import type { Side, AttackEffectProps, Vec3, PieceRig } from "../../shared/types";

interface EffectInstance extends Omit<AttackEffectProps, "onComplete"> {
  id: string;
}

interface LandingEffectInstance {
  id: string;
  position: Vec3;
  pieceType: string;
  pieceColor: Side;
}

interface ProjectileInstance {
  id: string;
  from: Vec3;
  to: Vec3;
  pieceType: string;
  pieceColor: Side;
  victimId: string | null;
  victimHitFrom: Vec3 | null;
}

interface VisualPiece {
  id: string;
  square: string;
  type: string;
  color: Side;
  position: Vec3;
}

interface BenchedPiece {
  id: string;
  type: string;
  color: Side;
  fromPosition: Vec3;
  benchPosition: Vec3;
  isSettling: boolean;
}

type PieceCommand =
  | { id: string; kind: "walk"; to: Vec3; promoteTo?: string }
  | { id: string; kind: "melee-capture"; nearTo: Vec3; to: Vec3; promoteTo?: string }
  | { id: string; kind: "ranged-capture"; to: Vec3; promoteTo?: string }
  | { id: string; kind: "death"; hitFrom: Vec3 };

function isRangedPiece(type: string): boolean {
  return ["b", "r", "q"].includes(type.toLowerCase());
}

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

function createCommandId() {
  return crypto.randomUUID();
}

export function PieceManager({ boardState, lastMove, currentStep, onAnimatingChange }: PieceManagerProps) {
  const boardPieces = useMemo(() => boardToVisualPieces(boardState), [boardState]);
  const [visualPieces, setVisualPieces] = useState<VisualPiece[]>(boardPieces);
  const [commands, setCommands] = useState<Record<string, PieceCommand>>({});
  const [effects, setEffects] = useState<EffectInstance[]>([]);
  const [landingEffects, setLandingEffects] = useState<LandingEffectInstance[]>([]);
  const [projectiles, setProjectiles] = useState<ProjectileInstance[]>([]);
  const [benchedPieces, setBenchedPieces] = useState<BenchedPiece[]>([]);
  const benchCountsRef = useRef<{ w: number; b: number }>({ w: 0, b: 0 });
  const previousStepRef = useRef(currentStep);
  const visualPiecesRef = useRef(visualPieces);
  const boardPiecesRef = useRef(boardPieces);
  const pendingCompletionsRef = useRef<Set<string>>(new Set());
  const rangedMoveRef = useRef<{ attackerId: string; to: Vec3; promoteTo?: string } | null>(null);

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

  const addLandingEffect = useCallback((pos: Vec3, pieceType: string, pieceColor: Side) => {
    const id = crypto.randomUUID();
    setLandingEffects(prev => [...prev, { id, position: pos, pieceType, pieceColor }]);
  }, []);

  const removeLandingEffect = useCallback((id: string) => {
    setLandingEffects(prev => prev.filter(e => e.id !== id));
  }, []);

  const addProjectile = useCallback((
    from: Vec3, to: Vec3,
    pieceType: string, pieceColor: Side,
    victimId: string | null, victimHitFrom: Vec3 | null,
  ) => {
    const id = crypto.randomUUID();
    setProjectiles(prev => [...prev, { id, from, to, pieceType, pieceColor, victimId, victimHitFrom }]);
  }, []);

  const removeProjectile = useCallback((id: string) => {
    setProjectiles(prev => prev.filter(p => p.id !== id));
  }, []);

  const addToBench = useCallback((piece: VisualPiece) => {
    const side = piece.color;
    const idx = benchCountsRef.current[side]++;
    const benchPosition = getBenchSlot(side, idx);
    setBenchedPieces(prev => [...prev, {
      id: piece.id,
      type: piece.type,
      color: piece.color,
      fromPosition: piece.position,
      benchPosition,
      isSettling: true,
    }]);
  }, []);

  const clearBench = useCallback(() => {
    setBenchedPieces([]);
    benchCountsRef.current = { w: 0, b: 0 };
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
      const pending = rangedMoveRef.current;
      if (pending) {
        rangedMoveRef.current = null;
        pendingCompletionsRef.current.add(`walk:${pending.attackerId}`);
        setCommands(prev => ({
          ...prev,
          [pending.attackerId]: {
            id: createCommandId(),
            kind: "walk" as const,
            to: pending.to,
            promoteTo: pending.promoteTo,
          },
        }));
      } else {
        finishAnimation();
      }
    }
  }, [finishAnimation]);

  const startDeath = useCallback((pieceId: string, hitFrom: Vec3) => {
    setCommands(prev => ({
      ...prev,
      [pieceId]: { id: createCommandId(), kind: "death", hitFrom },
    }));
  }, []);

  useEffect(() => {
    const previousStep = previousStepRef.current;
    previousStepRef.current = currentStep;

    const isForwardSingleStep = currentStep === previousStep + 1 && !!lastMove;
    if (!isForwardSingleStep || !lastMove) {
      pendingCompletionsRef.current.clear();
      rangedMoveRef.current = null;
      setCommands({});
      setEffects([]);
      setLandingEffects([]);
      setProjectiles([]);
      setVisualPieces(boardPieces);
      clearBench();
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
      nextCommands[attacker.id] = { id: createCommandId(), kind: "walk", to };
      pending.add(`walk:${attacker.id}`);

      const rook = pieces.find(piece => piece.square === castleRookSquares.from);
      if (rook) {
        nextCommands[rook.id] = {
          id: createCommandId(),
          kind: "walk",
          to: squareToPosition(castleRookSquares.to),
        };
        pending.add(`walk:${rook.id}`);
      }
    } else if (lastMove.captured) {
      const victimSquare = getCaptureSquare(lastMove);
      const victim = pieces.find(piece => piece.square === victimSquare);
      if (isRangedPiece(attacker.type)) {
        nextCommands[attacker.id] = {
          id: createCommandId(),
          kind: "ranged-capture",
          to,
          promoteTo: getPromotionType(lastMove),
        };
        rangedMoveRef.current = { attackerId: attacker.id, to, promoteTo: getPromotionType(lastMove) };
      } else {
        nextCommands[attacker.id] = {
          id: createCommandId(),
          kind: "melee-capture",
          nearTo: getNearTarget(from, to),
          to,
          promoteTo: getPromotionType(lastMove),
        };
      }
      pending.add(`capture:${attacker.id}`);
      if (victim) {
        pending.add(`death:${victim.id}`);
      }
    } else {
      nextCommands[attacker.id] = {
        id: createCommandId(),
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
          onDeathComplete={() => {
            addToBench(piece);
            markComplete(`death:${piece.id}`);
          }}
          onLand={(position) => addLandingEffect(position, piece.type, piece.color)}
          onPromote={(position, promoteTo) => addEffect(position, promoteTo, piece.color)}
          onImpact={() => {
            if (isRangedPiece(piece.type) && lastMove?.captured) {
              const targetPos = squareToPosition(lastMove.to);
              const victimSquare = getCaptureSquare(lastMove);
              const victim = visualPiecesRef.current.find(p => p.square === victimSquare);
              addProjectile(
                piece.position,
                targetPos,
                piece.type,
                piece.color,
                victim?.id ?? null,
                victim ? squareToPosition(lastMove.from) : null,
              );
            } else {
              addEffect(squareToPosition(lastMove?.to ?? piece.square), piece.type, piece.color);
              if (lastMove?.captured) {
                const victimSquare = getCaptureSquare(lastMove);
                const victim = visualPiecesRef.current.find(p => p.square === victimSquare);
                if (victim) startDeath(victim.id, squareToPosition(lastMove.from));
              }
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
      {landingEffects.map(eff => (
        <LandingEffect
          key={eff.id}
          position={eff.position}
          pieceType={eff.pieceType}
          pieceColor={eff.pieceColor}
          onComplete={() => removeLandingEffect(eff.id)}
        />
      ))}
      {projectiles.map(proj => (
        <ProjectileEffect
          key={proj.id}
          from={proj.from}
          to={proj.to}
          pieceType={proj.pieceType}
          pieceColor={proj.pieceColor}
          onArrive={() => {
            removeProjectile(proj.id);
            addEffect(proj.to, proj.pieceType, proj.pieceColor);
            if (proj.victimId) startDeath(proj.victimId, proj.victimHitFrom!);
          }}
        />
      ))}
      {benchedPieces.map(bp => (
        <BenchedPieceWrapper key={bp.id} piece={bp} />
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
  onLand: (position: Vec3) => void;
  onPromote: (position: Vec3, promoteTo: string) => void;
  onImpact: () => void;
}


function getLandingProfile(pieceType: string) {
  const t = pieceType.toLowerCase();
  if (t === "n") return { duration: 0.62, ringSpeed: 4.2, maxRadius: 1.25, height: 0.08, pulse: 0.95 };
  if (t === "r") return { duration: 0.68, ringSpeed: 3.6, maxRadius: 1.45, height: 0.025, pulse: 1.0 };
  if (t === "b") return { duration: 0.58, ringSpeed: 3.0, maxRadius: 1.0, height: 0.12, pulse: 0.55 };
  if (t === "q") return { duration: 0.68, ringSpeed: 3.2, maxRadius: 1.25, height: 0.16, pulse: 0.7 };
  if (t === "k") return { duration: 0.72, ringSpeed: 2.8, maxRadius: 1.18, height: 0.08, pulse: 0.65 };
  return { duration: 0.44, ringSpeed: 3.5, maxRadius: 0.72, height: 0.04, pulse: 0.55 };
}

function LandingEffect({
  position,
  pieceType,
  pieceColor,
  onComplete,
}: {
  position: Vec3;
  pieceType: string;
  pieceColor: Side;
  onComplete: () => void;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const elapsed = useRef(0);
  const done = useRef(false);
  const profile = useMemo(() => getLandingProfile(pieceType), [pieceType]);
  const colors = SIDE_COLORS[pieceColor];

  useFrame((_, dt) => {
    elapsed.current += dt;
    const p = Math.min(elapsed.current / profile.duration, 1);

    if (ringRef.current) {
      const radius = Math.min(elapsed.current * profile.ringSpeed, profile.maxRadius);
      ringRef.current.scale.setScalar(Math.max(radius, 0.001));
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1 - p) * profile.pulse);
    }

    if (glowRef.current) {
      const pulse = Math.sin(p * Math.PI);
      glowRef.current.scale.setScalar(0.32 + pulse * 0.38);
      glowRef.current.position.y = profile.height + pulse * profile.height;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, pulse * 0.38);
    }

    if (!done.current && p >= 1) {
      done.current = true;
      onComplete();
    }
  });

  return (
    <group position={position}>
      <mesh ref={ringRef} position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.001}>
        <ringGeometry args={[0.75, 0.82, 48]} />
        <meshBasicMaterial color={colors.glow} transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh ref={glowRef} position={[0, profile.height, 0]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshBasicMaterial color={colors.accent} transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}


function PieceWrapper({
  piece,
  command,
  onWalkComplete,
  onCaptureComplete,
  onDeathComplete,
  onLand,
  onPromote,
  onImpact,
}: PieceWrapperProps) {
  const groupRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Group>(null);
  const rigRef = useRef<PieceRig | null>(null);
  const [dissolve, setDissolve] = useState(0);
  const [locomotionActive, setLocomotionActive] = useState(false);
  const commandRef = useRef(command);
  const pieceRef = useRef(piece);
  const callbacksRef = useRef({ onWalkComplete, onCaptureComplete, onDeathComplete, onLand, onPromote, onImpact });
  commandRef.current = command;
  pieceRef.current = piece;
  callbacksRef.current = { onWalkComplete, onCaptureComplete, onDeathComplete, onLand, onPromote, onImpact };

  useEffect(() => {
    const group = groupRef.current;
    const model = modelRef.current;
    const activeCommand = commandRef.current;
    const activePiece = pieceRef.current;
    if (!group || !model) return;

    if (!activeCommand) {
      gsap.killTweensOf([group.position, group.rotation, model.position, model.rotation, model.scale]);
      group.position.set(...activePiece.position);
      // Pieces by default face +Z. White at bottom (large Z) should face -Z.
      group.rotation.set(0, activePiece.color === "w" ? Math.PI : 0, 0);
      model.position.set(0, 0, 0);
      model.rotation.set(0, 0, 0);
      model.scale.set(1, 1, 1);
      setDissolve(0);
      setLocomotionActive(false);
      return;
    }

    gsap.killTweensOf([group.position, group.rotation, model.position, model.rotation, model.scale]);
    model.position.set(0, 0, 0);
    model.rotation.set(0, 0, 0);
    model.scale.set(1, 1, 1);
    setDissolve(0);

    if (activeCommand.kind === "walk") {
      group.position.set(...activePiece.position);
      setLocomotionActive(true);
      playTravelAnimation(activePiece.type, group, model, activeCommand.to, () => {
        setLocomotionActive(false);
        callbacksRef.current.onLand(activeCommand.to);
        playPromotionPulse(
          model,
          activeCommand.to,
          activeCommand.promoteTo,
          callbacksRef.current.onPromote,
          callbacksRef.current.onWalkComplete,
        );
      });
      return;
    }

    if (activeCommand.kind === "melee-capture") {
      group.position.set(...activePiece.position);
      setLocomotionActive(true);
      playTravelAnimation(activePiece.type, group, model, activeCommand.nearTo, () => {
        setLocomotionActive(false);
        playAttackAnimation(activePiece.type, model, rigRef.current, () => callbacksRef.current.onImpact());
        gsap.to(group.position, {
          x: activeCommand.to[0],
          y: activeCommand.to[1],
          z: activeCommand.to[2],
          duration: 0.28,
          delay: 0.28,
          ease: "power2.out",
          onComplete: () => {
            playPromotionPulse(
              model,
              activeCommand.to,
              activeCommand.promoteTo,
              callbacksRef.current.onPromote,
              callbacksRef.current.onCaptureComplete,
            );
          },
        });
      }, true);
      return;
    }

    if (activeCommand.kind === "ranged-capture") {
      group.position.set(...activePiece.position);
      playAttackAnimation(
        activePiece.type,
        model,
        rigRef.current,
        () => callbacksRef.current.onImpact(),
        () => callbacksRef.current.onCaptureComplete(),
      );
      return;
    }

    if (activeCommand.kind === "death") {
      playDeathAnimation(
        activePiece.type,
        activePiece.position,
        activeCommand.hitFrom,
        model,
        setDissolve,
        callbacksRef.current.onDeathComplete,
      );
      setLocomotionActive(false);
    }
  }, [command?.id]);

  return (
    <group ref={groupRef} position={piece.position}>
      <group ref={modelRef}>
        <HumanoidPieceModel
          ref={rigRef}
          type={piece.type}
          color={piece.color}
          dissolve={dissolve}
          locomotion={{
            active: locomotionActive,
            intensity: piece.type === "k" ? 0.72 : piece.type === "q" ? 0.82 : 1,
            speed: piece.type === "k" ? 8.5 : piece.type === "q" ? 9.5 : 12,
          }}
        />
      </group>
    </group>
  );
}

function BenchedPieceWrapper({ piece }: { piece: BenchedPiece }) {
  const groupRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Group>(null);
  const [locomotionActive, setLocomotionActive] = useState(false);

  useEffect(() => {
    const group = groupRef.current;
    const model = modelRef.current;
    if (!group || !model || !piece.isSettling) return;

    group.position.set(...piece.fromPosition);

    playGetUpAnimation(piece.type, model, () => {
      setLocomotionActive(true);
      playTravelAnimation(piece.type, group, model, piece.benchPosition, () => {
        setLocomotionActive(false);
      });
    });
  // piece.id is stable for the lifetime of this component instance
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [piece.id]);

  return (
    <group ref={groupRef} position={piece.benchPosition}>
      <group ref={modelRef}>
        <HumanoidPieceModel
          type={piece.type}
          color={piece.color}
          dissolve={0}
          locomotion={{
            active: locomotionActive,
            intensity: piece.type === "k" ? 0.72 : piece.type === "q" ? 0.82 : 1,
            speed: piece.type === "k" ? 8.5 : piece.type === "q" ? 9.5 : 12,
          }}
        />
      </group>
    </group>
  );
}
