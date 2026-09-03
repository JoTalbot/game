var IGRA = IGRA || {};
(function (G) {
  "use strict";

  // V3-036: действительно спокойный старт. На телефоне три узла дают
  // понятное пространство для первого жеста. Первые 25 секунд также не
  // запускают автоматический frontier-spawn, чтобы игрок не оказался в
  // поле из новых целей раньше, чем успел сделать первый шаг.
  if (!G.World || !G.World.prototype.birthShore || G.World.prototype.__v3036StartDensity) return;

  var originalBirth = G.World.prototype.birthShore;
  G.World.prototype.birthShore = function (player, dna) {
    var result = originalBirth.apply(this, arguments);

    // Только первый берег. Позднейшее рождение через Director/Spawn не режем.
    if (this.nodes && this.nodes.length > 3) {
      var first = [];
      for (var i = 0; i < this.nodes.length; i++) {
        var n = this.nodes[i];
        if (n && n.hint) first.push(n);
      }
      if (first.length >= 3) this.nodes = first.slice(0, 3);
    }
    return result;
  };

  // Director продолжает считать движение, ДНК и органы, но его автоматический
  // scatter временно глушится. После 25 секунд штатная динамика возвращается.
  if (G.Director && G.Director.observe && !G.Director.__v3036BirthGrace) {
    var originalObserve = G.Director.observe;
    G.Director.observe = function (dt, game) {
      var age = game && game.dna ? game.dna.age : 999;
      if (age < 25 && game && game.world) {
        var world = game.world;
        var oldScatter = world.scatter;
        world.scatter = function () {};
        try {
          return originalObserve.apply(this, arguments);
        } finally {
          world.scatter = oldScatter;
        }
      }
      return originalObserve.apply(this, arguments);
    };
    G.Director.__v3036BirthGrace = true;
  }

  G.World.prototype.__v3036StartDensity = true;
})(IGRA);
