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
    var app = document.getElementById("app");
    var rect = app ? app.getBoundingClientRect() : this.canvas.getBoundingClientRect();
    var w;
    var h;
    var dpr = 1;
    if (window.__IGRA_PX_W && window.__IGRA_PX_H) {
      w = Math.round(window.__IGRA_VW || window.__IGRA_PX_W);
      h = Math.round(window.__IGRA_VH || window.__IGRA_PX_H);
      dpr = 1;
      if (app) {
        app.style.position = "fixed";
        app.style.left = "0";
        app.style.top = "0";
        app.style.width = w + "px";
        app.style.height = h + "px";
      }
    } else {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (G.Quality && G.Quality.dpr) dpr = Math.min(dpr, G.Quality.dpr);
      w = Math.round(
        (rect && rect.width) ||
          document.documentElement.clientWidth ||
          window.innerWidth ||
          360
      );
      h = Math.round(
        (rect && rect.height) ||
          document.documentElement.clientHeight ||
          window.innerHeight ||
          640
      );
    }
    if (w < 2 || h < 2) return;
    this.dpr = dpr;
    this.w = w;
    this.h = h;
    this.canvas.width = Math.max(1, Math.floor(w * dpr));
    this.canvas.height = Math.max(1, Math.floor(h * dpr));
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.cam.w = w;
    this.cam.h = h;
    var dbg = document.getElementById("fit-debug");
    if (dbg) {
      dbg.textContent = w + "×" + h + " dpr" + this.dpr + (window.__IGRA_PX_W ? " px" + window.__IGRA_PX_W : "");
    }
    if (!G.Renderer.ready) G.Renderer.init(w, h);
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
    function pos(e) {
      var t = e.touches ? e.touches[0] || e.changedTouches[0] : e;
      var r = el.getBoundingClientRect();
      return { x: t.clientX - r.left, y: t.clientY - r.top };
    }
    function down(e) {
      e.preventDefault();
      G.Audio.unlock();
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
      if (!self.input.down && !e.touches) return;
      var p = pos(e);
      self.input.x = p.x;
      self.input.y = p.y;
      var w = self.screenToWorld(p.x, p.y);
      self.input.wx = w.x;
      self.input.wy = w.y;
    }
    function up(e) {
      e.preventDefault();
      var p = pos(e);
      self.input.x = p.x;
      self.input.y = p.y;
      self.onUp();
      self.input.down = false;
    }
    el.addEventListener("mousedown", down);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    el.addEventListener("touchstart", down, { passive: false });
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", up, { passive: false });
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
          if (report.lost || report.blooms) {
            G.Voice.sayText(
              report.lost
                ? "пока экран спал, забвение работало."
                : "сад вырос в темноте.",
              true
            );
          }
        }
      }
    });
  };

  G.Game.prototype.onDown = function () {
    if (this.state === "title") {
      this.startBirth();
      return;
    }
    if (G.Voice.visible) G.Voice.skip();
    var now = this.time;
    var dtap = now - this.input.lastTap;
    this.input.lastTap = now;
    this.input.taps.push(now);
    if (this.input.taps.length > 8) this.input.taps.shift();
    this.dna.taps++;

    if (dtap < 0.28 && this.state === "play") {
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
        G.Voice.sayText(star.verse || ("звезда " + (G.KIND_RU[star.kind] || "") + "."), true);
        G.Organs.toggleSky(this, false);
      }
      return;
    }

    if (this.state === "play" || this.state === "birth") {
      var crack = G.Organs.nearestCrack(this.world, this.input.wx, this.input.wy, 36);
      if (crack) {
        G.Organs.applyLaw(this, crack);
        this.dna.feed("chaos", 0.03);
        return;
      }
      var being = G.Organs.nearestBeing(this.world, this.input.wx, this.input.wy, 42);
      var node = this.world.nearestNode(this.input.wx, this.input.wy, 48);
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
        this.player.gaze = node;
        this.player.gazeT = 0;
        this.dna.feed("contemplation", 0.01);
        if (this.dna.gazes === 0) G.Voice.say("firstGaze");
      } else {
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
    if (this.player.energy < 16) {
      G.Voice.say("lowEnergy");
      return;
    }
    if (this.player.pulseT > 0) return;
    this.player.energy -= 16;
    this.player.pulseT = 0.55;
    this.dna.pulses++;
    this.dna.feed(this.dna.dominant(), 0.015);
    G.Director.pulseEffect(this);
    if (G.Haptic) G.Haptic.play("pulse");
    G.Voice.say("pulse");
  };

  G.Game.prototype.startBirth = function () {
    if (this.state !== "title") return;
    this.state = "birth";
    this.birthT = 0;
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
    G.UI.hint("двойное касание — пульс · i — сигила");
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
    this.world.metamorphose(this.player, this.dna);
    this.prevDnaSnap = G.Director.snapshot(this.dna);
    this.state = "play";
    this.metaFlash = 0.6;
    G.Voice.sayText("теперь ты — " + this.dna.name() + ".", true);
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

    this.world.update(dt, this.player, this.dna, this.fx);
    G.Director.observe(dt, this);
    if (G.Fate.ready(this) && this.state === "play" && this.dna.age > 8) {
      G.Fate.offer(this);
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

    G.Audio.update(dt, this.dna, this.state, this.world.tide);

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
          this.floaters.add(b.x, b.y - 18, b.name, G.TRAIT_COLOR.empathy);
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
        G.Voice.sayText(this.gazeTarget.name + " помнит каждый отказ.", true);
        this.gazeTarget.weak = 2.5;
        this.player.gazeT = 0;
      }
      return;
    }
    if (!this.player.gaze) return;
    var n = this.player.gaze;
    if (n.dead) {
      this.player.gaze = null;
      return;
    }
    // if pointer wandered off, convert to move
    if (G.dist(this.input.wx, this.input.wy, n.x, n.y) > 70) {
      this.player.gaze = null;
      return;
    }
    if (this.player.energy < 4) {
      G.Voice.say("lowEnergy");
      this.player.gaze = null;
      return;
    }
    this.player.energy -= 6 * dt;
    this.player.gazeT += dt;
    n.care = Math.min(1, n.care + dt * 0.4);

    var gest = n.gesture;
    var spd = Math.sqrt(this.player.vx * this.player.vx + this.player.vy * this.player.vy);
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
        this.dna.gazes++;
        n.state = "crystallizing";
        var kind = this.world.crystallize(n, gest, this.dna);
        var trait = G.KIND_TRAIT[kind];
        if (trait) this.dna.feed(trait, 0.045);
        G.Audio.crystallize(trait || this.dna.dominant());
        this.fx.burst(n.x, n.y, 28, n.color(), 70, 0.9);
        this.fx.ring(n.x, n.y, 20, n.color(), n.r, 0.8);
        this.floaters.add(n.x, n.y - 20, G.KIND_RU[kind] || kind, n.color());
        G.Director.onCrystal(this, kind);
        if (G.Haptic) G.Haptic.play("crystal");
        if (gest.still > 0.8) this.world.anchor(n);
        this.player.gazeT = 0;
      } else if (gest.still > 0.7) {
        if (this.world.anchor(n)) {
          this.floaters.add(n.x, n.y - 22, "якорь", n.color());
          G.Audio.chord([330, 495], 0.8, 0.05);
        }
        this.player.gazeT = 0;
      }
    }
  };

  G.Game.prototype.save = function () {
    G.Save.write({
      v: 1,
      time: this.time,
      dna: this.dna.toJSON(),
      player: { x: this.player.x, y: this.player.y, energy: this.player.energy },
      world: this.world.toJSON(),
      voice: G.Voice.toJSON(),
      organs: G.Director.organs,
      named: G.Director.named,
      lastMeta: G.Director.lastMeta,
      fate: { offered: G.Fate.offered, chosen: G.Fate.chosen },
      state: this.state === "title" ? "title" : "play",
      v: 2
    });
  };

  G.Game.prototype.load = function () {
    var data = G.Save.load();
    if (!data || !data.dna) return false;
    this.dna = G.Dna.fromJSON(data.dna);
    if (data.player) {
      this.player.x = data.player.x || 0;
      this.player.y = data.player.y || 0;
      this.player.energy = data.player.energy != null ? data.player.energy : 100;
    }
    if (data.world) {
      this.world.age = data.world.age || 0;
      this.world.meta = data.world.meta || 0;
      this.world.biome = data.world.biome || "void";
      this.world.discovered = data.world.discovered || 0;
      this.world.lost = data.world.lost || 0;
      this.world.killed = data.world.killed || 0;
      this.world.saved = data.world.saved || 0;
      this.world.verses = data.world.verses || [];
      this.world.stars = data.world.stars || [];
      this.world.anchors = data.world.anchors || [];
      this.world.nodes = [];
      var nodes = data.world.nodes || [];
      for (var i = 0; i < nodes.length; i++) {
        var src = nodes[i];
        var n = new G.Node(src.x, src.y, src.kind);
        n.id = src.id || n.id;
        n.state = src.state || "unformed";
        n.care = src.care != null ? src.care : 0.4;
        n.r = src.r || 16;
        n.verse = src.verse || "";
        n.tone = src.tone || 330;
        this.world.nodes.push(n);
      }
      this.world.beings = [];
      var beings = data.world.beings || [];
      for (var j = 0; j < beings.length; j++) {
        var sb = beings[j];
        var b = new G.Being(sb.x, sb.y, sb.hue);
        b.bond = sb.bond || 0;
        b.fear = sb.fear || 0.2;
        b.name = sb.name || b.name;
        this.world.beings.push(b);
      }
      if (this.world.nodes.length < 5) this.world.scatter(this.player.x, this.player.y, 8, 360);
    }
    G.Voice.fromJSON(data.voice);
    if (data.organs) G.Director.organs = data.organs;
    G.Director.named = !!data.named;
    G.Director.lastMeta = data.lastMeta || 0;
    if (data.fate) {
      G.Fate.offered = !!data.fate.offered;
      G.Fate.chosen = data.fate.chosen || "";
    }
    this.prevDnaSnap = G.Director.snapshot(this.dna);
    this.time = data.time || 0;
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
    if ((ts / 1000 | 0) !== ((ts - dt * 1000) / 1000 | 0)) {
      var app = document.getElementById("app");
      if (app) {
        var r = app.getBoundingClientRect();
        if (r.width > this.w + 8 || r.height > this.h + 8) this.resize();
      }
    }
    this.update(dt);
    G.Renderer.draw(this.ctx, this);
    requestAnimationFrame(this.frame.bind(this));
  };

  G.Game.prototype.start = function () {
    this.resize();
    this.bind();
    this.running = true;
    requestAnimationFrame(this.frame.bind(this));
  };
})(IGRA);
