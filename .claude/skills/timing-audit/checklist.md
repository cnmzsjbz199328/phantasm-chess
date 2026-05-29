# Timing Audit Checklist

## Check 1 — Phase transitions: only legal paths

List every `setAppPhase(...)` call site, the phase it sets, and the condition under which it fires. Flag any transition not listed in the state machine in CLAUDE.md.

---

## Check 2 — `isPlaying` invariant

`isPlaying` must be `true` only during `playing` phase when auto-advance is active.

- Every `setIsPlaying(true)` call: is it gated to a transition that enters `playing`?
- Is `setIsPlaying(false)` called at the same time as `setAppPhase('waitingForAudio')`, in the same synchronous block (so React 18 batches them)?
- Is there any path that sets `isPlaying = true` while `appPhase !== 'playing'`?

---

## Check 3 — `isPaused` expression

The expression passed as `isPaused` to `useCommentaryAudio` must be exactly:

```
!isPlaying && appPhase === 'playing'
```

Verify the expression at the call site. Confirm it evaluates to `false` during `waitingForAudio` (`isPlaying=false`, `appPhase='waitingForAudio'` → `false`). Commentary must never be paused during `waitingForAudio`.

---

## Check 4 — Auto-play interval lifecycle

- The interval `useEffect` deps must include `isPlaying`.
- When `isPlaying` becomes `false`, the cleanup must `clearInterval` before any new interval starts.
- Confirm no interval runs while `appPhase === 'waitingForAudio'` (i.e., the effect re-runs with `isPlaying=false` → no new interval).

---

## Check 5 — Final-move uniqueness (single execution)

Trace every call to `nextStep()` for the final move (step N-1). There must be exactly two paths, and they must be mutually exclusive:

- **Path A** `commentaryEnded` React-state `useEffect` in `useGameOrchestrator`: only fires when `appPhase === 'waitingForAudio'` (both values committed before effect runs)
- **Path B** fallback timeout: only fires after the configured 20 s timeout in `waitingForAudio`

Confirm Path B's timer is cancelled via `useEffect` cleanup when `appPhase` leaves `waitingForAudio`.
Confirm Path A cannot re-fire: once `setAppPhase('finishing')` is called, subsequent effect runs with `appPhase !== 'waitingForAudio'` fall through.

---

## Check 6 — Commentary-end / phase coordination (React 18 safety)

The commentary-end signal must be coordinated via React state (not a bare ref or callback) so that `useEffect` sees consistent committed values.

Check:

- Is `commentaryEnded` declared as React state (`useState`) inside `useCommentaryAudio`, not just a ref?
- Does `useGameOrchestrator` react to it via `useEffect([appPhase, commentaryEnded])` (not via a callback prop)?
- Is `appPhaseRef` absent from the codebase? Its presence would be a regression to the old racy design.
- If `onended` fires while React is between renders, does the `commentaryEnded` state update get batched and committed before the effect runs? (Answer: yes — React 18 guarantees `useEffect` fires after commit; the race is structurally impossible.)

If `commentaryEnded` is a ref (not state) or coordination is done via callback: ❌ FAIL. Symptom: game can stall in `waitingForAudio` under React 18 concurrent-mode scheduling, falling back to the 20 s timeout.

---

## Check 7 — BGM ducking is content-based, not phase-based

Find the duck/unduck logic in `useCommentaryAudio`. Verify:

- It is keyed on `commentaryIsPlaying` state (driven by audio `onended`), not on `appPhase`.
- The `bgVol` slider effect reads `commentaryIsPlayingRef.current` (a ref) to compute effective volume, avoiding stale-closure re-ducks.

---

## Check 8 — `isCommentaryEndedRef` reset safety

The commentary `useEffect` resets `isCommentaryEndedRef.current = false` at the top of the effect body. Check the effect's deps array. For each dep, verify it remains stable during normal gameplay (after commentary starts). If any dep could change mid-game, the premature reset is a live bug.

---

## Check 9 — `commentaryRef.current` after last segment

After the last segment ends, `playSegment` exits without clearing `commentaryRef.current`. The pause/resume `useEffect` may call `.play()` on this ended element, restarting the last segment.

Check: is there any phase transition or dep change in the pause/resume effect (`[isPaused, isCommentaryActive, isAudioActive]`) that occurs after the last segment ends and before `appPhase` reaches `idle`? If so, the last segment restarts.

---

## Check 10 — Theme switch: full reset

When `themeIdx` changes, verify the theme-switch `useEffect`:

- Clears `commentaryEndTimerRef`, `waitingFallbackInnerTimerRef`, `outroTimerRef`
- Sets `isPlaying = false`
- Sets `appPhase = 'idle'`

Also confirm the fallback timer (local to the `appPhase` effect) is cancelled via its effect cleanup when `appPhase` transitions to `idle`.
