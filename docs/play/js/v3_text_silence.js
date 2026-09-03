var IGRA = IGRA || {};
(function (G) {
  "use strict";

  // V3-031: keep poems as memory/interaction content, not as labels on
  // every bloom. Renderer selects the single nearest eligible verse; this
  // compatibility layer suppresses verse on all other blooms while keeping
  // the renderer arguments intact.
  function patch() {
    if (!G.Renderer || !G.Renderer.drawBloom || G.Renderer.__v3031Patched) return;
    var original = G.Renderer.drawBloom;
    G.Renderer.drawBloom = function (ctx, cam, bloom, t, game, verseBloom, verseDist) {
      if (bloom && bloom.verse && verseBloom !== bloom) {
        var verse = bloom.verse;
        bloom.verse = null;
        try {
          return original.call(this, ctx, cam, bloom, t, game, verseBloom, verseDist);
        } finally {
          bloom.verse = verse;
        }
      }
      return original.call(this, ctx, cam, bloom, t, game, verseBloom, verseDist);
    };
    G.Renderer.__v3031Patched = true;
  }

  patch();
})(IGRA);
