# ИГРА — статус проекта

## Текущий инженерный APK

- Версия: `3.0.1`
- versionCode: `601`
- APK source commit: `58cb7c61a9f5fc7d29e5d5677cb605944e4ba7b9`
- APK workflow run: `35111841387`
- APK artifact: `igra-3.0.1` (`10452602977`)
- APK SHA-256: `c977a111b14495be7071742e416b09050a9bc341e48a1ab3f153420426ab743c`
- Actions ZIP SHA-256: `6c207c0226ff128b33dd7746f4958959d0e5a2dfb4d82fcaf76a46b0ace1d3b6`
- APK automatic gate: SUCCESS
- Source provenance check: SUCCESS
- Android backup policy: `android:allowBackup="false"`

## Последний CI-контроль физического evidence

- Collector hardening commit: `58cb7c61a9f5fc7d29e5d5677cb605944e4ba7b9`
- Collector self-test integration commit: `92467251b7999fe4b5fb4401e862ed2ca812b630`
- Life Arc Gate run: `35112753187` — SUCCESS
- APK run: `35112751880` — SUCCESS
- Anti-spoof self-test физического Android evidence: SUCCESS
- Physical Android collector self-test: SUCCESS
- RC2 evidence artifact upload: SUCCESS

CI подтверждает только корректность протокола и автоматических проверок. Он не считается физическим Android acceptance.

## Production gate

`productionReady = deterministicReady && physicalAndroid`

Текущий статус: **BLOCKED**.

Причина: физическое Android acceptance ещё не выполнено на реальном устройстве. `IGRA_PHYSICAL_ANDROID=1` не установлен и не должен устанавливаться искусственно.

## Что осталось

1. Выполнить полный физический acceptance на реальном Android-устройстве для APK `3.0.1 / 601` с SHA `c977a111b14495be7071742e416b09050a9bc341e48a1ab3f153420426ab743c`.
2. Сформировать evidence по всем обязательным сценариям с точной provenance APK.
3. Прогнать `tools/probe/physical-android-evidence.js` на фактическом evidence.
4. После PASS физического контура повторить RC2/release gate.
5. Синхронизировать финальные store/privacy материалы.
6. Принять production release decision и только затем переходить к публикации/rollout.
