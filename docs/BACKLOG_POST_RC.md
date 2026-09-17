# ИГРА — backlog после RC1

> Дата: 2026-09-14.
> База: `v3.0.1-rc1`, versionCode `601`.
> Правило: production release не заменяет развитие игры. После выпуска изменения идут только через подтверждённые проблемы и продуктовые IMP-пункты.

## 0. RC1 gate — ЗАКРЫТ

### RC-PHYS-001 — физический acceptance APK `v3.0.1-rc1`
**Приоритет:** P0 / release blocker
**Статус:** PASS / закрыт **только для immutable артефакта `v3.0.1-rc1`**.

Уточнение от 2026-09-17 (сверка с фактом): закрытие относится к release-артефакту rc1
(SHA-256 `160cec76dee27c903fab49506ea5c813b6430760c7021a03b85360f36c78f6bc`, ранее в этой строке
была опечатка `…fab4956ea…`). Для актуального production-кандидата (текущий `main`) физический
acceptance **PENDING**: release-signed сборка ещё не создана, evidence отсутствует. По правилу
`docs/PHYSICAL_ANDROID_ACCEPTANCE.md` evidence старого билда на новый кандидат не переносится.
Отдельная задача: `RC-PHYS-002`.

Проверен именно release artifact `v3.0.1-rc1`:
- clean install — PASS;
- first boot / birth / основной игровой цикл — PASS;
- Home → Resume — PASS;
- save / restart — PASS;
- force-stop / recovery — PASS;
- upgrade старого поддерживаемого save — PASS;
- offline — PASS;
- release / become — PASS;
- NG+ / lineage — PASS;
- audio / haptic / fullscreen — PASS;
- crash — 0;
- ANR — 0;
- critical visual blocker — 0;
- touch blocker — 0;
- heavy frames — 0.

Evidence: Android 15, экран 427×948 @1.0, weak-device profile, 10 минут; APK SHA-256 `160cec76dee27c903fab4950ea05c813b6430760c7021a03b85360f36c78f6bc`.

### RC-PHYS-002 — физический acceptance актуального release-signed кандидата
**Приоритет:** P0 / production blocker (держит cap 90% готовности)
**Статус:** OPEN / human blocker.

Порядок: `workflow_dispatch` APK с `release_candidate=true` на `main` → скачать artifact →
зафиксировать commit/SHA-256 в `docs/PHYSICAL_ANDROID_ACCEPTANCE_RECORD.md` → выполнить 16 сценариев
на реальном устройстве → валидировать evidence (`tools/probe/physical-android-evidence.js`,
`tools/probe/validate-release-authorization.js`). См. `docs/READINESS.md`, гейт 8.

## 1. Release preparation — почти закрыто

### R10-001 — RC contract freeze
**Статус:** PASS. Автоматические инварианты и физический acceptance закрыты.

### R10-002 — release artifact
**Статус:** PASS. APK собран, подписан, checksum проверен и приложен к GitHub Release.

### R10-003 — Play package audit
**Статус:** в работе только финальная ручная сверка Store/Privacy материалов с фактическим APK.

### R10-004 — production decision
**Статус:** PENDING. Не блокируется физическим RC gate; решение принимается отдельно после limited RC testing и финальной release-operational проверки.

## 2. Текущие release-operational действия

До production ничего автоматически не публикуем. Осталось:

1. В GitHub Release `v3.0.1-rc1` вручную включить флаг **Pre-release**. Текущий GitHub connector не предоставляет операции изменения release.
2. Финально сверить Play listing и `docs/PRIVACY.md` с фактическим APK.
3. Провести limited RC testing.
4. Принять отдельное решение о production.
5. Только после явного одобрения — production rollout и мониторинг.

Immutable RC artifact не изменяется и не заменяется.

## 3. V9 — World Depth — ЗАКРЫТ

**Статус:** реализован и закрыт deterministic gate; не release blocker.

### V9-001 — richer persistent places
**Статус:** IMPLEMENTED.

### V9-002 — multi-life causal chains
**Статус:** FOUNDATION IMPLEMENTED. Bounded world history и причинные события доступны следующим межжизненным системам.

### V9-003 — relationship depth
**Статус:** FOUNDATION IMPLEMENTED через personality/social слои.

### V9-004 — rare world beats
**Статус:** IMPLEMENTED. Rare beats используют накопленную familiarity/care/harm/visits; без случайного event spam.

### V9-005 — anti-repeat Director policy
**Статус:** IMPLEMENTED / GATE PASS.

**Gate V9:** PASS. Контрастные care/harm/visit профили и bounded cross-region propagation проверяются детерминированным probe; Life Arc Gate GREEN на `09d18776fa84200263ee486bbe18d72d6e9c01a2`.

## 4. V10 — Personal Myth / Replay — ЗАКРЫТ

**Статус:** IMPLEMENTED / deterministic gate PASS; не release blocker.

### V10-001 — cross-life identity
**Статус:** IMPLEMENTED.

`web/js/v10-myth.js` вводит bounded generational state: generation, latest lives, memories, signals и inherited conditions.

### V10-002 — finale-dependent starting conditions
**Статус:** IMPLEMENTED.

`release` наследуется как `open`, `become` как `transform`; следующая жизнь получает измеримые inherited freedom/bond/change/world-memory условия.

### V10-003 — inter-life relationships
**Статус:** IMPLEMENTED foundation + continuity layer.

Межжизненная связь теперь сохраняет стабильную пару регион/действие, доверие/страх, число встреч и bounded память. Сильная связь переносится в следующую жизнь, а metamorphosis оставляет живое legacy-эхо. fileciteturn381file0

### V10-004 — generational rare events
**Статус:** IMPLEMENTED.

При накоплении поколений и сигналов доступны bounded `generational:echo` / `generational:awakening`; inherited dominant trait участвует в условии echo. fileciteturn382file0

### V10-005 — bounded generational memory
**Приоритет:** P0
**Статус:** IMPLEMENTED.

Persistence schema поднята до `5`, старые schema 1–4 мигрируются; myth state имеет bounded lives/memories/signals и deterministic snapshot/restore. fileciteturn386file0

**Gate V10:** PASS. Актуальный `main` commit `7add878eded6267b7c17c39b79a705cd9b6c69a3`; Life Arc Gate #91 — SUCCESS, APK #1057 — SUCCESS, Sync play mirror #583 — SUCCESS. RC2 evidence artifact `10350957018` создан для этого commit.

## 5. V11 — Final Polish

**Статус (обновлён 2026-09-17 по факту):** инженерная часть V11-001 → V11-006 реализована и покрыта зелёными gates;
незакрытой осталась только физическая часть (weak-device soak и физическое исполнение QA-матрицы) — она относится к `RC-PHYS-002`.

### V11-001 — first-session UX
**Приоритет:** P0
**Статус:** IMPLEMENTED. `web/js/v11-first-session.js`, `docs/IMP_V11_001_FIRST_SESSION.md`, probe `tools/probe/v11-first-session.js` PASS (CI Life Arc #236).

### V11-002 — balance
**Приоритет:** P1
**Статус:** IMPLEMENTED (deterministic gate). Commit `6cbb8952d52012e53bd305da015e83cefffbf16c`, APK #1089 и Life Arc #123 SUCCESS; `tools/probe/balance.js` PASS локально 2026-09-17.

### V11-003 — visual/audio coherence
**Приоритет:** P1
**Статус:** IMPLEMENTED (deterministic gate). Commit `9e5639c3e1b82cf81611986957b98a8ca36ce577`, APK #1090, Life Arc #124, Sync play mirror #616 SUCCESS; probes `v16-presentation.js`, `v17-adaptive-audio.js`, `noise.js` PASS.

### V11-004 — long-session performance
**Приоритет:** P0
**Статус:** PARTIAL. Автоматическая часть закрыта: детерминированный 10 000-step bounded soak, `tools/probe/long.js`, `rc-hardening.js` с `--expose-gc`, `v22-regression-gate.js`. Физический soak слабого Android для актуального кандидата = `RC-PHYS-002`.

### V11-005 — localization/accessibility final pass
**Приоритет:** P0
**Статус:** IMPLEMENTED. `tools/probe/v11-accessibility.js`, `accessibility.js` PASS; RU/EN parity дополнительно сторожит `rc-hardening.js`.

### V11-006 — release QA matrix
**Приоритет:** P0
**Статус:** PARTIAL. Структурный gate реализован: `tools/probe/v11-release-qa.js` (15 release-critical сценариев) PASS и явно не подменяет физическое evidence. Физическое исполнение матрицы = `RC-PHYS-002`.

## 6. Правила развития

1. Любое продуктовое улучшение сначала получает `IMP-*`.
2. Реализация идёт батчами.
3. После значимого батча: probes → CI → анализ → новый artifact при необходимости.
4. Тестовые фиксы без изменения продукта не требуют нового IMP.
5. Не добавлять XP, классы, quest journal, карту, streak, daily/FOMO или monetization только ради retention.
6. Реальное поведение игры и результаты тестов важнее старого roadmap.
7. Production release и дальнейшая разработка — две разные линии: release стабилизирует текущую версию, а V9–V11 развивают следующую продуктовую глубину.
