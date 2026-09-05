var IGRA = IGRA || {};
(function (G) {
  "use strict";

  // V3-048: низкий профиль для реально слабого телефона.
  // Только presentation budget: не трогаем мир, механику, сейв или ввод.
  var Q = G.Quality;
  if (!Q || !Q.__v3046 || Q.__v3048) return;
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
