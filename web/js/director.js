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
    _nameHinted: false,
    _regazeHinted: false,
    _frontierT: 0,
    _frontierSaid: -999,
    _watchT: 0,
    _lastWatch: -999,
    _sitSaid: -999,
    _idleSaid: -999,
    _wanderSaid: -999,
    _greeted: null,
    // Поступки, а не состояние мира. Доля укоренённых узлов характер не
    // выдаёт: корни — условие выживания, к концу сессии они есть почти у
    // всех уцелевших, и сеятель выглядит садовником. Считаем то, что
    // человек делает руками: сколько раз родил новое и сколько раз
    // вернулся к старому.
    _born: 0,
    _returns: 0,

    reset: function () {
      this.acc = {};
      this.lastEvent = 0;
      this.lastTraitLine = 0;
      this.lastMeta = 0;
      this.organs = { map: 0, combat: 0, garden: 0, social: 0, glitch: 0, music: 0 };
      this.events = [];
      this.named = false;
      this._nameHinted = false;
      this._regazeHinted = false;
      this._frontierT = 0;
      this._frontierSaid = -999;
      this._watchT = 0;
      this._lastWatch = -999;
      this._sitSaid = -999;
      this._idleSaid = -999;
      this._wanderSaid = -999;
      this._greeted = {};
      this._born = 0;
      this._returns = 0;
      this._pulseTold = false;
    },

    note: function (kind, amt) {
      this.acc[kind] = (this.acc[kind] || 0) + (amt || 1);
    },

    // Что Игра видит в человеке прямо сейчас. Возвращает ключ реплики
    // или null, если повадка не отчётлива — тогда Игра молчит. Порядок
    // важен: сверху то, что реже и потому дороже.
    read: function (game) {
      var w = game.world;
      var dna = game.dna;
      var p = game.player;
      var acts = this._born + this._returns;
      var alive = 0, unformed = 0;
      for (var i = 0; i < w.nodes.length; i++) {
        var n = w.nodes[i];
        if (n.dead) continue;
        if (n.state === "unformed") { unformed++; continue; }
        if (n.state === "alive") alive++;
      }

      // Садовник: больше половины поступков — возвращения к своему.
      if (acts >= 10 && this._returns / acts > 0.5) return "watchRooted";
      // Сеятель: почти всё время рождает новое и почти не возвращается.
      if (acts >= 14 && this._returns / acts < 0.15) return "watchScatter";
      // Ни одного якоря за долгую игру — ничего не удержал.
      if (dna.age > 240 && w.anchors.length === 0 && alive >= 5) return "watchNoAnchor";
      // Сидит на месте, хотя вокруг уже нечего рождать.
      if (p.stillT > 20 && unformed < 2) return "watchStill";
      // Существо привязалось — играет не один.
      for (var b = 0; b < w.beings.length; b++) {
        if (w.beings[b].bond > 0.6) return "watchTogether";
      }
      return null;
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

      // Смена сезона объявлялась жёсткой строкой (sayText с хардкодом) и
      // обходила пул `season`, который от этого молчал всю жизнь — мёртвый
      // код, обещавший голос. Теперь говорит пул, а имя сезона остаётся на
      // экране: его рисует paintSeason (сезон «…» под сигилой), и оно же
      // ложится в память строкой seasonNote. Голос не должен дублировать
      // то, что и так видно, — он говорит о следствии: органы растут иначе.
      if (G.Memory.setFromDna(dna) && dna.age > 40) {
        G.Voice.say("season", true);
        G.Memory.note(G.Lang.t("seasonNote") + " " + G.Memory.climateName());
        G.UI.paintSeason();
      }

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

      // unnamed being nearby: teach the gaze-gift once
      if (!this._nameHinted) {
        for (var bi = 0; bi < game.world.beings.length; bi++) {
          var nearBeing = game.world.beings[bi];
          if (!nearBeing.dead && !nearBeing.named && G.dist(p.x, p.y, nearBeing.x, nearBeing.y) < 150) {
            this._nameHinted = true;
            G.Voice.say("nameHint", true);
            break;
          }
        }
      }

      // живой фронтир: рядом всегда должно мерцать, иначе берег кончается
      this._frontierT += dt;
      if (this._frontierT > 3 && game.state === "play" && !game.sky) {
        this._frontierT = 0;
        var nearUnformed = 0;
        for (var fi = 0; fi < game.world.nodes.length; fi++) {
          var fn = game.world.nodes[fi];
          if (!fn.dead && fn.state === "unformed" && G.dist(p.x, p.y, fn.x, fn.y) < 560) nearUnformed++;
        }
        if (nearUnformed < 3) {
          game.world.scatter(p.x, p.y, 3, 430);
          // Мир досыпается молча. Раньше здесь стоял force: true — он
          // обходил антиспам, и за 10 минут «иди дальше» звучало 18 раз
          // из 27 реплик. Игра не погоняет, она замечает. Голос подаётся
          // редко и только если человек давно ничего не слышал.
          if (t - this._frontierSaid > 150 && G.chance(0.5)) {
            this._frontierSaid = t;
            G.Voice.say("frontier");
          }
        }
      }

      // Голос породы. Кулдаун был 42 с, и доминирующая черта почти не
      // меняется — за сессию «curiosity» звучало 10–14 раз, больше всех
      // прочих реплик. Игра называет твою природу, а не бубнит её:
      // 42 → 135 секунд, и только если черта выражена заметно (0.22 —
      // это чуть выше ровного фона шести осей).
      if (t - this.lastTraitLine > 135) {
        var d = dna.dominant();
        if (dna.get(d) > 0.3) {
          G.Voice.say(d);
          this.lastTraitLine = t;
        }
      }

      // Второй рот: наблюдение. Первый говорит о событиях мира — прилив,
      // закон, существо. Этот говорит о человеке: не «что случилось», а
      // «каков ты». Игра смотрит на повадку и называет её вслух — редко,
      // не чаще раза в две минуты, и только когда повадка отчётлива.
      this._watchT += dt;
      if (this._watchT > 22 && t - this._lastWatch > 95 && game.state === "play" && !game.sky) {
        this._watchT = 0;
        var seen = this.read(game);
        if (seen) {
          this._lastWatch = t;
          G.Voice.say(seen);
        }
      }

      // Пульс — двойное касание. Подсказка о нём висит шесть секунд после
      // рождения и умирает, и человек доходит до седьмого берега, ни разу
      // не пульсовав (отчёт 2.3: пульсов 0 при 18 тронутых законах) — а без
      // пульса нет ни боя, ни законов, ни финала. Игра замечает это вслух
      // ОДИН раз, и только когда жест впервые по-настоящему нужен: рядом
      // голодная рана или босс. Не меню-туториал — существо, которое видит,
      // что ты не знаешь жеста, и называет его, как называет остывший узел.
      if (!this._pulseTold && dna.pulses === 0 && dna.age > 90 &&
          game.state === "play") {
        var nearWound = false;
        for (var wI = 0; wI < game.world.wounds.length; wI++) {
          if (G.dist(p.x, p.y, game.world.wounds[wI].x, game.world.wounds[wI].y) < 140) nearWound = true;
        }
        var nearBoss = game.world.boss &&
          G.dist(p.x, p.y, game.world.boss.x, game.world.boss.y) < 260;
        if (nearWound || nearBoss) {
          this._pulseTold = true;
          G.Voice.say("pulseHint");
        }
      }

      // Фон говорит редко. Без троттлинга эти двое срабатывали броском
      // кубика каждый кадр и давали до полусотни реплик за сессию: Игра
      // комментировала каждый шаг и превращалась в болтуна. Тишина
      // важнее — пусть заметит, что человек сидит, раз в минуту, а не
      // каждые семь секунд.
      // Тот, кто просто сидит, слышал «ты сидишь» уже двадцать раз за
      // сессию: в тишине этой реплике нечего уступать, и она срабатывает
      // ровно по кулдауну. Пусть замечает посадку вчетверо реже — а на
      // долгую неподвижность отвечает idle, у которого есть что сказать.
      if (p.stillT > 7 && t - this._sitSaid > 240 && G.chance(dt * 0.15)) {
        this._sitSaid = t;
        G.Voice.say("sit");
      }
      if (p.moveT > 9 && t - this._wanderSaid > 75 && G.chance(dt * 0.08)) {
        this._wanderSaid = t;
        G.Voice.say("wander");
      }

      if (dna.age > 180 && G.chance(dt * 0.01)) G.Voice.say("longPlay");

      // Третий рот: тишина. Пул `idle` («я ещё здесь», «можно ничего не
      // делать») был написан к самому первому берегу и не звучал НИ РАЗУ —
      // его никто не звал. Это самый тихий голос Игры, и место ему не в
      // ряду с «ты сидишь» (та говорит уже через 7 секунд покоя), а
      // глубже: когда человек не двигается почти минуту и ничего не
      // трогает. Не «я вижу, что ты сидишь», а «я здесь, пока ты молчишь».
      // Раз в четыре минуты, не чаще.
      // lastTap — игровые секунды (engine.js:229), не миллисекунды.
      var quiet = t - (game.input.lastTap || 0);
      if (p.stillT > 50 && quiet > 40 && t - this._idleSaid > 240 &&
          game.state === "play" && !game.sky && G.chance(dt * 0.2)) {
        this._idleSaid = t;
        G.Voice.say("idle");
      }

      // metamorphosis when DNA has shifted enough or time passed
      // Перерождение — крупнейшее событие игры: берег стирается, камера
      // отъезжает на четыре секунды, рука теряет цель. Оно должно быть
      // редким. В отчёте с телефона — ТРИ берега за 1.3 минуты: человек
      // сеет быстро (55 узлов), ДНК прыгает, и «сдвиг» запускал смену
      // кожи каждые полторы минуты, а то и чаще. Игра почти не выходила
      // из перерождения, и всё это время экран был отдалён — отсюда
      // «после отдаления начинает срываться».
      //
      // Первый берег живёт дольше прочих: человеку надо хотя бы раз
      // увидеть, как сад растёт, прежде чем его унесут.
      var since = t - this.lastMeta;
      var young = game.world.meta === 0;
      // Числа выверены замером: при 240/180 берег беднел (15 живых узлов
      // через час вместо 28) — метаморфоза оказалась главным поставщиком
      // свежих сгустков, она засевает новый берег целиком. Держим её
      // прежний ритм, но даём первому берегу дожить до трёх минут:
      // именно там человек и тонул в постоянном отдалении.
      // Зрелость меряем ГЛУБИНОЙ, а не суммой. Пока ДНК копилась, сумма
      // росла безостановочно и порог 1.8 брался сам собой. Теперь портрет
      // дышит: оси осыпаются друг об друга, сумма стабилизируется около
      // 1.4 — и перерождение не наступало НИ РАЗУ за полчаса, берег
      // вымирал (10 узлов вместо 28). Спрашиваем то, что и значит
      // «человек прочитан»: есть ли у него выраженная черта.
      var deep = 0;
      for (var di = 0; di < G.TRAITS.length; di++) {
        var dv = dna.get(G.TRAITS[di]);
        if (dv > deep) deep = dv;
      }
      var ripe = since > (young ? 190 : 165) && deep > 0.6;
      var surge = since > (young ? 165 : 90) && this._shift(game) > 0.55;
      if ((ripe || surge) && game.state === "play") {
        this.lastMeta = t;
        game.beginMeta();
      }

      // spawn wounds if combat organ is growing and world is too peaceful
      if (
        this.organs.combat > 0.35 &&
        game.world.wounds.length < 1 + this.organs.combat * 3 * G.Memory.climate().wounds &&
        G.chance(dt * 0.06 * this.organs.combat * G.Memory.climate().wounds)
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
      if (G.Haptic) G.Haptic.play("pulse");

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
      this._born++;
      var map = {
        relic: "curiosity",
        thorn: "aggression",
        // Раньше здесь стоял "sit" — фоновая реплика про то, что человек
        // сидит без дела. Рождение узла тишины сообщением "в тебе много
        // несделанного" звучало как упрёк вместо поздравления, и вдобавок
        // сбивало счётчик фоновой болтовни. У тишины теперь свой голос.
        still: "stillBorn",
        echo: "kind",
        shard: "glitch",
        tone: "music",
        spark: "firstNode"
      };
      // Первую встречу с породой Игра приветствует, дальше молчит.
      // Раньше говорила на КАЖДОЕ рождение: сеятель делал две сотни узлов
      // и получал две сотни реплик — восторг превращался в бубнёж, и на
      // фоне этого шума терялись редкие важные слова. Узнавание бывает
      // один раз; потом это просто твоя работа, и она в комментариях
      // не нуждается.
      this._greeted = this._greeted || {};
      if (!this._greeted[kind]) {
        this._greeted[kind] = 1;
        G.Voice.say(map[kind] || "firstNode");
      }
      if (kind === "still" && game.world.verses.length) {
        var v = game.world.verses[game.world.verses.length - 1];
        setTimeout(function () {
          G.Voice.sayText(G.verseText(v), true);
        }, 2200);
      }
      // milestones: the shore must say "you achieved" out loud
      // Вехи кончались на двадцати — а человек за одну сессию вырастил
      // 141 узел и сказал: «захотелось выйти, так как ничего нового».
      // Три четверти игры мир молчал о том, что человек делает. И два
      // органа он не открыл ВООБЩЕ: небо (память отпущенного) и сигилу
      // (его собственное лицо) — про них никто не говорит, а сами по
      // себе кнопки в углу ничего не обещают. Дальние вехи их называют.
      var MILESTONES = { 5: "ms5", 10: "ms10", 20: "ms20",
                         40: "ms40", 70: "ms70", 120: "ms120" };
      var msKey = MILESTONES[game.world.discovered];
      if (msKey) {
        setTimeout(function () {
          G.Voice.say(msKey, true);
        }, 2600);
      }
    }
  };
})(IGRA);
