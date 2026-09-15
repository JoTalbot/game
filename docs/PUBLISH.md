# Публикация в Google Play — чек-лист

Всё, что можно подготовить **без Play Console**, уже в репозитории. Play Console
(создание приложения, загрузка, рейтинг, публикация) делает человек — у агента
нет туда доступа. Этот файл — точный порядок действий и ответы на подводные
камни именно этой игры.

## 0. Что уже готово

| Артефакт | Где | Состояние |
|---|---|---|
| Описание (RU/EN, короткое + полное) | `docs/STORE.md` | готово |
| Политика конфиденциальности | `docs/PRIVACY.md` | готово, финальная сверка с APK ещё требуется |
| Скриншоты 1080×1920 (8 шт) | `docs/screens/screen-1..8.png` | готово |
| Feature graphic 1024×500 | `docs/feature.png` | готово |
| OG-картинка 1200×630 | `docs/og.jpg` | готово |
| Трейлер (раскадровка 22с) | `docs/trailer/` | готово |
| Иконки всех плотностей + адаптивная | `android/.../res/` | готово |
| Сборка APK | CI | автоматически |
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
1. Сгенерировать release/upload key: `bash tools/make-release-key.sh`.
2. Надёжно сохранить созданный keystore и пароль.
3. Загрузить base64 keystore в GitHub Secret `IGRA_KEYSTORE_B64`.
4. Загрузить пароль в GitHub Secret `IGRA_KEYSTORE_PASSWORD`.
5. В Play Console включить Play App Signing и использовать этот ключ как upload key.

Перед первой боевой публикацией обязательно проверить, что ключ и пароль
восстанавливаются из безопасной копии. Потеря upload key может превратить
обновление приложения в очень дорогой способ познакомиться с поддержкой Google.

## 2. Порядок в Play Console

1. **Создать приложение** → название ИГРА / IGRA, язык по умолчанию ru.
2. **Загрузить release artifact** только после физического acceptance актуального кандидата.
3. Основные сведения → взять из `docs/STORE.md`.
4. Загрузить иконку, feature graphic и скриншоты.
5. Заполнить IARC по фактическому содержимому.
6. Указать публичный URL политики из `docs/PRIVACY.md`.
7. Игра бесплатна, без рекламы и встроенных покупок, если текущая модель продукта сохраняется.
8. Выбрать страны распространения с учётом актуальных требований Google Play и законодательства.

## 3. Версия и актуальные артефакты

Текущая Release Candidate: **3.0.1**, versionCode **601**.

Immutable RC release: **`v3.0.1-rc1`**. Его нельзя перемещать или изменять.

### Immutable RC1 artifact

- APK: `igra-3.0.1.apk`
- versionCode: `601`
- target commit: `9e8fe1a13804f2f5d00feb3b4ffbed60af203d44`
- SHA-256: `160cec76dee27c903fab4956ea05c813b6430760c7021a03b85360f36c78f6bc`
- release signing: SUCCESS
- checksum verification: SUCCESS
- attached to GitHub Release: SUCCESS

### Current development APK after V11 final engineering gates

- version: `3.0.1`
- versionCode: `601`
- latest green APK workflow: **#1092**
- commit: `444b934ea5e32e594e56116fe676ee2cc983f65a`
- Actions artifact: `igra-3.0.1`
- artifact digest: `sha256:325b8fab4f9ad25030da4a2bd447928b73510732b7eed60261aa7cf274edefa3`
- automatic APK gate: SUCCESS
- Sync play mirror for the same commit: SUCCESS

Этот development artifact **не заменяет immutable RC1** и не должен быть
назван production release без физического weak-device acceptance.

Единая версия проверяется в:

- `tools/build-apk.sh`
- `android/app/build.gradle.kts`
- `web/js/math.js`
- `docs/PUBLISH.md`

## 4. Физический gate актуального кандидата

Старый физический RC1 smoke уже был успешно пройден на Android 15, 427×948.
Он относится к immutable RC1 и не заменяет повторный физический soak актуального
после-V11 development artifact.

Для актуального кандидата требуется повторить минимум:

- clean install / boot / gameplay;
- home → resume;
- save / restart / recovery;
- force-stop → recovery;
- old save upgrade;
- offline;
- release / become / NG+;
- vibration / audio / fullscreen;
- crash / ANR;
- heavy frames / visual blocker / touch blocker.

До появления этого evidence физический gate считается **PENDING**.

## 5. После физического gate

1. Провести ограниченное RC-тестирование актуального кандидата.
2. Финально сверить Play listing и privacy materials с фактическим APK.
3. Отдельно принять production decision.
4. Только после production approval загружать release artifact в Play Console.
5. После публикации включить production monitoring.

Пакет приложения **не менять**: `world.igra.app`.

Не возвращать в игру рекламу, донат-экономику, энергию за деньги, streak или
daily reward.

---

Актуально для **v3.0.1 / versionCode 601**. Последнее обновление: 15 сентября 2026.
