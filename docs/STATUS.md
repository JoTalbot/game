# Статус — 7 сентября 2026

## Текущий инженерный статус

`main` прошёл V3-001 → V3-029, V4 second act, V5 living-world, V6 body identity, V7 climax/finale и V8 lineage. RC1 accessibility и expanded RC hardening gate подключены к автоматическому pipeline. V3-032 → V3-050 закрыли визуальный/touch/performance hardening; физический weak-device acceptance для V3-050 подтверждён реальным Android-прогоном.

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
- V3-031 visual text silence — стихи больше не рисуются под каждым цветком: renderer выбирает только ближайший допустимый bloom, сохраняя текст в модели памяти.
- V3-032 touch hysteresis — движение получает приоритет над случайным gaze; захват требует осознанного удержания.
- V3-033 density visual cleanup — в плотных областях подавляются второстепенные обводки.
- V3-034 being cap — bounded pruning для избытка существ.
- V3-036 start density — начальная плотность снижена до трёх значимых узлов; первые 25 секунд автоматический scatter Director подавлен.
- V3-037 spawn budget — автоматический scatter ограничивается при росте живых узлов, без interception `spawnNode`.
- V3-038 render budget — при высокой плотности подавляются только слабые тонкие второстепенные связи; узлы, существа, gaze и интерактивные линии сохраняются.
- V3-043 touch race hardening — live-node capture синхронизирован с touch-down.
- V3-045 density guard — bounded caps для узлов, существ, bloom и ран.
- V3-046 performance guard — weak-device quality demotion и persisted low-quality profile.
- V3-047 touch target + return meaning — расширенный невидимый tap-target и дешёвый spatial return feedback.
- V3-048 low-device presentation guard — более жёсткий профиль слабого устройства с сохранением V3-046 base guard.
- V3-049 render budget — слабому устройству сокращены декоративные far-stars/blooms и тяжёлый tide-gradient без изменения world/save state.
- V3-050 render budget hardening — убран per-frame GC churn: `slice()` и повторная `ctx.stroke` closure заменены allocation-free hot path с обязательным восстановлением массивов.
- Service Worker cache — offline shell содержит новые assets.
- Release APK: debug signing запрещён для `v*` tags.
- Release tag требует `IGRA_KEYSTORE_B64` и `IGRA_KEYSTORE_PASSWORD`.
- APK получает SHA-256 и публикует его рядом с artifact.

### Последний подтверждённый V3-050 build

- Версия: `3.0.1`
- commit: `8d37a564a6c66cc21ca5848e9e4baf44a4bbf761`
- APK workflow: SUCCESS
- workflow run: `34153566905`
- APK artifact: `igra-3.0.1`
- artifact ID: `10030212614`
- GitHub artifact digest: `sha256:879a288b0981e7465928ccd8e405517cbcd254f72e06b985d27e1ec10e902698`
- физический weak-device test: `427×948 @1.0`, профиль `слабый`
- физический test duration: `1.3 мин`
- физический performance: `56 FPS`, `109` тяжёлых кадров
- native save: жив
- touch: `25`, gaze `22`, growth `19`, dropped `1`
- drop reason: `отпустил сам ×1`
- drop median: `0.68с`, almost-immediate `0/1`
- conclusion: V3-050 performance/touch hardening acceptance passed on the tested weak Android device; performance exceeded V3-049 baseline (`53 FPS / 525 heavy frames`).

### Автоматические gate

APK workflow выполняет probes, boot, Android security, sync, expanded RC hardening, Android build и checksum verification. Последний подтверждённый V3-050 workflow завершён SUCCESS. CI подтверждает автоматические инварианты, но физический Android smoke остаётся отдельным acceptance layer.

### Что ещё нельзя считать закрытым

1. Upgrade со всех поддерживаемых старых save на текущем устройстве.
2. Force-stop/process death → recovery на текущей сборке.
3. Полный offline smoke на физическом Android.
4. Audio/haptic/fullscreen и отсутствие critical visual/touch blocker на физическом устройстве.
5. Финальная сверка Play listing/privacy материалов с фактическим APK.
6. Чистая сборка после merge на `main` должна быть подтверждена перед signed production tag.

### Следующий milestone

Закрыть оставшийся эксплуатационный RC gate. Если blocker отсутствует, переходить к signed production tag и Play release preparation. Новые продуктовые механики после RC freeze не добавлять; blocker/critical fixes допускаются только с повторным полным CI и физическим smoke.

### После RC

Создан `docs/BACKLOG_POST_RC.md` с единым планом: физический RC gate → release preparation → V9 World Depth → V10 Personal Myth/Replay → V11 Final Polish. Новые продуктовые улучшения проходят через `IMP-*`, bounded persistence и автоматические probes.
