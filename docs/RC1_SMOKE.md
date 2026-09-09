# RC1 — физический Android smoke gate

> Контракт: `v3.0.1-rc1` / versionCode `601`.
> Автоматический RC gate зелёный. Физический RC smoke теперь подтверждён на реальном Android.

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
- [ ] Release APK: `v3.0.1-rc1` / versionCode `601`
- [ ] Release APK SHA-256: ____________________
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

Последний автоматически подтверждённый CI artifact для `main`:

- artifact: `igra-3.0.1`
- artifact ID: `10117341876`
- commit: `8adb93012c85847d3d8d2e09f9d52ed161d280`
- SHA-256: `sha256:cbd77adda2fde0e1e9b6bc7eed15de2da8ee2b67c758da3def701946b163cee0`
- APK workflow: SUCCESS
- mirror sync: SUCCESS

Это **не release-tag artifact**. Для RC release требуется immutable tag `v3.0.1-rc1` и release signing, после чего нужно зафиксировать SHA-256 именно release APK.

## Touch improvement

`IMP-RC1-TOUCH` — P1 candidate, не текущий release blocker. Две независимые v2.33 сессии дали `8` finger-left событий, медиану ухода `128–132 px` при hard threshold `126 px`. Предлагаемая grace zone `126–140 px` должна проходить deterministic probes и новый физический smoke до изменения production behavior.

## Exit criteria

Физический RC gate закрыт: clean install/boot/play/save успешны, process-death recovery успешен, upgrade path проверен, offline smoke успешен, release/become работают, critical/blocker отсутствуют. Остались только release-operational действия: release-signed immutable RC artifact, SHA-256, Play listing/privacy sync и ограниченное RC-тестирование.
