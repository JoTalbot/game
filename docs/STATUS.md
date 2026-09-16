# ИГРА — статус проекта

## Текущий инженерный APK-кандидат

- Версия: `3.0.1`
- versionCode: `601`
- APK source commit: `7a79b730a7224a3cd58b3e70bac020108cdd5118`
- APK workflow run: `35131645470` — SUCCESS
- APK artifact: `igra-3.0.1` (`10461323111`)
- APK SHA-256: `b20cf38c0de302717c69141bbd44ac73333a3d6e493cbd4967a19eda37f37755`
- Actions ZIP SHA-256: `4f83fe690c110c082a013dcc7e4b3116c6a700a217daa376174aa064cc9e74d4`
- APK automatic gate: SUCCESS
- Source provenance check: SUCCESS
- Android backup policy: `android:allowBackup="false"`

## Последний CI-контроль

Для текущего commit `7a79b730a7224a3cd58b3e70bac020108cdd5118` успешно завершились:

- APK workflow `35131645470`
- Life Arc Gate `35131645507`
- Sync play mirror `35131645575`
- GitHub Pages build/deployment `35131644170`

Физический Android evidence в обычном `main`-build не подставляется: соответствующий gate выполняется только для release tag.

CI подтверждает корректность автоматических проверок и протокола. Он не считается физическим Android acceptance.

## Production gate

`productionReady = deterministicReady && physicalAndroid`

Текущий статус: **BLOCKED**.

Причина: физическое Android acceptance ещё не выполнено на реальном устройстве для текущего APK-кандидата. `IGRA_PHYSICAL_ANDROID=1` не должен устанавливаться искусственно.

## Что осталось

1. Выполнить полный физический acceptance на реальном Android-устройстве для APK `3.0.1 / 601` с SHA `b20cf38c0de302717c69141bbd44ac73333a3d6e493cbd4967a19eda37f37755`.
2. Сформировать структурированное evidence по всем обязательным сценариям с точной provenance APK.
3. Валидировать evidence через `tools/probe/validate-release-authorization.js`, привязав его к commit `7a79b730a7224a3cd58b3e70bac020108cdd5118` и указанному APK SHA-256.
4. После PASS физического контура повторить RC2/release gate.
5. Синхронизировать финальные store/privacy материалы.
6. Принять production release decision и только затем переходить к публикации/rollout.
