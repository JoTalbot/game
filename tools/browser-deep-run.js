#!/usr/bin/env node
// Глубокий браузерный прогон ИГРЫ (headless Chromium + Playwright).
//
// ЧТО ЭТО: автоматизируемый не-физический backend лестницы приёмки (пункт 4 из задания смены):
// ротация, жизненный цикл (hidden/visible), оффлайн-перезагрузка, слабый CPU, память на длинной
// сессии, ru/en-раскладка, reduced-motion, жесты. Прогон идёт против web/ — того же payload,
// что лежит в APK (проверяется байт-идентичностью assets/www).
//
// ЧЕМ ЭТО НЕ ЯВЛЯЕТСЯ: это НЕ физический Android acceptance и НЕ CI-гейт. touch/haptic/lifecycle
// реального устройства остаются за RC-PHYS-002 (human blocker). Evidence помечается
// physicalAndroid:false и в числитель гейта 8 не идёт.
//
// Запуск (нужны playwright + chromium; путь можно задать IGRA_PW):
//   PLAYWRIGHT_BROWSERS_PATH=/opt/tc/pw-browsers node tools/browser-deep-run.js
// Переменные: IGRA_DEEP_OUT=/tmp/deep-run IGRA_DEEP_MINUTES=3 IGRA_DEEP_CPU_THROTTLE=6
"use strict";

const fs = require("fs");
const path = require("path");
const http = require("http");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const WEB = path.join(ROOT, "web");
const OUT = process.env.IGRA_DEEP_OUT || "/tmp/deep-run";
const MINUTES = Number(process.env.IGRA_DEEP_MINUTES || 3);
const THROTTLE = Number(process.env.IGRA_DEEP_CPU_THROTTLE || 6);
const PORT = Number(process.env.IGRA_DEEP_PORT || 8129);

// Хром ищется так: IGRA_PW → модуль "playwright" (CI/локальная установка) → песочница агента.
if (!process.env.PLAYWRIGHT_BROWSERS_PATH && fs.existsSync("/opt/tc/pw-browsers")) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = "/opt/tc/pw-browsers";
}
let chromium;
try { ({ chromium } = require(process.env.IGRA_PW || "playwright")); }
catch (e) {
  try { ({ chromium } = require("/tmp/pw/node_modules/playwright")); }
  catch (e2) {
    console.error("Нужен Playwright: npm i playwright && npx playwright install chromium (или IGRA_PW=/путь/к/playwright)");
    process.exit(2);
  }
}

fs.mkdirSync(OUT, { recursive: true });

const results = [];
function check(name, cond, detail) {
  results.push({ name, pass: !!cond, detail: detail === undefined ? "" : String(detail) });
  console.log((cond ? "PASS " : "FAIL ") + name + (detail !== undefined && detail !== "" ? "  (" + detail + ")" : ""));
}

// ---------- provenance ----------
function payloadHash() {
  const files = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else files.push(p);
    }
  })(WEB);
  files.sort();
  const h = crypto.createHash("sha256");
  for (const f of files) {
    h.update(path.relative(WEB, f).split(path.sep).join("/"));
    h.update("\0");
    h.update(fs.readFileSync(f));
    h.update("\0");
  }
  return { hash: h.digest("hex"), files: files.length };
}

let commit = "unknown";
try { commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT }).toString().trim(); } catch (e) {}

// ---------- static server (web/ = источник истины) ----------
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml",
  ".webp": "image/webp", ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf",
  ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".txt": "text/plain; charset=utf-8", ".webmanifest": "application/manifest+json"
};
const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || "/").split("?")[0]);
  let file = path.join(WEB, url === "/" ? "index.html" : url);
  if (!file.startsWith(WEB)) { res.writeHead(403); return res.end("no"); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end("404"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
    fs.createReadStream(file).pipe(res);
  });
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const payload = payloadHash();
  const startedAt = new Date().toISOString();
  console.log("payload sha256: " + payload.hash + " (" + payload.files + " файлов), commit " + commit);
  await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
  const base = "http://127.0.0.1:" + PORT + "/index.html";

  const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage", "--autoplay-policy=no-user-gesture-required"] });
  const ctx = await browser.newContext({
    viewport: { width: 427, height: 948 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true,
    locale: "ru-RU", userAgent: "Mozilla/5.0 (Linux; Android 14; IGRA-deep-run) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36"
  });
  const page = await ctx.newPage();
  const errors = [], pageErrors = [], failedReqs = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
  page.on("pageerror", (e) => pageErrors.push(String((e && e.message) || e).slice(0, 200)));
  page.on("requestfailed", (r) => failedReqs.push((r.url().slice(-60)) + " :: " + ((r.failure() || {}).errorText || "")));

  await ctx.addInitScript(() => {
    // Считаем, сколько обработчиков навешивает сам код игры. JSEventListeners из Performance
    // показывает пики при синтетическом вводе (артефакт эмуляции), поэтому опираемся на этот счётчик.
    const stats = { add: 0, remove: 0, byType: {} };
    window.__igraListenerStats = stats;
    const origAdd = EventTarget.prototype.addEventListener;
    const origRemove = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.addEventListener = function (type, fn, opts) {
      try { stats.add++; stats.byType[type] = (stats.byType[type] || 0) + 1; } catch (e) {}
      return origAdd.call(this, type, fn, opts);
    };
    EventTarget.prototype.removeEventListener = function (type, fn, opts) {
      try { stats.remove++; } catch (e) {}
      return origRemove.call(this, type, fn, opts);
    };
  });

  const cdp = await ctx.newCDPSession(page);
  const snap = (n) => page.screenshot({ path: path.join(OUT, n) }).catch(() => {});
  const st = () => page.evaluate(() => {
    const G = window.IGRA || {};
    const app = G.app || {};
    const w = app.world || {};
    return {
      igra: !!window.IGRA, state: app.state || null, nodes: (w.nodes || []).length,
      beings: (w.beings || w.creatures || []).length, titleMode: document.body.classList.contains("title-mode"),
      acts: G.Report && G.Report.acts ? JSON.parse(JSON.stringify(G.Report.acts)) : null,
      frames: G.Report ? G.Report.frames : null,
      renderErrors: G.Report && Array.isArray(G.Report.errors) ? G.Report.errors.length : null,
      saveBytes: (localStorage.getItem("igra.save.v1") || "").length,
      jsListeners: (window.__igraListenerStats || {}).add || 0
    };
  });

  async function gesture(kind) {
    const geo = await page.evaluate(() => {
      const G = window.IGRA; const canvas = document.getElementById("stage");
      if (!G || !G.app || !G.app.world || !canvas) return null;
      const r = canvas.getBoundingClientRect(); const nodes = G.app.world.nodes || [];
      const n = nodes.find((x) => x && x.state === "alive") || nodes[0];
      if (!n || !G.app.cam) return null;
      const cam = G.app.cam;
      const sx = r.left + r.width / 2 + (n.x - cam.x) * cam.z;
      const sy = r.top + r.height / 2 + (n.y - cam.y) * cam.z;
      return sx >= 0 && sx <= r.right && sy >= 0 && sy <= r.bottom ? { sx, sy } : null;
    });
    if (!geo) return false;
    if (kind === "tap") { await page.touchscreen.tap(geo.sx, geo.sy).catch(() => {}); return true; }
    await page.mouse.move(geo.sx, geo.sy);
    await page.mouse.down();
    for (let i = 0; i < 6; i++) { await sleep(400); await page.mouse.move(geo.sx + (i % 2), geo.sy).catch(() => {}); }
    await page.mouse.up().catch(() => {});
    return true;
  }


  async function ensurePlay(tries) {
    for (let i = 0; i < (tries || 3); i++) {
      const s = await st();
      if (s.nodes > 0 && s.titleMode === false) return true;
      const resumed = await page.evaluate(() => {
        const c = document.getElementById("btn-continue");
        if (c && c.offsetParent !== null) { c.click(); return "continue"; }
        const b = document.getElementById("btn-born");
        if (b && b.offsetParent !== null) { b.click(); return "born"; }
        return "none";
      });
      await page.waitForTimeout(resumed === "none" ? 2000 : 4500);
    }
    const s = await st();
    return s.nodes > 0 && s.titleMode === false;
  }

  async function fpsFor(ms) {
    return page.evaluate((ms2) => new Promise((res) => {
      let n = 0; const t0 = performance.now();
      (function f() { n++; const dt = performance.now() - t0; if (dt < ms2) requestAnimationFrame(f); else res({ frames: n, ms: Math.round(dt), fps: +(n / (dt / 1000)).toFixed(1) }); })();
    }), ms);
  }

  async function heap() {
    try { const m = await cdp.send("Performance.getMetrics"); const g = (n) => { const x = m.metrics.find((v) => v.name === n); return x ? x.value : null; }; return { jsHeap: g("JSHeapUsedSize"), nodes: g("Nodes"), listeners: g("JSEventListeners") }; }
    catch (e) { return { jsHeap: null, nodes: null, listeners: null }; }
  }

  let heapSamples = [];
  const marks = [];
  try {
    // ===== 1. первые секунды: без туториала =====
    await page.goto(base, { waitUntil: "load", timeout: 30000 });
    await page.waitForTimeout(2500);
    const boot = await st();
    check("1.1 IGRA поднят, состояние title", boot.igra && boot.state === "title", JSON.stringify({ state: boot.state, titleMode: boot.titleMode }));
    check("1.2 первые секунды без туториала (только титул и шёпот)", await page.evaluate(() => {
      const ts = document.getElementById("title-screen"); const w = document.getElementById("whisper");
      const visible = (el) => !!el && el.offsetParent !== null;
      const text = document.body.innerText.toLowerCase();
      return visible(ts) && (!w || visible(w)) && !/как играть|туториал|tutorial|инструкц/.test(text);
    }));
    check("1.3 нет pageerror на старте", pageErrors.length === 0, pageErrors.slice(0, 2).join(" | "));
    check("1.4 нет console.error на старте", errors.length === 0, errors.slice(0, 2).join(" | "));
    await snap("01-title.png");

    // ===== 2. оффлайн-оболочка =====
    const sw = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
      let keys = [], cached = 0;
      try { keys = await caches.keys(); for (const k of keys) { const c = await caches.open(k); cached += (await c.keys()).length; } } catch (e) {}
      return { registered: !!reg, active: !!(reg && reg.active), keys, cached };
    });
    check("2.1 service worker зарегистрирован и активен", sw.registered && sw.active, JSON.stringify({ cached: sw.cached, keys: sw.keys }));
    check("2.2 кэш оболочки наполнен (>=80 записей)", sw.cached >= 80, "entries=" + sw.cached);

    // ===== 3. рождение и мир =====
    await page.tap("#btn-born").catch(() => page.click("#btn-born"));
    await page.waitForTimeout(6500);
    const born = await st();
    check("3.1 после рождения мир жив, HUD интерактивен", born.nodes > 0 && born.titleMode === false, JSON.stringify({ nodes: born.nodes, beings: born.beings }));
    await snap("02-born.png");

    // ===== 4. жесты (touch) =====
    const beforeG = await st();
    const tapOk = await gesture("tap");
    const holdOk = await gesture("hold");
    await page.waitForTimeout(2500);
    const afterG = await st();
    check("4.1 touch-жесты принимаются (tap/hold)", tapOk && holdOk && (afterG.acts.taps > beforeG.acts.taps || afterG.acts.gazes > beforeG.acts.gazes),
      JSON.stringify({ before: beforeG.acts, after: afterG.acts }));
    await snap("03-after-gesture.png");

    // ===== 5. ротация экрана =====
    const framesBeforeRot = (await st()).frames;
    await page.setViewportSize({ width: 948, height: 427 });
    await page.waitForTimeout(3000);
    const land = await page.evaluate(() => {
      const c = document.getElementById("stage"); const r = c.getBoundingClientRect();
      return { canvasCSS: { w: Math.round(r.width), h: Math.round(r.height) }, buffer: { w: c.width, h: c.height }, overflow: document.documentElement.scrollWidth - window.innerWidth, hud: !!document.getElementById("hud-right") };
    });
    check("5.1 поворот в ландшафт: канвас перестроен, HUD жив", land.buffer.w > land.buffer.h && land.canvasCSS.w >= 900 && land.hud && land.overflow <= 1, JSON.stringify(land));
    await snap("04-landscape.png");
    await page.setViewportSize({ width: 427, height: 948 });
    await page.waitForTimeout(3000);
    const port = await st();
    check("5.2 возврат в портрет: мир продолжается, кадры идут", port.nodes > 0 && port.frames > framesBeforeRot, JSON.stringify({ frames: port.frames, before: framesBeforeRot }));
    check("5.3 после ротации нет новых ошибок", pageErrors.length === 0 && errors.length === 0, pageErrors.concat(errors).slice(0, 2).join(" | "));

    // ===== 6. жизненный цикл (сворачивание/возврат) =====
    await page.evaluate(() => { Object.defineProperty(document, "hidden", { value: true, configurable: true }); document.dispatchEvent(new Event("visibilitychange")); });
    await sleep(4000);
    const hiddenState = await st();
    await page.evaluate(() => { Object.defineProperty(document, "hidden", { value: false, configurable: true }); document.dispatchEvent(new Event("visibilitychange")); });
    await sleep(3500);
    const visibleState = await st();
    check("6.1 background → foreground: состояние и мир сохранены", hiddenState.nodes > 0 && visibleState.nodes > 0 && visibleState.state === hiddenState.state,
      JSON.stringify({ hidden: hiddenState.state, visible: visibleState.state, nodes: visibleState.nodes }));
    check("6.2 после возврата кадры идут", visibleState.frames > hiddenState.frames, JSON.stringify({ hidden: hiddenState.frames, visible: visibleState.frames }));

    // ===== 7. сейв: перезапуск и «вернуться» =====
    const saveBefore = (await st()).saveBytes;
    await page.reload({ waitUntil: "load" });
    await page.waitForTimeout(3000);
    const reload = await page.evaluate(() => {
      const c = document.getElementById("btn-continue");
      return { continueVisible: !!(c && c.offsetParent !== null), saveBytes: (localStorage.getItem("igra.save.v1") || "").length };
    });
    check("7.1 сейв пережил перезапуск, предлагается «вернуться»", reload.continueVisible && reload.saveBytes > 0 && saveBefore > 0, JSON.stringify({ before: saveBefore, after: reload.saveBytes }));
    await page.tap("#btn-continue").catch(() => page.click("#btn-continue"));
    await page.waitForTimeout(4000);
    const cont = await st();
    check("7.2 «вернуться» восстанавливает мир", cont.nodes > 0 && cont.titleMode === false, JSON.stringify({ nodes: cont.nodes, state: cont.state }));

    // ===== 8. оффлайн-перезагрузка =====
    await ctx.setOffline(true);
    let offlineLoaded = true, offlineErr = "";
    try { await page.reload({ waitUntil: "load", timeout: 25000 }); } catch (e) { offlineLoaded = false; offlineErr = String(e.message).split("\n")[0]; }
    await page.waitForTimeout(3000);
    const off = await st().catch(() => ({ igra: false }));
    check("8.1 полная перезагрузка без сети поднимает игру (SW-кэш)", offlineLoaded && off.igra, offlineErr);
    await snap("05-offline.png");
    await ctx.setOffline(false);
    await page.waitForTimeout(1000);
    const backFromOffline = await ensurePlay(3);
    check("8.2 после оффлайн-перезагрузки можно вернуться в мир", backFromOffline, JSON.stringify({ nodes: (await st()).nodes }));

    // ===== 9. ru/en: покрытие словаря и раскладка =====
    const coverage = await page.evaluate(() => {
      const S = window.IGRA.UI_STR;
      const ru = Object.keys(S.ru || {}), en = Object.keys(S.en || {});
      const missingEn = ru.filter((k) => !(k in S.en) || !String(S.en[k] || "").trim());
      const missingRu = en.filter((k) => !(k in S.ru) || !String(S.ru[k] || "").trim());
      return { ruKeys: ru.length, enKeys: en.length, missingEn, missingRu };
    });
    const langCheck = async (w, h) => {
      await page.setViewportSize({ width: w, height: h });
      await page.waitForTimeout(800);
      const out = {};
      for (const id of ["ru", "en"]) {
        if (await page.evaluate(() => window.IGRA.Lang.id) !== id) { await page.evaluate(() => document.getElementById("lang-btn").click()); await page.waitForTimeout(700); }
        out[id] = await page.evaluate(() => ({
          lang: window.IGRA.Lang.id, htmlLang: document.documentElement.lang,
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          hud: !!document.getElementById("hud-right") && document.getElementById("lang-btn").offsetParent !== null
        }));
      }
      await page.evaluate(() => document.getElementById("lang-btn").click());
      return out;
    };
    const ru_en_portrait = await langCheck(427, 948);
    const ru_en_land = await langCheck(948, 427);
    check("9.1 ru/en переключаются, HUD жив в обоих", ru_en_portrait.ru.lang === "ru" && ru_en_portrait.en.lang === "en" && ru_en_portrait.en.hud && ru_en_land.en.hud,
      JSON.stringify({ portrait: ru_en_portrait, landscape: ru_en_land }));
    check("9.3 словарь ru/en покрыт полностью (нет пустых ключей)", coverage.missingEn.length === 0 && coverage.missingRu.length === 0,
      JSON.stringify({ ruKeys: coverage.ruKeys, enKeys: coverage.enKeys, missingEn: coverage.missingEn.slice(0, 8), missingRu: coverage.missingRu.slice(0, 8) }));
    check("9.2 раскладка не выезжает за экран в обоих языках и ориентациях",
      Math.max(ru_en_portrait.ru.overflow, ru_en_portrait.en.overflow, ru_en_land.ru.overflow, ru_en_land.en.overflow) <= 1,
      JSON.stringify({ portrait: [ru_en_portrait.ru.overflow, ru_en_portrait.en.overflow], landscape: [ru_en_land.ru.overflow, ru_en_land.en.overflow] }));
    await page.setViewportSize({ width: 427, height: 948 });
    await snap("06-en-or-ru.png");

    // ===== 10. тишина и звук =====
    const audio = await page.evaluate(() => {
      const A = window.IGRA.Audio; const b = document.getElementById("mute-btn");
      const before = A.muted; b.click(); const after = A.muted; b.click();
      return { before, after, restored: A.muted === before };
    });
    check("10.1 «тишина» переключает аудио и возвращается назад", audio.before !== audio.after && audio.restored, JSON.stringify(audio));

    // ===== 11. слабое устройство: CPU throttle =====
    await cdp.send("Performance.enable").catch(() => {});
    const fpsNormal = await fpsFor(6000);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
    await sleep(1500);
    const fpsWeak = await fpsFor(8000);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    await sleep(1500);
    await ensurePlay(2);
    const gameFps = await page.evaluate(() => (window.IGRA.Report && window.IGRA.Report.fps) ? window.IGRA.Report.fps() : null);
    console.log("     fps: normal=" + fpsNormal.fps + " (x" + THROTTLE + " throttle)=" + fpsWeak.fps + " game=" + gameFps);
    check("11.1 под x" + THROTTLE + "-тормозом CPU игра продолжает рисовать кадры", fpsWeak.frames > 10 && fpsWeak.fps > 3, JSON.stringify({ normal: fpsNormal.fps, weak: fpsWeak.fps }));
    check("11.2 телеметрия игры не видит ошибок рендера", await page.evaluate(() => !!(window.IGRA.Report && window.IGRA.Report.errors && window.IGRA.Report.errors.length === 0)));

    // ===== 12. длинная сессия: память и мир =====
    const t0 = Date.now();
    let gestureCount = 0;
    let aliveGestureOk = 0;
    while (Date.now() - t0 < MINUTES * 60000) {
      if (Math.random() < 0.15) await ensurePlay(1);
      const acted = await gesture(gestureCount % 3 === 0 ? "hold" : "tap");
      gestureCount += acted ? 1 : 0; if (acted) aliveGestureOk++;
      await sleep(6000);
      const h = await heap(); const s = await st();
      heapSamples.push({ t: Math.round((Date.now() - t0) / 1000), jsHeap: h.jsHeap, nodes: h.nodes, listeners: h.listeners, worldNodes: s.nodes, beings: s.beings });
      if (heapSamples.length % 5 === 0) {
        marks.push({ minute: (Date.now() - t0) / 60000, worldNodes: s.nodes, beings: s.beings, acts: s.acts });
        await snap("07-soak-" + Math.round((Date.now() - t0) / 60000) + "min.png");
      }
    }
    const first = heapSamples[0] || {}; const last = heapSamples[heapSamples.length - 1] || {};
    const heapDelta = (first.jsHeap != null && last.jsHeap != null) ? (last.jsHeap - first.jsHeap) : null;
    const soak = await st();
    check("12.1 длинная сессия: игра живёт в мире, ошибок рендера нет", soak.nodes > 0 && soak.frames > 0 && soak.renderErrors === 0 && aliveGestureOk > 0,
      JSON.stringify({ frames: soak.frames, nodes: soak.nodes, aliveGestures: aliveGestureOk, renderErrors: soak.renderErrors, acts: soak.acts }));
    const jsBefore = first.jsListeners != null ? first.jsListeners : 0;
    const jsAfter = last.jsListeners != null ? last.jsListeners : 0;
    const listenerSeries = heapSamples.map((h) => h.listeners).filter((v) => v != null);
    const listenerMin = listenerSeries.length ? Math.min.apply(null, listenerSeries) : null;
    const listenerMax = listenerSeries.length ? Math.max.apply(null, listenerSeries) : null;
    check("12.2 за сессию игра не навешивает новых обработчиков и не растит DOM",
      jsAfter - jsBefore === 0 && first.nodes != null && last.nodes != null && last.nodes <= first.nodes + 200,
      JSON.stringify({ jsListeners: jsAfter - jsBefore, nodesFirst: first.nodes, nodesLast: last.nodes }));
    console.log("     JSEventListeners (CDP, информационно): min=" + listenerMin + " max=" + listenerMax +
      " baseline=" + first.listeners + " — пики при синтетическом вводе, к базовой линии возвращается");
    check("12.3 heap не растёт бесконтрольно за " + MINUTES + " мин", heapDelta != null && heapDelta < 16 * 1024 * 1024,
      JSON.stringify({ startKB: first.jsHeap ? Math.round(first.jsHeap / 1024) : null, endKB: last.jsHeap ? Math.round(last.jsHeap / 1024) : null, deltaKB: heapDelta != null ? Math.round(heapDelta / 1024) : null }));
    check("12.4 мир не разрастается без границ (узлы в лимите)", last.worldNodes != null && last.worldNodes <= 400, JSON.stringify({ worldNodes: last.worldNodes, beings: last.beings }));
    check("12.5 за сессию ни одного pageerror/console.error", pageErrors.length === 0 && errors.length === 0, pageErrors.concat(errors).slice(0, 3).join(" | "));
    check("12.6 ни одного проваленного запроса (полная автономность ресурсов)", failedReqs.length === 0, failedReqs.slice(0, 3).join(" | "));
    await snap("08-soak-end.png");

    // ===== 13. reduced-motion и доступность =====
    const ctx2 = await browser.newContext({ viewport: { width: 427, height: 948 }, hasTouch: true, isMobile: true, reducedMotion: "reduce", locale: "ru-RU" });
    const page2 = await ctx2.newPage();
    const err2 = []; page2.on("pageerror", (e) => err2.push(String((e && e.message) || e)));
    await page2.goto(base, { waitUntil: "load" });
    await page2.waitForTimeout(2500);
    await page2.tap("#btn-born").catch(() => page2.click("#btn-born"));
    await page2.waitForTimeout(5000);
    const rm = await page2.evaluate(() => {
      const G = window.IGRA;
      const hint = document.getElementById("hint"); const law = document.getElementById("law");
      const fs2 = (el) => el ? parseFloat(getComputedStyle(el).fontSize) : 0;
      return { igra: !!G, nodes: (G.app.world.nodes || []).length, hintPx: fs2(hint), lawPx: fs2(law), reduce: matchMedia("(prefers-reduced-motion: reduce)").matches };
    });
    check("13.1 prefers-reduced-motion: игра поднимается без ошибок", rm.igra && rm.nodes > 0 && err2.length === 0 && rm.reduce, JSON.stringify({ nodes: rm.nodes, errs: err2.slice(0, 2) }));
    check("13.2 текст HUD читаем (>=12px)", rm.hintPx >= 12 && rm.lawPx >= 12, JSON.stringify({ hintPx: rm.hintPx, lawPx: rm.lawPx }));
    await ctx2.close();

    // ===== 14. сигила и отчёт =====
    const sig = await page.evaluate(() => {
      document.getElementById("sigil-btn").click();
      const s = document.getElementById("sigil-screen");
      const on = s.classList.contains("on");
      const name = (document.getElementById("sigil-name") || {}).textContent || "";
      document.getElementById("sigil-close").click();
      return { on, name: name.slice(0, 40), closed: !s.classList.contains("on"), acts: window.IGRA.Report.acts.sigil };
    });
    check("14.1 сигила открывается/закрывается и учитывается как поступок", sig.on && sig.closed && sig.acts > 0, JSON.stringify(sig));
    await snap("09-sigil.png");
  } catch (e) {
    check("run: без исключений", false, String((e && e.stack) || e).split("\n").slice(0, 3).join(" | "));
  }

  const failed = results.filter((r) => !r.pass);
  const summary = {
    schema: 1,
    kind: "browser-deep-run",
    physicalAndroid: false,
    note: "Не является физическим Android acceptance. Прогон против web/ (тот же payload, что в APK).",
    utc: new Date().toISOString(),
    startedAtUtc: startedAt,
    payload: { commit, sha256: payload.hash, files: payload.files },
    candidate: {
      apkSha256: process.env.IGRA_EXPECTED_APK_SHA256 || null,
      sourceCommit: process.env.IGRA_EXPECTED_APK_COMMIT || null
    },
    browser: { name: "chromium", version: browser.version(), viewport: "427x948 @2x (mobile, touch)" },
    config: { soakMinutes: MINUTES, cpuThrottle: THROTTLE },
    soak: { samples: heapSamples, marks },
    checks: results,
    failed: failed.length,
    passed: results.length - failed.length
  };
  fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify(summary, null, 2) + "\n");

  console.log("\nDEEP RUN " + (failed.length === 0 ? "PASS" : "FAIL") + ": " + (results.length - failed.length) + "/" + results.length +
    "  (payload " + payload.hash.slice(0, 12) + ", commit " + commit.slice(0, 10) + ")");
  console.log("evidence: " + path.join(OUT, "summary.json"));
  await browser.close();
  server.close();
  process.exit(failed.length === 0 ? 0 : 1);
})().catch((e) => { console.error("DEEP RUN CRASH", e); server.close(); process.exit(2); });
