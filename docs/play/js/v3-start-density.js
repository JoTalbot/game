var IGRA = IGRA || {};
(function (G) {
  "use strict";

  // V3-044: start density must be enforced at the actual creation boundary.
  // V3-036 only muted Director.scatter() for one call stack; other organs
  // could still call scatter/spawnNode during the opening seconds. That made
  // the first screen bloom into a field of targets before the player had
  // taken a meaningful action. Humans apparently need more than three
  // glowing circles before they can be trusted with the void.
  if (!G.World || !G.World.prototype.birthShore || G.World.prototype.__v3044StartDensity) return;

  var originalBirth = G.World.prototype.birthShore;
  var originalSpawn = G.World.prototype.spawnNode;
  var originalUpdate = G.World.prototype.update;

  G.World.prototype.birthShore = function (player, dna) {
    // This flag is set BEFORE birthShore because the original shore itself
    // uses scatter(). Only the authored opening shore is allowed to seed.
    this.__v3044BuildingShore = true;
    this.__v3044StartGrace = 25;
    this.__v3044StartIds = [];

    var result;
    try {
      result = originalBirth.apply(this, arguments);
    } finally {
      this.__v3044BuildingShore = false;
    }

    // Keep exactly the three authored/hinted opening nodes. Any nodes from
    // the original seven-node decorative scatter are deliberately discarded.
    if (this.nodes && this.nodes.length > 3) {
      var first = [];
      for (var i = 0; i < this.nodes.length; i++) {
        var n = this.nodes[i];
        if (n && n.hint) first.push(n);
      }
      if (first.length >= 3) this.nodes = first.slice(0, 3);
      else this.nodes = this.nodes.slice(0, 3);
    }

    for (var j = 0; j < this.nodes.length; j++) {
      if (this.nodes[j] && this.nodes[j].id) this.__v3044StartIds.push(this.nodes[j].id);
    }

    return result;
  };

  // Hard creation gate. During the opening grace window, only the nodes made
  // by birthShore itself may enter world.nodes. We still return a real Node
  // to callers so authored code does not crash, but it is intentionally not
  // inserted into the world. This catches direct spawnNode() paths that do
  // not pass through Director.scatter().
  G.World.prototype.spawnNode = function (x, y, kind) {
    if (this.__v3044StartGrace > 0 && !this.__v3044BuildingShore) {
      var transient = new G.Node(x, y, kind || "spark");
      transient.phase = this.rng.range(0, G.TAU);
      transient.__v3044Suppressed = true;
      return transient;
    }
    return originalSpawn.apply(this, arguments);
  };

  // The grace timer is independent from world.age, because a new life can
  // reuse the same World instance and world.age is intentionally continuous.
  G.World.prototype.update = function (dt, player, dna, fx, game) {
    if (this.__v3044StartGrace > 0) {
      this.__v3044StartGrace = Math.max(0, this.__v3044StartGrace - (dt || 0));
    }

    var result = originalUpdate.apply(this, arguments);

    // Last line of defence for any code that pushes directly into nodes[].
    // During grace, only the three authored start ids survive. Once grace
    // ends the normal world is completely untouched.
    if (this.__v3044StartGrace > 0 && this.__v3044StartIds && this.__v3044StartIds.length) {
      var ids = this.__v3044StartIds;
      this.nodes = this.nodes.filter(function (node) {
        return node && ids.indexOf(node.id) >= 0;
      });
    }

    return result;
  };

  // Keep the old Director guard as a behavioural safety net. The hard gate
  // above is the authoritative protection; this one prevents automatic
  // scatter work from even constructing transient nodes during grace.
  if (G.Director && G.Director.observe && !G.Director.__v3036BirthGrace) {
    var originalObserve = G.Director.observe;
    G.Director.observe = function (dt, game) {
      var age = game && game.dna ? game.dna.age : 999;
      if (age < 25 && game && game.world) {
        var world = game.world;
        var oldScatter = world.scatter;
        world.scatter = function () {};
        try {
          return originalObserve.apply(this, arguments);
        } finally {
          world.scatter = oldScatter;
        }
      }
      return originalObserve.apply(this, arguments);
    };
    G.Director.__v3036BirthGrace = true;
  }

  G.World.prototype.__v3044StartDensity = true;
  // Preserve the legacy marker used by existing probes and diagnostics.
  G.World.prototype.__v3036StartDensity = true;
})(IGRA);
