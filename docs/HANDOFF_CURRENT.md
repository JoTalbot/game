# Актуальная передача смены

**Дата:** 16.09.2026

Это короткая актуальная карта проекта. Исторический `docs/HANDOFF.md` содержит старые записи 2.x и не должен использоваться как источник текущего release-статуса.

## Текущее состояние

- `v3.0.1-rc1` опубликован и **immutable**. Не двигать, не переписывать, не заменять.
- Текущий инженерный APK-кандидат: версия `3.0.1`, versionCode `601`.
- APK source commit: `1ddc7e90780679c802470943aae3b953d40fe817`.
- APK workflow run: `35141797041` — SUCCESS.
- APK artifact: `igra-3.0.1` (`10465244020`).
- APK SHA-256: `7412b523baedac084d559359856fb4ea5ac9eb623dc2692b7b61f739e259e729`.
- Actions ZIP SHA-256: `0b6b826476e801905f2cd25975a43660b3a5671d7d0b708d56f8ac12bac01deb`.
- APK automatic gate и source provenance check проходят.
- `docs/play` синхронизирован и опубликован; последний подтверждённый Pages/Sync контур: runs `35142942491` и `35142940500`.
- RC2 evidence теперь записывается как строгий JSON: `tools/probe/rc2-evidence.js` пишет JSON в stdout, диагностический marker — только в stderr; workflow использует `> rc2-evidence.json`.
- `tools/probe/v23-v25-evidence.js` явно маркирует свой результат как **synthetic fixture** и не выдаёт его за физическую production acceptance.
- Release authorization требует структурированное physical Android evidence, привязанное к точным commit/APK SHA и runtime physical flag.
- Для ручного `release_candidate=true` workflow включает release signing; debug signing для такого кандидата не допускается.
- Публикация GitHub Release остаётся tag-only.
- Физический Android acceptance текущего кандидата ещё **PENDING**.
- Production **BLOCKED**.

## Что осталось

1. Запустить workflow `APK` вручную с `release_candidate=true`, чтобы получить exact release-signed candidate.
2. На реальном Android-устройстве выполнить все обязательные physical acceptance сценарии для exact candidate и зафиксировать APK SHA-256.
3. Сформировать структурированное evidence с точной provenance: commit, APK SHA, версия `3.0.1`, versionCode `601`, device metadata, UTC timestamps, результаты 16 обязательных сценариев.
4. Валидировать evidence через `tools/probe/validate-release-authorization.js`.
5. Привязать release authorization secrets к фактическим commit/APK SHA после успешного physical acceptance.
6. Повторно пройти release/RC2 gates на exact release candidate.
7. Финально сверить store/privacy материалы с фактическим APK.
8. Принять отдельное production release decision и только после него публиковать release/rollout.

## Жёсткие ограничения

- Не двигать и не изменять `v3.0.1-rc1`.
- Не объявлять production-ready без физической проверки текущего кандидата.
- `IGRA_PHYSICAL_ANDROID=1` сам по себе не является доказательством физического устройства; это runtime-контракт валидатора.
- Не публиковать Google Play автоматически.
- Для `v*` release tags запрещена debug signing.
- Не добавлять новые продуктовые механики до завершения текущего RC operational cycle без отдельного решения.
- Issue #4 остаётся UX/playtest backlog, но не является текущим release blocker.

## Канонические документы

- `docs/STATUS.md` — текущий технический статус и история гейтов.
- `docs/PUBLISH.md` — актуальный publish/release checklist.
- `docs/RC1_SMOKE.md` — физический release smoke checklist.
- `docs/STORE.md` — фактическая модель магазина.
- `docs/PRIVACY.md` — фактическая privacy-модель.
- `docs/HANDOFF_CURRENT.md` — эта актуальная карта.
- `docs/HANDOFF.md` — исторический handoff; даты 2.x внутри него устарели.

Если новый агент видит противоречие между старым handoff и этими документами, приоритет: `STATUS.md` → `PUBLISH.md` → `HANDOFF_CURRENT.md` → исторический `HANDOFF.md`.
