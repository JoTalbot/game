var IGRA = IGRA || {};
(function (G) {
  "use strict";
  var HOLD_LIMIT = 126;
  var GRACE_LIMIT = 140;
  G.TouchHysteresis = {
    HOLD_LIMIT: HOLD_LIMIT,
    GRACE_LIMIT: GRACE_LIMIT,
    run: function (game, fn) {
      if (!game || !game.input || game.input.gsx == null || game.input.gsy == null) return fn();
      var dx = game.input.x - game.input.gsx;
      var dy = game.input.y - game.input.gsy;
      var slip = Math.sqrt(dx * dx + dy * dy);
      if (!Number.isFinite(slip) || slip <= HOLD_LIMIT || slip > GRACE_LIMIT) return fn();
      var sx = game.input.gsx, sy = game.input.gsy;
      var len = slip || 1;
      var keep = HOLD_LIMIT - 0.5;
      game.input.gsx = game.input.x - (dx / len) * keep;
      game.input.gsy = game.input.y - (dy / len) * keep;
      try { return fn(); } finally { game.input.gsx = sx; game.input.gsy = sy; }
    }
  };
  if (G.Game && G.Game.prototype && G.Game.prototype._gaze) {
    var originalGaze = G.Game.prototype._gaze;
    G.Game.prototype._gaze = function (dt) {
      return G.TouchHysteresis.run(this, originalGaze.bind(this, dt));
    };
  }
})(IGRA);
