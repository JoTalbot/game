# Статус — 9 сентября 2026

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

### Последний подтверждённый V3.0.1 build

- Версия: `3.0.1`
- physical acceptance commit lineage: `e680dc8f58cc31c0f12096a1626f5f8fc03ef7da`
- APK workflow: SUCCESS
- workflow run: `34224997229`
- APK artifact: `igra-3.0.1`
- artifact ID: `10063426019`
- artifact digest: `sha256:c42f129eba67e8ff09c06f055b3a6e3cfda936fee307e45e2d5e6a776cf7ebdc`
- физический weak-device test: `427×948 @1.0`, профиль `слабый`
- физический test duration: `2 мин`
- физический performance: `55 FPS`, `4` тяжёлых кадра
- native save: жив
- touch: `3`, gaze `3`, growth `2`, dropped `0`, steps `1`, void `0`, pulses `0`
- runtime render exceptions: `0`
- visual spam: нет
- save → restart → recovery: успешно
- conclusion: V3-050/V3-052 weak-device acceptance passed; previous `undefined.age` render failure did not reproduce.

### Автоматические gate

APK workflow выполняет probes, boot, Android security, sync, expanded RC hardening, Android build и checksum verification. V3.0.1 workflow run `34224997229` завершён SUCCESS; Sync run `34224997333` также SUCCESS. CI подтверждает автоматические инварианты, а физический Android smoke теперь подтверждает текущую сборку на целевом слабом устройстве.

### Что ещё нельзя считать закрытым

1. Upgrade со всех поддерживаемых старых save на текущем устройстве.
2. Force-stop/process death → recovery на текущей сборке.
3. Расширенный offline smoke на физическом Android.
4. Audio/haptic/fullscreen и отсутствие critical visual/touch blocker в расширенном физическом прогоне.
5. Финальная сверка Play listing/privacy материалов с фактическим APK.
6. Immutable RC tag и ограниченное RC-тестирование.

### Следующий milestone

Физический основной RC gate GREEN. Не добавлять новые продуктовые механики перед RC freeze. Завершить release-operational checklist, выполнить оставшиеся lifecycle/upgrade/offline проверки, затем создать immutable RC tag и провести ограниченное RC-тестирование. Production Play release принимается отдельным решением после RC.

Issue #7 закрыта как completed после физической проверки. Issues #5 и #6 закрыты после подтверждения отсутствия визуального спама. Issue #4 остаётся открытой как UX/playtest backlog и не считается текущим release blocker.

### После RC

Создан `docs/BACKLOG_POST_RC.md` с единым планом: физический RC gate → release preparation → V9 World Depth → V10 Personal Myth/Replay → V11 Final Polish. Новые продуктовые улучшения проходят через `IMP-*`, bounded persistence и автоматические probes.
