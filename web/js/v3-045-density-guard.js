var IGRA = IGRA || {};
(function (G) {
  "use strict";

  // V3-045: the start guard fixed the first 25 seconds, but later direct
  // creation paths could still accumulate a screen full of nodes. The
  // renderer then paid O(n^2) for links and every node paid for glow/text.
  // Keep the world alive, but keep the mobile viewport readable.
  if (!G.World || !G.World.prototype.update || G.World.prototype.__v3045DensityGuard) return;

  var MAX_NODES = 24;
  var MAX_BEINGS = 8;
  var MAX_BLOOMS = 24;
  var MAX_WOUNDS = 12;
  var originalUpdate = G.World.prototype.update;

  function aliveNode(n) {
    return n && !n.dead && n.state !== "gone";
  }

  function pruneNodes(world, player) {
    if (!world.nodes || world.nodes.length <= MAX_NODES) return;

    var nodes = world.nodes;
    var keep = [];
    var candidates = [];
    var px = player ? player.x : 0;
    var py = player ? player.y : 0;

    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (!aliveNode(n)) continue;
      // Authored hints and rooted/already-lived nodes are part of the story.
      if (n.hint || n.roots >= 0.8 || n.memoryAnchor || n.legacy) keep.push(n);
      else candidates.push(n);
    }

    if (keep.length >= MAX_NODES) {
      // If a legacy-rich save is genuinely over budget, retain the nearest
      // meaningful nodes rather than letting an old scene grow forever.
      keep.sort(function (a, b) {
        return G.dist2(a.x, a.y, px, py) - G.dist2(b.x, b.y, px, py);
      });
      world.nodes = keep.slice(0, MAX_NODES);
      return;
    }

    candidates.sort(function (a, b) {
      // Prefer nearby nodes and formed nodes. The far, unformed decoration
      // is the cheapest thing to remove and least likely to be the player's
      // current intention.
      var av = G.dist2(a.x, a.y, px, py) + (a.state === "alive" ? 0 : 180000);
      var bv = G.dist2(b.x, b.y, px, py) + (b.state === "alive" ? 0 : 180000);
      return av - bv;
    });

    var room = MAX_NODES - keep.length;
    world.nodes = keep.concat(candidates.slice(0, room));
  }

  function capList(world, key, max) {
    if (!world[key] || world[key].length <= max) return;
    world[key] = world[key].slice(world[key].length - max);
  }

  G.World.prototype.update = function (dt, player, dna, fx, game) {
    var result = originalUpdate.apply(this, arguments);

    // Never interfere with the authored opening grace. V3-044 owns the
    // exact three-node opening; this guard is the steady-state budget.
    if (!(this.__v3044StartGrace > 0)) {
      pruneNodes(this, player);
      capList(this, "beings", MAX_BEINGS);
      capList(this, "blooms", MAX_BLOOMS);
      capList(this, "wounds", MAX_WOUNDS);
    }

    return result;
  };

  G.World.prototype.__v3045DensityGuard = true;
  G.World.prototype.__v3045MaxNodes = MAX_NODES;
  G.World.prototype.__v3045MaxBeings = MAX_BEINGS;
})(IGRA);
