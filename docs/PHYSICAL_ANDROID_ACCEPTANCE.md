# Physical Android Acceptance — v3.0.1 / versionCode 601

Документ предназначен только для **реального физического устройства**. CI, emulator и browser automation не являются подтверждением physical Android gate.

## 1. Тестируемый artifact

- Версия: `3.0.1`
- versionCode: `601`
- Commit: `65d2de15d57a41d2ea401bf6a945230e57364733`
- APK artifact: `igra-3.0.1`
- APK SHA-256: `37b0172020ed30efe91ee3355f059ad8788b27d002340a5c8ed163aed5e02f92`
- GitHub Actions artifact ZIP SHA-256: `b3e27df157ca7cbc15c836e9d39d2c2d7ec40d216843158fbbb0eb11604cd8f`

Важно: `b3e27df...` является digest ZIP-архива GitHub Actions artifact, а не SHA самого APK. SHA самого APK подтверждён файлом `igra-3.0.1.apk.sha256` внутри скачанного artifact.

## 2. Устройство

- Manufacturer / model:
- Android version:
- Screen resolution:
- Density:
- RAM:
- Device profile: `weak-device` / other:
- Date/time (UTC):

## 3. Acceptance matrix

| Проверка | Результат | Evidence / заметка |
|---|---|---|
| Clean install | PENDING | |
| Boot / birth / gameplay | PENDING | |
| Home → resume | PENDING | |
| Save → restart → recovery | PENDING | |
| Force-stop → recovery | PENDING | |
| Old save → upgrade | PENDING / N/A | |
| Offline | PENDING | |
| Release / Become / NG+ | PENDING | |
| Vibration | PENDING | |
| Audio | PENDING | |
| Fullscreen | PENDING | |
| Crash | PENDING | |
| ANR | PENDING | |
| Heavy-frame / performance blocker | PENDING | |
| Critical visual blocker | PENDING | |
| Critical touch blocker | PENDING | |

## 4. Rules

1. Каждый результат относится именно к указанному APK SHA-256.
2. Старое evidence для RC1 или другого APK не переносится на этот кандидат.
3. `PENDING`, `N/A` или неполное прохождение не являются physical acceptance.
4. При crash, ANR, critical visual/touch blocker или save failure acceptance не считается пройденным.
5. После завершения приложить доступное фактическое evidence: видео/скриншоты, логи, описание воспроизведения и время теста.
6. Только после фактического прохождения всех обязательных пунктов можно фиксировать `physicalAndroid=true` в release evidence.

## 5. Final result

- Physical Android acceptance: `PENDING`
- Physical evidence attached: `NO`
- `IGRA_PHYSICAL_ANDROID=1`: `NOT SET`
- Production gate: `BLOCKED`

Этот файл не является доказательством прохождения. Он является воспроизводимым журналом для его фиксации.
