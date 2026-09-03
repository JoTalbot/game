# ИГРА — backlog после RC1

> Дата: 2026-09-03.
> База: `3.0.0-rc1`, versionCode `600`.
> Правило: production release не заменяет развитие игры. После выпуска изменения идут только через подтверждённые проблемы и продуктовые IMP-пункты.

## 0. Непереговорный RC gate

### RC-PHYS-001 — физический acceptance актуального APK
**Приоритет:** P0 / release blocker
**Статус:** ожидает физического прогона

Проверить именно последний artifact:
- clean install;
- first boot / birth / основной игровой цикл;
- drag / long-press / tap / double-tap pulse;
- Back / Home / Resume;
- save / restart;
- force-stop / process death / recovery;
- upgrade старого поддерживаемого save;
- offline / airplane mode;
- release / become;
- NG+ / lineage;
- audio / haptic / fullscreen;
- отсутствие crash / ANR / critical visual или touch regression.

Evidence: устройство, Android, APK SHA-256, timestamp, pass/fail по каждому пункту, screenshots/video/logs для дефектов.

## 1. Release preparation

### R10-001 — RC contract freeze
**Статус:** автоматические инварианты закрыты; физический acceptance отдельно.

### R10-002 — release artifact
**Статус:** CI-ready.

### R10-003 — Play package audit
**Статус:** store/privacy материалы существуют; требуется финальная сверка с фактическим APK.

### R10-004 — production tag
**Статус:** заблокирован до RC-PHYS-001.

## 2. V9 — World Depth

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

## 3. V10 — Personal Myth / Replay

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

## 4. V11 — Final Polish

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

## 5. Правила развития

1. Любое продуктовое улучшение сначала получает `IMP-*`.
2. Реализация идёт батчами.
3. После значимого батча: probes → CI → анализ → новый artifact при необходимости.
4. Тестовые фиксы без изменения продукта не требуют нового IMP.
5. Не добавлять XP, классы, quest journal, карту, streak, daily/FOMO или monetization только ради retention.
6. Реальное поведение игры и результаты тестов важнее старого roadmap.
7. Production release и дальнейшая разработка — две разные линии: release стабилизирует текущую версию, а V9–V11 развивают следующую продуктовую глубину.
