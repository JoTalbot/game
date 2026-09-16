# Physical Android Acceptance

## Current release candidate

Physical Android acceptance is required for the production gate. CI, Android emulators/simulators, and browser runs do not count as physical-device evidence.

Current APK provenance:

- Version: `3.0.1`
- versionCode: `601`
- Commit: `1ddc7e90780679c802470943aae3b953d40fe817`
- APK workflow run: `35141797041`
- APK artifact: `igra-3.0.1` (artifact ID `10465244020`)
- APK SHA-256: `7412b523baedac084d559359856fb4ea5ac9eb623dc2692b7b61f739e259e729`
- GitHub Actions artifact ZIP SHA-256: `0b6b826476e801905f2cd25975a43660b3a5671d7d0b708d56f8ac12bac01deb`

The Actions ZIP digest is not the APK digest. Physical installation and evidence provenance must use the APK SHA-256 above.

Required provenance environment:

```bash
export IGRA_EXPECTED_APK_COMMIT=1ddc7e90780679c802470943aae3b953d40fe817
export IGRA_EXPECTED_APK_SHA256=7412b523baedac084d559359856fb4ea5ac9eb623dc2692b7b61f739e259e729
```

## Acceptance rules

Evidence must come from a real physical Android device. Emulator/simulator evidence is rejected. The evidence file must identify the exact APK provenance above, contain UTC timestamps, set `physicalAndroid=true`, set `IGRA_PHYSICAL_ANDROID=true` inside the evidence object, and be validated with the runtime environment variable `IGRA_PHYSICAL_ANDROID=1` when running the canonical validator.

The acceptance matrix contains these 16 mandatory scenarios:

1. Clean install
2. Boot / birth / gameplay
3. Home → resume
4. Save → restart → recovery
5. Force-stop → recovery
6. Old save → upgrade
7. Offline
8. Release / Become / NG+
9. Vibration
10. Audio
11. Fullscreen
12. Crash
13. ANR
14. Heavy-frame / performance blocker
15. Critical visual blocker
16. Critical touch blocker

Each scenario must be `PASS` or `N/A`. Every `N/A` requires a reason. `FAIL` is not accepted. At least one evidence item is required.

## Collector

The collector verifies the APK SHA-256 and records physical-device metadata. It intentionally creates a `PENDING` evidence template and does **not** prove physical acceptance by itself.

```bash
bash tools/probe/collect-physical-android-evidence.sh \
  igra-3.0.1.apk \
  physical-android-evidence.json
```

The collector requires `adb`, `sha256sum`, `node`, the APK file, and the provenance environment variables above. It rejects emulator/simulator identity signals.

## Validator

After completing all 16 scenarios on the physical device, export the exact candidate provenance and physical flag, then run:

```bash
export IGRA_EXPECTED_APK_COMMIT=1ddc7e90780679c802470943aae3b953d40fe817
export IGRA_EXPECTED_APK_SHA256=7412b523baedac084d559359856fb4ea5ac9eb623dc2692b7b61f739e259e729
export IGRA_PHYSICAL_ANDROID=1
node tools/probe/physical-android-evidence.js physical-android-evidence.json
```

For the release authorization gate, the same evidence is supplied as `IGRA_PHYSICAL_ANDROID_EVIDENCE_JSON` and must be bound to the release `GITHUB_SHA` plus `IGRA_RELEASE_APPROVED_APK_SHA256`. The release workflow performs this canonical validation only for `v*` tags, after building and checksum-verifying the APK and before publishing the GitHub Release.

The validator rejects missing or incorrect APK provenance, incomplete scenarios, duplicate or unknown scenarios, missing `N/A` reasons, `FAIL` statuses, missing evidence, non-UTC timestamps, emulator/simulator evidence, or missing physical-device flags.

## Evidence requirements

Evidence should be sufficient to identify the physical device and the observed result for each scenario. Suitable items include screenshots/photos, recorded observations, log excerpts, or other concrete artifacts with stable paths. Do not fabricate evidence and do not mark CI/emulator observations as physical acceptance.

The collector is a metadata/provenance helper only. It intentionally emits `PENDING` results and cannot authorize production.

## Production rule

Physical Android acceptance is a separate gate from deterministic CI validation. Production remains blocked until the current APK `3.0.1` / versionCode `601` passes the complete physical-device acceptance matrix with exact provenance, and the resulting evidence is validated successfully.

A previous physical-device smoke test for an older build must not be reused as evidence for the current candidate.
