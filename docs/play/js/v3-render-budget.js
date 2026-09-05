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
    if (live < 14 && !(G.Quality && G.Quality.lowDevice)) return originalDraw.call(this, ctx, game);

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

    // V3-049: на слабом телефоне режем только декоративные коллекции во
    // время одного кадра. Мир, узлы, существа и их состояния не меняются.
    // Renderer.js уже имеет budgets для glow/fog/particles, но 160 дальних
    // звёзд и до 40 цветов всё равно выполнялись каждый кадр. Именно эти
    // циклы дают много мелких canvas-операций, которые WebView плохо
    // пережёвывает на слабом CPU/GPU.
    var weak = !!(G.Quality && G.Quality.lowDevice);
    var oldFar = null;
    var oldStars = null;
    var oldBlooms = null;
    var oldTide = null;
    try {
      if (weak) {
        oldFar = this.starsFar;
        if (oldFar && oldFar.length > 48) this.starsFar = oldFar.slice(0, 48);

        if (game && game.world) {
          oldStars = game.world.stars;
          if (oldStars && oldStars.length > 48 && !game.sky) game.world.stars = oldStars.slice(0, 48);

          oldBlooms = game.world.blooms;
          if (oldBlooms && oldBlooms.length > 18) game.world.blooms = oldBlooms.slice(0, 18);

          // Tide is presentation-only here: suppress its full-screen radial
          // gradient on weak devices, without changing the saved world value.
          oldTide = game.world.tide;
          if (oldTide > 0) game.world.tide = 0;
        }
      }
      return originalDraw.call(this, ctx, game);
    } finally {
      if (weak) {
        if (oldFar) this.starsFar = oldFar;
        if (game && game.world) {
          if (oldStars) game.world.stars = oldStars;
          if (oldBlooms) game.world.blooms = oldBlooms;
          if (oldTide != null) game.world.tide = oldTide;
        }
      }
      ctx.stroke = originalStroke;
    }
  };

  G.Renderer.__v3038RenderBudget = true;
  G.Renderer.__v3049RenderBudget = true;
})(IGRA);