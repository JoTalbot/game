var IGRA = IGRA || {};
(function (G) {
  "use strict";

  // V6-005: история тела должна быть видна и слышна, но не превращаться
  // в HUD. Сигнал намеренно лёгкий: форма меняет рисунок вокруг игрока,
  // глубина добавляет один слой, шрамы дают короткий рваный акцент.
  var FORM = {
    tender: { arc: 1, wobble: 0.20, note: 0.98 },
    echo: { arc: 2, wobble: 0.35, note: 1.04 },
    still: { arc: 1, wobble: 0.05, note: 0.92 },
    seeking: { arc: 3, wobble: 0.45, note: 1.10 },
    scar: { arc: 3, wobble: 0.70, note: 0.88 },
    shard: { arc: 4, wobble: 0.90, note: 1.16 },
    shoreborn: { arc: 1, wobble: 0.15, note: 1 }
  };

  function profile(game) {
    var b = game && game.bodyIdentity;
    if (!b && G.V6Body && G.V6Body.profile) b = G.V6Body.profile();
    b = b || { form: "shoreborn", depth: 0, scars: 0 };
    var form = String(b.form || "shoreborn").split("-")[0];
    var f = FORM[form] || FORM.shoreborn;
    return {
      form: form,
      depth: Math.max(0, Math.min(3, Number(b.depth) || 0)),
      scars: Math.max(0, Math.min(9, Number(b.scars) || 0)),
      arc: f.arc,
      wobble: f.wobble,
      note: f.note
    };
  }

  G.V6Signals = {
    profile: profile
  };

  // Renderer уже загружен раньше engine, поэтому безопасно добавляем
  // слой после оригинального drawPlayer. Сам игрок остаётся тем же.
  if (G.Renderer && G.Renderer.drawPlayer && !G.Renderer.__v6Signals) {
    var baseDrawPlayer = G.Renderer.drawPlayer;
    G.Renderer.drawPlayer = function (ctx, cam, game, t, col) {
      baseDrawPlayer.call(this, ctx, cam, game, t, col);
      var q = profile(game);
      var p = game.player;
      var s = this.worldToScreen(cam, p.x, p.y);
      var alpha = 0.08 + q.depth * 0.025;
      var r = (18 + q.depth * 5) * cam.z;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(t * (0.10 + q.wobble * 0.12));
      ctx.strokeStyle = G.rgb(col[0], col[1], col[2], alpha);
      ctx.lineWidth = Math.max(1, cam.z);
      for (var i = 0; i < q.arc; i++) {
        var off = i * (G.TAU / Math.max(1, q.arc)) + Math.sin(t * 0.7 + i) * q.wobble;
        ctx.beginPath();
        ctx.arc(0, 0, r + i * 3, off, off + 1.55 + q.depth * 0.12);
        ctx.stroke();
      }
      if (q.scars > 0) {
        ctx.strokeStyle = G.rgb(col[0], col[1], col[2], Math.min(0.22, 0.07 + q.scars * 0.015));
        ctx.beginPath();
        ctx.moveTo(-r * 0.65, -r * 0.25);
        ctx.lineTo(r * 0.55, r * 0.30);
        ctx.stroke();
      }
      ctx.restore();
    };
    G.Renderer.__v6Signals = true;
  }

  // Аудио не получает новый источник звука. Меняется только уже существующий
  // drone filter и высоты дронов, поэтому количество WebAudio-узлов не растёт.
  if (G.Audio && G.Audio.update && !G.Audio.__v6Signals) {
    var baseAudio = G.Audio.update;
    G.Audio.update = function (dt, dna, state, tide, world) {
      baseAudio.call(this, dt, dna, state, tide, world);
      var q = profile({ bodyIdentity: G.V6Body && G.V6Body.profile ? G.V6Body.profile() : null });
      if (!this.ready || !this.ctx || !this.drones || !this.drones.length) return;
      var now = this.ctx.currentTime;
      var bend = 1 + (q.note - 1) * 0.018 + q.depth * 0.002 - Math.min(9, q.scars) * 0.0015;
      for (var i = 0; i < this.drones.length; i++) {
        this.drones[i].o.frequency.setTargetAtTime(this.drones[i].o.frequency.value * bend, now, 1.1);
      }
      this.bodyTone = { form: q.form, depth: q.depth, scars: q.scars, bend: bend };
    };
    G.Audio.__v6Signals = true;
  }
})(IGRA);
