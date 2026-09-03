var IGRA = IGRA || {};
(function (G) {
  "use strict";

  // V3-031: keep poems as memory/interaction content, not as labels on
  // every bloom. The bloom object keeps its verse, so tapping it can still
  // reveal/speak the poem elsewhere in the game.
  function patch() {
    if (!G.Renderer || !G.Renderer.drawBloom || G.Renderer.__v3031Patched) return;
    var original = G.Renderer.drawBloom;
    G.Renderer.drawBloom = function (ctx, cam, bloom, t) {
      if (bloom && bloom.verse) {
        var verse = bloom.verse;
        bloom.verse = null;
        try {
          return original.call(this, ctx, cam, bloom, t);
        } finally {
          bloom.verse = verse;
        }
      }
      return original.call(this, ctx, cam, bloom, t);
    };
    G.Renderer.__v3031Patched = true;
  }

  patch();
})(IGRA);
