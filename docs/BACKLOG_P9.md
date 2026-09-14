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
- `web/sw.js` — модуль включён в offline cache;
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
- RC version contract;
- checksum verification in APK workflow;
- bounded V4/V4.3/V8 persistence collections;
- real-engine long-session soak when CI exposes GC;
- native save + browser fallback presence.

### Реализация
- `tools/probe/rc-hardening.js` — deterministic/static hardening gate;
- `tools/probe/long.js` — реальный engine soak с замерами world/transient collections и heap;
- `.github/workflows/apk.yml` — hardening probe является обязательным gate.

### Ограничение
Этот gate не закрывает физические сценарии clean install, upgrade, process death, offline на устройстве, аудио/haptic и визуальный acceptance. Они подтверждены отдельным физическим RC1 smoke и зафиксированы в `docs/RC1_SMOKE.md`.

## IMP-P9-003. RU/EN runtime parity
**Приоритет:** P1
**Статус:** автоматически закрыто hardening gate

Дублирование ключей RU/EN проверяется непосредственно после загрузки `lang.js`; расхождение dictionary key set ломает RC gate.

## IMP-P9-004. Physical Android lifecycle / offline / upgrade
**Приоритет:** P0 — external acceptance
**Статус:** PASS / закрыт для `v3.0.1-rc1`

Подтверждены на Android 15, 427×948 @1.0, weak-device profile, 10 минут:
- clean install → boot → birth → play → save — PASS;
- back/home/resume — PASS;
- force-stop/process death → recovery — PASS;
- upgrade со старого поддерживаемого save — PASS;
- полный offline smoke — PASS;
- release/become + lineage — PASS;
- vibration/audio/fullscreen — PASS;
- crash/ANR/critical visual/touch blocker/heavy frames — 0.

Evidence: `docs/RC1_SMOKE.md`, release APK SHA-256 `160cec76dee27c903fab49506ea5c813b6430760c7021a03b85360f36c78f6bc`.

## IMP-P9-005. Performance / memory physical soak
**Приоритет:** P1
**Статус:** PASS для текущего RC1 acceptance; automated engine soak подключён

Автоматический стенд измеряет реальный `engine.js` на длительной сессии и ограничивает transient/world collections. Физический RC1 smoke не выявил heavy frames, crash, ANR или визуальной деградации.

## IMP-RC1-TOUCH
**Статус:** реализовано; физически подтверждено на актуальном RC1 APK.

## IMP-RC1-COLOR
**Статус:** наблюдение, без продуктового изменения. Не добавлять подсказки только ради метрики.

## Правило RC
Физический RC1 gate закрыт. Immutable release tag `v3.0.1-rc1` не изменяется. Production release остаётся отдельным решением после финальной release-operational сверки и limited RC testing.
