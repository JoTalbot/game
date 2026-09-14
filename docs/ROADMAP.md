# Дорожная карта ИГРЫ

Ведёт ИИ. Пуши идут в `main` сразу, как только кусок работает и проверен.

## v0.1–v2.x — фундамент и vertical slice

Все исторические этапы завершены. v2.33 остаётся историческим названием стабильного vertical slice.

**Важно:** v2.33 была играбельным фундаментом, а не финальной полной игрой.

## v3.0–v3.0.1 — первый полноценный игровой акт и RC1

Продуктовый backlog: `docs/BACKLOG_V3.md`.

V3-001 → V3-029 реализованы. V3-030 → V3-052 закрыли релизный визуальный, touch, performance и runtime hardening. V4 second act, V5 living-world, V6 body identity, V7 climax/finale и V8 lineage реализованы и покрыты probes/CI. V9 → V25 runtime bridge, systems, persistence и production-hardening подключены и имеют автоматические проверки.

## RC1 — `v3.0.1-rc1`

Immutable RC artifact: `v3.0.1-rc1`, versionCode `601`.

RC1 технический и физический gates **GREEN**. Release APK подписан release/upload key, SHA-256 проверен, artifact опубликован в GitHub Release. Физический Android 15 smoke: 10 минут, 427×948 @1.0, weak-device profile; clean install, boot, gameplay, save/restart, recovery, old-save upgrade, offline, release/become/NG+, audio/haptic/fullscreen — PASS; crash, ANR, visual blocker, touch blocker и heavy frames — 0.

RC gate закрыт, но production пока **не объявлен**. Release-operational действия описаны в `docs/PUBLISH.md` и `docs/BACKLOG_POST_RC.md`.

## Release-operational stage

Перед production остаются:

1. вручную включить **Pre-release** для GitHub Release `v3.0.1-rc1`;
2. финально сверить Play listing и privacy materials с фактическим APK;
3. провести ограниченное RC-тестирование;
4. принять отдельное production decision;
5. только после явного одобрения выполнить production rollout и monitoring.

Новые продуктовые изменения не должны менять immutable RC artifact.

## Следующий большой цикл — V9 → V25

После release-operational цикла разработка продолжается по master-plan. Уже подключённые V9 → V25 слои являются техническим фундаментом; следующий этап — превращать их в заметную пользовательскую глубину, а не просто наращивать внутренние флаги.

### V9 — World Depth

- persistent places с качественно различимыми состояниями;
- multi-life causal chains на 3–5 звеньев;
- более глубокие отношения с recurring beings;
- редкие world beats как следствие накопленной истории;
- anti-repeat Director policy.

**Gate:** три контрастных профиля игрока создают различимые world-state, а несколько жизней меняют знакомые места заметно и объяснимо.

### V10 — Personal Myth / Replay

- cross-life identity;
- finale-dependent starting conditions;
- inter-life relationships;
- generational rare events;
- bounded generational memory с migration/replay probes.

**Gate:** три последовательные жизни дают три различимых опыта и меняют смысл следующих решений.

### V11 — Final Polish

- first-session UX;
- balance;
- visual/audio coherence;
- long-session performance;
- localization/accessibility final pass;
- полная release QA matrix.

### V12 → V25

Развивать последовательно: каждое продуктовое изменение получает `IMP-*`; bounded persistence и migration обязательны; deterministic probes подтверждают новые инварианты; значимые изменения проходят CI; Android UX/performance изменения требуют физической проверки; offline-first core loop не ломается.

Не добавлять XP, классы, quest journal, карту, streak, daily/FOMO или monetization только ради retention. Production и development остаются двумя отдельными линиями.

## Критерий настоящего роста

Следующая версия должна быть не просто «ещё больше механик». Каждый крупный батч обязан улучшать хотя бы одно из качеств: глубину причин и последствий, различимость жизней, качество отношений, читаемость первого опыта, вариативность повторного прохождения, производительность или доступность.

Реальное поведение игры и результаты тестов важнее старых формулировок roadmap. Если система не создаёт нового пользовательского смысла, её не следует добавлять только ради увеличения версии.
