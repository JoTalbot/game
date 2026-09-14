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

Evidence: Android 15, экран 427×948 @1.0, weak-device profile, 10 минут; APK SHA-256 `160cec76dee27c903fab49506ea5c813b6430760c7021a03b85360f36c78f6bc`.

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

## 3. V9 — World Depth

**Статус:** post-RC development backlog, не release blocker.

### V9-001 — richer persistent places
**Приоритет:** P1
Добавить новые качественно разные состояния уже существующих мест без процедурного шума.

### V9-002 — multi-life causal chains
**Приоритет:** P1
Довести несколько причинных цепочек до 3–5 звеньев через события, места, существ и игрока.

### V9-003 — relationship depth
**Приоритет:** P1
Расширить память ключевых существ так, чтобы разные типы поведения игрока давали разные отношения и последствия.

### V9-004 — rare world beats
**Приоритет:** P1
Развивать V4.3: редкие события должны быть следствием накопленной истории, а не случайным контентом.

### V9-005 — anti-repeat Director policy
**Приоритет:** P1
Усилить защиту от event spam и повторяемого скелета.

**Gate V9:** 3 контрастных профиля игрока создают различимые world-state; несколько жизней меняют знакомые места заметным, но объяснимым образом.

## 4. V10 — Personal Myth / Replay

**Статус:** post-RC development backlog, не release blocker.

### V10-001 — cross-life identity
**Приоритет:** P1
Наследование должно проявляться поведением, визуальными признаками, отношениями и состоянием мира, а не только текстом.

### V10-002 — finale-dependent starting conditions
**Приоритет:** P1
Разные финалы формируют разные стартовые условия следующей жизни.

### V10-003 — inter-life relationships
**Приоритет:** P1
Ключевые существа и места должны узнавать накопленную историю без явного quest journal.

### V10-004 — generational rare events
**Приоритет:** P1
Добавить редкие события, открывающиеся только при накоплении определённой истории поколений.

### V10-005 — bounded generational memory
**Приоритет:** P0
Любое новое наследование обязано оставаться bounded и проходить migration/replay probes.

**Gate V10:** три последовательные жизни дают три различимых опыта и меняют смысл следующих решений.

## 5. V11 — Final Polish

**Статус:** post-RC development backlog, не release blocker.

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
