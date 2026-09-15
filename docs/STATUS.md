# Статус — 15 сентября 2026

## Текущий инженерный статус

`main` прошёл V3-001 → V3-029, V4 second act, V5 living-world, V6 body identity, V7 climax/finale и V8 lineage. RC1 accessibility и expanded RC hardening gate подключены к автоматическому pipeline. V3-032 → V3-052 закрыли визуальный/touch/performance/runtime hardening; физический weak-device acceptance ранее подтверждён реальным Android-прогоном. V9 → V25 runtime bridge, systems, persistence и production hardening подключены и покрыты автоматическими probes.

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
- V3-030 visual text/floater silence — глобальное ограничение визуального текста и приоритет важных событий.
- V3-031 playfield readability — bloom verse labels больше не flooding visual playfield.
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
- V3-052 malformed runtime collection hardening — `beings`, `blooms`, `wounds`, `cracks`, `stars`, `forgotten`, `active` санитизируются вокруг update/render lifecycle; добавлена regression-проверка против `undefined.age`.
- V9 → V25 runtime bridge, systems, persistence и production hardening — подключены и покрыты автоматическими probes.
- V9 World Depth — реализован и закрыт deterministic gate.
- V10 Personal Myth / Replay — реализован и закрыт deterministic gate; bounded generational memory, finale-dependent starts, inherited dominant trait, generational rare beats и межжизненная continuity отношений.
- V11-001 first-session UX — реализован: одноразовая контекстная подсказка birth → touch → gaze → first growth, RU/EN, без изменения save/game rules.
- V11-004 long-session engine soak — реализован детерминированный 10 000-step bounded soak с repeatability и snapshot/restore checks.
- V11-005 localization/accessibility final pass — реализован: RU/EN semantic labels, locale-aware document language, live regions, reduced-motion и offline cache coverage.
- V11-006 release QA matrix — реализован структурный gate на 15 release-critical сценариев; физическое Android evidence намеренно остаётся отдельным и не подменяется автоматическим тестом.
- Service Worker cache — offline shell содержит новые assets; cache version `v30`.
- Release APK: debug signing запрещён для `v*` tags.
- Release tag требует `IGRA_KEYSTORE_B64` и `IGRA_KEYSTORE_PASSWORD`.
- APK получает SHA-256 и публикует его рядом с artifact.

### Последний подтверждённый V3.0.1 RC1 build

- Версия: `3.0.1`
- RC tag: `v3.0.1-rc1`
- release commit/tag target: `9e8fe1a13804f2f5d00feb3b4ffbed60af203d44`
- release APK SHA-256: `160cec76dee27c903fab4956ea05c813b6430760c7021a03b85360f36c78f6bc`
- APK workflow для RC tag: SUCCESS
- release asset: `igra-3.0.1.apk`
- physical RC1 smoke: `10 мин`, `427×948`, Android `15`
- Clean install: PASS
- Boot: PASS
- Gameplay: PASS
- Home → resume: PASS
- Save: PASS
- Force-stop → recovery: PASS
- Old save upgrade: PASS
- Offline: PASS
- Release: PASS
- Become/NG+: PASS
- Vibration: PASS
- Audio: PASS
- Fullscreen: PASS
- Crash: `0`
- ANR: `0`
- visual blocker: `0`
- touch blocker: `0`
- heavy frames: `0`
- conclusion: физический RC1 smoke полностью пройден на целевом слабом устройстве.

### Актуальные V11 gate результаты

- V11 first-session: ранее подтверждён.
- V11 accessibility/localization: первоначальный gate обнаружил несовместимость старого probe с accessibility API; исправлено без изменения игрового API.
- Текущий accessibility API сохраняет стабильный `version: 1`; локализация label обновляется после смены языка.
- V11 release QA matrix: `tools/probe/v11-release-qa.js`, структурно покрывает 15 release-critical сценариев.
- Исправлен stale QA expectation: probe ожидал `js/v10-myth.js`, тогда как актуальный shell загружает `js/v10-personality.js`.
- Commit исправления: `f265f04b175321d1b6808b739c439b894b04c516`.
- Life Arc Gate #114: **SUCCESS**.
- APK #1080: **SUCCESS**; development artifact `igra-3.0.1`, SHA-256 `f60447124ad1db5184706bc089618099cd8e0e0404a2aefe7883a1f601159f1f`.
- Sync play mirror #606: **SUCCESS**.
- RC2 evidence artifact: создан успешно.
- Все три актуальных push-gate workflow на `f265f04` завершились успешно.

### Текущие незакрытые release-operational задачи

1. Повторный физический weak-device soak для актуального development APK после завершения V11.
2. Финальная сверка Play listing/privacy материалов с фактическим APK.
3. Ограниченное RC-тестирование после физического soak.
4. Отдельное production decision.
5. Production rollout в Google Play и последующий production monitoring.
6. Issue #4 остаётся открытой как UX/playtest backlog и не считается текущим release blocker.

### Следующий milestone — V11 Final Polish

V10 закрыт. V11-001, V11-004, V11-005 и V11-006 реализованы на инженерном уровне, автоматические gate на актуальном коммите зелёные.

Следующий порядок:

1. P1 balance.
2. P1 visual/audio coherence.
3. Повторный физический weak-device soak для актуального development APK.
4. Limited RC testing.
5. Финальная release-operational сверка.
6. Отдельное production decision.

Новые изменения идут через `IMP-*`, bounded persistence, deterministic probes и CI. Физическая проверка обязательна для Android UX/performance изменений.

Immutable tag `v3.0.1-rc1` не перемещается и не изменяется. Google Play автоматически не публикуется.
