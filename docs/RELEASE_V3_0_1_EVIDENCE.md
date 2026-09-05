# IGRA 3.0.1 — release evidence

## Candidate

- Version: `3.0.1`
- Candidate commit before this evidence record: `1f7dcf824e7efe193a06f01bdc3795e13283bb2b`
- Previous production `v3.0.0` remains immutable.
- This document records the final V3-048 device pass and the automated RC evidence.

## Real weak-device acceptance

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

The 49 FPS result is accepted as RC evidence because the product is materially smoother, the heavy-frame rate is substantially lower, touch/growth behavior remains functional, and no dropped gestures were observed. No further performance reduction is justified solely to chase one additional average FPS on this device.

## Automated RC evidence

The V3-048 APK pipeline passed all automated stages on the candidate before this evidence commit:

- Release candidate/content gate: PASS
- RC hardening/localization/lifecycle/soak: PASS
- Touch policy and hysteresis: PASS
- V3-047 touch-target/return-meaning: PASS
- V3-048 low-device quality guard: PASS
- Start-density, density guard, spawn budget, render budget: PASS
- Boot probe: PASS
- WebView security checks: PASS
- Web mirror divergence check: PASS
- APK build, alignment, signing verification and checksum: PASS

The hardening suite exercised a 120-second real-engine soak without update exceptions and verified bounded world/transient collections and available heap measurements.

## Release gate interpretation

The code-level RC gate is ready. The real weak-device session confirms the V3-048 performance direction and native persistence path.

Remaining release operation is deliberately separate from source changes:

1. final release-tag build must use the configured release keystore, never the debug key;
2. the resulting release APK checksum must be recorded with the release asset;
3. clean-install / upgrade / process-death / offline smoke should be performed on the release-signed APK, because a debug artifact is not an adequate substitute for the Play release artifact.

No new gameplay mechanics are introduced by this evidence commit. V3.0.1 remains frozen except for blocker/critical fixes discovered by the release-signed smoke test.
