var IGRA = IGRA || {};
(function (G) {
  "use strict";

  G.Game = function () {
    if (G.Quality && !G.Quality.ready) G.Quality.init();
    this.canvas = document.getElementById("stage");
    this.ctx = this.canvas.getContext("2d", { alpha: false });
    this.w = 0;
    this.h = 0;
    this.dpr = 1;
    this.state = "title";
    this.time = 0;
    this.dt = 0;
    this.last = 0;
    this.dna = new G.Dna();
    this.player = new G.Player();
    this.world = new G.World((Math.random() * 1e9) | 0);
    this.fx = new G.Particles((G.Quality && G.Quality.particles) || 420);
    this.floaters = new G.Floaters();
    this.cam = { x: 0, y: 0, z: 1, w: 0, h: 0, tx: 0, ty: 0 };
    this.input = {
      down: false,
      x: 0,
      y: 0,
      wx: 0,
      wy: 0,
      // точка экрана, где палец лёг на узел: по ней меряем срыв взгляда
      gsx: null,
      gsy: null,
      taps: [],
      lastTap: 0,
      rhythm: 0,
      wild: 0,
      moved: 0,
      keys: {}
    };
    this.slowMo = 0;
    this.glitch = 0;
    this.metaFlash = 0;
    this.metaT = 0;
    this.birthT = 0;
    this.hint = "";
    this.prevDnaSnap = null;
    this.dirtySave = 0;
    this.running = false;
    this.sky = false;
    this.gazeTarget = null;
  };

  G.Game.prototype.resize = function () {
    var w = window.innerWidth || (document.documentElement && document.documentElement.clientWidth) || (document.body && document.body.clientWidth) || 360;
    var h = window.innerHeight || (document.documentElement && document.documentElement.clientHeight) || (document.body && document.body.clientHeight) || 640;
    if (w < 10 || h < 10) return;

    var rawDpr = window.devicePixelRatio || 1;
    var dpr = rawDpr;
    if (G.Quality && G.Quality.dpr) dpr = Math.min(dpr, G.Quality.dpr);
    dpr = Math.min(dpr, 2.5);

    // Краской физического экрана владеет оболочка (зонд в MainActivity);
    // здесь мира достаточно: вьюпорт × dpr.
    var fit = "css";
    var sw = (window.screen && screen.width) || 0;
    var sh = (window.screen && screen.height) || 0;

    this.dpr = dpr;
    this.w = w;
    this.h = h;

    this.canvas.width = Math.max(1, Math.round(w * dpr));
    this.canvas.height = Math.max(1, Math.round(h * dpr));
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.cam.w = w;
    this.cam.h = h;

    var dbg = document.getElementById("fit-debug");
    if (dbg) {
      if (!dbg.__armed) {
        dbg.__armed = true;
        if ((location.search || "").indexOf("debug") >= 0 && document.body) {
          document.body.classList.add("debug");
        }
      }
      if (dbg.offsetParent === null && !document.body.classList.contains("debug")) {
        dbg.textContent = "";
      } else {
      var doc = document.documentElement;
      var line = w + "×" + h + " dpr" + rawDpr.toFixed(2) + " " + fit + "\n" +
        "inner=" + window.innerWidth + "×" + window.innerHeight +
        " doc=" + (doc ? doc.clientWidth : 0) + "×" + (doc ? doc.clientHeight : 0) +
        " scr=" + sw + "×" + sh + "\n" +
        "body=" + (document.body ? document.body.scrollWidth : 0) + "×" + (document.body ? document.body.scrollHeight : 0) +
        " vv=" + (window.visualViewport ? (Math.round(visualViewport.width) + "×" + Math.round(visualViewport.height) + "@" + visualViewport.scale.toFixed(2)) : "-") +
        "\n" + (window.IGRA_ANDROID_METRICS || "");
      dbg.textContent = line;
      }
    }
    if (!G.Renderer.ready) G.Renderer.init(w, h);
  };

  // Радиус прицела в МИРОВЫХ единицах, выведенный из экранных.
  //
  // Палец живёт на стекле и всегда накрывает одни и те же ~57 точек, а
  // прицел мерился в мире жёстким числом (58). Мировая единица меньше
  // экранной ровно во столько раз, во сколько отдалена камера: на
  // масштабе 0.38 те же 58 мировых единиц — это 26 точек экрана, вдвое
  // меньше подушечки. Человек: «при отдалении экрана только некоторые
  // ещё можно обвести», и «срывается на новых, куда прилетаешь по
  // стрелочке» — после перелёта камера как раз отъезжает.
  //
  // Делим на cam.z: сколько бы мир ни отъехал, палец прощает столько же
  // ТОЧЕК ЭКРАНА. Потолок нужен, иначе на сильном отдалении прицел
  // накрыл бы пол-берега и хватал не то, во что целились.
  G.Game.prototype.aimRadius = function (screenPad) {
    var z = this.cam && this.cam.z > 0.05 ? this.cam.z : 1;
    return Math.min(screenPad / z, screenPad * 3.2);
  };

  G.Game.prototype.screenToWorld = function (x, y) {
    return {
      x: this.cam.x + (x - this.cam.w / 2) / this.cam.z,
      y: this.cam.y + (y - this.cam.h / 2) / this.cam.z
    };
  };

  G.Game.prototype.bind = function () {
    var self = this;
    var el = this.canvas;
    // Зонд оболочки: поймать касание в любой точке, не трогая игру.
    document.addEventListener("touchstart", function (e) {
      if (!window.IGRA_TOUCH_EAT) return;
      var t = e.touches ? e.touches[0] || e.changedTouches[0] : e;
      if (t) window.IGRA_TOUCH_LAST = t.clientX + "," + t.clientY;
    }, { capture: true, passive: true });
    function pos(e) {
      var t = e.touches ? e.touches[0] || e.changedTouches[0] : e;
      var r = el.getBoundingClientRect();
      // One uniform mapping: painted rect -> logical CSS size. Native WebView
      // touch is already in CSS space, so the ratio is 1 there; if a device
      // reports another space, the ratio absorbs it — no threshold crutches.
      var cssW = el.offsetWidth || r.width || 1;
      var cssH = el.offsetHeight || r.height || 1;
      var rw = r.width || cssW;
      var rh = r.height || cssH;
      var x = (t.clientX - r.left) * (cssW / rw);
      var y = (t.clientY - r.top) * (cssH / rh);
      return { x: x, y: y };
    }
    function down(e) {
      // Зонд целостности экрана (MainActivity): синтетическое касание в углу.
      // Съедаем его до игры и отвечаем сырыми координатами.
      if (window.IGRA_TOUCH_EAT) {
        var pt = e.touches ? e.touches[0] || e.changedTouches[0] : e;
        if (pt) window.IGRA_TOUCH_LAST = pt.clientX + "," + pt.clientY;
        if (e.cancelable) e.preventDefault();
        return;
      }
      e.preventDefault();
      G.Audio.unlock();
      if (G.Report) G.Report.gestureStart();
      var p = pos(e);
      self.input.down = true;
      self.input.x = p.x;
      self.input.y = p.y;
      var w = self.screenToWorld(p.x, p.y);
      self.input.wx = w.x;
      self.input.wy = w.y;
      self.onDown();
    }
    function move(e) {
      // Чужое движение — не наше дело: без этого прокрутка экрана
      // рассказа и поля «рот» подёргивалась вслед за камерой берега.
      if (!self.input.down) return;
      // Своё — обязаны занять, иначе Android через ~300 мс решит, что это
      // прокрутка, и оборвёт жест системным touchcancel. Именно так
      // умирало удержание: взгляд рвался на полпути к рождению (1.35 с),
      // и человек второй релиз подряд говорил «новые точки не
      // обводятся». `touch-action: none` на холсте тут не спасает —
      // touchmove слушается на ОКНЕ, где правило холста не действует.
      if (e.cancelable) e.preventDefault();
      var p = pos(e);
      self.input.x = p.x;
      self.input.y = p.y;
      var w = self.screenToWorld(p.x, p.y);
      self.input.wx = w.x;
      self.input.wy = w.y;
    }
    function up(e) {
      // preventDefault только на своём касании. Глобальный `touchend` с
      // preventDefault съедал клик ДО того, как браузер его создаст:
      // палец на кнопке «рассказать» опускался, отпускался — и ничего
      // не происходило, потому что синтетический click не рождался
      // вовсе. Кнопки перестали работать все разом, включая старые.
      if (self.input.down && e.cancelable) e.preventDefault();
      if (!self.input.down) return;
      var p = pos(e);
      self.input.x = p.x;
      self.input.y = p.y;
      self.onUp();
      self.input.down = false;
    }
    // Игра слушает ХОЛСТ, а не окно. На окне она перехватывала касания
    // интерфейса — кнопок, поля рта, прокрутки рассказа, — и они молчали.
    // Движение и отпускание всё же ловим на окне: палец, начавший жест на
    // берегу, волен уйти за край холста, и взгляд не должен рваться.
    // Отличаем своё от чужого по `input.down`.
    el.addEventListener("mousedown", down);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    el.addEventListener("touchstart", down, { passive: false });
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", up, { passive: false });
    // touchcancel — не отпускание. Система шлёт его, когда САМА решила
    // забрать жест (звонок, шторка, ложно распознанная прокрутка). Вести
    // его в onUp значило считать, что человек убрал палец: удержание
    // обрывалось, узел не рождался, а по коду всё выглядело исправно.
    // Гасим тихо, без побочных действий onUp.
    window.addEventListener("touchcancel", function (e) {
      // Если палец ещё на стекле — жест продолжается. Android иногда
      // шлёт cancel по своим соображениям (ложно распознал прокрутку,
      // мигнула шторка), а рука никуда не делась: обрывать удержание
      // из-за системного сомнения — значит терять узел на 1.2 секунде
      // из 1.35. Проверяем факт, а не намерение системы.
      var stillDown = e && e.touches && e.touches.length > 0;
      if (stillDown) return;
      if (self.player.gaze && G.Report) {
        G.Report.gestureTorn("system", self.player.gazeT);
      }
      self.input.down = false;
      self.player.gaze = null;
      self.gazeTarget = null;
      self.player.gazeT = 0;
      self.input.hold = 0;
      self.input.hx = null;
    }, { passive: true });
    window.addEventListener("keydown", function (e) {
      self.input.keys[e.code] = true;
      if (e.code === "Space") {
        e.preventDefault();
        G.Audio.unlock();
        self.doPulse();
      }
      if (e.code === "Escape" || e.code === "KeyI") G.UI.toggleSigil(self);
      if (e.code === "KeyC") G.Organs.toggleSky(self);
      if (e.code === "KeyM") {
        var muted = G.Audio.toggleMute();
        G.UI.setMute(muted);
      }
    });
    window.addEventListener("keyup", function (e) {
      self.input.keys[e.code] = false;
    });
    window.addEventListener("resize", function () {
      self.resize();
    });
    window.addEventListener("orientationchange", function () {
      setTimeout(function () {
        self.resize();
      }, 100);
    });
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", function () {
        self.resize();
      });
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        self.save();
      } else if (self.state === "play" && G.Memory.leftAt) {
        var nap = (Date.now() - G.Memory.leftAt) / 3600000;
        if (nap > 0.04) {
          var report = G.Memory.sleepWorld(self, Math.min(nap, 8));
          if (G.Report) G.Report.noteNight(report);
          if (report.lost || report.blooms) {
            G.Voice.say(report.lost ? "nightLost" : "nightBloom", true);
          }
        }
      }
    });
  };

  G.Game.prototype.onDown = function () {
    if (this.state === "title") {
      // Тап в пустоту рождает только того, кто ещё не жил. У вернувшегося
      // (сейв есть) случайное касание титула больше не стирает прошлую
      // жизнь: раньше ЛЮБОЙ тап рождал заново, и через 8 секунд новая
      // жизнь перезаписывала сейв — человек писал «не сохранилось», хотя
      // сейв был жив. Вернуться — кнопка «вернуться»; начать заново —
      // кнопка «родиться» (осознанный жест).
      if (!G.Save.exists()) this.startBirth();
      return;
    }
    if (G.Voice.visible) G.Voice.skip();
    var now = this.time;
    var dtap = now - this.input.lastTap;
    this.input.lastTap = now;
    this.input.taps.push(now);
    if (this.input.taps.length > 8) this.input.taps.shift();
    this.dna.taps++;
    if (G.Report) G.Report.act("taps");
    // Ходьба — тоже жест, и он НЕ промах. `input.moved` копился с начала
    // сессии и не обнулялся никогда, поэтому отличить «повёл игрока» от
    // «ткнул мимо» игра не умела: отчёт свалил 44 касания в «пустоту»,
    // хотя пальцем в этой игре ходят. Меряем ход внутри одного касания.
    this.input.moved = 0;

    if (dtap < 0.28 && this.state === "play") {
      // Пульс — не промах. Второй тап двойного касания помечается своим
      // исходом, иначе onUp запишет его «в пустоту», а первый тап уже
      // так записан — отчёт дважды врал про руку на каждый пульс.
      if (G.Report) G.Report.gesturePulse();
      this.doPulse();
      return;
    }

    // rhythm / wild
    if (this.input.taps.length >= 3) {
      var ints = [];
      for (var i = 1; i < this.input.taps.length; i++) {
        ints.push(this.input.taps[i] - this.input.taps[i - 1]);
      }
      var avg = 0;
      for (var j = 0; j < ints.length; j++) avg += ints[j];
      avg /= ints.length;
      var varc = 0;
      for (var k = 0; k < ints.length; k++) varc += Math.abs(ints[k] - avg);
      varc /= ints.length;
      this.input.rhythm = G.clamp(1 - varc / 0.35, 0, 1);
      this.input.wild = G.clamp(varc / 0.4, 0, 1);
    }

    if (this.sky) {
      var star = G.Organs.nearestStar(this.world, this.input.x, this.input.y, this.cam, 48);
      if (star) {
        G.Audio.crystallize(G.KIND_TRAIT[star.kind] || this.dna.dominant());
        this.fx.burst(star.ox || this.player.x, star.oy || this.player.y, 20, star.c, 50, 0.8);
        if (star.ox != null) {
          this.player.x = star.ox;
          this.player.y = star.oy;
        }
        G.Voice.sayText(G.verseText(star.verse) ||
          (G.Lang.t("starOf") + " " + G.kindName(star.kind) + "."), true);
        G.Organs.toggleSky(this, false);
      }
      return;
    }

    if (this.state === "play" || this.state === "birth") {
      var crack = G.Organs.nearestCrack(this.world, this.input.wx, this.input.wy, this.aimRadius(36));
      if (crack) {
        if (G.Report) G.Report.act("laws");
        G.Organs.applyLaw(this, crack);
        this.dna.feed("chaos", 0.03);
        return;
      }
      // Подушечка пальца накрывает около 9 мм — это ~57 точек холста, а
      // прицел был 48 от ЦЕНТРА узла. Человек целился точнее, чем вообще
      // видит палец. Меряем теперь от края узла (см. world.nearestNode) и
      // даём радиус по пальцу, а не по глазу.
      var being = G.Organs.nearestBeing(this.world, this.input.wx, this.input.wy, this.aimRadius(48));
      var node = this.world.nearestNode(this.input.wx, this.input.wy, this.aimRadius(58));
      var boss = this.world.boss;
      var bossNear = boss && G.dist(this.input.wx, this.input.wy, boss.x, boss.y) < boss.r + 18;
      if (being && (!node || G.dist2(this.input.wx, this.input.wy, being.x, being.y) < G.dist2(this.input.wx, this.input.wy, node.x, node.y))) {
        this.player.gaze = null;
        this.gazeTarget = being;
        this.player.gazeT = 0;
        this.dna.feed("empathy", 0.012);
      } else if (bossNear) {
        this.gazeTarget = boss;
        this.player.gaze = null;
        this.player.gazeT = 0;
      } else if (node) {
        this.gazeTarget = null;
        if (G.Report) G.Report.act("gazes");
        this.player.gaze = node;
        this.player.gazeT = 0;
        this.input.gsx = this.input.x;
        this.input.gsy = this.input.y;
        this.dna.feed("contemplation", 0.01);
        if (this.dna.gazes === 0) G.Voice.say("firstGaze");
      } else {
        var bloom = this.world.nearestBloom(this.input.wx, this.input.wy, this.aimRadius(44));
        if (bloom) {
          var trait2 = (bloom.verse && bloom.verse.trait) || this.dna.dominant() || "contemplation";
          var f2 = (G.TRAIT_NOTE && G.TRAIT_NOTE[trait2]) || 440;
          if (G.Audio && G.Audio.pluck) G.Audio.pluck(f2);
          else if (G.Audio && G.Audio.tone) G.Audio.tone(f2, 0.4, 0.08, "triangle");
          if (G.Voice && bloom.verse && (!this._bloomSaid || this.time - this._bloomSaid > 2.9)) {
            this._bloomSaid = this.time;
            G.Voice.sayText(G.verseText(bloom.verse));
          }
          this.fx.ring(bloom.x, bloom.y, 12, bloom.c || [170,150,240], bloom.r+6, 0.4);
          if (G.Report) G.Report.act("blooms");
          return;
        }
        this.player.gaze = null;
        this.gazeTarget = null;
        this.fx.spawn({
          x: this.input.wx,
          y: this.input.wy,
          life: 0.5,
          r: 3,
          c: this.dna.blendRgb(),
          vx: 0,
          vy: 0
        });
        if (this.dna.taps === 1) G.Voice.say("firstTouch");
      }
    }
  };

  G.Game.prototype.onUp = function () {
    // Отпустил, ничего не вырастив и даже не взяв взгляд — жест ушёл в
    // пустоту. Таких «пустых» касаний много там, где человек не понимает,
    // почему не получается.
    // «Отпустил сам» — не срыв, если узел уже родился: gazeT обнуляется
    // при рождении, а взгляд остаётся на живом узле, и человек просто
    // убирает палец. Считать это обрывом значит утопить настоящие срывы
    // в шуме: живой прогон дал 58 «срывов» на 56 рождений.
    if (G.Report) {
      if (this.player.gaze && this.player.gazeT > 0.15 &&
          this.player.gaze.state === "unformed") {
        G.Report.gestureTorn("let", this.player.gazeT);
      } else if (!this.player.gaze && !this.gazeTarget) {
        // Палец, который вёл игрока хотя бы треть секунды (0.30с), сделал своё дело:
        // это шаг, а не промах мимо узла.
        // Но только если у этого жеста ещё нет исхода. Срыв посреди жеста
        // (палец ушёл, узел исчез, смена кожи) уже записан как «сорвалось»
        // и погасил взгляд — не надо тот же тык засчитывать ещё и сюда,
        // иначе воронка даёт два исхода на одно касание.
        if (G.Report._gDone) return;
        if ((this.input.moved || 0) > 0.24) G.Report.gestureWalk();
        else G.Report.gestureEmpty();
      }
    }
    if (this.gazeTarget && this.gazeTarget.temper && this.player.gazeT < 1.1) {
      var b = this.gazeTarget;
      if (this.dna.dominant() === "aggression") {
        b.fear = Math.min(1, b.fear + 0.35);
        b.bond = Math.max(0, b.bond - 0.12);
        G.Organs.remember(b, "struck");
        this.dna.feed("aggression", 0.015);
        this.fx.burst(b.x, b.y, 8, [255, 80, 90], 40, 0.3);
        if (b.isYesterday) G.Voice.say("yesterdayHit");
      } else {
        b.bond = Math.min(1, b.bond + 0.08);
        G.Organs.remember(b, "touched");
        this.dna.feed("empathy", 0.012);
        G.Audio.pluck(G.TRAIT_NOTE.empathy);
      }
    } else if (this.player.gaze && this.player.gazeT < 1.35) {
      var n = this.player.gaze;
      n.gesture.hit += 0.35;
      this.dna.feed("aggression", 0.02);
      G.Audio.pluck(220 + Math.random() * 200);
      this.fx.burst(n.x, n.y, 6, n.color(), 30, 0.35);
      if (n.kind === "thorn" && n.state === "alive") {
        this.world.hitWound(n.x, n.y, 40, 0.5, this.fx);
      }
      if (n.kind === "tone" && n.state === "alive") G.Organs.playTone(this, n);
    }
    this.player.gaze = null;
    this.gazeTarget = null;
    this.player.gazeT = 0;
  };

  G.Game.prototype.doPulse = function () {
    if (this.state !== "play" && this.state !== "birth") return;
    if (this.player.pulseT > 0) return;
    // Пульс работает и без сил. Голод забирает силу, а не право драться —
    // тот же закон, что у взгляда (0.4.60). Раньше при энергии < 16 пульс
    // блокировался, а босс съедал энергию до нуля: порочный круг — нельзя
    // пульсовать → нельзя убить босса → он ест дальше. Отчёт 2.9: босс 86%
    // силы, «падала до 0», сработало 18 пульсов из 99 попыток. Энергия ниже
    // нуля не уходит (Math.max), а восстанавливается в update как обычно.
    if (this.player.energy < 16) G.Voice.say("lowEnergy");
    this.player.energy = Math.max(0, this.player.energy - 16);
    if (G.Report) { G.Report.noteDrain("pulse", 16); G.Report.noteEnergy(this.player.energy); }
    this.player.pulseT = 0.55;
    this.dna.pulses++;
    if (G.Report) G.Report.act("pulses");
    this.dna.feed(this.dna.dominant(), 0.015);
    G.Director.pulseEffect(this);
    if (G.Haptic) G.Haptic.play("pulse");
    G.Voice.say("pulse");
  };

  G.Game.prototype.startBirth = function () {
    if (this.state !== "title") return;
    this.state = "birth";
    this.birthT = 0;
    // Новая жизнь — новый отчёт. Иначе касания и жесты из предыдущего
    // сеанса в той же вкладке перетекали бы в свежую берег.
    if (G.Report) G.Report.reset();
    document.body.classList.remove("title-mode");
    var screen = document.getElementById("title-screen");
    if (screen) screen.classList.add("out");
    setTimeout(function () {
      var ts = document.getElementById("title-screen");
      if (ts) ts.style.display = "none";
    }, 1200);
    G.Audio.setHeart(true, 56);
    G.Voice.say("boot", true);
    setTimeout(function () {
      G.Voice.say("birth", true);
    }, 3200);
    // Новая жизнь начинается с нуля — включая часы мира.
    //
    // `game.time` не обнулялся при рождении: он приходил из прошлого
    // сейва и копился между жизнями. Отчёт человека это поймал —
    // «сыграно 13.1 мин» и при этом «судьба: become», хотя порог
    // развилки 20 минут. Он начал НОВУЮ игру, а часы шли из старой:
    // финал пришёл к нему на тринадцатой минуте первой же жизни.
    // Всё, что меряется временем мира (судьба, ритм перерождений,
    // кулдауны голоса), считало его старше, чем он есть.
    this.time = 0;
    this.dna.age = 0;
    G.Fate.offered = false;
    G.Fate.chosen = "";
    this._skyNudged = false;
    this._skyFull = false;
    this._sigilNudged = false;
    this._skyNudgedAt = 0;
    this._bloomSaid = -999;
    this._metaMemory = 0;
    this.world.birthShore(this.player, this.dna);
    this.prevDnaSnap = G.Director.snapshot(this.dna);
    G.Memory.firstAt = Date.now();
    G.Memory.sessions = 1;
    G.Memory.setFromDna(this.dna, true);
    G.UI.paintSeason();
    G.UI.hint(G.Lang.t("hintBirth"));
    if (G.Haptic) G.Haptic.play("meta");
  };

  G.Game.prototype.enterPlay = function () {
    this.state = "play";
    G.Audio.setHeart(false);
    G.Voice.say("firstNode");
    G.UI.hint(G.Lang.t("hintBirth2"));
    setTimeout(function () {
      G.UI.hint("");
    }, 6000);
    this.save();
  };

  G.Game.prototype.beginMeta = function () {
    var self = this;
    this.state = "meta";
    this.metaT = 0;
    this.metaFlash = 1;
    G.Audio.metamorphosis(this.dna);
    G.Voice.say("meta", true);
    G.UI.hint("");
  };

  G.Game.prototype.finishMeta = function () {
    // Рука отпускает старый мир.
    //
    // Перерождение стирает берег и уносит узлы, а взгляд оставался
    // прицеплен к узлу, которого больше нет: игрок держал палец, кольцо
    // на экране жило, gazeT тикал — и ничего не рождалось никогда,
    // потому что узел уже не в мире. Человек: «после отдаления начинает
    // срываться, а потом вообще не реагирует» — вот это «потом»,
    // отдаление и есть метаморфоза. Выйти можно было только отпустив
    // палец, а он держал, потому что игра показывала, что держит.
    //
    // Целимся заново после смены кожи — как и всё остальное в новом мире.
    if (this.player.gaze && G.Report) G.Report.gestureTorn("meta", this.player.gazeT);
    this.player.gaze = null;
    this.gazeTarget = null;
    this.player.gazeT = 0;
    this.input.hold = 0;
    this.input.hx = null;
    this.input.hy = null;

    var metaMemory = this.world.metamorphose(this.player, this.dna);
    // Перерождение — самая крупная потеря в игре: у того, кто только
    // сеет, оно уносит весь берег до последнего узла, трижды за сессию,
    // и раньше об этом не говорилось ни слова. Игра называет, что стало
    // с садом, — и тем самым называет разницу между сеятелем и садовником.
    var survived = 0;
    for (var si = 0; si < this.world.nodes.length; si++) {
      if (this.world.nodes[si].state === "alive") survived++;
    }
    this._metaKept = survived;
    this._metaMemory = metaMemory;
    this.prevDnaSnap = G.Director.snapshot(this.dna);
    this.state = "play";
    this.metaFlash = 0.6;
    G.Voice.sayText(
      (G.Lang && G.Lang.id === "en" ? "now you are " : "теперь ты — ") + this.dna.name() + ".",
      true
    );
    var self = this;
    // не поверх имени: вторая правда приходит следом
    setTimeout(function () {
      // Память метаморфозы — третья правда: даже когда удержать было
      // нечего (сеятель), новый берег помнит его породы цветами.
      // Сеятелю это честнее, чем «я пришла налегке»: он не пуст,
      // он помнит. Садовнику хватает metaKept — его память видна.
      if (self._metaMemory > 0 && self._metaKept <= 0) G.Voice.say("metaMemory");
      else G.Voice.say(self._metaKept > 0 ? "metaKept" : "metaBare");
    }, 4200);
    this.save();
  };

  G.Game.prototype.update = function (dt) {
    if (this.slowMo > 0) {
      this.slowMo -= dt;
      dt *= 0.42;
    }
    this.time += dt;
    this.dt = dt;
    this.glitch = Math.max(0, this.glitch - dt);
    this.metaFlash = Math.max(0, this.metaFlash - dt * 0.55);
    G.Shake.update(dt);
    G.Voice.update(dt);
    this.fx.update(dt);
    this.floaters.update(dt);

    if (this.state === "title") {
      this.player.x = Math.sin(this.time * 0.3) * 6;
      this.player.y = Math.cos(this.time * 0.22) * 4;
      this.cam.x = this.player.x;
      this.cam.y = this.player.y;
      G.Audio.update(dt, this.dna, this.state, 0);
      return;
    }

    if (this.state === "meta") {
      this.metaT += dt;
      this.cam.z = G.lerp(this.cam.z, 0.7, 1 - Math.pow(0.08, dt));
      if (this.metaT > 3.2) this.finishMeta();
      G.Audio.update(dt, this.dna, this.state, 0);
      return;
    }

    if (this.state === "release") {
      this.releaseT = (this.releaseT || 0) + dt;
      this.cam.z = G.lerp(this.cam.z, 0.38, 1 - Math.pow(0.06, dt));
      this.metaFlash = Math.max(this.metaFlash, 0.08);
      if (this.releaseT > 14) {
        G.UI.toggleSigil(this, true);
        // Игра кончилась — самое время спросить, каково это было. Один
        // раз за исход: человек может закрыть отчёт и вернуться к сигиле.
        if (!this._askedEnd) {
          this._askedEnd = true;
          var selfG = this;
          setTimeout(function () {
            G.UI.toggleSigil(selfG, false);
            G.UI.openReport(selfG);
            // «Отпустить» — это конец, а не застревание. Раньше после
            // закрытия отчёта игрок оставался в полумёртвом мире (камера
            // 0.38, ничего не происходит) и справедливо писал «игра не
            // заканчивается». Теперь отчёт закрыт — и берег возвращается
            // на титул: можно родиться заново или стать игрой.
            G.UI.afterReport = function () {
              selfG.state = "title";
              document.body.classList.add("title-mode");
              var ts = document.getElementById("title-screen");
              if (ts) {
                ts.style.display = "";
                ts.classList.remove("out");
              }
              var ta = document.getElementById("title-actions");
              if (ta) ta.classList.add("on");
              var word = document.getElementById("word");
              if (word) word.classList.add("on");
              var tag = document.getElementById("tag");
              if (tag) tag.classList.add("on");
            };
          }, 2600);
        }
      }
      G.Audio.update(dt, this.dna, this.state, 0);
      return;
    }

    if (this.sky) {
      this.cam.z = G.lerp(this.cam.z, 0.42, 1 - Math.pow(0.06, dt));
      G.Audio.update(dt, this.dna, this.state, 0);
      return;
    }

    this._move(dt);
    this._gaze(dt);
    this._walkTones(dt);

    this.player.energy = G.clamp(
      this.player.energy +
        dt * (7 + this.dna.get("harmony") * 4 + this.dna.get("contemplation") * 3),
      0,
      this.player.maxEnergy
    );
    if (this.player.pulseT > 0) this.player.pulseT -= dt;

    this.world.update(dt, this.player, this.dna, this.fx, this);
    G.Director.observe(dt, this);
    if (G.Fate.ready(this) && this.state === "play" && this.dna.age > 8) {
      G.Fate.offer(this);
    }
    // Подсказка неба и сигилы для молчуна: отчёт 0.4.80 — 61 выращено, небо 0, сигила 0.
    // Звезды уже есть, но архив невидим, пока не откроешь. Один раз за жизнь,
    // тихо, после того как мир уже есть что показать.
    if (!this._skyNudged && this.state === "play" && G.Report && G.Report.acts.sky === 0 && this.world.discovered > 28 && this.time > 325 && this.world.stars.length > 4) {
      this._skyNudged = true;
      this._skyNudgedAt = this.time;
      G.Voice.say("sky");
    }
    // Второй, настойчивый зов: звёзд уже много (созвездие набилось), а
    // человек так и не поднял взгляд — отчёт 2.3: 118 звёзд, небо открыто
    // 0 раз. Небо само напрашивается: голосом и мягкой пульсацией кнопки
    // в углу. Один раз за жизнь, не тараторит.
    if (!this._skyFull && this.state === "play" && G.Report && G.Report.acts.sky === 0 && this.world.stars.length > 50 && this.time > 420) {
      this._skyFull = true;
      G.Voice.say("skyFull");
      var skyBtn = document.getElementById("sky-btn");
      if (skyBtn) skyBtn.classList.add("invite");
    }
    if (!this._sigilNudged && this.state === "play" && G.Report && G.Report.acts.sigil === 0 && this.world.discovered > 22 && this.time > 485 && this._skyNudged && this.time - (this._skyNudgedAt || 0) > 90) {
      this._sigilNudged = true;
      if (G.Voice) G.Voice.sayText(G.Lang.t("skyLine") + " — " + G.Lang.t("sigil"));
    }

    if (this.state === "birth") {
      this.birthT += dt;
      if (this.birthT > 22 || this.world.discovered > 0) this.enterPlay();
    }

    // camera
    this.cam.tx = this.player.x + this.player.vx * 0.12;
    this.cam.ty = this.player.y + this.player.vy * 0.12;
    this.cam.x = G.lerp(this.cam.x, this.cam.tx, 1 - Math.pow(0.04, dt));
    this.cam.y = G.lerp(this.cam.y, this.cam.ty, 1 - Math.pow(0.04, dt));
    var tz = 1 + Math.sin(this.time * 0.6) * 0.012;
    if (this.dna.get("contemplation") > 0.4) tz *= 1.05;
    this.cam.z = G.lerp(this.cam.z, tz, 1 - Math.pow(0.08, dt));

    // ambient motes
    if (G.chance(dt * 8)) {
      var a = Math.random() * G.TAU;
      var d = 40 + Math.random() * 260;
      this.fx.spawn({
        x: this.player.x + Math.cos(a) * d,
        y: this.player.y + Math.sin(a) * d,
        vx: G.rand(-8, 8),
        vy: G.rand(-8, 8),
        life: 2 + Math.random() * 3,
        r: 0.8 + Math.random(),
        c: this.dna.blendRgb(),
        a: 0.4
      });
    }

    // закон слышно: пока он висит над миром, гул уведён в сторону
    if (G.Audio.setLaw) {
      var act = this.world.active;
      G.Audio.setLaw(act && act.length ? Math.min(1, act[act.length - 1].left / 6) : 0);
    }
    G.Audio.update(dt, this.dna, this.state, this.world.tide, this.world);

    this.dirtySave += dt;
    if (this.dirtySave > 8) {
      this.dirtySave = 0;
      this.save();
    }
  };

  G.Game.prototype._move = function (dt) {
    var ax = 0;
    var ay = 0;
    var keys = this.input.keys;
    if (keys.KeyW || keys.ArrowUp) ay -= 1;
    if (keys.KeyS || keys.ArrowDown) ay += 1;
    if (keys.KeyA || keys.ArrowLeft) ax -= 1;
    if (keys.KeyD || keys.ArrowRight) ax += 1;

    if (this.input.down && !this.player.gaze) {
      var dx = this.input.wx - this.player.x;
      var dy = this.input.wy - this.player.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d > 8) {
        ax += dx / d;
        ay += dy / d;
        this.input.moved += dt;
      }
    }

    var len = Math.sqrt(ax * ax + ay * ay);
    if (len > 1) {
      ax /= len;
      ay /= len;
    }
    if (this.world.invertMove > 0) {
      ax = -ax;
      ay = -ay;
    }
    var acc = 240 + this.dna.get("curiosity") * 60 + this.dna.get("chaos") * 40;
    this.player.vx += ax * acc * dt;
    this.player.vy += ay * acc * dt;
    var drag = Math.pow(0.06, dt);
    this.player.vx *= drag;
    this.player.vy *= drag;
    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;
    var lim = this.world.bounds;
    this.player.x = G.clamp(this.player.x, -lim, lim);
    this.player.y = G.clamp(this.player.y, -lim, lim);
    if (len > 0.1) this.player.facing = Math.atan2(ay, ax);
  };

  G.Game.prototype._walkTones = function () {
    if (this.input.rhythm < 0.4 && this.dna.get("harmony") < 0.22) return;
    for (var i = 0; i < this.world.nodes.length; i++) {
      var n = this.world.nodes[i];
      if (n.kind !== "tone" || n.state !== "alive") continue;
      if (G.dist(this.player.x, this.player.y, n.x, n.y) < n.r + 16) {
        if (!n._played || this.time - n._played > 0.8) {
          n._played = this.time;
          G.Organs.playTone(this, n);
        }
      }
    }
  };

  G.Game.prototype._gaze = function (dt) {
    if (!this.input.down) return;

    // Взгляд можно ПОЙМАТЬ на ходу, а не только в миг касания.
    //
    // Человек: «новые планеты не обводятся, а продолжаешь движение».
    // Так и было. Захват решался ровно один раз, в onDown. Но играют
    // иначе: опускают палец на пустоту, ведут игрока к узлу и, дойдя,
    // ОСТАНАВЛИВАЮТ палец на нём, не отрывая. В этот момент палец лежит
    // прямо на узле — а игра считает, что он всё ещё тянет ходьбу, и
    // проносит игрока сквозь. Замер: палец в ОДНОЙ точке от центра узла,
    // четыре секунды без движения — захвата нет, узел не рождается.
    // Отпустить и ткнуть заново человек не догадывается, да и не должен.
    //
    // Условие ловли — не «палец рядом», а «палец ЗАМЕР рядом»: иначе
    // жест ходьбы через плотный берег цеплялся бы за каждый встречный
    // узел. Замирание на 0.18 с — уже намерение, а не транзит.
    if (!this.player.gaze && !this.gazeTarget && !this.sky &&
        (this.state === "play" || this.state === "birth")) {
      // Замирание меряем в МИРЕ. Экранная мера кажется честнее (палец же
      // живёт на стекле), но ломает главный жест: человек ведёт игрока к
      // узлу, палец при этом движется по экрану ВСЁ ВРЕМЯ, и замирания
      // не наступает никогда. Проверено — сценарий «довёл и замер»
      // умирает. В мире же палец, наведённый на узел, стоит над ним
      // неподвижно, пока игрок подходит.
      var hx = this.input.wx, hy = this.input.wy;
      // NaN ядовит и заразен. Стоит ему попасть в hx, как всякое
      // сравнение с ним даёт false (`NaN > 14` — ложь), ветка «палец
      // сдвинулся» умирает НАВСЕГДА, hx уже никогда не переписывается, и
      // рука перестаёт слушаться до перезапуска. Человек: «после
      // отдаления начинает срываться, а потом вообще не реагирует» —
      // вот это «потом». Мировая точка считается через cam.z, и в
      // переходных состояниях (метаморфоза, небо, смена берега) она
      // успевает стать NaN на кадр-другой. Одного кадра достаточно.
      if (!isFinite(hx) || !isFinite(hy)) {
        this.input.hx = null;
        this.input.hold = 0;
        return;
      }
      if (this.input.hx == null || !isFinite(this.input.hx) ||
          G.dist(hx, hy, this.input.hx, this.input.hy) > 14) {
        this.input.hx = hx;
        this.input.hy = hy;
        this.input.hold = 0;
      } else {
        this.input.hold = (this.input.hold || 0) + dt;
        // 0.3 с, а не 0.18: ведя палец, человек то и дело замирает на
        // доли секунды — при коротком пороге игра «залипала» на каждом
        // встречном узле и переставала слушаться. Замер поймал это как
        // побочное: взгляд был захвачен 29% всех кадров, игрок почти не
        // двигался, и существа никогда не отходили от него.
        if (this.input.hold > 0.3) {
          var late = this.world.nearestNode(this.input.wx, this.input.wy, this.aimRadius(58));
          // И только то, до чего человек ДОШЁЛ. Обводят вблизи; ловить
          // узел на другом конце экрана — значит отнимать управление.
          if (late && !late.dead &&
              G.dist(this.player.x, this.player.y, late.x, late.y) < 190) {
            this.player.gaze = late;
            this.player.gazeT = 0;
            this.input.gsx = this.input.x;
            this.input.gsy = this.input.y;
            this.input.hold = 0;
            this.dna.feed("contemplation", 0.01);
          }
        }
      }
    }

    if (this.gazeTarget && this.gazeTarget.temper) {
      var b = this.gazeTarget;
      if (b.dead || G.dist(this.input.wx, this.input.wy, b.x, b.y) > 70) {
        this.gazeTarget = null;
        return;
      }
      this.player.gazeT += dt;
      b.bond = Math.min(1, b.bond + dt * 0.2);
      b.fear = Math.max(0, b.fear - dt * 0.2);
      if (this.player.gazeT >= 1.05) {
        if (!b.named && b.bond > 0.45) {
          G.Organs.nameBeing(b);
          this.floaters.add(b.x, b.y - 18, G.beingName(b), G.TRAIT_COLOR.empathy);
        }
        if (b.isYesterday) {
          G.Voice.say("yesterday", true);
          setTimeout(function () {
            G.Voice.sayText(G.Organs.speakBeing(b), true);
          }, 2600);
        } else {
          G.Voice.sayText(G.Organs.speakBeing(b), true);
        }
        G.Organs.remember(b, "gazed");
        this.dna.feed("empathy", 0.03);
        this.player.gazeT = 0;
        this.gazeTarget = null;
      }
      return;
    }
    if (this.gazeTarget && this.gazeTarget.maxHp) {
      this.player.gazeT += dt;
      if (this.player.gazeT > 1.2) {
        // Рана отказывает каждые 1.2 секунды, пока в неё смотришь, — но
        // говорит об этом раз в минуту. Иначе одна упрямая рана даёт
        // сотню одинаковых реплик за сессию и заглушает всё остальное.
        // Кулдаун общий, а не на каждой ране. Он стоял на самой ране
        // (`gazeTarget._refuseSaid`), и это ловушка: ран на берегу много,
        // у каждой свой счётчик — реплика звучала пятнадцать раз за
        // двадцать минут, чаще всех прочих, формально не нарушая «раз в
        // минуту». Молчание должно считаться по РЕПЛИКЕ, а не по тому,
        // кто её произносит.
        var tw = G.now();
        if (!this._refuseSaid || tw - this._refuseSaid > 110) {
          this._refuseSaid = tw;
          this.gazeTarget._refuseSaid = tw;
          // У раны нет собственного имени — и не должно быть: она не
          // существо, а то, чем стал брошенный узел. Раньше здесь стояло
          // `gazeTarget.name`, поля которого у G.Wound нет вовсе, и Игра
          // вслух говорила «undefined помнит каждый отказ» — пятнадцать
          // раз за двадцать минут, чаще любой другой реплики. Замер
          // болтливости это видел как «самая частая строка», но саму
          // строку никто не читал. Рана называет породу, из которой
          // родилась: «рана искры помнит каждый отказ».
          G.Voice.sayText(G.kindName(this.gazeTarget.from || "wound") + " " +
            G.Lang.t("refuseMem"));
        }
        this.gazeTarget.weak = 2.5;
        this.player.gazeT = 0;
      }
      return;
    }
    if (!this.player.gaze) return;
    var n = this.player.gaze;
    // `dead` ловит убитое, но не ловит ИСЧЕЗНУВШЕЕ: метаморфоза заменяет
    // список узлов целиком, и старый узел остаётся живым объектом, просто
    // больше не принадлежит миру. Взгляд держался за такой призрак,
    // кольцо горело, время тикало — и не рождалось ничего никогда.
    // Держаться можно только за то, что есть на берегу.
    if (n.dead || this.world.nodes.indexOf(n) < 0) {
      if (G.Report) G.Report.gestureTorn(n.dead ? "died" : "gone", this.player.gazeT);
      this.player.gaze = null;
      this.player.gazeT = 0;
      return;
    }
    // Срыв мерили в МИРЕ: расстояние от пальца до узла. Но мир едет —
    // камера догоняет игрока, инерция после бега, перелёт по зову, — и
    // узел уползал из-под лежащего пальца сам, без единого движения руки.
    // Человек говорил: «обводишь, а после перелёта сбивается». Рвать
    // взгляд должен ЖЕСТ, а не ход камеры: меряем, ушёл ли палец от той
    // точки ЭКРАНА, где он лёг. Сцена под пальцем вольна уезжать.
    var gsx = this.input.gsx != null ? this.input.gsx : this.input.x;
    var gsy = this.input.gsy != null ? this.input.gsy : this.input.y;
    // Палец ушёл на ДРУГОЙ узел — значит человек передумал.
    //
    // Взгляд, однажды взятый, держался намертво до порога срыва в 96
    // экранных точек. Но берег плотный: после прилёта по зову рождается
    // девять точек рядом, и уже в 60 точках лежит соседняя. Человек
    // переносит палец на неё, игра честно видит его точно на новом узле
    // (расстояние 0) — и продолжает греть СТАРЫЙ, потому что 60 меньше
    // 96. Для человека это «не все точки срабатывают»: он держит палец
    // на узле, а тот не растёт. Замер поймал ровно это — палец на узле,
    // gaze на другом.
    //
    // Ушёл на чужой узел — переносим взгляд туда. Это не срыв, а смена
    // намерения: время удержания начинается заново, и растёт то, что под
    // пальцем.
    // Переносим только на ЖИВОЙ соседний узел и только если старый
    // из-под пальца ушёл. Без этих двух условий игра становится липкой:
    // палец, ведущий игрока сквозь берег, перецепляется на каждый
    // встречный сгусток, игрок перестаёт ходить, и берег выкашивается
    // (замер: 1 живой узел вместо 28, взгляд захвачен 32% кадров).
    // Переносим на соседа только когда палец ЗАМЕР над ним. Иначе
    // жест ходьбы (палец ведёт игрока сквозь берег) перецепляется на
    // каждый встречный сгусток, игрок перестаёт ходить и берег
    // выкашивается: замер дал 1 живой узел вместо 28 при взгляде,
    // захваченном 33% кадров. Замирание — то же условие, что у ловли на
    // ходу: человек не «пронёс палец мимо», а «положил на другое».
    // Свой счётчик замирания: `input.hold` копится только пока взгляда
    // нет (см. ловлю на ходу), при захваченном он мёртв.
    // «Ещё мой» — не «в зоне прицела», а «ближе всех». Прежнее условие
    // (в пределах прицела) держало старый узел мёртвой хваткой: соседний
    // в 60 единицах — а порог 76, значит старый всё ещё «мой», и палец,
    // лежащий ТОЧНО на соседе, ничего не растил. Именно это человек и
    // видел после прилёта по зову, где точки рождаются кучкой.
    var mineDist = G.dist(this.input.wx, this.input.wy, n.x, n.y) - (n.r || 12);
    var nearest = this.world.nearestNode(this.input.wx, this.input.wy, this.aimRadius(58));
    var stillMine = !nearest || nearest === n ||
      mineDist <= G.dist(this.input.wx, this.input.wy, nearest.x, nearest.y) - (nearest.r || 12);
    if (this.input.rx == null || !isFinite(this.input.rx) ||
        G.dist(this.input.x, this.input.y, this.input.rx, this.input.ry) > 12) {
      this.input.rx = this.input.x;
      this.input.ry = this.input.y;
      this.input.rest = 0;
    } else {
      this.input.rest = (this.input.rest || 0) + dt;
    }
    // Полсекунды, а не треть: перенос — редкое событие «я передумал»,
    // а не постоянная перецепка. При 0.3 с замер дал 146 переносов за
    // прогон, игра пошла иначе и долг памяти перестал дозревать.
    // И только на узел, который ЯВНО под пальцем (в его радиусе), а не
    // просто ближайший в зоне прицела.
    var restingHere = (this.input.rest || 0) > 0.5;
    var underFinger = (stillMine || !restingHere) ? null : nearest;
    if (underFinger && underFinger !== n && !underFinger.dead) {
      this.input.rest = 0;
      this.player.gaze = underFinger;
      this.player.gazeT = 0;
      this.input.gsx = this.input.x;
      this.input.gsy = this.input.y;
      return;
    }

    var slip = G.dist(this.input.x, this.input.y, gsx, gsy);
    if (slip > 112) {
      // Имя причины — общее, а расстояние копится отдельно: иначе каждый
      // срыв уникален («ушёл на 121», «ушёл на 98») и сложить их нельзя.
      if (G.Report) G.Report.gestureTorn("slip", this.player.gazeT, slip);
      this.player.gaze = null;
      return;
    }
    // Взгляд — не роскошь, а единственный способ говорить с миром.
    //
    // Он отключался при энергии ниже 4, и это делало игру неиграбельной
    // там, где её ели раны: отчёт с телефона дал «нет сил ×95» из 113
    // срывов, замер — 213. Под стаей ран энергия стоит в нуле, и человек
    // не может НИЧЕГО: ни вырастить, ни уйти, ни понять, за что наказан.
    // Смотреть без сил можно — просто медленно: рождение растягивается
    // вдвое. Голод забирает скорость, а не саму способность жить.
    var weak = this.player.energy < 8;
    // Отчёт обязан говорить правду о расходе: на исходе сил взгляд ест
    // 1/с, а не 6/с, и в drain.gaze всегда писалось 6*dt — вшестеро
    // больше реального. «Сила ушла на взгляд» врала именно там, где
    // человек играет под стаей ран и сил почти нет.
    var gazeCost = weak ? 1 : 6;
    this.player.energy = Math.max(0, this.player.energy - gazeCost * dt);
    if (G.Report) { G.Report.noteDrain("gaze", gazeCost * dt); G.Report.noteEnergy(this.player.energy); }
    this.player.gazeT += weak ? dt * 0.5 : dt;
    n.care = Math.min(1, n.care + dt * 0.4);

    var gest = n.gesture;
    var spd = Math.sqrt(this.player.vx * this.player.vx + this.player.vy * this.player.vy);
    // Сколько человек держит УЖЕ РОДИВШИЙСЯ узел. Отдельный счётчик, а
    // не `gest.still`: тот копит жест рождения и к этому мигу давно
    // перевалил любой порог.
    if (n.state === "alive" && spd < 12) {
      n.holdT = (n.holdT || 0) + dt;
      // Якорь проверяем КАЖДЫЙ кадр, а не раз в 1.35 с. Ветка жила
      // внутри блока «взгляд дозрел», и порог 1.5 с срабатывал только на
      // следующем круге — якорь брался на четвёртой секунде вместо
      // третьей. Человек к этому времени давно отпускает палец.
      if (n.holdT > 1.5 && this.world.anchors.indexOf(n.id) < 0) {
        if (this.world.anchor(n)) {
          this.floaters.add(n.x, n.y - 22, G.Lang ? G.Lang.t("anchor") : "якорь", n.color());
          G.Audio.chord([330, 495], 0.8, 0.05);
          // Якорь — самый дорогой жест (долгий взгляд уже родившего
          // узла), и раньше он был нем: только аккорд и надпись. Первое
          // удержание Игра признаёт отдельно, дальнейшие — короче.
          if (G.Voice) G.Voice.say(this.world.anchors.length === 1 ? "anchorFirst" : "anchor");
        }
        n.holdT = 0;
      }
    } else if (spd >= 12) n.holdT = 0;
    if (spd < 12) gest.still += dt * 0.8;
    else gest.explore += dt * 0.5;
    if (this.input.rhythm > 0.5) gest.rhythm += dt;
    if (this.input.wild > 0.5) gest.wild += dt;
    if (spd < 20 && this.dna.get("empathy") > 0.15) gest.soft += dt * 0.4;

    if (this.player.gazeT > 0.2 && Math.floor(this.player.gazeT * 6) !== Math.floor((this.player.gazeT - dt) * 6)) {
      G.Audio.gazeTick(G.clamp(this.player.gazeT / 1.35, 0, 1), this.dna.dominant());
    }

    if (this.player.gazeT >= 1.35) {
      if (n.state !== "alive") {
        if (G.Report) { G.Report.gestureBorn(); G.Report.act("crystals"); }
        this.dna.gazes++;
        n.state = "crystallizing";
        var kind = this.world.crystallize(n, gest, this.dna);
        var trait = G.KIND_TRAIT[kind];
        if (trait) this.dna.feed(trait, 0.045);
        G.Audio.crystallize(trait || this.dna.dominant());
        this.fx.burst(n.x, n.y, 28, n.color(), 70, 0.9);
        this.fx.ring(n.x, n.y, 20, n.color(), n.r, 0.8);
        var kindText = G.kindName(kind);
        if (trait) kindText += " → " + G.traitName(trait);
        this.floaters.add(n.x, n.y - 20, kindText, n.color());
        G.Director.onCrystal(this, kind);
        if (G.Haptic) G.Haptic.play("crystal");
        // Якоря на рождении больше нет.
        //
        // Первый отчёт с телефона: «выращено 9, якорей 10». Самый дорогой
        // жест игры доставался ЧАЩЕ, чем рождался узел. Условие было
        // `gest.still > 0.8`, а `still` копится по 0.8 в секунду всё время
        // удержания — к рождению на 1.35 с он равен 1.08 и порог взят
        // всегда. Замер: якорь на 100% рождений, ровно та же болезнь, что
        // была у корней. Даровая награда — не награда.
        //
        // Якорь — отдельное намерение: не отпустить то, что уже родилось.
        // Кто продолжает держать палец, доходит до второго круга ниже и
        // получает якорь честно, за 2.7 с вместо 1.35.
        this.player.gazeT = 0;
      } else {
        // взгляд по живому не пустой жест: берег возвращает тепло
        n.care = 1;
        this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + 7);
        var warmTrait = G.KIND_TRAIT[n.kind];
        if (warmTrait) this.dna.feed(warmTrait, 0.012);
        G.Audio.gazeTick(1, this.dna.dominant());
        this.fx.ring(n.x, n.y, 10, n.color(), n.r, 0.5);
        if (!G.Director._regazeHinted) {
          G.Director._regazeHinted = true;
          G.Voice.sayText(G.Lang.t("aliveWarmth"), true);
        }
        this.player.gazeT = 0;
      }
    }
  };

  G.Game.prototype.save = function () {
    G.Save.write({
      v: 2,
      time: this.time,
      dna: this.dna.toJSON(),
      player: { x: this.player.x, y: this.player.y, energy: this.player.energy },
      world: this.world.toJSON(),
      voice: G.Voice.toJSON(),
      organs: G.Director.organs,
      named: G.Director.named,
      lastMeta: G.Director.lastMeta,
      fate: { offered: G.Fate.offered, chosen: G.Fate.chosen },
      // Память возвращения не сохранялась ВООБЩЕ. Орган памяти был
      // написан целиком — сессии, дни, сезон, «вчерашний ты», приветствие
      // вернувшегося, сон берега без человека — и не работал ни разу: в
      // сейв его никто не клал, `onReturn` не звал ни один файл. Отчёт с
      // телефона показал это цифрой «сессия 0» на пятой сессии подряд.
      memory: G.Memory.snapshot(this),
      state: this.state === "title" ? "title" : "play"
    });
  };

  G.Game.prototype.load = function () {
    var data = G.Save.load();
    if (!data || !data.dna) return false;
    // Отчёт — мерка ЭТОЙ сессии. Без сброса жесты и плавность из
    // предыдущей жизни в том же сеансе страницы подмешивались бы к
    // загруженному сейву (титул → новая жизнь → «продолжить»). Сбрасываем
    // до onReturn, чтобы ночь берега, которую он досыпает, попала в отчёт.
    if (G.Report) G.Report.reset();
    this.dna = G.Dna.fromJSON(data.dna);
    if (data.player) {
      this.player.x = G.num(data.player.x, 0);
      this.player.y = G.num(data.player.y, 0);
      this.player.energy = G.clamp(G.num(data.player.energy, 100), 0, this.player.maxEnergy);
    }
    if (data.world) {
      this.world.age = G.num(data.world.age, 0);
      this.world.meta = G.num(data.world.meta, 0);
      this.world.biome = data.world.biome || "void";
      this.world.discovered = data.world.discovered || 0;
      this.world.lost = data.world.lost || 0;
      this.world.carried = data.world.carried || 0;
      this.world.killed = data.world.killed || 0;
      this.world.saved = data.world.saved || 0;
      this.world.call = data.world.call || null;
      this.world.callT = data.world.callT != null ? data.world.callT : 12;
      this.world.arrived = data.world.arrived || 0;
      // фаза прилива: сохраняется, чтобы короткие сессии не отодвигали его
      this.world.tide = data.world.tide || 0;
      this.world.tideT = data.world.tideT != null ? data.world.tideT : this.world.tideT;
      if (this.world.call && this.world.call.phase == null) this.world.call.phase = 0;
      this.world.nodes = [];
      var nodes = Array.isArray(data.world.nodes) ? data.world.nodes : [];
      for (var i = 0; i < nodes.length; i++) {
        var src = nodes[i];
        if (!src || typeof src !== "object") continue;
        var n = new G.Node(G.num(src.x, 0), G.num(src.y, 0), src.kind);
        n.id = src.id || n.id;
        n.state = src.state || "unformed";
        n.care = G.clamp(G.num(src.care, 0.4), 0, 1);
        n.roots = G.clamp(G.num(src.roots, 0), 0, 1);
        n.returns = G.num(src.returns, 0);
        n.cooled = src.cooled || 0;
        n.rootTold = src.rootTold || 0;
        n.hp = G.clamp(G.num(src.hp, 1), 0, 1);
        n.age = G.num(src.age, 0);
        n.growth = src.growth != null ? G.num(src.growth, n.state === "alive" ? 1 : 0) : (n.state === "alive" ? 1 : 0);
        n.r = G.clamp(G.num(src.r, 16), 4, 80);
        n.verse = src.verse || "";
        n.tone = G.num(src.tone, 330);
        // обещанная природа переживает выход: гнездо после зова и метки
        // берега не должны вырастать чужими после перезапуска.
        if (src.hint) n.hint = src.hint;
        this.world.nodes.push(n);
      }
      this.world.beings = [];
      var beings = Array.isArray(data.world.beings) ? data.world.beings : [];
      for (var j = 0; j < beings.length; j++) {
        var sb = beings[j];
        if (!sb || typeof sb !== "object") continue;
        var b = new G.Being(G.num(sb.x, 0), G.num(sb.y, 0), sb.hue);
        b.bond = G.clamp(G.num(sb.bond, 0), 0, 1);
        b.fear = G.clamp(G.num(sb.fear, 0.2), 0, 1);
        b.name = sb.name || b.name;
        // характер, истинное имя и долг раньше терялись при выходе:
        // существо возвращалось чужим. Память существа — тоже память.
        if (sb.temper) b.temper = sb.temper;
        if (sb.trueName) b.trueName = sb.trueName;
        if (sb.nameKey) b.nameKey = sb.nameKey;
        if (sb.babyKey != null) b.babyKey = sb.babyKey;
        if (sb.healed) b.healed = true;
        if (sb.shardOf) b.shardOf = sb.shardOf;
        b.named = !!sb.named;
        // долг не бесконечен: битый сейв не должен навсегда оставлять
        // существо на грани исхода.
        b.debt = G.clamp(G.num(sb.debt, 0), 0, 1.2);
        b.isYesterday = !!sb.isYesterday;
        this.world.beings.push(b);
      }
      // сад, законы и расширенный предел якорей — то, что человек вырастил.
      // Каждый массив нормализуем: битый сейв может принести строку или
      // null, а onReturn потом делает push/filter и падает.
      function arr(v) { return Array.isArray(v) ? v : []; }
      this.world.blooms = arr(data.world.blooms);
      this.world.forgotten = arr(data.world.forgotten);
      this.world.laws = arr(data.world.laws);
      this.world.stars = arr(data.world.stars);
      this.world.anchors = arr(data.world.anchors);
      this.world.active = arr(data.world.active);
      this.world.verses = arr(data.world.verses);
      this.world.anchorCap = data.world.anchorCap || 3;
      // действующий закон тоже ждёт возвращения: мир не должен тайком
      // выпрямиться, пока человека нет. active уже нормализован выше.
      this.world.tideFrozen = data.world.tideFrozen || 0;
      this.world.invertMove = data.world.invertMove || 0;
      // Босс возвращается собой, а не исчезает: раны, которые человек успел
      // ему нанести, и снятые осколки — часть его. Нормализуем числа —
      // битый сейв не должен родить босса с NaN вместо координат.
      if (data.world.boss) {
        var bo = data.world.boss;
        this.world.boss = {
          x: G.num(bo.x, this.player.x), y: G.num(bo.y, this.player.y),
          vx: G.num(bo.vx, 0), vy: G.num(bo.vy, 0),
          r: G.clamp(G.num(bo.r, 28), 8, 120),
          hp: Math.max(1, G.num(bo.hp, 10)), maxHp: Math.max(1, G.num(bo.maxHp, 10)),
          parts: Array.isArray(bo.parts) ? bo.parts : [],
          phase: G.num(bo.phase, 0), lunge: G.num(bo.lunge, 0),
          stun: G.num(bo.stun, 0), weak: G.num(bo.weak, 0),
          nameKey: G.num(bo.nameKey, 0),
          t: G.num(bo.t, 0)
        };
      }
      this.world.bossSaid = !!data.world.bossSaid;
      if (data.world.lostGate != null) this.world.lostGate = G.num(data.world.lostGate, 0);
      if (this.world.nodes.length < 5) this.world.scatter(this.player.x, this.player.y, 8, 360);
    }
    G.Voice.fromJSON(data.voice);
    if (data.organs) G.Director.organs = data.organs;
    G.Director.named = !!data.named;
    G.Director.lastMeta = data.lastMeta || 0;
    if (data.fate) {
      G.Fate.offered = !!data.fate.offered;
      G.Fate.chosen = data.fate.chosen || "";
      // «Отпустить» — это прожитый конец, а не вечное состояние. Раньше
      // вернувшийся после release навсегда оставался с chosen="release":
      // развилка больше не предлагалась, и второй конец («стать игрой»)
      // был недостижим без удаления сейва. Сбрасываем — вернувшийся может
      // снова дорасти до развилки и выбрать другой путь.
      if (G.Fate.chosen === "release") G.Fate.chosen = "";
    }
    this.prevDnaSnap = G.Director.snapshot(this.dna);
    this.time = data.time || 0;
    // Ранний сейв мог принести offered=true до порога 20 мин (баг до
    // 0.4.52: порог был 22 узла, а не время). Отчёт 0.4.80 показал
    // become на 7.8 мин при берегах 2 — финал пришёл раньше, чем мир прожит.
    // Чиним при загрузке: если часы моложе порога, развилки ещё нет.
    if ((this.time || 0) < 1200) G.Fate.offered = false;
    // Возвращение — это событие, а не тихая загрузка файла. Здесь берег
    // досыпает часы без человека, считает день и сессию, растит
    // «вчерашнего тебя», если суть сменилась, и Игра здоровается.
    // Зовём последним: сон берега трогает узлы и существа, они должны
    // быть уже восстановлены.
    G.Memory.onReturn(this, data.memory || {});
    return true;
  };

  G.Game.prototype.forgetSelf = function () {
    G.Save.clear();
    location.reload();
  };

  G.Game.prototype.frame = function (ts) {
    if (!this.running) return;
    if (!this.last) this.last = ts;
    var dt = G.clamp((ts - this.last) / 1000, 0, 0.05);
    this.last = ts;

    var curW = window.innerWidth || (document.documentElement && document.documentElement.clientWidth) || 0;
    var curH = window.innerHeight || (document.documentElement && document.documentElement.clientHeight) || 0;
    if (curW > 10 && curH > 10 && (Math.abs(curW - this.w) > 1 || Math.abs(curH - this.h) > 1)) {
      this.resize();
    }

    if (G.Report && this.state === "play") {
      G.Report.frame(dt);
      G.Report.noteZoom(this.cam.z);
      if (this.input.down) G.Report.gestureHold(dt, !!this.player.gaze);
    }
    // Телефон, который не тянет, обязан получить послабление сам —
    // человек не должен искать настройку, которой в игре и нет.
    if (G.Quality && G.Quality.watch && this.state === "play") G.Quality.watch(dt);

    try {
      this.update(dt);
      if (G.WebGL && G.WebGL.ready) G.WebGL.draw(this);
      G.Renderer.draw(this.ctx, this);
      // Сага экрана закрыта: метки краёв сняты (закон — setTransform(dpr)).
    } catch (err) {
      // A single malformed organ or renderer branch must not kill the loop.
      // Keep the shore visible and leave a compact trace for the next fix.
      try {
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.ctx.fillStyle = "#05060a";
        this.ctx.fillRect(0, 0, this.w, this.h);
        this.ctx.fillStyle = "rgba(232,230,242,0.55)";
        this.ctx.font = "12px monospace";
        this.ctx.fillText(G.Lang.t("shoreBreathes"), 16, this.h - 36);
        var dbg = document.getElementById("fit-debug");
        if (dbg) dbg.textContent = "render: " + (err && err.message ? err.message : String(err)).slice(0, 120);
        // Сбой рендера раньше жил только в невидимой отладочной строке и
        // умирал вместе с сессией: о поломке на чужом телефоне я узнавал
        // только если человек догадается её пересказать.
        if (G.Report) G.Report.error("render: " + (err && err.message ? err.message : String(err)));
      } catch (fallbackErr) {}
    }
    requestAnimationFrame(this.frame.bind(this));
  };

  G.Game.prototype.start = function () {
    this.resize();
    this.bind();
    this.running = true;
    requestAnimationFrame(this.frame.bind(this));
  };
})(IGRA);
