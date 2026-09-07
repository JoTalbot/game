# V3-050 — weak-device performance audit

## Trigger

Физический Android smoke от 7 сентября 2026: `427×948 @1.0 (слабый)`, игра `3.0.1`, `2.1 мин`, `47 FPS`, `915` тяжёлых кадров.

Это хуже подтверждённого V3-049 прогона (`53 FPS`, `525` тяжёлых кадров за `2.8 мин`). V3-050 не меняет механику, persistence или touch semantics.

## Scope

Проверяем только стоимость кадра:

- render loop и частоту работы renderer;
- canvas gradients/shadows/compositing;
- decorative stars/blooms/tide effects;
- per-frame allocations и повторное создание объектов;
- weak-device quality profile и его фактическое применение;
- неявные эффекты от DOM/UI, resize и animation callbacks.

## Acceptance

На том же классе устройства нужен повторный физический smoke после каждой performance-сборки. Минимум для закрытия V3-050:

- без очевидного визуального/управленческого регресса;
- native save остаётся живым;
- touch race не возвращается;
- FPS и heavy-frame signal должны быть не хуже V3-049 baseline, предпочтительно с запасом;
- probes и APK workflow зелёные.

## Important

Текущие `47 FPS / 915 heavy` считаются реальным blocker для RC на слабом устройстве, пока причина не локализована и повторный физический smoke не покажет исправление.
