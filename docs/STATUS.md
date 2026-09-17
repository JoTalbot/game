# ИГРА — статус проекта

> Обновлено: 2026-09-17 (смена агента). Источник фактов: `git log`, GitHub API (runs/releases/artifacts), локальные probes.
> Процент готовности и арифметика по 15 гейтам: `docs/READINESS.md`. Точка resume: `agent/state/current.yml`.

## Текущее состояние `main`

- HEAD: `0643a336657e571ee7aed786fbb362b0da3fed98` (2026-09-17, docs/state batch); предыдущий инженерный HEAD `06032bd32aa01e9ecc3a6ea36cc36b9930783543`.
- CI на `0643a33` — все контуры SUCCESS: APK #1204 (`35229457058`, debug), APK #1205 (`35229481075`, **release-signed кандидат**), Life Arc Gate #237 (`35229457159`), Sync play mirror #774 (`35229457088`), Pages (`35229455404`).
- CI на HEAD — все четыре контура SUCCESS:
  - APK #1203 — run `35157731486`;
  - Life Arc Gate #236 — run `35157731498`;
  - Sync play mirror #773 — run `35157731495`;
  - pages build and deployment — run `35157730577`.
- RC2 evidence artifact `10471972268`: `deterministicReady=true`, `physicalAndroid=false`, `productionReady=false`, `missing=[]`, все blockers `false`.
- Локальный прогон смены (Node 20 в песочнице агента, CI использует Node 22):
  - `tools/probe/run.js` → **363/363 PASS**;
  - полный набор Life Arc Gate (54 probes + `life-workflow` + `release-workflow-contract-test` + `rc-hardening` + 3 evidence-теста) → **60/60 PASS**;
  - `find web/js -name '*.js' -print0 | xargs -0 -n1 node --check` → 78 файлов, 0 ошибок;
  - `tools/check-sync.sh` → PASS; `tools/check-android-security.sh` → PASS;
  - `tools/probe/render-budget.js` → PASS (V3-052); `tools/probe/balance.js` → PASS.

## Артефакты

### Immutable RC (не двигать)

- Тег: `v3.0.1-rc1`, commit `9e8fe1a13804f2f5d00feb3b4ffbed60af203d44`, опубликован 2026-09-09T18:21:34Z.
- APK asset `igra-3.0.1.apk`, SHA-256 `160cec76dee27c903fab49506ea5c813b6430760c7021a03b85360f36c78f6bc`.
  Значение **сверено фактическим скачиванием** release asset 2026-09-17. Ранее в `README.md`, `docs/BACKLOG_POST_RC.md` и `docs/PUBLISH.md` была опечатка (`…fab4956ea…`) — исправлена этой сменой.
- Флаг Pre-release: `false`. Переключение флага — решение человека (см. `docs/BACKLOG_POST_RC.md`, раздел 2).

### Инженерный debug-артефакт `main` (не кандидат)

- Run `35157731486`, artifact `10471054268` (`igra-3.0.1`), файл `igra-3.0.1.apk`.
- APK SHA-256 `01b9a92ff46f953431ddea73cfa8193ea54e90967fd2ab23f9b3f263e8d6382d`.
- Подпись **debug** (обычный push-build `main`). Страница скачивания: https://github.com/JoTalbot/game/actions/runs/35157731486
- Этот бинарник подтверждает детерминированную сборку, но **не** является release-кандидатом и не годится для физического acceptance.

### Release-signed кандидат актуального `main` — СОЗДАН 2026-09-17

- Source commit: `0643a336657e571ee7aed786fbb362b0da3fed98` (`main` HEAD на момент dispatch).
- Запуск: `workflow_dispatch` APK **#1205**, run `35229481075` — SUCCESS.
- Artifact: `igra-3.0.1` (ID `10500832061`), файл `igra-3.0.1.apk`.
- **APK SHA-256: `3898a9408d52a22fd1f8237bc1650bebf6aa3da936125991d9de4f096c816396`** (сверено локально `sha256sum` после скачивания; совпадает с `igra-3.0.1.apk.sha256` из артефакта).
- Подпись: **release**. Факт из лога run: `release signing key loaded`, `IGRA_SIGNING_MODE: release`, `zipalign + sign (release)`, `apksigner verify` → v2 `true`, v3 `true`, 1 signer.
- Сертификат подписи (SHA-256 fingerprint): `31:80:D0:AE:D6:E9:8D:7E:2B:06:CA:EE:FA:10:B8:7A:40:18:47:1F:41:92:34:4A:03:4E:95:AD:B7:44:D2:42`, `notBefore Aug 19 2026` — стабильный release keystore, а не debug-ключ сборки (debug-сертификат каждой сборки генерируется заново, `notBefore Sep 16 2026`, fingerprint `40:E0:75:3F:…`).
- Страница артефакта: https://github.com/JoTalbot/game/actions/runs/35229481075
- GitHub Release не публиковался (публикация tag-only), `v3.0.1-rc1` не тронут.
- Это и есть объект физического Android acceptance (`RC-PHYS-002`).
- Ранее зафиксированный кандидат `1ddc7e90780679c802470943aae3b953d40fe817` / SHA `7412b523baedac084d559359856fb4ea5ac9eb623dc2692b7b61f739e259e729` устарел: `main` ушёл на 13 коммитов вперёд, а сам артефакт был debug-signed.
  Важно: `1ddc7e9..06032bd` меняли только `docs/**`, `.github/workflows/life-arc.yml` и `tools/probe/*` — содержимое `web/` и `android/` идентично, то есть детерминированная часть игры не изменилась.

## Production gate

`productionReady = deterministicReady && physicalAndroid`

- `deterministicReady` — **TRUE** (факт: RC2 evidence + зелёный CI на HEAD).
- `physicalAndroid` — **FALSE**.
- Итог: **BLOCKED**.

Причина: release-signed кандидат создан (`3898a9408d52a22fd1f8237bc1650bebf6aa3da936125991d9de4f096c816396`), но физический Android acceptance на реальном устройстве не выполнен — это human blocker. `IGRA_PHYSICAL_ANDROID=1` искусственно не устанавливается, evidence не фабрикуется.

## Сверка противоречий документов (2026-09-17)

Зафиксировано расхождение: `docs/BACKLOG_POST_RC.md` (от 14.09) объявлял `RC-PHYS-001` закрытым, тогда как `docs/STATUS.md` и `docs/HANDOFF_CURRENT.md` (от 16.09) — PENDING.

Проверка фактом:

1. `RC-PHYS-001` действительно закрыт, но **для immutable артефакта `v3.0.1-rc1`** (SHA `160cec76…`, Android 15, 427×948 @1.0, weak-device, 10 минут, `docs/RC1_SMOKE.md`). Это исторический факт, и он верен.
2. Для **текущего production-кандидата** (актуальный `main`) физический acceptance не выполнялся: нет ни release-signed сборки, ни evidence. Правило `docs/PHYSICAL_ANDROID_ACCEPTANCE.md` прямо запрещает переносить evidence старого билда на новый кандидат.
3. Вывод: оба утверждения истинны в разных областях. Гейт 8 (Android) в `docs/READINESS.md` считается как «rc1 закрыт исторически, текущий кандидат PENDING», cap 90% действует.

Второе расхождение: `docs/BACKLOG_V4.md` и `docs/BACKLOG_POST_RC.md` помечали V6-005..007, V7-*, V8-*, P9-*, V11-* как «следующий batch», хотя соответствующие слои реализованы и покрыты зелёными probes/CI. Статусы обновлены по факту; первоисточник процента — `docs/READINESS.md`.

## Что осталось

1. ~~**REL-001:**~~ **ВЫПОЛНЕНО 2026-09-17:** release-signed кандидат создан (run `35229481075`, APK SHA-256 `3898a9408d52a22fd1f8237bc1650bebf6aa3da936125991d9de4f096c816396`).
2. **REL-002:** подготовить пакет физического acceptance (журнал 16 сценариев + PENDING evidence JSON + команды валидации), привязанный к exact commit/SHA.
3. **REL-003 (human blocker):** выполнить 16 сценариев на реальном Android-устройстве, валидировать evidence через `tools/probe/physical-android-evidence.js` и `tools/probe/validate-release-authorization.js`.
4. Повторить RC2/release gate на exact кандидате.
5. Финально сверить `docs/STORE.md` и `docs/PRIVACY.md` с фактическим APK.
6. Принять отдельное production release decision (человек) и только затем публиковать/выставлять флаги.

## Статус milestone V11 (восстановлено из истории `ec95ccf`, 15.09.2026)

- V11-001 first-session UX — реализован (`web/js/v11-first-session.js`, probe PASS).
- V11-002 balance — детерминированный коридор закрыт: commit `6cbb8952d52012e53bd305da015e83cefffbf16c`, APK #1089 и Life Arc #123 SUCCESS.
- V11-003 visual/audio coherence — закрыт: commit `9e5639c3e1b82cf81611986957b98a8ca36ce577`, APK #1090, Life Arc #124, Sync play mirror #616 SUCCESS.
- V11-004 long-session — автоматический soak закрыт (10 000-step bounded soak, `tools/probe/long.js`, `rc-hardening.js`); физический weak-device soak остаётся за `RC-PHYS-002`.
- V11-005 localization/accessibility — реализован (`v11-accessibility.js`, `accessibility.js`).
- V11-006 release QA matrix — структурный gate на 15 сценариев реализован (`v11-release-qa.js`); физическое исполнение остаётся отдельным evidence и не подменяется автоматическим тестом.

## Контуры среды (факт смены 2026-09-17)

- GitHub PAT валиден. Особенность: git-эндпоинты принимают токен только по **Basic**-схеме (`x-access-token:<token>`), `Authorization: Bearer` для `info/refs` возвращает `401 invalid credentials`. Remote URL оставлен чистым, доступ через `GIT_ASKPASS` вне рабочей области.
- SSH `ubuntu@129.213.177.56` → `Permission denied (publickey)`; переданный ключ сервером не принимается. Проект сервер не использует: docker/воркеры/локальные LLM в репозитории не заявлены и фактом не подтверждены.
- Локально в песочнице агента: Node 20 (CI — 22), JDK 11 (для сборки нужен 17), Android SDK/adb/эмулятор/Playwright/Docker отсутствуют. Локальная сборка APK невозможна; сборка выполняется CI.
