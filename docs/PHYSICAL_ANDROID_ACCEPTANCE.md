# Physical Android Acceptance

## Current release candidate

Physical Android acceptance is required for the production gate. CI, Android emulators/simulators, and browser runs do not count as physical-device evidence.

Current APK provenance (обновлено 2026-09-17 14:15 UTC, смена агента):

- **Актуальный объект физического acceptance:** commit `1f0a1b7ee1af88807ddc7b8c95d3e20a8868965e`, APK workflow run `35232162470` (APK #1210, `workflow_dispatch` с `release_candidate=true`) — SUCCESS, artifact `igra-3.0.1` ID `10502001833`, **APK SHA-256 `1c18e1c1bdefc44636b5bff62296a6cf5847d185b28df0bcffa454c0254d9056`**, подпись release (`IGRA_SIGNING_MODE=release`, apksigner v2/v3 `true`, fingerprint сертификата `31:80:D0:AE:D6:E9:8D:7E:2B:06:CA:EE:FA:10:B8:7A:40:18:47:1F:41:92:34:4A:03:4E:95:AD:B7:44:D2:42`). Скачивание: https://github.com/JoTalbot/game/actions/runs/35232162470
- CI на этом commit зелёный: APK #1209, Life Arc Gate #241, Sync play mirror #779, Pages #1341 — SUCCESS.
- Предыдущий кандидат commit `0643a336657e571ee7aed786fbb362b0da3fed98` / run `35229481075` / APK SHA `3898a9408d52a22fd1f8237bc1650bebf6aa3da936125991d9de4f096c816396` **устарел**: собран из `main` с синтаксически сломанным `web/sw.js` (регрессия найдена и исправлена в `1f0a1b7`). Не использовать для acceptance.
- Инженерный debug-артефакт `main` (run `35157731486`, SHA `01b9a92ff46f953431ddea73cfa8193ea54e90967fd2ab23f9b3f263e8d6382d`) кандидатом не является: debug-подпись меняет SHA и запрещена для `v*` тегов.
- Исторический immutable RC: `v3.0.1-rc1`, commit `9e8fe1a13804f2f5d00feb3b4ffbed60af203d44`, APK SHA-256 `160cec76dee27c903fab49506ea5c813b6430760c7021a03b85360f36c78f6bc` (сверено фактическим скачиванием 2026-09-17). Его физический smoke закрыл `RC-PHYS-001` **только для rc1** и не переносится на новый кандидат.

Provenance-переменные для валидаторов:

```bash
export IGRA_EXPECTED_APK_COMMIT=1f0a1b7ee1af88807ddc7b8c95d3e20a8868965e
export IGRA_EXPECTED_APK_SHA256=1c18e1c1bdefc44636b5bff62296a6cf5847d185b28df0bcffa454c0254d9056
```

Журнал для заполнения на устройстве: `docs/PHYSICAL_ANDROID_ACCEPTANCE_RECORD.md`.

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
export IGRA_EXPECTED_APK_COMMIT={NEW_COMMIT}
export IGRA_EXPECTED_APK_SHA256={NEW_SHA}
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
