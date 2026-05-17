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

## Coding Standards

### TypeScript

- No `as any`. Use proper interfaces or discriminated unions. When bridging R3F JSX and custom shader materials, prefer `as unknown as ComponentType` or `declare module` augmentation over silencing the compiler.
- Export types from `src/shared/` when they cross component boundaries. Keep component-local types inline.
- Prefer `interface` for object shapes, `type` for unions and aliases.

### Three.js Resource Lifecycle

Every `THREE.BufferGeometry` or `THREE.Material` created in a component **must** be disposed:

```typescript
// ✅ correct
const mat = useMemo(() => new THREE.MeshStandardMaterial({ ... }), [dep]);
useEffect(() => () => mat.dispose(), [mat]);

// ❌ wrong — leaks GPU memory on every dep change or unmount
const mat = useMemo(() => new THREE.MeshStandardMaterial({ ... }), [dep]);
```

Module-level singletons (created once, never recreated) do not need disposal hooks.

Use `instancedMesh` for any geometry repeated more than ~4 times in a scene. Populate matrices in a single `useEffect`, set `instanceMatrix.needsUpdate = true` after writing.

### React Three Fiber Patterns

- Avoid `useState` / `setState` for values that change every frame. Use `useRef` and mutate directly; R3F picks up changes on the next render.
- Guard `useFrame` callbacks early when the hot path can be skipped:

```typescript
useFrame(() => {
  if (!ref.current || !isActive) return;
  // ...
});
```

- Use a `wasActive` ref to flush a final update when a condition transitions to false, then skip all subsequent frames.
- Never create `THREE` objects (geometries, materials, vectors) inside `useFrame`.

### Performance Checklist When Adding R3F / drei Components

Before merging a PR that introduces a new R3F or drei component, answer these three questions:

1. **Does it open a RenderTarget?** Helpers like `ContactShadows`, `Reflector`, `AccumulativeShadows`, `MeshTransmissionMaterial`, `MotionBlur` re-render the scene into an offscreen texture each frame. Read the source or props (`frames`, `resolution`, `samples`) and pick the cheapest setting that meets the visual bar. Default `frames={Infinity}` is rarely the right answer.
2. **Does it allocate Three.js objects on the hot path?** `new THREE.Vector3()` / `new THREE.Color()` / `gsap.to()` inside `useFrame` or per-render is a leak vector. Hoist to `useMemo` or module scope.
3. **Does it keep working when invisible?** A component hidden via `opacity=0` still runs `useFrame` and material updates. Unmount (`return null`) instead of hiding when the cost is non-trivial.

Append `?stats=1` to the dev or production URL to mount the drei `<Stats />` overlay (FPS / ms / memory). Use it on the lowest-end target device before claiming a change has no perf impact.

### GSAP + R3F Animation

Mutate `Group.position` / `Group.rotation` via GSAP; R3F renders the result every frame without React re-renders. Always kill in-flight tweens before starting a new one:

```typescript
gsap.killTweensOf([posRef, rotRef]);
const tl = gsap.timeline({ onComplete: () => gsap.set([posRef, rotRef], { x: 0, y: 0, z: 0 }) });
```

### Component Design

- One component per file. Keep render functions under ~150 lines; split into sub-components otherwise.
- Scene sub-components that are only used within a single parent file may be defined in the same file (e.g., `Ground`, `Tower` inside `WorldStage.tsx`).
- Shared pure utilities (deterministic noise, math helpers) belong in `src/shared/`. Do not duplicate across pages.

### Shared Code Between Pages

The two pages (`src/` and `piece-showcase/`) share code via relative imports. Import from `src/shared/` or `src/components/` only — never import from `piece-showcase/` into `src/`.

### Styling

Tailwind utility classes for all HTML/DOM elements. Avoid inline `style={{}}` objects in production components (acceptable in the `piece-showcase` sandbox). Do not add a `tailwind.config.js`; custom tokens go in `src/index.css` under `@layer base` / CSS variables.
