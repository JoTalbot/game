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
восстанавливаются из безопасной копии.

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

Текущая Release Candidate: **3.0.0-rc1**, versionCode **600**.

Последний подтверждённый CI artifact:
- artifact: `igra-3.0.0-rc1`
- artifact ID: `9896617808`
- commit: `138622758b6d52ef8419f4dabe8024d047bd5aef`
- APK SHA-256: `1a28660cd7e4a153b8f84303c13474729fa90feea18ed9318fd78db3ffd29d9b`
- artifact ZIP SHA-256: `3fcece6d6f01332208d1d9e93c18523b640239ec19dddb4c7452e21b7ddf3003`
- APK workflow: SUCCESS
- mirror sync: SUCCESS

Единая версия проверяется в:

- `tools/build-apk.sh`
- `android/app/build.gradle.kts`
- `web/js/math.js`
- `docs/PUBLISH.md`

## 4. Проверки перед release tag

До создания production tag должны быть подтверждены:

1. `life.yml` — green.
2. `apk.yml` — green.
3. RC probes — green.
4. Clean install → boot → birth → play → save → restart.
5. Upgrade со старого сейва → новая версия → продолжение.
6. Process death → сейв не теряется.
7. Offline → shell и core loop запускаются без сети.
8. Текущий APK artifact существует и имеет SHA-256.
9. Нет critical/blocker.
10. APK на release tag подписан release/upload key, а не debug key.

Пункты 4–7 требуют **реального Android-устройства** и не считаются выполненными
только потому, что Node/CI probes зелёные.

## 5. После физического gate

Только после подтверждения пунктов 1–10:

1. создаётся signed production tag;
2. CI собирает release artifact;
3. SHA-256 сверяется с artifact;
4. release загружается в Play Console;
5. сначала Internal testing;
6. затем controlled rollout.

Пакет приложения **не менять**: `world.igra.app`.

Не возвращать в игру рекламу, донат-экономику, энергию за деньги, streak или
daily reward.

---

Актуально для **v3.0.0-rc1 / versionCode 600**. Последнее обновление: 3 сентября 2026.
