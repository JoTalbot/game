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
- `main` = `0643a336657e571ee7aed786fbb362b0da3fed98`, working tree чист, CI полностью зелёный:
  APK #1204 (`35229457058`), Life Arc Gate #237 (`35229457159`), Sync play mirror #774 (`35229457088`), Pages (`35229455404`).
- Debug-артефакт `main`: `igra-3.0.1.apk`, SHA-256 `01b9a92ff46f953431ddea73cfa8193ea54e90967fd2ab23f9b3f263e8d6382d` — инженерная проверка сборки, **не** кандидат.
- **Release-signed кандидат СОЗДАН 2026-09-17** (задача REL-001 закрыта):
  - commit `0643a336657e571ee7aed786fbb362b0da3fed98`, APK run `35229481075` (#1205, `workflow_dispatch`, `release_candidate=true`) — SUCCESS;
  - artifact `igra-3.0.1` ID `10500832061`, файл `igra-3.0.1.apk`;
  - **APK SHA-256 `3898a9408d52a22fd1f8237bc1650bebf6aa3da936125991d9de4f096c816396`**;
  - подпись release: `IGRA_SIGNING_MODE=release`, apksigner v2/v3 `true`, fingerprint сертификата `31:80:D0:AE:D6:E9:8D:7E:2B:06:CA:EE:FA:10:B8:7A:40:18:47:1F:41:92:34:4A:03:4E:95:AD:B7:44:D2:42`;
  - скачать: https://github.com/JoTalbot/game/actions/runs/35229481075 (artifact `igra-3.0.1`);
  - GitHub Release не публиковался, `v3.0.1-rc1` не тронут.
  Прежняя привязка к `1ddc7e9` / `7412b523…` устарела (main ушёл вперёд, тот артефакт был debug).
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

1. ~~REL-001~~ — выполнено: release-signed кандидат `3898a9408d52a22fd1f8237bc1650bebf6aa3da936125991d9de4f096c816396`.
2. ~~REL-002~~ — выполнено: provenance внесена в `docs/PHYSICAL_ANDROID_ACCEPTANCE_RECORD.md`, шаблон evidence — `docs/physical-android-evidence.template.json`.
3. **REL-003 / RC-PHYS-002 (human blocker, держит cap 90%)** — 16 сценариев на реальном устройстве именно этого APK; evidence валидируется `tools/probe/physical-android-evidence.js` при `IGRA_PHYSICAL_ANDROID=1` и `tools/probe/validate-release-authorization.js`.
4. После PASS физического контура: повторить RC2/release gates на exact кандидате, сверить Store/Privacy, затем отдельное production decision (человек).
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
