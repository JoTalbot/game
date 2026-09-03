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

  // V3-032: dense shores must remain walkable.
  // A touch used to claim a node/being immediately. On a crowded shore that
  // made the walk gesture look like an interaction and produced a target ring
  // almost everywhere. Human fingers remain inconveniently large.
  function patchDenseInteraction() {
    if (!G.Game || !G.Game.prototype || G.Game.prototype.__v3032Patched ||
        !G.Game.prototype.onDown || !G.Game.prototype._gaze ||
        !G.Organs || !G.Organs.nearestBeing || !G.World || !G.World.prototype.nearestNode) return;

    var gameProto = G.Game.prototype;
    var originalDown = gameProto.onDown;
    var originalGaze = gameProto._gaze;
    var originalNearestBeing = G.Organs.nearestBeing;
    var originalNearestNode = G.World.prototype.nearestNode;

    // Defer node/being acquisition until the player has deliberately stopped.
    // Cracks, blooms, pulses and other explicit tap actions keep their normal
    // behavior because only the two competing target lookups are suppressed.
    gameProto.onDown = function () {
      var oldBeing = G.Organs.nearestBeing;
      var oldNode = G.World.prototype.nearestNode;
      G.Organs.nearestBeing = function () { return null; };
      G.World.prototype.nearestNode = function () { return null; };
      try {
        return originalDown.apply(this, arguments);
      } finally {
        G.Organs.nearestBeing = oldBeing;
        G.World.prototype.nearestNode = oldNode;
      }
    };

    gameProto._gaze = function (dt) {
      if (!this.input || !this.input.down) return originalGaze.call(this, dt);

      var p = this.player;
      var speed = p ? Math.sqrt((p.vx || 0) * (p.vx || 0) + (p.vy || 0) * (p.vy || 0)) : 0;
      var moving = speed > 10;
      var oldNode = G.World.prototype.nearestNode;

      // While actually travelling, the finger is navigation. Never let the
      // stationary auto-capture logic steal it from movement.
      if (moving) G.World.prototype.nearestNode = function () { return null; };
      try {
        originalGaze.call(this, dt);
      } finally {
        G.World.prototype.nearestNode = oldNode;
      }

      // Beings require a deliberate stationary hold and a tighter radius.
      // This keeps them interactable without turning every pass into a gaze.
      if (!this.player.gaze && !this.gazeTarget && !this.sky && !moving &&
          (this.state === "play" || this.state === "birth") &&
          (this.input.hold || 0) > 0.38) {
        var max = this.aimRadius ? this.aimRadius(30) : 30;
        var b = originalNearestBeing.call(G.Organs, this.world, this.input.wx, this.input.wy, max);
        if (b && !b.dead && G.dist(this.player.x, this.player.y, b.x, b.y) < 170) {
          this.gazeTarget = b;
          this.player.gaze = null;
          this.player.gazeT = 0;
          this.input.hold = 0;
          this.input.gsx = this.input.x;
          this.input.gsy = this.input.y;
          if (this.dna) this.dna.feed("empathy", 0.012);
        }
      }
    };

    gameProto.__v3032Patched = true;
    gameProto.__v3032OriginalDown = originalDown;
    gameProto.__v3032OriginalGaze = originalGaze;
    gameProto.__v3032OriginalNearestBeing = originalNearestBeing;
    gameProto.__v3032OriginalNearestNode = originalNearestNode;
  }

  patch();
  patchDenseInteraction();
})(IGRA);
