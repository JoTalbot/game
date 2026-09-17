#!/usr/bin/env node
// Браузерный smoke оффлайн-оболочки и первого жеста (headless Chromium + Playwright).
// НЕ часть обязательного CI: требует `npm i playwright && npx playwright install chromium`.
// Запуск: cd web && python3 -m http.server 8123 --bind 127.0.0.1  (в отдельном процессе)
//         node tools/browser-smoke.js
// Родился из регрессии 2026-09-17: web/sw.js ушёл в main с незакрытой скобкой,
// Service Worker не устанавливался, оффлайн-берег браузера молча умирал, а
// автоматические стенды этого не видели (node --check покрывал только web/js).
// Физическим Android acceptance этот прогон НЕ является.
const { chromium } = require('/tmp/pw/node_modules/playwright');
const fs = require('fs');
const OUT = process.env.IGRA_SMOKE_OUT || '/tmp/smoke'; fs.mkdirSync(OUT, { recursive: true });
const results = [];
function check(name, cond, detail) { results.push({ name, pass: !!cond, detail: detail || '' }); console.log((cond ? 'PASS ' : 'FAIL ') + name + (detail ? '  (' + detail + ')' : '')); }
const snap = () => ({ /* noop */ });
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 427, height: 948 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, userAgent: 'Mozilla/5.0 (Linux; Android 15; weak-device) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36', locale: 'ru-RU' });
  const page = await ctx.newPage();
  const errors = []; const pageErrors = []; const failedReqs = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => pageErrors.push(String(e && e.message || e)));
  page.on('requestfailed', r => failedReqs.push(r.url().slice(-40) + ' :: ' + (r.failure() || {}).errorText));

  await page.goto('http://127.0.0.1:8123/index.html', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2500);
  const api = await page.evaluate(() => { const G = window.IGRA; return { igra: !!G, state: G.app && G.app.state, titleMode: document.body.classList.contains('title-mode') }; });
  check('IGRA API доступен, состояние title', api.igra && api.state === 'title', JSON.stringify(api));
  check('нет pageerror/console.error при загрузке', pageErrors.length === 0 && errors.length === 0, (pageErrors.concat(errors)).slice(0, 3).join(' | '));
  check('нет проваленных запросов', failedReqs.length === 0, failedReqs.slice(0, 3).join(' | '));
  await page.screenshot({ path: OUT + '/01-title.png' });

  // service worker + кэш (условие оффлайн-гейта в браузере)
  const sw = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    let keys = []; try { keys = await caches.keys(); } catch (e) {}
    let cached = 0;
    for (const k of keys) { const c = await caches.open(k); const reqs = await c.keys(); cached += reqs.length; }
    return { registered: !!reg, scope: reg ? reg.scope : null, active: !!(reg && reg.active), keys, cached };
  });
  check('service worker зарегистрирован', sw.registered && sw.active, JSON.stringify(sw));
  check('offline-кэш наполнен', sw.cached >= 10, 'entries=' + sw.cached);

  // рождение
  await page.tap('#btn-born').catch(async () => page.click('#btn-born'));
  await page.waitForTimeout(7000);
  await page.screenshot({ path: OUT + '/02-after-birth.png' });
  const afterBirth = await page.evaluate(() => { const G = window.IGRA; return { state: G.app.state, nodes: G.app.world.nodes.length, titleMode: document.body.classList.contains('title-mode'), acts: JSON.parse(JSON.stringify(G.Report.acts)) }; });
  check('после рождения мир жив', afterBirth.nodes > 0, JSON.stringify(afterBirth));
  check('title-mode снят (HUD интерактивен)', afterBirth.titleMode === false);

  // жест удержания на живом узле
  const geo = await page.evaluate(() => {
    const G = window.IGRA; const canvas = document.getElementById('stage'); const r = canvas.getBoundingClientRect();
    const n = (G.app.world.nodes || []).find(x => x && x.state === 'alive') || G.app.world.nodes[0];
    if (!n) return null;
    const cam = G.app.cam;
    const sx = r.left + r.width / 2 + (n.x - cam.x) * cam.z;
    const sy = r.top + r.height / 2 + (n.y - cam.y) * cam.z;
    return { sx, sy, camw: cam.w, camh: cam.h, rect: { w: r.width, h: r.height, l: r.left, t: r.top }, dpr: window.devicePixelRatio, inRect: sx >= r.left && sx <= r.right && sy >= r.top && sy <= r.bottom };
  });
  if (geo && geo.inRect) {
    const before = await page.evaluate(() => JSON.parse(JSON.stringify(window.IGRA.Report.acts)));
    await page.touchscreen.tap(geo.sx, geo.sy).catch(() => {});
    await page.mouse.move(geo.sx, geo.sy);
    await page.mouse.down();
    for (let i = 0; i < 8; i++) { await page.waitForTimeout(500); await page.mouse.move(geo.sx + (i % 2), geo.sy); }
    const midHold = await page.evaluate(() => { const G = window.IGRA; return { hold: !!G.app.input && G.app.input.down, acts: JSON.parse(JSON.stringify(G.Report.acts)) }; });
    await page.mouse.up();
    await page.waitForTimeout(2000);
    const after = await page.evaluate(() => JSON.parse(JSON.stringify(window.IGRA.Report.acts)));
    check('жест принят: счётчик касаний вырос', after.taps > before.taps || after.gazes > before.gazes, 'before=' + JSON.stringify(before) + ' after=' + JSON.stringify(after) + ' midHold=' + JSON.stringify(midHold));
  } else {
    check('узел в пределах экрана для жеста', false, JSON.stringify(geo));
  }
  await page.screenshot({ path: OUT + '/03-after-gaze.png' });

  // производительность по внутренней телеметрии игры
  await page.waitForTimeout(4000);
  const perf = await page.evaluate(() => { const R = window.IGRA.Report; return { frames: R.frames, slow: R.slow, stall: R.stall, worst: Math.round(R.worst * 1000), fps: R.fps ? R.fps() : null, errors: R.errors }; });
  check('игра считает кадры', perf.frames > 60, JSON.stringify(perf));
  check('внутренние ошибки рендера отсутствуют', Array.isArray(perf.errors) && perf.errors.length === 0, JSON.stringify(perf.errors));

  // сейв
  const save1 = await page.evaluate(() => { const raw = localStorage.getItem('igra.save.v1'); return raw ? raw.length : 0; });
  check('сейв записан в localStorage', save1 > 0, save1 + ' байт');

  // перезагрузка → продолжение
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(3000);
  const afterReload = await page.evaluate(() => { const G = window.IGRA; const cont = document.getElementById('btn-continue'); return { continueVisible: !!(cont && cont.offsetParent !== null), saveBytes: (localStorage.getItem('igra.save.v1') || '').length }; });
  check('после перезагрузки сейв жив и предлагается «вернуться»', afterReload.continueVisible && afterReload.saveBytes > 0, JSON.stringify(afterReload));
  await page.screenshot({ path: OUT + '/04-after-reload.png' });

  // возврат в мир
  await page.tap('#btn-continue').catch(() => page.click('#btn-continue'));
  await page.waitForTimeout(4000);
  const resumed = await page.evaluate(() => { const G = window.IGRA; return { state: G.app.state, nodes: G.app.world.nodes.length, titleMode: document.body.classList.contains('title-mode') }; });
  check('«вернуться» восстанавливает мир', resumed.nodes > 0 && resumed.titleMode === false, JSON.stringify(resumed));

  // оффлайн: полная перезагрузка без сети
  await ctx.setOffline(true);
  let offlineOk = true, offlineErr = '';
  try { await page.reload({ waitUntil: 'load', timeout: 20000 }); } catch (e) { offlineOk = false; offlineErr = String(e.message).split('\n')[0]; }
  await page.waitForTimeout(3000);
  const offline = await page.evaluate(() => { const G = window.IGRA; return { igra: !!G, state: G && G.app ? G.app.state : null, nodes: G && G.app && G.app.world ? G.app.world.nodes.length : -1 }; }).catch(e => ({ igra: false, err: String(e.message) }));
  check('оффлайн: страница грузится без сети (SW-кэш)', offlineOk && offline.igra, offlineErr + ' ' + JSON.stringify(offline));
  await page.screenshot({ path: OUT + '/05-offline.png' });
  await ctx.setOffline(false);
  await page.waitForTimeout(1000);

  // HUD: сигила, язык, тишина
  const sigilOpened = await page.evaluate(() => { const b = document.getElementById('sigil-btn'); b.click(); const s = document.getElementById('sigil-screen'); return s.classList.contains('on'); });
  check('сигила открывается', sigilOpened);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: OUT + '/06-sigil.png' });
  const sigilClosed = await page.evaluate(() => { document.getElementById('sigil-close').click(); return !document.getElementById('sigil-screen').classList.contains('on'); });
  check('сигила закрывается', sigilClosed);
  const sigilAct = await page.evaluate(() => window.IGRA.Report.acts.sigil);
  check('открытие сигилы учтено как поступок', sigilAct > 0, 'sigil acts=' + sigilAct);

  const lang = await page.evaluate(() => { const before = { id: window.IGRA.Lang.id, html: document.documentElement.lang }; document.getElementById('lang-btn').click(); return { before, after: { id: window.IGRA.Lang.id, html: document.documentElement.lang, btn: document.getElementById('lang-btn').textContent } }; });
  check('переключение ru/en меняет язык', lang.before.id !== lang.after.id && lang.after.html === lang.after.id, JSON.stringify(lang));
  await page.screenshot({ path: OUT + '/07-en.png' });
  await page.evaluate(() => document.getElementById('lang-btn').click());

  const mute = await page.evaluate(() => { const before = window.IGRA.Audio.muted; document.getElementById('mute-btn').click(); const after = window.IGRA.Audio.muted; document.getElementById('mute-btn').click(); return { before, after }; });
  check('кнопка «тишина» переключает звук', mute.before !== mute.after, JSON.stringify(mute));

  check('итого: нет pageerror за сессию', pageErrors.length === 0, pageErrors.slice(0, 5).join(' | '));
  check('итого: нет console.error за сессию', errors.length === 0, errors.slice(0, 5).join(' | '));
  check('итого: нет проваленных запросов', failedReqs.length === 0, failedReqs.slice(0, 5).join(' | '));

  const failed = results.filter(r => !r.pass);
  fs.writeFileSync(OUT + '/summary.json', JSON.stringify({ utc: new Date().toISOString(), results, failed: failed.length }, null, 2));
  console.log('\nSMOKE ' + (failed.length === 0 ? 'PASS' : 'FAIL') + ': ' + (results.length - failed.length) + '/' + results.length);
  await browser.close();
  process.exit(failed.length === 0 ? 0 : 1);
})().catch(e => { console.error('SMOKE CRASH', e); process.exit(2); });
