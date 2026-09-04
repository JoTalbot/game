var IGRA = IGRA || {};
(function (G) {
  "use strict";
  var HOLD_LIMIT = 126;
  var GRACE_LIMIT = 140;
  var NODE_TAP_MULTIPLIER = 1.35;
  var NODE_TAP_MIN = 76;
  var MOVE_START = 32;
  G.TouchHysteresis = {
    HOLD_LIMIT: HOLD_LIMIT,
    GRACE_LIMIT: GRACE_LIMIT,
    MOVE_START: MOVE_START,
    run: function (game, fn) {
      if (!game || !game.input || game.input.gsx == null || game.input.gsy == null) return fn();
      var dx = game.input.x - game.input.gsx;
      var dy = game.input.y - game.input.gsy;
      var slip = Math.sqrt(dx * dx + dy * dy);
      if (!Number.isFinite(slip) || slip <= HOLD_LIMIT || slip > GRACE_LIMIT) return fn();
      var sx = game.input.gsx, sy = game.input.gsy;
      var len = slip || 1;
      var keep = HOLD_LIMIT - 0.5;
      game.input.gsx = game.input.x - (dx / len) * keep;
      game.input.gsy = game.input.y - (dy / len) * keep;
      try { return fn(); } finally { game.input.gsx = sx; game.input.gsy = sy; }
    }
  };
  if (G.Game && G.Game.prototype && G.Game.prototype._gaze) {
    var originalGaze = G.Game.prototype._gaze;
    G.Game.prototype._gaze = function (dt) {
      return G.TouchHysteresis.run(this, originalGaze.bind(this, dt));
    };
  }

  // V3-032: crowded shores must stay walkable. Beings are deliberate holds;
  // visible nodes are primary tap targets and must win before movement logic.
  // V3-041: widen the node target without changing the visual node itself.
  // V3-043: resolve node gaze synchronously in onDown, before _move can turn
  // the same touch into travel. This is the critical tap-vs-flight boundary.
  if (G.Game && G.Game.prototype && !G.Game.prototype.__v3032Patched &&
      G.Game.prototype.onDown && G.Game.prototype._gaze &&
      G.Organs && G.Organs.nearestBeing && G.World && G.World.prototype.nearestNode) {
    var proto = G.Game.prototype;
    var denseDown = proto.onDown;
    var denseGaze = proto._gaze;
    var denseBeing = G.Organs.nearestBeing;

    proto.onDown = function () {
      var oldBeing = G.Organs.nearestBeing;
      var oldNode = G.World.prototype.nearestNode;
      G.Organs.nearestBeing = function () { return null; };
      G.World.prototype.nearestNode = function (x, y, max) {
        var widened = Math.max(NODE_TAP_MIN, (max || 0) * NODE_TAP_MULTIPLIER);
        return oldNode.call(this, x, y, widened);
      };
      try {
        if ((this.state === "play" || this.state === "birth") &&
            this.input && this.input.wx != null && this.input.wy != null) {
          var tapNode = this.world.nearestNode(this.input.wx, this.input.wy,
            this.aimRadius ? this.aimRadius(58) : 58);
          if (tapNode && tapNode.state === "alive" &&
              G.dist(this.player.x, this.player.y, tapNode.x, tapNode.y) < 220) {
            this.player.gaze = tapNode;
            this.gazeTarget = null;
            this.player.gazeT = 0;
            this.input.gsx = this.input.x;
            this.input.gsy = this.input.y;
            this.input.hold = 0;
            if (G.Report) G.Report.act("gazes");
            if (this.dna) this.dna.feed("contemplation", 0.01);
            if (this.dna && this.dna.gazes === 0 && G.Voice) G.Voice.say("firstGaze");
            return;
          }
        }
        return denseDown.apply(this, arguments);
      } finally {
        G.Organs.nearestBeing = oldBeing;
        G.World.prototype.nearestNode = oldNode;
      }
    };

    proto._gaze = function (dt) {
      var p = this.player;
      var speed = p ? Math.sqrt((p.vx || 0) * (p.vx || 0) + (p.vy || 0) * (p.vy || 0)) : 0;
      var moving = speed > 10;
      var fingerDx = this.input && this.input.gsx != null ? this.input.x - this.input.gsx : 0;
      var fingerDy = this.input && this.input.gsy != null ? this.input.y - this.input.gsy : 0;
      var fingerSlip = Math.sqrt(fingerDx * fingerDx + fingerDy * fingerDy);
      var walkingGesture = !!(this.input && this.input.down && fingerSlip > MOVE_START);

      var oldNode = G.World.prototype.nearestNode;
      if (walkingGesture) {
        this.player.gaze = null;
        this.gazeTarget = null;
        this.player.gazeT = 0;
        this.input.hold = 0;
        G.World.prototype.nearestNode = function () { return null; };
      } else if (moving) {
        G.World.prototype.nearestNode = function () { return null; };
      }
      try {
        denseGaze.call(this, dt);
      } finally {
        G.World.prototype.nearestNode = oldNode;
      }

      // Beings remain deliberate interactions: hold still for 0.38 s, use a
      // smaller finger radius, and only interact with one close to the player.
      if (!this.player.gaze && !this.gazeTarget && !this.sky && !walkingGesture && !moving &&
          (this.state === "play" || this.state === "birth") &&
          (this.input.hold || 0) > 0.38) {
        var max = this.aimRadius ? this.aimRadius(30) : 30;
        var b = denseBeing.call(G.Organs, this.world, this.input.wx, this.input.wy, max);
        if (b && !b.dead && G.dist(this.player.x, this.player.y, b.x, b.y) < 170) {
          this.gazeTarget = b;
          this.player.gaze = null;
          this.player.gazeT = 0;
          this.input.hold = 0;
          this.input.gsx = this.input.x;
          this.input.gsy = this.input.y;
          if (this.dna) this.dna.feed("empathy", 0.012);
          return;
        }

        var nodeRadius = this.aimRadius ? this.aimRadius(58) : 58;
        var node = this.world.nearestNode(this.input.wx, this.input.wy, nodeRadius);
        if (node && node.state === "alive" &&
            G.dist(this.player.x, this.player.y, node.x, node.y) < 220) {
          this.gazeTarget = null;
          if (G.Report) G.Report.act("gazes");
          this.player.gaze = node;
          this.player.gazeT = 0;
          this.input.hold = 0;
          this.input.gsx = this.input.x;
          this.input.gsy = this.input.y;
          if (this.dna) this.dna.feed("contemplation", 0.01);
          if (this.dna && this.dna.gazes === 0 && G.Voice) G.Voice.say("firstGaze");
        }
      }
    };

    if (proto._move && !proto.__v3037MovePriority) {
      var originalMove = proto._move;
      proto._move = function (dt) {
        var inp = this.input;
        if (inp && inp.down && inp.gsx != null && inp.gsy != null) {
          var mdx = inp.x - inp.gsx;
          var mdy = inp.y - inp.gsy;
          if (Math.sqrt(mdx * mdx + mdy * mdy) > MOVE_START) {
            this.player.gaze = null;
            this.gazeTarget = null;
            this.player.gazeT = 0;
            inp.hold = 0;
          }
        }
        return originalMove.apply(this, arguments);
      };
      proto.__v3037MovePriority = true;
      proto.__v3037OriginalMove = originalMove;
    }

    proto.__v3032Patched = true;
    proto.__v3032OriginalDown = denseDown;
    proto.__v3032OriginalGaze = denseGaze;
  }
})(IGRA);
