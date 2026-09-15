# Актуальная передача смены

**Дата:** 15.09.2026

Это короткая актуальная карта проекта. Исторический `docs/HANDOFF.md` содержит старые записи 2.x и не должен использоваться как источник текущего release-статуса.

## Текущее состояние

- `v3.0.1-rc1` опубликован и **immutable**. Не перемещать, не переписывать, не заменять.
- Технические V11-гейты закрыты: balance и visual/audio coherence проходят CI.
- Node 24 migration для Actions завершена: checkout v5, setup-node v5, upload-artifact v6 там, где используется.
- Последний development APK на текущем main: workflow **APK #1093**, SUCCESS.
- Последний Sync play mirror: **#619**, SUCCESS.
- Последний development artifact digest: `sha256:261b66134a2ff97e2362e32afc75b646d9d2b605ad3c962dfb93221503384fc4`.
- Текущий development APK **не заменяет** immutable RC1.
- Физический weak-device soak именно текущего development APK ещё **PENDING**. Предыдущий физический smoke относится к другому, уже зафиксированному артефакту и не переносится автоматически.
- Production **не объявлен**.

## Следующий порядок работ

1. Физический soak текущего APK на слабом Android-устройстве.
2. Зафиксировать фактический APK SHA-256 и результаты physical QA.
3. Финально сверить Play listing / privacy с фактическим APK.
4. Ограниченный RC.
5. Отдельное production decision.
6. Только после положительного решения: production rollout и monitoring.

## Жёсткие ограничения

- Не двигать и не изменять `v3.0.1-rc1`.
- Не объявлять production-ready без физической проверки текущего кандидата.
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
- `docs/HANDOFF.md` — исторический handoff; даты 2.x внутри него устарели.

Если новый агент видит противоречие между старым handoff и этими документами, приоритет: `STATUS.md` → `PUBLISH.md` → `HANDOFF_CURRENT.md` → исторический `HANDOFF.md`.
