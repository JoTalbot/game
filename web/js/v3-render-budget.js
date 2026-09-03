var IGRA = IGRA || {};
(function (G) {
  "use strict";

  // V3-038: при высокой плотности режем только второстепенные связи.
  // Сами узлы, существа, зов и интерактивные линии не отключаем.
  // Слой links в renderer.js рисует lineWidth=1 и alpha <= 0.12.
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

    // До 14 живых узлов ничего не меняем.
    if (live < 14) return originalDraw.call(this, ctx, game);

    var originalStroke = ctx.stroke;
    ctx.stroke = function () {
      // В renderer.js обычная связь между узлами: lineWidth=1,
      // strokeStyle=rgba/rgb(..., alpha <= 0.12). Не трогаем остальные линии.
      var style = String(ctx.strokeStyle || "");
      var alpha = null;
      var m = style.match(/rgba?\([^)]*,\s*([0-9.]+)\s*\)$/i);
      if (m) alpha = parseFloat(m[1]);
      if (ctx.lineWidth === 1 && alpha !== null && alpha <= 0.12) return;
      return originalStroke.apply(ctx, arguments);
    };

    try {
      return originalDraw.call(this, ctx, game);
    } finally {
      ctx.stroke = originalStroke;
    }
  };

  G.Renderer.__v3038RenderBudget = true;
})(IGRA);
