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

Текущий `main` содержит последовательность docs-only исправлений после инженерного HEAD `65d2de15d57a41d2ea401bf6a945230e57364733`. APK-кандидат v3.0.1/versionCode 601 был собран непосредственно с `65d2de15...`; последующие коммиты изменяют только release documentation/evidence и не изменяют APK.

Текущий APK-кандидат имеет provenance `igra-3.0.1`, versionCode `601`, source commit `65d2de15...` и **APK SHA-256 `37b0172020ed30efe91ee3355f059ad8788b27d002340a5c8ed163aed5e02f92`**. GitHub Actions artifact ZIP для этого APK имеет отдельный digest `b3e27df157ca7cbc15c836e9d39d2c2d7ec40d216843158fbbb0eb11604cd8f`. SHA APK подтверждён непосредственно содержимым `igra-3.0.1.apk.sha256` из скачанного Actions artifact.

Это исправляет прежнюю неоднозначность, где digest ZIP-архива был ошибочно обозначен как SHA самого APK. Физическая проверка по-прежнему должна ссылаться именно на SHA APK.

Последние изменения V9-V25 persistence/replay также проверяют полный путь от live runtime event до persistence: idle frame не создаёт replay entry, реальное действие записывается ровно один раз и сохраняется через `pack()`.

### Физическое Android-условие

Последний подтверждённый физический smoke относится к immutable RC1 и не подтверждает V12 → V25 изменения. Поэтому текущий `main` **не считается production-ready** только на основании CI.

Для текущего APK-кандидата создан и слит отдельный физический acceptance journal. В нём все обязательные проверки остаются `PENDING`, physical evidence отсутствует, а `IGRA_PHYSICAL_ANDROID=1` не установлен. V25 требует одновременно `android=true` и `physicalAndroid=true`; без физического теста production gate остаётся blocked. CI не подделывает physical evidence.

### RC2 evidence pipeline

`tools/probe/rc2-evidence.js` разделяет deterministic readiness и physical Android evidence: обычный Life Arc может завершать автоматические deterministic проверки, но `productionReady` становится `true` только при явном `IGRA_PHYSICAL_ANDROID=1`. Это не является заменой реального тестирования устройства.

### Текущие незакрытые задачи

1. Выполнить физический weak-device soak на текущем APK-кандидате `igra-3.0.1` / versionCode 601 / APK SHA `37b0172020ed30efe91ee3355f059ad8788b27d002340a5c8ed163aed5e02f92`.
2. Зафиксировать реальное physical Android evidence без подстановки/эмуляции результата.
3. После физического soak повторно пройти полный RC2/release gate.
4. Выполнить финальную сверку Play listing/privacy материалов с фактическим APK.
5. Провести ограниченное RC-тестирование.
6. Принять отдельное production decision.
7. Только после этого выполнять production rollout и monitoring.

Immutable `v3.0.1-rc1` не перемещается и не изменяется.
