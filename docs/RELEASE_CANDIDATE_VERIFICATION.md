# Независимая проверка release-кандидата 3.0.1 (run `35232162470`)

> Дата проверки: **2026-09-18** (UTC), смена агента.
> Проверяющий контур: чистая копия `main`, JDK 17 (Temurin 17.0.20.1) + Android build-tools 34.0.0 (aapt2/apksigner/d8) в песочнице агента.
> Предмет: APK `igra-3.0.1.apk` из artifact `10502001833` (workflow run `35232162470`, APK #1210, `workflow_dispatch`, `release_candidate=true`).
> Этот документ — **не** физический acceptance и не release authorization. Он фиксирует, что бинарник кандидата действительно тот, за который себя выдаёт.

## 1. Что проверено фактом

| Проверка | Метод | Результат |
|---|---|---|
| SHA-256 артефакта | скачивание artifact `10502001833` из GitHub API, `sha256sum` | `1c18e1c1bdefc44636b5bff62296a6cf5847d185b28df0bcffa454c0254d9056` — совпадает с `igra-3.0.1.apk.sha256` внутри артефакта |
| Подпись | `apksigner verify --verbose --print-certs` (build-tools 34.0.0) | v2 `true`, v3 `true`, v1 `false`, **1 signer** |
| Сертификат | `--print-certs` | `CN=IGRA, O=JoTalbot, C=UA`, SHA-256 `3180d0aed6e98d7e2b06caeefa10b87a4018471f4192344a034e95adb744d242` (= `31:80:D0:AE:…:D2:42`) |
| Тот же keystore, что у `v3.0.1-rc1` | `apksigner verify --print-certs` релиза rc1 (скачан с GitHub Releases) | сертификат **идентичен**; SHA-256 rc1-APK `160cec76dee27c903fab49506ea5c813b6430760c7021a03b85360f36c78f6bc` подтверждён скачиванием |
| Идентичность подписи release (негативный контроль) | локальная сборка того же commit с debug-ключом | сертификат другой: `8f00f37512a09d67a7b41758dc1d063b7abf3e49f7eddad320124c80c356e04d` → кандидат действительно release-signed |
| Манифест | `aapt2 dump badging` / `dump xmltree` | `world.igra.app`, versionCode `601`, versionName `3.0.1`, minSdk `26`, targetSdk `34` |
| Разрешения | то же | только `VIBRATE`, `WAKE_LOCK`, `INTERNET` |
| Приватность в манифесте | то же | `allowBackup=false`, `usesCleartextTraffic=false`, единственный exported-компонент — launcher-activity `.MainActivity` (обязательно для запуска) |
| Конфигурационные изменения | то же | `screenOrientation=13` (user_portrait), `configChanges=0xda0` (orientation + screenSize + smallestScreenSize + screenLayout + keyboardHidden) |
| Payload внутри APK | распаковка, `diff -r` против `web/` в git | `assets/www` **байт-идентичен** рабочему дереву (`93` файла, 0 расхождений); `sw.js` содержит `igra-shell-v31` |
| Воспроизводимость сборки | `ANDROID_SDK_ROOT=… tools/build-apk.sh` из `main` (debug-подпись) | `classes.dex`, `resources.arsc`, `AndroidManifest.xml`, `res/` — **hash-идентичны** кандидату; список файлов внутри APK идентичен; совпадает и размер (3 060 325 байт) |
| Что отличается | — | только блок подписи `META-INF` (release vs debug) и, соответственно, SHA-256 целого APK |

Итог: кандидат собран **из текущего игрового payload `main`** (`eca3018…`; `web/` и `android/` не менялись с `1f0a1b7`), подписан стабильным release-ключом, а сборка воспроизводима локально из исходников.

## 2. Дополнительно найденное (не блокер, для store/privacy-сверки)

- В манифесте остаётся `android.permission.INTERNET`, хотя обычная игра работает оффлайн. Это не противоречит `docs/PRIVACY.md` (данные не отправляются), но требует корректной декларации в Google Play Data safety и объяснения при ревью. Удаление разрешения изменит payload → потребует **нового** кандидата и повторного физического acceptance, поэтому сейчас не делается (RC заморожен).
- Приложение ориентировано портретно и обрабатывает конфигурационные изменения без пересоздания activity (`configChanges=0xda0`). Это снижает риск потери сейва при повороте, но подтверждается только физически (`docs/PHYSICAL_ANDROID_ACCEPTANCE.md`, сценарии «Home → resume», «Save → restart → recovery»).

## 3. Связь с гейтами готовности

- Гейт 8 (Android), пункт 3 «release-signed кандидат» — уже закрыт 2026-09-17; настоящая проверка **укрепляет** evidence (независимая подпись + воспроизводимость + отсутствие debug-подписи).
- Гейт 13 (Release), пункт 5 — остаётся открытым: финальная сверка витрины/приватности выполняется против **production**-артефакта, которого ещё нет (решение человека после физического acceptance).
- Процент готовности от этой проверки **не двигается** (числители гейтов не меняются): она снижает release-риск и убирает возможность «нести в production не тот бинарник».

## 4. Как воспроизвести

```bash
# 1. скачать кандидата (artifact)
curl -sSL -H "Authorization: Bearer $GH_TOKEN" \
  -o cand.zip https://api.github.com/repos/JoTalbot/game/actions/artifacts/10502001833/zip
unzip -o cand.zip -d cand && sha256sum cand/igra-3.0.1.apk
#   ожидается 1c18e1c1bdefc44636b5bff62296a6cf5847d185b28df0bcffa454c0254d9056

# 2. подпись и манифест
$ANDROID_SDK_ROOT/build-tools/34.0.0/apksigner verify --verbose --print-certs cand/igra-3.0.1.apk
$ANDROID_SDK_ROOT/build-tools/34.0.0/aapt2 dump badging cand/igra-3.0.1.apk

# 3. payload и воспроизводимость
unzip -q cand/igra-3.0.1.apk -d xcand && diff -r xcand/assets/www web
ANDROID_SDK_ROOT=$ANDROID_SDK_ROOT tools/build-apk.sh   # debug-подпись, dist/igra-3.0.1.apk
```
