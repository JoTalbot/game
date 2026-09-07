var IGRA = IGRA || {};
(function (G) {
  "use strict";
  // V3-034: cap runaway echo population without deleting the mechanic.
  // The shore may grow beings, but a small mobile screen cannot remain
  // readable if every echo survives forever. Reuse the oldest unbonded,
  // non-voice being once the soft cap is reached.
  if (!G.World || !G.World.prototype.crystallize || G.World.prototype.__v3034BeingCap) return;

  // V3-051: a physical 3.0.1 run exposed repeated render failures reading
  // `age` from an invalid being entry. Do not hide arbitrary exceptions:
  // repair the collection boundary before update/render and preserve the
  // object shape expected by every downstream organ. Old saves can contain
  // partially restored beings, and future lifecycle code may temporarily
  // leave holes while pruning. The renderer must never receive either.
  function sanitizeBeings(world) {
    if (!world) return;
    if (!Array.isArray(world.beings)) {
      world.beings = [];
      return;
    }
    for (var i = world.beings.length - 1; i >= 0; i--) {
      var b = world.beings[i];
      if (!b || typeof b !== "object") {
        world.beings.splice(i, 1);
        continue;
      }
      if (b.age == null || !isFinite(Number(b.age))) b.age = 0;
      if (!Array.isArray(b.memory)) b.memory = [];
      if (b.dead == null) b.dead = false;
      if (b.bond == null || !isFinite(Number(b.bond))) b.bond = 0;
      if (b.fear == null || !isFinite(Number(b.fear))) b.fear = 0.2;
    }
  }

  var original = G.World.prototype.crystallize;
  G.World.prototype.crystallize = function (node, gest, dna) {
    sanitizeBeings(this);
    var result = original.apply(this, arguments);
    sanitizeBeings(this);
    if (this.beings && this.beings.length > 12) {
      var victim = null, oldest = -1;
      for (var i = 0; i < this.beings.length; i++) {
        var b = this.beings[i];
        if (!b || b.dead || b.isVoice || b.bond > 0.25) continue;
        var age = b.age == null ? 0 : b.age;
        if (age > oldest) {
          oldest = age;
          victim = b;
        }
      }
      if (!victim) {
        for (var j = 0; j < this.beings.length; j++) {
          var fallback = this.beings[j];
          if (fallback && !fallback.dead && !fallback.isVoice && fallback.bond <= 0.4) {
            victim = fallback;
            break;
          }
        }
      }
      if (victim) victim.dead = true;
      this.beings = this.beings.filter(function (b2) { return b2 && !b2.dead; });
    }
    return result;
  };

  // The update hook catches malformed entries created by load/restore or by
  // another lifecycle organ before they can reach an age-based consumer.
  if (!G.World.prototype.__v3051BeingSanitized) {
    var originalUpdate = G.World.prototype.update;
    G.World.prototype.update = function () {
      sanitizeBeings(this);
      var result = originalUpdate.apply(this, arguments);
      sanitizeBeings(this);
      return result;
    };
    G.World.prototype.__v3051BeingSanitized = true;
  }

  // Render is a second boundary because browser restore/plugin order can
  // mutate world.beings after update. This is deliberately a narrow repair,
  // not a try/catch around rendering, so unrelated render errors still fail.
  if (G.Renderer && G.Renderer.draw && !G.Renderer.__v3051BeingSanitized) {
    var originalDraw = G.Renderer.draw;
    G.Renderer.draw = function (ctx, game) {
      if (game && game.world) sanitizeBeings(game.world);
      return originalDraw.apply(this, arguments);
    };
    G.Renderer.__v3051BeingSanitized = true;
  }

  G.World.prototype.__v3034BeingCap = true;
})(IGRA);