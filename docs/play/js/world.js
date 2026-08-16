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

  // Имя породы всплывает над каждым рождением — самая частая надпись в
  // игре, и до сих пор она была только по-русски. G.kindName даёт имя
  // на языке игрока; звать надо её, а не KIND_RU напрямую.
  G.KIND_EN = {
    spark: "spark",
    relic: "relic",
    thorn: "thorn",
    still: "stillness",
    echo: "echo",
    shard: "shard",
    tone: "tone",
    wound: "wound",
    memory: "memory"
  };

  G.kindName = function (kind) {
    if (G.Lang && G.Lang.id === "en") return G.KIND_EN[kind] || kind;
    return G.KIND_RU[kind] || kind;
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
    // Корни. care стекает за ~100 с, а волна приходит каждые 48–80 с —
    // поэтому возврат к узлу раньше ничего не менял: замер показал, что
    // к чему возвращались, выживало 11%, а брошенное — 26%. Забота вредила.
    // Корни не стекают: каждое повторное внимание чуть углубляет узел,
    // и прилив над укоренённым слабеет. Прилив не отменён — он огибает
    // то, во что вложились.
    this.roots = 0;
    this.cooled = 0;
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
    // имя-ключ, а не строка: см. G.beingName. Настоящий ключ ставит
    // G.Organs.birthBeing; здесь — запасной, без обращения к случайности
    // (лишний бросок кубика сдвинул бы весь поток мира).
    this.babyKey = 0;
    this.name = "";
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
    this.tideT = 70 + this.rng.range(16, 36);
    this.bounds = 2200;
    this.biome = "void";
    this.weather = 0;
    this.discovered = 0;
    this.lost = 0;
    // унесённое метаморфозой — это не забвение, а смена кожи. Считаем отдельно,
    // иначе весы прилива врут и не видно, окупается ли забота.
    this.carried = 0;
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
    this.active = [];
    this.toneChain = [];
    // зов: у берега всегда есть тяга вдаль
    this.call = null;
    this.callT = 12;
    this.arrived = 0;
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

  // Целимся по КРАЮ узла, а не по центру. Узлы разного размера: гнездо
  // r=18 и малёк r=11 при общем радиусе попадания ловились одинаково,
  // то есть мелкий требовал попасть на 7 единиц точнее — человек и
  // говорил, что «мелкие особенно не выходит обвести». Меряем от края:
  // тогда каждый узел одинаково щедр к пальцу.
  G.World.prototype.nearestNode = function (x, y, max) {
    var best = null;
    var bestD = 1e9;
    for (var i = 0; i < this.nodes.length; i++) {
      var n = this.nodes[i];
      if (n.dead || n.state === "gone") continue;
      var d = Math.sqrt(G.dist2(x, y, n.x, n.y)) - (n.r || 12);
      if (d < max && d < bestD) {
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
      node.verse = G.Organs.stillVerse();
      this.addVerse(node.verse);
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
    // Небо — память, а не свалка. За полчаса игры сюда набегало 565 звёзд
    // (100 КБ сейва и каша на экране). Держим последние 160: старое
    // забвение гаснет, недавнее горит. Это честно — память тоже редеет.
    if (this.stars.length > 160) this.stars.splice(0, this.stars.length - 160);
    // Уход слышно. Раньше узел тонул молча — единственное крупное
    // событие мира без голоса. Два исхода звучат по-разному: рана —
    // низкий скрежет (голос wound был написан, но его никто не звал),
    // тихий уход — падающая нота породы.
    if (G.Audio) {
      if (asWound && G.Audio.wound) G.Audio.wound();
      else if (G.Audio.forget) G.Audio.forget(G.KIND_TRAIT[node.kind]);
    }
    this.forgotten.push({ kind: node.kind, x: node.x, y: node.y, c: node.color() });
    if (this.forgotten.length > 24) this.forgotten.shift();
    if (asWound) {
      this.wounds.push(new G.Wound(node.x, node.y, node.kind));
      return "wound";
    }
    return "star";
  };

  // Существо, которое ждало и не дождалось. Двойник forget() для живого:
  // узел, брошенный под приливом, уходит звездой или встаёт раной — и с
  // тем, кто к тебе привязался, должно быть то же самое, иначе
  // привязанность ничего не стоит.
  // Исход решает не случай, а то, каким ты был. Злой берег (агрессия
  // выражена) отпускает голодным — существо встаёт раной и идёт за тобой.
  // Тихий отпускает светом: оно уходит на небо, и долг оплачен. Это
  // «редкая милость» из реплики, написанной задолго до этого органа.
  G.World.prototype.abandon = function (being, dna) {
    if (being.dead) return "none";
    being.dead = true;
    var bitter = dna && dna.get("aggression") > 0.28;
    if (bitter && this.rng.chance(0.5)) {
      var u = new G.Wound(being.x, being.y, being.hue || "spark");
      u.hp = 2;
      this.wounds.push(u);
      if (G.Audio && G.Audio.wound) G.Audio.wound();
      if (G.Voice) G.Voice.say("debtWound");
      return "wound";
    }
    this.stars.push({
      x: being.x * 0.15,
      y: being.y * 0.15,
      c: (G.TRAIT_COLOR && G.TRAIT_COLOR[being.hue]) || [200, 210, 255],
      kind: being.hue || "spark",
      tw: Math.random() * G.TAU,
      ox: being.x,
      oy: being.y,
      // звезда носит имя того, кто ушёл, — ключом, чтобы небо говорило
      // на языке человека, а не на том, что был включён в час утраты
      verse: { who: { named: true, nameKey: being.nameKey, babyKey: being.babyKey, healed: being.healed, name: being.trueName || being.name || "" } }
    });
    if (this.stars.length > 160) this.stars.splice(0, this.stars.length - 160);
    if (G.Audio && G.Audio.forget) G.Audio.forget("empathy");
    if (G.Voice) G.Voice.say("debtStar");
    return "star";
  };

  // Один вход для стихов: сигила читает три последних, а сейв не должен
  // пухнуть. За полчаса набегало 600 строк — держим 60.
  G.World.prototype.addVerse = function (verse) {
    if (!verse) return;
    this.verses.push(verse);
    if (this.verses.length > 60) this.verses.splice(0, this.verses.length - 60);
  };

  G.World.prototype.update = function (dt, player, dna, fx, game) {
    this.age += dt;
    this.updateCall(dt, player, dna, game);
    if (this.tideFrozen > 0) this.tideFrozen -= dt;
    if (this.invertMove > 0) this.invertMove -= dt;
    // действующие законы тикают вслух: человек видит, сколько мир ещё такой
    if (this.active && this.active.length) {
      for (var la = this.active.length - 1; la >= 0; la--) {
        this.active[la].left -= dt;
        if (this.active[la].left <= 0) {
          var gone = this.active[la];
          this.active.splice(la, 1);
          if (G.Voice && G.lawEnded) G.Voice.sayText(G.lawEnded(gone.id), false);
        }
      }
    }
    var tideMul = (G.Memory && G.Memory.climate) ? G.Memory.climate().tide : 1;
    if (this.age < 75) {
      /* first shore is allowed to exist */
    } else {
      this.tideT -= this.tideFrozen > 0 ? 0 : dt * tideMul;
    }
    if (this.tideT <= 0 && this.tide <= 0 && this.tideFrozen <= 0 && this.age >= 75) {
      this.tide = 0.01;
      this.tideT = 48 + this.rng.range(8, 32);
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
      n.care = Math.max(0, n.care - dt * (this.age < 90 ? 0.010 : 0.017));
      if (n.state === "crystallizing") {
        n.growth += dt * 0.55;
        if (n.growth >= 1) n.growth = 1;
      }
      // Внимание лечит. Раньше hp только убывал и не заживал никогда:
      // одна волна снимала 1.02 при hp=1 — узел умирал с первого прилива,
      // и человек терял 87% выращенного, даже возвращаясь к нему. Теперь
      // согретый узел затягивает раны в затишье между волнами.
      // Заживление привязано к вниманию, а не к корням. Раньше корни
      // давали +0.10 hp/с: укоренённый узел затягивал раны быстрее, чем
      // прилив их наносил (0.26 hp за волну против 0.12 hp/с в затишье),
      // и переставал умирать вовсе — забвение обнулилось, прилив стал
      // декорацией. Корни держат удар, но не воскрешают.
      if (this.tide <= 0 && n.state === "alive" && n.care >= 0.28 && n.hp < 1) {
        n.hp = Math.min(1, n.hp + dt * (0.02 + n.roots * 0.06));
      }
      // Корни растут не от рождения, а от возвращения. Кристаллизация
      // ставит care = 1, поэтому «греется» любой новорождённый узел —
      // первая версия раздала корни всем подряд (216 из 217) и погасила
      // прилив. Растим только тогда, когда человек согрел уже остывший
      // узел: care поднялся заново после того, как успел упасть.
      if (n.state === "alive" && n.care > 0.62) {
        if (n.cooled) {
          // Возвращение — событие, а не удержание. Плавный рост требовал
          // 20 с непрерывного тепла, и корни почти не появлялись. Теперь
          // один возврат к остывшему узлу углубляет его сразу на треть:
          // три возвращения — и он держится против прилива сам.
          var was = n.roots;
          n.roots = Math.min(1, n.roots + 0.34);
          // Счётчик возвращений. Пока он только память для замеров: см.
          // долг в HANDOFF — попытка переносить по нему узлы через
          // перерождение чинит одно и ломает другое.
          n.returns = (n.returns || 0) + 1;
          if (G.Report) G.Report.act("returns");
          n.cooled = 0;
          // поступок: человек вернулся к остывшему. Director считает это
          // как черту характера, а не как состояние узла.
          if (G.Director) G.Director._returns++;
          if (fx) fx.ring(n.x, n.y, 12, n.color(), n.r + 6, 0.5);
          // Игра замечает вслух только настоящее укоренение — когда узел
          // начал держаться сам. Не на каждое касание: она не суетлива.
          // Укоренение объявляется ОДИН раз на узел. Корни дребезжат у
          // порога: тают до 0.6 и отрастают снова — замер поймал 29
          // объявлений на 24 узла, один узел «укоренялся» трижды.
          // Правило то же, что у пород: узнавание бывает один раз.
          if (was < 0.6 && n.roots >= 0.6 && !n.rootTold) {
            n.rootTold = 1;
            // Звук — на каждый узел: это ответ на твой жест, он должен
            // быть всегда. Слова — реже. Укореняется по десятку узлов за
            // сессию, и «оно держится само» двенадцать раз подряд
            // превращает открытие в уведомление. Раз в две минуты.
            if (this.age - (this._rootSaid || -999) > 120) {
              this._rootSaid = this.age;
              G.Voice.say("rooted");
            }
            if (G.Audio && G.Audio.rooted) G.Audio.rooted(G.KIND_TRAIT[n.kind]);
          }
        }
      } else if (n.state === "alive" && n.care < 0.55) {
        // Проверка `state === "alive"` тут не украшение, а вся суть.
        // Без неё «остывал» и НЕОФОРМЛЕННЫЙ узел: он рождается с
        // care = 0.4, то есть ниже порога, и получал `cooled = 1` ещё
        // до того, как стал чем-либо. Кристаллизация ставит care = 1 —
        // и код честно засчитывал это как «человек вернулся к
        // остывшему», выдавая +0.34 корней КАЖДОМУ новорождённому.
        // Замер: 212 скачков корней у того, кто ни разу ни к кому не
        // возвращался. Корни росли от рождения, а не от возвращения, —
        // ровно то, что этот орган был написан не делать.
        // Корни сохнут без внимания. Раньше они не таяли никогда: узел,
        // которого один раз согрели и бросили, навсегда оставался
        // бронированным (roots 0.34 → волна снимала 0.83 вместо 1.0), и
        // прилив переставал забирать вообще. Забота — не разовая покупка.
        // Сохнут медленно — вдесятеро медленнее, чем растут. При 0.016/с
        // корни истлевали дотла за минуту: садовник возвращался и лишь
        // восполнял потерю, никогда не переваливая 0.34. Привычка должна
        // накапливаться, иначе третий приход ничем не отличается от
        // первого.
        // 0.003, а не 0.006: полный распад ~5.5 минуты вместо трёх.
        // Прежнее число подбиралось в мире, где корни 0.34 доставались
        // КАЖДОМУ узлу даром (см. про `cooled` выше) — сохнуть быстро
        // было необходимо, иначе бронированным становился весь берег.
        // Когда корни стали доставаться только за возвращение, быстрое
        // высыхание начало съедать саму награду: узел с тремя приходами
        // терял щит за 110 с, до следующего перерождения. Прилива это не
        // касается вовсе (24% у сеятеля при любом из значений) — только
        // того, окупается ли забота: 30% при 0.004, 37% при 0.003.
        if (n.roots > 0 && n.care < 0.28) n.roots = Math.max(0, n.roots - dt * 0.003);
        // Узел считается остывшим задолго до того, как прилив станет ему
        // опасен (порог забвения — 0.28). Иначе «возвращение» почти
        // никогда не засчитывалось: человек греет то, что на глаз
        // потускнело, а не то, что уже при смерти.
        // Первый остывший узел Игра показывает вслух — один раз за
        // сессию. Человек в первом отчёте ответил «возвращаться было
        // зачем? — не понял», и он прав: узел тускнеет до порога возврата
        // 45 секунд, а он играл 78 и вырастил девять штук. Смысл
        // возвращения ему просто негде было увидеть — тускнение на глаз
        // почти незаметно (свечение меняется на 0.05). Теперь берег
        // называет момент, когда возвращение впервые обретает смысл.
        if (!n.cooled && !this._coolTold && G.Voice) {
          this._coolTold = 1;
          G.Voice.say("cooling");
          if (fx) fx.ring(n.x, n.y, 14, n.color(), n.r + 10, 0.45);
        }
        n.cooled = 1;
      }
      if (this.tide > 0.35 && n.state === "alive" && n.care < 0.28 && this.anchors.indexOf(n.id) < 0) {
        // Волна не гильотина: за один прилив уходит ~0.63 hp, значит
        // забытое умирает со второй волны. Между ними — окно, чтобы
        // вернуться. Прилив по-прежнему забирает, но даёт себя услышать.
        // Корни ослабляют волну вдвое, а не впятеро. При множителе 0.8
        // глубоко укоренённый узел получал 0.09 hp/с и переживал
        // одиннадцать приливов — то есть никогда не тонул.
        // Одна волна должна топить по-настоящему брошенное. При 0.46 она
        // снимала 0.86 hp — чуть меньше смертельного, и узлу требовались
        // две волны. Но волны идут раз в ~87 с, а метаморфоза приходит
        // каждые ~165 с и уносит недотопленное: за десять минут игры
        // прилив не забирал НИ ОДНОГО узла, оставаясь декорацией.
        // Теперь: брошенное без корней тонет с первой волны, укоренённое
        // держится (0.34 → переживает две, 0.68 → три).
        // Силу волны не трогать без замера: у неё резкий порог. Ниже
        // 0.55 волна перестаёт добивать за отведённое время, и забвение
        // обнуляется целиком — 0.52 даёт ровно 0% потерь, прилив
        // становится декорацией. 0.55 и 0.58 дают 24%. Число живёт на
        // краю обрыва, а не на пологом склоне.
        n.hp -= dt * 0.58 * (1 - n.roots * 0.5);
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
      // Спутник: привязанное существо физически не могло угнаться за
      // игроком (48 против ~85) — привязанность была видна только на
      // стоянке. Отставший спутник прибавляет шаг, но догоняет не мгновенно:
      // видно, как он спешит.
      var companion = b.bond > 0.55 && b.fear < 0.5;
      if (companion && d > 100) {
        spd = 58 + Math.min(80, (d - 100) * 0.7) + b.bond * 30;
        b.hurry = Math.min(1, (b.hurry || 0) + dt * 1.6);
      } else {
        b.hurry = Math.max(0, (b.hurry || 0) - dt * 1.2);
      }
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
      // но преданность сильнее характера: отставший спутник идёт следом,
      // даже если он застенчивый. Рядом — снова становится собой.
      if (companion && d > 110) {
        var pull = Math.min(1, 0.8 + (d - 110) / 200);
        if (want < pull) want = pull;
      }
      b.vx = G.lerp(b.vx, (dx / d) * spd * want, 1 - Math.pow(0.08, dt));
      b.vy = G.lerp(b.vy, (dy / d) * spd * want, 1 - Math.pow(0.08, dt));
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (d < 56) {
        var was = b.bond;
        b.bond = Math.min(1, b.bond + dt * 0.1);
        b.fear = Math.max(0, b.fear - dt * 0.1);
        b.debt = Math.max(0, (b.debt || 0) - dt * 0.08);
        // порог спутника пройден — Игра называет это вслух, один раз
        if (was <= 0.55 && b.bond > 0.55 && !b.saidCompanion) {
          b.saidCompanion = true;
          if (G.Voice) G.Voice.sayText(G.companionLine(b), true);
        }
      } else if (b.bond > 0.3 && !b.isYesterday) {
        // Долг памяти. Он копился здесь с самого начала, сохранялся между
        // сессиями, у него были написаны две реплики на двух языках — и
        // ни одного исхода в коде. Существо могло голодать вечно и ничего
        // с ним не случалось: замер показал пик долга 0.08 при пороге 1.2,
        // потому что порога никто не проверял.
        // Долг растёт только у того, кто успел привязаться (bond > 0.3):
        // чужому нечего терять.
        // Первая версия ускоряла голод пропорционально привязанности —
        // и замер сразу показал знакомую беду: тот, кто возвращался к
        // существам, терял их ЧАЩЕ брошенного берега (4 раны против 1).
        // Ровно ловушка «забота наказуема», которую чинили в 0.4.39.
        // Перевёрнуто: крепкая связь — это запас терпения. Кого ты
        // действительно приручил, тот ждёт дольше; едва знакомый уходит
        // первым.
        // 0.021, а не 0.015. Долг зреет только в НЕПРЕРЫВНОЙ разлуке, а
        // гаснет вчетверо быстрее, чем растёт (0.08/с рядом): любой
        // случайный проход мимо обнулял накопленное. При 0.015 до порога
        // требовалось 80 с у едва знакомого и 200 с у преданного — то
        // есть привязанность спасала от исхода вернее, чем забота, а
        // самые любимые не уходили никогда. Замер это и показал: пик
        // долга 1.05 при пороге 1.2 — орган дозревал почти, но не совсем.
        b.debt = (b.debt || 0) + dt * 0.021 * (1.4 - b.bond);
        if (b.debt > 1.2) this.abandon(b, dna);
      }
    }

    // счётчик кусающих обнуляется каждый кадр: боль делится между теми,
    // кто вправду достал до человека сейчас
    this._biters = 0;
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
      // Рана медленнее игрока, а была БЫСТРЕЕ: разгонялась до 86 при
      // пределе игрока 83. Убежать нельзя в принципе — она догоняет и
      // висит. Отчёт: 4349 силы съедено ранами против 581 взглядом, то
      // есть 67% всей игры человек провёл под касанием. «Нет сил ×95»
      // из 113 срывов — это оно. Голод должен гнать, а не приковывать.
      var wspd = 40 + Math.min(24, u.age * 1.4);
      u.vx = G.lerp(u.vx, (wx / wd) * wspd, 1 - Math.pow(0.12, dt));
      u.vy = G.lerp(u.vy, (wy / wd) * wspd, 1 - Math.pow(0.12, dt));
      u.x += u.vx * dt;
      u.y += u.vy * dt;
      // Рана не бессмертна. Голод, который нельзя пережить, — не голод,
      // а налог: раны копились всю сессию, потому что умереть сами не
      // могли (hp 3, только удар). Полторы минуты — и рана истлевает,
      // если её не кормить вниманием.
      if (u.age > 95) {
        u.dead = true;
        if (G.Audio && G.Audio.forget) G.Audio.forget(u.from || "spark");
        continue;
      }
      if (wd < player.r + u.r) {
        // Кусает СТАЯ, а платит человек как за одну.
        //
        // Каждая рана ела 22/с независимо: полторы разом — уже 33/с
        // против восстановления 7-14, шесть — 132/с, и энергия
        // обнулялась за секунду. Отчёт: раны съели 3426 силы за 108
        // секунд игры, то есть больше, чем длилась сессия. Взгляд
        // умирал не от одной раны, а от их числа — а число человек
        // не контролирует, они рождаются сами.
        //
        // Укус первой остаётся прежним (22/с — он должен гнать с места),
        // но стая не умножает боль без предела: каждая следующая кусает
        // вдвое слабее предыдущей. Шесть ран дают 43/с вместо 132 —
        // больно, но энергия успевает возвращаться.
        this._biters = (this._biters || 0) + 1;
        var bite = 22 * Math.pow(0.5, this._biters - 1);
        player.energy = Math.max(0, player.energy - bite * dt);
        if (G.Report) { G.Report.noteDrain("wound", bite * dt); G.Report.noteEnergy(player.energy); }
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
    var cap = Math.min(28, 8 + dna.get("curiosity") * 16 * spawnMul + this.meta * 2);
    if (this.nodes.length < cap) {
      if (G.chance(dt * (0.15 + dna.get("curiosity") * 0.35) * spawnMul)) {
        var ang = this.rng.range(0, G.TAU);
        var dist = 340 + this.rng.range(0, 520 + dna.get("curiosity") * 400);
        this.spawnNode(player.x + Math.cos(ang) * dist, player.y + Math.sin(ang) * dist, "spark");
      }
    }
  };

  // Зов: далёкая точка, которая всегда тянет вдаль. Не квест и не маркер
  // задания — обещание берега, что путь не кончается. Приход награждает
  // рождением уголка мира под доминантную ось.
  var CALL_TEXT = {
    ru: {
      curiosity: "там что-то не названо",
      aggression: "там что-то сопротивляется",
      contemplation: "там тише, чем здесь",
      empathy: "там кто-то один",
      chaos: "там край порвался",
      harmony: "там держат ноту"
    },
    en: {
      curiosity: "something unnamed is there",
      aggression: "something resists over there",
      contemplation: "it is quieter there than here",
      empathy: "someone is alone there",
      chaos: "the edge tore over there",
      harmony: "a note is being held there"
    }
  };

  var CALL_OPEN = {
    ru: "что-то зовёт с той стороны. иди на свет.",
    en: "something calls from over there. walk to the light."
  };

  var CALL_ARRIVE = {
    ru: [
      "ты дошёл. здесь начинается то, чего не было.",
      "путь был настоящий. смотри, что он вырастил.",
      "берег отдал за дорогу. это честная плата."
    ],
    en: [
      "you arrived. what was not here begins here.",
      "the path was real. look what it grew.",
      "the shore paid for the walk. that is a fair price."
    ]
  };

  var CALL_MARK = { ru: "дошёл", en: "arrived" };

  function lang() {
    return G.Lang && G.Lang.id === "en" ? "en" : "ru";
  }

  G.callText = function (trait) {
    var t = CALL_TEXT[lang()];
    return t[trait] || t.curiosity;
  };

  var COMPANION = {
    ru: [
      "оно пошло за тобой. не потому что должно.",
      "теперь вас двое. это меняет вес шага.",
      "у тебя спутник. он не спросит, куда."
    ],
    en: [
      "it followed you. not because it must.",
      "now you are two. that changes the weight of a step.",
      "you have a companion. it will not ask where."
    ]
  };

  var companionSaid = 0;
  G.companionLine = function () {
    var arr = COMPANION[lang()];
    return arr[companionSaid++ % arr.length];
  };

  // закон кончился — берег возвращается к себе, и это слышно
  var LAW_END = {
    ru: {
      tideSleep: "прилив проснулся.",
      invert: "тяжесть вернулась на место.",
      _: "закон отпустил."
    },
    en: {
      tideSleep: "the tide woke up.",
      invert: "weight is back in place.",
      _: "the law let go."
    }
  };

  G.lawEnded = function (id) {
    var m = LAW_END[lang()];
    return m[id] || m._;
  };

  G.World.prototype.makeCall = function (player, dna) {
    var trait = dna ? dna.dominant() : "curiosity";
    var a = this.rng.range(0, G.TAU);
    var d = 900 + this.rng.range(0, 700);
    var lim = this.bounds - 200;
    var x = G.clamp(player.x + Math.cos(a) * d, -lim, lim);
    var y = G.clamp(player.y + Math.sin(a) * d, -lim, lim);
    this.call = {
      x: x,
      y: y,
      trait: trait,
      phase: this.rng.range(0, G.TAU),
      born: this.age,
      said: false
    };
    return this.call;
  };

  G.World.prototype.updateCall = function (dt, player, dna, game) {
    if (this.age < 30) return;
    if (!this.call) {
      this.callT -= dt;
      if (this.callT > 0) return;
      this.callT = 0;
      this.makeCall(player, dna);
      if (G.Voice) G.Voice.sayText(CALL_OPEN[lang()], true);
      return;
    }
    var c = this.call;
    c.phase += dt * 0.9;
    var d = G.dist(player.x, player.y, c.x, c.y);
    if (!c.said && d < 620) {
      c.said = true;
      if (G.Voice) G.Voice.sayText(G.callText(c.trait) + ".", true);
    }
    if (d < 120) {
      this.arrive(player, dna, game);
    }
  };

  G.World.prototype.arrive = function (player, dna, game) {
    var c = this.call;
    if (!c) return;
    this.call = null;
    this.arrived++;
    if (G.Report) { G.Report.act("calls"); G.Report.noteCall(); }
    this.callT = 22 + this.rng.range(0, 20);
    var col = G.TRAIT_COLOR[c.trait] || [200, 220, 255];

    // берег отвечает на приход: рождается гнездо своей природы
    var kindByTrait = {
      curiosity: "relic",
      aggression: "thorn",
      contemplation: "still",
      empathy: "echo",
      chaos: "shard",
      harmony: "tone"
    };
    var kind = kindByTrait[c.trait] || "relic";
    for (var i = 0; i < 5; i++) {
      var a = (i / 5) * G.TAU + this.rng.range(0, 1);
      var n = this.spawnNode(c.x + Math.cos(a) * (70 + this.rng.range(0, 90)), c.y + Math.sin(a) * (70 + this.rng.range(0, 90)), "spark");
      n.hint = kind;
      n.r = 17 + this.rng.range(0, 8);
    }
    this.scatter(c.x, c.y, 4, 320);
    if (dna) dna.feed(c.trait, 0.05);
    if (game) {
      game.fx.ring(c.x, c.y, 34, col, 40, 1.1);
      game.fx.burst(c.x, c.y, 30, col, 130, 1);
      game.floaters.add(c.x, c.y - 26, CALL_MARK[lang()], col);
      G.Shake.add(6);
      if (G.Haptic) G.Haptic.play("crystal");
    }
    G.Audio.chord([G.TRAIT_NOTE[c.trait] || 440, (G.TRAIT_NOTE[c.trait] || 440) * 1.5], 1.2, 0.05);
    var LINES = CALL_ARRIVE[lang()];
    if (G.Voice) G.Voice.sayText(LINES[this.arrived % LINES.length], true);
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
          // «исцелённое» — не собственное имя, а состояние: держим
          // флагом, строка собирается на языке человека
          b2.healed = true;
          b2.nameKey = null;
          b2.name = "";
          b2.trueName = "";
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
    if (G.Report) G.Report.act("anchors");
    return true;
  };

  G.World.prototype.metamorphose = function (player, dna) {
    this.meta++;
    this.biome = dna.dominant();
    // Якорь ставится самым дорогим жестом — долгим неподвижным взглядом.
    // Раньше keep всегда оставался пустым, и перерождение стирало сад
    // подчистую вместе с якорями, а список anchors повисал на мёртвых id.
    // Теперь удержанное переходит в новый мир: метаморфоза — смена кожи,
    // а не амнезия. Просто согретое (care > 0.55) по-прежнему уходит в небо.
    var keep = [];
    for (var i = 0; i < this.nodes.length; i++) {
      var n = this.nodes[i];
      if (n.state !== "alive") continue;
      // Глубоко укоренённое переходит само, без якоря. Иначе забота не
      // окупалась вовсе: узлы, к которым человек возвращался трижды и
      // больше, доживали до перерождения — и метаморфоза уносила ВСЕ
      // до одного (12 из 12 в замере), а брошенные, умершие раньше,
      // «выживали» в статистике. Якорь — воля, корни — привычка;
      // мир помнит и то, и другое.
      // Порог 0.45, а не 0.6. Два возвращения дают ровно 0.68 — и это
      // тает до 0.6 всего за 27 секунд забвения, а перерождение приходит
      // раз в три минуты. То есть узел, к которому вернулись дважды,
      // почти всегда встречал смену кожи уже ниже порога: замер показал
      // 2% выживших при двух возвратах и 0% при трёх, тогда как при
      // пяти — 100%. Награда испарялась быстрее, чем наступал момент,
      // ради которого её давали. При 0.45 два возврата держатся около
      // полутора минут — этого хватает, чтобы обещание сбылось.
      // ПЕРВАЯ смена кожи щадит. Отчёт с телефона: «выращено 15, живых
      // 1» — человек три минуты растил сад, и его стёрло целиком, ещё до
      // того как он понял правила. Тут порочный круг: чтобы сад пережил
      // перерождение, нужны корни; чтобы захотеть возвращаться, нужно
      // увидеть, что возвращение окупается; чтобы увидеть — нужен сад,
      // который дожил. На укоренение одного узла нужно 90 секунд, первая
      // мета приходит на 190-й — и уносит всё. Первое, что человек
      // узнавал о мире: труд бессмыслен.
      //
      // Поэтому на первом перерождении переживает и просто СОГРЕТОЕ
      // (care > 0.4) — то, чего человек касался недавно. Дальше закон
      // прежний и суровый: держится только укоренённое и удержанное.
      // Один раз мир прощает незнание — не больше.
      var mercy = this.meta === 1 && n.care > 0.4;
      if (this.anchors.indexOf(n.id) >= 0 || n.roots >= 0.45 || mercy) {
        n.x *= 0.15;
        n.y *= 0.15;
        n.hp = 1;
        keep.push(n);
        continue;
      }
      // Всё, что человек вырастил, оставляет след. Раньше в небо шло
      // только согретое (care > 0.55), а остальные полторы сотни узлов
      // исчезали молча — ни звезды, ни счёта. Теперь новый мир помнит
      // весь прежний сад: согретое горит ярче, остальное — тише.
      this.stars.push({
        x: n.x * 0.12,
        y: n.y * 0.12,
        c: n.color(),
        kind: n.kind,
        tw: Math.random() * G.TAU,
        faint: n.care > 0.55 ? 0 : 1
      });
      this.carried++;
    }
    if (this.stars.length > 160) this.stars.splice(0, this.stars.length - 160);
    // якоря без узлов — мусор в сейве
    var kept = keep.map(function (k) { return k.id; });
    this.anchors = this.anchors.filter(function (id) { return kept.indexOf(id) >= 0; });
    var loyal = [];
    for (var bi = 0; bi < this.beings.length; bi++) {
      if (this.beings[bi].bond > 0.55) loyal.push(this.beings[bi]);
    }
    this.wounds = [];
    this.cracks = [];
    this.boss = null;
    this.bossSaid = false;
    player.x *= 0.15;
    player.y *= 0.15;
    player.vx = 0;
    player.vy = 0;
    this.scatter(player.x, player.y, 10 + this.meta * 2, 360);
    // birthShore обнуляет this.nodes — если позвать его после того, как
    // мы положили туда keep, всё удержанное молча исчезает, а список
    // anchors повисает на мёртвых id. Якорь — самый дорогой жест в игре
    // (долгий неподвижный взгляд), и он не должен ничего не значить.
    // Поэтому: сначала новый берег, потом возвращаем удержанное.
    this.birthShore(player, dna);
    for (var ki = 0; ki < keep.length; ki++) this.nodes.push(keep[ki]);
    for (var li = 0; li < loyal.length; li++) {
      loyal[li].x = player.x + G.rand(-40, 40);
      loyal[li].y = player.y + G.rand(-40, 40);
      this.beings.push(loyal[li]);
    }
    this.tide = 0;
    this.tideT = 36;
    // после метаморфозы зов рождается заново: новый мир — новая даль
    this.call = null;
    this.callT = 16;
  };

  G.World.prototype.toJSON = function () {
    return {
      age: this.age,
      meta: this.meta,
      biome: this.biome,
      discovered: this.discovered,
      lost: this.lost,
      carried: this.carried,
      killed: this.killed,
      saved: this.saved,
      verses: this.verses,
      stars: this.stars,
      anchors: this.anchors,
      call: this.call,
      callT: this.callT,
      arrived: this.arrived,
      // фаза прилива тоже память: иначе перезапуск приложения каждый раз
      // откатывал отсчёт к стартовым ~98 с, и человек, играющий короткими
      // сессиями, почти не видел прилив вовсе.
      tide: this.tide,
      tideT: this.tideT,
      nodes: this.nodes.map(function (n) {
        return {
          id: n.id,
          x: n.x,
          y: n.y,
          kind: n.kind,
          state: n.state,
          care: n.care,
          // корни, раны и возраст раньше не сохранялись: раненый узел
          // воскресал целым, а вложенное внимание обнулялось при выходе
          roots: n.roots,
          returns: n.returns,
          // «уже объявляли» тоже память: без этого укоренённый узел
          // здоровался заново после каждого возвращения в игру
          rootTold: n.rootTold ? 1 : 0,
          cooled: n.cooled,
          hp: n.hp,
          age: n.age,
          growth: n.growth,
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
          // имена существ живут ключами — иначе сад, названный
          // по-русски, останется русским после смены языка
          nameKey: b.nameKey,
          babyKey: b.babyKey,
          healed: b.healed,
          shardOf: b.shardOf,
          named: b.named,
          debt: b.debt,
          isYesterday: !!b.isYesterday
        };
      }),
      blooms: this.blooms,
      forgotten: this.forgotten,
      anchorCap: this.anchorCap,
      laws: this.laws,
      active: this.active,
      tideFrozen: this.tideFrozen,
      invertMove: this.invertMove
    };
  };
})(IGRA);
