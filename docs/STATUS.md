# ИГРА — статус проекта

## Текущий инженерный APK

- Версия: `3.0.1`
- versionCode: `601`
- APK source commit: `909203f203fc1e695e4d481aeaf34c81b135aff0`
- APK workflow run: `35108604277`
- APK artifact: `igra-3.0.1` (`10451117735`)
- APK SHA-256: `b1785e9e69f806464e4d446507bfc2ab6e528de2298ee048072901274a0ef03f`
- Actions ZIP SHA-256: `aa1a719ea9a4e9f43e8b8c6ed2a2ad2a6b15afaf79ee0420e628acf344f942a0`
- APK automatic gate: SUCCESS
- Source provenance check: SUCCESS
- Android backup policy: `android:allowBackup="false"`

## Последний CI-контроль физического evidence

- Commit: `f15eb720f3c5b038f2650259577ec53d9e68e5b7`
- Life Arc Gate run: `35110305074` (#196) — SUCCESS
- APK run: `35110304889` (#1163) — SUCCESS
- Anti-spoof self-test физического Android evidence: SUCCESS
- RC2 evidence artifact upload: SUCCESS

CI подтверждает только корректность протокола и автоматических проверок. Он не считается физическим Android acceptance.

## Production gate

`productionReady = deterministicReady && physicalAndroid`

Текущий статус: **BLOCKED**.

Причина: физическое Android acceptance ещё не выполнено на реальном устройстве. `IGRA_PHYSICAL_ANDROID=1` не установлен и не должен устанавливаться искусственно.

## Что осталось

1. Выполнить полный физический acceptance на реальном Android-устройстве для APK `3.0.1 / 601`.
2. Сформировать evidence по всем обязательным сценариям с точной provenance APK.
3. Прогнать `tools/probe/physical-android-evidence.js` на фактическом evidence.
4. После PASS физического контура повторить RC2/release gate.
5. Синхронизировать финальные store/privacy материалы.
6. Принять production release decision и только затем переходить к публикации/rollout.
