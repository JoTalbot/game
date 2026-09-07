var IGRA = IGRA || {};
(function (G) {
  "use strict";

  // V3-038/V3-049 render budget. The hot path must allocate nothing.
  // The previous implementation created Array#slice copies and replaced
  // ctx.stroke with a fresh closure on EVERY frame. On weak WebViews that
  // turns a presentation guard into GC pressure and can erase the FPS it
  // was supposed to protect. Keep the policy, remove the per-frame churn.
  if (!G.Renderer || !G.Renderer.draw || G.Renderer.__v3038RenderBudget) return;

  var originalDraw = G.Renderer.draw;

  G.Renderer.draw = function (ctx, game) {
    var nodes = game && game.world && game.world.nodes;
    var live = 0;
    if (nodes) {
      for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].state === "alive") live++;
      }
    }

    // Patch each persistent CanvasRenderingContext only once. The closure is
    // retained by the context; it is NOT allocated on subsequent frames.
    if (ctx && !ctx.__v3038StrokeBudget) {
      var originalStroke = ctx.stroke;
      if (typeof originalStroke === "function") {
        ctx.stroke = function () {
          if (G.Quality && G.Quality.lowDevice && this.lineWidth === 1) {
            var style = String(this.strokeStyle || "");
            var alpha = null;
            var m = style.match(/rgba?\([^)]*,\s*([0-9.]+)\s*\)$/i);
            if (m) alpha = parseFloat(m[1]);
            if (alpha !== null && alpha <= 0.12) return;
          }
          return originalStroke.apply(this, arguments);
        };
        ctx.__v3038StrokeBudget = true;
      }
    }

    var weak = !!(G.Quality && G.Quality.lowDevice);
    var oldFarLen = -1;
    var oldStarsLen = -1;
    var oldBloomsLen = -1;
    try {
      if (weak) {
        // Temporarily cap existing arrays by length. Unlike slice(), this
        // allocates nothing and preserves the exact same backing arrays.
        if (this.starsFar && this.starsFar.length > 48) {
          oldFarLen = this.starsFar.length;
          this.starsFar.length = 48;
        }
        if (game && game.world) {
          if (game.world.stars && game.world.stars.length > 48 && !game.sky) {
            oldStarsLen = game.world.stars.length;
            game.world.stars.length = 48;
          }
          if (game.world.blooms && game.world.blooms.length > 18) {
            oldBloomsLen = game.world.blooms.length;
            game.world.blooms.length = 18;
          }
        }
      }
      return originalDraw.call(this, ctx, game);
    } finally {
      if (oldFarLen >= 0) this.starsFar.length = oldFarLen;
      if (game && game.world) {
        if (oldStarsLen >= 0) game.world.stars.length = oldStarsLen;
        if (oldBloomsLen >= 0) game.world.blooms.length = oldBloomsLen;
      }
    }
  };

  G.Renderer.__v3038RenderBudget = true;
  G.Renderer.__v3049RenderBudget = true;
})(IGRA);
