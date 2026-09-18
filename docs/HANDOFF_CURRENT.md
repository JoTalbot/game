# Актуальная передача смены

**Дата:** 18.09.2026 (смена агента, UTC-фиксация в `agent/state/current.yml`)

Это короткая актуальная карта проекта. Исторический `docs/HANDOFF.md` содержит старые записи 2.x и не должен использоваться как источник текущего release-статуса.

## Что обязательно прочитать перед работой

1. `agent/state/current.yml` — единая точка resume: кандидат, гейты, ветки, следующий шаг.
2. `docs/READINESS.md` — процент готовности по 15 гейтам с арифметикой, весами и cap (пересчёт №4, 2026-09-18).
3. `docs/STATUS.md` — фактическое техническое состояние.
4. `docs/RELEASE_CANDIDATE_VERIFICATION.md` — независимая проверка бинарника кандидата (2026-09-18).

## Текущее состояние

- `v3.0.1-rc1` опубликован и **immutable**. Не двигать, не переписывать, не заменять.
  - commit `9e8fe1a13804f2f5d00feb3b4ffbed60af203d44`, APK SHA-256 `160cec76dee27c903fab49506ea5c813b6430760c7021a03b85360f36c78f6bc` (перепроверено скачиванием 2026-09-18).
  - Pre-release флаг всё ещё `false` — переключение является решением человека.
- `main` = `eca3018362156410172156d1bf8350668b6967c7`; игровой payload не менялся с `1f0a1b7`.
  - CI на `eca3018`: Sync play mirror #783, Pages #1345 — SUCCESS (docs-only commit, APK/Life Arc не запускались по контракту `paths-ignore`).
  - Последний полный набор на `287e047`: APK #1212, Life Arc Gate #243, Sync #781, Pages #1343 — все SUCCESS.
- **Release-signed кандидат (объект acceptance):** commit `1f0a1b7`, run `35232162470` (APK #1210, `workflow_dispatch`, `release_candidate=true`), artifact `igra-3.0.1` ID `10502001833`, **APK SHA-256 `1c18e1c1bdefc44636b5bff62296a6cf5847d185b28df0bcffa454c0254d9056`**, подпись release.
  - Скачать: https://github.com/JoTalbot/game/actions/runs/35232162470 (artifact `igra-3.0.1`).
- Готовность: **90%** (94% до cap, cap 90% из-за PENDING физического acceptance). Пересчёт №4 — `docs/READINESS.md`.

## Что сделала смена 2026-09-18 (верификация, без изменения payload)

1. **Независимая проверка кандидата** (`docs/RELEASE_CANDIDATE_VERIFICATION.md`): SHA-256 скачан и совпал; `apksigner` v2/v3 `true`, 1 signer, сертификат `3180…d242` = тот же release keystore, что у rc1; debug-сборка того же commit даёт другой сертификат (негативный контроль); манифест `world.igra.app` vc`601`/vn`3.0.1`/minSdk`26`/targetSdk`34`, `allowBackup=false`, `usesCleartextTraffic=false`, только 3 разрешения и один exported launcher; `assets/www` внутри APK байт-идентичен `web/` в `main`.
2. **Воспроизводимость сборки:** локально (JDK 17 Temurin + build-tools 34.0.0) `tools/build-apk.sh` из `main` собрал APK с идентичными `classes.dex`/`resources.arsc`/манифестом/`res/`/`assets/www` и тем же размером; отличия — только блок подписи.
3. **Новый инструмент QA:** `tools/browser-deep-run.js` — автономный глубокий браузерный прогон (ротация, lifecycle, оффлайн, CPU ×6, 4-мин soak, ru/en, reduced-motion, жесты) с JSON-evidence и пометкой `physicalAndroid:false`. Результат: **32/32 PASS** на payload `e1d3a8a0…`. Evidence: `docs/evidence/browser-deep-run-2026-09-18.json` + 3 скриншота.
4. **Разбор подозрения на утечку:** пики `JSEventListeners` под синтетическими mouse-hold жестами — артефакт учёта эмуляции ввода (инструментированный `addEventListener` = 0 вызовов из кода игры за 3 минуты жестов, heap стабилен). Проверка переписана на честную.
5. **Гигиена документации:** восстановлена случайно удалённая коммитом `eca3018` расшифровка гейтов 10–15 в `docs/READINESS.md`; обновлены `docs/STATUS.md`, `agent/state/current.yml`.
6. **Замечание для store/privacy:** `INTERNET` остаётся в манифесте при оффлайн-игре — нужна декларация в Data safety; убирать сейчас нельзя (изменит payload кандидата).

Процент за смену **не двигался**: все открытые пункты гейтов упираются в физическое устройство или production-решение.

## Локальные стенды (пройдены сменой 2026-09-18)

- `node tools/probe/run.js` → 363/363 PASS.
- Полный набор Life Arc Gate локально → 60/60 PASS (включая `rc-hardening` с `--expose-gc`, `physical-android-evidence-test`, `validate-release-authorization-test`, `physical-android-collector-test`).
- `node --check` по 78 файлам `web/js` → 0 ошибок; `tools/check-sync.sh` → PASS; `tools/check-android-security.sh` → PASS.
- `node tools/probe/rc2-evidence.js` → `deterministicReady:true`, `missing:[]`, blockers все `false`.
- `tools/browser-deep-run.js` → 32/32 PASS (не CI-гейт, не физический acceptance).
- Окружение смены: `/dev/kvm` нет, Docker нет → AVD/эмулятор невозможны; JDK 17 + Android SDK + Playwright поставлены агентом вне репозитория.
- В `main` возможна параллельная работа другого агента: перед каждым пушем `git fetch` + `rebase`, чужие коммиты не перезаписывать.
- SSH-сервер `129.213.177.56`: ранее `Permission denied (publickey)`; проектом не используется.

## Что дальше (по порядку)

1. **RC-PHYS-002 / REL-003 (human blocker, держит cap 90%)** — 16 сценариев на реальном устройстве именно для APK `1c18e1c1bdefc446…` (run `35232162470`, commit `1f0a1b7`). Заполнить `docs/PHYSICAL_ANDROID_ACCEPTANCE_RECORD.md`, evidence проверить `tools/probe/physical-android-evidence.js` (`IGRA_PHYSICAL_ANDROID=1`) и `tools/probe/validate-release-authorization.js`.
2. После PASS: повторный расчёт готовности (гейты 3, 7, 8, 10, 14 должны закрыться фактом), сверка Store/Privacy с production-артефактом (гейт 13), затем отдельное production decision человека.
3. Не менять `web/` и `android/` до завершения физического acceptance: любое изменение payload обнуляет provenance кандидата и требует новой сборки + повторного acceptance.
4. Опционально без устройства: issue #4 (UX/playtest backlog) — не release blocker.

## Жёсткие ограничения

- Не двигать и не изменять `v3.0.1-rc1`.
- Не объявлять production-ready без физической проверки текущего кандидата.
- `IGRA_PHYSICAL_ANDROID=1` сам по себе не является доказательством физического устройства.
- Не фабриковать evidence, не выдавать synthetic fixture за физический acceptance.
- Не публиковать Google Play автоматически, не выставлять release/pre-release флаги без решения человека.
- Для `v*` release tags запрещена debug signing.
- Секреты CI (`IGRA_KEYSTORE_B64`, `IGRA_KEYSTORE_PASSWORD`, approval-секреты) не читать, не выводить, не переназначать, гейты на них не обходить.
- Не добавлять новые продуктовые механики до завершения текущего RC operational cycle.

## Канонические документы

- `agent/state/current.yml` — точка resume смены.
- `docs/READINESS.md` — процент готовности, веса, арифметика, cap, история пересчёта.
- `docs/STATUS.md` — текущий технический статус.
- `docs/RELEASE_CANDIDATE_VERIFICATION.md` — независимая проверка бинарника кандидата.
- `docs/PUBLISH.md` — publish/release checklist.
- `docs/PHYSICAL_ANDROID_ACCEPTANCE.md` — правила физического gate и 16 сценариев.
- `docs/PHYSICAL_ANDROID_ACCEPTANCE_RECORD.md` — журнал для заполнения на реальном устройстве.
- `docs/RC1_SMOKE.md`, `docs/RC1_TOUCH_EVIDENCE.md` — историческое физическое evidence rc1 (не переносится на текущий кандидат).
- `docs/STORE.md`, `docs/PRIVACY.md` — модели магазина и приватности.
- `docs/HANDOFF.md` — исторический handoff; даты 2.x внутри него устарели.

Приоритет при противоречиях: факт (git log, CI runs, releases, probes) → `docs/STATUS.md` → `docs/PUBLISH.md` → `docs/HANDOFF_CURRENT.md` → бэклоги → исторический `docs/HANDOFF.md`.
