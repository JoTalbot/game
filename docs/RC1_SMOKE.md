# RC1 — физический Android smoke gate

> Контракт: `v3.0.1-rc1` / versionCode `601`.
> Автоматический RC gate зелёный. Этот документ закрывает только то, что нельзя достоверно подтвердить CI.

## Правило выпуска

Не создавать production release и не считать игру production-ready, пока физический smoke не подтверждён на реальном Android.

После успешного smoke:

1. создать immutable tag/release `v3.0.1-rc1`;
2. собрать APK с release signing;
3. проверить SHA-256;
4. провести ограниченное RC-тестирование;
5. отдельно принять решение о production Play release.

## Уже подтверждено на v3.0.1

Физический weak-device smoke: `427×948 @1.0`, 2 мин, `55 FPS`, `4` тяжёлых кадра, native save жив, `0` accidental drops, `0` runtime render exceptions, visual spam отсутствует, save → restart → recovery успешно, camera `0.99–1.01`.

## Чек-лист физического RC gate

- [x] Устройство: `427×948 @1.0`, слабый профиль
- [ ] Android: версия ____________________
- [ ] Release APK: `v3.0.1-rc1` / versionCode `601`
- [ ] Release APK SHA-256: ____________________
- [x] Clean install / первый boot / базовый игровой smoke
- [x] Save → restart → recovery
- [ ] Back / Home / resume в расширенном прогоне
- [ ] Force-stop / process death → recovery
- [ ] Upgrade со старого сейва, если доступен `v2.33`
- [ ] Полный offline smoke: airplane mode / отсутствие сети
- [ ] Финал `release`
- [ ] Финал `become` / NG+
- [ ] Вибрация
- [ ] Аудио
- [ ] Полноэкранный WebView
- [ ] Нет crash / ANR / blocker в расширенном прогоне
- [ ] Нет критического визуального или touch-регресса
- [ ] Play listing/privacy материалы соответствуют фактическому APK

## Release evidence

Последний автоматически подтверждённый CI artifact:

- artifact: `igra-3.0.1`
- artifact ID: `10117341876`
- commit: `8adb93012c85847d3d8d2e09f9d52ed161d280`
- SHA-256: `sha256:cbd77adda2fde0e1e9b6bc7eed15de2da8ee2b67c758da3def701946b163cee0`
- APK workflow: SUCCESS
- mirror sync: SUCCESS

Это **не release-tag artifact**. Для RC release требуется immutable tag `v3.0.1-rc1` и release signing.

## Touch improvement

`IMP-RC1-TOUCH` — P1 candidate, не текущий release blocker. Две независимые v2.33 сессии дали `8` finger-left событий, медиану ухода `128–132 px` при hard threshold `126 px`. Предлагаемая grace zone `126–140 px` должна проходить deterministic probes и новый физический smoke до изменения production behavior.

## Evidence protocol

Зафиксировать модель/Android, точный APK и SHA-256, дату/время, результат каждого пункта, а при дефекте — скрин/видео и crash/ANR log.

CI не заменяет физический Android smoke.

## Exit criteria

RC1 physical gate закрыт, если clean install/boot/play/save успешны, process-death recovery успешен, upgrade path проверен или документирован как физически недоступный, offline smoke успешен, release/become работают, critical/blocker отсутствуют, а release metadata и SHA-256 совпадают с build contract.
