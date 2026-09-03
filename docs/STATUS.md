# Статус — 3 сентября 2026

## Текущий инженерный статус

Репозиторий прошёл реализацию V3-001 → V3-029, V5/V6 living-world/body-identity и V7/V8 lineage/climax. Текущий `main` содержит RC1-контракт и production-safe Android pipeline.

### Реализовано

- V3-001 → V3-029 — реализовано.
- V5 living world feedback loop — реализовано и покрыто probe/CI.
- V6 body identity layer — реализовано, загружается, кэшируется и покрыто тестом.
- V7 climax/finale layer — реализовано и покрыто probe/CI.
- V8 lineage layer — реализовано: release/become, наследование состояния и deterministic fingerprint.
- V8 lineage migration — нормализует schema version, повреждённую history и отсутствующий inherited envelope.
- Release APK: debug signing запрещён для `v*` tags.
- Release tag требует `IGRA_KEYSTORE_B64` и `IGRA_KEYSTORE_PASSWORD`.
- APK получает SHA-256 рядом с artifact.
- `apk.yml` выполняет probe, boot, Android security check, sync check и APK build.

### RC1 automated gate

**GREEN.** Commit `5d64e3366e2a81db60bac98f5ed5563af717d94e` прошёл APK pipeline. Artifact `igra-3.0.0-rc1` создан; checksum verification успешна. В pipeline также успешно прошли V8 lineage probe и `release-candidate.js`, включая количественный RC-ready gate.

Это означает, что автоматический инженерный RC gate готов. Production release ещё не разрешён.

### Что ещё нельзя считать автоматически закрытым

1. Реальный Android clean install → boot → birth → play → save → restart.
2. Upgrade со старого сейва.
3. Process death → сохранение и восстановление.
4. Полный offline smoke на реальном устройстве.
5. Отсутствие critical/blocker по финальному ручному прогону.
6. Финальная сверка Play listing/privacy материалов с фактической игрой.

CI green подтверждает автоматические инварианты, но не заменяет физический Android smoke test. Даже в 2026 году телефон всё ещё способен быть отдельной формой жизни.

## Следующий шаг

Провести физический RC smoke на Android, затем создать immutable `v3.0.0-rc1` release с release-signing APK и checksum. После ограниченного RC-тестирования принимать отдельное решение о production Play release.

После RC развитие продолжается вторым актом, повторными жизнями, вариативностью living world, performance/accessibility и production polish.
