var IGRA = IGRA || {};
(function (G) {
  "use strict";

  var state = { phase: "idle", touches: 0, gazes: 0, born: false };
  var RU = {
    birth: "коснись. задержись. или просто стой.",
    touch: "теперь найди точку и задержи взгляд.",
    gaze: "не отпускай. взгляд сам сделает остальное.",
    formed: "ты не нашёл это. ты это вырастил."
  };
  var EN = {
    birth: "touch. hold. or simply stand.",
    touch: "now find a point and hold your gaze.",
    gaze: "do not let go. the gaze will do the rest.",
    formed: "you did not find this. you grew it."
  };

  function hint(game, kind, ms) {
    if (!game || game.state === "title") return;
    var en = !!(G.Lang && G.Lang.id === "en");
    var value = (en ? EN : RU)[kind];
    if (G.UI && G.UI.hint) G.UI.hint(value);
    if (ms > 0) setTimeout(function () {
      if (game.state === "birth" || game.state === "play") {
        if (G.UI && G.UI.hint) G.UI.hint("");
      }
    }, ms);
  }

  function begin(game) {
    state = { phase: "birth", touches: 0, gazes: 0, born: true };
    hint(game, "birth", 5200);
  }

  function touch(game) {
    if (!state.born || state.phase === "done") return;
    state.touches++;
    if (state.phase === "birth") {
      state.phase = "touch";
      hint(game, "touch", 3600);
    }
  }

  function gaze(game) {
    if (!state.born || state.phase === "done") return;
    state.gazes++;
    if (state.phase === "touch") {
      state.phase = "gaze";
      hint(game, "gaze", 4200);
    }
  }

  function formed(game) {
    if (!state.born || state.phase === "done") return;
    if (state.gazes > 0) {
      state.phase = "done";
      hint(game, "formed", 2600);
    }
  }

  G.FirstSession = {
    version: 1,
    state: function () { return { phase: state.phase, touches: state.touches, gazes: state.gazes, born: state.born }; },
    begin: begin,
    touch: touch,
    gaze: gaze,
    formed: formed
  };

  // Observe the existing gesture lifecycle. No save data, gameplay rules or
  // retention mechanics are introduced by the first-session layer.
  function install() {
    if (!G.Game || !G.Game.prototype) return false;
    var p = G.Game.prototype;
    if (p.__v11FirstSession) return true;
    var birth = p.startBirth, down = p.onDown, up = p.onUp;
    if (typeof birth !== "function" || typeof down !== "function" || typeof up !== "function") return false;

    p.startBirth = function () {
      var result = birth.apply(this, arguments);
      begin(this);
      return result;
    };
    p.onDown = function () {
      var before = this.dna ? this.dna.taps : 0;
      var result = down.apply(this, arguments);
      if (this.state === "birth" || this.state === "play") {
        if ((this.dna ? this.dna.taps : 0) > before) touch(this);
        if (this.player && this.player.gaze) gaze(this);
      }
      return result;
    };
    p.onUp = function () {
      var hadGaze = !!(this.player && this.player.gaze);
      var result = up.apply(this, arguments);
      if (hadGaze || (this.dna && this.dna.gazes > 0 && state.gazes === 0)) formed(this);
      return result;
    };
    p.__v11FirstSession = true;
    return true;
  }

  var tries = 0;
  function boot() {
    if (install() || ++tries > 40) return;
    setTimeout(boot, 25);
  }
  boot();
})(IGRA);
