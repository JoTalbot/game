var IGRA = IGRA || {};
(function (G) {
  "use strict";
  // V3-033: interaction clarity on crowded shores. The renderer's normal
  // node halo is useful when the world is sparse, but becomes indistinguishable
  // from selection when dozens of live nodes are on screen. Keep the world
  // luminous, while reducing the visual strength of ordinary node outlines
  // once local density becomes high.
  if (!G.Renderer || !G.Renderer.drawNode || G.Renderer.__v3033Density) return;
  var original = G.Renderer.drawNode;
  G.Renderer.drawNode = function (ctx, cam, n, t, game) {
    var w = game && game.world;
    if (!w || !w.nodes || w.nodes.length < 20 || n.state !== "alive") {
      return original.call(this, ctx, cam, n, t, game);
    }
    var near = 0;
    var radius = 180;
    var r2 = radius * radius;
    for (var i = 0; i < w.nodes.length; i++) {
      var o = w.nodes[i];
      if (o === n || o.dead || o.state === "gone") continue;
      var dx = o.x - n.x, dy = o.y - n.y;
      if (dx * dx + dy * dy < r2) near++;
      if (near >= 9) break;
    }
    if (near < 7) return original.call(this, ctx, cam, n, t, game);

    var stroke = ctx.stroke;
    ctx.stroke = function () {};
    try {
      return original.call(this, ctx, cam, n, t, game);
    } finally {
      ctx.stroke = stroke;
    }
  };
  G.Renderer.__v3033Density = true;
})(IGRA);
