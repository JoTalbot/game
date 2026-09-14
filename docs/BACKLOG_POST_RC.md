# ИГРА — backlog после RC1

> Дата: 2026-09-14.
> База: `v3.0.1-rc1`, versionCode `601`.
> Правило: production release не заменяет развитие игры. После выпуска изменения идут только через подтверждённые проблемы и продуктовые IMP-пункты.

## 0. RC1 gate — ЗАКРЫТ

### RC-PHYS-001 — физический acceptance актуального APK
**Приоритет:** P0 / release blocker
**Статус:** PASS / закрыт.

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

Evidence: Android 15, экран 427×948 @1.0, weak-device profile, 10 минут; APK SHA-256 `160cec76dee27c903fab4956ea05c813b6430760c7021a03b85360f36c78f6bc`.

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

**Статус:** следующий основной development milestone.

### V11-001 — first-session UX
**Приоритет:** P0
Новый игрок должен понять базовый жест через саму игру.

### V11-002 — balance
**Приоритет:** P1
Энергия, рост, забывание, раны, редкость событий и финалы должны поддерживать разные стратегии.

### V11-003 — visual/audio coherence
**Приоритет:** P1
Убрать повторяемые визуальные и звуковые паттерны, которые делают мир механическим.

### V11-004 — long-session performance
**Приоритет:** P0
Реальный engine soak + физический слабый Android soak; без неконтролируемого роста памяти/FPS degradation/save growth.

### V11-005 — localization/accessibility final pass
**Приоритет:** P0
RU/EN parity, overflow, reduced motion, semantic names, audio/haptic fallbacks.

### V11-006 — release QA matrix
**Приоритет:** P0
Clean install, upgrade, process death, offline, lifecycle, touch, lineage, финалы.

## 6. Правила развития

1. Любое продуктовое улучшение сначала получает `IMP-*`.
2. Реализация идёт батчами.
3. После значимого батча: probes → CI → анализ → новый artifact при необходимости.
4. Тестовые фиксы без изменения продукта не требуют нового IMP.
5. Не добавлять XP, классы, quest journal, карту, streak, daily/FOMO или monetization только ради retention.
6. Реальное поведение игры и результаты тестов важнее старого roadmap.
7. Production release и дальнейшая разработка — две разные линии: release стабилизирует текущую версию, а V9–V11 развивают следующую продуктовую глубину.
