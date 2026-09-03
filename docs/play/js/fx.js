var IGRA = IGRA || {};
(function (G) {
  "use strict";

  G.Particles = function (cap) {
    this.cap = cap || 420;
    this.list = [];
  };

  G.Particles.prototype.spawn = function (p) {
    if (this.list.length >= this.cap) this.list.shift();
    this.list.push({
      x: p.x,
      y: p.y,
      vx: p.vx || 0,
      vy: p.vy || 0,
      life: p.life || 1,
      max: p.life || 1,
      r: p.r || 2,
      c: p.c || [200, 220, 255],
      a: p.a == null ? 1 : p.a,
      drag: p.drag == null ? 0.98 : p.drag,
      g: p.g || 0,
      grow: p.grow || 0,
      additive: p.additive !== false
    });
  };

  G.Particles.prototype.burst = function (x, y, n, color, speed, life) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * G.TAU;
      var s = (speed || 40) * (0.3 + Math.random());
      this.spawn({
        x: x,
        y: y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: (life || 0.8) * (0.5 + Math.random()),
        r: 1.2 + Math.random() * 2.4,
        c: color,
        grow: -0.4
      });
    }
  };

  G.Particles.prototype.ring = function (x, y, n, color, rad, life) {
    for (var i = 0; i < n; i++) {
      var a = (i / n) * G.TAU;
      this.spawn({
        x: x + Math.cos(a) * rad,
        y: y + Math.sin(a) * rad,
        vx: Math.cos(a) * 18,
        vy: Math.sin(a) * 18,
        life: life || 0.9,
        r: 1.6,
        c: color
      });
    }
  };

  G.Particles.prototype.update = function (dt) {
    for (var i = this.list.length - 1; i >= 0; i--) {
      var p = this.list[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.list.splice(i, 1);
        continue;
      }
      p.vx *= Math.pow(p.drag, dt * 60);
      p.vy *= Math.pow(p.drag, dt * 60);
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.r = Math.max(0.2, p.r + p.grow * dt);
    }
  };

  G.Particles.prototype.draw = function (ctx, cam) {
    for (var i = 0; i < this.list.length; i++) {
      var p = this.list[i];
      var k = p.life / p.max;
      var a = p.a * k;
      var x = (p.x - cam.x) * cam.z + cam.w / 2;
      var y = (p.y - cam.y) * cam.z + cam.h / 2;
      var r = p.r * cam.z;
      if (x < -20 || y < -20 || x > cam.w + 20 || y > cam.h + 20) continue;
      ctx.globalCompositeOperation = p.additive ? "lighter" : "source-over";
      ctx.fillStyle = G.rgb(p.c[0], p.c[1], p.c[2], a);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, G.TAU);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  };

  G.Floaters = function () {
    this.list = [];
    this.cap = 3;
    this.suppressed = 0;
  };

  // Визуальные строки имеют общий бюджет. Одновременно максимум три,
  // а при заполнении пространства новое важное сообщение вытесняет
  // только менее важное. Приоритет: 3 = событие, 2 = обычное, 1 = фон.
  G.Floaters.prototype.add = function (x, y, text, color, priority) {
    if (!text) return false;
    var now = G.now ? G.now() : Date.now() / 1000;
    var p = priority == null ? 1 : priority;
    var radius = p >= 3 ? 70 : 46;

    for (var i = 0; i < this.list.length; i++) {
      var old = this.list[i];
      if (old.text === text && Math.abs(old.x - x) < radius && Math.abs(old.y - y) < radius && now - old.at < (p >= 3 ? 4 : 3)) {
        this.suppressed++;
        return false;
      }
    }

    var life = p >= 3 ? 2.6 : (p === 2 ? 2.3 : 1.8);
    var f = {
      x: x,
      y: y,
      text: text,
      c: color || [230, 230, 240],
      life: life,
      max: life,
      at: now,
      p: p
    };

    if (this.list.length < this.cap) {
      this.list.push(f);
      return true;
    }

    var weakest = 0;
    for (var j = 1; j < this.list.length; j++) {
      if (this.list[j].p < this.list[weakest].p ||
          (this.list[j].p === this.list[weakest].p && this.list[j].at < this.list[weakest].at)) {
        weakest = j;
      }
    }
    if (p > this.list[weakest].p) {
      this.list[weakest] = f;
      return true;
    }
    this.suppressed++;
    return false;
  };

  G.Floaters.prototype.clear = function () {
    this.list.length = 0;
  };

  G.Floaters.prototype.update = function (dt) {
    for (var i = this.list.length - 1; i >= 0; i--) {
      var f = this.list[i];
      f.life -= dt;
      f.y -= 18 * dt;
      if (f.life <= 0) this.list.splice(i, 1);
    }
  };

  G.Floaters.prototype.draw = function (ctx, cam) {
    ctx.save();
    ctx.font = "600 " + Math.round(22 * Math.min(cam.z, 1.15)) + "px Manrope, sans-serif";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = 6;
    for (var i = 0; i < this.list.length; i++) {
      var f = this.list[i];
      var k = f.life / f.max;
      var x = (f.x - cam.x) * cam.z + cam.w / 2;
      var y = (f.y - cam.y) * cam.z + cam.h / 2;
      ctx.fillStyle = G.rgb(f.c[0], f.c[1], f.c[2], G.smooth(k));
      ctx.globalAlpha = f.p >= 3 ? 1 : (f.p === 2 ? 0.88 : 0.66);
      ctx.fillText(f.text, x, y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  };

  G.Shake = { x: 0, y: 0, mag: 0 };
  G.Shake.add = function (m) {
    this.mag = Math.min(22, this.mag + m);
  };
  G.Shake.update = function (dt) {
    this.mag *= Math.pow(0.04, dt);
    if (this.mag < 0.05) {
      this.mag = 0;
      this.x = 0;
      this.y = 0;
      return;
    }
    this.x = (Math.random() - 0.5) * this.mag;
    this.y = (Math.random() - 0.5) * this.mag;
  };
})(IGRA);
