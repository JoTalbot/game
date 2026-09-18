# ИГРА — готовность по 15 гейтам

> Единая точка отсчёта процента готовности. Формула и веса — из задания смены и `docs/ROADMAP_TO_READY.md` (раздел 0).
> Правило честности: в числитель идут только задачи, закрытые фактом — PASS probe, зелёный CI run, опубликованный артефакт с SHA-256, закрытая задача бэклога. Синтетический evidence в числитель не идёт. Округление вниз.

## Параметры расчёта

- **Дата расчёта:** 2026-09-18T05:20Z (UTC), пересчёт №4
- **Commit расчёта:** `eca3018362156410172156d1bf8350668b6967c7` (игровой payload `main`; `web/` и `android/` не менялись с `1f0a1b7ee1af88807ddc7b8c95d3e20a8868965e` — подтверждено `git diff --name-only` и байтовым сравнением payload с APK кандидата)
- **Payload расчёта:** sha256 `e1d3a8a03afef2bfb3a08bad60cd825a5e72d80fc996d29309b9e81936aaaab8` (93 файла `web/`), совпадает с `assets/www` внутри APK кандидата
- **CI на `eca3018`:** Sync play mirror #783 SUCCESS, Pages #1345 SUCCESS. APK и Life Arc Gate на этом commit не запускались — commit docs-only, `paths-ignore: docs/**` (это контракт workflow, не пропуск проверки).
- **Последний полный CI-набор (commit `287e047`):** APK #1212 SUCCESS, Life Arc Gate #243 SUCCESS, Sync play mirror #781 SUCCESS, Pages #1343 SUCCESS.
- **Локальный прогон смены 2026-09-18 (Node 20, песочница агента):** `tools/probe/run.js` → 363/363 PASS; полный набор Life Arc Gate (54 probes + life-workflow + release-workflow-contract + rc-hardening + 3 evidence-теста) → 60/60 PASS; `node --check` по 78 файлам `web/js` → 0 ошибок; `tools/check-sync.sh` → PASS; `tools/check-android-security.sh` → PASS; `tools/probe/rc2-evidence.js` → `deterministicReady:true`, `missing:[]`, все `blockers` false.
- **Глубокий браузерный прогон (не физический):** `tools/browser-deep-run.js` → **32/32 PASS** на payload `e1d3a8a0…` (commit `eca3018`); evidence `docs/evidence/browser-deep-run-2026-09-18.json` + скриншоты `docs/evidence/deep-run-*.png`. Покрывает: первые секунды без туториала, SW-кэш `igra-shell-v31` (90 записей) и оффлайн-перезагрузку с возвратом в мир, touch-жесты, поворот портрет↔ландшафт, background→foreground, сейв→перезапуск→«вернуться», ru/en-раскладку (0 overflow), словарь `IGRA.UI_STR` 55/55 в обоих языках, reduced-motion, CPU-throttle ×6 (60.3 → 14.4 fps, рендер продолжается), 4-мин soak (heap +630 KB, 0 новых JS-обработчиков, 0 pageerror).
- **Независимая проверка бинарника кандидата (2026-09-18):** `docs/RELEASE_CANDIDATE_VERIFICATION.md` — SHA-256 скачан и совпал, apksigner v2/v3 `true` + сертификат `31:80:D0:AE:…:D2:42`, манифест `world.igra.app` vc`601`/vn`3.0.1`/minSdk`26`/targetSdk`34`, `allowBackup=false`, `usesCleartextTraffic=false`, локальная пересборка из `main` даёт **идентичные** `classes.dex`/`resources.arsc`/манифест/`res/`/`assets/www` (отличается только блок подписи).
- **Immutable RC:** `v3.0.1-rc1` → commit `9e8fe1a13804f2f5d00feb3b4ffbed60af203d44`, APK `igra-3.0.1.apk`, SHA-256 `160cec76dee27c903fab49506ea5c813b6430760c7021a03b85360f36c78f6bc` (перепроверено скачиванием 2026-09-18).
- **Release-signed кандидат `main`:** run `35232162470` (APK #1210, `workflow_dispatch`, `release_candidate=true`) SUCCESS, artifact `10502001833`, `igra-3.0.1.apk`, **APK SHA-256 `1c18e1c1bdefc44636b5bff62296a6cf5847d185b28df0bcffa454c0254d9056`**, source commit `1f0a1b7`, подпись release. Скачивание: https://github.com/JoTalbot/game/actions/runs/35232162470

## Таблица гейтов

| # | Гейт | Вес | Закрыто/всего | % гейта | Вклад | Статус |
|---|---|---|---|---|---|---|
| 1 | Продукт: ≥3 содержательных акта, общая арка | 10 | 3/3 | 100 | 10.00 | GREEN |
| 2 | Реиграбельность: ≥3 траектории + последствия финалов | 8 | 3/3 | 100 | 8.00 | GREEN |
| 3 | Мир: причинная система (места/существа/органы/законы/Director) | 9 | 7/8 | 87 | 7.87 | YELLOW |
| 4 | Продолжение: финал меняет следующее прохождение | 7 | 3/3 | 100 | 7.00 | GREEN |
| 5 | Контент: скелет не виден за 1–2 сессии | 8 | 3/3 | 100 | 8.00 | GREEN |
| 6 | UX: игра объясняет себя миром/звуком/жестами | 8 | 4/4 | 100 | 8.00 | GREEN |
| 7 | Persistence: сейв переживает перезапуск/обновление/историю | 8 | 3/4 | 75 | 6.00 | YELLOW |
| 8 | Android: APK, WebView, touch, lifecycle, слабые устройства | 8 | 3/5 | 60 | 4.80 | **BLOCKED** |
| 9 | Offline: полный цикл без сети | 3 | 3/3 | 100 | 3.00 | GREEN |
| 10 | Performance: устойчивый FPS, нет роста памяти | 7 | 4/5 | 80 | 5.60 | YELLOW |
| 11 | Accessibility: читаемость, haptic/audio fallback | 5 | 4/4 | 100 | 5.00 | GREEN |
| 12 | Localization: ru/en полностью, layout не ломается | 4 | 3/3 | 100 | 4.00 | GREEN |
| 13 | Release: versioning, stable signing, privacy/store, материалы | 5 | 4/5 | 80 | 4.00 | YELLOW |
| 14 | QA: probes + длинные ручные прогоны + чистая установка/обновление | 6 | 4/6 | 66 | 3.96 | YELLOW |
| 15 | Monetization: базовая версия не зависит | 4 | 3/3 | 100 | 4.00 | GREEN |
| | **Сумма весов** | **100** | | | **94.23** | |

**Готовность проекта (до cap):** 10.00+8.00+7.87+7.00+8.00+8.00+6.00+4.80+3.00+5.60+5.00+4.00+4.00+3.96+4.00 = 94.23 → округление вниз = **94%**
**Cap:** физический Android acceptance текущего кандидата (`RC-PHYS-002`, APK `1c18e1c1…`) не пройден → **не выше 90%**
**ИТОГО: [ГОТОВНОСТЬ] 90%**

Неизвестных знаменателей нет: все 15 гейтов считаются, нормализация весов не требуется.

## Расшифровка задач по гейтам (числители и знаменатели)

### Гейт 1 — Продукт (10) — 3/3
1. V4-003 второй акт — реализовано, `tools/probe/v4-second-act.js` PASS (CI APK #1203).
2. V7-001..V7-007 третий акт/кульминация — реализовано, `tools/probe/v7-climax.js` PASS.
3. V15 финальная причинность — реализовано, `tools/probe/v15-finale.js` PASS.

### Гейт 2 — Реиграбельность (8) — 3/3
1. V4-008 контрастные маршруты — реализовано, `v4-depth.js` PASS.
2. V8-001..V8-008 lineage/replay — реализовано, `v8-lineage.js` PASS (включая migration и inherited world states).
3. V12 lineage 2.0 — реализовано, `v12-lineage.js` PASS.
Дополнительно: `release-candidate.js` требует три канонически разные траектории — PASS.

### Гейт 3 — Мир (9) — 7/8
1. V4-005/V4-006 существа и места — реализовано.
2. V5-001..V5-008 живой мир — реализовано, `v5-world.js` PASS.
3. V9-001..V9-005 world depth — ЗАКРЫТ (Gate V9 PASS, `v9-world.js`).
4. V14 Director 2.0 — реализовано, `v14-director2.js` PASS.
5. V19 deep simulation — реализовано, `v19-deep-simulation.js` PASS.
6. Органы/метаморфоза/законы — `organ-conflicts.js`, `metamorphosis.js`, `v3-015-laws.js` PASS.
7. V6 тело/идентичность (вклад в причинность мира) — `v6-body.js`, `v6-body-visual.js`, `v6-signals.js`, `spawn-distribution.js` (IMP-V6-008) PASS.
8. **ОТКРЫТО:** физическое подтверждение того, что берег заметно меняется после нескольких жизней на реальном устройстве (наблюдаемость мира вне детерминированных probes). Глубокий браузерный прогон дал визуальные слепки берега (`docs/evidence/deep-run-07-soak-4min.png`), но физический факт не заменяет.

### Гейт 4 — Продолжение (7) — 3/3
1. V3-022 жизнь после финала — реализовано (`v3-continuity.js` PASS).
2. V3-029 разные стартовые следы release/become — реализовано.
3. V10-001..V10-005 personal myth / cross-life — ЗАКРЫТ (Gate V10 PASS, `v10-myth.js`).

### Гейт 5 — Контент (8) — 3/3
1. V4-004 12 событий второго акта — реализовано.
2. V13 knowledge meta-layer — реализовано, `v13-knowledge.js` PASS.
3. Плотность/редкость без спама — `dense-interaction.js`, `dense-population/spawn/release/visual`, `density-guard.js`, `start-density.js`, `spawn-budget.js` PASS.

### Гейт 6 — UX (8) — 4/4
1. V11-001 first-session UX — IMPLEMENTED (`docs/IMP_V11_001_FIRST_SESSION.md`), `v11-first-session.js` PASS.
2. IMP-RC1-TOUCH touch hysteresis — реализовано, `touch-hysteresis.js`, `touch-policy.js`, `v3-047-touch-meaning.js` PASS; физически подтверждено на RC1 (`docs/RC1_TOUCH_EVIDENCE.md`).
3. V3-047 смысл жеста — PASS.
4. Отсутствие туториала в первые секунды / тишина — `run.js` (363 проверки) PASS; подтверждено браузерно в глубоком прогоне (проверки 1.1–1.2).

### Гейт 7 — Persistence (8) — 3/4
1. `v9-v25-persistence.js` — PASS (schema 5, миграции 1–4).
2. `v23-v25-persistence-fuzz.js` — PASS.
3. Bounded save budget + migration envelope (IMP-RC-003) — PASS.
4. **ОТКРЫТО:** физический сценарий «старый сейв → обновление APK» для актуального кандидата (для rc1 был PASS, для текущего кандидата факта нет). Браузерный аналог (сейв→перезапуск→«вернуться», 6838 байт) проходит, но физического факта не заменяет.

### Гейт 8 — Android (8) — 3/5 — BLOCKED
1. APK собирается в CI без Gradle (`tools/build-apk.sh`, JDK 17, build-tools 34) — PASS; 2026-09-18 сборка воспроизведена **локально** и дала идентичный по содержимому APK.
2. WebView security guard — `tools/check-android-security.sh` PASS (локально и в CI), плюс проверка манифеста фактом (`allowBackup=false`, `usesCleartextTraffic=false`).
3. Release-signed кандидат актуального `main` — **ЗАКРЫТО 2026-09-17**, независимо перепроверено 2026-09-18: run `35232162470`, APK SHA-256 `1c18e1c1bdefc44636b5bff62296a6cf5847d185b28df0bcffa454c0254d9056`, apksigner v2/v3, сертификат `31:80:D0:AE:…:D2:42`, debug-контроль отклонён (другой сертификат).
4. **ОТКРЫТО:** физический acceptance 16/16 сценариев на реальном устройстве для exact кандидата — human blocker, держит cap 90%.
5. **ОТКРЫТО:** слабое устройство / ротация / back-resume на текущем кандидате (для rc1 было PASS, evidence не переносится). Браузерно: поворот портрет↔ландшафт, background→foreground, CPU ×6 — PASS, но это не физическое устройство.

### Гейт 9 — Offline (3) — 3/3
1. `web/sw.js` покрывает все ассеты — `tools/check-sync.sh` PASS.
2. IMP-V4-009 полный offline shell — реализовано.
3. Отсутствие обязательной сети — `rc2-evidence.json` (`blockers.networkRequired=false`), `rc-hardening.js` PASS.

Факты 2026-09-17/18: оффлайн-контур браузера подтверждён в реальном headless Chromium — SW активен, кэш `igra-shell-v31` (90 записей), полная перезагрузка при выключенной сети поднимает игру и позволяет вернуться в мир (проверки 2.1–2.2, 8.1–8.2 глубокого прогона).

### Гейт 10 — Performance (7) — 4/5
1. V3-048 performance/touch — `v3-048-performance.js` PASS.
2. Render budget без аллокаций на кадр (V3-050) + regression malformed коллекций (V3-052) — `render-budget.js` PASS.
3. `rc-hardening.js` (включая long-session soak при наличии GC) — PASS.
4. `v22-regression-gate.js`, `v20-v22-hardening.js` — PASS. Дополнено 2026-09-18: браузерный 4-мин soak — heap +630 KB, DOM-узлы не растут (206 против 246 на входе), 0 новых JS-обработчиков, 0 pageerror; под CPU ×6 рендер продолжается (14.4 fps против 60.3 без тормоза).
5. **ОТКРЫТО:** физический soak на слабом Android для текущего кандидата (V11-004). Для rc1: 55 fps / 4 тяжёлых кадра — не переносится.

### Гейт 11 — Accessibility (5) — 4/4
1. IMP-P9-001 reduced-motion + semantic UI — реализовано, `accessibility.js` PASS.
2. V11-005 accessibility/localization final pass — `v11-accessibility.js` PASS.
3. Haptic/audio fallback — `accessibility.js`, `audio.js`, `v17-adaptive-audio.js` PASS.
4. `rc-hardening.js` reduced-motion API stability — PASS; браузерно подтверждено 2026-09-18 (reduced-motion старт без ошибок, HUD ≥12px).

### Гейт 12 — Localization (4) — 3/3
1. RU/EN dictionary parity — `rc-hardening.js` PASS; 2026-09-18 дополнительно проверено покоем факта: `IGRA.UI_STR` 55/55 ключей в обоих языках, пустых нет.
2. `v11-accessibility.js` (включая overflow/layout) — PASS.
3. `run.js`: наименования вех/берегов на двух языках — PASS. Браузерно: overflow 0 в портрете и ландшафте на обоих языках.

### Гейт 13 — Release (5) — 4/5
1. R10-001 RC contract freeze — PASS (автоматические инварианты + физический acceptance rc1).
2. R10-002 release artifact + checksum — PASS (`v3.0.1-rc1` опубликован, SHA-256 перепроверен скачиванием 2026-09-18).
3. R10-003 stable signing инфраструктура — PASS (`IGRA_SIGNING_MODE=release`, запрет debug для `v*`, release authorization gate в `apk.yml`).
4. Release-signed кандидат текущего `main` — **ЗАКРЫТО 2026-09-17**, независимо перепроверено 2026-09-18 (run `35232162470`, SHA `1c18e1c1…`, `docs/RELEASE_CANDIDATE_VERIFICATION.md`).
5. **ОТКРЫТО:** финальная ручная сверка Play listing / `docs/PRIVACY.md` / `docs/STORE.md` с фактическим APK, который поедет в production. Предварительная машинная сверка кандидата выполнена 2026-09-18 (пакет, разрешения, `allowBackup`, cleartext); вопрос декларации `INTERNET` в Data safety зафиксирован в `docs/RELEASE_CANDIDATE_VERIFICATION.md` §2.

### Гейт 14 — QA (6) — 4/6
1. `tools/probe/run.js` — 363/363 PASS локально; в CI — SUCCESS.
2. Life Arc Gate — 60/60 локально; CI run `35233088228` (#243) SUCCESS.
3. Sync play mirror + Pages — CI SUCCESS (`eca3018`: #783, #1345).
4. Синтаксис и функциональность оффлайн-оболочки под постоянным надзором — `node --check` корневых скриптов `web/` в `tools/check-sync.sh` + функциональный SW-probe в `tools/probe/boot.js` (install/activate/fetch, наличие каждого кэшируемого ассета). Негативный контроль: сломанный `sw.js` обоими сторожами отклоняется. Дополнено 2026-09-18: `tools/browser-deep-run.js` — автономный глубокий прогон (32/32) против того же payload, что в APK.
5. **ОТКРЫТО:** длинный **ручной** прогон текущего кандидата (V21 playtest evidence для актуального build). Автоматизированный soak не считается ручным.
6. **ОТКРЫТО:** чистая установка/обновление поверх существующего сейва на текущем кандидате (физически).

### Гейт 15 — Monetization (4) — 3/3 (PASS по факту отсутствия)
1. Монетизации в коде нет — подтверждено `check-android-security.sh`, `rc2-evidence.json`, `run.js`.
2. `docs/STORE.md`: игра бесплатна, без рекламы и встроенных покупок.
3. Нет streak/daily/FOMO/energy-за-деньги — инвариант `rc-hardening.js` и политика `docs/AGENTS.md`.

## Потолок (cap)

| Условие | Cap |
|---|---|
| Физический Android acceptance текущего кандидата НЕ пройден | ≤ 90% ← **действует сейчас** |
| Acceptance пройден, но нет отдельного production release decision | ≤ 95% |
| Production опубликован | cap снимается |

## История пересчёта

| Дата (UTC) | Commit | Было | Стало | Дельта | Причина |
|---|---|---|---|---|---|
| 2026-09-17T13:41Z | `06032bd` | — (расчёт не вёлся) | 90% (93% до cap) | baseline | Первый честный расчёт по 15 гейтам. Cap 90% из-за PENDING физического acceptance. Заодно исправлена опечатка SHA-256 rc1 в README/BACKLOG_POST_RC/PUBLISH. |
| 2026-09-17T13:55Z | `0643a33` | 90% (93% до cap) | 90% (94% до cap) | +0 эффективно, +1 до cap | Гейт 8: 2/5 → 3/5 (создан release-signed кандидат run `35229481075`). Гейт 13: 3/5 → 4/5. Cap 90% остаётся. |
| 2026-09-17T14:35Z | `1f0a1b7` | 90% (94% до cap) | 90% (94% до cap) | 0 | Перепривязка кандидата к `1c18e1c1…` (run `35232162470`) после исправления `web/sw.js`; добавлены два сторожа оффлайн-оболочки. Числители не менялись. |
| 2026-09-18T05:20Z | `eca3018` | 90% (94% до cap) | 90% (94% до cap) | 0 | Смена верификации: независимая проверка бинарника кандидата (подпись/манифест/воспроизводимость), глубокий браузерный прогон 32/32, восстановлена расшифровка гейтов 10–15 (её случайно удалил коммит `eca3018`). Ни один числитель не сдвинулся: все открытые пункты упираются в физическое устройство или production-решение — процент не начисляется без факта. |
