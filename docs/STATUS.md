# ИГРА — статус проекта

## Текущий инженерный APK-кандидат

- Версия: `3.0.1`
- versionCode: `601`
- APK source commit: `1ddc7e90780679c802470943aae3b953d40fe817`
- APK workflow run: `35141797041` — SUCCESS
- APK artifact: `igra-3.0.1` (`10465244020`)
- APK SHA-256: `7412b523baedac084d559359856fb4ea5ac9eb623dc2692b7b61f739e259e729`
- Actions ZIP SHA-256: `0b6b826476e801905f2cd25975a43660b3a5671d7d0b708d56f8ac12bac01deb`
- APK automatic gate: SUCCESS
- Source provenance check: SUCCESS
- Android backup policy: `android:allowBackup="false"`

## Последний CI-контроль

Для текущего candidate commit `1ddc7e90780679c802470943aae3b953d40fe817` успешно завершилась APK-сборка `35141797041`.

Актуальные docs/play материалы синхронизированы и опубликованы через GitHub Pages после commit `538c22c8416cb1311ddebc188542d35cdb990663`:

- Sync play mirror `35142942491` — SUCCESS
- GitHub Pages build/deployment `35142940500` — SUCCESS

Физический Android evidence в обычном `main`-build не подставляется: соответствующий gate выполняется только для release tag.

CI подтверждает корректность автоматических проверок и протокола. Он не считается физическим Android acceptance.

## Production gate

`productionReady = deterministicReady && physicalAndroid`

Текущий статус: **BLOCKED**.

Причина: физическое Android acceptance ещё не выполнено на реальном устройстве для текущего APK-кандидата. `IGRA_PHYSICAL_ANDROID=1` не должен устанавливаться искусственно.

## Что осталось

1. Выполнить полный физический acceptance на реальном Android-устройстве для APK `3.0.1 / 601` с SHA `7412b523baedac084d559359856fb4ea5ac9eb623dc2692b7b61f739e259e729` и source commit `1ddc7e90780679c802470943aae3b953d40fe817`.
2. Сформировать структурированное evidence по всем обязательным сценариям с точной provenance APK.
3. Валидировать evidence через `tools/probe/validate-release-authorization.js`, привязав его к commit `1ddc7e90780679c802470943aae3b953d40fe817` и указанному APK SHA-256.
4. После PASS физического контура повторить RC2/release gate.
5. Синхронизировать финальные store/privacy материалы.
6. Принять production release decision и только затем переходить к публикации/rollout.
