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

// ── frost ────────────────────────────────────────────────────────────────────
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

// ── abyss ────────────────────────────────────────────────────────────────────
export const KASPAROV_TOPALOV_1999: MatchData = {
  title: "Kasparov's Immortal",
  white: "Garry Kasparov",
  black: "Veselin Topalov",
  date: "1999",
  site: "Wijk aan Zee",
  pgn: "1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 Bg7 5. Qd2 c6 6. f3 b5 7. Nge2 Nbd7 8. Bh6 Bxh6 9. Qxh6 Bb7 10. a3 e5 11. O-O-O Qe7 12. Kb1 a6 13. Nc1 O-O-O 14. Nb3 exd4 15. Rxd4 c5 16. Rd1 Nb6 17. g3 Kb8 18. Na5 Ba8 19. Bh3 d5 20. Qf4+ Ka7 21. Rhe1 d4 22. Nd5 Nbxd5 23. exd5 Qd6 24. Rxd4 cxd4 25. Re7+ Kb6 26. Qxd4+ Kxa5 27. b4+ Ka4 28. Qc3 Qxd5 29. Ra7 Bb7 30. Rxb7 Qc4 31. Qxf6 Kxa3 32. Qxa6+ Kxb4 33. c3+ Kxc3 34. Ra7 1-0",
  narratives: {
    0:  "Wijk aan Zee, 1999. Kasparov faces Topalov in a game that will be called the greatest of all time.",
    15: "Bh6 — Kasparov forces the exchange of dark-squared bishops, weakening the kingside before the storm.",
    43: "Nd5 — The knight dominates the center. A chain reaction of sacrifices is about to begin.",
    47: "Rxd4!! — Kasparov sacrifices a full rook for a single pawn. The abyss opens.",
    49: "Re7+! — A second rook into the fire. The black king is driven into the open.",
    51: "Qxd4+ — The king hunt begins. Kasparov had calculated this sequence over 20 moves deep.",
    67: "Topalov resigns. The king has been chased across the entire board. There is no escape."
  }
};

// ── arena ────────────────────────────────────────────────────────────────────
export const IMMORTAL_GAME: MatchData = {
  title: "The Immortal Game",
  white: "Adolf Anderssen",
  black: "Lionel Kieseritzky",
  date: "1851",
  site: "London",
  pgn: "1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6 7. d3 Nh5 8. Nh4 Qg5 9. Nf5 c6 10. g4 Nf6 11. Rg1 cxb5 12. h4 Qg6 13. h5 Qg5 14. Qf3 Ng8 15. Bxf4 Qf6 16. Nc3 Bc5 17. Nd5 Qxb2 18. Bd6 Bxg1 19. e5 Qxa1+ 20. Ke2 Na6 21. Nxg7+ Kd8 22. Qf6+ Nxf6 23. Be7#",
  narratives: {
    0:  "London, 1851. Anderssen faces Kieseritzky in a King's Gambit that will never be forgotten.",
    3:  "King's Gambit accepted. White offers a pawn for a blazing attack — the gladiatorial opening.",
    7:  "Kf1 — White surrenders castling rights. The king steps into danger for the sake of the assault.",
    21: "Rg1 — The rook joins the charge. Anderssen has already sacrificed a bishop and a pawn.",
    33: "Nd5 — The knight leaps to dominate. Black's queen plunders the queenside... but the king is exposed.",
    35: "Bd6 — Anderssen blocks the queen's retreat. The final sequence begins.",
    37: "e5 — The second rook is sacrificed. Black holds queen, two rooks, a bishop. It does not matter.",
    43: "Qf6+!! — The queen sacrifice. Only one piece remains.",
    45: "Be7#. Checkmate with a lone bishop. The Immortal Game."
  }
};

// ── molten ───────────────────────────────────────────────────────────────────
export const GAME_OF_CENTURY: MatchData = {
  title: "The Game of the Century",
  white: "Donald Byrne",
  black: "Robert James Fischer",
  date: "1956",
  site: "New York",
  pgn: "1. Nf3 Nf6 2. c4 g6 3. Nc3 Bg7 4. d4 O-O 5. Bf4 d5 6. Qb3 dxc4 7. Qxc4 c6 8. e4 Nbd7 9. Rd1 Nb6 10. Qc5 Bg4 11. Bg5 Na4 12. Qa3 Nxc3 13. bxc3 Nxe4 14. Bxe7 Qb6 15. Bc4 Nxc3 16. Bc5 Rfe8+ 17. Kf1 Be6 18. Bxb6 Bxc4+ 19. Kg1 Ne2+ 20. Kf1 Nxd4+ 21. Kg1 Ne2+ 22. Kf1 Nc3+ 23. Kg1 axb6 24. Qb4 Ra4 25. Qxb6 Nxd1 26. h3 Rxa2 27. Kh2 Nxf2 28. Re1 Rxe1 29. Qd8+ Bf8 30. Nxe1 Bd5 31. Nf3 Ne4 32. Qb8 b5 33. h4 h5 34. Ne5 Kg7 35. Kg1 Bc5+ 36. Kf1 Ng3+ 37. Ke1 Bb4+ 38. Kd1 Bb3+ 39. Kc1 Ne2+ 40. Kb1 Nc3+ 41. Kc1 Rc2#",
  narratives: {
    0:  "New York, 1956. Donald Byrne faces 13-year-old Bobby Fischer. No one expects what comes next.",
    26: "Nxe4 — Fischer ignites the board. A knight sacrifice to begin an unstoppable combination.",
    34: "Be6 — Fischer positions his pieces. The queen is offered up in sacrifice.",
    35: "Bxb6 — Byrne accepts. He captures the queen. Fischer smiles.",
    36: "Bxc4+ — The pieces rain down. Fischer has already seen the end.",
    82: "Rc2#. Checkmate. The 13-year-old Bobby Fischer has just played the Game of the Century."
  }
};

// ── jade ─────────────────────────────────────────────────────────────────────
export const OPERA_GAME: MatchData = {
  title: "The Opera Game",
  white: "Paul Morphy",
  black: "Duke of Brunswick & Count Isouard",
  date: "1858",
  site: "Paris Opera House",
  pgn: "1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8#",
  narratives: {
    0:  "Paris Opera House, 1858. Morphy is watching Norma when the Duke insists on a game. Morphy plays between acts — and annihilates.",
    6:  "Bg4 — The Duke pins the knight. A passive move that lets Morphy develop with total freedom.",
    8:  "Bxf3 — The bishop pair surrendered. Morphy now has two open files and absolute piece harmony.",
    19: "Nxb5 — First sacrifice. Morphy cares nothing for material — only development and activation.",
    21: "Bxb5+ — Second sacrifice. Both minor pieces are given away to accelerate the assault.",
    25: "Rxd7!! — The rook plunges in. Three pieces have now been sacrificed to open the lines.",
    31: "Qb8+!! — The queen sacrifice. The last piece to disappear before the final blow.",
    33: "Rd8#. Checkmate by the rook held back through the entire game. A masterclass in piece harmony."
  }
};

// ── polish ────────────────────────────────────────────────────────────────────
export const POLISH_IMMORTAL: MatchData = {
  title: "The Polish Immortal",
  white: "Gliksberg",
  black: "Miguel Najdorf",
  date: "1930",
  site: "Warsaw",
  pgn: "1. d4 f5 2. c4 Nf6 3. Nc3 e6 4. Nf3 d5 5. e3 c6 6. Bd3 Bd6 7. O-O O-O 8. Ne2 Nbd7 9. Ng5 Bxh2+ 10. Kh1 Ng4 11. f4 Qe8 12. g3 Qh5 13. Kg2 Bg1 14. Nxg1 Qh2+ 15. Kf3 e5 16. dxe5 Ndxe5+ 17. fxe5 Nxe5+ 18. Kf4 Ng6+ 19. Kf3 f4 20. exf4 Bg4+ 21. Kxg4 Ne5+ 22. fxe5 h5#",
  narratives: {
    0: "Warsaw, 1930. A casual game is played. Miguel Najdorf is about to orchestrate the Polish Immortal.",
    17: "Bxh2+ — The first minor piece sacrifice. The white king is drawn out.",
    25: "Bg1! — A quiet, stunning second bishop sacrifice to clear the way for the queen.",
    29: "e5 — White blocks the files, but Najdorf responds by sacrificing his knights.",
    39: "Bg4+ — The third sacrifice. Gliksberg accepts with his king.",
    41: "Ne5+ — The fourth and final minor piece sacrifice. Gliksberg takes the knight.",
    43: "h5# — Checkmate by a lone pawn. All four minor pieces were sacrificed to weave this mating web."
  }
};

// ── aurum ────────────────────────────────────────────────────────────────────
export const LEVITSKY_MARSHALL_1912: MatchData = {
  title: "The Gold Coins Game",
  white: "Stepan Levitsky",
  black: "Frank James Marshall",
  date: "1912",
  site: "Breslau",
  pgn: "1. d4 e6 2. e4 d5 3. Nc3 c5 4. Nf3 Nc6 5. exd5 exd5 6. Be2 Nf6 7. O-O Be7 8. Bg5 O-O 9. dxc5 Be6 10. Nd4 Bxc5 11. Nxe6 fxe6 12. Bg4 Qd6 13. Bh3 Rae8 14. Qd2 Bb4 15. Bxf6 Rxf6 16. Rad1 Qc5 17. Qe2 Bxc3 18. bxc3 Qxc3 19. Rxd5 Nd4 20. Qh5 Ref8 21. Re5 Rh6 22. Qg5 Rxh3 23. Rc5 Qg3 24. hxg3 Ne2#",
  narratives: {
    0: "Breslau, 1912. Levitsky faces Marshall in a game that will culminate in a shower of gold coins.",
    29: "Rxf6 — Black exchanges to open files and prepare the attack.",
    37: "Nd4 — Marshall's knight leaps into the center, threatening the white queen.",
    43: "Rxh3 — Marshall sacrifices the rook on h3. If gxh3, Nf3+ wins the queen.",
    45: "Qg3!! — The legendary queen sacrifice. She stands on a square where she can be captured three different ways.",
    47: "Ne2# — Checkmate by the knight! The queen sacrifice is accepted and leads to immediate defeat."
  }
};

// ── cyber ────────────────────────────────────────────────────────────────────
export const DEEP_BLUE_KASPAROV_1997: MatchData = {
  title: "Deep Blue vs. Kasparov",
  white: "Deep Blue",
  black: "Garry Kasparov",
  date: "1997",
  site: "New York",
  pgn: "1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Nd7 5. Ng5 Ngf6 6. Bd3 e6 7. N1f3 h6 8. Nxe6 Qe7 9. O-O fxe6 10. Bg6+ Kd8 11. Bf4 b5 12. a4 Bb7 13. Re1 Nd5 14. Bg3 Kc8 15. axb5 cxb5 16. Qd3 Bc6 17. Bf5 exf5 18. Rxe7 Bxe7 19. c4 1-0",
  narratives: {
    0: "New York, 1997. The deciding Game 6 of the rematch between Garry Kasparov and IBM's supercomputer, Deep Blue.",
    14: "Nxe6 — The computer shocks the world by sacrificing its knight. A profound, human-like positional sacrifice.",
    18: "Bg6+ — The bishop locks the black king in the center. Black is forced to forfeit castling rights.",
    32: "Bf5 — Deep Blue launches a finishing combination, offering its bishop to pin down the queen.",
    36: "c4 — Kasparov resigns. The black queen is gone and the position is completely overrun by the computer."
  }
};

// ── nebula ───────────────────────────────────────────────────────────────────
export const ROTLEWI_RUBINSTEIN_1907: MatchData = {
  title: "Rubinstein's Immortal",
  white: "Georg Rotlewi",
  black: "Akiba Rubinstein",
  date: "1907",
  site: "Lodz",
  pgn: "1. d4 d5 2. Nf3 e6 3. e3 c5 4. c4 Nc6 5. Nc3 Nf6 6. dxc5 Bxc5 7. a3 a6 8. b4 Bd6 9. Bb2 O-O 10. Qd2 Qe7 11. Bd3 dxc4 12. Bxc4 b5 13. Bd3 Rd8 14. Qe2 Bb7 15. O-O Ne5 16. Nxe5 Bxe5 17. f4 Bc7 18. e4 Rac8 19. e5 Bb6+ 20. Kh1 Ng4 21. Be4 Qh4 22. g3 Rxc3 23. gxh4 Rd2 24. Qxd2 Bxe4+ 25. Qg2 Rh3 0-1",
  narratives: {
    0: "Lodz, 1907. Rotlewi faces Akiba Rubinstein in a game that will be known as Rubinstein's Immortal.",
    39: "Ng4 — Rubinstein jumps his knight, beginning a beautiful offensive sequence.",
    43: "Rxc3!! — Rubinstein sacrifices his queen! He ignores the threat to his queen to eliminate the defending knight.",
    45: "Rd2!! — A second double-rook sacrifice! The black rook blocks the queen's defense.",
    49: "Rh3 — White is completely paralyzed. Checkmate on h2 is unavoidable. Rotlewi resigns."
  }
};

// ── theme → match mapping ────────────────────────────────────────────────────
export const THEME_MATCH_MAP: Record<string, MatchData> = {
  abyss:  KASPAROV_TOPALOV_1999,
  arena:  IMMORTAL_GAME,
  molten: GAME_OF_CENTURY,
  frost:  EVERGREEN_MATCH,
  jade:   OPERA_GAME,
  polish: POLISH_IMMORTAL,
  aurum:  LEVITSKY_MARSHALL_1912,
  cyber:  DEEP_BLUE_KASPAROV_1997,
  nebula: ROTLEWI_RUBINSTEIN_1907,
};
