# ИГРА — статус проекта

## Текущий инженерный APK

- Версия: `3.0.1`
- versionCode: `601`
- APK source commit: `c24a79b3de8248620b4c2b6c0c8d48c78f00aff0`
- APK workflow run: `35114704164`
- APK artifact: `igra-3.0.1` (`10455805062`)
- APK SHA-256: `629ba40569803742f728a67cda6646a3091bcf82855ed2afe88e750131e0b453`
- Actions ZIP SHA-256: `3a5fe478b581898995bdc693004cf403a5e7debb98c85fabeddf780907cdcbaf`
- APK automatic gate: SUCCESS
- Source provenance check: SUCCESS
- Android backup policy: `android:allowBackup="false"`

## Последний CI-контроль физического evidence

- Provenance redesign commit: `c24a79b3de8248620b4c2b6c0c8d48c78f00aff0`
- APK workflow run: `35114704164` — SUCCESS
- Anti-spoof self-test физического Android evidence: SUCCESS
- Physical Android collector self-test: SUCCESS

CI подтверждает только корректность протокола и автоматических проверок. Он не считается физическим Android acceptance.

## Production gate

`productionReady = deterministicReady && physicalAndroid`

Текущий статус: **BLOCKED**.

Причина: физическое Android acceptance ещё не выполнено на реальном устройстве. `IGRA_PHYSICAL_ANDROID=1` не установлен и не должен устанавливаться искусственно.

## Что осталось

1. Выполнить полный физический acceptance на реальном Android-устройстве для APK `3.0.1 / 601` с SHA `629ba40569803742f728a67cda6646a3091bcf82855ed2afe88e750131e0b453`.
2. Сформировать evidence по всем обязательным сценариям с точной provenance APK.
3. Передать в validator `IGRA_EXPECTED_APK_COMMIT=c24a79b3de8248620b4c2b6c0c8d48c78f00aff0` и `IGRA_EXPECTED_APK_SHA256=629ba40569803742f728a67cda6646a3091bcf82855ed2afe88e750131e0b453` и прогнать `tools/probe/physical-android-evidence.js` на фактическом evidence.
4. После PASS физического контура повторить RC2/release gate.
5. Синхронизировать финальные store/privacy материалы.
6. Принять production release decision и только затем переходить к публикации/rollout.
