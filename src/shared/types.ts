import type * as THREE from "three";

export type Vec3 = [number, number, number];
export type Side = "w" | "b";
export type PieceType = "k" | "q" | "r" | "b" | "n" | "p";

export interface PieceColorSet {
  primary: string;
  secondary: string;
  accent: string;
  dark: string;
  glow: string;
}

export interface BoardCell {
  type: PieceType;
  color: Side;
}

export interface PieceRig {
  body: THREE.Group;
  rightArm: THREE.Group | null;
  leftArm: THREE.Group | null;
  weapon: THREE.Group | null;
}

export interface AttackEffectProps {
  pieceType: string;
  pieceColor: Side;
  position: [number, number, number];
  onComplete: () => void;
}
