# Актуальная передача смены

**Дата:** 17.09.2026 (смена агента, UTC-фиксация в `agent/state/current.yml`)

Это короткая актуальная карта проекта. Исторический `docs/HANDOFF.md` содержит старые записи 2.x и не должен использоваться как источник текущего release-статуса.

## Что обязательно прочитать перед работой

1. `agent/state/current.yml` — единая точка resume: кандидат, гейты, task graph, ветки, следующий шаг.
2. `docs/READINESS.md` — процент готовности по 15 гейтам с арифметикой, весами и cap.
3. `docs/STATUS.md` — фактическое техническое состояние и сверка противоречий.

## Текущее состояние

- `v3.0.1-rc1` опубликован и **immutable**. Не двигать, не переписывать, не заменять.
  - commit `9e8fe1a13804f2f5d00feb3b4ffbed60af203d44`, APK SHA-256 `160cec76dee27c903fab49506ea5c813b6430760c7021a03b85360f36c78f6bc` (сверено скачиванием).
  - Pre-release флаг всё ещё `false` — переключение является решением человека.
- `main` = `06032bd32aa01e9ecc3a6ea36cc36b9930783543`, working tree чист, CI полностью зелёный:
  APK #1203 (`35157731486`), Life Arc Gate #236 (`35157731498`), Sync play mirror #773 (`35157731495`), Pages (`35157730577`).
- Debug-артефакт `main`: `igra-3.0.1.apk`, SHA-256 `01b9a92ff46f953431ddea73cfa8193ea54e90967fd2ab23f9b3f263e8d6382d` — инженерная проверка сборки, **не** кандидат.
- **Release-signed кандидат актуального `main` НЕ СОЗДАН.** Прежняя привязка к `1ddc7e9` / `7412b523…` устарела (main ушёл вперёд, артефакт был debug).
  Содержимое `web/` и `android/` между `1ddc7e9` и `06032bd` не менялось: менялись только docs, `life-arc.yml` и `tools/probe/*`.
- Детерминированная готовность подтверждена: `deterministicReady=true`, `missing=[]`, все blockers `false` (RC2 evidence artifact `10471972268`).
- Физический Android acceptance текущего кандидата — **PENDING**. Production — **BLOCKED**.
- Готовность: **90%** (93% до cap, cap 90% из-за PENDING физического acceptance). Детали — `docs/READINESS.md`.

## Локальные стенды (пройдены этой сменой)

- `node tools/probe/run.js` → 363/363 PASS.
- Полный набор Life Arc Gate локально → 60/60 PASS (включая `rc-hardening` с `--expose-gc`, `physical-android-evidence-test`, `validate-release-authorization-test`, `physical-android-collector-test`).
- `node --check` по 78 файлам `web/js` → 0 ошибок.
- `tools/check-sync.sh`, `tools/check-android-security.sh` → PASS.
- Песочница агента: Node 20 (CI — Node 22), JDK 11, нет Android SDK/adb/эмулятора/Playwright/Docker → локальная сборка APK невозможна, сборка только через CI.
- SSH-сервер `129.213.177.56`: `Permission denied (publickey)`, переданный ключ не принимается. Проект сервер не использует; на контур разработки это не влияет.

## Что дальше (по порядку)

1. **REL-001** — `workflow_dispatch` workflow **APK** на `main` с `release_candidate=true`; получить exact release-signed APK, зафиксировать run id + commit + SHA-256.
2. **REL-002** — заполнить `docs/PHYSICAL_ANDROID_ACCEPTANCE_RECORD.md` точной provenance и подготовить PENDING evidence JSON + команды валидации.
3. **REL-003 (human blocker)** — 16 сценариев на реальном устройстве; evidence валидируется `tools/probe/physical-android-evidence.js` при `IGRA_PHYSICAL_ANDROID=1` и `tools/probe/validate-release-authorization.js`.
4. Повторить RC2/release gates на exact кандидате, сверить Store/Privacy, затем отдельное production decision.
5. Гигиена: удалить смерженные ветки (`chore/physical-android-acceptance`, `tmp-physical-android`, `v3-051-runtime-age-guard`, `v3-052-runtime-collection-guard`), не мержить устаревшую `v3-050-performance` (main уже содержит V3-050 + более новый V3-052 probe), не мержить `chore/physical-android-acceptance-2` (её шаблон перенесён в `docs/PHYSICAL_ANDROID_ACCEPTANCE_RECORD.md`).

## Жёсткие ограничения

- Не двигать и не изменять `v3.0.1-rc1`.
- Не объявлять production-ready без физической проверки текущего кандидата.
- `IGRA_PHYSICAL_ANDROID=1` сам по себе не является доказательством физического устройства; это runtime-контракт валидатора.
- Не фабриковать evidence, не выдавать synthetic fixture (`tools/probe/v23-v25-evidence.js`) за физический acceptance.
- Не публиковать Google Play автоматически, не выставлять release/pre-release флаги без решения человека.
- Для `v*` release tags запрещена debug signing.
- Секреты CI (`IGRA_KEYSTORE_B64`, `IGRA_KEYSTORE_PASSWORD`, approval-секреты) не читать, не выводить, не переназначать, гейты на них не обходить.
- Не добавлять новые продуктовые механики до завершения текущего RC operational cycle без отдельного решения.
- Issue #4 остаётся UX/playtest backlog, но не является текущим release blocker.

## Канонические документы

- `agent/state/current.yml` — точка resume смены.
- `docs/READINESS.md` — процент готовности, веса, арифметика, cap, история пересчёта.
- `docs/STATUS.md` — текущий технический статус и сверка противоречий.
- `docs/PUBLISH.md` — publish/release checklist.
- `docs/PHYSICAL_ANDROID_ACCEPTANCE.md` — правила физического gate и 16 сценариев.
- `docs/PHYSICAL_ANDROID_ACCEPTANCE_RECORD.md` — журнал для заполнения на реальном устройстве.
- `docs/RC1_SMOKE.md` — исторический физический smoke `v3.0.1-rc1`.
- `docs/STORE.md`, `docs/PRIVACY.md` — фактические модели магазина и приватности.
- `docs/HANDOFF.md` — исторический handoff; даты 2.x внутри него устарели.

Приоритет при противоречиях: факт (git log, CI runs, releases, probes) → `docs/STATUS.md` → `docs/PUBLISH.md` → `docs/HANDOFF_CURRENT.md` → бэклоги → исторический `docs/HANDOFF.md`.
