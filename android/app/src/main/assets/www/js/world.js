var IGRA = IGRA || {};
(function (G) {
  "use strict";

  var KINDS = ["spark", "relic", "thorn", "still", "echo", "shard", "tone"];

  G.KIND_RU = {
    spark: "искра",
    relic: "реликвия",
    thorn: "шип",
    still: "тишина",
    echo: "эхо",
    shard: "осколок",
    tone: "тон",
    wound: "рана",
    memory: "память"
  };

  G.KIND_TRAIT = {
    spark: null,
    relic: "curiosity",
    thorn: "aggression",
    still: "contemplation",
    echo: "empathy",
    shard: "chaos",
    tone: "harmony",
    wound: "aggression",
    memory: "contemplation"
  };

  function kindFromGesture(gest, dna) {
    var scores = {
      relic: gest.explore + dna.get("curiosity") * 0.8,
      thorn: gest.hit + dna.get("aggression") * 0.8,
      still: gest.still + dna.get("contemplation") * 0.8,
      echo: gest.soft + dna.get("empathy") * 0.8,
      shard: gest.wild + dna.get("chaos") * 0.8,
      tone: gest.rhythm + dna.get("harmony") * 0.8
    };
    var best = "spark";
    var bestV = 0.28;
    for (var k in scores) {
      if (scores[k] > bestV) {
        bestV = scores[k];
        best = k;
      }
    }
    return best;
  }

  G.Node = function (x, y, kind) {
    this.id = Math.random().toString(36).slice(2, 9);
    this.x = x;
    this.y = y;
    this.kind = kind || "spark";
    this.state = "unformed";
    this.growth = 0;
    this.care = 0.4;
    this.age = 0;
    this.r = 16;
    this.phase = Math.random() * G.TAU;
    this.hp = 1;
    this.verse = "";
    this.name = "";
    this.tone = 220 + Math.random() * 440;
    this.dead = false;
    this.memory = false;
    this.gesture = { explore: 0, hit: 0, still: 0, soft: 0, wild: 0, rhythm: 0 };
  };

  G.Node.prototype.color = function () {
    var t = G.KIND_TRAIT[this.kind];
    return t ? G.TRAIT_COLOR[t] : [180, 200, 220];
  };

  G.Being = function (x, y, dnaHint) {
    this.id = Math.random().toString(36).slice(2, 9);
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.r = 11;
    this.bond = 0.1;
    this.fear = 0.2;
    this.phase = Math.random() * G.TAU;
    this.hue = dnaHint || "empathy";
    this.dead = false;
    this.spoken = false;
    this.name = G.pick(["без имени", "чуть живое", "отголосок", "кто-то", "не я"]);
  };

  G.Wound = function (x, y, fromKind) {
    this.id = Math.random().toString(36).slice(2, 9);
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.r = 14;
    this.hp = 3;
    this.phase = Math.random() * G.TAU;
    this.from = fromKind || "spark";
    this.dead = false;
    this.age = 0;
  };

  G.Player = function () {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.r = 10;
    this.energy = 100;
    this.maxEnergy = 100;
    this.gaze = null;
    this.gazeT = 0;
    this.pulseT = 0;
    this.trail = [];
    this.facing = 0;
    this.stillT = 0;
    this.moveT = 0;
  };

  G.World = function (seed) {
    this.rng = new G.Rng(seed || (Math.random() * 1e9) | 0);
    this.nodes = [];
    this.beings = [];
    this.wounds = [];
    this.stars = [];
    this.anchors = [];
    this.age = 0;
    this.meta = 0;
    this.tide = 0;
    this.tideT = 28 + this.rng.range(10, 30);
    this.bounds = 2200;
    this.biome = "void";
    this.weather = 0;
    this.discovered = 0;
    this.lost = 0;
    this.killed = 0;
    this.saved = 0;
    this.verses = [];
    this.blooms = [];
    this.cracks = [];
    this.laws = [];
    this.forgotten = [];
    this.boss = null;
    this.bossSaid = false;
    this.anchorCap = 3;
    this.tideFrozen = 0;
    this.invertMove = 0;
    this.toneChain = [];
  };

  G.World.prototype.spawnNode = function (x, y, kind) {
    var n = new G.Node(x, y, kind || "spark");
    n.phase = this.rng.range(0, G.TAU);
    this.nodes.push(n);
    return n;
  };

  G.World.prototype.scatter = function (cx, cy, count, radius) {
    for (var i = 0; i < count; i++) {
      var a = this.rng.range(0, G.TAU);
      var d = radius * (0.25 + this.rng.next() * 0.75);
      var n = this.spawnNode(cx + Math.cos(a) * d, cy + Math.sin(a) * d, "spark");
      n.r = 12 + this.rng.range(0, 10);
    }
  };

  G.World.prototype.birthShore = function (player, dna) {
    this.nodes = [];
    this.beings = [];
    this.wounds = [];
    this.biome = dna.dominant();
    var r = 280;
    // five archetypal fragments around the void
    var marks = [
      { a: -0.4, k: "relic", d: 220 },
      { a: 0.9, k: "still", d: 180 },
      { a: 2.2, k: "echo", d: 250 },
      { a: 3.5, k: "thorn", d: 200 },
      { a: 4.8, k: "tone", d: 230 }
    ];
    for (var i = 0; i < marks.length; i++) {
      var m = marks[i];
      var n = this.spawnNode(
        player.x + Math.cos(m.a) * m.d,
        player.y + Math.sin(m.a) * m.d,
        "spark"
      );
      n.hint = m.k;
      n.r = 18;
    }
    this.scatter(player.x, player.y, 7, r + 80);
  };

  G.World.prototype.nearestNode = function (x, y, max) {
    var best = null;
    var bestD = max * max;
    for (var i = 0; i < this.nodes.length; i++) {
      var n = this.nodes[i];
      if (n.dead || n.state === "gone") continue;
      var d = G.dist2(x, y, n.x, n.y);
      if (d < bestD) {
        bestD = d;
        best = n;
      }
    }
    return best;
  };

  G.World.prototype.crystallize = function (node, gest, dna) {
    if (node.state === "alive") return;
    var kind = node.hint || kindFromGesture(gest, dna);
    node.kind = kind;
    node.state = "alive";
    node.growth = 1;
    node.care = 1;
    node.r = 18 + dna.get(G.KIND_TRAIT[kind] || "curiosity") * 10;
    if (kind === "still") {
      node.verse = G.pick([
        "здесь кто-то уже ждал",
        "пауза имеет форму",
        "не всё должно двигаться",
        "я слышу дно"
      ]);
      this.verses.push(node.verse);
    }
    if (kind === "echo") {
      var b = G.Organs.birthBeing(node.x + 20, node.y - 12, "empathy", this.rng);
      this.beings.push(b);
      node.name = b.name;
    }
    if (kind === "tone") {
      var base = G.TRAIT_NOTE[dna.dominant()] || 440;
      node.tone = base * G.pick([0.5, 0.75, 1, 1.25, 1.5]);
    }
    this.discovered++;
    return kind;
  };

  G.World.prototype.forget = function (node, asWound) {
    if (node.dead) return;
    node.dead = true;
    node.state = "gone";
    this.lost++;
    var star = {
      x: node.x * 0.15,
      y: node.y * 0.15,
      c: node.color(),
      kind: node.kind,
      tw: Math.random() * G.TAU,
      ox: node.x,
      oy: node.y,
      verse: node.verse || ""
    };
    this.stars.push(star);
    this.forgotten.push({ kind: node.kind, x: node.x, y: node.y, c: node.color() });
    if (this.forgotten.length > 24) this.forgotten.shift();
    if (asWound) {
      this.wounds.push(new G.Wound(node.x, node.y, node.kind));
      return "wound";
    }
    return "star";
  };

  G.World.prototype.update = function (dt, player, dna, fx) {
    this.age += dt;
    if (this.tideFrozen > 0) this.tideFrozen -= dt;
    if (this.invertMove > 0) this.invertMove -= dt;
    var tideMul = (G.Memory && G.Memory.climate) ? G.Memory.climate().tide : 1;
    this.tideT -= this.tideFrozen > 0 ? 0 : dt * tideMul;
    if (this.tideT <= 0 && this.tide <= 0 && this.tideFrozen <= 0) {
      this.tide = 0.01;
      this.tideT = 42 + this.rng.range(0, 28);
      G.Audio.tide();
      if (G.Haptic) G.Haptic.play("tide");
      G.Voice.say("tide");
    }
    if (this.tide > 0) {
      this.tide += dt * 0.35;
      if (this.tide >= 1) this.tide = 0;
    }

    for (var i = this.nodes.length - 1; i >= 0; i--) {
      var n = this.nodes[i];
      if (n.dead) {
        this.nodes.splice(i, 1);
        continue;
      }
      n.age += dt;
      n.phase += dt * 0.7;
      n.care = Math.max(0, n.care - dt * 0.015);
      if (n.state === "crystallizing") {
        n.growth += dt * 0.55;
        if (n.growth >= 1) n.growth = 1;
      }
      if (this.tide > 0.35 && n.state === "alive" && n.care < 0.28 && this.anchors.indexOf(n.id) < 0) {
        n.hp -= dt * 0.55;
        if (n.hp <= 0) {
          var bitter = dna.get("aggression") > 0.28 || n.kind === "thorn";
          var how = this.forget(n, bitter && this.rng.chance(0.55));
          if (how === "wound") {
            G.Voice.say("woundBorn");
            if (fx) fx.burst(n.x, n.y, 24, [255, 70, 80], 70, 0.9);
          } else {
            G.Voice.say("lost");
            if (fx) fx.burst(n.x, n.y, 18, n.color(), 40, 1.2);
          }
        }
      }
    }

    for (var j = this.beings.length - 1; j >= 0; j--) {
      var b = this.beings[j];
      if (b.dead) {
        this.beings.splice(j, 1);
        continue;
      }
      b.phase += dt;
      var dx = player.x - b.x;
      var dy = player.y - b.y;
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      var temper = b.temper || "shy";
      var want = 0.15;
      var spd = 26 + b.bond * 22;
      if (b.isYesterday) {
        want = 0.55;
        if (d < 42) want = 0;
      } else if (temper === "clingy") {
        want = d < 34 ? 0 : 1;
        spd += 10;
      } else if (temper === "shy") {
        want = d < 90 && Math.sqrt(player.vx * player.vx + player.vy * player.vy) > 60 ? -1 : b.bond > 0.4 ? 0.35 : -0.15;
        if (player.stillT > 3) want = 0.55;
      } else if (temper === "curious") {
        want = 0.35;
      } else if (temper === "wounded") {
        want = d < 70 ? -0.4 : 0.2;
      } else if (temper === "singer") {
        want = d < 50 ? 0 : 0.45;
      }
      if (b.fear > 0.6) want = -1;
      b.vx = G.lerp(b.vx, (dx / d) * spd * want, 1 - Math.pow(0.08, dt));
      b.vy = G.lerp(b.vy, (dy / d) * spd * want, 1 - Math.pow(0.08, dt));
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (d < 56) {
        b.bond = Math.min(1, b.bond + dt * 0.1);
        b.fear = Math.max(0, b.fear - dt * 0.1);
        b.debt = Math.max(0, (b.debt || 0) - dt * 0.08);
      } else if (b.bond > 0.3) {
        b.debt = (b.debt || 0) + dt * 0.015;
      }
    }

    for (var w = this.wounds.length - 1; w >= 0; w--) {
      var u = this.wounds[w];
      if (u.dead) {
        this.wounds.splice(w, 1);
        continue;
      }
      u.age += dt;
      u.phase += dt * 2.4;
      var wx = player.x - u.x;
      var wy = player.y - u.y;
      var wd = Math.sqrt(wx * wx + wy * wy) || 1;
      var wspd = 46 + Math.min(40, u.age * 2);
      u.vx = G.lerp(u.vx, (wx / wd) * wspd, 1 - Math.pow(0.12, dt));
      u.vy = G.lerp(u.vy, (wy / wd) * wspd, 1 - Math.pow(0.12, dt));
      u.x += u.vx * dt;
      u.y += u.vy * dt;
      if (wd < player.r + u.r) {
        player.energy = Math.max(0, player.energy - 22 * dt);
        if (fx && G.chance(0.2)) fx.spawn({
          x: player.x,
          y: player.y,
          vx: G.rand(-30, 30),
          vy: G.rand(-30, 30),
          life: 0.4,
          r: 2,
          c: [255, 70, 90]
        });
      }
    }

    for (var bi = 0; bi < this.blooms.length; bi++) {
      this.blooms[bi].age += dt;
      this.blooms[bi].phase += dt * 0.8;
    }

    var spawnMul = G.Memory && G.Memory.climate ? G.Memory.climate().spawn : 1;
    if (this.nodes.length < 8 + dna.get("curiosity") * 18 * spawnMul + this.meta * 3) {
      if (G.chance(dt * (0.15 + dna.get("curiosity") * 0.35) * spawnMul)) {
        var ang = this.rng.range(0, G.TAU);
        var dist = 340 + this.rng.range(0, 520 + dna.get("curiosity") * 400);
        this.spawnNode(player.x + Math.cos(ang) * dist, player.y + Math.sin(ang) * dist, "spark");
      }
    }
  };

  G.World.prototype.hitWound = function (x, y, r, dmg, fx) {
    var hit = 0;
    for (var i = 0; i < this.wounds.length; i++) {
      var u = this.wounds[i];
      if (u.dead) continue;
      if (G.dist(x, y, u.x, u.y) < r + u.r) {
        u.hp -= dmg;
        hit++;
        if (fx) fx.burst(u.x, u.y, 10, [255, 80, 90], 80, 0.4);
        if (u.hp <= 0) {
          u.dead = true;
          this.killed++;
          this.stars.push({
            x: u.x * 0.15,
            y: u.y * 0.15,
            c: [255, 90, 100],
            kind: "wound",
            tw: Math.random() * G.TAU
          });
        }
      }
    }
    return hit;
  };

  G.World.prototype.charmNear = function (x, y, r) {
    var n = 0;
    for (var i = 0; i < this.beings.length; i++) {
      var b = this.beings[i];
      if (G.dist(x, y, b.x, b.y) < r) {
        b.bond = Math.min(1, b.bond + 0.25);
        b.fear *= 0.4;
        n++;
      }
    }
    for (var j = 0; j < this.wounds.length; j++) {
      var u = this.wounds[j];
      if (G.dist(x, y, u.x, u.y) < r * 0.8) {
        u.hp -= 0.6;
        if (u.hp <= 0) {
          u.dead = true;
          var b2 = G.Organs.birthBeing(u.x, u.y, "empathy", this.rng);
          b2.temper = "singer";
          b2.name = "исцелённое";
          b2.trueName = "исцелённое";
          b2.named = true;
          b2.bond = 0.4;
          this.beings.push(b2);
        }
      }
    }
    return n;
  };

  G.World.prototype.resonate = function (x, y, fx) {
    var count = 0;
    for (var i = 0; i < this.nodes.length; i++) {
      var n = this.nodes[i];
      if (n.kind === "tone" && n.state === "alive" && G.dist(x, y, n.x, n.y) < 280) {
        n.care = 1;
        count++;
        G.Audio.tone(n.tone, 0.8, 0.06, "sine");
        if (fx) fx.ring(n.x, n.y, 16, G.TRAIT_COLOR.harmony, n.r, 0.6);
      }
    }
    return count;
  };

  G.World.prototype.anchor = function (node) {
    if (this.anchors.indexOf(node.id) >= 0) return false;
    var cap = this.anchorCap || 3;
    if (this.anchors.length >= cap) this.anchors.shift();
    this.anchors.push(node.id);
    node.care = 1;
    this.saved++;
    return true;
  };

  G.World.prototype.metamorphose = function (player, dna) {
    this.meta++;
    this.biome = dna.dominant();
    var keep = [];
    for (var i = 0; i < this.nodes.length; i++) {
      var n = this.nodes[i];
      if (n.state === "alive" && n.care > 0.55) {
        this.stars.push({
          x: n.x * 0.12,
          y: n.y * 0.12,
          c: n.color(),
          kind: n.kind,
          tw: Math.random() * G.TAU
        });
      }
    }
    var loyal = [];
    for (var bi = 0; bi < this.beings.length; bi++) {
      if (this.beings[bi].bond > 0.55) loyal.push(this.beings[bi]);
    }
    this.nodes = keep;
    this.wounds = [];
    this.cracks = [];
    this.boss = null;
    this.bossSaid = false;
    player.x *= 0.15;
    player.y *= 0.15;
    player.vx = 0;
    player.vy = 0;
    this.scatter(player.x, player.y, 10 + this.meta * 2, 360);
    this.birthShore(player, dna);
    for (var li = 0; li < loyal.length; li++) {
      loyal[li].x = player.x + G.rand(-40, 40);
      loyal[li].y = player.y + G.rand(-40, 40);
      this.beings.push(loyal[li]);
    }
    this.tide = 0;
    this.tideT = 36;
  };

  G.World.prototype.toJSON = function () {
    return {
      age: this.age,
      meta: this.meta,
      biome: this.biome,
      discovered: this.discovered,
      lost: this.lost,
      killed: this.killed,
      saved: this.saved,
      verses: this.verses,
      stars: this.stars,
      anchors: this.anchors,
      nodes: this.nodes.map(function (n) {
        return {
          id: n.id,
          x: n.x,
          y: n.y,
          kind: n.kind,
          state: n.state,
          care: n.care,
          r: n.r,
          verse: n.verse,
          tone: n.tone
        };
      }),
      beings: this.beings.map(function (b) {
        return {
          x: b.x,
          y: b.y,
          bond: b.bond,
          fear: b.fear,
          name: b.name,
          hue: b.hue,
          temper: b.temper,
          trueName: b.trueName,
          named: b.named,
          debt: b.debt,
          isYesterday: !!b.isYesterday
        };
      }),
      blooms: this.blooms,
      forgotten: this.forgotten,
      anchorCap: this.anchorCap,
      laws: this.laws
    };
  };
})(IGRA);
