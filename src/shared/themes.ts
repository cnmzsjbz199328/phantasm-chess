interface BoardTheme {
  dark: string;
  light: string;
  darkEmissive: string;
  lightEmissive: string;
  emissiveIntensity: number;
  frame: string;
}

export interface WorldTheme {
  variant: "abyss" | "molten" | "frost" | "jade" | "arena";
  ground: string;          // far ground plane (100×100 bedrock)
  courtyard: string;       // close-in paving (22×22)
  stone: string;           // battlement / post stone
  stoneEmissive: string;   // stone emissive
  terrain: string;         // outer rubble blocks
  terrainEmissive: string; // terrain emissive
  glowA: string;           // primary accent glow (towers, crystals, tree foliage emissive)
  glowB: string;           // secondary accent glow
  treeTrunk: string;       // tree trunk color
  treeFoliage: string;     // tree foliage base color (emissive = glowA)
}

export interface SceneTheme {
  id: string;
  nameCN: string;
  nameEN: string;
  dot: string;
  backdrop: string;
  background: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  ambientIntensity: number;
  spotColor: string;
  spotIntensity: number;
  pointColor: string;
  pointIntensity: number;
  bloomThreshold: number;
  bloomIntensity: number;
  bloomRadius: number;
  board: BoardTheme;
  world: WorldTheme;
}

export const THEMES: SceneTheme[] = [
  // ─── 深渊幻域 ─────────────────────────────────────────────────────────────────
  // Dark navy void; cyber-cyan clashes with crimson. The "canonical" WorldStage look.
  {
    id: "abyss",
    nameCN: "卡帕不朽局",
    nameEN: "Kasparov",
    dot: "#2aaabf",
    backdrop:
      "radial-gradient(circle at 20% 18%, rgba(0,120,160,0.22), transparent 30%), " +
      "radial-gradient(circle at 78% 22%, rgba(160,0,60,0.18), transparent 26%), " +
      "linear-gradient(145deg, #020610 0%, #060c1c 45%, #010308 100%)",
    background: "#020610",
    fogColor: "#020610",
    fogNear: 16,
    fogFar: 36,
    ambientIntensity: 0.3,
    spotColor: "#1a6080",
    spotIntensity: 0.7,
    pointColor: "#800030",
    pointIntensity: 0.5,
    bloomThreshold: 0.5,
    bloomIntensity: 0.45,
    bloomRadius: 0.3,
    board: {
      dark: "#080810", light: "#111120",
      darkEmissive: "#000000", lightEmissive: "#000810",
      emissiveIntensity: 0.1,
      frame: "#050510",
    },
    world: {
      variant: "abyss",
      ground: "#050810",
      courtyard: "#08101c",
      stone: "#0c1422",
      stoneEmissive: "#020608",
      terrain: "#080c18",
      terrainEmissive: "#020508",
      glowA: "#00d2ff",
      glowB: "#ff0055",
      treeTrunk: "#060810",
      treeFoliage: "#020610",
    },
  },

  // ─── 罗马斗兽场 ───────────────────────────────────────────────────────────────
  // Golden hour in the ancient arena. Dusty sand, weathered travertine, and warm torches.
  {
    id: "arena",
    nameCN: "不朽名局",
    nameEN: "Immortal",
    dot: "#ffcc33",
    backdrop:
      "radial-gradient(circle at 50% 10%, rgba(255,180,60,0.18), transparent 30%), " +
      "radial-gradient(circle at 20% 80%, rgba(120,60,20,0.15), transparent 30%), " +
      "linear-gradient(145deg, #1a120a 0%, #2a1e12 50%, #120c06 100%)",
    background: "#1a120a",
    fogColor: "#1a120a",
    fogNear: 15,
    fogFar: 40,
    ambientIntensity: 0.4,
    spotColor: "#ffd480",
    spotIntensity: 0.9,
    pointColor: "#ff8040",
    pointIntensity: 0.6,
    bloomThreshold: 0.6,
    bloomIntensity: 0.4,
    bloomRadius: 0.35,
    board: {
      dark: "#2a1a0d", light: "#d2b48c",
      darkEmissive: "#1a0d00", lightEmissive: "#4a3a2a",
      emissiveIntensity: 0.1,
      frame: "#1a120a",
    },
    world: {
      variant: "arena",
      ground: "#2d241a",
      courtyard: "#c2b280",
      stone: "#d2b48c",
      stoneEmissive: "#1a120a",
      terrain: "#4a3c2a",
      terrainEmissive: "#1a120a",
      glowA: "#ffaa00",
      glowB: "#cc4400",
      treeTrunk: "#3d2b1f",
      treeFoliage: "#1a120a",
    },
  },

  // ─── 熔炉烈焰 ─────────────────────────────────────────────────────────────────
  // Volcanic forge. Scorched stone, ember sparks, molten orange and deep red.
  {
    id: "molten",
    nameCN: "世纪之局",
    nameEN: "Century",
    dot: "#ff7030",
    backdrop:
      "radial-gradient(circle at 50% 10%, rgba(220,80,0,0.3), transparent 26%), " +
      "radial-gradient(circle at 20% 82%, rgba(160,20,0,0.22), transparent 30%), " +
      "linear-gradient(145deg, #0e0400 0%, #120500 50%, #080200 100%)",
    background: "#0e0400",
    fogColor: "#0c0400",
    fogNear: 11,
    fogFar: 26,
    ambientIntensity: 0.18,
    spotColor: "#c06010",
    spotIntensity: 1.2,
    pointColor: "#660000",
    pointIntensity: 0.8,
    bloomThreshold: 0.34,
    bloomIntensity: 0.72,
    bloomRadius: 0.42,
    board: {
      dark: "#180500", light: "#220800",
      darkEmissive: "#200000", lightEmissive: "#300800",
      emissiveIntensity: 0.22,
      frame: "#140400",
    },
    world: {
      variant: "molten",
      ground: "#0a0300",
      courtyard: "#0e0500",
      stone: "#1a0c00",
      stoneEmissive: "#0a0300",
      terrain: "#140700",
      terrainEmissive: "#080300",
      glowA: "#ff6600",
      glowB: "#cc2200",
      treeTrunk: "#180600",
      treeFoliage: "#0c0300",
    },
  },

  // ─── 霜境幽灵 ─────────────────────────────────────────────────────────────────
  // Arctic night. Crystalline ice, cold blue light, desolate silence.
  {
    id: "frost",
    nameCN: "常青名局",
    nameEN: "Evergreen",
    dot: "#8be0ff",
    backdrop:
      "radial-gradient(circle at 50% 20%, rgba(80,160,220,0.2), transparent 28%), " +
      "radial-gradient(circle at 22% 76%, rgba(140,180,220,0.12), transparent 30%), " +
      "linear-gradient(145deg, #030810 0%, #050c18 50%, #020508 100%)",
    background: "#030810",
    fogColor: "#030810",
    fogNear: 20,
    fogFar: 46,
    ambientIntensity: 0.5,
    spotColor: "#4080c0",
    spotIntensity: 0.8,
    pointColor: "#8090c0",
    pointIntensity: 0.55,
    bloomThreshold: 0.5,
    bloomIntensity: 0.34,
    bloomRadius: 0.28,
    board: {
      dark: "#080e1c", light: "#0e1828",
      darkEmissive: "#020810", lightEmissive: "#081428",
      emissiveIntensity: 0.14,
      frame: "#060c18",
    },
    world: {
      variant: "frost",
      ground: "#030810",
      courtyard: "#06101c",
      stone: "#0a1424",
      stoneEmissive: "#030810",
      terrain: "#080e1e",
      terrainEmissive: "#040814",
      glowA: "#88ccff",
      glowB: "#c0d8ff",
      treeTrunk: "#080d1a",
      treeFoliage: "#0d1628",
    },
  },

  // ─── 翡翠炼狱 ─────────────────────────────────────────────────────────────────
  // Ancient dark ritual. Poisonous jade seeping through void purple ruin.
  {
    id: "jade",
    nameCN: "歌剧院局",
    nameEN: "Opera",
    dot: "#00e878",
    backdrop:
      "radial-gradient(circle at 24% 20%, rgba(0,180,80,0.22), transparent 28%), " +
      "radial-gradient(circle at 76% 72%, rgba(100,0,160,0.18), transparent 28%), " +
      "linear-gradient(145deg, #030c06 0%, #040e08 50%, #020804 100%)",
    background: "#020a04",
    fogColor: "#020a04",
    fogNear: 14,
    fogFar: 32,
    ambientIntensity: 0.28,
    spotColor: "#108050",
    spotIntensity: 0.88,
    pointColor: "#400070",
    pointIntensity: 0.72,
    bloomThreshold: 0.42,
    bloomIntensity: 0.5,
    bloomRadius: 0.32,
    board: {
      dark: "#040e06", light: "#061808",
      darkEmissive: "#001806", lightEmissive: "#002008",
      emissiveIntensity: 0.14,
      frame: "#030e06",
    },
    world: {
      variant: "jade",
      ground: "#020a04",
      courtyard: "#060f08",
      stone: "#0c1810",
      stoneEmissive: "#040a06",
      terrain: "#081208",
      terrainEmissive: "#030806",
      glowA: "#00e878",
      glowB: "#8800dd",
      treeTrunk: "#091208",
      treeFoliage: "#051007",
    },
  },
];
