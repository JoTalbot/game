# Physical Android Acceptance Record — журнал реального устройства

> Заполняется **только** на реальном физическом Android-устройстве. CI, эмулятор, симулятор и browser automation физическим evidence не являются.
> Шаблон унаследован от ветки `chore/physical-android-acceptance-2` (commit `21ca54b`), provenance перепривязана к актуальному состоянию `main` от 2026-09-17.
> Правила и полный контракт: `docs/PHYSICAL_ANDROID_ACCEPTANCE.md`. Процент готовности: `docs/READINESS.md` (гейт 8).

## 1. Тестируемый артефакт (заполнено фактом 2026-09-17, 14:15 UTC)

| Поле | Значение |
|---|---|
| Версия | `3.0.1` |
| versionCode | `601` |
| Source commit | `1f0a1b7ee1af88807ddc7b8c95d3e20a8868965e` |
| APK workflow run | `35232162470` (APK #1210, `workflow_dispatch`, `release_candidate=true`) — SUCCESS |
| Artifact | `igra-3.0.1` (ID `10502001833`) |
| APK файл | `igra-3.0.1.apk` |
| APK SHA-256 | `1c18e1c1bdefc44636b5bff62296a6cf5847d185b28df0bcffa454c0254d9056` |
| Подпись | release: `IGRA_SIGNING_MODE=release`, apksigner v2 `true` / v3 `true`, 1 signer |
| Сертификат (SHA-256 fingerprint) | `31:80:D0:AE:D6:E9:8D:7E:2B:06:CA:EE:FA:10:B8:7A:40:18:47:1F:41:92:34:4A:03:4E:95:AD:B7:44:D2:42` |
| Страница скачивания | https://github.com/JoTalbot/game/actions/runs/35232162470 |

Проверка агентом: APK скачан из artifact run `35232162470`, `sha256sum` = `1c18e1c1bdefc44636b5bff62296a6cf5847d185b28df0bcffa454c0254d9056` (совпадает с `igra-3.0.1.apk.sha256` внутри артефакта); сертификат извлечён из APK и совпадает с release keystore; `assets/www/sw.js` внутри APK содержит исправленную оболочку `igra-shell-v31`.

Предыдущий кандидат (**не тестировать**): commit `0643a33`, run `35229481075`, APK SHA-256 `3898a9408d52a22fd1f8237bc1650bebf6aa3da936125991d9de4f096c816396` — собран из `main` с дефектным `web/sw.js`.

Справочно:

- immutable RC `v3.0.1-rc1`: commit `9e8fe1a13804f2f5d00feb3b4ffbed60af203d44`, APK SHA-256 `160cec76dee27c903fab49506ea5c813b6430760c7021a03b85360f36c78f6bc`;
- debug-артефакт `main`: run `35157731486`, APK SHA-256 `01b9a92ff46f953431ddea73cfa8193ea54e90967fd2ab23f9b3f263e8d6382d` — для acceptance не годится.

### Независимая перепроверка кандидата (2026-09-18)

Проверка повторена в чистом контуре агентом (JDK 17 Temurin + Android build-tools 34.0.0) — см. `docs/RELEASE_CANDIDATE_VERIFICATION.md`:

- artifact `10502001833` скачан заново, `sha256sum` = `1c18e1c1bdefc44636b5bff62296a6cf5847d185b28df0bcffa454c0254d9056`;
- `apksigner verify`: v2 `true`, v3 `true`, 1 signer, сертификат `31:80:D0:AE:…:D2:42` (совпадает с релизным keystore и с `v3.0.1-rc1`); debug-сборка того же commit даёт другой сертификат → подпись действительно release;
- манифест: `world.igra.app`, versionCode `601`, versionName `3.0.1`, minSdk `26`, targetSdk `34`, `allowBackup=false`, `usesCleartextTraffic=false`, разрешения `VIBRATE`/`WAKE_LOCK`/`INTERNET`, единственный exported-компонент — launcher-activity; `screenOrientation=user_portrait`, `configChanges=0xda0` (activity не пересоздаётся при повороте);
- `assets/www` внутри APK байт-идентичен `web/` в `main` (93 файла) — сборка воспроизводима из исходников, отличается только блок подписи.

Это подтверждает, что физическому тестированию подлежит именно тот бинарник, за который себя выдаёт APK. Физический acceptance по-прежнему не выполнен.

## 2. Устройство

| Поле | Значение |
|---|---|
| Manufacturer / model | |
| Android version | |
| Screen resolution | |
| Density | |
| RAM | |
| Device profile | `weak-device` / other: |
| Дата/время старта (UTC) | |
| Дата/время финиша (UTC) | |

## 3. Acceptance matrix — 16 обязательных сценариев

Допустимые значения: `PASS` или `N/A` (с обязательной причиной). `FAIL` не принимается: при падении любого пункта acceptance не пройден, а дефект заводится отдельной записью.

| # | Проверка | Результат | Evidence / заметка |
|---|---|---|---|
| 1 | Clean install | PENDING | |
| 2 | Boot / birth / gameplay | PENDING | |
| 3 | Home → resume | PENDING | |
| 4 | Save → restart → recovery | PENDING | |
| 5 | Force-stop → recovery | PENDING | |
| 6 | Old save → upgrade | PENDING / N/A | |
| 7 | Offline | PENDING | |
| 8 | Release / Become / NG+ | PENDING | |
| 9 | Vibration | PENDING | |
| 10 | Audio | PENDING | |
| 11 | Fullscreen | PENDING | |
| 12 | Crash | PENDING | |
| 13 | ANR | PENDING | |
| 14 | Heavy-frame / performance blocker | PENDING | |
| 15 | Critical visual blocker | PENDING | |
| 16 | Critical touch blocker | PENDING | |

Показатели, которые стоит записать рядом с матрицей (как в `docs/RC1_SMOKE.md` / `docs/RC1_EVIDENCE.md`): длительность сессии, FPS, число тяжёлых кадров, касания, захваты взгляда, рост, срывы, шаги, пустые касания, пульсы, медиана/максимум ухода пальца, состояние native save, camera scale.

## 4. Правила

1. Каждый результат относится именно к указанному APK SHA-256 из раздела 1.
2. Evidence старого билда (включая `v3.0.1-rc1`) на новый кандидат не переносится.
3. `PENDING`, неполное прохождение или отсутствие evidence физическим acceptance не являются.
4. Crash, ANR, save failure, critical visual/touch blocker или heavy-frame blocker означают, что acceptance не пройден.
5. К журналу прикладываются конкретные артефакты со стабильными путями: фото/скриншоты, видео, логи (`adb logcat`), выгрузки in-game отчёта.
6. Только после фактического прохождения всех 16 пунктов можно фиксировать `physicalAndroid=true` в release evidence.
7. Фабрикация evidence и выдача synthetic fixture (`tools/probe/v23-v25-evidence.js`) за физический acceptance запрещены.

## 5. Валидация evidence

```bash
export IGRA_EXPECTED_APK_COMMIT={NEW_COMMIT}
export IGRA_EXPECTED_APK_SHA256={NEW_SHA}
export IGRA_PHYSICAL_ANDROID=1
# шаблон: docs/physical-android-evidence.template.json (скопировать и заполнить)
node tools/probe/physical-android-evidence.js physical-android-evidence.json
```

Отрицательный контроль (проверен агентом 2026-09-17): незаполненный шаблон валидатором **отклоняется** —
это подтверждает, что гейт не проходит «сам собой» без фактического физического прогона.

Для release authorization gate тот же JSON передаётся как `IGRA_PHYSICAL_ANDROID_EVIDENCE_JSON` и валидируется `tools/probe/validate-release-authorization.js` против `GITHUB_SHA` и `IGRA_RELEASE_APPROVED_APK_SHA256`. Approval-секреты выставляет человек после успешного физического acceptance.

## 6. Итог

- Physical Android acceptance: `PENDING`
- Объект теста: APK `1c18e1c1bdefc44636b5bff62296a6cf5847d185b28df0bcffa454c0254d9056` (release-signed, commit `1f0a1b7ee1af88807ddc7b8c95d3e20a8868965e`, run `35232162470`)
- Physical evidence attached: `NO`
- `IGRA_PHYSICAL_ANDROID=1`: `NOT SET`
- Production gate: `BLOCKED`
- Cap готовности: `90%` (см. `docs/READINESS.md`)

Этот файл — воспроизводимый журнал фиксации, а не доказательство прохождения.
