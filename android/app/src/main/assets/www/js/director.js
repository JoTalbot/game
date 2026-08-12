var IGRA = IGRA || {};
(function (G) {
  "use strict";

  G.Director = {
    acc: {},
    lastEvent: 0,
    lastTraitLine: 0,
    lastMeta: 0,
    organs: {
      map: 0,
      combat: 0,
      garden: 0,
      social: 0,
      glitch: 0,
      music: 0
    },
    events: [],
    named: false,

    reset: function () {
      this.acc = {};
      this.lastEvent = 0;
      this.lastTraitLine = 0;
      this.lastMeta = 0;
      this.organs = { map: 0, combat: 0, garden: 0, social: 0, glitch: 0, music: 0 };
      this.events = [];
      this.named = false;
    },

    note: function (kind, amt) {
      this.acc[kind] = (this.acc[kind] || 0) + (amt || 1);
    },

    growOrgans: function (dna) {
      this.organs.map = G.smooth(G.clamp(dna.get("curiosity") * 1.4, 0, 1));
      this.organs.combat = G.smooth(G.clamp(dna.get("aggression") * 1.35, 0, 1));
      this.organs.garden = G.smooth(G.clamp(dna.get("contemplation") * 1.4, 0, 1));
      this.organs.social = G.smooth(G.clamp(dna.get("empathy") * 1.4, 0, 1));
      this.organs.glitch = G.smooth(G.clamp(dna.get("chaos") * 1.5, 0, 1));
      this.organs.music = G.smooth(G.clamp(dna.get("harmony") * 1.4, 0, 1));
    },

    observe: function (dt, game) {
      var dna = game.dna;
      var p = game.player;
      var spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (spd < 8) {
        p.stillT += dt;
        p.moveT = Math.max(0, p.moveT - dt);
        dna.feed("contemplation", 0.012, dt);
      } else {
        p.moveT += dt;
        p.stillT = 0;
        dna.feed("curiosity", 0.01 * G.clamp(spd / 140, 0, 1), dt);
      }

      // rhythm detection via recent tap intervals
      if (game.input.rhythm > 0.55) dna.feed("harmony", 0.03, dt);
      if (game.input.wild > 0.5) dna.feed("chaos", 0.025, dt);

      this.growOrgans(dna);
      dna.age += dt;

      var t = game.time;
      if (!this.named && dna.age > 55) {
        this.named = true;
        G.Voice.say("named");
        setTimeout(function () {
          G.Voice.sayText(dna.name() + ".", true);
        }, 2600);
      }

      if (t - this.lastTraitLine > 42) {
        var d = dna.dominant();
        if (dna.get(d) > 0.22) {
          G.Voice.say(d);
          this.lastTraitLine = t;
        }
      }

      if (p.stillT > 7 && G.chance(dt * 0.15)) G.Voice.say("sit");
      if (p.moveT > 9 && G.chance(dt * 0.08)) G.Voice.say("wander");

      if (dna.age > 180 && G.chance(dt * 0.01)) G.Voice.say("longPlay");

      // metamorphosis when DNA has shifted enough or time passed
      var since = t - this.lastMeta;
      var ripe = since > 165 && dna.sum() > 1.8;
      var surge = since > 90 && this._shift(game) > 0.55;
      if ((ripe || surge) && game.state === "play") {
        this.lastMeta = t;
        game.beginMeta();
      }

      // spawn wounds if combat organ is growing and world is too peaceful
      if (
        this.organs.combat > 0.35 &&
        game.world.wounds.length < 1 + this.organs.combat * 3 &&
        G.chance(dt * 0.06 * this.organs.combat)
      ) {
        var a = Math.random() * G.TAU;
        var d2 = 260 + Math.random() * 200;
        game.world.wounds.push(new G.Wound(p.x + Math.cos(a) * d2, p.y + Math.sin(a) * d2, "thorn"));
        if (game.world.wounds.length === 1) G.Voice.say("combat");
      }

      // empathy grows beings from leftover sparks
      if (this.organs.social > 0.4 && game.world.beings.length < 1 + this.organs.social * 4) {
        if (G.chance(dt * 0.05)) {
          var node = G.pick(game.world.nodes);
          if (node && node.state === "unformed" && G.chance(0.4)) {
            node.hint = "echo";
          }
        }
      }

      G.Organs.maybeGarden(game, dt);
      G.Organs.maybeBoss(game);
      G.Organs.updateBoss(game, dt);
      G.Organs.maybeCracks(game, dt);

      if (this.organs.map > 0.28 || game.world.stars.length >= 2) {
        var skyBtn = document.getElementById("sky-btn");
        if (skyBtn) skyBtn.classList.add("show");
      }
    },

    _shift: function (game) {
      if (!game.prevDnaSnap) return 0;
      var s = 0;
      for (var i = 0; i < G.TRAITS.length; i++) {
        var k = G.TRAITS[i];
        s += Math.abs(game.dna.get(k) - (game.prevDnaSnap[k] || 0));
      }
      return s;
    },

    snapshot: function (dna) {
      var o = {};
      for (var i = 0; i < G.TRAITS.length; i++) o[G.TRAITS[i]] = dna.get(G.TRAITS[i]);
      return o;
    },

    pulseEffect: function (game) {
      var d = game.dna.dominant();
      var p = game.player;
      var fx = game.fx;
      var world = game.world;
      var c = G.TRAIT_COLOR[d];
      G.Audio.pulse(d);
      fx.ring(p.x, p.y, 22, c, 18, 0.7);
      fx.burst(p.x, p.y, 16, c, 90, 0.5);
      G.Shake.add(5);
      if (navigator.vibrate) navigator.vibrate(18);

      if (d === "aggression" || this.organs.combat > 0.45) {
        world.hitWound(p.x, p.y, 90 + this.organs.combat * 50, 1.4 + game.dna.get("aggression"), fx);
        G.Organs.hitBoss(game, 1.6 + game.dna.get("aggression"), "aggression");
      }
      if (d === "empathy" || this.organs.social > 0.4) {
        world.charmNear(p.x, p.y, 110);
        G.Organs.hitBoss(game, 1.1, "empathy");
        G.Voice.say("kind");
      }
      if (d === "curiosity") {
        p.vx *= 2.2;
        p.vy *= 2.2;
        for (var i = 0; i < world.nodes.length; i++) {
          var n = world.nodes[i];
          if (G.dist(p.x, p.y, n.x, n.y) < 260) n.care = Math.max(n.care, 0.5);
        }
        G.Organs.hitBoss(game, 0.4, "curiosity");
      }
      if (d === "contemplation") {
        game.slowMo = 2.4;
        for (var j = 0; j < world.nodes.length; j++) {
          if (G.dist(p.x, p.y, world.nodes[j].x, world.nodes[j].y) < 140) {
            world.nodes[j].care = 1;
          }
        }
        G.Organs.hitBoss(game, 0.3, "contemplation");
      }
      if (d === "chaos" || this.organs.glitch > 0.4) {
        var ang = Math.random() * G.TAU;
        var dist = 80 + Math.random() * 160;
        p.x += Math.cos(ang) * dist;
        p.y += Math.sin(ang) * dist;
        game.glitch = 0.8;
        G.Organs.hitBoss(game, 1.0, "chaos");
        if (this.organs.glitch > 0.45) {
          G.Organs.spawnCrack(world, p.x + G.rand(-80, 80), p.y + G.rand(-80, 80));
        }
        G.Voice.say("glitch");
      }
      if (d === "harmony" || this.organs.music > 0.35) {
        var n = world.resonate(p.x, p.y, fx);
        if (n > 1) G.Voice.say("music");
        G.Organs.hitBoss(game, 0.8, "harmony");
        var nearTone = world.nearestNode(p.x, p.y, 90);
        if (nearTone && nearTone.kind === "tone") G.Organs.playTone(game, nearTone);
      }
    },

    onCrystal: function (game, kind) {
      var map = {
        relic: "curiosity",
        thorn: "aggression",
        still: "sit",
        echo: "kind",
        shard: "glitch",
        tone: "music",
        spark: "firstNode"
      };
      G.Voice.say(map[kind] || "firstNode");
      if (kind === "still" && game.world.verses.length) {
        var v = game.world.verses[game.world.verses.length - 1];
        setTimeout(function () {
          G.Voice.sayText(v, true);
        }, 2200);
      }
    }
  };
})(IGRA);
