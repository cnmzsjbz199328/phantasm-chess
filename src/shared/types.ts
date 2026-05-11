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

export interface AttackEffectProps {
  pieceType: string;
  pieceColor: Side;
  position: [number, number, number];
  onComplete: () => void;
}
