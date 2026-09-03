# ИГРА — backlog P9 / доступность и эксплуатационная полировка

> P9 — не косметика. Это слой качества перед публичным релизом: игра должна оставаться понятной и управляемой без обязательной анимации, цвета или звука.
>
> Правило: каждое новое улучшение сначала фиксируется здесь, затем реализуется и проверяется probe/CI.

## IMP-P9-001. Reduced-motion + semantic UI signals
**Приоритет:** P1 — accessibility / release quality
**Статус:** реализовано / ожидает CI

- уважать системную настройку `prefers-reduced-motion`;
- отключать декоративные бесконечные анимации и длинные transition-эффекты при reduced motion;
- дать ключевым динамическим областям semantic `aria-live`;
- назначить интерактивным кнопкам устойчивые доступные имена независимо от визуального текста;
- не менять игровой цикл, механику touch или визуальный язык для пользователей без reduced-motion.

### Реализация
- `web/js/accessibility.js` — единый accessibility layer;
- `web/index.html` — модуль загружается в browser shell;
- `web/sw.js` — модуль включён в offline cache, cache version `v17`;
- `tools/probe/accessibility.js` — deterministic acceptance probe;
- `.github/workflows/apk.yml` — probe является обязательным gate до APK build.

### Acceptance
- deterministic probe подтверждает наличие accessibility layer в browser shell;
- reduced-motion режим выключает декоративные animation/transition эффекты;
- ключевые динамические области имеют `aria-live`;
- все UI-кнопки имеют доступное имя;
- обычный режим не получает forced reduced-motion.
