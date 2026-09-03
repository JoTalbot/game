# Статус — 3 сентября 2026

## Текущий инженерный статус

Репозиторий прошёл реализацию V3-001 → V3-029, V5/V6 living-world/body-identity и V7/V8 lineage/climax. Поверх RC1-контракта реализован V4 второй акт с причинной памятью, повторяющимися существами и устойчивыми следами мест. Текущий `main` содержит production-safe Android pipeline.

### Реализовано

- V3-001 → V3-029 — реализовано.
- V4 второй акт — реализован как отдельный persistent слой с собственным конфликтом, маршрутами, событиями и двумя контрастными исходами.
- V4 causal chain — каждое событие получает provenance: `parent → chain → event → physical trace`; история ограничена по размеру.
- V4 persistent places — второй акт накапливает следы мест и связывает их с причинной цепочкой.
- V4 recurring beings — повторяющиеся существа получают устойчивые encounter/memory/affinity-сигналы и могут быть связаны со следом второго акта.
- V4 migration — schema нормализуется до поддерживаемой версии, повреждённые коллекции фильтруются, история ограничена.
- V5 living world feedback loop — реализовано и покрыто probe/CI.
- V6 body identity layer — реализовано, загружается, кэшируется и покрыто тестом.
- V7 climax/finale layer — реализовано и покрыто probe/CI.
- V8 lineage layer — реализовано: release/become, наследование состояния и deterministic fingerprint.
- V8 lineage migration — нормализует schema version, повреждённую history и отсутствующий inherited envelope.
- Release APK: debug signing запрещён для `v*` tags.
- Release tag требует `IGRA_KEYSTORE_B64` и `IGRA_KEYSTORE_PASSWORD`.
- APK получает SHA-256 рядом с artifact.
- `apk.yml` выполняет probe, boot, Android security check, sync check и APK build.

### V4 automated gate

**GREEN.** Life Arc run `#296` завершён успешно: все 24 проверки прошли, включая V4 persistence/migration и Release Candidate. APK run `#705` также завершён **GREEN** на commit `2d10e400e564d542551d1e9f04d64ea4366dac1f`; все проверки души, живой запуск, Android/WebView guards, sync, Android build и checksum прошли.

Artifact `igra-3.0.0-rc1` создан: размер `2,948,539` bytes, digest `sha256:ab55bf847801234c83c6ebabf3810753e1051a576a6ec2ee01b4accdf2d65eb3`. Это инженерный RC artifact, а не production release.

### RC1 physical evidence

Получены две физические сессии baseline на слабом Android для анализа touch. Вторая сессия подтвердила, что большинство срывов являются намеренным отпусканием, поэтому глобальный порог не повышается вслепую. Для ухода пальца используется небольшая grace/hysteresis зона, а системный `touchcancel` остаётся отдельным исходом.

### Что ещё нельзя считать автоматически закрытым

1. Финальный физический acceptance текущего APK после последнего V4 батча.
2. Upgrade со всех поддерживаемых старых save.
3. Process death → сохранение и восстановление на текущей сборке.
4. Полный offline smoke на текущем APK.
5. Отсутствие critical/blocker по финальному ручному прогону.
6. Финальная сверка Play listing/privacy материалов с фактической игрой.

CI green подтверждает автоматические инварианты, но не заменяет физический Android smoke test. Даже в 2026 году телефон всё ещё способен быть отдельной формой жизни.

## Следующий шаг

Продолжить V4 как продуктовый второй акт: расширять длинные причинные цепочки, вариативность мира, повторные отношения и межжизненные последствия. После стабилизации V4 перейти к следующему крупному слою реиграбельности и затем к production polish.
