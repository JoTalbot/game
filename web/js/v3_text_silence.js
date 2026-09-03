var IGRA = IGRA || {};
(function (G) {
  "use strict";

  // V3-030: poems stay in memory, not as a permanent label under every bloom.
  // Keep bloom interaction intact: the original object still carries `verse`,
  // but the renderer receives a temporary text-less copy.
  function patch() {
    if (!G.Renderer || !G.Renderer.drawBloom || G.Renderer.__v3030TextSilenced) return;
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
    G.Renderer.__v3030TextSilenced = true;
  }

  patch();
  if (!G.Renderer || !G.Renderer.drawBloom) {
    setTimeout(patch, 0);
  }
})(IGRA);
