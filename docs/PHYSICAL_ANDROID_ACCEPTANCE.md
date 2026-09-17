# Physical Android Acceptance

## Current release candidate

Physical Android acceptance is required for the production gate. CI, Android emulators/simulators, and browser runs do not count as physical-device evidence.

Current APK provenance (обновлено 2026-09-17, смена агента):

- `main` HEAD: `06032bd32aa01e9ecc3a6ea36cc36b9930783543`, CI полностью зелёный (APK #1203 run `35157731486`, Life Arc Gate #236 run `35157731498`, Sync play mirror #773 run `35157731495`, Pages run `35157730577`).
- Инженерный debug-артефакт `main`: `igra-3.0.1.apk`, SHA-256 `01b9a92ff46f953431ddea73cfa8193ea54e90967fd2ab23f9b3f263e8d6382d` (artifact `10471054268`). **Не является кандидатом**: debug-подпись меняет SHA и запрещена для `v*` тегов.
- **Release-signed кандидат СОЗДАН 2026-09-17**: commit `0643a336657e571ee7aed786fbb362b0da3fed98`, APK workflow run `35229481075` (#1205, `workflow_dispatch` с `release_candidate=true`) — SUCCESS, artifact `igra-3.0.1` ID `10500832061`, **APK SHA-256 `3898a9408d52a22fd1f8237bc1650bebf6aa3da936125991d9de4f096c816396`**, подпись release (apksigner v2/v3 `true`, fingerprint `31:80:D0:AE:D6:E9:8D:7E:2B:06:CA:EE:FA:10:B8:7A:40:18:47:1F:41:92:34:4A:03:4E:95:AD:B7:44:D2:42`). Именно этот бинарник является объектом физического acceptance.
- Прежняя привязка к кандидату `1ddc7e90780679c802470943aae3b953d40fe817` / APK SHA `7412b523baedac084d559359856fb4ea5ac9eb623dc2692b7b61f739e259e729` / ZIP SHA `0b6b826476e801905f2cd25975a43660b3a5671d7d0b708d56f8ac12bac01deb` **устарела**: `main` ушёл вперёд, а артефакт был debug-signed. Между `1ddc7e9` и `06032bd` менялись только `docs/**`, `.github/workflows/life-arc.yml` и `tools/probe/*`; содержимое `web/` и `android/` идентично.
- Исторический immutable RC: `v3.0.1-rc1`, commit `9e8fe1a13804f2f5d00feb3b4ffbed60af203d44`, APK SHA-256 `160cec76dee27c903fab49506ea5c813b6430760c7021a03b85360f36c78f6bc` (сверено фактическим скачиванием 2026-09-17). Его физический smoke 14.09 закрыл `RC-PHYS-001` **только для rc1** и не переносится на новый кандидат.

Provenance-переменные заполняются после создания release-signed кандидата:

```bash
export IGRA_EXPECTED_APK_COMMIT=0643a336657e571ee7aed786fbb362b0da3fed98
export IGRA_EXPECTED_APK_SHA256=3898a9408d52a22fd1f8237bc1650bebf6aa3da936125991d9de4f096c816396
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
export IGRA_EXPECTED_APK_COMMIT=0643a336657e571ee7aed786fbb362b0da3fed98
export IGRA_EXPECTED_APK_SHA256=3898a9408d52a22fd1f8237bc1650bebf6aa3da936125991d9de4f096c816396
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
