# Статус — 3 сентября 2026

## Текущий инженерный статус

Репозиторий находится после реализации V3-001 → V3-029 и после V5/V6 living-world/body-identity работ. Последние изменения также закрывают production-safe release signing, checksum artifact и контракт публикации.

### Реализовано

- V3-001 → V3-029 — реализовано.
- V5 living world feedback loop — реализовано и покрыто probe/CI.
- V6 body identity layer — реализовано, загружается, кэшируется и покрыто тестом.
- Release APK: debug signing запрещён для `v*` tags.
- Release tag требует `IGRA_KEYSTORE_B64` и `IGRA_KEYSTORE_PASSWORD`.
- APK получает SHA-256 рядом с artifact.
- `apk.yml` выполняет probe, boot, Android security check, sync check и APK build.

### Текущий релизный рубеж

Документация использует `v3.0.0-rc1`, versionCode 600 как RC-контракт. Это не означает, что production release уже разрешён: сначала нужен RC gate.

### Что ещё нельзя считать автоматически закрытым

1. Реальный Android clean install → boot → birth → play → save → restart.
2. Upgrade со старого сейва.
3. Process death → сохранение и восстановление.
4. Полный offline smoke на реальном устройстве.
5. Отсутствие critical/blocker по финальному ручному прогону.
6. Финальная сверка Play listing/privacy материалов с фактической игрой.

CI green подтверждает автоматические инварианты, но не заменяет физический Android smoke test. Даже в 2026 году телефон всё ещё способен быть отдельной формой жизни.

## Следующий шаг

После выполнения RC gate создать `v3.0.0-rc1`, провести ограниченное RC-тестирование и только затем принимать решение о production Play release.

После RC развитие продолжается вторым актом, повторными жизнями, вариативностью living world, performance/accessibility и production polish.
