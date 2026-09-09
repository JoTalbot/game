# RC1 — физический Android smoke gate

> Контракт: `v3.0.1-rc1` / versionCode `601`.
> Автоматический RC gate зелёный. Физический RC smoke подтверждён на реальном Android.

## Правило выпуска

Не считать production release готовым до ограниченного RC-тестирования и отдельного production decision.

После успешного физического smoke:

1. создать immutable tag/release `v3.0.1-rc1`;
2. собрать APK с release signing;
3. проверить SHA-256;
4. провести ограниченное RC-тестирование;
5. отдельно принять решение о production Play release.

## Physical RC1 evidence — PASS

Проведён реальный smoke на слабом устройстве:

- экран: `427×948 @1.0`
- Android: `15`
- длительность: `10 мин`
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
- Visual blocker: `0`
- Touch blocker: `0`
- Heavy frames: `0`

Это закрывает физические lifecycle, upgrade, offline, финальные игровые сценарии и основные device-function проверки, которые ранее оставались неподтверждёнными.

## Чек-лист физического RC gate

- [x] Устройство: `427×948 @1.0`, слабый профиль
- [x] Android: `15`
- [x] Release APK: `v3.0.1-rc1` / versionCode `601`
- [x] Release APK SHA-256: `160cec76dee27c903fab49506ea5c813b6430760c7021a03b85360f36c78f6bc`
- [x] Clean install / первый boot / базовый игровой smoke
- [x] Save → restart → recovery
- [x] Back / Home / resume
- [x] Force-stop / process death → recovery
- [x] Upgrade со старого сейва `v2.33`
- [x] Полный offline smoke: airplane mode / отсутствие сети
- [x] Финал `release`
- [x] Финал `become` / NG+
- [x] Вибрация
- [x] Аудио
- [x] Полноэкранный WebView
- [x] Нет crash / ANR / blocker
- [x] Нет критического визуального или touch-регресса
- [ ] Play listing/privacy материалы соответствуют фактическому release APK

## Release evidence

Immutable RC release подтверждён:

- tag: `v3.0.1-rc1`
- target commit: `9e8fe1a13804f2f5d00feb3b4ffbed60af203d44`
- GitHub Release: published
- prerelease flag: `false` (требует ручного переключения на Pre-release)
- APK: `igra-3.0.1.apk`
- versionCode: `601`
- release APK SHA-256: `sha256:160cec76dee27c903fab49506ea5c813b6430760c7021a03b85360f36c78f6bc`
- APK workflow #877: SUCCESS
- release signing step: SUCCESS
- checksum verification: SUCCESS
- APK attached to release: SUCCESS

## Touch improvement

`IMP-RC1-TOUCH` — P1 candidate, не текущий release blocker. Две независимые v2.33 сессии дали `8` finger-left событий, медиану ухода `128–132 px` при hard threshold `126 px`. Предлагаемая grace zone `126–140 px` должна проходить deterministic probes и новый физический smoke до изменения production behavior.

## Exit criteria

Физический RC gate закрыт: clean install/boot/play/save успешны, process-death recovery успешен, upgrade path проверен, offline smoke успешен, release/become работают, critical/blocker отсутствуют. Release artifact и checksum подтверждены. Остались только ручные release-operational действия: включить Pre-release для RC, синхронизировать Play listing/privacy материалы и провести ограниченное RC-тестирование. Production Play release принимается отдельным решением.
