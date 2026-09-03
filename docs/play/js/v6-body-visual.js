var IGRA = IGRA || {};
(function (G) {
  "use strict";

  /* V6-005: body history is perceived, not exposed as a stats panel. */
  var FORM = {
    tender: { arc: 0.12, pulse: 1.00 },
    echo: { arc: 0.34, pulse: 1.08 },
    still: { arc: 0.50, pulse: 0.88 },
    seeking: { arc: 0.72, pulse: 1.16 },
    scar: { arc: 0.88, pulse: 0.92 },
    scarred: { arc: 0.88, pulse: 0.92 },
    shard: { arc: 1.06, pulse: 1.24 },
    shoreborn: { arc: 0.00, pulse: 1.00 }
  };

  function appearance(game) {
    var b = game && game.bodyIdentity ? game.bodyIdentity : null;
    var form = b && b.form ? String(b.form) : "shoreborn";
    var base = form.replace(/-scarred$/, "");
    if (base === "scarred") base = "scar";
    var f = FORM[base] || FORM.shoreborn;
    var depth = Math.max(0, Math.min(3, Number(b && b.depth) || 0));
    var scars = Math.max(0, Math.min(100, Number(b && b.scars) || 0));
    return { form: form, base: base, depth: depth, scars: scars, arc: f.arc, pulse: f.pulse,
      signature: b && b.signature ? String(b.signature) : form };
  }

  function drawBody(ctx, game) {
    if (!ctx || !game || !game.player || !G.Renderer) return;
    var a = appearance(game), cam = game.cam;
    var p = G.Renderer.worldToScreen(cam, game.player.x, game.player.y);
    var dna = game.dna, c = dna && dna.blendRgb ? dna.blendRgb() : [180, 200, 220];
    var t = Number(game.time) || 0;
    var strength = 0.10 + a.depth * 0.035 + Math.min(a.scars, 6) * 0.012;
    var pulse = 0.88 + Math.sin(t * (1.2 * a.pulse)) * 0.12;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = G.rgb(c[0], c[1], c[2], Math.min(0.28, strength * pulse));
    ctx.lineWidth = 1 + a.depth * 0.35;
    var radius = (22 + a.depth * 5) * (0.96 + pulse * 0.05);
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, a.arc, a.arc + Math.PI * (1.15 + a.depth * 0.18));
    ctx.stroke();

    if (a.depth >= 2) {
      ctx.strokeStyle = G.rgb(c[0], c[1], c[2], Math.min(0.22, strength * 0.8));
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius + 6, a.arc + Math.PI, a.arc + Math.PI * 1.72);
      ctx.stroke();
    }

    var scarCount = Math.min(4, Math.floor(a.scars / 2));
    for (var i = 0; i < scarCount; i++) {
      var sa = a.arc + 0.55 + i * 1.37;
      var sr = radius + 3 + i * 2;
      ctx.strokeStyle = G.rgb(c[0], c[1], c[2], 0.18);
      ctx.beginPath();
      ctx.moveTo(p.x + Math.cos(sa) * sr, p.y + Math.sin(sa) * sr);
      ctx.lineTo(p.x + Math.cos(sa + 0.22) * (sr + 5), p.y + Math.sin(sa + 0.22) * (sr + 5));
      ctx.stroke();
    }
    ctx.restore();
  }

  function installRenderer() {
    if (!G.Renderer || !G.Renderer.draw || G.Renderer.__v6BodyVisual) return;
    var base = G.Renderer.draw;
    G.Renderer.draw = function (ctx, game) {
      base.call(this, ctx, game);
      try { drawBody(ctx, game); } catch (e) {}
    };
    G.Renderer.__v6BodyVisual = true;
  }

  function installAudio() {
    if (!G.Audio || !G.Audio.update || G.Audio.__v6BodyVisual) return;
    var base = G.Audio.update;
    G.Audio.update = function (dt, dna, state, tide, world) {
      base.call(this, dt, dna, state, tide, world);
      try {
        var game = G.Game && G.Game.current ? G.Game.current : null;
        var b = game && game.bodyIdentity;
        if (this.dnaFilter && b) {
          var depth = Math.max(0, Math.min(3, Number(b.depth) || 0));
          var scars = Math.max(0, Math.min(6, Number(b.scars) || 0));
          var target = 760 + depth * 95 - scars * 22;
          this.dnaFilter.frequency.value = Math.max(520, Math.min(1200, target));
        }
      } catch (e) {}
    };
    G.Audio.__v6BodyVisual = true;
  }

  G.V6BodyVisual = { appearance: appearance, draw: drawBody };
  installRenderer();
  installAudio();
})(IGRA);
