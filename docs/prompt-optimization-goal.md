# Prompt Optimization Goal

This document defines the repeatable goal-mode loop for changing `src/shared/reversePrompt.ts`.

## Objective

Improve image-to-prompt reconstruction quality without changing the public `PromptAnalysis` schema or adding model/provider-specific syntax.

The workflow must cover:

- Plan: identify the visual reconstruction gap and the expected behavior.
- Implementation: update the reverse prompt contract with the smallest useful edit.
- Review: check schema compatibility, drift-control rules, and generator neutrality.
- Validation: run local static checks, typecheck, and build.
- Simulated use: test representative prompt outputs as if a user copied them into a generator.
- Cleanup: leave no unneeded worker threads or temporary generated artifacts as source files.

## Success Criteria

A prompt optimization is ready only when all of these are true:

- `REVERSE_PROMPT_SYSTEM` still asks for valid JSON only.
- The top-level JSON shape still matches `PromptAnalysis`.
- `recreation_prompt` is treated as the primary generation prompt.
- The prompt contract prioritizes aspect ratio, crop, subject count, relative placement, camera geometry, motion/focus, background anchors, lighting, material finish, and medium.
- `negative_prompt` is image-specific and blocks likely drift, not just generic defects.
- `recreation_prompt` and `prompt_core` remain generator-neutral. They must not include Midjourney, Stable Diffusion, LoRA, or model parameter syntax.
- Simulated user cases preserve load-bearing visual anchors and include image-specific negative blockers.

## Commands

Run the prompt-specific goal gate:

```bash
npm run check:prompt-goal
```

Run the normal implementation gates:

```bash
npm run typecheck
npm run build
```

For release readiness, keep using the existing release flow after packaging:

```bash
npm run release:package
npm run release:check
```

## Human-Use Simulation

`scripts/check-prompt-goal.mjs` includes two representative cases:

- `orbital_anime_energy`: a high-style anime energy scene where the prompt must preserve vertical crop, oblique aerial geometry, Earth background, subject placement, hair motion, clothing, and energy convergence.
- `monochrome_studio_portrait`: a controlled studio portrait where the prompt must preserve monochrome crop, low seated pose, chair material, twin lamps, wall texture, and boot perspective.

The simulation does not call external models. It validates the prompt output shape a human would copy into a generator:

- readable one-line `recreation_prompt`
- compressed `prompt_core`
- comma-separated `negative_prompt`
- visual anchors preserved
- drift blockers present
- no generator-specific syntax

## Review Checklist

Before accepting a prompt change:

- Compare the new rules against at least two visually different reference cases.
- Check whether the rules reduce generic beauty/poster drift.
- Check whether the rules preserve strong composition, camera geometry, material behavior, and motion.
- Check whether the negative prompt names likely wrong outcomes for the image type.
- Check whether the change keeps local-first behavior and does not add network calls, telemetry, secrets, or provider lock-in.

## Goal Completion

The goal is complete when the code change, goal gate, normal build gates, and simulated human-use checks all pass, and the final status names the files changed plus the commands run.
