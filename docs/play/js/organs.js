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

  // Существо носит имя над головой всю игру — и это была самая заметная
  // кириллица на английском берегу. Имена больше не строки: у существа
  // живут ключи (`nameKey`/`babyKey`), а строка собирается на языке
  // человека в момент отрисовки. Порядок в обеих раскладках один — иначе
  // «Камертон» после смены языка стал бы другим существом.
  var TRUE_NAMES_EN = {
    clingy: ["I Hold On", "Don't Let Go", "Near", "Warmer"],
    shy: ["A Bit Further", "Almost", "Behind the Fog", "Not At Once"],
    curious: ["More", "Where To", "Look", "Past the Edge"],
    wounded: ["It Aches Quietly", "Seam", "Was Yours", "Don't Leave Twice"],
    singer: ["Second Voice", "Beat", "Coincidence", "Tuning Fork"]
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

  var SPEECH_EN = {
    clingy: [
      "don't go far.",
      "i am already used to your warmth.",
      "if you pulse aside, i will think it was me."
    ],
    shy: [
      "could you… be a little quieter.",
      "i come closer when you are not running.",
      "don't stare. look beside me."
    ],
    curious: [
      "out there, behind the fog, nothing is decided yet.",
      "come on. i want to see what this becomes.",
      "you leave tracks. i collect them."
    ],
    wounded: [
      "this is not anger. this is memory.",
      "i was let go once already.",
      "if you strike, i will understand. if you sit down, that too."
    ],
    singer: [
      "hit it once more.",
      "the world coincides when you don't hurry.",
      "i can hold a note while you walk."
    ]
  };

  function speechPool(temper) {
    var en = G.Lang && G.Lang.id === "en";
    var src = en ? SPEECH_EN : SPEECH;
    return src[temper] || src.shy;
  }

  // Имя существа: ключ → строка на языке человека. Старые сейвы хранят
  // готовую строку без ключа — её и показываем, чтобы вернувшийся не
  // потерял того, кого назвал.
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

  // Законы — то, что человек назвал «жёлтенькими молниями». У каждого есть
  // имя, следствие и срок: без срока непонятно, действует ли он ещё.
  var LAWS = [
    { id: "tideSleep", ru: "прилив спит", hint: "забвение не придёт какое-то время", en: "the tide sleeps", enHint: "oblivion will not come for a while", lasts: 32 },
    { id: "woundsSing", ru: "раны поют", hint: "голод становится тоном", en: "wounds sing", enHint: "hunger turns into a tone" },
    { id: "invert", ru: "тяжесть наоборот", hint: "шаг идёт в другую сторону", en: "weight inverted", enHint: "your step goes the other way", lasts: 11 },
    { id: "rename", ru: "имена лгут", hint: "существа меняют лица", en: "names lie", enHint: "beings change their faces" },
    { id: "moreAnchors", ru: "якорей больше", hint: "можно удержать ещё одно", en: "more anchors", enHint: "you can hold one more" },
    { id: "swapKinds", ru: "берег путает органы", hint: "живое меняет природу", en: "the shore confuses organs", enHint: "the living changes its nature" },
    { id: "bloom", ru: "сад без разрешения", hint: "цветы сами", en: "a garden unasked", enHint: "flowers on their own" },
    { id: "reveal", ru: "туман признаётся", hint: "неоформленное вспыхивает", en: "the fog confesses", enHint: "the unformed flares up" }
  ];

  function lawName(law) {
    return G.Lang && G.Lang.id === "en" ? law.en || law.ru : law.ru;
  }

  function lawHint(law) {
    return G.Lang && G.Lang.id === "en" ? law.enHint || law.hint : law.hint;
  }

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

  // Имя раны-босса: тоже ключ. Босс живёт в сейве, и его русское имя
  // пережило бы любую смену языка.
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

  // Стихи узла тишины. Жили в world.js готовыми русскими строками и
  // оседали в сейве — на английском берегу сад читал кириллицу.
  var STILL_VERSE = {
    ru: ["здесь кто-то уже ждал", "пауза имеет форму", "не всё должно двигаться", "я слышу дно"],
    en: ["someone was already waiting here", "a pause has a shape", "not everything must move", "i hear the bottom"]
  };

  // Стих — не строка, а замысел: ось, потеря, существо, номер, берег.
  // Строкой он становится в момент показа, на языке человека. Иначе стих
  // вмерзает в сейв: переключил язык — и сад до конца жизни читает
  // по-русски. Старые сейвы хранят готовые строки — их отдаём как есть.
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

    // Возвращает замысел стиха, а не готовую строку. Существо кладём
    // снимком имени (ключи, а не текст) — сам объект в сейв тянуть нельзя.
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

    // Кубик тот же, что и раньше (G.pick по общему Math.random): поток
    // случайности мира трогать нельзя, иначе сдвигается вся игра.
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
          // Сад — самый громкий рот в игре, и никто этого не считал:
          // замер по источнику показал 154–186 прочитанных вслух стихов
          // за двадцать минут — больше, чем все прочие рты вместе.
          // Причина в `true`: sayText с force обходит все кулдауны, и
          // каждый росток на стоянке немедленно печатал строку поверх
          // предыдущей. Игра тараторила стихами, и в этом шуме тонули
          // прилив, рождение, забвение.
          // Сад пишет столько же — стихи по-прежнему копятся в сигиле, —
          // но вслух читает раз в полторы минуты и в общей очереди,
          // уступая дорогу событиям мира.
          var t = G.now();
          if (t - this._verseSaid > 90) {
            this._verseSaid = t;
            G.Voice.sayText(G.verseText(verse));
          }
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
        nameKey: (Math.random() * 3) | 0
      };
      w.bossSaid = true;
      G.Voice.say("boss", true);
      G.UI.hint(G.bossName(w.boss) + " " + G.Lang.t("bossGathered"));
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
        G.Voice.sayText(G.Lang.t("seamHit"), true);
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
      // осколок носит имя породы, из которой собрался: держим ключ,
      // строка складывается на языке человека
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
      // временные законы держатся в w.active — их видно, пока они живы
      w.laws.push({ id: id, ru: crack.law.ru, en: crack.law.en, t: game.time });
      if (w.laws.length > 8) w.laws.shift();
      if (crack.law.lasts) {
        w.active = w.active || [];
        for (var ai = w.active.length - 1; ai >= 0; ai--) {
          if (w.active[ai].id === id) w.active.splice(ai, 1);
        }
        w.active.push({ id: id, left: crack.law.lasts, full: crack.law.lasts });
      }
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
      var lw = G.Lang && G.Lang.id === "en" ? LAW_WORD.en : LAW_WORD.ru;
      var lname = lawName(crack.law);
      var lhint = lawHint(crack.law);
      game.floaters.add(crack.x, crack.y - 14, lw + lname, G.TRAIT_COLOR.chaos);
      G.Voice.sayText(lname + ". " + lhint + ".", true);
      if (G.UI && G.UI.law) G.UI.law(lname + " — " + lhint);
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
      // Аккорд складывается примерно раз в четверть минуты. Хвалить его
      // каждый раз — значит превратить голос в счётчик очков; пусть
      // звучит сам, а Игра отзывается на него изредка.
      var tc = G.now();
      if (!this._chordSaid || tc - this._chordSaid > 120) {
        this._chordSaid = tc;
        G.Voice.say("music");
      }
      game.floaters.add(p.x, p.y - 30, G.Lang.t("chordWord"), G.TRAIT_COLOR.harmony);
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
        G.UI.hint(G.Lang.t("skyEmpty"));
        setTimeout(function () {
          G.UI.hint("");
        }, 3200);
        return;
      }
      game.sky = on;
      if (on) {
        G.Voice.say("sky");
        G.UI.hint(G.Lang.t("skyTouch"));
      } else {
        G.UI.hint("");
      }
      var btn = document.getElementById("sky-btn");
      if (btn) btn.classList.toggle("lit", on);
    }
  };
})(IGRA);
