import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import type { Move, Piece } from "chess.js";
import { HumanoidPieceModel } from "./HumanoidPiece";
import { AttackEffect } from "./AttackEffect";
import { MagicCircle, DormantCircle } from "./MagicCircle";
import { algebraicToIndex, indexToPosition } from "../../lib/utils";
import { getBenchSlot } from "../../shared/benchSlots";
import { playAttackAnimation } from "../../shared/attackAnimations";
import { playTravelAnimation, playPromotionPulse, playDeathAnimation } from "../../shared/pieceAnimations";
import { SIDE_COLORS } from "../../shared/pieceColors";
import type { Side, AttackEffectProps, Vec3, PieceRig } from "../../shared/types";

interface EffectInstance extends Omit<AttackEffectProps, "onComplete"> {
  id: string;
}

interface SquareFlashInstance {
  id: string;
  position: Vec3;
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
  history: Move[];
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

function rebuildBenchFromHistory(history: Move[], upToStep: number): BenchedPiece[] {
  const counts: { w: number; b: number } = { w: 0, b: 0 };
  const result: BenchedPiece[] = [];
  for (let i = 0; i <= upToStep; i++) {
    const move = history[i];
    if (!move?.captured) continue;
    const capturedColor: Side = move.color === "w" ? "b" : "w";
    const idx = counts[capturedColor]++;
    const captureSquare = move.flags.includes("e")
      ? `${move.to[0]}${move.from[1]}`
      : move.to;
    const [col, row] = algebraicToIndex(captureSquare);
    result.push({
      id: `bench-${capturedColor}${move.captured}-step${i}`,
      type: move.captured,
      color: capturedColor,
      fromPosition: indexToPosition(col, row),
      benchPosition: getBenchSlot(capturedColor, idx),
      isSettling: false,
    });
  }
  return result;
}

function createCommandId() {
  return crypto.randomUUID();
}

// Pre-compute all 16 bench slot positions per side (constant for the lifetime of the app)
const ALL_BENCH_POSITIONS: { w: Vec3[]; b: Vec3[] } = {
  w: Array.from({ length: 16 }, (_, i) => getBenchSlot("w", i)),
  b: Array.from({ length: 16 }, (_, i) => getBenchSlot("b", i)),
};

export function PieceManager({ boardState, lastMove, currentStep, history, onAnimatingChange }: PieceManagerProps) {
  const boardPieces = useMemo(() => boardToVisualPieces(boardState), [boardState]);
  const [visualPieces, setVisualPieces] = useState<VisualPiece[]>(boardPieces);
  const [commands, setCommands] = useState<Record<string, PieceCommand>>({});
  const [effects, setEffects] = useState<EffectInstance[]>([]);
  const [squareFlashes, setSquareFlashes] = useState<SquareFlashInstance[]>([]);
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

  const addSquareFlash = useCallback((pos: Vec3, pieceColor: Side) => {
    const id = crypto.randomUUID();
    setSquareFlashes(prev => [...prev, { id, position: pos, pieceColor }]);
  }, []);

  const removeSquareFlash = useCallback((id: string) => {
    setSquareFlashes(prev => prev.filter(e => e.id !== id));
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
      setSquareFlashes([]);
      setProjectiles([]);
      setVisualPieces(boardPieces);
      const rebuilt = rebuildBenchFromHistory(history, currentStep);
      setBenchedPieces(rebuilt);
      benchCountsRef.current = {
        w: rebuilt.filter(p => p.color === "w").length,
        b: rebuilt.filter(p => p.color === "b").length,
      };
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
  }, [boardPieces, currentStep, history, lastMove, setAnimating]);

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
          onLand={(position) => addSquareFlash(position, piece.color)}
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
      {squareFlashes.map(eff => (
        <SquareFlashEffect
          key={eff.id}
          position={eff.position}
          pieceColor={eff.pieceColor}
          onComplete={() => removeSquareFlash(eff.id)}
        />
      ))}
      {projectiles.map(proj => (
        <PathWaveEffect
          key={proj.id}
          from={proj.from}
          to={proj.to}
          pieceType={proj.pieceType}
          pieceColor={proj.pieceColor}
          onArrive={() => {
            addEffect(proj.to, proj.pieceType, proj.pieceColor);
            if (proj.victimId) startDeath(proj.victimId, proj.victimHitFrom!);
          }}
          onComplete={() => removeProjectile(proj.id)}
        />
      ))}
      {ALL_BENCH_POSITIONS.w.map((pos, i) => <DormantCircle key={`dc-w-${i}`} position={pos} side="w" />)}
      {ALL_BENCH_POSITIONS.b.map((pos, i) => <DormantCircle key={`dc-b-${i}`} position={pos} side="b" />)}
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


// ── path-wave effect (replaces ProjectileEffect) ──────────────────────────────

function getRangedSpeed(pieceType: string): number {
  const t = pieceType.toLowerCase();
  if (t === "r") return 14;
  if (t === "q") return 9;
  return 10;
}

// One flashing square in the wave — identical geometry to SquareFlashEffect
// but uses a bell-curve opacity and additive blending for a "light pulse" look.
function WaveSquareFlash({
  position,
  pieceColor,
  startDelay,
  flashDur,
  onComplete,
}: {
  position: Vec3;
  pieceColor: Side;
  startDelay: number;
  flashDur: number;
  onComplete?: () => void;
}) {
  const elapsed = useRef(-startDelay);
  const done    = useRef(false);
  const colors  = SIDE_COLORS[pieceColor];

  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({
      color:      new THREE.Color(colors.glow).multiplyScalar(3),
      transparent: true,
      opacity:    0,
      depthWrite: false,
      side:       THREE.DoubleSide,
      blending:   THREE.AdditiveBlending,
      toneMapped: false,
    }),
    [colors.glow],
  );
  useEffect(() => () => mat.dispose(), [mat]);

  useFrame((_, dt) => {
    elapsed.current += dt;
    if (elapsed.current <= 0) return;
    const p = Math.min(elapsed.current / flashDur, 1);
    mat.opacity = Math.sin(p * Math.PI) * 0.9;
    if (!done.current && p >= 1) {
      done.current = true;
      onComplete?.();
    }
  });

  const [x, , z] = position;
  return (
    <group position={[x, -0.049, z]}>
      <mesh geometry={FLASH_GEO_H} material={mat} rotation={FLASH_ROT} position={[0, 0, -FLASH_INSET]} />
      <mesh geometry={FLASH_GEO_H} material={mat} rotation={FLASH_ROT} position={[0, 0,  FLASH_INSET]} />
      <mesh geometry={FLASH_GEO_V} material={mat} rotation={FLASH_ROT} position={[-FLASH_INSET, 0, 0]} />
      <mesh geometry={FLASH_GEO_V} material={mat} rotation={FLASH_ROT} position={[ FLASH_INSET, 0, 0]} />
    </group>
  );
}

interface PathWaveEffectProps {
  from: Vec3;
  to: Vec3;
  pieceType: string;
  pieceColor: Side;
  onArrive: () => void;   // fires when wave front reaches target
  onComplete: () => void; // fires when last flash finishes (safe to unmount)
}

// Squares along the attack path light up in sequence, then the target square
// triggers the AttackEffect. No 3D geometry, no PointLight — flat planes only.
function PathWaveEffect({ from, to, pieceType, pieceColor, onArrive, onComplete }: PathWaveEffectProps) {
  const onArriveRef   = useRef(onArrive);
  onArriveRef.current = onArrive;

  const { squares, stepDelay, flashDur } = useMemo(() => {
    const fromCol = Math.round(from[0] + 3.5);
    const fromRow = Math.round(from[2] + 3.5);
    const toCol   = Math.round(to[0]   + 3.5);
    const toRow   = Math.round(to[2]   + 3.5);

    const dCol = Math.sign(toCol - fromCol);
    const dRow = Math.sign(toRow - fromRow);
    const N    = Math.max(Math.abs(toCol - fromCol), Math.abs(toRow - fromRow));

    const sqs: Vec3[] = [];
    for (let i = 1; i <= N; i++) {
      const col = fromCol + i * dCol;
      const row = fromRow + i * dRow;
      sqs.push([col - 3.5, 0, row - 3.5]);
    }

    const dist  = Math.sqrt((to[0] - from[0]) ** 2 + (to[2] - from[2]) ** 2);
    const total = dist / getRangedSpeed(pieceType);
    const step  = N > 0 ? total / N : total;

    return { squares: sqs, stepDelay: step, flashDur: step * 1.8 };
  }, [from, to, pieceType]);

  const t         = useRef(0);
  const fired     = useRef(false);
  const arriveTime = (squares.length - 1) * stepDelay;

  useFrame((_, dt) => {
    t.current += dt;
    if (!fired.current && t.current >= arriveTime) {
      fired.current = true;
      onArriveRef.current();
    }
  });

  return (
    <>
      {squares.map((pos, i) => (
        <WaveSquareFlash
          key={i}
          position={pos}
          pieceColor={pieceColor}
          startDelay={i * stepDelay}
          flashDur={flashDur}
          onComplete={i === squares.length - 1 ? onComplete : undefined}
        />
      ))}
    </>
  );
}

// ── Module-level geometry singletons for SquareFlashEffect (never disposed) ───
const FLASH_T = 0.07; // border strip thickness in world units
const FLASH_GEO_H = new THREE.PlaneGeometry(1, FLASH_T); // horizontal strip (N/S edges)
const FLASH_GEO_V = new THREE.PlaneGeometry(FLASH_T, 1); // vertical strip (W/E edges)
const FLASH_ROT: [number, number, number] = [-Math.PI / 2, 0, 0];
const FLASH_INSET = 0.5 - FLASH_T / 2; // center of strip, measured from square center

function SquareFlashEffect({
  position,
  pieceColor,
  onComplete,
}: {
  position: Vec3;
  pieceColor: Side;
  onComplete: () => void;
}) {
  const elapsed = useRef(0);
  const done = useRef(false);
  const colors = SIDE_COLORS[pieceColor];
  const DURATION = 0.55;

  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({
      color: colors.glow,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    [colors.glow]
  );
  useEffect(() => () => mat.dispose(), [mat]);

  useFrame((_, dt) => {
    elapsed.current += dt;
    const p = Math.min(elapsed.current / DURATION, 1);
    mat.opacity = Math.pow(1 - p, 1.5) * 0.95;
    if (!done.current && p >= 1) {
      done.current = true;
      onComplete();
    }
  });

  const [x, , z] = position;
  return (
    <group position={[x, -0.049, z]}>
      <mesh geometry={FLASH_GEO_H} material={mat} rotation={FLASH_ROT} position={[0, 0, -FLASH_INSET]} />
      <mesh geometry={FLASH_GEO_H} material={mat} rotation={FLASH_ROT} position={[0, 0,  FLASH_INSET]} />
      <mesh geometry={FLASH_GEO_V} material={mat} rotation={FLASH_ROT} position={[-FLASH_INSET, 0, 0]} />
      <mesh geometry={FLASH_GEO_V} material={mat} rotation={FLASH_ROT} position={[ FLASH_INSET, 0, 0]} />
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
  const dissolveRef = useRef(0);
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
      dissolveRef.current = 0;
      setLocomotionActive(false);
      return;
    }

    gsap.killTweensOf([group.position, group.rotation, model.position, model.rotation, model.scale]);
    model.position.set(0, 0, 0);
    model.rotation.set(0, 0, 0);
    model.scale.set(1, 1, 1);
    dissolveRef.current = 0;

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
        (val: number) => { dissolveRef.current = val; },
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
          dissolveRef={dissolveRef}
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
  const dissolveRef = useRef(1.0);
  const [circlePhase, setCirclePhase] = useState<"active" | "dimming">("active");

  useEffect(() => {
    const group = groupRef.current;
    const model = modelRef.current;
    if (!group || !model) return;
    group.rotation.y = piece.color === "w" ? -Math.PI / 2 : Math.PI / 2;
    model.position.set(0, -0.5, 0);
    model.rotation.set(0, 0, 0);
    model.scale.set(1, 1, 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [piece.id]);

  const handleCircleReady = () => {
    const model = modelRef.current;
    if (!model) return;
    const proxy = { val: 1 };
    gsap.to(proxy, {
      val: 0,
      duration: 1.8,
      delay: 0.1,
      ease: "power2.inOut",
      onUpdate: () => { dissolveRef.current = proxy.val; },
      onComplete: () => setCirclePhase("dimming"),
    });
    gsap.to(model.position, { y: 0, duration: 2.2, delay: 0.1, ease: "power2.out" });
  };

  return (
    <group ref={groupRef} position={piece.benchPosition}>
      <MagicCircle
        position={[0, 0, 0]}
        side={piece.color}
        onReady={handleCircleReady}
        dimming={circlePhase === "dimming"}
      />
      <group ref={modelRef}>
        <HumanoidPieceModel
          type={piece.type}
          color={piece.color}
          dissolveRef={dissolveRef}
          locomotion={{ active: false, intensity: 1, speed: 12 }}
        />
      </group>
    </group>
  );
}
