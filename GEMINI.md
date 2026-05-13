# Phantasm Chess Project Documentation

Phantasm Chess is a high-fidelity, cinematic 3D chess visualization engine built for tactical analysis and immersive viewing. It features humanoid piece designs, procedural animations, and a cyberpunk aesthetic.

## Core Tech Stack

- **Framework**: [React 19](https://react.dev/) (TypeScript)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **3D Engine**: [React Three Fiber](https://r3f.docs.pmnd.rs/) (Three.js abstraction)
- **3D Utilities**: [@react-three/drei](https://github.com/pmndrs/drei)
- **Post-Processing**: [@react-three/postprocessing](https://github.com/pmndrs/postprocessing)
- **Logic**: [Chess.js](https://github.com/jhlywa/chess.js) (Move validation, PGN parsing)
- **Animation**: [GSAP](https://gsap.com/) (Tactical piece movements) & [Motion](https://motion.dev/) (UI/Transitions)
- **Styling**: [Tailwind CSS 4.0](https://tailwindcss.com/)
- **AI Integration**: [@google/genai](https://www.npmjs.com/package/@google/genai) (For tactical narrative generation)

## Project Structure

- `src/`: Main application source code.
    - `components/3d/`: R3F components for the board, pieces, and environment.
        - `PieceManager.tsx`: Orchestrates piece rendering and animations based on game state.
        - `HumanoidPiece.tsx`: Modern humanoid model implementation.
        - `VoxelPiece.tsx`: Legacy block-based piece models.
        - `Shaders.ts`: Custom GLSL shaders (e.g., Dissolve effect).
    - `hooks/`: Custom React hooks.
        - `useChessEngine.ts`: Manages `chess.js` instance and history navigation.
    - `shared/`: Shared constants, types, and theme definitions.
        - `themes.ts`: Atmosphere and lighting configurations.
        - `attackAnimations.ts`: GSAP timelines for capture sequences.
- `piece-showcase/`: A standalone developer tool for testing piece models, animations, and VFX.
    - Accessible via `/piece-showcase/index.html` in dev mode.
    - Contains `PIECE_DESIGN_SPEC.md` detailing the humanoid piece requirements.
- `public/`: Static assets (textures, env maps).

## Key Workflows

### Development
- **Main App**: `npm run dev` (Starts Vite on port 3000).
- **Piece Showcase**: Run `npm run dev` and navigate to `http://localhost:3000/piece-showcase/`.

### Building
- `npm run build`: Generates production assets in `dist/`. Note that it builds both the main app and the showcase.

### Linting & Types
- `npm run lint`: Runs `tsc --noEmit` for comprehensive type checking.

### Environment Variables
The project requires the following variables in a `.env` or `.env.local` file:
- `GEMINI_API_KEY`: Required for AI-powered tactical narratives.
- `APP_URL`: (Optional) The hosted URL of the application, used for self-referential links.

## Design Specifications

### Visual Style
- **Theme**: Cyberpunk / Phantasm.
- **White Pieces**: Cyber Cyan (`#00d2ff`), tech-oriented, "Light" side.
- **Black Pieces**: Crimson/Obsidian (`#ff0055`), dark energy, "Dark" side.
- **Transitions**: Pieces use a noise-based "Dissolve" shader for entry/exit instead of simple opacity fades.

### Animation Principles
- **Weight**: Pieces have "weight" expressed through GSAP easing (e.g., Rook uses `elastic.out` on impact).
- **Sequencing**: Captures trigger a specific sequence: Attacker animation -> Impact VFX -> Victim dissolve.

## Future Development Notes

- **AI Narratives**: The `@google/genai` integration is intended for generating real-time tactical commentary based on move strength (eval) and game history.
- **Model Upgrades**: Transitioning from procedural geometry (current) to optimized `.glb` models with skeletal animation is a priority. See `piece-showcase/PIECE_DESIGN_SPEC.md` for bone/naming conventions.
