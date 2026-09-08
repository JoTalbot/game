var IGRA = IGRA || {};
(function (G) {
  "use strict";

  // V3-052: V3-051 proved that invalid being entries were not the only
  // malformed runtime collection. A physical 3.0.1 run still reported
  // `Cannot read properties of undefined (reading 'age')` after the being
  // guard shipped. Code search exposed the remaining direct dereference in
  // World.update: `this.blooms[bi].age += dt`. A stale/partial save can carry
  // null/undefined bloom entries, and renderer/update must never trust a
  // persisted collection boundary.
  //
  // Keep this narrow. We repair collection members, not arbitrary objects,
  // and we do not catch renderer exceptions. Unexpected bugs must remain
  // visible to Report.error.
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

  function sanitize(world) {
    if (!world) return;
    cleanArray(world, "beings", function (b) {
      if (b.age == null || !isFinite(Number(b.age))) b.age = 0;
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

  if (G.World && G.World.prototype && !G.World.prototype.__v3052RuntimeCollections) {
    var originalUpdate = G.World.prototype.update;
    G.World.prototype.update = function () {
      sanitize(this);
      var result = originalUpdate.apply(this, arguments);
      sanitize(this);
      return result;
    };
    G.World.prototype.__v3052RuntimeCollections = true;
  }

  if (G.Renderer && G.Renderer.draw && !G.Renderer.__v3052RuntimeCollections) {
    var originalDraw = G.Renderer.draw;
    G.Renderer.draw = function (ctx, game) {
      if (game && game.world) sanitize(game.world);
      return originalDraw.apply(this, arguments);
    };
    G.Renderer.__v3052RuntimeCollections = true;
  }

  G.RuntimeCollections = { sanitize: sanitize };
})(IGRA);
