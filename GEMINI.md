# Phantasm Chess Technical Stack

Phantasm Chess is a cinematic, 3D chess visualization engine designed for high-fidelity tactical analysis.

## Core Architecture
- **Framework**: React 18 (TypeScript)
- **Build Tool**: Vite
- **Engine**: [Chess.js](https://github.com/jhlywa/chess.js) for move validation, PGN parsing, and game state management.

## 3D Rendering Pipeline
- **Renderer**: [React Three Fiber](https://r3f.docs.pmnd.rs/) (Three.js abstraction for React).
- **Scene Helpers**: [@react-three/drei](https://github.com/pmndrs/drei) (Camera controls, Environment, Shadows).
- **Post-Processing**: [@react-three/postprocessing](https://github.com/pmndrs/postprocessing) for:
    - **Bloom**: For neon glow effects on pieces and UI.
    - **Noise & Vignette**: For the "cinematic film" look.
- **Custom Shaders**: Custom GLSL implemented via `ShaderMaterial` for the "Dissolve" piece transitions and hologram effects.

## Animation System
- **Tactical Animations**: [GSAP](https://gsap.com/) (GreenSock) for high-precision, piece-specific capture sequences (Knight jumps, Queen divine ascents, etc.).
- **Hologram Effects**: [Motion 3D](https://motion.dev/3d) (Framer Motion) for layout-linked 3D transitions.
- **UI Transitions**: Standard Framer Motion for tactical log overlays and HUD elements.

## Design & UI
- **Styling**: Tailwind CSS 4.0.
- **Typography**: Inter (UI) and JetBrains Mono (Tactical Data).
- **Icons**: Lucide React.
- **Piece Modeling**: Custom block-composed "LEGO-style" voxel models built directly with Three.js primitives for performance efficiency without external asset load overhead.

## Unique Features
- **Dynamic Dissolve**: Pieces transition using a spatial noise-based dissolve shader instead of simple opacity fades.
- **Battle Intelligence Overlay**: Real-time narrative extraction based on game state variance.
- **Cinematic Navigation Rail**: A dedicated structural rail for high-level tactical context.
