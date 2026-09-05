var IGRA = IGRA || {};
(function (G) {
  "use strict";

  // V3-047: пальцу нужен запас, глазу — чистый берег.
  // Не увеличиваем визуальные узлы и не добавляем HUD. Расширяем только
  // невидимую область выбора живого узла, если штатный tap-target не сработал.
  var TARGET = 104;
  var MIN = 84;

  function touchNode(game) {
    if (!game || !game.world || !game.player || !game.input) return null;
    if (game.state !== "play" && game.state !== "birth") return null;
    if (game.input.wx == null || game.input.wy == null) return null;
    var node = game.world.nearestNode(game.input.wx, game.input.wy, TARGET);
    if (!node || node.state !== "alive" || node.dead) return null;
    if (G.dist(game.player.x, game.player.y, node.x, node.y) >= 220) return null;
    return node;
  }

  function capture(game, node) {
    game.player.gaze = node;
    game.gazeTarget = null;
    game.player.gazeT = 0;
    game.input.gsx = game.input.x;
    game.input.gsy = game.input.y;
    game.input.hold = 0;
    if (G.Report) G.Report.act("gazes");
    if (game.dna) game.dna.feed("contemplation", 0.01);
    if (game.dna && game.dna.gazes === 0 && G.Voice) G.Voice.say("firstGaze");
  }

  if (G.Game && G.Game.prototype && G.Game.prototype.onDown &&
      !G.Game.prototype.__v3047TargetPatch) {
    var proto = G.Game.prototype;
    var originalDown = proto.onDown;
    proto.onDown = function () {
      var result = originalDown.apply(this, arguments);
      if (this.player && !this.player.gaze && !this.gazeTarget) {
        var node = touchNode(this);
        if (node) {
          capture(this, node);
          return;
        }
      }
      return result;
    };
    proto.__v3047TargetPatch = true;
  }

  // Возвращение должно ощущаться как изменение берега, но без панели и
  // постоянной подсказки. Один короткий ripple вокруг игрока появляется
  // только когда SpatialMemory действительно увеличила счётчик returns.
  if (G.SpatialMemory && G.SpatialMemory.observe && !G.SpatialMemory.__v3047MeaningPatch) {
    var originalObserve = G.SpatialMemory.observe;
    G.SpatialMemory.observe = function (dt, game) {
      var before = G.SpatialMemory.profile ? Number(G.SpatialMemory.profile().returns || 0) : 0;
      var result = originalObserve.call(this, dt, game);
      var after = G.SpatialMemory.profile ? Number(G.SpatialMemory.profile().returns || 0) : before;
      if (game && after > before) game.__v3047ReturnBeat = 1.25;
      return result;
    };
    G.SpatialMemory.__v3047MeaningPatch = true;
  }

  if (G.Renderer && G.Renderer.draw && !G.Renderer.__v3047MeaningPatch) {
    var originalDraw = G.Renderer.draw;
    G.Renderer.draw = function (ctx, game) {
      originalDraw.apply(this, arguments);
      var beat = game && Number(game.__v3047ReturnBeat || 0);
      if (!beat || !game.player || !game.cam) return;
      var dt = Math.max(0, Math.min(0.05, Number(game.dt) || 1 / 60));
      game.__v3047ReturnBeat = Math.max(0, beat - dt);
      var z = Number(game.cam.z) || 1;
      var sx = (game.player.x - game.cam.x) * z + game.cam.w / 2;
      var sy = (game.player.y - game.cam.y) * z + game.cam.h / 2;
      var p = 1 - game.__v3047ReturnBeat / 1.25;
      var radius = 16 + p * 28;
      ctx.save();
      ctx.strokeStyle = G.rgb(220, 230, 255, 0.20 * (1 - p));
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, G.TAU);
      ctx.stroke();
      ctx.restore();
    };
    G.Renderer.__v3047MeaningPatch = true;
  }

  G.TouchMeaning = {
    target: TARGET,
    min: MIN,
    version: "3.0.1-v3047"
  };
})(IGRA);
