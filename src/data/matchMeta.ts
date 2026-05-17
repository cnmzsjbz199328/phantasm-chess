import type { SceneMeta } from '../types/SceneMeta';

export const THEME_META_MAP: Record<string, SceneMeta> = {
  abyss: {
    title: "Kasparov's Immortal",
    subtitle: "1999 · Wijk aan Zee",
    description: [
      "Wijk aan Zee, January 1999.\n\nGarry Kasparov — reigning world champion, the greatest player of his era — sits across from Veselin Topalov, a dangerous young challenger.",
      "The position grows complex. Topalov presses on the queenside.\n\nKasparov calculates — deeper than any human has a right to — and sees a path invisible to everyone else in the room.",
      "What follows is not a game of chess.\n\nIt is a twenty-three-move act of controlled destruction.\n\nA rook sacrificed. Then another. The black king driven across the entire board.\n\nHistory calls it the greatest game ever played.",
    ],
    cast: [
      { role: "White", name: "Garry Kasparov" },
      { role: "Black", name: "Veselin Topalov" },
    ],
    director: "Kasparov",
    writer: "Phantasm Chess",
    tools: ["React Three Fiber", "Three.js", "Claude Sonnet 4.6"],
    nextEpisode: "Next: The Immortal Game — London, 1851.",
    commentarySegments: 5,
  },
  arena: {
    title: "The Immortal Game",
    subtitle: "1851 · London",
    description: [
      "London, 1851. The first international chess tournament has just concluded.\n\nAdolf Anderssen, the German schoolmaster turned chess genius, plays an informal game against Lionel Kieseritzky.",
      "Anderssen offers a pawn. Then a bishop. Then a rook. Then his queen.\n\nAt every turn, Kieseritzky accepts, unable to resist the temptation of free material.",
      "By the time the trap springs, it is too late.\n\nWith only a rook and two bishops remaining, Anderssen delivers checkmate.\n\nThe chess world calls it 'The Immortal Game' — and the name has never been challenged.",
    ],
    cast: [
      { role: "White", name: "Adolf Anderssen" },
      { role: "Black", name: "Lionel Kieseritzky" },
    ],
    director: "Anderssen",
    writer: "Phantasm Chess",
    tools: ["React Three Fiber", "Three.js", "Claude Sonnet 4.6"],
    nextEpisode: "Next: The Game of the Century — New York, 1956.",
    commentarySegments: 5,
  },
  molten: {
    title: "The Game of the Century",
    subtitle: "1956 · New York",
    description: [
      "New York, October 1956. The Rosenwald Memorial Tournament.\n\nDonald Byrne, a respected master and chess teacher, faces a thirteen-year-old boy named Robert James Fischer.",
      "No one in the room expects anything remarkable.\n\nThe boy has other plans.",
      "On move seventeen, Fischer sacrifices his queen — a piece worth nine pawns — to begin a combination spanning twenty more moves.\n\nThe chess world watches in disbelief.\n\nThe greatest game ever played by a child. Some say: by anyone.",
    ],
    cast: [
      { role: "White", name: "Donald Byrne" },
      { role: "Black", name: "Robert J. Fischer (age 13)" },
    ],
    director: "Fischer",
    writer: "Phantasm Chess",
    tools: ["React Three Fiber", "Three.js", "Claude Sonnet 4.6"],
    nextEpisode: "Next: The Opera Game — Paris, 1858.",
    commentarySegments: 5,
  },
  frost: {
    title: "The Evergreen Game",
    subtitle: "1852 · Berlin",
    description: [
      "Berlin, 1852. In a private parlor, two chess masters settle across from each other.\n\nAdolf Anderssen — the master of romantic attack — faces Jean Dufresne, a capable and dangerous opponent.",
      "Anderssen employs the Evans Gambit: a reckless pawn sacrifice for lightning development.\n\nDufresne accepts, confident in the material advantage.",
      "But Anderssen has seen what Dufresne has not.\n\nWith a sequence of devastating combinations — a double rook sacrifice, a queen sacrifice — he constructs an immortal attack.\n\nThe game is called 'The Evergreen' because its beauty never fades.",
    ],
    cast: [
      { role: "White", name: "Adolf Anderssen" },
      { role: "Black", name: "Jean Dufresne" },
    ],
    director: "Anderssen",
    writer: "Phantasm Chess",
    tools: ["React Three Fiber", "Three.js", "Claude Sonnet 4.6"],
    nextEpisode: "Next: Kasparov's Immortal — Wijk aan Zee, 1999.",
    commentarySegments: 5,
  },
  jade: {
    title: "The Opera Game",
    subtitle: "1858 · Paris Opera House",
    description: [
      "Paris, 1858. The opera Norma is playing at the Théâtre-Italien.\n\nPaul Morphy — America's greatest chess prodigy, on his European tour — is invited into a box by the Duke of Brunswick and Count Isouard.\n\nThey insist on a game. Morphy agrees, glancing at the stage between moves.",
      "The Duke and Count play as a team against the lone Morphy.\n\nIt does not help them.",
      "In seventeen moves, Morphy sacrifices two pieces to open the files, then offers his queen, then checkmates with a rook that waited silently since move one.\n\nThe game requires no notes. The beauty speaks for itself.\n\nIt is called 'The Opera Game' — the most elegant attack ever played.",
    ],
    cast: [
      { role: "White", name: "Paul Morphy" },
      { role: "Black", name: "Duke of Brunswick & Count Isouard" },
    ],
    director: "Morphy",
    writer: "Phantasm Chess",
    tools: ["React Three Fiber", "Three.js", "Claude Sonnet 4.6"],
    nextEpisode: "Next: The Evergreen Game — Berlin, 1852.",
    commentarySegments: 5,
  },
};
