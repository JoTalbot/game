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
  - `IGRA_KEYSTORE_PASSWORD` — пароль keystore;
- ручной `workflow_dispatch` с `release_candidate=true`: CI собирает **release-signed candidate без публикации релиза**. Этот режим предназначен для физического Android acceptance того же бинарника, который впоследствии должен пройти production release gate.

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
- SHA-256: `160cec76dee27c903fab4950ea05c813b6430760c7021a03b85360f36c78f6bc`
- release signing: SUCCESS
- checksum verification: SUCCESS
- attached to GitHub Release: SUCCESS

Исторические RC1-данные выше приведены только как immutable provenance и не являются текущим production candidate.

### Current deterministic CI artifact (обновлено 2026-09-17)

- version: `3.0.1`
- versionCode: `601`
- source commit: `06032bd32aa01e9ecc3a6ea36cc36b9930783543` (`main` HEAD)
- CI на HEAD: APK #1203 run `35157731486` — SUCCESS; Life Arc Gate #236 run `35157731498` — SUCCESS; Sync play mirror #773 run `35157731495` — SUCCESS; Pages run `35157730577` — SUCCESS
- Actions artifact: `igra-3.0.1` (artifact ID `10471054268`)
- APK SHA-256: `01b9a92ff46f953431ddea73cfa8193ea54e90967fd2ab23f9b3f263e8d6382d`
- signing: debug (ordinary main-branch CI)
- Страница артефакта: https://github.com/JoTalbot/game/actions/runs/35157731486

Устаревший кандидат (не использовать): commit `1ddc7e90780679c802470943aae3b953d40fe817`, run `35141797041`, artifact `10465244020`, APK SHA-256 `7412b523baedac084d559359856fb4ea5ac9eb623dc2692b7b61f739e259e729`, ZIP SHA-256 `0b6b826476e801905f2cd25975a43660b3a5671d7d0b708d56f8ac12bac01deb`. `main` ушёл вперёд, артефакт был debug-signed. Между `1ddc7e9` и `06032bd` менялись только `docs/**`, `.github/workflows/life-arc.yml` и `tools/probe/*`; содержимое `web/` и `android/` идентично.

`7412b523...` и `01b9a92f...` — SHA debug-signed сборок и **не** те бинарники, которые следует использовать для финального release approval.

### Release-signed candidate для физического acceptance — СОЗДАН

Актуальный кандидат (перезакреплён 2026-09-17 14:15 UTC после исправления оффлайн-оболочки):

- source commit: `1f0a1b7ee1af88807ddc7b8c95d3e20a8868965e`
- run: `35232162470` (APK #1210, `workflow_dispatch` с `release_candidate=true`) — SUCCESS
- artifact: `igra-3.0.1` (ID `10502001833`), файл `igra-3.0.1.apk`
- **APK SHA-256: `1c18e1c1bdefc44636b5bff62296a6cf5847d185b28df0bcffa454c0254d9056`**
- подпись: release (`IGRA_SIGNING_MODE=release`, apksigner v2/v3 `true`), fingerprint сертификата `31:80:D0:AE:D6:E9:8D:7E:2B:06:CA:EE:FA:10:B8:7A:40:18:47:1F:41:92:34:4A:03:4E:95:AD:B7:44:D2:42`
- скачивание: https://github.com/JoTalbot/game/actions/runs/35232162470 → artifact `igra-3.0.1`
- GitHub Release не создавался (публикация tag-only), `v3.0.1-rc1` не изменён

Устаревший кандидат (не использовать): commit `0643a336657e571ee7aed786fbb362b0da3fed98`, run `35229481075`, APK SHA-256 `3898a9408d52a22fd1f8237bc1650bebf6aa3da936125991d9de4f096c816396` — собран из `main` с дефектным `web/sw.js`.

Порядок действий: скачать artifact именно из run `35232162470`, проверить SHA, выполнить 16 сценариев
физического acceptance (`docs/PHYSICAL_ANDROID_ACCEPTANCE_RECORD.md`), и только после полного PASS
формировать release approval secrets, привязанные к exact commit и exact APK SHA.

Ручной `release_candidate=true` **не публикует GitHub Release** и не создаёт production release.
Публикация по-прежнему возможна только через `v*` tag после прохождения всех release gates.

## 4. Физический gate актуального кандидата

Статус: **PENDING** (human blocker). Объект: release-signed APK `1c18e1c1bdefc44636b5bff62296a6cf5847d185b28df0bcffa454c0254d9056`, commit `1f0a1b7ee1af88807ddc7b8c95d3e20a8868965e`, run `35232162470`.
Старый физический RC1 smoke относится к immutable RC1 и не заменяет повторный
физический acceptance текущего кандидата `3.0.1 / 601`.

Для актуального кандидата требуется полный обязательный набор из 16 сценариев,
описанный в canonical evidence validator:

1. clean install;
2. boot / birth / gameplay;
3. home → resume;
4. save → restart → recovery;
5. force-stop → recovery;
6. old save → upgrade;
7. offline;
8. release / become / NG+;
9. vibration;
10. audio;
11. fullscreen;
12. crash;
13. ANR;
14. heavy-frame / performance blocker;
15. critical visual blocker;
16. critical touch blocker.

До появления валидного evidence на физическом Android-устройстве физический gate
считается **PENDING**, а production — заблокированным.

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

Актуально для **v3.0.1 / versionCode 601**. Последнее обновление: 17 сентября 2026 (актуальный release-signed кандидат `1c18e1c1bdefc446…`, run `35232162470`, см. `docs/READINESS.md`).
