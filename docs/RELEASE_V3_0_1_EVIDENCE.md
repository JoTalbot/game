# IGRA 3.0.1 — release evidence

## Current 3.0.1 engineering state (updated 2026-09-17)

- `main` HEAD: `06032bd32aa01e9ecc3a6ea36cc36b9930783543`
- CI on HEAD: APK #1203 run `35157731486` SUCCESS, Life Arc Gate #236 run `35157731498` SUCCESS, Sync play mirror #773 run `35157731495` SUCCESS, Pages run `35157730577` SUCCESS
- Debug engineering artifact: `igra-3.0.1.apk`, artifact ID `10471054268`, SHA-256 `01b9a92ff46f953431ddea73cfa8193ea54e90967fd2ab23f9b3f263e8d6382d` (ordinary main-branch CI, debug signing)
- Release-signed candidate for current `main`: **NOT CREATED** — requires `workflow_dispatch` of the APK workflow with `release_candidate=true`
- Superseded candidate: commit `1ddc7e90780679c802470943aae3b953d40fe817`, run `35141797041`, artifact `10465244020`, APK SHA-256 `7412b523baedac084d559359856fb4ea5ac9eb623dc2692b7b61f739e259e729`, ZIP SHA-256 `0b6b826476e801905f2cd25975a43660b3a5671d7d0b708d56f8ac12bac01deb` (debug signing; `main` has moved forward). Between `1ddc7e9` and `06032bd` only `docs/**`, `.github/workflows/life-arc.yml` and `tools/probe/*` changed — `web/` and `android/` content is identical.

The debug binary is deterministic and CI-verified, but it is not the release-signed production candidate and must not be used for physical acceptance or release approval.

## Historical V3-048 weak-device evidence

The following measurements are retained as historical engineering evidence and do not substitute for acceptance of the current release-signed candidate.

Device: `427×948 @1.0 (слабый)`.

Observed session:

- Played: `2.9 min`
- FPS: `49`
- Heavy frames: `1155`
- Heavy frames/min: approximately `398`
- Native save: alive
- Touches: `59`
- Gaze captures: `45`
- Growths: `30`
- Dropped gestures: `0`
- Empty touches: `4`
- Pulses: `1`
- Returns: `4`
- Anchors: `9`, current `3/3`
- Rescued: `2`
- Camera scale: `0.70..1.06`, average `1.01`
- Laws touched: `4`

Comparison with the pre-V3-048 weak-device baseline:

- FPS: `37 → 49` (`+32%`)
- Heavy-frame rate: approximately `553/min → 398/min` (`~28%` lower)
- The device remained stable for a 2.9-minute real session.

These measurements remain useful as historical performance evidence, but they are not evidence for the current release-signed APK.

## Automated evidence retained

The earlier V3-048 APK pipeline passed the automated stages recorded at the time, including RC hardening, lifecycle, soak, touch policy, low-device quality guard, density/spawn/render budgets, boot, WebView security, web mirror divergence, APK alignment/signing/checksum, and bounded-world checks.

## Current release gate interpretation

The code-level and deterministic gates are complete for the current engineering candidate. The remaining release operation is deliberately separate from source changes:

1. run the APK workflow manually with `release_candidate=true` on the current source;
2. obtain the resulting release-signed APK and exact SHA-256;
3. perform the full 16-scenario physical Android acceptance against that exact binary;
4. validate the resulting evidence against the exact commit and APK SHA;
5. only then authorize a production `v*` release.

No historical debug artifact or historical device session may be substituted for the current release-signed candidate.
