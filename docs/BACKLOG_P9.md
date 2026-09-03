# ИГРА — backlog P9 / доступность и эксплуатационная полировка

> P9 — не косметика. Это слой качества перед публичным релизом: игра должна оставаться понятной и управляемой без обязательной анимации, цвета или звука.
> Правило: каждое новое улучшение сначала фиксируется здесь, затем реализуется и проверяется probe/CI.

## IMP-P9-001. Reduced-motion + semantic UI signals
**Приоритет:** P1 — accessibility / release quality
**Статус:** реализовано / CI gate подключён

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

## IMP-P9-002. Expanded RC hardening gate
**Приоритет:** P1 — RC engineering quality
**Статус:** реализовано / подключено к CI

Цель — превратить оставшиеся автоматизируемые пункты RC-контракта в один воспроизводимый gate, не выдавая его за физический Android smoke.

### Проверяет
- RU/EN dictionary parity и substantive coverage;
- browser shell + offline cache completeness;
- reduced-motion API stability;
- Android pause/resume/back lifecycle hooks;
- native `SharedPreferences` save bridge;
- WebView origin/file-access security;
- pinned RC version `3.0.0-rc1` / versionCode `600`;
- checksum verification in APK workflow;
- bounded V4/V4.3/V8 persistence collections;
- real-engine long-session soak when CI exposes GC;
- native save + browser fallback presence.

### Реализация
- `tools/probe/rc-hardening.js` — deterministic/static hardening gate;
- `tools/probe/long.js` — реальный engine soak с замерами world/transient collections и heap;
- `.github/workflows/apk.yml` — `node --expose-gc tools/probe/rc-hardening.js` является обязательным gate.

### Ограничение
Этот gate не закрывает физические сценарии clean install, upgrade, process death, offline на устройстве, аудио/haptic и визуальный acceptance. Они остаются в `docs/RC1_SMOKE.md`.

## IMP-P9-003. RU/EN runtime parity
**Приоритет:** P1
**Статус:** автоматически закрыто hardening gate

Дублирование ключей RU/EN теперь проверяется непосредственно после загрузки `lang.js`; расхождение dictionary key set ломает RC gate.

## IMP-P9-004. Physical Android lifecycle / offline / upgrade
**Приоритет:** P0 — external acceptance
**Статус:** открыт, требует текущий APK и физическое устройство

Остаются обязательными:
- clean install → boot → birth → play → save;
- back/home/resume;
- force-stop/process death → recovery;
- upgrade со старого поддерживаемого save;
- полный offline smoke;
- release/become + lineage;
- vibration/audio/fullscreen;
- отсутствие crash/ANR/critical visual/touch blocker.

## IMP-P9-005. Performance / memory physical soak
**Приоритет:** P1
**Статус:** automated engine soak подключён; physical confirmation открыта

Автоматический стенд измеряет реальный `engine.js` на длительной сессии и ограничивает transient/world collections. Финальное отсутствие деградации на целевом слабом Android подтверждается только физическим прогоном.

## IMP-RC1-TOUCH
Статус: реализовано; физически требует повторной проверки на актуальном RC APK.

## IMP-RC1-COLOR
Статус: наблюдение, без продуктового изменения. Не добавлять подсказки только ради метрики.

## Правило RC
После принятия improvement сначала реализуем его и прогоняем полный probe/CI. Затем повторяем физический smoke. Production release остаётся закрытым до прохождения физического RC gate.
