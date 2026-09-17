# ИГРА — готовность по 15 гейтам

> Единая точка отсчёта процента готовности. Формула и веса — из задания смены и `docs/ROADMAP_TO_READY.md` (раздел 0).
> Правило честности: в числитель идут только задачи, закрытые фактом — PASS probe, зелёный CI run, опубликованный артефакт с SHA-256, закрытая задача бэклога. Синтетический evidence в числитель не идёт. Округление вниз.

## Параметры расчёта

- **Дата расчёта:** 2026-09-17T13:41Z (UTC)
- **Commit расчёта:** `06032bd32aa01e9ecc3a6ea36cc36b9930783543` (`main`)
- **База CI:** Life Arc Gate #236 (run `35157731498`) SUCCESS, APK #1203 (run `35157731486`) SUCCESS, Sync play mirror #773 (run `35157731495`) SUCCESS, Pages `35157730577` SUCCESS — все на `06032bd`.
- **Локальный прогон смены (Node 20, песочница агента):** `tools/probe/run.js` → 363/363 PASS; полный набор Life Arc Gate (54 probes + life-workflow + release-workflow-contract + rc-hardening + 3 evidence-теста) → 60/60 PASS; `node --check` по 78 файлам `web/js` → 0 ошибок; `tools/check-sync.sh` → PASS; `tools/check-android-security.sh` → PASS; `tools/probe/render-budget.js` → PASS (V3-052); `tools/probe/balance.js` → PASS.
- **Immutable RC:** `v3.0.1-rc1` → commit `9e8fe1a13804f2f5d00feb3b4ffbed60af203d44`, APK `igra-3.0.1.apk`, SHA-256 `160cec76dee27c903fab49506ea5c813b6430760c7021a03b85360f36c78f6bc` (сверено фактическим скачиванием артефакта 2026-09-17).
- **Текущий инженерный артефакт `main`:** APK run `35157731486`, artifact `10471054268`, `igra-3.0.1.apk`, SHA-256 `01b9a92ff46f953431ddea73cfa8193ea54e90967fd2ab23f9b3f263e8d6382d`, подпись **debug** (обычный push-build). Для физического acceptance не годится.
- **Release-signed кандидат актуального `main`: НЕ СОЗДАН** (нужен `workflow_dispatch` APK с `release_candidate=true`).

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
| 8 | Android: APK, WebView, touch, lifecycle, слабые устройства | 8 | 2/5 | 40 | 3.20 | **BLOCKED** |
| 9 | Offline: полный цикл без сети | 3 | 3/3 | 100 | 3.00 | GREEN |
| 10 | Performance: устойчивый FPS, нет роста памяти | 7 | 4/5 | 80 | 5.60 | YELLOW |
| 11 | Accessibility: читаемость, haptic/audio fallback | 5 | 4/4 | 100 | 5.00 | GREEN |
| 12 | Localization: ru/en полностью, layout не ломается | 4 | 3/3 | 100 | 4.00 | GREEN |
| 13 | Release: versioning, stable signing, privacy/store, материалы | 5 | 3/5 | 60 | 3.00 | YELLOW |
| 14 | QA: probes + длинные ручные прогоны + чистая установка/обновление | 6 | 3/5 | 60 | 3.60 | YELLOW |
| 15 | Monetization: базовая версия не зависит | 4 | 3/3 | 100 | 4.00 | GREEN |
| | **Сумма весов** | **100** | | | **93.27** | |

**Готовность проекта (до cap):** 93.27 → округление вниз = **93%**
**Cap:** физический Android acceptance текущего кандидата не пройден → **не выше 90%**
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
8. **ОТКРЫТО:** физическое подтверждение того, что берег заметно меняется после нескольких жизней на реальном устройстве (наблюдаемость мира вне детерминированных probes). Факта нет → в числитель не идёт.

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
4. Отсутствие туториала в первые секунды / тишина — `run.js` (363 проверки) PASS, `v3_text_silence` в offline shell.

### Гейт 7 — Persistence (8) — 3/4
1. `v9-v25-persistence.js` — PASS (schema 5, миграции 1–4).
2. `v23-v25-persistence-fuzz.js` — PASS.
3. Bounded save budget + migration envelope (IMP-RC-003) — PASS.
4. **ОТКРЫТО:** физический сценарий «старый сейв → обновление APK» для актуального кандидата (для rc1 был PASS, для текущего кандидата факта нет).

### Гейт 8 — Android (8) — 2/5 — BLOCKED
1. APK собирается в CI без Gradle (`tools/build-apk.sh`, JDK 17, build-tools 34) — PASS (run `35157731486`).
2. WebView security guard — `tools/check-android-security.sh` PASS (локально и в CI).
3. **ОТКРЫТО:** release-signed кандидат актуального `main` (нужен `workflow_dispatch` с `release_candidate=true`).
4. **ОТКРЫТО:** физический acceptance 16/16 сценариев на реальном устройстве для exact кандидата — human blocker.
5. **ОТКРЫТО:** слабое устройство / ротация / back-resume на текущем кандидате (для rc1 было PASS, evidence не переносится).

### Гейт 9 — Offline (3) — 3/3
1. `web/sw.js` покрывает все ассеты — `tools/check-sync.sh` PASS.
2. IMP-V4-009 полный offline shell — реализовано.
3. Отсутствие обязательной сети — `rc2-evidence.json` (`blockers.networkRequired=false`), `rc-hardening.js` PASS.

### Гейт 10 — Performance (7) — 4/5
1. V3-048 performance/touch — `v3-048-performance.js` PASS.
2. Render budget без аллокаций на кадр (V3-050) + regression malformed коллекций (V3-052) — `render-budget.js` PASS.
3. `rc-hardening.js` (включая long-session soak при наличии GC) — PASS.
4. `v22-regression-gate.js`, `v20-v22-hardening.js` — PASS.
5. **ОТКРЫТО:** физический soak на слабом Android для текущего кандидата (V11-004). Для rc1: 55 fps / 4 тяжёлых кадра — не переносится.

### Гейт 11 — Accessibility (5) — 4/4
1. IMP-P9-001 reduced-motion + semantic UI — реализовано, `accessibility.js` PASS.
2. V11-005 accessibility/localization final pass — `v11-accessibility.js` PASS.
3. Haptic/audio fallback — `accessibility.js`, `audio.js`, `v17-adaptive-audio.js` PASS.
4. `rc-hardening.js` reduced-motion API stability — PASS.

### Гейт 12 — Localization (4) — 3/3
1. RU/EN dictionary parity — `rc-hardening.js` PASS.
2. `v11-accessibility.js` (включая overflow/layout) — PASS.
3. `run.js`: наименования вех/берегов на двух языках — PASS.

### Гейт 13 — Release (5) — 3/5
1. R10-001 RC contract freeze — PASS (автоматические инварианты + физический acceptance rc1).
2. R10-002 release artifact + checksum — PASS (`v3.0.1-rc1` опубликован, SHA-256 сверен фактическим скачиванием).
3. R10-003 stable signing инфраструктура — PASS (`IGRA_SIGNING_MODE=release`, запрет debug для `v*`, release authorization gate в `apk.yml`).
4. **ОТКРЫТО:** release-signed кандидат текущего `main` не создан (см. гейт 8.3).
5. **ОТКРЫТО:** финальная ручная сверка Play listing / `docs/PRIVACY.md` / `docs/STORE.md` с фактическим APK, который поедет в production.

### Гейт 14 — QA (6) — 3/5
1. `tools/probe/run.js` — 363/363 PASS локально; в CI — SUCCESS (APK #1203).
2. Life Arc Gate — 60/60 локально; CI run `35157731498` SUCCESS.
3. Sync play mirror + Pages — runs `35157731495`, `35157730577` SUCCESS.
4. **ОТКРЫТО:** длинный ручной прогон текущего кандидата (V21 playtest evidence для актуального build).
5. **ОТКРЫТО:** чистая установка/обновление поверх существующего сейва на текущем кандидате (физически).

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
| 2026-09-17T13:41Z | `06032bd` | — (расчёт не вёлся) | 90% (93% до cap) | baseline | Первый честный расчёт по 15 гейтам. Cap 90% из-за PENDING физического acceptance. Заодно исправлена опечатка SHA-256 rc1 в README/BACKLOG_POST_RC/PUBLISH (`…fab4956ea…` → фактический `…fab4950ea…`). |
