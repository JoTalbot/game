# ИГРА — текущий статус проекта

> Обновлено: 2026-09-17 после проверки `main` и GitHub CI. Авторитетные точки: `docs/READINESS.md` и `agent/state/current.yml`.

## Состояние

- `main` HEAD: `6ac588e99c51e244d4a40ca16157e4f0e484b2fc`.
- Release-candidate source commit: `0643a336657e571ee7aed786fbb362b0da3fed98`.
- Коммит `6ac588e` является только docs/state batch после сборки кандидата; игровой `web/` и Android-код кандидата не менялись.
- На `0643a33`: APK #1204 debug SUCCESS, APK #1205 release-signed SUCCESS, Life Arc Gate #237 SUCCESS, Sync play mirror #774 SUCCESS, Pages SUCCESS.
- Release-signed candidate: run `35229481075`, artifact `10500832061`, APK SHA-256 `3898a9408d52a22fd1f8237bc1650bebf6aa3da936125991d9de4f096c816396`.
- Release signing подтверждён: apksigner v2/v3 true, 1 signer; сертификат fingerprint `31:80:D0:AE:D6:E9:8D:7E:2B:06:CA:EE:FA:10:B8:7A:40:18:47:1F:41:92:34:4A:03:4E:95:AD:B7:44:D2:42`.
- Immutable `v3.0.1-rc1` не изменён: commit `9e8fe1a13804f2f5d00feb3b4ffbed60af203d44`, APK SHA-256 `160cec76dee27c903fab49506ea5c813b6430760c7021a03b85360f36c78f6bc`.

## Готовность

- Deterministic readiness: **PASS**.
- Raw readiness: **94%**.
- Effective readiness: **90%** из-за cap physical Android acceptance.
- Production gate: **BLOCKED**.

Автоматические probes/CI зелёные. Основные оставшиеся факты относятся к физическому Android/QA/performance/persistence и финальной release/store сверке.

## RC-PHYS-002 — главный blocker

Объект проверки: **только** release-signed APK `3898a940...`, source commit `0643a33`.

На реальном Android-устройстве требуется выполнить 16 сценариев: clean install, boot/gameplay, resume, save/restart, force-stop recovery, old-save upgrade, offline, Release/Become/NG+, vibration, audio, fullscreen, crash, ANR, performance/heavy frames, visual и touch checks.

CI, эмулятор, браузер и synthetic evidence не считаются physical acceptance. Evidence должен быть привязан к exact commit и APK SHA и пройти `tools/probe/physical-android-evidence.js` и `tools/probe/validate-release-authorization.js`.

Журнал: `docs/PHYSICAL_ANDROID_ACCEPTANCE_RECORD.md`. Шаблон: `docs/physical-android-evidence.template.json`.

## Release safety

- Production release пока не выполняется.
- `v3.0.1-rc1` не перемещать и не переписывать.
- Tagged APK workflow проверяет physical approval, exact approved commit и exact approved APK SHA.
- Несмотря на то что `main` сейчас указывает на docs commit `6ac588e`, физически тестируемый кандидат остаётся точно привязанным к `0643a33` и SHA `3898a940...`. Production authorization должен использовать именно эту provenance.
- Финальное production decision и Play Console действия остаются за человеком.

## Ограничения среды агента

Android SDK/adb/эмулятор/Playwright/Docker в песочнице отсутствуют; JDK 11 вместо требуемого 17. Поэтому физический acceptance здесь выполнить нельзя и evidence не фабрикуется.
