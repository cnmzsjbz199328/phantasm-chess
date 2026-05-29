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

---

## Audio / Visual Timing Specification

> **Authority**: This section is the single source of truth for audio–visual synchronisation. The `/timing-audit` skill audits the codebase against these invariants. Any code change that touches `useGameOrchestrator.ts`, `useCommentaryAudio.ts`, or `AppPhase` must remain consistent with every invariant listed here.

### Phase State Machine

Legal transitions only (no other transitions are permitted):

```
idle
  ──► countdown        user presses play
countdown
  ──► intro            currentMeta exists, after 3 s
  ──► playing          no currentMeta, after 3 s
intro
  ──► playing          handleIntroFinish()
playing
  ──► waitingForAudio  interval: currentStep === N-2 AND commentary not yet ended
  ──► finishing        interval: currentStep === N-1 AND commentary already ended
  ──► idle             interval: currentStep === N-1 AND no currentMeta
waitingForAudio
  ──► finishing        commentaryEnded React-state useEffect fires (normal path)
  ──► finishing        20 s fallback (onended never fired — guard only)
finishing
  ──► epilogue         commentaryEndTimerRef fires after 4 500 ms
  ──► epilogue         15 s fallback (timer guard only)
epilogue
  ──► outro            after 5 s (BGM continues playing)
outro
  ──► idle             user closes overlay (BGM fades out ~300 ms on close)
```

### Per-Phase Invariants

| Phase | `isPlaying` | `isCommentaryActive` | `isPaused` | Auto-interval |
|-------|-------------|----------------------|------------|---------------|
| idle / countdown / intro | false | false | false | stopped |
| **playing** | **true** | true | `!isPlaying && phase==='playing'` | running (4 500 ms) |
| **waitingForAudio** | **false** | **true** | **false** | **stopped** |
| finishing | false | true | false | stopped |
| epilogue | false | true | false | stopped |
| outro | false | true | false | stopped |

Critical: `isPaused = !isPlaying && appPhase === 'playing'`. This expression must never evaluate to `true` during `waitingForAudio`; commentary audio must keep playing uninterrupted.

### Final-Move Rule

The final chess move (step N-1) is played **exactly once**, by **exactly one** of:

1. The `commentaryEnded` React-state `useEffect` in `useGameOrchestrator` — commentary ends naturally while `appPhase === 'waitingForAudio'`
2. The 20 s fallback timeout — `onended` never fired (network failure / browser quirk)

These two paths are mutually exclusive. The 20 s fallback is cancelled by the `appPhase` effect cleanup the moment `appPhase` changes away from `waitingForAudio`.

### React 18 Concurrent-Mode Race — Resolved

In the previous design, `appPhaseRef.current` was updated during React render. A browser `onended` event could fire before React committed queued state updates, so the old `handleCommentaryEnd` callback could read a stale phase value.

**Resolution**: `handleCommentaryEnd` and `appPhaseRef` have been removed. Commentary end is now signalled via `commentaryEnded` React state (set by `setCommentaryEnded(true)` inside `useCommentaryAudio`). `useGameOrchestrator` reacts via `useEffect([appPhase, commentaryEnded])` — both values are guaranteed committed before the effect fires, eliminating the race entirely.

### BGM Ducking Rule

BGM volume is controlled by `commentaryIsPlaying` (content-based), **not** by `appPhase`. BGM must restore to full volume the instant the last commentary segment ends, regardless of which phase the app is in. Never key duck/unduck on phase transitions.

### Commentary Effect Re-run Guard

The commentary `useEffect` resets `isCommentaryEndedRef.current = false` unconditionally at its top. If this effect re-runs while commentary is already active (any dep changes), the reset is premature and will corrupt the gate used by the auto-play interval. Deps of this effect must be kept minimal and stable.
