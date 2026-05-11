/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ChessStep {
  move: string;        // PGN move e.g., "Nf3"
  from: string;        // e.g., "e2"
  to: string;          // e.g., "e4"
  actionType: 'NORMAL' | 'ATTACK' | 'CASTLE' | 'PROMOTION';
  narrative: string;   // Contextual information
}

export interface MatchData {
  title: string;
  white: string;
  black: string;
  date: string;
  site: string;
  pgn: string;
  narratives: Record<number, string>;
}

export const EVERGREEN_MATCH: MatchData = {
  title: "The Evergreen Game",
  white: "Adolf Anderssen",
  black: "Jean Dufresne",
  date: "1852",
  site: "Berlin",
  pgn: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O d3 8. Qb3 Qf6 9. e5 Qg6 10. Re1 Nge7 11. Ba3 b5 12. Qxb5 Rb8 13. Qa4 Bb6 14. Nbd2 Bb7 15. Ne4 Qf5 16. Bxd3 Qh5 17. Nf6+ gxf6 18. exf6 Rg8 19. Rad1 Qxf3 20. Rxe7+ Nxe7 21. Qxd7+ Kxd7 22. Bf5+ Ke8 23. Bd7+ Kf8 24. Bxe7#",
  narratives: {
    0: "The beginning of one of the most famous games in history, played in Berlin.",
    4: "Evans Gambit: White sacrifices a pawn for development and center control.",
    15: "White begins a series of deep sacrifices.",
    16: "The legendary knight sacrifice at f6 opens the black king's position.",
    18: "Black threatens mate, but Anderssen has seen further.",
    20: "The sequence of sacrifices culminates in this brilliant double check.",
    24: "Checkmate. A masterpiece of combinational play."
  }
};
