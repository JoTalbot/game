# Статус — 16 сентября 2026

## Текущий инженерный статус

`main` прошёл V3-001 → V3-029, V4 second act, V5 living-world, V6 body identity, V7 climax/finale и V8 lineage. RC1 accessibility и expanded RC hardening gate подключены к pipeline. V3-032 → V3-052 закрыли визуальный/touch/performance/runtime hardening. V9 → V25 runtime bridge, systems, persistence, experimentation, simulation и production-hardening подключены и покрыты автоматическими probes.

### Реализовано

- V3-001 → V3-029 — реализовано.
- V4 второй акт, causal chain, persistent places, recurring beings, migration/replay — реализованы.
- V4.3 adaptive depth — causal world beats, physical traces, persistence и no-duplicate cadence.
- V5 living world feedback loop — реализовано и покрыто probe/CI.
- V6 body identity + visual presentation — реализовано и покрыто probe/CI.
- V7 climax/finale — реализовано и покрыто probe/CI.
- V8 lineage — release/become, наследование, deterministic fingerprint и migration.
- V3-030 → V3-052 — visual, touch, density, spawn/render budgets, low-end performance и malformed runtime hardening.
- V9 World Depth — deterministic gate закрыт.
- V10 Personal Myth / Replay — bounded generational memory, finale-dependent starts, inherited trait, rare beats и inter-life continuity.
- V11-001 → V11-006 — first-session UX, balance, visual/audio coherence, 10k-step soak, localization/accessibility и release QA matrix.
- V12 lineage 2.0 — bounded ancestry/memory, trait inheritance, deterministic generation, sanitization.
- V13 knowledge — bounded discoveries/laws/interactions, duplicate suppression, evidence clamp, sanitization.
- V14 Director 2.0 — deterministic context scoring, tension/setup/consequence/rarity, anti-repeat novelty bias.
- V15 finale — deterministic causal finale routes.
- V16 presentation — bounded detail/effects/floater budgets и low-end floor.
- V17 adaptive audio — bounded ambience/motif, deterministic context reaction и malformed-state sanitization.
- V18 experimentation — bounded player experiment records, sanitization и persistence через save/restore; acceptance probe и APK gate.
- V19 deep simulation — deterministic bounded simulation, snapshot/restore и malformed-state sanitization.
- V20 hardening — bounded save/experiment/simulation sanitization; отдельный experiment-hardening acceptance probe.
- V21 → V22 gates — release/regression hardening подключены в APK и Life Arc pipelines.
- V23 RC2 gate — deterministic release-candidate evidence aggregation.
- V24 limited release — bounded feedback/metrics, stability gate и disable path.
- V25 production gate — 12 обязательных условий; физическое Android evidence является отдельным обязательным условием production-ready.
- V9-V25 live bridge — реальные runtime action events попадают в replay и проходят фактический persistence pack без создания записей на idle frame.
- V20 experiment probe — realm-neutral hardening.
- V3 expressive world laws — bounded history и acceptance gate подключены к Life Arc/APK pipeline.
- V21/V22 gate probe — синхронизирован с обязательным V25 physical Android условием.
- Web ↔ `docs/play` mirror остаётся обязательным перед APK.
- Release tags требуют release keystore; APK получает SHA-256.
- Google Play автоматически не публикуется.

### Текущий HEAD и последние инженерные изменения

Текущий `main` подтверждён на коммите `85b5de8176fc7433621041b631d7d8c58ac81c67` (`test: align V21-V22 gate probe with V25 physical Android requirement`). Последовательность последних изменений 15 сентября усилила именно release evidence: V25 теперь явно требует physical Android evidence, deterministic CI readiness отделена от физического доказательства, V20 probe сделан realm-neutral, а V3 expressive world laws включены в обязательный gate.

Последние изменения V9-V25 persistence/replay также проверяют полный путь от live runtime event до persistence: idle frame не создаёт replay entry, реальное действие записывается ровно один раз и сохраняется через `pack()`.

### Физическое Android-условие

Последний подтверждённый физический smoke относится к immutable RC1 и не подтверждает V12 → V25 изменения. Поэтому текущий `main` **не считается production-ready** только на основании CI.

V25 требует одновременно `android=true` и `physicalAndroid=true`; без физического теста production gate остаётся blocked. CI не подделывает physical evidence.

### RC2 evidence pipeline

`tools/probe/rc2-evidence.js` разделяет deterministic readiness и physical Android evidence: обычный Life Arc может завершать автоматические deterministic проверки, но `productionReady` становится `true` только при явном `IGRA_PHYSICAL_ANDROID=1`. Это не является заменой реального тестирования устройства.

### Текущие незакрытые задачи

1. Получить новый APK после актуальных V12 → V25 изменений и выполнить физический weak-device soak на Android.
2. Зафиксировать реальное physical Android evidence без подстановки/эмуляции результата.
3. После физического soak повторно пройти полный RC2/release gate.
4. Выполнить финальную сверку Play listing/privacy материалов с фактическим APK.
5. Провести ограниченное RC-тестирование.
6. Принять отдельное production decision.
7. Только после этого выполнять production rollout и monitoring.

Immutable `v3.0.1-rc1` не перемещается и не изменяется.
