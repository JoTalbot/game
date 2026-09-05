var IGRA = IGRA || {};
(function (G) {
  "use strict";

  // V3-046: слабый телефон должен получить дешёвый кадр ДО первого
  // восьмисекундного окна Quality.watch. Реальный RC1 427×948 показал
  // 1504 тяжёлых кадра за 7 минут. Железный паспорт Android часто говорит
  // «сильный», а холст честно говорит обратное. Для узкого/высокого
  // телефона заранее выключаем дорогую косметику, не трогая механику.
  // Это именно presentation guard: мир, сейв, ввод и правила не меняются.
  var Q = G.Quality;
  if (!Q || Q.__v3046) return;
  Q.__v3046 = true;
  var init = Q.init;

  Q.init = function () {
    init.call(this);
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
})(IGRA);
