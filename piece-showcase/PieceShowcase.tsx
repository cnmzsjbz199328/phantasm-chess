import { Canvas, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { useState, useRef, useCallback } from "react";
import { VoxelPieceModel } from "../src/components/3d/VoxelPiece";
import { HumanoidPieceModel } from "./HumanoidPiece";
import { AttackEffect } from "./AttackEffect";
import "../src/components/3d/Shaders";

// ── constants ─────────────────────────────────────────────────────────────────

const PIECE_TYPES = [
  { type: "k", name: "King"   },
  { type: "q", name: "Queen"  },
  { type: "r", name: "Rook"   },
  { type: "b", name: "Bishop" },
  { type: "n", name: "Knight" },
  { type: "p", name: "Pawn"   },
];

const SPACING = 2.4;
const WHITE_Y =  1.5;
const BLACK_Y = -1.5;
const EFFECT_Z =  2.0; // world Z where effect spawns (in front of piece)

type Style = "voxel" | "humanoid";
type Color = "w" | "b";

interface ActiveEffect {
  id: number;
  pieceType: string;
  pieceColor: Color;
  position: [number, number, number];
}

// ── scene ─────────────────────────────────────────────────────────────────────

interface PiecesGroupProps {
  dissolve: number;
  style: Style;
  triggers: Record<string, number>;
  onPieceClick: (pieceType: string, pieceColor: Color, pieceIndex: number, rowY: number) => void;
  onImpact: (pieceType: string, pieceColor: Color, pieceIndex: number, rowY: number) => void;
}

function PiecesGroup({ dissolve, style, triggers, onPieceClick, onImpact }: PiecesGroupProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const handlePointerOver = (key: string) => {
    setHovered(key);
    document.body.style.cursor = "pointer";
  };
  const handlePointerOut = () => {
    setHovered(null);
    document.body.style.cursor = "auto";
  };

  return (
    <>
      <Html position={[-SPACING * 3.1, WHITE_Y + 0.2, 0]} center>
        <span style={{ color: "#00d2ff", fontFamily: "monospace", fontSize: "10px", letterSpacing: "0.15em", opacity: 0.7 }}>WHITE</span>
      </Html>
      <Html position={[-SPACING * 3.1, BLACK_Y - 0.2, 0]} center>
        <span style={{ color: "#ff0055", fontFamily: "monospace", fontSize: "10px", letterSpacing: "0.15em", opacity: 0.7 }}>BLACK</span>
      </Html>

      {PIECE_TYPES.map((piece, i) => {
        const x = (i - 2.5) * SPACING;

        return (
          <group key={piece.type}>
            {/* ── white piece ── */}
            {(["w", "b"] as Color[]).map((clr) => {
              const rowY = clr === "w" ? WHITE_Y : BLACK_Y;
              const key = `${clr}-${piece.type}`;
              const isHovered = hovered === key;

              return (
                <group
                  key={clr}
                  position={[x, rowY, 0]}
                  onClick={(e: ThreeEvent<MouseEvent>) => {
                    e.stopPropagation();
                    onPieceClick(piece.type, clr, i, rowY);
                  }}
                  onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); handlePointerOver(key); }}
                  onPointerOut={() => handlePointerOut()}
                >
                  {style === "humanoid" ? (
                    <HumanoidPieceModel
                      type={piece.type}
                      color={clr}
                      dissolve={dissolve}
                      attackTrigger={triggers[key] ?? 0}
                      onImpact={() => onImpact(piece.type, clr, i, rowY)}
                    />
                  ) : (
                    <VoxelPieceModel type={piece.type} color={clr} dissolve={dissolve} />
                  )}

                  {/* hover indicator ring */}
                  <mesh
                    position={[0, -0.78, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    scale={isHovered ? 0.55 : 0.42}
                  >
                    <ringGeometry args={[1, 1.15, 32]} />
                    <meshBasicMaterial
                      color={clr === "w" ? "#00d2ff" : "#ff0055"}
                      transparent
                      opacity={isHovered ? 0.55 : 0.2}
                      depthWrite={false}
                    />
                  </mesh>
                </group>
              );
            })}

            {/* piece label */}
            <Html position={[x, 0, 0]} center>
              <span style={{
                color: "#334155", fontFamily: "monospace",
                fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase",
                userSelect: "none",
              }}>
                {piece.name}
              </span>
            </Html>
          </group>
        );
      })}
    </>
  );
}

// ── main component ────────────────────────────────────────────────────────────

const btn = (active: boolean, col = "#00d2ff") => ({
  background:  active ? `${col}18` : "transparent",
  border:      `1px solid ${active ? col + "80" : "#1e3a5f"}`,
  color:       active ? col : "#475569",
  padding:     "5px 16px",
  fontSize:    "0.68rem",
  letterSpacing: "0.12em",
  cursor:      "pointer",
  borderRadius: 3,
  fontFamily:  "monospace",
  transition:  "all 0.2s",
} as const);

export function PieceShowcase() {
  const [dissolve,    setDissolve]    = useState(0);
  const [autoRotate,  setAutoRotate]  = useState(false);
  const [style,       setStyle]       = useState<Style>("humanoid");
  const [triggers,    setTriggers]    = useState<Record<string, number>>({});
  const [effects,     setEffects]     = useState<ActiveEffect[]>([]);
  const effectId = useRef(0);

  const triggerAttack = useCallback((pieceType: string, pieceColor: Color) => {
    const key = `${pieceColor}-${pieceType}`;
    setTriggers(prev => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }));
  }, []);

  const spawnEffect = useCallback((
    pieceType: string, pieceColor: Color, pieceIndex: number, rowY: number,
  ) => {
    const x = (pieceIndex - 2.5) * SPACING;
    const id = effectId.current++;
    setEffects(prev => [...prev, {
      id,
      pieceType,
      pieceColor,
      position: [x, rowY + 0.5, EFFECT_Z],
    }]);
  }, []);

  const removeEffect = useCallback((id: number) => {
    setEffects(prev => prev.filter(e => e.id !== id));
  }, []);

  const handlePieceClick = useCallback((
    pieceType: string, pieceColor: Color, pieceIndex: number, rowY: number,
  ) => {
    if (style === "humanoid") {
      // animation drives onImpact → effect spawns at the right moment
      triggerAttack(pieceType, pieceColor);
    } else {
      // voxel mode: no body animation, spawn effect immediately
      spawnEffect(pieceType, pieceColor, pieceIndex, rowY);
    }
  }, [style, triggerAttack, spawnEffect]);

  const handleImpact = useCallback((
    pieceType: string, pieceColor: Color, pieceIndex: number, rowY: number,
  ) => {
    spawnEffect(pieceType, pieceColor, pieceIndex, rowY);
  }, [spawnEffect]);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#020912", fontFamily: "monospace" }}>

      {/* header */}
      <div style={{ position: "absolute", top: 24, width: "100%", textAlign: "center", zIndex: 10, pointerEvents: "none" }}>
        <div style={{ color: "#00d2ff", fontSize: "1.1rem", letterSpacing: "0.35em" }}>PHANTASM CHESS</div>
        <div style={{ color: "#1e3a5f", fontSize: "0.65rem", letterSpacing: "0.2em", marginTop: 6 }}>PIECE DESIGN SHOWCASE</div>
      </div>

      {/* click hint */}
      <div style={{ position: "absolute", top: 76, width: "100%", textAlign: "center", zIndex: 10, pointerEvents: "none" }}>
        <span style={{ color: "#1e3a5f", fontSize: "0.6rem", letterSpacing: "0.18em" }}>
          CLICK ANY PIECE TO ATTACK
        </span>
      </div>

      {/* controls */}
      <div style={{
        position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)",
        zIndex: 10, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap", justifyContent: "center",
      }}>
        {/* style toggle */}
        <div style={{ display: "flex", borderRadius: 4, overflow: "hidden", border: "1px solid #1e3a5f" }}>
          <button style={{ ...btn(style === "voxel"), borderRadius: 0, border: "none", borderRight: "1px solid #1e3a5f" }}
            onClick={() => setStyle("voxel")}>VOXEL</button>
          <button style={{ ...btn(style === "humanoid"), borderRadius: 0, border: "none" }}
            onClick={() => setStyle("humanoid")}>HUMANOID</button>
        </div>

        {/* dissolve */}
        <label style={{ color: "#475569", fontSize: "0.72rem", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ letterSpacing: "0.1em" }}>DISSOLVE</span>
          <input type="range" min="0" max="1" step="0.01" value={dissolve}
            onChange={e => setDissolve(parseFloat(e.target.value))}
            style={{ width: 110, accentColor: "#00d2ff", cursor: "pointer" }}
          />
          <span style={{ color: "#00d2ff", minWidth: 34, textAlign: "right" }}>{Math.round(dissolve * 100)}%</span>
        </label>

        {/* auto rotate */}
        <button onClick={() => setAutoRotate(v => !v)} style={btn(autoRotate)}>AUTO ROTATE</button>
      </div>

      <Canvas camera={{ position: [0, 1.5, 15], fov: 45 }} gl={{ antialias: true }}>
        <color attach="background" args={["#020912"]} />
        <fog attach="fog" args={["#020912", 20, 40]} />
        <ambientLight intensity={0.25} />
        <pointLight position={[0, 8, 6]}   intensity={2.5} color="#00d2ff" />
        <pointLight position={[-8, 3, -4]} intensity={1.2} color="#8e2de2" />
        <pointLight position={[8, 3, -4]}  intensity={0.9} color="#ff0055" />

        <PiecesGroup
          dissolve={dissolve}
          style={style}
          triggers={triggers}
          onPieceClick={handlePieceClick}
          onImpact={handleImpact}
        />

        {/* active attack effects */}
        {effects.map(eff => (
          <AttackEffect
            key={eff.id}
            pieceType={eff.pieceType}
            pieceColor={eff.pieceColor}
            position={eff.position}
            onComplete={() => removeEffect(eff.id)}
          />
        ))}

        <gridHelper args={[40, 40, "#060f1e", "#060f1e"]} position={[0, -3, 0]} />

        <OrbitControls
          autoRotate={autoRotate}
          autoRotateSpeed={1.2}
          enablePan={false}
          minDistance={7}
          maxDistance={25}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}
