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

  var TEMPER_EN = {
    clingy: "clinging",
    shy: "shy",
    curious: "seeking",
    wounded: "wounded",
    singer: "singing"
  };

  var BABY_NAMES = ["без имени", "отголосок", "чуть живое", "кто-то", "не я", "едва"];
  var BABY_NAMES_EN = ["nameless", "an echo", "barely alive", "someone", "not me", "hardly"];

  var TRUE_NAMES = {
    clingy: ["Держусь", "Не отпускай", "Рядом", "Теплее"],
    shy: ["Чуть дальше", "Почти", "За туманом", "Не сразу"],
    curious: ["Ещё", "Куда ты", "Смотри", "Дальше края"],
    wounded: ["Болит тихо", "Шов", "Было твоё", "Не бросай дважды"],
    singer: ["Второй голос", "Такт", "Совпадение", "Камертон"]
  };

  var TRUE_NAMES_EN = {
    clingy: ["I Hold On", "Don't Let Go", "Near", "Warmer"],
    shy: ["A Bit Further", "Almost", "Behind the Fog", "Not At Once"],
    curious: ["More", "Where To", "Look", "Past the Edge"],
    wounded: ["It Aches Quietly", "Seam", "Was Yours", "Don't Leave Twice"],
    singer: ["Second Voice", "Beat", "Coincidence", "Tuning Fork"]
  };

  var SPEECH = {
    clingy: ["не уходи далеко.", "я уже привыкло к твоему теплу.", "если пульснёшь в сторону — я подумаю, что это я."],
    shy: ["можно… чуть тише.", "я ближе, когда ты не бежишь.", "не смотри в упор. смотри рядом."],
    curious: ["там, за туманом, ещё не решили.", "пошли. я хочу увидеть, чем это станет.", "ты оставляешь следы. я их коллекционирую."],
    wounded: ["это не злость. это память.", "меня уже однажды отпустили.", "если ударишь — я пойму. если сядешь — тоже."],
    singer: ["попади ещё раз.", "мир совпадает, когда ты не торопишься.", "я могу держать ноту, пока ты идёшь."]
  };

  var SPEECH_EN = {
    clingy: ["don't go far.", "i am already used to your warmth.", "if you pulse aside, i will think it was me."],
    shy: ["could you… be a little quieter.", "i come closer when you are not running.", "don't stare. look beside me."],
    curious: ["out there, behind the fog, nothing is decided yet.", "come on. i want to see what this becomes.", "you leave tracks. i collect them."],
    wounded: ["this is not anger. this is memory.", "i was let go once already.", "if you strike, i will understand. if you sit down, that too."],
    singer: ["hit it once more.", "the world coincides when you don't hurry.", "i can hold a note while you walk."]
  };

  function speechPool(temper) {
    var en = G.Lang && G.Lang.id === "en";
    return (en ? SPEECH_EN : SPEECH)[temper] || (en ? SPEECH_EN : SPEECH).shy;
  }

  G.beingName = function (b) {
    if (!b) return "";
    var en = G.Lang && G.Lang.id === "en";
    if (b.healed) return G.Lang ? G.Lang.t("healed") : "исцелённое";
    if (b.shardOf) {
      if (b.named) return G.Lang.t("wasAbandoned");
      return G.Lang.t("shardOf") + " " + G.kindName(b.shardOf);
    }
    if (b.named) {
      if (b.nameKey && TRUE_NAMES[b.nameKey.t]) {
        var pool = (en ? TRUE_NAMES_EN : TRUE_NAMES)[b.nameKey.t] || TRUE_NAMES[b.nameKey.t];
        return pool[b.nameKey.i % pool.length];
      }
      return b.name || "";
    }
    if (b.babyKey != null) {
      var babies = en ? BABY_NAMES_EN : BABY_NAMES;
      return babies[b.babyKey % babies.length];
    }
    return b.name || "";
  };

  G.temperName = function (t) {
    if (G.Lang && G.Lang.id === "en") return TEMPER_EN[t] || t;
    return TEMPER_RU[t] || t;
  };

  var LAWS = [
    { id: "tideSleep", ru: "прилив спит", hint: "забвение не придёт какое-то время", en: "the tide sleeps", enHint: "oblivion will not come for a while", lasts: 32 },
    { id: "woundsSing", ru: "раны поют", hint: "голод становится тоном", en: "wounds sing", enHint: "hunger turns into a tone" },
    { id: "invert", ru: "тяжесть наоборот", hint: "шаг идёт в другую сторону", en: "weight inverted", enHint: "your step goes the other way", lasts: 11 },
    { id: "rename", ru: "имена лгут", hint: "существа меняют лица", en: "names lie", enHint: "beings change their faces" },
    { id: "moreAnchors", ru: "якорей больше", hint: "можно удержать ещё одно", en: "more anchors", enHint: "you can hold one more" },
    { id: "swapKinds", ru: "берег путает органы", hint: "живое меняет природу", en: "the shore confuses organs", enHint: "the living changes its nature" },
    { id: "bloom", ru: "сад без разрешения", hint: "цветы сами", en: "a garden unasked", enHint: "flowers on their own" },
    { id: "reveal", ru: "туман признаётся", hint: "неоформленное вспыхивает", en: "the fog confesses", enHint: "the unformed flares up" },
    { id: "stillHold", ru: "тишина держит", hint: "корни не сохнут", en: "silence holds", enHint: "roots do not wither", lasts: 23 }
  ];

  function lawName(law) { return G.Lang && G.Lang.id === "en" ? law.en || law.ru : law.ru; }
  function lawHint(law) { return G.Lang && G.Lang.id === "en" ? law.enHint || law.hint : law.hint; }
  var LAW_WORD = { ru: "закон: ", en: "law: " };

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

  var VERSE_STEM_EN = [
    "in the pause i heard $trait",
    "you let $lost go. the garden remembers",
    "$being stood there while you were silent",
    "silence number $n is not like the first",
    "the shore breathes $biome",
    "i am writing this out of what you did not do",
    "if the pause had a name, it would be yours",
    "oblivion walked past and left a comma"
  ];

  var BOSS_NAMES = {
    ru: ["Собранная", "Голод из тебя", "То, что не стало небом"],
    en: ["The Gathered", "Hunger Made of You", "What Did Not Become Sky"]
  };

  G.bossName = function (b) {
    if (!b) return "";
    if (b.nameKey == null) return b.name || "";
    var pool = G.Lang && G.Lang.id === "en" ? BOSS_NAMES.en : BOSS_NAMES.ru;
    return pool[b.nameKey % pool.length];
  };

  var NOTHING = { ru: "ничего", en: "nothing" };
  var NOBODY = { ru: "никто", en: "no one" };

  var STILL_VERSE = {
    ru: ["здесь кто-то уже ждал", "пауза имеет форму", "не всё должно двигаться", "я слышу дно"],
    en: ["someone was already waiting here", "a pause has a shape", "not everything must move", "i hear the bottom"]
  };

  G.verseText = function (v) {
    if (!v) return "";
    if (typeof v === "string") return v;
    var en = G.Lang && G.Lang.id === "en";
    if (v.who) return G.beingName(v.who);
    if (v.still != null) {
      var st = en ? STILL_VERSE.en : STILL_VERSE.ru;
      return st[v.still % st.length];
    }
    var stems = en ? VERSE_STEM_EN : VERSE_STEM;
    return stems[v.i % stems.length]
      .replace("$trait", G.traitName(v.trait))
      .replace("$lost", v.lost ? G.kindName(v.lost) : (en ? NOTHING.en : NOTHING.ru))
      .replace("$being", v.being ? (G.beingName(v.being) || (en ? NOBODY.en : NOBODY.ru)) : (en ? NOBODY.en : NOBODY.ru))
      .replace("$n", String(v.n))
      .replace("$biome", G.traitName(v.biome));
  };

  G.Organs = {
    TEMPER_RU: TEMPER_RU,
    TEMPER_EN: TEMPER_EN,

    birthBeing: function (x, y, hint, rng) {
      var b = new G.Being(x, y, hint || "empathy");
      var r = rng || new G.Rng((Math.random() * 1e9) | 0);
      b.temper = r.pick(TEMPERS);
      if (hint === "wounded") b.temper = "wounded";
      if (hint === "harmony") b.temper = "singer";
      b.babyKey = r.int(0, BABY_NAMES.length);
      b.nameKey = { t: b.temper, i: r.int(0, TRUE_NAMES[b.temper].length) };
      b.name = G.beingName(b);
      b.trueName = TRUE_NAMES[b.temper][b.nameKey.i];
      b.named = false;
      b.debt = 0;
      b.memory = [];
      b.lastNear = 0;
      b.spoken = false;
      return b;
    },

    nameBeing: function (b) {
      if (b.named) return G.beingName(b);
      b.named = true;
      b.name = b.trueName || b.name;
      return G.beingName(b);
    },

    speakBeing: function (b) {
      var pool = speechPool(b.temper);
      var i = (b.memory.length + (b.named ? 1 : 0)) % pool.length;
      return (b.named ? G.beingName(b) + ". " : "") + pool[i];
    },

    remember: function (b, ev) {
      b.memory.push({ t: Date.now(), ev: ev });
      if (b.memory.length > 12) b.memory.shift();
    },

    composeVerse: function (game) {
      var w = game.world;
      var b = w.beings[0];
      return {
        i: (Math.random() * VERSE_STEM.length) | 0,
        trait: game.dna.dominant(),
        lost: w.forgotten && w.forgotten.length ? w.forgotten[w.forgotten.length - 1].kind : "",
        being: b ? { named: b.named, nameKey: b.nameKey, babyKey: b.babyKey, name: b.name } : null,
        n: (w.verses.length || 0) + 1,
        biome: w.biome
      };
    },

    stillVerse: function () {
      return { still: (Math.random() * STILL_VERSE.ru.length) | 0 };
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

    _verseSaid: -999,
    _chordSaid: -999,

    maybeGarden: function (game, dt) {
      if (G.Director.organs.garden < 0.22) return;
      var p = game.player;
      if (p.stillT > 6.5 && G.chance(dt * 0.35)) {
        var verse = null;
        if (p.stillT > 8 && G.chance(0.45)) {
          verse = this.composeVerse(game);
          game.world.addVerse(verse);
          // Стих теперь остаётся только в памяти берега. Старая версия
          // показывала тот же текст одновременно над каждым цветком,
          // превращая созерцание в ковёр из повторяющихся строк.
          var t = G.now();
          if (t - this._verseSaid > 90) {
            this._verseSaid = t;
            if (G.Voice) G.Voice.sayText(G.verseText(verse));
          }
        }
        var b = this.plantBloom(game.world, p.x, p.y, verse);
        game.fx.burst(b.x, b.y, 8, G.TRAIT_COLOR.contemplation, 18, 1.1);
        if (game.world.blooms.length === 1 && G.Voice) G.Voice.say("garden");
      }
    },

    maybeBoss: function (game) {
      var w = game.world;
      if (w.boss || w.lost < (w.lostGate || 15) || w.bossSaid) return;
      var parts = (w.forgotten || []).slice(-5);
      if (!parts.length) parts = [{ kind: "thorn", c: [255, 70, 80] }];
      var p = game.player;
      var a = Math.random() * G.TAU;
      var lostScale = Math.min(w.lost, 10);
      w.boss = {
        x: p.x + Math.cos(a) * 320,
        y: p.y + Math.sin(a) * 320,
        vx: 0,
        vy: 0,
        r: 28,
        hp: 7 + parts.length * 2 + lostScale,
        maxHp: 7 + parts.length * 2 + lostScale,
        parts: parts,
        phase: 0,
        lunge: 0,
        stun: 0,
        weak: 0,
        nameKey: (Math.random() * 3) | 0
      };
      w.bossSaid = true;
      G.Voice.say("boss", true);
      G.UI.hint(G.bossName(w.boss) + " " + G.Lang.t("bossGathered"));
      setTimeout(function () { G.UI.hint(""); }, 4200);
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
      boss.t = (boss.t || 0);
      if (d > 200) boss.t += dt;
      else boss.t = Math.max(0, boss.t - dt * 2);
      if (boss.t > 25 && !boss._fadeSaid) {
        boss._fadeSaid = true;
        if (G.Voice) G.Voice.say("bossFading");
      }
      if (boss.t > 50) {
        for (var si = 0; si < 3; si++) {
          game.world.addStar({ x: boss.x * 0.12 + G.rand(-20, 20), y: boss.y * 0.12 + G.rand(-20, 20), c: [255, 90, 110], kind: "wound", tw: Math.random() * G.TAU });
        }
        if (game.fx) game.fx.burst(boss.x, boss.y, 40, [255, 80, 100], 100, 0.9);
        game.world.boss = null;
        game.world.bossSaid = false;
        game.world.lostGate = (game.world.lost || 0) + 25;
        if (G.Voice) G.Voice.say("bossLeft");
        return;
      }
      if (boss.stun <= 0) {
        boss.lunge -= dt;
        var spd = (boss.lunge > 0 && d < 160) ? 150 : 42;
        if (boss.lunge <= -2.4) boss.lunge = 0.55;
        boss.vx = G.lerp(boss.vx, (dx / d) * spd, 1 - Math.pow(0.15, dt));
        boss.vy = G.lerp(boss.vy, (dy / d) * spd, 1 - Math.pow(0.15, dt));
      } else {
        boss.vx *= Math.pow(0.2, dt);
        boss.vy *= Math.pow(0.2, dt);
      }
      boss.x += boss.vx * dt;
      boss.y += boss.vy * dt;
      if (d < 520 && G.Voice && !G.Voice.visible && (!boss._talkAt || game.time - boss._talkAt > 45)) {
        boss._talkAt = game.time;
        G.Voice.say("bossSpeak");
      }
      if (d < boss.r + p.r + 6) {
        var combat = G.Director && G.Director.organs ? (G.Director.organs.combat || 0) : 0;
        var bite = 1 + combat * 11;
        p.energy = Math.max(0, p.energy - bite * dt);
        if (G.Report) { G.Report.noteDrain("boss", bite * dt); G.Report.noteEnergy(p.energy); }
        if (G.chance(dt * 8)) game.fx.spawn({ x: p.x, y: p.y, vx: G.rand(-40, 40), vy: G.rand(-40, 40), life: 0.35, r: 2.2, c: [255, 70, 90] });
      }
    },

    hitBoss: function (game, dmg, style) {
      var boss = game.world.boss;
      if (!boss) return false;
      var p = game.player;
      if (G.dist(p.x, p.y, boss.x, boss.y) > 130 + (boss.weak > 0 ? 40 : 0)) return false;
      if (style === "empathy") { boss.hp -= dmg * 0.55; this._peel(game); }
      else if (style === "harmony") { boss.stun = 2.2; boss.hp -= dmg * 0.35; }
      else if (style === "contemplation") { boss.stun = 1.4; boss.weak = 3.9; }
      else if (style === "curiosity") { boss.weak = 3.9; G.Voice.sayText(G.Lang.t("seamHit"), true); }
      else if (style === "chaos") { boss.lunge = -1; boss.hp -= dmg; game.glitch = 0.9; }
      else boss.hp -= dmg * (boss.weak > 0 ? 1.6 : 1);
      game.fx.burst(boss.x, boss.y, 18, [255, 80, 90], 90, 0.45);
      G.Shake.add(7);
      if (boss.hp <= 0) this.killBoss(game, style === "empathy" || style === "harmony");
      return true;
    },

    _peel: function (game) {
      var boss = game.world.boss;
      if (!boss || !boss.parts.length) return;
      var part = boss.parts.pop();
      var b = this.birthBeing(boss.x + G.rand(-30, 30), boss.y + G.rand(-30, 30), "empathy", game.world.rng);
      b.temper = "wounded";
      b.shardOf = part.kind;
      b.nameKey = null;
      b.name = "";
      b.trueName = "";
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
        b.name = G.Lang.t("whatYouLeft");
        b.trueName = G.Lang.t("whatYouLeft");
        b.named = true;
        b.bond = 0.55;
        game.world.beings.push(b);
        G.Voice.say("bossMercy", true);
      } else {
        for (var i = 0; i < 5; i++) {
          game.world.addStar({ x: boss.x * 0.12 + G.rand(-20, 20), y: boss.y * 0.12 + G.rand(-20, 20), c: [255, 90, 110], kind: "wound", tw: Math.random() * G.TAU });
        }
        G.Voice.say("bossDead", true);
      }
      game.world.boss = null;
      game.world.bossSaid = false;
    },

    applyLaw: function (game, crack) {
      if (!crack || !crack.law) return;
      var law = crack.law;
      var lname = lawName(law);
      var lhint = lawHint(law);
      game.world.active.push({ id: law.id, left: law.lasts || 18, full: law.lasts || 18 });
      game.floaters.add(crack.x, crack.y - 14, LAW_WORD[G.Lang && G.Lang.id === "en" ? "en" : "ru"] + lname, G.TRAIT_COLOR.chaos, 3);
      G.Voice.sayText(lname + ". " + lhint + ".", true);
      if (G.UI && G.UI.law) G.UI.law(lname + " — " + lhint);
      if (law.id === "tideSleep") game.world.tideFrozen = Math.max(game.world.tideFrozen, 32);
      if (law.id === "invert") game.world.invertMove = Math.max(game.world.invertMove, 11);
      if (law.id === "moreAnchors") game.world.anchorCap = Math.min(6, game.world.anchorCap + 1);
    }
  };
})(IGRA);
