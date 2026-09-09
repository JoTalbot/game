# Публикация в Google Play — чек-лист

Всё, что можно подготовить **без Play Console**, уже в репозитории. Play Console
(создание приложения, загрузка, рейтинг, публикация) делает человек — у агента
нет туда доступа. Этот файл — точный порядок действий и ответы на подводные
камни именно этой игры.

## 0. Что уже готово

| Артефакт | Где | Состояние |
|---|---|---|
| Описание (RU/EN, короткое + полное) | `docs/STORE.md` | готово |
| Политика конфиденциальности | `docs/PRIVACY.md` | готово |
| Скриншоты 1080×1920 (8 шт) | `docs/screens/screen-1..8.png` | готово |
| Feature graphic 1024×500 | `docs/feature.png` | готово |
| OG-картинка 1200×630 | `docs/og.jpg` | готово |
| Трейлер (раскадровка 22с) | `docs/trailer/` | готово |
| Иконки всех плотностей + адаптивная | `android/.../res/` | готово |
| Сборка APK | CI по тегу `v*` | автоматически |
| Категория, возраст, ключевые слова | `docs/STORE.md` | готово |

Пакет приложения: **`world.igra.app`**.

## 1. Подпись

Финальный Play artifact **не может быть debug-подписанным**.

CI использует два режима:

- обычные push/PR: debug signing разрешён для быстрых проверок;
- `v*` release tag: debug signing запрещён, обязательны два GitHub Secrets:
  - `IGRA_KEYSTORE_B64` — base64 release/upload keystore;
  - `IGRA_KEYSTORE_PASSWORD` — пароль keystore.

CI декодирует keystore во временный `dist/release.keystore`, передаёт его в
`tools/build-apk.sh`, проверяет подпись и публикует SHA-256 рядом с APK.
Пароль и keystore никогда не коммитятся в репозиторий.

**Рекомендуемый путь — Play App Signing.**
1. Сгенерируй release/upload key: `bash tools/make-release-key.sh`.
2. Надёжно сохрани созданный keystore и пароль.
3. Загрузи base64 keystore в GitHub Secret `IGRA_KEYSTORE_B64`.
4. Загрузи пароль в GitHub Secret `IGRA_KEYSTORE_PASSWORD`.
5. В Play Console включи Play App Signing и используй этот ключ как upload key.

Перед первой боевой публикацией обязательно проверь, что ключ и пароль
восстанавливаются из безопасной копии. Потеря upload key может превратить
обновление приложения в очень дорогой способ познакомиться с поддержкой Google.

## 2. Порядок в Play Console

1. **Создать приложение** → название ИГРА / IGRA, язык по умолчанию ru.
2. **Загрузить release artifact** только после физического RC acceptance.
3. Основные сведения → взять из `docs/STORE.md`.
4. Загрузить иконку, feature graphic и скриншоты.
5. Заполнить IARC по фактическому содержимому.
6. Указать публичный URL политики из `docs/PRIVACY.md`.
7. Игра бесплатна, без рекламы и встроенных покупок, если текущая модель продукта сохраняется.
8. Выбрать страны распространения с учётом актуальных требований Google Play и законодательства.

## 3. Версия и актуальный RC artifact

Текущая Release Candidate: **3.0.1**, versionCode **601**.

Immutable RC release: **`v3.0.1-rc1`**.

Подтверждённый release artifact:
- APK: `igra-3.0.1.apk`
- versionCode: `601`
- target commit: `9e8fe1a13804f2f5d00feb3b4ffbed60af203d44`
- SHA-256: `sha256:160cec76dee27c903fab49506ea5c813b6430760c7021a03b85360f36c78f6bc`
- APK workflow #877: SUCCESS
- release signing: SUCCESS
- checksum verification: SUCCESS
- attached to GitHub Release: SUCCESS

Этот artifact собран по immutable RC tag и заменяет ранее зафиксированный
main-only CI artifact как актуальный RC release artifact.

Единая версия проверяется в:

- `tools/build-apk.sh`
- `android/app/build.gradle.kts`
- `web/js/math.js`
- `docs/PUBLISH.md`

## 4. Физический RC gate

Физический RC gate **закрыт** на реальном Android 15, устройство 427×948:

- Clean install / boot / gameplay: PASS
- Home → resume: PASS
- Save / restart / recovery: PASS
- Force-stop → recovery: PASS
- Old save upgrade: PASS
- Offline: PASS
- release / become / NG+: PASS
- vibration / audio / fullscreen: PASS
- Crash: 0
- ANR: 0
- Visual blocker: 0
- Touch blocker: 0
- Heavy frames: 0

## 5. После физического gate

Технический RC artifact уже выпущен.

Остаются ручные действия:

1. Переключить GitHub Release `v3.0.1-rc1` в **Pre-release**.
2. Проверить/синхронизировать Play listing и privacy materials с фактическим APK.
3. Провести ограниченное RC-тестирование.
4. После RC-тестирования отдельно принять решение о production Play release.
5. При production approval загрузить release artifact в Play Console.

Пакет приложения **не менять**: `world.igra.app`.

Не возвращать в игру рекламу, донат-экономику, энергию за деньги, streak или
daily reward.

---

Актуально для **v3.0.1 / versionCode 601**. Последнее обновление: 9 сентября 2026.
