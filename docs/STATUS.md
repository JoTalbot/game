# Статус — 3 сентября 2026

## Текущий инженерный статус

`main` прошёл V3-001 → V3-029, V4 second act, V5 living-world, V6 body identity, V7 climax/finale и V8 lineage. RC1 accessibility и expanded RC hardening gate подключены к автоматическому pipeline. Последний подтверждённый APK build: `3.0.0-rc1`, versionCode `600`.

### Реализовано

- V3-001 → V3-029 — реализовано.
- V4 второй акт — persistent конфликт, маршруты, события и контрастные исходы.
- V4 causal chain — provenance `parent → chain → event → physical trace`, bounded history.
- V4 persistent places — накопленная история мест.
- V4 recurring beings — encounter/memory/affinity и route-dependent state.
- V4 migration + deterministic replay — schema normalization, bounded collections и фиксированная тестовая геометрия.
- V4.3 adaptive depth — causal world beats, physical traces, player/world application, persistence и no-duplicate cadence.
- V5 living world feedback loop — реализовано и покрыто probe/CI.
- V6 body identity + visual presentation — реализовано и покрыто probe/CI.
- V7 climax/finale — реализовано и покрыто probe/CI.
- V8 lineage — release/become, наследование, deterministic fingerprint и migration.
- RC1 accessibility — reduced-motion, semantic UI signals, stable accessible names и offline cache.
- RC hardening — RU/EN parity, offline asset completeness, Android lifecycle/save/security checks, bounded persistence и real-engine long-session soak.
- Release APK: debug signing запрещён для `v*` tags.
- Release tag требует `IGRA_KEYSTORE_B64` и `IGRA_KEYSTORE_PASSWORD`.
- APK получает SHA-256 и публикует его рядом с artifact.

### Последний подтверждённый RC build

- Версия: `3.0.0-rc1`
- versionCode: `600`
- commit: `df6b8224b54a3f90954f3ed6d2251a3016cf8238`
- APK artifact: `igra-3.0.0-rc1`
- artifact ID: `9895393085`
- SHA-256: `5a0d48960ee2e2419fd130c0196925614c39137b996de67802f0d24bbd5b1072`
- APK workflow: SUCCESS
- mirror sync: SUCCESS

### Автоматические gate

APK workflow выполняет probes, boot, Android security, sync, expanded RC hardening, Android build и checksum verification. Life Arc workflow повторяет ключевые продуктовые probes. CI подтверждает автоматические инварианты, но не заменяет физический Android smoke.

### Что ещё нельзя считать закрытым

1. Финальный физический acceptance именно artifact `9895393085`.
2. Upgrade со всех поддерживаемых старых save на текущем устройстве.
3. Force-stop/process death → recovery на текущей сборке.
4. Полный offline smoke на физическом Android.
5. Audio/haptic/fullscreen и отсутствие critical visual/touch blocker на физическом устройстве.
6. Финальная сверка Play listing/privacy материалов с фактическим APK.

### Следующий milestone

Закрыть физический RC gate. Если физический прогон выявляет дефект, сначала фиксируем его в RC/P9 backlog, реализуем минимальное исправление, повторяем полный CI и физический smoke. Если blocker отсутствует, можно переходить к signed production tag и Play release preparation.

### После RC

Создан `docs/BACKLOG_POST_RC.md` с единым планом: физический RC gate → release preparation → V9 World Depth → V10 Personal Myth/Replay → V11 Final Polish. Новые продуктовые улучшения проходят через `IMP-*`, bounded persistence и автоматические probes.
