var IGRA = IGRA || {};
(function (G) {
  "use strict";

  // V3-046 + V3-048: один guard, две ступени послабления.
  // V3-046 оставляет дешёвый базовый профиль, V3-048 делает его ещё легче
  // на узком экране. Меняем только presentation budget.
  var Q = G.Quality;
  if (!Q || Q.__v3048) return;

  if (!Q.__v3046) {
    Q.__v3046 = true;
    var baseInit = Q.init;
    Q.init = function () {
      baseInit.call(this);
      var w = (typeof window !== "undefined" && window.innerWidth) || 0;
      var h = (typeof window !== "undefined" && window.innerHeight) || 0;
      var narrow = Math.min(w || 9999, h || 9999) < 460;
      if (narrow) {
        this.dpr = 1;
        this.particles = Math.min(this.particles, 120);
        this.fog = Math.min(this.fog, 5);
        this.glow = false;
        this.demoted = true;
      }
    };
  }

  Q.__v3048 = true;
  var init = Q.init;
  Q.init = function () {
    init.call(this);
    var w = (typeof window !== "undefined" && window.innerWidth) || 0;
    var h = (typeof window !== "undefined" && window.innerHeight) || 0;
    var narrow = Math.min(w || 9999, h || 9999) < 460;
    if (narrow) {
      this.dpr = 1;
      this.particles = Math.min(this.particles, 72);
      this.fog = Math.min(this.fog, 3);
      this.glow = false;
      this.demoted = true;
      this.lowDevice = true;
    }
  };
})(IGRA);
