var IGRA = IGRA || {};
(function (G) {
  "use strict";
  // V3-034: cap runaway echo population without deleting the mechanic.
  if (!G.World || !G.World.prototype.crystallize || G.World.prototype.__v3034BeingCap) return;

  // V3-051/V3-052: runtime collections are a trust boundary. Physical 3.0.1
  // still reported `Cannot read properties of undefined (reading 'age')` after
  // the being guard shipped. Audit found the remaining direct dereference in
  // World.update: `this.blooms[bi].age += dt`. A partial/legacy save can carry
  // null entries, and renderer/update must never trust persisted collections.
  function cleanArray(world, key, defaults) {
    if (!world) return;
    var src = world[key];
    if (!Array.isArray(src)) {
      world[key] = [];
      return;
    }
    for (var i = src.length - 1; i >= 0; i--) {
      var item = src[i];
      if (!item || typeof item !== "object") {
        src.splice(i, 1);
        continue;
      }
      if (defaults) defaults(item);
    }
  }

  function sanitizeRuntimeCollections(world) {
    if (!world) return;
    cleanArray(world, "beings", function (b) {
      if (b.age == null || !isFinite(Number(b.age))) b.age = 0;
      if (!Array.isArray(b.memory)) b.memory = [];
      if (b.dead == null) b.dead = false;
      if (b.bond == null || !isFinite(Number(b.bond))) b.bond = 0;
      if (b.fear == null || !isFinite(Number(b.fear))) b.fear = 0.2;
      if (b.phase == null || !isFinite(Number(b.phase))) b.phase = 0;
    });
    cleanArray(world, "blooms", function (b) {
      if (b.age == null || !isFinite(Number(b.age))) b.age = 0;
      if (b.phase == null || !isFinite(Number(b.phase))) b.phase = 0;
      if (b.r == null || !isFinite(Number(b.r))) b.r = 8;
    });
    cleanArray(world, "wounds", function (w) {
      if (w.age == null || !isFinite(Number(w.age))) w.age = 0;
      if (w.phase == null || !isFinite(Number(w.phase))) w.phase = 0;
    });
    cleanArray(world, "cracks", function (c) {
      if (c.phase == null || !isFinite(Number(c.phase))) c.phase = 0;
    });
    cleanArray(world, "stars", function (s) {
      if (s.tw == null || !isFinite(Number(s.tw))) s.tw = 0;
    });
    cleanArray(world, "forgotten");
    cleanArray(world, "active", function (a) {
      if (a.left == null || !isFinite(Number(a.left))) a.left = 0;
      if (a.full == null || !isFinite(Number(a.full))) a.full = 1;
    });
  }

  var original = G.World.prototype.crystallize;
  G.World.prototype.crystallize = function (node, gest, dna) {
    sanitizeRuntimeCollections(this);
    var result = original.apply(this, arguments);
    sanitizeRuntimeCollections(this);
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

  if (!G.World.prototype.__v3051BeingSanitized) {
    var originalUpdate = G.World.prototype.update;
    G.World.prototype.update = function () {
      sanitizeRuntimeCollections(this);
      var result = originalUpdate.apply(this, arguments);
      sanitizeRuntimeCollections(this);
      return result;
    };
    G.World.prototype.__v3051BeingSanitized = true;
  }

  if (G.Renderer && G.Renderer.draw && !G.Renderer.__v3051BeingSanitized) {
    var originalDraw = G.Renderer.draw;
    G.Renderer.draw = function (ctx, game) {
      if (game && game.world) sanitizeRuntimeCollections(game.world);
      return originalDraw.apply(this, arguments);
    };
    G.Renderer.__v3051BeingSanitized = true;
  }

  G.RuntimeCollections = { sanitize: sanitizeRuntimeCollections };
  G.World.prototype.__v3034BeingCap = true;
})(IGRA);
