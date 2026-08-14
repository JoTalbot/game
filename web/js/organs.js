var IGRA = IGRA || {};
(function (G) {
  "use strict";

  var TEMPERS = ["clingy", "shy", "curious", "wounded", "singer"];

  var TEMPER_RU = {
    clingy: "цепкое",
    shy: "робкое",
    curious: "ищущее",
    wounded: "раненое",
    singer: "поющее"
  };

  var BABY_NAMES = ["без имени", "отголосок", "чуть живое", "кто-то", "не я", "едва"];

  var TRUE_NAMES = {
    clingy: ["Держусь", "Не отпускай", "Рядом", "Теплее"],
    shy: ["Чуть дальше", "Почти", "За туманом", "Не сразу"],
    curious: ["Ещё", "Куда ты", "Смотри", "Дальше края"],
    wounded: ["Болит тихо", "Шов", "Было твоё", "Не бросай дважды"],
    singer: ["Второй голос", "Такт", "Совпадение", "Камертон"]
  };

  var SPEECH = {
    clingy: [
      "не уходи далеко.",
      "я уже привыкло к твоему теплу.",
      "если пульснёшь в сторону — я подумаю, что это я."
    ],
    shy: [
      "можно… чуть тише.",
      "я ближе, когда ты не бежишь.",
      "не смотри в упор. смотри рядом."
    ],
    curious: [
      "там, за туманом, ещё не решили.",
      "пошли. я хочу увидеть, чем это станет.",
      "ты оставляешь следы. я их коллекционирую."
    ],
    wounded: [
      "это не злость. это память.",
      "меня уже однажды отпустили.",
      "если ударишь — я пойму. если сядешь — тоже."
    ],
    singer: [
      "попади ещё раз.",
      "мир совпадает, когда ты не торопишься.",
      "я могу держать ноту, пока ты идёшь."
    ]
  };

  var LAWS = [
    { id: "tideSleep", ru: "прилив спит", hint: "забвение не придёт какое-то время" },
    { id: "woundsSing", ru: "раны поют", hint: "голод становится тоном" },
    { id: "invert", ru: "тяжесть наоборот", hint: "шаг идёт в другую сторону" },
    { id: "rename", ru: "имена лгут", hint: "существа меняют лица" },
    { id: "moreAnchors", ru: "якорей больше", hint: "можно удержать ещё одно" },
    { id: "swapKinds", ru: "берег путает органы", hint: "живое меняет природу" },
    { id: "bloom", ru: "сад без разрешения", hint: "цветы сами" },
    { id: "reveal", ru: "туман признаётся", hint: "неоформленное вспыхивает" }
  ];

  var VERSE_STEM = [
    "в паузе я услышала $trait",
    "ты отпустил $lost. сад это помнит",
    "$being стояло, пока ты молчал",
    "тишина номер $n не похожа на первую",
    "берег дышит $biome",
    "я пишу это из того, чего ты не сделал",
    "если бы у паузы было имя, её звали бы как тебя",
    "забвение прошло мимо и оставило запятую"
  ];

  G.Organs = {
    TEMPER_RU: TEMPER_RU,

    birthBeing: function (x, y, hint, rng) {
      var b = new G.Being(x, y, hint || "empathy");
      var r = rng || new G.Rng((Math.random() * 1e9) | 0);
      b.temper = r.pick(TEMPERS);
      if (hint === "wounded") b.temper = "wounded";
      if (hint === "harmony") b.temper = "singer";
      b.name = r.pick(BABY_NAMES);
      b.trueName = r.pick(TRUE_NAMES[b.temper]);
      b.named = false;
      b.debt = 0;
      b.memory = [];
      b.lastNear = 0;
      b.spoken = false;
      return b;
    },

    nameBeing: function (b) {
      if (b.named) return b.name;
      b.named = true;
      b.name = b.trueName || b.name;
      return b.name;
    },

    speakBeing: function (b) {
      var pool = SPEECH[b.temper] || SPEECH.shy;
      var i = (b.memory.length + (b.named ? 1 : 0)) % pool.length;
      return (b.named ? b.name + ". " : "") + pool[i];
    },

    remember: function (b, ev) {
      b.memory.push({ t: Date.now(), ev: ev });
      if (b.memory.length > 12) b.memory.shift();
    },

    composeVerse: function (game) {
      var stem = G.pick(VERSE_STEM);
      var lost = game.world.forgotten && game.world.forgotten.length
        ? G.KIND_RU[game.world.forgotten[game.world.forgotten.length - 1].kind] || "это"
        : "ничего";
      var being = game.world.beings[0] ? game.world.beings[0].name : "никто";
      var text = stem
        .replace("$trait", G.TRAIT_RU[game.dna.dominant()])
        .replace("$lost", lost)
        .replace("$being", being)
        .replace("$n", String((game.world.verses.length || 0) + 1))
        .replace("$biome", G.TRAIT_RU[game.world.biome] || game.world.biome);
      return text;
    },

    plantBloom: function (world, x, y, verse) {
      var bloom = {
        x: x + G.rand(-28, 28),
        y: y + G.rand(-28, 28),
        r: 6 + Math.random() * 7,
        phase: Math.random() * G.TAU,
        verse: verse || "",
        age: 0,
        c: G.TRAIT_COLOR.contemplation
      };
      world.blooms.push(bloom);
      if (world.blooms.length > 36) world.blooms.shift();
      return bloom;
    },

    maybeGarden: function (game, dt) {
      if (G.Director.organs.garden < 0.22) return;
      var p = game.player;
      if (p.stillT > 6.5 && G.chance(dt * 0.35)) {
        var verse = null;
        if (p.stillT > 8 && G.chance(0.45)) {
          verse = this.composeVerse(game);
          game.world.verses.push(verse);
          G.Voice.sayText(verse, true);
        }
        var b = this.plantBloom(game.world, p.x, p.y, verse);
        game.fx.burst(b.x, b.y, 8, G.TRAIT_COLOR.contemplation, 18, 1.1);
        if (game.world.blooms.length === 1) G.Voice.say("garden");
      }
    },

    maybeBoss: function (game) {
      var w = game.world;
      if (w.boss || w.lost < (w.lostGate || 4)) return;
      if (G.Director.organs.combat < 0.18 && w.lost < 6) return;
      if (w.bossSaid) return;
      var parts = (w.forgotten || []).slice(-5);
      if (!parts.length) {
        parts = [{ kind: "thorn", c: [255, 70, 80] }];
      }
      var p = game.player;
      var a = Math.random() * G.TAU;
      w.boss = {
        x: p.x + Math.cos(a) * 320,
        y: p.y + Math.sin(a) * 320,
        vx: 0,
        vy: 0,
        r: 28,
        hp: 7 + parts.length * 2 + w.lost,
        maxHp: 7 + parts.length * 2 + w.lost,
        parts: parts,
        phase: 0,
        lunge: 0,
        stun: 0,
        weak: 0,
        name: G.pick(["Собранная", "Голод из тебя", "То, что не стало небом"])
      };
      w.bossSaid = true;
      G.Voice.say("boss", true);
      G.UI.hint(w.boss.name + " собралась из брошенного");
      setTimeout(function () {
        G.UI.hint("");
      }, 4200);
    },

    updateBoss: function (game, dt) {
      var boss = game.world.boss;
      if (!boss) return;
      boss.phase += dt;
      if (boss.stun > 0) boss.stun -= dt;
      if (boss.weak > 0) boss.weak -= dt;
      var p = game.player;
      var dx = p.x - boss.x;
      var dy = p.y - boss.y;
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      if (boss.stun <= 0) {
        boss.lunge -= dt;
        var spd = boss.lunge > 0 ? 150 : 42;
        if (boss.lunge <= -2.4) boss.lunge = 0.55;
        boss.vx = G.lerp(boss.vx, (dx / d) * spd, 1 - Math.pow(0.15, dt));
        boss.vy = G.lerp(boss.vy, (dy / d) * spd, 1 - Math.pow(0.15, dt));
      } else {
        boss.vx *= Math.pow(0.2, dt);
        boss.vy *= Math.pow(0.2, dt);
      }
      boss.x += boss.vx * dt;
      boss.y += boss.vy * dt;
      if (d < boss.r + p.r + 6) {
        p.energy = Math.max(0, p.energy - 38 * dt);
        if (G.chance(dt * 8)) {
          game.fx.spawn({
            x: p.x,
            y: p.y,
            vx: G.rand(-40, 40),
            vy: G.rand(-40, 40),
            life: 0.35,
            r: 2.2,
            c: [255, 70, 90]
          });
        }
      }
    },

    hitBoss: function (game, dmg, style) {
      var boss = game.world.boss;
      if (!boss) return false;
      var p = game.player;
      if (G.dist(p.x, p.y, boss.x, boss.y) > 130 + (boss.weak > 0 ? 40 : 0)) return false;
      if (style === "empathy") {
        boss.hp -= dmg * 0.55;
        this._peel(game);
      } else if (style === "harmony") {
        boss.stun = 2.2;
        boss.hp -= dmg * 0.35;
      } else if (style === "contemplation") {
        boss.stun = 1.4;
        boss.weak = 3;
      } else if (style === "curiosity") {
        boss.weak = 3.5;
        G.Voice.sayText("шов. бей сюда — или сядь рядом.", true);
      } else if (style === "chaos") {
        boss.lunge = -1;
        boss.hp -= dmg * 0.4;
        game.glitch = 0.9;
      } else {
        boss.hp -= dmg * (boss.weak > 0 ? 1.6 : 1);
      }
      game.fx.burst(boss.x, boss.y, 18, [255, 80, 90], 90, 0.45);
      G.Shake.add(7);
      if (boss.hp <= 0) {
        this.killBoss(game, style === "empathy" || style === "harmony");
      }
      return true;
    },

    _peel: function (game) {
      var boss = game.world.boss;
      if (!boss || !boss.parts.length) return;
      var part = boss.parts.pop();
      var b = this.birthBeing(boss.x + G.rand(-30, 30), boss.y + G.rand(-30, 30), "empathy", game.world.rng);
      b.temper = "wounded";
      b.name = "осколок " + (G.KIND_RU[part.kind] || "");
      b.trueName = "Было брошено";
      b.bond = 0.25;
      game.world.beings.push(b);
      G.Voice.say("peel");
    },

    killBoss: function (game, mercy) {
      var boss = game.world.boss;
      if (!boss) return;
      if (mercy) {
        var b = this.birthBeing(boss.x, boss.y, "empathy", game.world.rng);
        b.temper = "wounded";
        b.name = "то, что ты бросил";
        b.trueName = "то, что ты бросил";
        b.named = true;
        b.bond = 0.55;
        game.world.beings.push(b);
        G.Voice.say("bossMercy", true);
      } else {
        for (var i = 0; i < 5; i++) {
          game.world.stars.push({
            x: boss.x * 0.12 + G.rand(-20, 20),
            y: boss.y * 0.12 + G.rand(-20, 20),
            c: [255, 90, 110],
            kind: "wound",
            tw: Math.random() * G.TAU
          });
        }
        G.Voice.say("bossKill", true);
      }
      game.fx.burst(boss.x, boss.y, 48, [255, 80, 100], 120, 1.1);
      game.world.boss = null;
      game.world.bossSaid = false;
      game.world.lostGate = (game.world.lost || 0) + 3;
      game.world.killed++;
      game.metaFlash = 0.35;
    },

    spawnCrack: function (world, x, y) {
      if (world.cracks.length > 5) world.cracks.shift();
      var law = G.pick(LAWS);
      world.cracks.push({
        x: x,
        y: y,
        law: law,
        life: 28,
        phase: Math.random() * G.TAU,
        open: 0
      });
    },

    applyLaw: function (game, crack) {
      var id = crack.law.id;
      var w = game.world;
      w.laws.push({ id: id, ru: crack.law.ru, t: game.time });
      if (w.laws.length > 8) w.laws.shift();
      if (id === "tideSleep") w.tideFrozen = 32;
      if (id === "woundsSing") {
        for (var i = w.wounds.length - 1; i >= 0; i--) {
          var u = w.wounds[i];
          var n = w.spawnNode(u.x, u.y, "tone");
          n.state = "alive";
          n.kind = "tone";
          n.care = 1;
          n.tone = 196 * G.pick([1, 1.25, 1.5, 2]);
          u.dead = true;
        }
      }
      if (id === "invert") w.invertMove = 11;
      if (id === "rename") {
        for (var j = 0; j < w.beings.length; j++) {
          var b = w.beings[j];
          b.temper = G.pick(TEMPERS);
          b.trueName = G.pick(TRUE_NAMES[b.temper]);
          if (b.named) b.name = b.trueName;
        }
      }
      if (id === "moreAnchors") w.anchorCap = Math.min(7, (w.anchorCap || 3) + 1);
      if (id === "swapKinds") {
        var live = w.nodes.filter(function (n) {
          return n.state === "alive";
        });
        for (var k = 0; k < live.length; k++) {
          live[k].kind = G.pick(["relic", "thorn", "still", "echo", "shard", "tone"]);
        }
      }
      if (id === "bloom") {
        for (var m = 0; m < 6; m++) this.plantBloom(w, game.player.x, game.player.y, "");
      }
      if (id === "reveal") {
        for (var q = 0; q < w.nodes.length; q++) {
          if (G.dist(game.player.x, game.player.y, w.nodes[q].x, w.nodes[q].y) < 380) {
            w.nodes[q].care = 1;
          }
        }
      }
      crack.life = 0;
      game.floaters.add(crack.x, crack.y - 14, "закон: " + crack.law.ru, G.TRAIT_COLOR.chaos);
      G.Voice.sayText(crack.law.ru + ". " + crack.law.hint + ".", true);
      G.UI.law(crack.law.ru + " — " + crack.law.hint);
      game.glitch = 1;
      game.fx.ring(crack.x, crack.y, 24, G.TRAIT_COLOR.chaos, 20, 0.8);
      G.Audio.tone(140, 0.4, 0.08, "sawtooth");
    },

    maybeCracks: function (game, dt) {
      if (G.Director.organs.glitch < 0.28) return;
      var w = game.world;
      var cmul = G.Memory && G.Memory.climate ? G.Memory.climate().cracks : 1;
      if (w.cracks.length < 1 + G.Director.organs.glitch * 3 * cmul && G.chance(dt * 0.08 * G.Director.organs.glitch * cmul)) {
        var a = Math.random() * G.TAU;
        var d = 80 + Math.random() * 260;
        this.spawnCrack(w, game.player.x + Math.cos(a) * d, game.player.y + Math.sin(a) * d);
        if (w.cracks.length === 1) G.Voice.say("crack");
      }
      for (var i = w.cracks.length - 1; i >= 0; i--) {
        w.cracks[i].life -= dt;
        w.cracks[i].phase += dt * 3;
        w.cracks[i].open = Math.min(1, w.cracks[i].open + dt);
        if (w.cracks[i].life <= 0) w.cracks.splice(i, 1);
      }
    },

    playTone: function (game, node) {
      if (!node || node.kind !== "tone") return;
      G.Audio.tone(node.tone, 0.7, 0.07, "sine");
      game.fx.ring(node.x, node.y, 18, G.TRAIT_COLOR.harmony, node.r, 0.55);
      node.care = 1;
      var chain = game.world.toneChain;
      chain.push({ t: game.time, f: node.tone, x: node.x, y: node.y });
      while (chain.length && game.time - chain[0].t > 2.6) chain.shift();
      if (chain.length >= 3) {
        this.resolveChord(game);
        game.world.toneChain = [];
      }
    },

    resolveChord: function (game) {
      var p = game.player;
      G.Audio.chord(
        game.world.nodes.filter(function (n) {
          return n.kind === "tone" && n.state === "alive";
        }).slice(0, 4).map(function (n) {
          return n.tone;
        }),
        1.4,
        0.06
      );
      game.fx.ring(p.x, p.y, 28, G.TRAIT_COLOR.harmony, 30, 1);
      for (var i = 0; i < game.world.beings.length; i++) {
        var b = game.world.beings[i];
        if (G.dist(p.x, p.y, b.x, b.y) < 300) {
          b.bond = Math.min(1, b.bond + 0.12);
          b.debt = Math.max(0, b.debt - 0.4);
        }
      }
      for (var j = 0; j < game.world.wounds.length; j++) {
        var u = game.world.wounds[j];
        var dx = u.x - p.x;
        var dy = u.y - p.y;
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        u.vx += (dx / d) * 220;
        u.vy += (dy / d) * 220;
      }
      if (game.world.boss) {
        game.world.boss.stun = Math.max(game.world.boss.stun, 1.6);
      }
      var near = game.world.nearestNode(p.x, p.y, 180);
      if (near && near.state === "alive") game.world.anchor(near);
      G.Voice.say("music");
      game.floaters.add(p.x, p.y - 30, "аккорд", G.TRAIT_COLOR.harmony);
    },

    nearestBeing: function (world, x, y, max) {
      var best = null;
      var bestD = max * max;
      for (var i = 0; i < world.beings.length; i++) {
        var b = world.beings[i];
        if (b.dead) continue;
        var d = G.dist2(x, y, b.x, b.y);
        if (d < bestD) {
          bestD = d;
          best = b;
        }
      }
      return best;
    },

    nearestCrack: function (world, x, y, max) {
      var best = null;
      var bestD = max * max;
      for (var i = 0; i < world.cracks.length; i++) {
        var c = world.cracks[i];
        var d = G.dist2(x, y, c.x, c.y);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      return best;
    },

    nearestStar: function (world, sx, sy, cam, max) {
      var best = null;
      var bestD = max * max;
      for (var i = 0; i < world.stars.length; i++) {
        var st = world.stars[i];
        var x = cam.w * 0.5 + st.x * 0.9;
        var y = cam.h * 0.42 + st.y * 0.7;
        var d = (x - sx) * (x - sx) + (y - sy) * (y - sy);
        if (d < bestD) {
          bestD = d;
          best = st;
        }
      }
      return best;
    },

    toggleSky: function (game, force) {
      var on = force == null ? !game.sky : force;
      if (on && game.world.stars.length < 2) {
        G.UI.hint("небу не из чего состоять. отпусти что-нибудь.");
        setTimeout(function () {
          G.UI.hint("");
        }, 3200);
        return;
      }
      game.sky = on;
      if (on) {
        G.Voice.say("sky");
        G.UI.hint("коснись звезды — вспомнить");
      } else {
        G.UI.hint("");
      }
      var btn = document.getElementById("sky-btn");
      if (btn) btn.classList.toggle("lit", on);
    }
  };
})(IGRA);
