var IGRA = IGRA || {};
(function (G) {
  "use strict";
  // V3-034: cap runaway echo population without deleting the mechanic.
  // The shore may grow beings, but a small mobile screen cannot remain
  // readable if every echo survives forever. Reuse the oldest unbonded,
  // non-voice being once the soft cap is reached.
  if (!G.World || !G.World.prototype.crystallize || G.World.prototype.__v3034BeingCap) return;
  var original = G.World.prototype.crystallize;
  G.World.prototype.crystallize = function (node, gest, dna) {
    var result = original.apply(this, arguments);
    if (this.beings && this.beings.length > 12) {
      var victim = null, oldest = -1;
      for (var i = 0; i < this.beings.length; i++) {
        var b = this.beings[i];
        if (!b || b.dead || b.isVoice || b.bond > 0.25) continue;
        var age = b.age == null ? 0 : b.age;
        if (age > oldest) {
          oldest = age;
          victim = b;
        }
      }
      if (!victim) {
        for (var j = 0; j < this.beings.length; j++) {
          var fallback = this.beings[j];
          if (fallback && !fallback.dead && !fallback.isVoice && fallback.bond <= 0.4) {
            victim = fallback;
            break;
          }
        }
      }
      if (victim) victim.dead = true;
      this.beings = this.beings.filter(function (b2) { return b2 && !b2.dead; });
    }
    return result;
  };
  G.World.prototype.__v3034BeingCap = true;
})(IGRA);
