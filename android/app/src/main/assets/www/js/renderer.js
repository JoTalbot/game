var IGRA = IGRA || {};
(function (G) {
  "use strict";

  function glow(ctx, x, y, r, rgb, a) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, G.rgb(rgb[0], rgb[1], rgb[2], a));
    g.addColorStop(0.35, G.rgb(rgb[0], rgb[1], rgb[2], a * 0.35));
    g.addColorStop(1, G.rgb(rgb[0], rgb[1], rgb[2], 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, G.TAU);
    ctx.fill();
  }

  G.Renderer = {
    grain: null,
    starsFar: [],
    fog: [],
    ready: false,

    init: function (w, h) {
      this.ready = true;
      this.starsFar = [];
      var rng = new G.Rng(42);
      for (var i = 0; i < 160; i++) {
        this.starsFar.push({
          x: rng.range(0, 1),
          y: rng.range(0, 1),
          r: rng.range(0.4, 1.6),
          a: rng.range(0.15, 0.7),
          tw: rng.range(0, G.TAU)
        });
      }
      this.fog = [];
      var fogN = (G.Quality && G.Quality.fog) || 16;
      for (var j = 0; j < fogN; j++) {
        this.fog.push({
          x: rng.range(-800, 800),
          y: rng.range(-800, 800),
          r: rng.range(180, 420),
          vx: rng.range(-6, 6),
          vy: rng.range(-4, 4),
          a: rng.range(0.03, 0.09),
          p: rng.range(0, G.TAU)
        });
      }
    },

    worldToScreen: function (cam, x, y) {
      return {
        x: (x - cam.x) * cam.z + cam.w / 2,
        y: (y - cam.y) * cam.z + cam.h / 2
      };
    },

    draw: function (ctx, game) {
      var cam = game.cam;
      var w = cam.w;
      var h = cam.h;
      var dna = game.dna;
      var col = dna.blendRgb();
      var t = game.time;

      // Матрица плотности — закон холста: битмап = w×dpr, мир рисуется
      // в CSS-координатах через неё. Сброс в identity обрезал кадр до
      // пикселей w×h — отсюда вся сага двойника (renderer.js, не прошивка).
      ctx.setTransform(game.dpr || 1, 0, 0, game.dpr || 1, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // void
      var bg = ctx.createRadialGradient(
        w * 0.5 + G.Shake.x,
        h * 0.42 + G.Shake.y,
        20,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.72
      );
      var hour = new Date().getHours();
      var night = hour < 6 || hour > 21 ? 0.72 : hour < 8 || hour > 18 ? 0.88 : 1;
      var seasonTint = G.Memory && G.Memory.seasonTrait === "aggression" ? 1.15 : 1;
      bg.addColorStop(0, G.rgb(col[0] * 0.12 * seasonTint, col[1] * 0.12 * night, col[2] * 0.16 * night, 1));
      bg.addColorStop(0.45, night < 0.8 ? "#05040a" : "#07080d");
      bg.addColorStop(1, "#030308");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // far stars / constellation of forgotten
      ctx.save();
      ctx.translate(G.Shake.x, G.Shake.y);
      for (var i = 0; i < this.starsFar.length; i++) {
        var s = this.starsFar[i];
        var tw = 0.55 + 0.45 * Math.sin(t * 1.3 + s.tw);
        ctx.fillStyle = G.rgb(220, 230, 255, s.a * tw);
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r, 0, G.TAU);
        ctx.fill();
      }

      // memory stars from forgotten nodes
      var stars = game.world.stars;
      var sky = game.sky;
      for (var m = 0; m < stars.length; m++) {
        var st = stars[m];
        var scale = sky ? 0.9 : 0.35;
        var sx = w * 0.5 + st.x * scale + Math.sin(t * 0.2 + st.tw) * (sky ? 14 : 8);
        var sy = (sky ? h * 0.42 : h * 0.22) + st.y * (sky ? 0.7 : 0.2) + Math.cos(t * 0.15 + st.tw) * (sky ? 12 : 6);
        var ta = 0.4 + 0.4 * Math.sin(t * 2 + st.tw);
        glow(ctx, sx, sy, sky ? 22 : 10, st.c, 0.22 * ta);
        ctx.fillStyle = G.rgb(st.c[0], st.c[1], st.c[2], 0.8 * ta);
        ctx.beginPath();
        ctx.arc(sx, sy, sky ? 3.2 : 1.4, 0, G.TAU);
        ctx.fill();
        if (sky && m < stars.length - 1) {
          var st2 = stars[m + 1];
          if (st.kind === st2.kind) {
            var sx2 = w * 0.5 + st2.x * scale;
            var sy2 = h * 0.42 + st2.y * 0.7;
            ctx.strokeStyle = G.rgb(st.c[0], st.c[1], st.c[2], 0.22);
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx2, sy2);
            ctx.stroke();
          }
        }
      }
      if (sky) {
        ctx.save();
        ctx.fillStyle = "rgba(238,236,248,0.92)";
        ctx.font = "italic 22px 'Cormorant Garamond', serif";
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(0,0,0,0.9)";
        ctx.shadowBlur = 6;
        ctx.fillText("небо из того, что ты отпустил", w / 2, 52);
        ctx.restore();
      }

      // fog banks in world space
      ctx.globalCompositeOperation = "lighter";
      for (var f = 0; f < this.fog.length; f++) {
        var fg = this.fog[f];
        fg.x += fg.vx * game.dt;
        fg.y += fg.vy * game.dt;
        fg.p += game.dt * 0.15;
        if (fg.x > 1400) fg.x = -1400;
        if (fg.x < -1400) fg.x = 1400;
        var fp = this.worldToScreen(cam, fg.x + game.player.x * 0.15, fg.y + game.player.y * 0.15);
        glow(
          ctx,
          fp.x,
          fp.y,
          fg.r * cam.z,
          [col[0], col[1], col[2]],
          fg.a * (0.7 + 0.3 * Math.sin(fg.p))
        );
      }
      ctx.globalCompositeOperation = "source-over";

      // tide veil
      if (game.world.tide > 0) {
        var td = game.world.tide;
        var wave = Math.sin(td * Math.PI);
        ctx.fillStyle = G.rgb(8, 6, 16, 0.18 * wave);
        ctx.fillRect(0, 0, w, h);
        var pr = this.worldToScreen(cam, game.player.x, game.player.y);
        var rg = ctx.createRadialGradient(pr.x, pr.y, 40, pr.x, pr.y, 80 + td * 520 * cam.z);
        rg.addColorStop(0, "rgba(0,0,0,0)");
        rg.addColorStop(0.6, G.rgb(20, 10, 30, 0.15 * wave));
        rg.addColorStop(1, G.rgb(0, 0, 0, 0.45 * wave));
        ctx.fillStyle = rg;
        ctx.fillRect(0, 0, w, h);
      }

      // links between close alive nodes
      ctx.lineWidth = 1;
      var nodes = game.world.nodes;
      for (var a = 0; a < nodes.length; a++) {
        var na = nodes[a];
        if (na.state !== "alive") continue;
        for (var b = a + 1; b < nodes.length; b++) {
          var nb = nodes[b];
          if (nb.state !== "alive") continue;
          var dd = G.dist(na.x, na.y, nb.x, nb.y);
          if (dd < 230) {
            var pa = this.worldToScreen(cam, na.x, na.y);
            var pb = this.worldToScreen(cam, nb.x, nb.y);
            var ca = na.color();
            ctx.strokeStyle = G.rgb(ca[0], ca[1], ca[2], 0.12 * (1 - dd / 230));
            ctx.beginPath();
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
            ctx.stroke();
          }
        }
      }

      // зов: свет вдали и компас на краю — путь виден всегда
      if (game.world.call && !sky) this.drawCall(ctx, cam, game, t);

      // garden
      for (var gi = 0; gi < game.world.blooms.length; gi++) {
        this.drawBloom(ctx, cam, game.world.blooms[gi], t);
      }

      // nodes
      for (var i2 = 0; i2 < nodes.length; i2++) this.drawNode(ctx, cam, nodes[i2], t, game);

      // beings
      for (var bi = 0; bi < game.world.beings.length; bi++) {
        this.drawBeing(ctx, cam, game.world.beings[bi], t);
      }

      // wounds
      for (var wi = 0; wi < game.world.wounds.length; wi++) {
        this.drawWound(ctx, cam, game.world.wounds[wi], t);
      }

      // cracks
      for (var ci = 0; ci < game.world.cracks.length; ci++) {
        this.drawCrack(ctx, cam, game.world.cracks[ci], t);
      }

      if (game.world.boss) this.drawBoss(ctx, cam, game.world.boss, t);

      // gaze thread
      if (game.player.gaze || game.gazeTarget) {
        var gz = game.player.gaze || game.gazeTarget;
        var ps = this.worldToScreen(cam, game.player.x, game.player.y);
        var ns = this.worldToScreen(cam, gz.x, gz.y);
        ctx.strokeStyle = G.rgb(col[0], col[1], col[2], 0.35 + 0.35 * Math.sin(t * 8));
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(ps.x, ps.y);
        var mx = (ps.x + ns.x) / 2 + Math.sin(t * 3) * 8;
        var my = (ps.y + ns.y) / 2 + Math.cos(t * 2.2) * 8;
        ctx.quadraticCurveTo(mx, my, ns.x, ns.y);
        ctx.stroke();
      }

      // нить спутника: тонкая связь к тем, кто идёт за тобой
      for (var ki = 0; ki < game.world.beings.length; ki++) {
        var kb = game.world.beings[ki];
        if (kb.bond <= 0.55 || kb.fear >= 0.5) continue;
        var kp = this.worldToScreen(cam, kb.x, kb.y);
        var pp = this.worldToScreen(cam, game.player.x, game.player.y);
        var kd = G.dist(kb.x, kb.y, game.player.x, game.player.y);
        if (kd > 460) continue;
        var kc = G.TRAIT_COLOR[kb.hue] || G.TRAIT_COLOR.empathy;
        var fade = (1 - kd / 460) * (0.1 + (kb.bond - 0.55) * 0.5);
        ctx.strokeStyle = G.rgb(kc[0], kc[1], kc[2], fade * (0.7 + 0.3 * Math.sin(t * 2 + kb.phase)));
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pp.x, pp.y);
        var sag = 10 + (kb.hurry || 0) * 14;
        ctx.quadraticCurveTo(
          (pp.x + kp.x) / 2 + Math.sin(t * 1.4 + kb.phase) * 6,
          (pp.y + kp.y) / 2 + sag,
          kp.x,
          kp.y
        );
        ctx.stroke();
      }

      // player
      this.drawPlayer(ctx, cam, game, t, col);

      // particles & floaters
      game.fx.draw(ctx, cam);
      game.floaters.draw(ctx, cam);

      // действующий закон: полоска у кромки тает вместе с ним, чтобы
      // «жёлтенькие молнии» перестали быть непонятно чем
      if (game.world.active && game.world.active.length) {
        var la = game.world.active[game.world.active.length - 1];
        var frac = Math.max(0, Math.min(1, la.left / (la.full || 1)));
        var lc = G.TRAIT_COLOR.chaos;
        var bw = w * 0.42 * frac;
        ctx.fillStyle = G.rgb(lc[0], lc[1], lc[2], 0.5);
        ctx.fillRect(w / 2 - bw / 2, 30, bw, 1.6);
        glow(ctx, w / 2, 30, 40 * frac, lc, 0.05);
      }

      // metamorphosis flash
      if (game.metaFlash > 0) {
        ctx.fillStyle = G.rgb(col[0], col[1], col[2], game.metaFlash * 0.35);
        ctx.fillRect(0, 0, w, h);
      }

      // glitch
      if (game.glitch > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = G.rgb(198, 255, 58, game.glitch * 0.08);
        ctx.fillRect(0, Math.random() * h, w, 4 + Math.random() * 10);
        ctx.fillStyle = G.rgb(78, 224, 255, game.glitch * 0.07);
        ctx.fillRect(0, Math.random() * h, w, 3);
        ctx.restore();
      }

      // vignette
      var vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.72);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.62)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);

      // energy breath at edge
      if (game.state === "play" || game.state === "birth") {
        var e = game.player.energy / game.player.maxEnergy;
        ctx.strokeStyle = G.rgb(col[0], col[1], col[2], 0.18 + (1 - e) * 0.25);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(24, h - 24, 10, -Math.PI / 2, -Math.PI / 2 + G.TAU * e);
        ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.beginPath();
        ctx.arc(24, h - 24, 10, 0, G.TAU);
        ctx.stroke();
      }

      ctx.restore();
    },

    // Зов рисуется дважды: как маяк в мире и как тяга у кромки экрана,
    // если маяк за спиной. Без стрелки «идти дальше» остаётся догадкой.
    drawCall: function (ctx, cam, game, t) {
      var c = game.world.call;
      var col = G.TRAIT_COLOR[c.trait] || [200, 220, 255];
      var p = this.worldToScreen(cam, c.x, c.y);
      var beat = 0.6 + 0.4 * Math.sin(t * 1.6 + c.phase);
      var w = cam.w;
      var h = cam.h;
      var onScreen = p.x > -40 && p.y > -40 && p.x < w + 40 && p.y < h + 40;

      if (onScreen) {
        glow(ctx, p.x, p.y, (60 + beat * 26) * cam.z, col, 0.16);
        ctx.strokeStyle = G.rgb(col[0], col[1], col[2], 0.35 + beat * 0.3);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, (26 + beat * 12) * cam.z, 0, G.TAU);
        ctx.stroke();
        ctx.fillStyle = G.rgb(col[0], col[1], col[2], 0.8);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.4 * cam.z, 0, G.TAU);
        ctx.fill();
        ctx.save();
        ctx.fillStyle = G.rgb(col[0], col[1], col[2], 0.85);
        ctx.font = "italic 19px 'Cormorant Garamond', serif";
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(0,0,0,0.9)";
        ctx.shadowBlur = 6;
        ctx.fillText(G.callText(c.trait), p.x, p.y - 34 * cam.z);
        ctx.restore();
        return;
      }

      // компас: тяга к зову у кромки экрана
      var ps = this.worldToScreen(cam, game.player.x, game.player.y);
      var ang = Math.atan2(p.y - ps.y, p.x - ps.x);
      var m = 46;
      var rx = Math.min(w / 2 - m, h / 2 - m);
      var ex = w / 2 + Math.cos(ang) * rx;
      var ey = h / 2 + Math.sin(ang) * rx;
      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(ang);
      glow(ctx, 0, 0, 26, col, 0.18 * (0.6 + beat * 0.6));
      ctx.fillStyle = G.rgb(col[0], col[1], col[2], 0.42 + beat * 0.34);
      ctx.beginPath();
      ctx.moveTo(11, 0);
      ctx.lineTo(-7, -6.5);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-7, 6.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      var dw = G.dist(game.player.x, game.player.y, c.x, c.y);
      ctx.save();
      ctx.fillStyle = G.rgb(col[0], col[1], col[2], 0.5 + beat * 0.25);
      ctx.font = "600 13px Manrope, sans-serif";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.9)";
      ctx.shadowBlur = 5;
      ctx.fillText(Math.round(dw) + "", ex - Math.cos(ang) * 18, ey - Math.sin(ang) * 18 + 4);
      ctx.restore();
    },

    drawBloom: function (ctx, cam, b, t) {
      var p = this.worldToScreen(cam, b.x, b.y);
      var r = (b.r || 8) * cam.z * (0.85 + Math.sin(t * 1.8 + b.phase) * 0.15);
      var c = b.c || G.TRAIT_COLOR.contemplation;
      glow(ctx, p.x, p.y, r * 4, c, 0.12);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(b.phase);
      ctx.strokeStyle = G.rgb(c[0], c[1], c[2], 0.65);
      ctx.lineWidth = Math.max(1, 1.4 * cam.z);
      for (var i = 0; i < 5; i++) {
        ctx.rotate(G.TAU / 5);
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.7, r * 0.32, r * 0.85, 0, 0, G.TAU);
        ctx.stroke();
      }
      ctx.restore();
      if (b.verse) {
        ctx.save();
        ctx.fillStyle = G.rgb(c[0], c[1], c[2], 0.92);
        ctx.font = "italic 19px 'Cormorant Garamond', serif";
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(0,0,0,0.9)";
        ctx.shadowBlur = 5;
        ctx.fillText(b.verse, p.x, p.y + r + 22);
        ctx.restore();
      }
    },

    drawCrack: function (ctx, cam, c, t) {
      var p = this.worldToScreen(cam, c.x, c.y);
      var r = (18 + Math.sin(t * 5 + c.phase) * 4) * cam.z;
      var col = G.TRAIT_COLOR.chaos || [190, 120, 255];
      glow(ctx, p.x, p.y, r * 3, col, 0.2);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(c.phase);
      ctx.strokeStyle = G.rgb(col[0], col[1], col[2], 0.8);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-r, 0);
      ctx.lineTo(-r * 0.35, -r * 0.45);
      ctx.lineTo(0, r * 0.18);
      ctx.lineTo(r * 0.35, -r * 0.55);
      ctx.lineTo(r, 0.1 * r);
      ctx.stroke();
      ctx.restore();
    },

    drawBoss: function (ctx, cam, b, t) {
      var p = this.worldToScreen(cam, b.x, b.y);
      var r = (b.r || 28) * cam.z;
      var col = [255, 75, 95];
      glow(ctx, p.x, p.y, r * 4, col, 0.22);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(t * 0.35);
      ctx.strokeStyle = G.rgb(col[0], col[1], col[2], 0.8);
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (var i = 0; i < 12; i++) {
        var a = (i / 12) * G.TAU;
        var rr = i % 2 ? r * 0.62 : r * 1.15;
        var x = Math.cos(a) * rr;
        var y = Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
      if (b.name) {
        ctx.save();
        ctx.fillStyle = G.rgb(255, 205, 215, 0.95);
        ctx.font = "italic 21px 'Cormorant Garamond', serif";
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(0,0,0,0.9)";
        ctx.shadowBlur = 5;
        ctx.fillText(b.name, p.x, p.y - r - 16);
        ctx.restore();
      }
    },

    drawNode: function (ctx, cam, n, t, game) {
      var p = this.worldToScreen(cam, n.x, n.y);
      if (p.x < -80 || p.y < -80 || p.x > cam.w + 80 || p.y > cam.h + 80) return;
      var c = n.color();
      var pulse = 0.85 + 0.15 * Math.sin(t * 2 + n.phase);
      var r = n.r * cam.z * pulse;
      if (n.state === "unformed") {
        glow(ctx, p.x, p.y, r * 2.4, c, 0.07 + n.care * 0.05);
        ctx.strokeStyle = G.rgb(c[0], c[1], c[2], 0.22 + 0.2 * pulse);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 0.7, n.phase, n.phase + Math.PI * 1.2);
        ctx.stroke();
        ctx.fillStyle = G.rgb(c[0], c[1], c[2], 0.35);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.2, 0, G.TAU);
        ctx.fill();
      } else {
        glow(ctx, p.x, p.y, r * 3.2, c, 0.16);
        ctx.globalCompositeOperation = "lighter";
        glow(ctx, p.x, p.y, r * 1.4, c, 0.28);
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = G.rgb(c[0], c[1], c[2], 0.85);
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(3, r * 0.28), 0, G.TAU);
        ctx.fill();
        ctx.strokeStyle = G.rgb(c[0], c[1], c[2], 0.35);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 0.85, 0, G.TAU);
        ctx.stroke();
        if (game.world.anchors.indexOf(n.id) >= 0) {
          ctx.strokeStyle = G.rgb(255, 220, 170, 0.5);
          ctx.beginPath();
          ctx.arc(p.x, p.y, r * 1.15, 0, G.TAU);
          ctx.stroke();
        }
        if (n.kind === "still" && n.verse) {
          ctx.save();
          ctx.fillStyle = G.rgb(230, 224, 255, 0.9);
          ctx.font = "italic 20px 'Cormorant Garamond', serif";
          ctx.textAlign = "center";
          ctx.shadowColor = "rgba(0,0,0,0.9)";
          ctx.shadowBlur = 5;
          ctx.fillText(n.verse, p.x, p.y + r + 16);
          ctx.restore();
        }
      }

      // gaze progress
      if (game.player.gaze === n && game.player.gazeT > 0) {
        var pr = G.clamp(game.player.gazeT / 1.35, 0, 1);
        ctx.strokeStyle = G.rgb(c[0], c[1], c[2], 0.8);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 1.35, -Math.PI / 2, -Math.PI / 2 + G.TAU * pr);
        ctx.stroke();
      }
    },

    drawBeing: function (ctx, cam, b, t) {
      var p = this.worldToScreen(cam, b.x, b.y);
      var c = G.TRAIT_COLOR[b.hue] || G.TRAIT_COLOR.empathy;
      var r = (b.r + Math.sin(t * 2 + b.phase) * 1.5) * cam.z;
      if (b.isYesterday) {
        glow(ctx, p.x, p.y, r * 5, [255, 230, 180], 0.16);
        ctx.strokeStyle = "rgba(255,230,180,0.35)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 1.4, 0, G.TAU);
        ctx.stroke();
      }
      glow(ctx, p.x, p.y, r * 3, c, 0.14 + b.bond * 0.15);
      ctx.fillStyle = G.rgb(c[0], c[1], c[2], 0.75);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 0.45, 0, G.TAU);
      ctx.fill();
      // имя видно всегда: безымянное — призрачно, своё — ярко
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.9)";
      ctx.shadowBlur = 5;
      ctx.textAlign = "center";
      if (b.named || b.bond > 0.4) {
        ctx.fillStyle = G.rgb(255, 236, 236, 0.85);
        ctx.font = "italic 20px 'Cormorant Garamond', serif";
      } else {
        ctx.fillStyle = G.rgb(220, 216, 236, 0.38);
        ctx.font = "italic 17px 'Cormorant Garamond', serif";
      }
      ctx.fillText(b.name, p.x, p.y + r + 14);
      ctx.restore();
    },

    drawWound: function (ctx, cam, u, t) {
      var p = this.worldToScreen(cam, u.x, u.y);
      var c = [255, 60, 78];
      var r = (u.r + Math.sin(t * 6 + u.phase) * 2) * cam.z;
      glow(ctx, p.x, p.y, r * 3.4, c, 0.2);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(u.phase);
      ctx.strokeStyle = G.rgb(255, 70, 80, 0.8);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (var i = 0; i < 5; i++) {
        var a = (i / 5) * G.TAU;
        var rr = i % 2 ? r * 0.4 : r * 0.85;
        var x = Math.cos(a) * rr;
        var y = Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    },

    drawPlayer: function (ctx, cam, game, t, col) {
      var p = game.player;
      var s = this.worldToScreen(cam, p.x, p.y);
      // trail
      p.trail.push({ x: p.x, y: p.y, a: 1 });
      if (p.trail.length > 18) p.trail.shift();
      ctx.lineWidth = 2;
      ctx.strokeStyle = G.rgb(col[0], col[1], col[2], 0.25);
      ctx.beginPath();
      for (var i = 0; i < p.trail.length; i++) {
        var tr = this.worldToScreen(cam, p.trail[i].x, p.trail[i].y);
        if (i === 0) ctx.moveTo(tr.x, tr.y);
        else ctx.lineTo(tr.x, tr.y);
      }
      ctx.stroke();

      glow(ctx, s.x, s.y, 48 * cam.z, col, 0.28);
      ctx.globalCompositeOperation = "lighter";
      glow(ctx, s.x, s.y, 22 * cam.z, [255, 255, 255], 0.35);
      ctx.globalCompositeOperation = "source-over";

      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(s.x, s.y, 4.2 * cam.z, 0, G.TAU);
      ctx.fill();

      // DNA motes
      for (var k = 0; k < 6; k++) {
        var trait = G.TRAITS[k];
        var v = game.dna.get(trait);
        var ang = -Math.PI / 2 + k * (Math.PI / 3) + t * 0.35;
        var rad = (16 + v * 14) * cam.z;
        var mx = s.x + Math.cos(ang) * rad;
        var my = s.y + Math.sin(ang) * rad;
        var tc = G.TRAIT_COLOR[trait];
        ctx.fillStyle = G.rgb(tc[0], tc[1], tc[2], 0.25 + v * 0.7);
        ctx.beginPath();
        ctx.arc(mx, my, 1.6 + v * 2.2, 0, G.TAU);
        ctx.fill();
      }
    }
  };
})(IGRA);
