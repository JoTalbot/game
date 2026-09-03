# RC1 — физический Android smoke gate

> Контракт: `v3.0.0-rc1` / versionCode `600`.
> Автоматический RC gate зелёный. Этот документ закрывает только то, что нельзя достоверно подтвердить CI.

## Правило выпуска

Не создавать production release и не считать игру production-ready, пока физический smoke не подтверждён на реальном Android.

После успешного smoke:

1. создать immutable tag/release `v3.0.0-rc1`;
2. собрать APK с release signing;
3. проверить SHA-256;
4. провести ограниченное RC-тестирование;
5. отдельно принять решение о production Play release.

## Чек-лист

- [ ] Устройство: модель ____________________
- [ ] Android: версия ____________________
- [ ] APK: `v3.0.0-rc1` / versionCode `600`
- [ ] APK SHA-256: ____________________
- [ ] Clean install
- [ ] Первый boot
- [ ] Birth / создание первой жизни
- [ ] Базовая игра: drag / long-press / tap / double-tap-pulse
- [ ] Back / Home / resume
- [ ] Save
- [ ] Force-stop / process death
- [ ] Relaunch и восстановление сейва
- [ ] Upgrade со старого сейва, если доступен сохранённый `v2.33`
- [ ] Полный offline smoke: airplane mode / отсутствие сети
- [ ] Финал `release`
- [ ] Финал `become` / NG+
- [ ] Вибрация
- [ ] Аудио
- [ ] Полноэкранный WebView
- [ ] Нет crash / ANR / blocker
- [ ] Нет критического визуального или touch-регресса
- [ ] Play listing/privacy материалы соответствуют фактическому APK

## Evidence

Зафиксировать минимум:

- модель и Android;
- APK SHA-256;
- дату и время smoke;
- результат каждого пункта;
- скрин/видео при найденном дефекте;
- crash/ANR log при найденном дефекте.

Любой critical/blocker возвращает RC в разработку. Не маскировать проблему зелёным CI: CI не держит телефон в руке, потому что у CI, к счастью, нет рук.

## Exit criteria

RC1 physical gate закрыт, если:

- clean install и первый boot успешны;
- save/restart и process-death recovery успешны;
- upgrade path проверен или документирован как физически недоступный для текущего прогона;
- offline smoke успешен;
- финальные release/become сценарии работают;
- critical/blocker отсутствуют;
- SHA-256 и release metadata совпадают с build contract.
