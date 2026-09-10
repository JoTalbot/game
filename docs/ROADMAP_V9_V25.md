# ИГРА — генеральный план V9 → V25

> Статус: утверждённый master-plan дальнейшей разработки после v3.0.1-rc1.
>
> Цель: не просто увеличить количество механик, а превратить ИГРУ в глубокий, самобытный, долгоживущий интерактивный мир с причинной памятью, поколениями, живой экологией, сильной финальной дугой и production-grade качеством.
>
> Google Play до завершения этого цикла НЕ размещаем.
>
> `v3.0.1-rc1` является историческим immutable RC artifact и не изменяется.

## 0. Правила большого цикла

1. Сохраняем core philosophy: оффлайн-first, локальный Director, отсутствие рекламы/IAP/энергии за деньги.
2. Новые механики должны усиливать наблюдаемую причинность, а не создавать меню ради меню.
3. Никакая новая система не считается готовой без deterministic probe, интеграционного теста и физической проверки там, где она влияет на Android UX/performance.
4. Не допускается визуальный spam: редкость, тишина и читаемость важнее количества эффектов.
5. Persistence bounded: история мира растёт контролируемо и не превращает сейв в бесконечный мусор.
6. Случайность должна быть воспроизводимой в тестовом режиме.
7. Сохраняем миграцию старых сейвов на каждом schema revision.
8. Производительность слабого устройства остаётся release gate.
9. Сначала системная причинность, затем контент, затем presentation polish.
10. Версия меняется только на реальном пользовательском/техническом рубеже.

---

# Фаза A — глубина мира

## V9 — Живой мир 2.0

### Цель
Мир должен продолжать жить без постоянного присутствия игрока.

### Системы
- карта регионов;
- региональные правила;
- локальные экосистемы;
- популяции;
- миграции;
- сезонность;
- погодные состояния;
- локальные катастрофы;
- восстановление территорий;
- цепочки мировых событий;
- фоновые процессы;
- причинные связи между регионами;
- физические следы событий;
- bounded world history.

### Acceptance
- два одинаковых старта при одинаковом seed дают одинаковую причинную историю;
- разные действия игрока приводят к наблюдаемому различию мира;
- world simulation не растит память без bound;
- offline continuation работает после process death;
- weak-device performance gate остаётся green.

## V10 — Личность и поведение

### Цель
Сделать личность наблюдаемой через поведение, а не через набор полосок.

### Системы
- темперамент;
- любопытство;
- страх;
- доверие;
- агрессия;
- привязанность;
- привычки;
- склонности;
- внутренние конфликты;
- изменение личности;
- кризисы идентичности;
- поведенческие профили;
- скрытые traits;
- реакция на историю игрока.

### Acceptance
- traits меняют реальные решения существа;
- два существа с разной историей ведут себя различно;
- personality persistence переживает допустимый lifecycle;
- UI не раскрывает систему как spreadsheet.

## V11 — Социальная сеть мира

### Системы
- отношения между существами;
- сообщества;
- союзы;
- конфликты;
- репутация игрока;
- коллективная память;
- доверие/предательство;
- наставничество;
- социальные последствия;
- наследуемые отношения.

### Acceptance
Социальное событие должно быть следствием истории, а не случайным popup.

## V12 — Поколения и наследие 2.0

### Системы
- наследование traits;
- наследование памяти;
- искажённая память;
- наследование отношений;
- наследование мест;
- наследование ошибок;
- семейные/линейные паттерны;
- поколения с различными целями;
- lineage graph;
- bounded ancestry.

### Acceptance
Не менее нескольких поколений должны давать отличающиеся траектории при разных решениях предков.

---

# Фаза B — мета-слой и Director

## V13 — Мета-прогресс через знание

### Принцип
Прогресс не покупается и не фармится. Игрок открывает закономерности мира.

### Системы
- discoveries;
- скрытые законы;
- наблюдаемые закономерности;
- новые формы взаимодействия;
- редкие открытия;
- открытие новых типов миров;
- knowledge persistence;
- anti-spoiler presentation.

### Запрещено
- energy timers;
- paid power;
- streak pressure;
- lootbox-like progression;
- forced daily reward.

## V14 — Director 2.0

### Цель
Director становится системой драматургии, учитывающей историю, а не случайным генератором событий.

### Системы
- setup;
- tension;
- consequence;
- escalation;
- transformation;
- payoff;
- pacing budget;
- silence budget;
- player-behavior model;
- world-memory input;
- relationship input;
- lineage input;
- event rarity control;
- anti-repeat rules.

### Acceptance
Одинаковая история при одинаковом state/seed воспроизводит одинаковую драматургическую последовательность.

## V15 — Большая финальная дуга

### Цель
Финал должен быть результатом всей истории, а не проверкой одной переменной.

### Системы
- накопительная финальная причинность;
- состояние мира;
- состояние тела;
- отношения;
- lineage;
- экологические последствия;
- несколько финальных маршрутов;
- редкие скрытые финалы;
- post-finale state;
- честный payoff прошлых решений.

### Acceptance
Минимум несколько качественно разных финальных исходов с доказуемой причинностью.

---

# Фаза C — presentation

## V16 — Визуальная эволюция

- состояния окружения;
- визуальная память;
- эволюция существ;
- сезонные переходы;
- погода;
- редкие визуальные события;
- визуальные последствия решений;
- адаптивная детализация;
- low-end rendering profile;
- строгий floater/effect budget.

### Acceptance
Нет визуального spam; читаемость сохраняется на 427×948 и слабом устройстве.

## V17 — Адаптивный звук

- world ambience;
- body sounds;
- relationship motifs;
- memory motifs;
- Director-driven intensity;
- silence states;
- generation motifs;
- finale motifs;
- graceful offline audio;
- audio accessibility.

### Acceptance
Звук усиливает состояние игры и не является обязательным каналом понимания критической механики.

---

# Фаза D — исследование и симуляция

## V18 — Система экспериментов

Игрок получает возможность исследовать закономерности без превращения игры в аналитическую панель.

- повторяемые эксперименты;
- гипотезы через действие;
- сравнимые последствия;
- редкие реактивные состояния;
- экспериментальные world rules;
- наблюдаемая причинность;
- debug/research mode только для разработчика.

## V19 — Глубокая симуляция

### Подсистемы
- ecology;
- population;
- migration;
- relationships;
- memory;
- weather;
- places;
- laws;
- history;
- Director;
- asynchronous world ticks;
- simulation budgets.

### Технические ограничения
- bounded tick cost;
- deterministic test seed;
- persistence compaction;
- background simulation budget;
- no uncontrolled timers;
- safe recovery after lifecycle interruptions.

---

# Фаза E — production quality

## V20 — Production-grade hardening

### Android
- Android version matrix;
- low-end matrix;
- screen-size matrix;
- process death;
- background/foreground;
- storage pressure;
- corrupted save recovery;
- migration chain;
- offline-only operation;
- vibration/audio/fullscreen.

### Performance
- 60 FPS target where device permits;
- frame-time budget;
- GC budget;
- memory budget;
- battery/thermal soak;
- 1–4 hour soak;
- renderer exception zero tolerance.

### Security/privacy
- permission audit;
- network audit;
- webhook isolation;
- no secret leakage;
- signing verification;
- reproducible checksum;
- release artifact audit.

## V21 — Большой плейтест

### Сценарии
- 5 min;
- 15 min;
- 30 min;
- 60 min;
- 2 h;
- repeat life;
- multi-life;
- multi-generation;
- offline;
- resume;
- force-stop;
- upgrade save.

### Измеряем
- time-to-understanding;
- confusion points;
- boredom points;
- voluntary return;
- memorable events;
- ignored systems;
- repeated behaviors;
- abandonment points;
- performance degradation.

### Acceptance
Решения после плейтеста принимаются по данным, а не по вкусу разработчика.

## V22 — Финальная оптимизация

- profile hottest paths;
- remove redundant allocations;
- optimize simulation;
- optimize rendering;
- optimize persistence;
- compact state;
- optimize assets;
- startup optimization;
- battery optimization;
- regression matrix.

### Acceptance
Нет regressions относительно V20/V21; weak-device gate обязателен.

---

# Фаза F — новые RC и ограниченный релиз

## V23 — Release Candidate 2

### Gate
- full probe suite green;
- full integration suite green;
- migration green;
- deterministic replay green;
- performance green;
- accessibility green;
- security/privacy audit green;
- release signing green;
- real Android matrix green;
- long soak green;
- no critical/blocker.

Создаётся новый immutable release tag только после фактического прохождения gate.

## V24 — Limited Release

### Цель
Проверить игру на ограниченной аудитории до массового production.

### Контроль
- стабильность;
- retention как исследовательский сигнал, если аналитика когда-либо будет добавлена с отдельным согласием и privacy review;
- crash/ANR;
- save integrity;
- onboarding comprehension;
- повторные жизни;
- qualitative feedback;
- device compatibility.

Никаких monetization experiments.

## V25 — Production Ready

### Финальный gate
1. Все V9–V24 acceptance criteria закрыты.
2. Нет известных critical/blocker.
3. Save/migration validated.
4. Performance validated on weak Android.
5. Long-session soak validated.
6. Accessibility validated.
7. Privacy/data-safety documentation соответствует фактическому APK.
8. Release artifact подписан production/upload key.
9. Release checksum зафиксирован.
10. Store materials соответствуют фактическому продукту.
11. Limited Release не выявил блокирующих проблем.
12. Production decision зафиксирован отдельным release checklist.

Только после этого разрешается Google Play production release.

---

# Сквозной технический backlog

## A. Test infrastructure
- deterministic seed harness;
- state snapshots;
- replay fixtures;
- migration fixtures;
- fuzz tests for persisted collections;
- renderer invariant probes;
- simulation budget probe;
- save corruption probe;
- lifecycle probe;
- low-device performance probe;
- visual spam guard.

## B. Data architecture
- explicit schema versions;
- migration registry;
- bounded history;
- compaction;
- stable IDs;
- causal event IDs;
- replay-safe random streams;
- corruption recovery.

## C. UX
- progressive discovery;
- no tutorial dump;
- contextual hints;
- reduced motion;
- readable typography;
- touch forgiveness;
- no accidental destructive actions;
- meaningful feedback without text spam.

## D. Observability
По умолчанию локальная/offline диагностика для разработки. Production telemetry не вводится автоматически: любое изменение модели данных/аналитики требует отдельного privacy review.

## E. Release discipline
- не двигать старые immutable tags;
- не переписывать историю;
- не коммитить secrets;
- не ломать README ради CI heartbeat;
- не создавать искусственные commits только ради запуска workflow, если есть безопасный способ проверить состояние;
- каждый крупный этап заканчивается audit + probes + физическим тестом.

---

# Зависимости

`V9 → V10 → V11 → V12 → V13 → V14 → V15`

`V16` и `V17` зависят от стабильных систем V9–V15.

`V18 → V19` расширяют симуляцию и требуют стабильной причинной модели.

`V20` начинается после архитектурной стабилизации V9–V19.

`V21 → V22 → V23 → V24 → V25` являются последовательным release pipeline.

Не разрешается объявлять V25 готовым только потому, что код существует. Готовность определяется acceptance gates.

---

# Definition of Done большого цикла

ИГРА готова к production, когда игрок может:

1. начать новую жизнь;
2. понять core interaction без длинного tutorial;
3. изменить мир своими действиями;
4. увидеть последствия спустя время;
5. встретить существ с собственной историей;
6. вернуться и обнаружить изменения;
7. пройти несколько жизней;
8. увидеть наследие предыдущих жизней;
9. исследовать закономерности;
10. прийти к финалу, который ощущается следствием собственной истории;
11. начать новую историю, которая действительно отличается;
12. делать всё это стабильно, оффлайн и без monetization pressure.

Только после выполнения этого определения завершённости рассматриваем Google Play production.
