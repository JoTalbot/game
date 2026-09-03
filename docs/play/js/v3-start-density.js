var IGRA = IGRA || {};
(function (G) {
  "use strict";

  // V3-035: спокойный старт. Берег должен дать игроку пространство для
  // первого движения, а не сразу вываливать на экран декоративную свалку.
  // birthShore исторически создаёт 5 смысловых узлов + 7 случайных искр.
  // Случайные искры особенно вредны на телефоне: они попадают в поле
  // зрения и в hit-test ещё до первого осмысленного жеста.
  if (!G.World || !G.World.prototype.birthShore || G.World.prototype.__v3035StartDensity) return;

  var original = G.World.prototype.birthShore;
  G.World.prototype.birthShore = function (player, dna) {
    var result = original.apply(this, arguments);

    // Оставляем пять направлений первого берега. Любые дополнительные
    // узлы, которые появятся позже через Director/Spawn, не трогаем.
    if (this.nodes && this.nodes.length > 5) {
      var first = [];
      for (var i = 0; i < this.nodes.length; i++) {
        var n = this.nodes[i];
        if (n && n.hint) first.push(n);
      }
      if (first.length >= 5) this.nodes = first.slice(0, 5);
    }
    return result;
  };

  G.World.prototype.__v3035StartDensity = true;
})(IGRA);
