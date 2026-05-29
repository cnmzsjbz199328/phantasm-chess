---
name: timing-audit
description: Audit the audio/visual timing implementation against the invariants defined in CLAUDE.md. Use when changes are made to useGameOrchestrator.ts or useCommentaryAudio.ts, or when verifying that timing behavior is correct.
disable-model-invocation: true
allowed-tools: Read Grep
---

Audit the audio/visual timing implementation against the specification in the "Audio / Visual Timing Specification" section of `CLAUDE.md`.

## Files to read

Read both implementation files in full before starting:

- `src/hooks/useGameOrchestrator.ts`
- `src/hooks/useCommentaryAudio.ts`

Also read the "Audio / Visual Timing Specification" section of `CLAUDE.md` as the authoritative standard.

## Checklist

Follow the 10-point checklist in [checklist.md](checklist.md). Work through each check in order. For each one:

1. Quote the relevant lines of code
2. Give a verdict: ✅ PASS, ❌ FAIL, or ⚠️ RISK (correct but fragile)
3. For FAIL/RISK: briefly describe the symptom and what the fix must achieve

## Output format

End with a summary table:

| # | Check | Verdict |
|---|-------|---------|
| 1 | Phase transitions | |
| 2 | isPlaying invariant | |
| 3 | isPaused expression | |
| 4 | Interval lifecycle | |
| 5 | Final-move uniqueness | |
| 6 | Commentary-end React 18 safety | |
| 7 | BGM ducking | |
| 8 | isCommentaryEndedRef reset | |
| 9 | commentaryRef after last segment | |
| 10 | Theme switch reset | |

Then list only FAIL and RISK items with a one-line description of what must be fixed. Do not fix anything — report only.
