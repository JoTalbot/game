# IGRA 3.0.1 — release evidence

## Current release candidate

- Version: `3.0.1`
- versionCode: `601`
- Source commit: `1ddc7e90780679c802470943aae3b953d40fe817`
- APK workflow: `35141797041` — SUCCESS
- Actions artifact: `igra-3.0.1` (artifact ID `10465244020`)
- APK SHA-256: `7412b523baedac084d559359856fb4ea5ac9eb623dc2692b7b61f739e259e729`
- Artifact ZIP SHA-256: `0b6b826476e801905f2cd25975a43660b3a5671d7d0b708d56f8ac12bac01deb`
- Signing: debug, ordinary main-branch CI

The current deterministic artifact passed the automated APK gate, but it is not the release-signed binary for physical acceptance.

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
