# Статус — 3 сентября 2026

## Текущий инженерный статус

`main` прошёл V3-001 → V3-029, V4 second act, V5 living-world, V6 body identity, V7 climax/finale и V8 lineage. RC1 accessibility слой и expanded RC hardening gate подключены к автоматическому pipeline. Последний подтверждённый APK build до этого документа — `3.0.0-rc1`, versionCode `600`, artifact с SHA-256.

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
- commit: `cf11685dd393dedc94b762a40d3fd283f9d0540a`
- APK artifact: `igra-3.0.0-rc1`
- SHA-256: `0d10cda223ecf04393b5e15d05f375bd88847455c9227e55302f5f334d1096ce`

### Автоматические gate

APK workflow выполняет probes, boot, Android security, sync, expanded RC hardening, Android build и checksum verification. Life Arc workflow повторяет ключевые продуктовые probes. CI подтверждает автоматические инварианты, но не заменяет физический Android smoke.

### Что ещё нельзя считать закрытым

1. Финальный физический acceptance именно актуального APK.
2. Upgrade со всех поддерживаемых старых save на текущем устройстве.
3. Force-stop/process death → recovery на текущей сборке.
4. Полный offline smoke на физическом Android.
5. Audio/haptic/fullscreen и отсутствие critical visual/touch blocker на физическом устройстве.
6. Финальная сверка Play listing/privacy материалов с фактическим APK.

### Следующий milestone

Закрыть физический RC gate. Если физический прогон выявляет дефект, сначала фиксируем его в RC/P9 backlog, реализуем минимальное исправление, повторяем полный CI и повторяем физический smoke. Если blocker отсутствует, можно переходить к signed production tag и Play release preparation.
