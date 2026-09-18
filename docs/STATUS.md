# ИГРА — текущий статус проекта

> Обновлено: 2026-09-18 после проверки `main`, GitHub CI и независимой проверки бинарника кандидата. Авторитетные точки: `docs/READINESS.md` и `agent/state/current.yml`.

## Состояние

- `main` HEAD: `eca3018362156410172156d1bf8350668b6967c7` (docs/state-коммиты после `1f0a1b7`; игровой payload не менялся).
- Release-candidate source commit: `1f0a1b7ee1af88807ddc7b8c95d3e20a8868965e` (кандидат собран с него; `web/` и `android/` с тех пор не менялись).
- CI: на `eca3018` — Sync play mirror #783 SUCCESS, Pages #1345 SUCCESS (commit docs-only → APK и Life Arc Gate не запускаются по `paths-ignore: docs/**`). Последний полный набор на `287e047` — APK #1212, Life Arc Gate #243, Sync play mirror #781, Pages #1343, все SUCCESS.
- Release-signed candidate: run `35232162470` (APK #1210, `workflow_dispatch`, `release_candidate=true`), artifact `10502001833` (`igra-3.0.1`), файл `igra-3.0.1.apk`, **APK SHA-256 `1c18e1c1bdefc44636b5bff62296a6cf5847d185b28df0bcffa454c0254d9056`**.
- Скачать: https://github.com/JoTalbot/game/actions/runs/35232162470 → artifact `igra-3.0.1`.

## Независимая проверка кандидата (2026-09-18)

Полный отчёт: `docs/RELEASE_CANDIDATE_VERIFICATION.md`. Кратко, всё проверено фактом в песочнице агента (JDK 17 + build-tools 34.0.0):

- artifact скачан, `sha256sum` = `1c18e1c1…` (совпал с `igra-3.0.1.apk.sha256` внутри артефакта);
- `apksigner verify`: v2 `true`, v3 `true`, 1 signer; сертификат `CN=IGRA, O=JoTalbot, C=UA`, SHA-256 `3180d0ae…d242` — тот же, что у `v3.0.1-rc1`;
- негативный контроль: debug-сборка того же commit даёт другой сертификат (`8f00f375…`) → кандидат действительно release-signed;
- манифест: `world.igra.app`, versionCode `601`, versionName `3.0.1`, minSdk `26`, targetSdk `34`, разрешения только `VIBRATE`/`WAKE_LOCK`/`INTERNET`, `allowBackup=false`, `usesCleartextTraffic=false`, единственный exported-компонент — launcher-activity;
- payload: `assets/www` внутри APK **байт-идентичен** `web/` в `main` (93 файла, `diff -r` чист); `sw.js` = `igra-shell-v31`;
- воспроизводимость: локальная сборка `tools/build-apk.sh` из `main` дала идентичные `classes.dex`, `resources.arsc`, `AndroidManifest.xml`, `res/`, `assets/www` и тот же размер (3 060 325 байт) — отличается только блок подписи.

## Глубокий браузерный прогон (не физический)

`tools/browser-deep-run.js` → **32/32 PASS** на payload `e1d3a8a0…` (commit `eca3018`), evidence `docs/evidence/browser-deep-run-2026-09-18.json` + скриншоты.

Покрыто: первые секунды без туториала; SW `igra-shell-v31` (90 записей) и оффлайн-перезагрузка с возвратом в мир; touch-жесты (tap/hold); поворот портрет↔ландшафт (канвас-буфер перестроен, overflow 0); background→foreground (состояние и мир сохранены); сейв → перезапуск → «вернуться» (мир восстановлен); ru/en (словарь `IGRA.UI_STR` 55/55, 0 overflow в двух ориентациях); тишина/звук; CPU-throttle ×6 (60.3 → 14.4 fps, рендер продолжается, ошибок нет); 4-мин soak (heap +630 KB, DOM-узлы не растут, 0 новых JS-обработчиков, 0 pageerror, 0 проваленных запросов); reduced-motion; сигила.

Это **не** физический acceptance: touch/haptic/lifecycle/слабое железо на реальном устройстве остаются за `RC-PHYS-002`.

### Наблюдение смены: пики `JSEventListeners` — артефакт эмуляции ввода, не утечка

При синтетических mouse-hold жестах CDP-метрика `JSEventListeners` уходит в тысячи (51 → 3692, пики до 12 949) и возвращается к базовой линии (~58–73) после GC; при tap-жестах стабильна. Инструментированный `addEventListener` в самой странице за 3 минуты жестов показал **0** вызовов из кода игры; heap стабилен. Вывод: это особенность учёта синтетического ввода в headless Chromium, **не** утечка игры. Проверка в `tools/browser-deep-run.js` переписана на честный критерий (число JS-подписок и DOM-узлы), метрика оставлена информационно. Физический soak (`V11-004`, гейт 10) остаётся открытым.

## Устаревшие кандидаты (не тестировать)

- commit `0643a33`, run `35229481075`, APK SHA-256 `3898a9408d52a22fd1f8237bc1650bebf6aa3da936125991d9de4f096c816396` — собран из `main` со сломанным `web/sw.js` (SW не устанавливался, оффлайн-оболочка браузера не работала).
- commit `1ddc7e9`, APK SHA-256 `7412b523…` — debug-подпись, main ушёл вперёд.
- Immutable `v3.0.1-rc1` не изменён: commit `9e8fe1a13804f2f5d00feb3b4ffbed60af203d44`, APK SHA-256 `160cec76dee27c903fab49506ea5c813b6430760c7021a03b85360f36c78f6bc` (перепроверено скачиванием 2026-09-18).

## Готовность

- Deterministic readiness: **PASS** (`rc2-evidence.js`: `deterministicReady:true`, `missing:[]`, все blockers false).
- Raw readiness: **94%** (пересчёт №4, 2026-09-18).
- Effective readiness: **90%** из-за cap физического acceptance.
- Production gate: **BLOCKED**.
- Числители гейтов за смену 2026-09-18 не менялись: все открытые пункты упираются в физическое устройство или production-решение.

## RC-PHYS-002 — главный blocker

Объект проверки: **только** release-signed APK `1c18e1c1bdefc446...`, source commit `1f0a1b7` (run `35232162470`).

На реальном Android-устройстве требуется выполнить 16 сценариев: clean install, boot/gameplay, resume, save/restart, force-stop recovery, old-save upgrade, offline, Release/Become/NG+, vibration, audio, fullscreen, crash, ANR, performance/heavy frames, visual и touch checks.

CI, эмулятор, браузер и synthetic evidence не считаются physical acceptance. Evidence должен быть привязан к exact commit и APK SHA и пройти `tools/probe/physical-android-evidence.js` и `tools/probe/validate-release-authorization.js`.

Журнал: `docs/PHYSICAL_ANDROID_ACCEPTANCE_RECORD.md`. Шаблон: `docs/physical-android-evidence.template.json`.

## Release safety

- Production release пока не выполняется.
- `v3.0.1-rc1` не перемещать и не переписывать.
- Tagged APK workflow проверяет physical approval, exact approved commit и exact approved APK SHA.
- Физически тестируемый кандидат точно привязан к `1f0a1b7` и SHA `1c18e1c1bdefc446...`. Production authorization должен использовать именно эту provenance.
- Финальное production decision и Play Console действия остаются за человеком.
- Замечание для store/privacy-сверки: в манифесте остаётся `INTERNET` при оффлайн-игре — нужна корректная декларация в Data safety; удаление разрешения изменит payload и потребует нового кандидата.

## Ограничения среды агента

- Песочница 2026-09-18: `/dev/kvm` отсутствует → аппаратный эмулятор Android невозможен; Docker отсутствует; Node 20 (CI — Node 22).
- Установлено агентом в контуре смены (вне репозитория): JDK 17 Temurin, Android cmdline-tools + `platforms;android-34` + `build-tools;34.0.0` + `platform-tools`, Playwright 1.55 + Chromium 140. Это позволило впервые собрать APK **локально** и независимо проверить кандидата.
- Физический acceptance здесь выполнить нельзя, evidence не фабрикуется.

## Инциденты и находки

- 2026-09-17: регрессия оффлайн-оболочки (`web/sw.js` с незакрытой скобкой) — исправлено в `1f0a1b7`, закрыто двумя постоянными сторожами и негативным контролем.
- 2026-09-17: параллельный агент работал в `main`; перед каждым пушем обязателен `git fetch` + `rebase`.
- 2026-09-18: коммит `eca3018` (docs) случайно удалил из `docs/READINESS.md` расшифровку гейтов 10–15 — восстановлено и актуализировано этой сменой.
- 2026-09-18: пики `JSEventListeners` под синтетическим вводом — артефакт эмуляции, не утечка (см. раздел выше).
