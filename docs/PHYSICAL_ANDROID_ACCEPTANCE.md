# Physical Android Acceptance

## Current release candidate

Physical Android acceptance is required for the production gate. CI, Android emulators/simulators, and browser runs do not count as physical-device evidence.

Current APK provenance:

- Version: `3.0.1`
- versionCode: `601`
- Commit: `c24a79b3de8248620b4c2b6c0c8d48c78f00aff0`
- APK workflow run: `35114704164`
- APK artifact: `igra-3.0.1` (artifact ID `10455805062`)
- APK SHA-256: `629ba40569803742f728a67cda6646a3091bcf82855ed2afe88e750131e0b453`
- GitHub Actions artifact ZIP SHA-256: `3a5fe478b581898995bdc693004cf403a5e7debb98c85fabeddf780907cdcbaf`

Required validator provenance:

```bash
export IGRA_EXPECTED_APK_COMMIT=c24a79b3de8248620b4c2b6c0c8d48c78f00aff0
export IGRA_EXPECTED_APK_SHA256=629ba40569803742f728a67cda6646a3091bcf82855ed2afe88e750131e0b453
```

## Acceptance rules

Evidence must come from a real physical Android device. Emulator/simulator evidence is rejected. The evidence file must identify the exact APK provenance above, contain UTC timestamps, set `physicalAndroid=true`, and be validated with `IGRA_PHYSICAL_ANDROID=1`.

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

After completing all 16 scenarios on the physical device:

```bash
export IGRA_PHYSICAL_ANDROID=1
node tools/probe/physical-android-evidence.js physical-android-evidence.json
```

The validator rejects missing or incorrect APK provenance, incomplete scenarios, missing `N/A` reasons, missing evidence, non-UTC timestamps, emulator/simulator evidence, or missing physical-device flags.

## Production rule

Physical Android acceptance is a separate gate from deterministic CI validation. Production remains blocked until the current APK `3.0.1` / versionCode `601` passes the complete physical-device acceptance matrix with exact provenance, and the resulting evidence is validated successfully.

A previous physical-device smoke test for an older build must not be reused as evidence for the current candidate.
