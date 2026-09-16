# Physical Android Acceptance — v3.0.1 / versionCode 601

Документ предназначен только для **реального физического устройства**. CI, emulator и browser automation не являются подтверждением physical Android gate.

## 1. Тестируемый artifact

- Версия: `3.0.1`
- versionCode: `601`
- Commit: `909203f203fc1e695e4d481aeaf34c81b135aff0`
- APK workflow run: `35108604277`
- APK artifact: `igra-3.0.1` (artifact ID `10451117735`)
- APK SHA-256: `b1785e9e69f806464e4d446507bfc2ab6e528de2298ee048072901274a0ef03f`
- GitHub Actions artifact ZIP SHA-256: `aa1a719ea9a4e9f43e8b8c6ed2a2ad2a6b15afaf79ee0420e628acf344f942a0`

Важно: `aa1a719e...` является digest ZIP-архива GitHub Actions artifact, а не SHA самого APK. SHA самого APK подтверждён файлом `igra-3.0.1.apk.sha256` внутри скачанного artifact.

Этот кандидат включает production-hardening изменение `android:allowBackup="false"`. Физическая проверка должна выполняться именно для указанного binary SHA.

## 2. Подготовка физического устройства

Перед тестом зафиксировать:

- Manufacturer / model:
- Android version:
- Screen resolution:
- Density:
- RAM:
- Device profile: `weak-device` / other:
- Date/time (UTC):

Устройство должно быть физическим Android-девайсом. Эмулятор не засчитывается.

### 2.1 Проверка APK до установки

После скачивания artifact распаковать APK и проверить **именно APK**, а не ZIP-контейнер:

```bash
sha256sum igra-3.0.1.apk
```

Ожидаемое значение:

```text
b1785e9e69f806464e4d446507bfc2ab6e528de2298ee048072901274a0ef03f  igra-3.0.1.apk
```

Дополнительно:

```bash
adb devices
adb shell getprop ro.product.manufacturer
adb shell getprop ro.product.model
adb shell getprop ro.build.version.release
adb shell wm size
adb shell wm density
```

Если SHA APK не совпадает, установка прекращается: это другой binary provenance.

### 2.2 Установка

Для clean install удалить предыдущую установку приложения и установить проверенный APK:

```bash
adb uninstall world.igra.app || true
adb install -r igra-3.0.1.apk
```

Для сценария upgrade сначала установить предыдущую разрешённую версию, создать сохранение, затем поверх неё установить текущий APK. Результат отдельно отметить как `PASS`, `FAIL` или `N/A` с причиной.

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

## 4. Порядок физического прогона

### A. Clean install / boot

1. Установить APK с подтверждённым SHA.
2. Запустить приложение с чистым состоянием.
3. Проверить стартовый экран, birth flow и вход в gameplay.
4. Зафиксировать screenshot/video и время UTC.

### B. Gameplay / touch / presentation

1. Выполнить основные действия игрока.
2. Проверить touch targets и отсутствие критических touch blockers.
3. Проверить fullscreen и отсутствие критического визуального дефекта.
4. Проверить vibration.
5. Проверить audio.

### C. Persistence / recovery

1. Создать состояние игры и выполнить Save.
2. Полностью перезапустить приложение.
3. Проверить recovery сохранённого состояния.
4. Выполнить force-stop:

```bash
adb shell am force-stop world.igra.app
```

5. Запустить приложение снова и проверить recovery.
6. Зафиксировать результат и evidence.

### D. Offline

1. До запуска отключить сетевое соединение на устройстве.
2. Запустить и пройти доступный gameplay flow.
3. Проверить отсутствие обязательной зависимости от сети.
4. Включить сеть обратно после теста.

### E. Release / Become / NG+

Проверить доступные переходы соответствующего текущего игрового состояния. Любой невозможный из-за отсутствия необходимого предыдущего прогресса пункт фиксировать с конкретной причиной, а не превращать человеческое «не проверял» в магический `PASS`.

### F. Performance / stability

Во время полного прогона отслеживать:

- crash;
- ANR;
- зависания;
- критические frame/performance spikes;
- потерю сохранения;
- критические визуальные или touch blockers.

При crash/ANR/save failure/critical visual blocker/critical touch blocker acceptance блокируется.

## 5. Evidence protocol

Для каждого обязательного результата сохранить минимум:

- точный APK SHA-256;
- модель физического устройства;
- Android version;
- дату/время UTC;
- результат `PASS`/`FAIL`/`N/A`;
- краткое описание сценария;
- screenshot/video или logcat там, где это materially подтверждает результат.

Для проблем сохранить диагностический logcat, например:

```bash
adb logcat -d -t 2000 > igra-physical-logcat.txt
```

Evidence должно однозначно связывать результат с APK SHA `b1785e9e...`. Evidence от старого RC или другого APK не переносится.

## 6. Acceptance rules

1. Каждый результат относится именно к указанному APK SHA-256.
2. Старое evidence для RC1 или другого APK не переносится на этот кандидат.
3. `PENDING`, `N/A` или неполное прохождение не являются physical acceptance.
4. `N/A` допускается только с конкретно указанной причиной, почему сценарий объективно неприменим.
5. При crash, ANR, critical visual/touch blocker или save failure acceptance не считается пройденным.
6. После завершения приложить доступное фактическое evidence: видео/скриншоты, логи, описание воспроизведения и время теста.
7. Только после фактического прохождения всех обязательных пунктов можно фиксировать `physicalAndroid=true` в release evidence.
8. Нельзя выставлять `IGRA_PHYSICAL_ANDROID=1` только для получения зелёного CI: переменная должна отражать уже полученное фактическое physical evidence.

## 7. Final result

- Physical Android acceptance: `PENDING`
- Physical evidence attached: `NO`
- `IGRA_PHYSICAL_ANDROID=1`: `NOT SET`
- Production gate: `BLOCKED`

Этот файл не является доказательством прохождения. Он является воспроизводимым журналом и протоколом для его фиксации.
