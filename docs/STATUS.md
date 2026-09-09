# Статус — 10 сентября 2026

## Текущий инженерный статус

`main` прошёл V3-001 → V3-029, V4 second act, V5 living-world, V6 body identity, V7 climax/finale и V8 lineage. RC1 accessibility и expanded RC hardening gate подключены к автоматическому pipeline. V3-032 → V3-052 закрыли визуальный/touch/performance/runtime hardening; физический weak-device acceptance для V3-050/V3-052 подтверждён реальным Android-прогоном.

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
- Service Worker cache — offline shell содержит новые assets.
- Release APK: debug signing запрещён для `v*` tags.
- Release tag требует `IGRA_KEYSTORE_B64` и `IGRA_KEYSTORE_PASSWORD`.
- APK получает SHA-256 и публикует его рядом с artifact.

### Последний подтверждённый V3.0.1 RC1 build

- Версия: `3.0.1`
- RC tag: `v3.0.1-rc1`
- release commit/tag target: `9e8fe1a13804f2f5d00feb3b4ffbed60af203d44`
- release APK SHA-256: `160cec76dee27c903fab49506ea5c813b6430760c7021a03b85360f36c78f6bc`
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

### Автоматические gate

APK workflow на текущем `main` commit `d93446e11b401af879364091afc19a58da9720e5` завершён SUCCESS: probes, live boot, Android security, sync, Android SDK 34 build и checksum verification прошли. Sync play mirror также SUCCESS. filecite не вставлять в документацию: ссылки на CI являются внешними артефактами репозитория.

### Что ещё нельзя считать закрытым

1. Финальная сверка Play listing/privacy материалов с фактическим APK.
2. Ограниченное RC-тестирование после физического smoke.
3. Production rollout в Google Play и последующий production monitoring.
4. Issue #4 остаётся открытой как UX/playtest backlog и не считается текущим release blocker.

### Следующий milestone

Физический RC1 gate GREEN. Immutable tag `v3.0.1-rc1` создан и не должен перемещаться. Release APK подписан release-ключом и опубликован как GitHub Release asset. Не добавлять новые продуктовые механики перед RC freeze. Завершить release-operational checklist, провести ограниченное RC-тестирование и только после этого принимать отдельное решение о production Play release.

Issue #7 закрыта как completed после физической проверки. Issues #5 и #6 закрыты после подтверждения отсутствия визуального спама. Issue #4 остаётся открытой как UX/playtest backlog и не считается текущим release blocker.

### После RC

Создан `docs/BACKLOG_POST_RC.md` с единым планом: физический RC gate → release preparation → V9 World Depth → V10 Personal Myth/Replay → V11 Final Polish. Новые продуктовые улучшения проходят через `IMP-*`, bounded persistence и автоматические probes.
