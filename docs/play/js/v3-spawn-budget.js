var IGRA = IGRA || {};
(function (G) {
  "use strict";

  // V3-037: node creation must be gradual, not bursty. A small screen can
  // tolerate a living world, but not seven new targets appearing at once.
  // Keep the original mechanic and only reduce automatic scatter batches as
  // the active node population grows. Direct/special spawnNode() remains
  // untouched so story mechanics and authored events keep their semantics.
  if (!G.World || !G.World.prototype.scatter || G.World.prototype.__v3037SpawnBudget) return;

  var originalScatter = G.World.prototype.scatter;
  G.World.prototype.scatter = function (cx, cy, count, radius) {
    var live = 0;
    if (this.nodes) {
      for (var i = 0; i < this.nodes.length; i++) {
        var n = this.nodes[i];
        if (n && !n.dead && n.state !== "gone") live++;
      }
    }

    var allowed = count;
    if (live >= 18) allowed = 0;
    else if (live >= 14) allowed = Math.min(allowed, 1);
    else if (live >= 10) allowed = Math.min(allowed, 2);

    if (allowed <= 0) return;
    return originalScatter.call(this, cx, cy, allowed, radius);
  };

  G.World.prototype.__v3037SpawnBudget = true;
  G.World.prototype.__v3037OriginalScatter = originalScatter;
})(IGRA);
