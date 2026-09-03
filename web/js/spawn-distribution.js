var IGRA = IGRA || {};
(function (G) {
  "use strict";

  // Natural births may be requested at a meaningful point (player, call,
  // historical trace), but a procedural world should not stack every new
  // node on top of the previous one. Keep intentional non-spark spawns
  // untouched and redistribute only procedural spark births when they would
  // visibly collide with existing nodes.
  var MIN_GAP = 96;
  var HARD_GAP = 58;
  var MAX_TRIES = 18;

  function dist2(a, b, x, y) {
    var dx = a.x - x;
    var dy = a.y - y;
    return dx * dx + dy * dy;
  }

  function clear(world, x, y, gap) {
    var g2 = gap * gap;
    for (var i = 0; i < world.nodes.length; i++) {
      var n = world.nodes[i];
      if (!n || n.dead || n.state === "gone") continue;
      var need = gap + Math.max(0, (n.r || 16) - 16) * 0.35;
      if (dist2(n, null, x, y) < need * need) return false;
    }
    return true;
  }

  function redistribute(world, x, y) {
    if (clear(world, x, y, MIN_GAP)) return { x: x, y: y, moved: false };

    // Try a deterministic radial fan first. This keeps the visual event near
    // its source while guaranteeing that repeated births do not form a stack.
    var base = world.rng.range(0, G.TAU);
    for (var ring = 0; ring < 3; ring++) {
      var radius = MIN_GAP * (1.15 + ring * 0.72);
      for (var i = 0; i < 6; i++) {
        var a = base + (i / 6) * G.TAU + ring * 0.31;
        var px = x + Math.cos(a) * radius;
        var py = y + Math.sin(a) * radius;
        if (clear(world, px, py, MIN_GAP)) return { x: px, y: py, moved: true };
      }
    }

    // Busy local neighborhoods get a wider search. Keep it bounded so a
    // single unlucky birth cannot jump across the whole world.
    for (var t = 0; t < MAX_TRIES; t++) {
      var aa = world.rng.range(0, G.TAU);
      var rr = MIN_GAP * (2.2 + world.rng.next() * 2.8);
      var qx = x + Math.cos(aa) * rr;
      var qy = y + Math.sin(aa) * rr;
      if (clear(world, qx, qy, MIN_GAP)) return { x: qx, y: qy, moved: true };
    }

    // At a genuinely saturated location, preserve the event rather than
    // dropping it. HARD_GAP is still enforced, so the renderer never gets a
    // pile of overlapping rings.
    for (var h = 0; h < MAX_TRIES; h++) {
      var ha = base + h * G.TAU / MAX_TRIES;
      var hr = HARD_GAP * (1.2 + h * 0.55);
      var hx = x + Math.cos(ha) * hr;
      var hy = y + Math.sin(ha) * hr;
      if (clear(world, hx, hy, HARD_GAP)) return { x: hx, y: hy, moved: true };
    }
    return { x: x, y: y, moved: false };
  }

  if (G.World && G.World.prototype && !G.World.prototype.__spawnDistributionV1) {
    var baseSpawn = G.World.prototype.spawnNode;
    G.World.prototype.spawnNode = function (x, y, kind) {
      // "spark" is the procedural carrier used by scatter, natural births,
      // call-arrivals and act/trajectory expansion. Explicit special kinds
      // retain their exact coordinates because those are semantic anchors.
      if (kind === "spark" && this.nodes.length > 0) {
        var p = redistribute(this, x, y);
        if (p.moved) {
          this.__spawnRedistributed = (this.__spawnRedistributed || 0) + 1;
          x = p.x;
          y = p.y;
        }
      }
      return baseSpawn.call(this, x, y, kind);
    };
    G.World.prototype.__spawnDistributionV1 = true;
  }

  G.SpawnDistribution = {
    minGap: MIN_GAP,
    hardGap: HARD_GAP,
    redistribute: redistribute
  };
})(IGRA);
