# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies (required before first run)
npm run dev          # Dev server at http://localhost:3000 (binds 0.0.0.0)
npm run build        # Production build (both pages)
npm run preview      # Preview production build
npm run lint         # TypeScript type-check only (no ESLint configured)
```

No test runner is configured.

## Environment

Copy `.env.example` to `.env` and set `GEMINI_API_KEY` for the Gemini AI narrative feature. The key is inlined at build time via `vite.config.ts` → `define`.

## Architecture

### Multi-Page Vite App

Two separate pages, both built from the same `node_modules`:

| Entry | URL | Purpose |
|---|---|---|
| `index.html` → `src/main.tsx` | `/` | Main chess viewer app |
| `piece-showcase/index.html` → `piece-showcase/main.tsx` | `/piece-showcase/` | Standalone piece design sandbox |

The `build.rollupOptions.input` in `vite.config.ts` declares both entries for production builds.

### Main App Data Flow

```
useChessEngine (hook)
  └─ chess.js parses PGN from src/data/matches.ts
  └─ boardState: chess.js board() output (8×8 array of {type, color} | null)
  └─ lastMove, isCapture: derived from history[currentStep]

App.tsx
  └─ PieceManager (consumes boardState, lastMove, isCapture)
      └─ PieceWrapper (per-piece, handles attack/move animations via GSAP)
          └─ VoxelPieceModel (renders geometry + DissolveMaterial shader)
      └─ AttackEffect (spawned on capture impact, auto-removes after 1.5s)
  └─ Board (static 8×8 board geometry)
  └─ UIOverlay (HTML overlay: move history, narrative, playback controls)
```

### Custom Shader: DissolveMaterial

Defined in `src/components/3d/Shaders.ts` using `shaderMaterial` from `@react-three/drei`. Must be imported (side-effect only) before use — the `extend({ DissolveMaterial })` call registers the JSX element `<dissolveMaterial>`. Uniforms: `uTime` (animated in `useFrame`), `uDissolve` (0–1), `uBaseColor`, `uColor` (glow edge), `uNoiseScale`.

### Attack Animation Pattern

GSAP mutates Three.js `Group.position` / `Group.rotation` directly. R3F renders every frame and picks up the changes without React re-renders. The pattern across both apps:

```typescript
gsap.killTweensOf([p, r]);  // cancel any in-flight tween
const tl = gsap.timeline({ onComplete: () => gsap.set([p, r], { x: 0, y: 0, z: 0 }) });
tl.to(...).call(onImpact).to(...);  // onImpact triggers visual effect spawn
```

### Piece Showcase (`piece-showcase/`)

Isolated from the main app. Key files:

- `HumanoidPiece.tsx` — full-limb humanoid piece models (box/cylinder geometry), one component per piece type
- `attackAnimations.ts` — `playAttackAnimation(pieceType, group, onImpact)` — same GSAP pattern as main app
- `AttackEffect.tsx` — particle systems (`ParticleBurst`), expanding rings (`ExpandingRing`), flash sphere, light pillar; each effect unmounts via `onComplete` callback after 1.15s
- `PieceShowcase.tsx` — orchestrates 12 pieces (6 types × 2 colors), manages `effects[]` state, routes click → attack trigger → impact → effect spawn

The showcase imports `DissolveMaterial` from the main app at `../src/components/3d/Shaders`.

### Color System

Both apps use the same two-sided palette:

| Role | White (`"w"`) | Black (`"b"`) |
|---|---|---|
| Primary | `#00d2ff` Cyber Cyan | `#ff0055` Crimson |
| Secondary | `#c8d8e8` Silver | `#2a1a2e` Obsidian |
| Accent | `#ffcc00` Gold | `#8e2de2` Purple |
| Dark | `#0a2540` Navy | `#1a0510` Deep Black |
| Glow | `#00f2ff` | `#ff0055` |

### Tailwind

Uses Tailwind v4 with the `@tailwindcss/vite` plugin (no `tailwind.config.js`). Custom design tokens (`bg-phantasm-bg`, `bg-phantasm-accent`, etc.) are defined in `src/index.css`.

### Path Alias

`@/*` resolves to the project root. Use `@/src/...` or `@/piece-showcase/...`.
