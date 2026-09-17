# Physical Android Acceptance Record — журнал реального устройства

> Заполняется **только** на реальном физическом Android-устройстве. CI, эмулятор, симулятор и browser automation физическим evidence не являются.
> Шаблон унаследован от ветки `chore/physical-android-acceptance-2` (commit `21ca54b`), provenance перепривязана к актуальному состоянию `main` от 2026-09-17.
> Правила и полный контракт: `docs/PHYSICAL_ANDROID_ACCEPTANCE.md`. Процент готовности: `docs/READINESS.md` (гейт 8).

## 1. Тестируемый артефакт

Release-signed кандидат актуального `main` на момент заполнения **ещё не создан**. Перед тестом нужно:

1. Открыть GitHub Actions → workflow **APK** → `Run workflow` → branch `main` → `release_candidate=true`.
2. Дождаться SUCCESS, скачать artifact `igra-3.0.1` именно из этого run.
3. Проверить SHA-256 скачанного `igra-3.0.1.apk` и вписать фактические значения ниже.

| Поле | Значение |
|---|---|
| Версия | `3.0.1` |
| versionCode | `601` |
| Source commit | `________________________` (40 hex, из run) |
| APK workflow run | `________________________` (run id / номер) |
| Artifact | `igra-3.0.1` (id `____________`) |
| APK SHA-256 | `________________________` (64 hex, `sha256sum igra-3.0.1.apk`) |
| Подпись | release (не debug) |
| Страница скачивания | `https://github.com/JoTalbot/game/actions/runs/<RUN_ID>` |

Справочно (не является объектом этого теста):

- immutable RC `v3.0.1-rc1`: commit `9e8fe1a13804f2f5d00feb3b4ffbed60af203d44`, APK SHA-256 `160cec76dee27c903fab49506ea5c813b6430760c7021a03b85360f36c78f6bc`;
- debug-артефакт `main` `06032bd`: APK SHA-256 `01b9a92ff46f953431ddea73cfa8193ea54e90967fd2ab23f9b3f263e8d6382d` — для acceptance не годится.

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
export IGRA_EXPECTED_APK_COMMIT=<source commit кандидата>
export IGRA_EXPECTED_APK_SHA256=<SHA-256 release-signed APK>
export IGRA_PHYSICAL_ANDROID=1
node tools/probe/physical-android-evidence.js physical-android-evidence.json
```

Для release authorization gate тот же JSON передаётся как `IGRA_PHYSICAL_ANDROID_EVIDENCE_JSON` и валидируется `tools/probe/validate-release-authorization.js` против `GITHUB_SHA` и `IGRA_RELEASE_APPROVED_APK_SHA256`. Approval-секреты выставляет человек после успешного физического acceptance.

## 6. Итог

- Physical Android acceptance: `PENDING`
- Physical evidence attached: `NO`
- `IGRA_PHYSICAL_ANDROID=1`: `NOT SET`
- Production gate: `BLOCKED`
- Cap готовности: `90%` (см. `docs/READINESS.md`)

Этот файл — воспроизводимый журнал фиксации, а не доказательство прохождения.
