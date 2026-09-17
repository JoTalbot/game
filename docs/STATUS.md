# ИГРА — текущий статус проекта

> Обновлено: 2026-09-17 после проверки `main` и GitHub CI. Авторитетные точки: `docs/READINESS.md` и `agent/state/current.yml`.

## Состояние

- `main` HEAD: `1f0a1b7ee1af88807ddc7b8c95d3e20a8868965e`.
- Release-candidate source commit: `1f0a1b7ee1af88807ddc7b8c95d3e20a8868965e` (тот же commit; кандидат собран с него).
- На `1f0a1b7`: APK #1209 debug SUCCESS, APK #1210 release-signed SUCCESS (run `35232162470`), Life Arc Gate #241 SUCCESS, Sync play mirror #779 SUCCESS, Pages #1341 SUCCESS.
- Release-signed candidate: run `35232162470` (APK #1210, `workflow_dispatch`, `release_candidate=true`), artifact `10502001833` (`igra-3.0.1`), файл `igra-3.0.1.apk`, **APK SHA-256 `1c18e1c1bdefc44636b5bff62296a6cf5847d185b28df0bcffa454c0254d9056`**.
- Подпись release подтверждена фактом: лог run (`IGRA_SIGNING_MODE: release`, `zipalign + sign (release)`), apksigner v2 `true` / v3 `true` / 1 signer, fingerprint сертификата `31:80:D0:AE:D6:E9:8D:7E:2B:06:CA:EE:FA:10:B8:7A:40:18:47:1F:41:92:34:4A:03:4E:95:AD:B7:44:D2:42` (тот же стабильный release keystore, `notBefore Aug 19 2026`).
- Содержимое APK сверено: `assets/www/sw.js` несёт `igra-shell-v31` (исправленная оффлайн-оболочка).
- Скачать: https://github.com/JoTalbot/game/actions/runs/35232162470 → artifact `igra-3.0.1`.

### Устаревший кандидат (не тестировать)

- Кандидат от 13:51 UTC: commit `0643a336657e571ee7aed786fbb362b0da3fed98`, run `35229481075` (APK #1205), artifact `10500832061`, APK SHA-256 `3898a9408d52a22fd1f8237bc1650bebf6aa3da936125991d9de4f096c816396`.
- Причина замены: в этом бинарнике `web/sw.js` синтаксически сломан (незакрытая скобка в fetch-обработчике) — Service Worker не устанавливался, оффлайн-оболочка браузерного берега не работала. На APK-поведение это не влияло (WebView грузит ассеты локально, регистрация SW для file:// не выполняется), но кандидат собран из дефектного `main`.
- Дефект исправлен в `1f0a1b7`, закрыт двумя новыми сторожами (`node --check` корневых скриптов `web/` в `tools/check-sync.sh` и функциональный SW-probe в `tools/probe/boot.js`) и проверен в реальном headless Chromium: SW регистрируется, кэш `igra-shell-v31` = 90 записей, перезагрузка без сети поднимает игру.
- Release signing подтверждён: apksigner v2/v3 true, 1 signer; сертификат fingerprint `31:80:D0:AE:D6:E9:8D:7E:2B:06:CA:EE:FA:10:B8:7A:40:18:47:1F:41:92:34:4A:03:4E:95:AD:B7:44:D2:42`.
- Immutable `v3.0.1-rc1` не изменён: commit `9e8fe1a13804f2f5d00feb3b4ffbed60af203d44`, APK SHA-256 `160cec76dee27c903fab49506ea5c813b6430760c7021a03b85360f36c78f6bc`.

## Готовность

- Deterministic readiness: **PASS**.
- Raw readiness: **94%**.
- Effective readiness: **90%** из-за cap physical Android acceptance.
- Production gate: **BLOCKED**.

Автоматические probes/CI зелёные. Основные оставшиеся факты относятся к физическому Android/QA/performance/persistence и финальной release/store сверке.

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

## Ограничения среды агента

Android SDK/adb/эмулятор/Docker в песочнице отсутствуют; JDK 11 вместо требуемого 17 — локальная сборка APK невозможна, сборка выполняется CI. Playwright + headless Chromium установлены агентом во время смены и использованы для браузерного smoke (`tools/browser-smoke.js`, 22/22 PASS). Физический acceptance здесь выполнить нельзя, evidence не фабрикуется.

## Инцидент смены: регрессия оффлайн-оболочки

`web/sw.js` находился в `main` с незакрытой скобкой: Service Worker не проходил evaluation, регистрация молча падала в пустой `catch`, оффлайн-берег браузера не работал. Автоматические стенды этого не видели: `node --check` в CI покрывает только `web/js`, а `tools/check-sync.sh` сверял лишь состав кэша. Найдено реальным браузерным прогоном 2026-09-17, исправлено, закрыто двумя постоянными сторожами и негативным контролем (сломанный файл обоими сторожами отклоняется).
